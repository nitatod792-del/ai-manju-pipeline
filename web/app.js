var STAGE_LABELS = {
  "01_input_script": "1. 文本输入",
  "02_extracted_assets": "2. 资产抽取",
  "03_prompts": "3. 提示词",
  "04_images": "4. 图片资产",
  "05_storyboard": "5. 分镜脚本",
  "06_video_clips": "6. 镜头视频",
  "07_final_edit": "7. 成片",
};

var LOCAL_UPLOADS_KEY = "ai_manju_uploads_v1";

function stageLine(key, val) {
  var status = val.done ? "已产出" : "待产出";
  var cls = val.done ? "ok" : "todo";
  return '<div class="stage"><span>' + (STAGE_LABELS[key] || key) + '</span><span class="' + cls + '">' + status + ' (' + val.count + ')</span></div>';
}

function card(project) {
  var keys = Object.keys(project.stages || {});
  var stageHtml = keys.map(function (k) { return stageLine(k, project.stages[k]); }).join("");
  return '' +
    '<article class="card">' +
    '  <div class="title">' +
    '    <strong>' + project.project_name + '</strong>' +
    '    <span class="badge">风格: ' + project.style + '</span>' +
    '  </div>' +
    '  <div class="kv">项目ID: ' + project.project_id + ' | 数字资产: ' + project.total_assets + '</div>' +
       stageHtml +
    '</article>';
}

function getUploads() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_UPLOADS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function setUploads(items) {
  localStorage.setItem(LOCAL_UPLOADS_KEY, JSON.stringify(items));
}

function renderUploads() {
  var items = getUploads();
  var el = document.getElementById("uploads");
  if (!items.length) {
    el.innerHTML = '<p class="muted small">暂无上传记录</p>';
    return;
  }
  var html = items.slice().reverse().map(function (x) {
    var source = x.mode === "paste" ? "粘贴文本" : "上传文件";
    var link = './project.html?recordId=' + encodeURIComponent(x.recordId || "");
    return '<div class="upload-item"><div><strong>' + x.scriptTitle + '</strong> | 项目: ' + x.projectName + ' (' + x.projectId + ') | 风格: ' + x.style + ' | 来源: ' + source + ' | 文件: ' + x.fileName + ' | 时间: ' + x.createdAt + '</div><div class="actions"><button class="mini-btn" data-link="' + link + '">进入项目</button></div></div>';
  }).join("");
  el.innerHTML = html;
  var btns = el.querySelectorAll('.mini-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function (e) {
      var link = e.currentTarget.getAttribute('data-link');
      if (link) window.location.href = link;
    });
  }
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "project";
}

function guessTitleFromText(text) {
  var lines = String(text || "").split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
  if (!lines.length) return "未命名剧本";
  var first = lines[0].replace(/^#+\s*/, "");
  return first.slice(0, 30) || "未命名剧本";
}

function inferAndFill(meta, text, fileName) {
  var titleGuess = guessTitleFromText(text);
  var now = new Date();
  var d = String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
  if (!meta.scriptTitle || meta.scriptTitle === "未命名剧本") meta.scriptTitle = titleGuess;
  if (!meta.projectName || meta.projectName === meta.projectId) meta.projectName = titleGuess.slice(0, 20) + "项目";
  if (!meta.projectId) {
    var fromFile = String(fileName || "").replace(/\.[^.]+$/, "");
    var seed = fromFile || titleGuess;
    meta.projectId = slugify(seed) + "-" + d;
  }
  if (!meta.style || meta.style === "默认风格") meta.style = "默认风格";
  document.getElementById("projectId").value = meta.projectId;
  document.getElementById("projectName").value = meta.projectName;
  document.getElementById("projectStyle").value = meta.style;
  document.getElementById("scriptTitle").value = meta.scriptTitle;
  return meta;
}

function commonMeta() {
  return {
    projectId: (document.getElementById("projectId").value || "").trim(),
    projectName: (document.getElementById("projectName").value || "").trim(),
    style: (document.getElementById("projectStyle").value || "").trim() || "默认风格",
    scriptTitle: (document.getElementById("scriptTitle").value || "").trim() || "未命名剧本",
  };
}

function pushUpload(record) {
  var uploads = getUploads();
  record.createdAt = new Date().toLocaleString();
  record.recordId = "rec-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
  if (!record.projectId) record.projectId = record.recordId;
  if (!record.projectName) record.projectName = record.scriptTitle + "项目";
  uploads.push(record);
  setUploads(uploads);
  renderUploads();
}

function readFileCompat(file, onOk, onErr) {
  if (file && typeof file.text === "function") return file.text().then(onOk).catch(onErr);
  var reader = new FileReader();
  reader.onload = function () { onOk(String(reader.result || "")); };
  reader.onerror = function () { onErr(new Error("文件读取失败")); };
  reader.readAsText(file, "utf-8");
}

function setMsg(text, cls) {
  var msg = document.getElementById("uploadMsg");
  msg.textContent = text;
  msg.className = "small " + cls;
}

function bindUploader() {
  var fileBtn = document.getElementById("uploadBtn");
  var pasteBtn = document.getElementById("pasteBtn");
  var fileInput = document.getElementById("scriptFile");
  var textInput = document.getElementById("scriptText");

  fileBtn.addEventListener("click", function () {
    var meta = commonMeta();
    if (!fileInput.files || !fileInput.files[0]) return setMsg("请先选择剧本文件（txt/md）", "todo");
    var file = fileInput.files[0];
    readFileCompat(file, function (text) {
      meta = inferAndFill(meta, text, file.name);
      pushUpload({ mode: "file", projectId: meta.projectId, projectName: meta.projectName, style: meta.style, scriptTitle: meta.scriptTitle, fileName: file.name, fileSize: file.size, contentPreview: String(text || "").slice(0, 300) });
      setMsg("文件上传成功：已自动回填信息并记录到本地浏览器。", "ok");
    }, function () { setMsg("文件读取失败，请重试或改用粘贴文本。", "todo"); });
  });

  pasteBtn.addEventListener("click", function () {
    var meta = commonMeta();
    var text = (textInput.value || "").trim();
    if (!text) return setMsg("请先粘贴剧本文本", "todo");
    meta = inferAndFill(meta, text, "pasted-text");
    pushUpload({ mode: "paste", projectId: meta.projectId, projectName: meta.projectName, style: meta.style, scriptTitle: meta.scriptTitle, fileName: "pasted-text.txt", fileSize: text.length, contentPreview: text.slice(0, 300) });
    setMsg("粘贴文本已自动回填信息并保存记录。", "ok");
  });
}

function loadDashboard() {
  fetch("../dashboard/projects-index.json", { cache: "no-store" })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      document.getElementById("meta").textContent = "项目数: " + data.project_count + " | 数据更新时间: " + data.generated_at;
      var cards = (data.projects || []).map(card).join("");
      document.getElementById("cards").innerHTML = cards || "<p>暂无项目数据</p>";
    })
    .catch(function () {
      document.getElementById("meta").textContent = "项目数据加载失败（不影响上传剧本）";
      document.getElementById("cards").innerHTML = "<p class='muted small'>看板数据暂不可用，你仍可先上传剧本。</p>";
    });
}

function run() {
  bindUploader();
  renderUploads();
  loadDashboard();
}

run();
