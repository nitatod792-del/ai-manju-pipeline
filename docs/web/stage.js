var LOCAL_UPLOADS_KEY = "ai_manju_uploads_v1";
var STAGE_LABELS = {
  "01_input_script": "1. 文本输入",
  "02_extracted_assets": "2. 资产抽取",
  "03_prompts": "3. 提示词",
  "04_images": "4. 图片资产",
  "05_storyboard": "5. 分镜脚本",
  "06_video_clips": "6. 镜头视频",
  "07_final_edit": "7. 成片",
};

function getUploads() {
  try { return JSON.parse(localStorage.getItem(LOCAL_UPLOADS_KEY) || "[]"); }
  catch (e) { return []; }
}

function getParam(name) {
  var url = new URL(window.location.href);
  return (url.searchParams.get(name) || "").trim();
}

function run() {
  var recordId = getParam("recordId");
  var stage = getParam("stage");
  document.getElementById("backProject").href = "./project.html?recordId=" + encodeURIComponent(recordId);

  var all = getUploads();
  var record = all.find(function (x) { return (x.recordId || "") === recordId; });
  if (!record) {
    document.getElementById("meta").textContent = "未找到项目记录，请返回重试。";
    return;
  }

  var label = STAGE_LABELS[stage] || stage;
  document.getElementById("title").textContent = (record.projectName || "项目") + " - " + label;
  document.getElementById("meta").textContent = "项目ID: " + (record.projectId || "") + " | 阶段: " + label;

  var list = document.getElementById("list");
  if (stage === "01_input_script") {
    list.innerHTML = '<div class="upload-item"><strong>' + (record.scriptTitle || "未命名") + '</strong><br/>来源: ' + (record.mode === "paste" ? "粘贴文本" : "上传文件") + ' | 文件: ' + (record.fileName || "") + ' | 时间: ' + (record.createdAt || "") + '<br/><span class="muted small">预览：' + (record.contentPreview || "").replace(/</g, "&lt;") + '</span></div>';
  } else {
    list.innerHTML = '<p class="muted small">该阶段当前还没有产出列表，后续会自动沉淀到这里。</p>';
  }
}

run();
