#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import re
from pathlib import Path

STAGES = [
    "01_input_script",
    "02_extracted_assets",
    "03_prompts",
    "04_images",
    "05_storyboard",
    "06_video_clips",
    "07_final_edit",
    "08_logs",
]

DIALOGUE_HINTS = (
    "\"",
    "\u201c",
    "\u201d",
    "\u300c",
    "\u300d",
    "\u300e",
    "\u300f",
    "\u2014",
    "\u2015",
)


def now_ts() -> str:
    return dt.datetime.now().strftime("%Y%m%d-%H%M%S")


def ensure_project(root: Path, project_id: str) -> Path:
    project_dir = root / "projects" / project_id
    for stage in STAGES:
        (project_dir / stage).mkdir(parents=True, exist_ok=True)

    meta_path = project_dir / "meta" / "project.json"
    meta_path.parent.mkdir(parents=True, exist_ok=True)
    if meta_path.exists():
        try:
            payload = json.loads(meta_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            payload = {}
    else:
        payload = {"project_id": project_id, "project_name": project_id, "style": "unknown"}
    payload["updated_at"] = dt.datetime.now().isoformat(timespec="seconds")
    payload.setdefault("created_at", payload["updated_at"])
    meta_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return project_dir


def split_paragraphs(text: str) -> list[str]:
    lines = [line.strip() for line in text.splitlines()]
    paragraphs = []
    buffer = []
    for line in lines:
        if not line:
            if buffer:
                paragraphs.append(" ".join(buffer).strip())
                buffer = []
            continue
        buffer.append(line)
    if buffer:
        paragraphs.append(" ".join(buffer).strip())
    return [p for p in paragraphs if p]


def is_dialogue(paragraph: str) -> bool:
    if paragraph.startswith(("-", "\u2014", "\u2015")):
        return True
    return any(h in paragraph for h in DIALOGUE_HINTS)


def infer_camera(paragraph: str, dialogue_ratio: float) -> str:
    if dialogue_ratio >= 0.5:
        return "中近景对话，双人来回切"
    if len(paragraph) > 90:
        return "中景推进，结尾给特写"
    return "中景建立，补一个环境远景"


def build_scenes(paragraphs: list[str], chunk_size: int) -> list[dict]:
    scenes = []
    for i in range(0, len(paragraphs), chunk_size):
        chunk = paragraphs[i : i + chunk_size]
        dialogues = [p for p in chunk if is_dialogue(p)]
        narration = [p for p in chunk if not is_dialogue(p)]
        lead = (chunk[0][:32] + "...") if len(chunk[0]) > 32 else chunk[0]
        dialogue_ratio = len(dialogues) / max(len(chunk), 1)
        scene = {
            "scene_no": len(scenes) + 1,
            "headline": f"场景{len(scenes)+1}：{lead}",
            "goal": "推动冲突并释放一个新信息点",
            "narration": narration,
            "dialogue": dialogues,
            "camera": infer_camera(" ".join(chunk), dialogue_ratio),
            "sfx": "环境底噪 + 关键动作拟音",
            "duration_sec": max(8, min(24, 6 + len(chunk) * 4)),
        }
        scenes.append(scene)
    return scenes


def render_markdown(episode_title: str, source_name: str, scenes: list[dict]) -> str:
    lines = [
        f"# 漫剧改编稿 - {episode_title}",
        "",
        f"- 生成时间: {dt.datetime.now().isoformat(timespec='seconds')}",
        f"- 来源文件: {source_name}",
        f"- 场景数: {len(scenes)}",
        "",
        "## 改编原则",
        "",
        "1. 每个场景只推进一个核心冲突，避免信息堆叠。",
        "2. 台词优先口语化，旁白只保留必要信息。",
        "3. 每场预留镜头建议，方便后续分镜和生视频。",
        "",
        "## 场景拆解",
        "",
    ]

    for scene in scenes:
        lines.extend(
            [
                f"### 场景 {scene['scene_no']} - {scene['headline']}",
                "",
                f"- 场景目标: {scene['goal']}",
                f"- 建议时长: {scene['duration_sec']} 秒",
                f"- 镜头建议: {scene['camera']}",
                f"- 音效建议: {scene['sfx']}",
                "",
                "**动作/旁白**",
            ]
        )
        if scene["narration"]:
            lines.extend([f"- {n}" for n in scene["narration"]])
        else:
            lines.append("- (无，直接进入对白)")

        lines.extend(["", "**对白**"])
        if scene["dialogue"]:
            lines.extend([f"- {d}" for d in scene["dialogue"]])
        else:
            lines.append("- (本场以动作叙事为主)")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Adapt novel/script text into reusable manju episode draft")
    parser.add_argument("--project-root", default=".", help="Root path, e.g. output/novel-to-ai-manju")
    parser.add_argument("--project-id", required=True, help="Project key, e.g. city-legend-s1")
    parser.add_argument("--source", required=True, help="Source text file path (.txt/.md)")
    parser.add_argument("--episode-title", default="未命名章节", help="Episode title for output")
    parser.add_argument("--chunk-size", type=int, default=4, help="Paragraphs per scene, default 4")
    args = parser.parse_args()

    if args.chunk_size < 2:
        raise SystemExit("chunk-size must be >= 2")

    root = Path(args.project_root).resolve()
    source = Path(args.source).resolve()
    if not source.exists() or source.suffix.lower() not in {".txt", ".md"}:
        raise SystemExit("source must be an existing .txt/.md file")

    project_dir = ensure_project(root, args.project_id)
    text = source.read_text(encoding="utf-8")
    paragraphs = split_paragraphs(text)
    if not paragraphs:
        raise SystemExit("source has no valid paragraphs")

    scenes = build_scenes(paragraphs, args.chunk_size)
    ts = now_ts()

    storyboard_dir = project_dir / "05_storyboard"
    out_md = storyboard_dir / f"{ts}-adapted-script.md"
    out_json = storyboard_dir / f"{ts}-adapted-script.json"
    out_md.write_text(render_markdown(args.episode_title, source.name, scenes), encoding="utf-8")

    payload = {
        "id": ts,
        "project_id": args.project_id,
        "episode_title": args.episode_title,
        "source_file": str(source),
        "scene_count": len(scenes),
        "chunk_size": args.chunk_size,
        "output_markdown": str(out_md),
        "output_json": str(out_json),
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "stage": "05_storyboard",
        "scenes": scenes,
    }
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    log_path = project_dir / "08_logs" / "adapt-script-log.jsonl"
    with log_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")

    print("[ok] adaptation finished")
    print(f"- markdown: {out_md}")
    print(f"- json: {out_json}")
    print(f"- log: {log_path}")


if __name__ == "__main__":
    main()
