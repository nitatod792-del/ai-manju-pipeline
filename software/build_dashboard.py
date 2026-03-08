#!/usr/bin/env python3
import datetime as dt
import json
from pathlib import Path

STAGES = [
    "01_input_script",
    "02_extracted_assets",
    "03_prompts",
    "04_images",
    "05_storyboard",
    "06_video_clips",
    "07_final_edit",
]


def count_assets(stage_dir: Path) -> int:
    if not stage_dir.exists():
        return 0
    return sum(1 for p in stage_dir.rglob("*") if p.is_file())


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    projects_dir = root / "projects"
    dashboard_dir = root / "dashboard"
    dashboard_dir.mkdir(parents=True, exist_ok=True)

    projects = []
    for project_dir in sorted(projects_dir.glob("*")):
        if not project_dir.is_dir():
            continue
        meta = load_json(project_dir / "meta" / "project.json")
        if not meta:
            continue

        stages = {}
        for stage in STAGES:
            c = count_assets(project_dir / stage)
            stages[stage] = {
                "count": c,
                "done": c > 0,
            }

        projects.append(
            {
                "project_id": meta.get("project_id", project_dir.name),
                "project_name": meta.get("project_name", project_dir.name),
                "style": meta.get("style", "unknown"),
                "created_at": meta.get("created_at", ""),
                "updated_at": meta.get("updated_at", ""),
                "stages": stages,
                "total_assets": sum(s["count"] for s in stages.values()),
            }
        )

    payload = {
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "project_count": len(projects),
        "projects": projects,
    }
    out = dashboard_dir / "projects-index.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ok] wrote: {out}")


if __name__ == "__main__":
    main()
