const STAGE_LABELS = {
  "01_input_script": "1. 文本输入",
  "02_extracted_assets": "2. 资产抽取",
  "03_prompts": "3. 提示词",
  "04_images": "4. 图片资产",
  "05_storyboard": "5. 分镜脚本",
  "06_video_clips": "6. 镜头视频",
  "07_final_edit": "7. 成片",
};

const LOCAL_UPLOADS_KEY = "ai_manju_uploads_v1";

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

function getUploads() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_UPLOADS_KEY) || "[]");
  } catch {
    return [];
  }
}

function setUploads(items) {
  localStorage.setItem(LOCAL_UPLOADS_KEY, JSON.stringify(items));
}

function renderUploads() {
  const items = getUploads();
  const el = document.getElementById("uploads");
  if (!items.length) {
    el.innerHTML = '<p class="muted small">暂无上传记录</p>';
    return;
  }
  el.innerHTML = items
    .slice()
    .reverse()
    .map(
      (x) => `<div class="upload-item"><strong>${x.scriptTitle}</strong> | 项目: ${x.projectName} (${x.projectId}) | 风格: ${x.style} | 文件: ${x.fileName} | 时间: ${x.createdAt}</div>`
    )
    .join("");
}

function bindUploader() {
  const btn = document.getElementById("uploadBtn");
  btn.addEventListener("click", async () => {
    const projectId = (document.getElementById("projectId").value || "").trim();
    const projectName = (document.getElementById("projectName").value || "").trim() || projectId;
    const style = (document.getElementById("projectStyle").value || "").trim() || "默认风格";
    const scriptTitle = (document.getElementById("scriptTitle").value || "").trim() || "未命名剧本";
    const fileInput = document.getElementById("scriptFile");
    const msg = document.getElementById("uploadMsg");

    if (!projectId) {
      msg.textContent = "请先填写项目ID";
      msg.className = "small todo";
      return;
    }
    if (!fileInput.files || !fileInput.files[0]) {
      msg.textContent = "请先选择剧本文件（txt/md）";
      msg.className = "small todo";
      return;
    }

    const file = fileInput.files[0];
    const text = await file.text();
    const uploads = getUploads();
    uploads.push({
      projectId,
      projectName,
      style,
      scriptTitle,
      fileName: file.name,
      fileSize: file.size,
      contentPreview: text.slice(0, 300),
      createdAt: new Date().toLocaleString(),
    });
    setUploads(uploads);
    renderUploads();

    msg.textContent = "上传成功：已记录到本地浏览器。下一步可把剧本内容发给助手进入自动化流水线。";
    msg.className = "small ok";
  });
}

async function run() {
  const res = await fetch("../dashboard/projects-index.json", { cache: "no-store" });
  const data = await res.json();
  document.getElementById("meta").textContent = `项目数: ${data.project_count} | 数据更新时间: ${data.generated_at}`;
  document.getElementById("cards").innerHTML = data.projects.map(card).join("") || "<p>暂无项目数据</p>";
  bindUploader();
  renderUploads();
}

run().catch((err) => {
  document.getElementById("meta").textContent = `加载失败: ${err.message}`;
});
