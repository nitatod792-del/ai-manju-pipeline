#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import re
from collections import Counter
from pathlib import Path

SCENE_HINTS = ["场景", "地点", "INT", "EXT", "内", "外", "夜", "日", "办公室", "街道", "房间", "教室", "医院", "咖啡馆", "车站", "客厅"]
PROP_KEYWORDS = [
    "手机", "电脑", "笔记本", "钥匙", "门卡", "手枪", "刀", "书", "信", "照片", "录音笔", "行李箱", "背包", "车", "雨伞", "杯子", "药瓶", "合同", "文件",
]


def now_ts() -> str:
    return dt.datetime.now().strftime("%Y%m%d-%H%M%S")


def read_latest_input(project_dir: Path) -> Path:
    input_dir = project_dir / "01_input_script"
    files = sorted([p for p in input_dir.glob("*") if p.is_file() and p.suffix.lower() in {".txt", ".md"}])
    if not files:
        raise SystemExit(f"no script files in {input_dir}")
    return files[-1]


def split_lines(text: str):
    return [x.strip() for x in text.splitlines() if x.strip()]


def extract_scenes(lines):
    scenes = []
    for ln in lines:
        if any(k in ln for k in SCENE_HINTS) and len(ln) <= 60:
            scenes.append(ln)
        elif re.match(r"^[【\[].+[】\]]$", ln) and len(ln) <= 60:
            scenes.append(ln)
    # de-dup
    seen = set()
    out = []
    for s in scenes:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out[:30]


def extract_characters(text: str):
    # crude Chinese-name extraction: 2-4 chars, frequently repeated, exclude common words
    cands = re.findall(r"[\u4e00-\u9fa5]{2,4}", text)
    stop = {"然后", "如果", "这个", "那个", "他们", "我们", "你们", "自己", "时候", "项目", "阶段", "内容", "场景", "人物", "道具", "上传", "文本", "剧本", "今天", "昨天"}
    freq = Counter([c for c in cands if c not in stop])
    # keep names with moderate frequency
    names = [k for k, v in freq.items() if v >= 2][:30]
    return names


def extract_props(text: str):
    props = []
    for p in PROP_KEYWORDS:
        n = text.count(p)
        if n > 0:
            props.append((p, n))
    props.sort(key=lambda x: x[1], reverse=True)
    return [x[0] for x in props[:30]]


def build_llm_prompt(script_text: str) -> str:
    return (
        "你是漫剧资产抽取助手。请从以下剧本文本中抽取三类资产：人物、场景、主要道具。\n"
        "要求：\n"
        "1) 人物：给出名称、身份/年龄段、性格关键词、外观关键词（可为空）\n"
        "2) 场景：给出场景名、时间(昼/夜)、空间类型(室内/室外)、描述\n"
        "3) 道具：给出道具名、归属人物(可空)、出现用途\n"
        "4) 输出必须是 JSON，结构为 {characters:[], scenes:[], props:[]}\n\n"
        "剧本文本如下：\n"
        + script_text
    )


def main():
    p = argparse.ArgumentParser(description="Extract scene/character/prop assets from script text")
    p.add_argument("--project-root", default=".", help="root path, e.g. output/novel-to-ai-manju")
    p.add_argument("--project-id", required=True, help="project id under projects/")
    p.add_argument("--source", default="", help="optional script file path; defaults to latest in 01_input_script")
    p.add_argument("--title", default="", help="optional title")
    args = p.parse_args()

    root = Path(args.project_root).resolve()
    project_dir = root / "projects" / args.project_id
    out_dir = project_dir / "02_extracted_assets"
    log_dir = project_dir / "08_logs"
    out_dir.mkdir(parents=True, exist_ok=True)
    log_dir.mkdir(parents=True, exist_ok=True)

    source = Path(args.source).resolve() if args.source else read_latest_input(project_dir)
    if not source.exists():
        raise SystemExit(f"source not found: {source}")

    text = source.read_text(encoding="utf-8", errors="ignore")
    lines = split_lines(text)
    ts = now_ts()

    result = {
        "id": ts,
        "project_id": args.project_id,
        "title": args.title or source.stem,
        "source_file": str(source),
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "method": "rule-based-v1 + llm-prompt-template",
        "characters": [{"name": x} for x in extract_characters(text)],
        "scenes": [{"name": x} for x in extract_scenes(lines)],
        "props": [{"name": x} for x in extract_props(text)],
    }

    json_path = out_dir / f"{ts}-assets.json"
    md_path = out_dir / f"{ts}-assets.md"
    prompt_path = out_dir / f"{ts}-llm-prompt.txt"

    json_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    md = [
        f"# 资产抽取结果 - {result['title']}",
        "",
        f"- 项目ID: {args.project_id}",
        f"- 来源: {source}",
        f"- 生成时间: {result['generated_at']}",
        "",
        "## 人物",
    ]
    md += [f"- {x['name']}" for x in result["characters"]] or ["- （空）"]
    md += ["", "## 场景"]
    md += [f"- {x['name']}" for x in result["scenes"]] or ["- （空）"]
    md += ["", "## 主要道具"]
    md += [f"- {x['name']}" for x in result["props"]] or ["- （空）"]
    md_path.write_text("\n".join(md), encoding="utf-8")

    prompt_path.write_text(build_llm_prompt(text[:12000]), encoding="utf-8")

    log = {
        "id": ts,
        "task": "extract_assets",
        "project_id": args.project_id,
        "source_file": str(source),
        "json": str(json_path),
        "md": str(md_path),
        "prompt": str(prompt_path),
        "at": dt.datetime.now().isoformat(timespec="seconds"),
    }
    with (log_dir / "extract-assets-log.jsonl").open("a", encoding="utf-8") as f:
        f.write(json.dumps(log, ensure_ascii=False) + "\n")

    print("[ok] asset extraction finished")
    print(f"- json: {json_path}")
    print(f"- md: {md_path}")
    print(f"- llm prompt: {prompt_path}")


if __name__ == "__main__":
    main()
