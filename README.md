# 小说改编AI漫剧小程序项目

## 已归档文档

- 需求文档：`requirements/2026-03-09-ai-manju-requirements-v1.md`

## 项目制与风格化（已支持）

现在按“一个剧本 = 一个项目”管理，每个项目可单独设置风格。

项目目录结构：

- `projects/<project_id>/01_input_script/`
- `projects/<project_id>/02_extracted_assets/`
- `projects/<project_id>/03_prompts/`
- `projects/<project_id>/04_images/`
- `projects/<project_id>/05_storyboard/`
- `projects/<project_id>/06_video_clips/`
- `projects/<project_id>/07_final_edit/`
- `projects/<project_id>/08_logs/`
- `projects/<project_id>/meta/project.json`

## 第1步：接收文本（已落地）

脚本：`software/intake_text.py`

支持：`.txt` / `.md`

示例：

```bash
python3 output/novel-to-ai-manju/software/intake_text.py \
  --project-root output/novel-to-ai-manju \
  --project-id my-novel-001 \
  --project-name "我的第一部漫剧" \
  --style "国风写实" \
  --source /path/to/script.txt \
  --title "第一集" \
  --copyright licensed \
  --note "来源：已授权"
```

执行结果：

- 原文复制到 `projects/<project_id>/01_input_script/`
- 自动生成 `*-metadata.json`
- 追加写入 `projects/<project_id>/08_logs/intake-log.jsonl`

## Web看板（已落地）

用途：展示项目情况、数字资产数量、每一步产出状态。

- 数据构建脚本：`software/build_dashboard.py`
- 页面：`web/index.html`
- 页面数据：`dashboard/projects-index.json`

先更新数据，再打开页面：

```bash
python3 output/novel-to-ai-manju/software/build_dashboard.py
```

## 外网发布（GitHub Pages）

已准备导出脚本：`software/export_site.py`

```bash
python3 output/novel-to-ai-manju/software/export_site.py
```

导出目录：`site/`（包含 `web/` 和 `dashboard/`）

GitHub Pages入口文件：

- `site/web/index.html`

## 自动任务

- 每小时推进：持续做系统落地
- 每2小时汇报：自动发送阶段进展
- 每日7点汇总：自动发送日报
