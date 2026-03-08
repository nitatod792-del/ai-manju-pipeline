const STAGE_LABELS = {
  "01_input_script": "1. 文本输入",
  "02_extracted_assets": "2. 资产抽取",
  "03_prompts": "3. 提示词",
  "04_images": "4. 图片资产",
  "05_storyboard": "5. 分镜脚本",
  "06_video_clips": "6. 镜头视频",
  "07_final_edit": "7. 成片",
};

function stageLine(key, val) {
  const status = val.done ? "已产出" : "待产出";
  const cls = val.done ? "ok" : "todo";
  return `<div class="stage"><span>${STAGE_LABELS[key] || key}</span><span class="${cls}">${status} (${val.count})</span></div>`;
}

function card(project) {
  const stageHtml = Object.entries(project.stages).map(([k, v]) => stageLine(k, v)).join("");
  return `
    <article class="card">
      <div class="title">
        <strong>${project.project_name}</strong>
        <span class="badge">风格: ${project.style}</span>
      </div>
      <div class="kv">项目ID: ${project.project_id} | 数字资产: ${project.total_assets}</div>
      ${stageHtml}
    </article>
  `;
}

async function run() {
  const res = await fetch("../dashboard/projects-index.json", { cache: "no-store" });
  const data = await res.json();
  document.getElementById("meta").textContent = `项目数: ${data.project_count} | 数据更新时间: ${data.generated_at}`;
  document.getElementById("cards").innerHTML = data.projects.map(card).join("") || "<p>暂无项目数据</p>";
}

run().catch((err) => {
  document.getElementById("meta").textContent = `加载失败: ${err.message}`;
});
