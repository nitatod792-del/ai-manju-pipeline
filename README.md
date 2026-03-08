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

## 第2步：剧本改编（本小时新增）

脚本：`software/adapt_script.py`

支持把小说/剧本文本自动拆成可复用的漫剧改编稿（场景目标、对白、镜头建议、时长建议），并生成结构化 JSON，便于后续分镜/生视频继续加工。

示例：

```bash
python3 output/novel-to-ai-manju/software/adapt_script.py \
  --project-root output/novel-to-ai-manju \
  --project-id my-novel-001 \
  --source /path/to/chapter1.md \
  --episode-title "第1集 夜雨追凶" \
  --chunk-size 4
```

执行结果：

- 产出改编稿：`projects/<project_id>/05_storyboard/*-adapted-script.md`
- 产出结构化数据：`projects/<project_id>/05_storyboard/*-adapted-script.json`
- 追加日志：`projects/<project_id>/08_logs/adapt-script-log.jsonl`

## 外网发布（GitHub Pages）

已准备导出脚本：`software/export_site.py`

```bash
python3 output/novel-to-ai-manju/software/export_site.py
```

导出目录：`site/`（包含 `web/` 和 `dashboard/`）

GitHub Pages入口文件：

- `site/web/index.html`

## 第2步：资产抽取（已落地 v1）

脚本：`software/extract_assets.py`

作用：从剧本文本抽取 `人物 / 场景 / 主要道具`，并产出可继续喂给大模型的标准提示。

示例：

```bash
python3 output/novel-to-ai-manju/software/extract_assets.py \
  --project-root output/novel-to-ai-manju \
  --project-id my-novel-001
```

执行结果（写入 `projects/<project_id>/02_extracted_assets/`）：

- `*-assets.json`：结构化资产
- `*-assets.md`：可读版资产列表
- `*-llm-prompt.txt`：发给大模型的抽取提示文本

日志：`projects/<project_id>/08_logs/extract-assets-log.jsonl`

## 自动任务

- 每小时推进：持续做系统落地
- 每2小时汇报：自动发送阶段进展
- 每日7点汇总：自动发送日报
