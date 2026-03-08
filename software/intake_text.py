#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
import shutil
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


def now_ts() -> str:
    return dt.datetime.now().strftime("%Y%m%d-%H%M%S")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def ensure_project(projects_dir: Path, project_id: str, project_name: str, style: str) -> Path:
    project_dir = projects_dir / project_id
    for stage in STAGES:
        (project_dir / stage).mkdir(parents=True, exist_ok=True)

    meta_dir = project_dir / "meta"
    meta_dir.mkdir(parents=True, exist_ok=True)
    project_meta = {
        "project_id": project_id,
        "project_name": project_name,
        "style": style,
        "updated_at": dt.datetime.now().isoformat(timespec="seconds"),
    }
    project_meta_path = meta_dir / "project.json"
    if project_meta_path.exists():
        try:
            old = json.loads(project_meta_path.read_text(encoding="utf-8"))
            old.update({k: v for k, v in project_meta.items() if v})
            project_meta = old
        except json.JSONDecodeError:
            pass
    else:
        project_meta["created_at"] = project_meta["updated_at"]

    project_meta_path.write_text(json.dumps(project_meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return project_dir


def main() -> None:
    parser = argparse.ArgumentParser(description="Intake novel/script text into per-project stage-1 folder")
    parser.add_argument("--source", required=True, help="Source text file path (.txt/.md)")
    parser.add_argument("--project-root", default=".", help="Root path, e.g. output/novel-to-ai-manju")
    parser.add_argument("--project-id", required=True, help="Project key, e.g. city-legend-s1")
    parser.add_argument("--project-name", default="", help="Display project name")
    parser.add_argument("--style", default="realistic-comic", help="Project visual style")
    parser.add_argument("--title", default="", help="Optional script title")
    parser.add_argument("--copyright", default="unknown", help="ownership|licensed|unknown")
    parser.add_argument("--note", default="", help="Optional note")
    args = parser.parse_args()

    root = Path(args.project_root).resolve()
    source = Path(args.source).resolve()
    projects_dir = root / "projects"

    if not source.exists() or not source.is_file():
        raise SystemExit(f"source file not found: {source}")
    if source.suffix.lower() not in {".txt", ".md"}:
        raise SystemExit("only .txt/.md are supported in step-1")

    project_name = args.project_name or args.project_id
    project_dir = ensure_project(projects_dir, args.project_id, project_name, args.style)

    ts = now_ts()
    input_dir = project_dir / "01_input_script"
    dst = input_dir / f"{ts}-{source.name}"
    shutil.copy2(source, dst)

    stat = dst.stat()
    metadata = {
        "id": ts,
        "project_id": args.project_id,
        "project_name": project_name,
        "style": args.style,
        "title": args.title or source.stem,
        "source_file": str(source),
        "stored_file": str(dst),
        "copyright": args.copyright,
        "note": args.note,
        "size_bytes": stat.st_size,
        "sha256": sha256_file(dst),
        "ingested_at": dt.datetime.now().isoformat(timespec="seconds"),
        "stage": "01_input_script",
    }

    meta_path = input_dir / f"{ts}-metadata.json"
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    log_path = project_dir / "08_logs" / "intake-log.jsonl"
    with log_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(metadata, ensure_ascii=False) + "\n")

    print("[ok] intake finished")
    print(f"- project: {args.project_id} ({project_name})")
    print(f"- style: {args.style}")
    print(f"- file: {dst}")
    print(f"- metadata: {meta_path}")
    print(f"- log: {log_path}")


if __name__ == "__main__":
    main()
