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
    return '<div class="upload-item"><strong>' + x.scriptTitle + '</strong> | 项目: ' + x.projectName + ' (' + x.projectId + ') | 风格: ' + x.style + ' | 来源: ' + source + ' | 文件: ' + x.fileName + ' | 时间: ' + x.createdAt + '</div>';
  }).join("");
  el.innerHTML = html;
}

function commonMeta() {
  var projectId = (document.getElementById("projectId").value || "").trim();
  var projectName = (document.getElementById("projectName").value || "").trim() || projectId;
  var style = (document.getElementById("projectStyle").value || "").trim() || "默认风格";
  var scriptTitle = (document.getElementById("scriptTitle").value || "").trim() || "未命名剧本";
  return {
    projectId: projectId,
    projectName: projectName,
    style: style,
    scriptTitle: scriptTitle,
  };
}

function pushUpload(record) {
  var uploads = getUploads();
  record.createdAt = new Date().toLocaleString();
  uploads.push(record);
  setUploads(uploads);
  renderUploads();
}

function readFileCompat(file, onOk, onErr) {
  if (file && typeof file.text === "function") {
    file.text().then(onOk).catch(onErr);
    return;
  }
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
    if (!meta.projectId) {
      setMsg("请先填写项目ID", "todo");
      return;
    }
    if (!fileInput.files || !fileInput.files[0]) {
      setMsg("请先选择剧本文件（txt/md）", "todo");
      return;
    }
    var file = fileInput.files[0];
    readFileCompat(
      file,
      function (text) {
        pushUpload({
          mode: "file",
          projectId: meta.projectId,
          projectName: meta.projectName,
          style: meta.style,
          scriptTitle: meta.scriptTitle,
          fileName: file.name,
          fileSize: file.size,
          contentPreview: String(text || "").slice(0, 300),
        });
        setMsg("文件上传成功：已记录到本地浏览器。", "ok");
      },
      function () {
        setMsg("文件读取失败，请重试或改用粘贴文本。", "todo");
      }
    );
  });

  pasteBtn.addEventListener("click", function () {
    var meta = commonMeta();
    var text = (textInput.value || "").trim();
    if (!meta.projectId) {
      setMsg("请先填写项目ID", "todo");
      return;
    }
    if (!text) {
      setMsg("请先粘贴剧本文本", "todo");
      return;
    }
    pushUpload({
      mode: "paste",
      projectId: meta.projectId,
      projectName: meta.projectName,
      style: meta.style,
      scriptTitle: meta.scriptTitle,
      fileName: "pasted-text.txt",
      fileSize: text.length,
      contentPreview: text.slice(0, 300),
    });
    setMsg("粘贴文本已保存并记录。", "ok");
  });
}

function loadDashboard() {
  var dataUrl = "../dashboard/projects-index.json";
  fetch(dataUrl, { cache: "no-store" })
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
