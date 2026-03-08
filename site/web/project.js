var LOCAL_UPLOADS_KEY = "ai_manju_uploads_v1";

var STAGES = [
  "1. 文本输入",
  "2. 资产抽取",
  "3. 提示词",
  "4. 图片资产",
  "5. 分镜脚本",
  "6. 镜头视频",
  "7. 成片",
];

function getUploads() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_UPLOADS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function getParam(name) {
  var url = new URL(window.location.href);
  return (url.searchParams.get(name) || "").trim();
}

function renderStages(records) {
  var done = records.length > 0 ? 1 : 0;
  var html = STAGES.map(function (s, i) {
    var ok = i < done;
    var cls = ok ? "ok" : "todo";
    var txt = ok ? "已完成" : "待完成";
    return '<div class="stage"><span>' + s + '</span><span class="' + cls + '">' + txt + '</span></div>';
  }).join("");
  document.getElementById("stages").innerHTML = html;
}

function renderRecords(records) {
  var el = document.getElementById("records");
  if (!records.length) {
    el.innerHTML = '<p class="muted small">当前项目暂无本地记录</p>';
    return;
  }
  el.innerHTML = records
    .slice()
    .reverse()
    .map(function (x) {
      var src = x.mode === "paste" ? "粘贴文本" : "上传文件";
      return '<div class="upload-item"><strong>' + x.scriptTitle + '</strong> | 来源: ' + src + ' | 文件: ' + x.fileName + ' | 时间: ' + x.createdAt + '<br/><span class="muted small">预览：' + (x.contentPreview || "").replace(/</g, "&lt;") + '</span></div>';
    })
    .join("");
}

function run() {
  var projectId = getParam("projectId");
  if (!projectId) {
    document.getElementById("title").textContent = "项目详情（缺少projectId）";
    document.getElementById("meta").textContent = "请从项目记录入口进入。";
    return;
  }
  var all = getUploads();
  var records = all.filter(function (x) { return (x.projectId || "") === projectId; });
  var first = records[0] || {};
  document.getElementById("title").textContent = (first.projectName || projectId) + " - 项目详情";
  document.getElementById("meta").textContent = "项目ID: " + projectId + " | 风格: " + (first.style || "默认风格") + " | 记录数: " + records.length;
  renderStages(records);
  renderRecords(records);
}

run();
