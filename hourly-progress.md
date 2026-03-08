# 小说改编AI漫剧小程序 - 每小时推进记录

## 2026-03-09 06:52 (Asia/Shanghai)

### 1) 本小时关键模块
剧本改编（把原始小说文本转为可复用的漫剧场景稿）

### 2) 本小时完成内容（可落地、可复用）
- 新增自动改编脚本：`output/novel-to-ai-manju/software/adapt_script.py`
  - 输入 `.txt/.md` 小说文本
  - 自动按段落切分场景（可配置 `--chunk-size`）
  - 输出每场的目标、对白/动作拆分、镜头建议、时长建议
  - 同时输出 Markdown + JSON（便于人工编辑与程序继续加工）
  - 自动写入项目日志：`projects/<project_id>/08_logs/adapt-script-log.jsonl`
- 新增可复用示例素材：`output/novel-to-ai-manju/materials/sample-chapter-001.md`
- 完成一次真实跑通验证（demo 项目）：
  - `output/novel-to-ai-manju/projects/demo-night-rain/05_storyboard/20260309-065447-adapted-script.md`
  - `output/novel-to-ai-manju/projects/demo-night-rain/05_storyboard/20260309-065447-adapted-script.json`
- 更新项目说明文档（增加“第2步：剧本改编”用法）：
  - `output/novel-to-ai-manju/README.md`

### 3) 本小时问题
- 当前对白识别为启发式规则（引号/破折号判定），对“无引号内心戏”识别不稳定。
- 场景切分先按固定段落粒度，尚未引入“场景切换词（地点/时间）”的语义断点。
- 角色名尚未结构化抽取，后续分镜阶段还不能直接复用“角色ID”。

### 4) 下一小时计划
- 推进“分镜脚本”模块：
  1. 基于 `*-adapted-script.json` 生成镜头级 shotlist（镜号/景别/机位/时长/台词/画面提示词）
  2. 产出统一模板 `shotlist-schema.json`，作为后续画面生成与生视频的标准输入
  3. 跑通 demo，沉淀一份可直接复用的分镜样例到 `output/novel-to-ai-manju/projects/demo-night-rain/05_storyboard/`
