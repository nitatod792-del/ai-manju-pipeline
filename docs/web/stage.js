var LOCAL_UPLOADS_KEY = "ai_manju_uploads_v1";
var ASSET_KEY = "ai_manju_assets_v1";
var STAGE_LABELS = {
  "01_input_script": "1. 文本输入",
  "02_extracted_assets": "2. 资产抽取",
  "03_prompts": "3. 提示词",
  "04_images": "4. 图片资产",
  "05_storyboard": "5. 分镜脚本",
  "06_video_clips": "6. 镜头视频",
  "07_final_edit": "7. 成片",
};
var PROP_WORDS = ["手机", "电脑", "钥匙", "文件", "合同", "雨伞", "照片", "录音笔", "行李箱", "背包", "车", "手枪", "刀", "杯子"];

function getUploads() {
  try { return JSON.parse(localStorage.getItem(LOCAL_UPLOADS_KEY) || "[]"); }
  catch (e) { return []; }
}

function getAssets() {
  try { return JSON.parse(localStorage.getItem(ASSET_KEY) || "{}"); }
  catch (e) { return {}; }
}

function setAssets(v) {
  localStorage.setItem(ASSET_KEY, JSON.stringify(v));
}

function getParam(name) {
  var url = new URL(window.location.href);
  return (url.searchParams.get(name) || "").trim();
}

function extractAssets(text) {
  var t = String(text || "");
  var lines = t.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
  var scenes = [];
  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i];
    if ((ln.indexOf("【") >= 0 && ln.indexOf("】") >= 0) || ln.indexOf("场景") >= 0 || ln.indexOf("夜") >= 0 || ln.indexOf("日") >= 0) {
      if (ln.length <= 60) scenes.push(ln);
    }
  }
  var chars = (t.match(/[\u4e00-\u9fa5]{2,4}(?=[:：])/g) || []).slice(0, 20);
  var props = [];
  for (var j = 0; j < PROP_WORDS.length; j++) {
    if (t.indexOf(PROP_WORDS[j]) >= 0) props.push(PROP_WORDS[j]);
  }
  return {
    characters: Array.from(new Set(chars)).map(function (x) { return { name: x }; }),
    scenes: Array.from(new Set(scenes)).map(function (x) { return { name: x }; }),
    props: Array.from(new Set(props)).map(function (x) { return { name: x }; }),
    extractedAt: new Date().toLocaleString(),
  };
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
    return;
  }

  if (stage === "02_extracted_assets") {
    var assetsStore = getAssets();
    var existing = assetsStore[recordId];
    var btnHtml = '<div class="actions"><button id="extractBtn" class="mini-btn">从阶段1文本执行资产抽取</button></div>';

    function renderAsset(a) {
      if (!a) {
        list.innerHTML = btnHtml + '<p class="muted small">还没有抽取结果，点击按钮开始抽取（人物/场景/主要道具）。</p>';
        return;
      }
      var c = (a.characters || []).map(function (x) { return '<li>' + x.name + '</li>'; }).join("") || "<li>（空）</li>";
      var s = (a.scenes || []).map(function (x) { return '<li>' + x.name + '</li>'; }).join("") || "<li>（空）</li>";
      var p = (a.props || []).map(function (x) { return '<li>' + x.name + '</li>'; }).join("") || "<li>（空）</li>";
      list.innerHTML = btnHtml +
        '<div class="upload-item"><strong>抽取时间：</strong>' + (a.extractedAt || "") + '</div>' +
        '<div class="upload-item"><strong>人物</strong><ul>' + c + '</ul></div>' +
        '<div class="upload-item"><strong>场景</strong><ul>' + s + '</ul></div>' +
        '<div class="upload-item"><strong>主要道具</strong><ul>' + p + '</ul></div>';
    }

    renderAsset(existing);
    setTimeout(function () {
      var btn = document.getElementById("extractBtn");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var sourceText = record.fullText || record.contentPreview || "";
        var out = extractAssets(sourceText);
        assetsStore[recordId] = out;
        setAssets(assetsStore);
        renderAsset(out);
      });
    }, 0);
    return;
  }

  list.innerHTML = '<p class="muted small">该阶段当前还没有产出列表，后续会自动沉淀到这里。</p>';
}

run();
