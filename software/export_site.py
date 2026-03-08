#!/usr/bin/env python3
import shutil
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    site = root / "site"
    if site.exists():
        shutil.rmtree(site)
    site.mkdir(parents=True, exist_ok=True)

    shutil.copytree(root / "web", site / "web")
    shutil.copytree(root / "dashboard", site / "dashboard")

    readme = site / "README.txt"
    readme.write_text(
        "GitHub Pages entry: web/index.html\n"
        "Make sure dashboard/projects-index.json exists before deploy.\n",
        encoding="utf-8",
    )
    print(f"[ok] exported site to: {site}")


if __name__ == "__main__":
    main()
