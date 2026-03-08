var LOCAL_UPLOADS_KEY = "ai_manju_uploads_v1";
var ASSET_KEY = "ai_manju_assets_v1";
var STAGES = [
  { id: "01_input_script", label: "1. 文本输入" },
  { id: "02_extracted_assets", label: "2. 资产抽取" },
  { id: "03_prompts", label: "3. 提示词" },
  { id: "04_images", label: "4. 图片资产" },
  { id: "05_storyboard", label: "5. 分镜脚本" },
  { id: "06_video_clips", label: "6. 镜头视频" },
  { id: "07_final_edit", label: "7. 成片" },
];

function getUploads() {
  try { return JSON.parse(localStorage.getItem(LOCAL_UPLOADS_KEY) || "[]"); }
  catch (e) { return []; }
}

function getAssets() {
  try { return JSON.parse(localStorage.getItem(ASSET_KEY) || "{}"); }
  catch (e) { return {}; }
}

function getParam(name) {
  var url = new URL(window.location.href);
  return (url.searchParams.get(name) || "").trim();
}

function renderStages(record) {
  var assets = getAssets();
  var hasStage2 = !!assets[record.recordId || ""];
  var html = STAGES.map(function (s, i) {
    var done = (i === 0) || (i === 1 && hasStage2);
    var cls = done ? "ok" : "todo";
    var txt = done ? "已完成" : "待完成";
    var link = "./stage.html?recordId=" + encodeURIComponent(record.recordId || "") + "&stage=" + encodeURIComponent(s.id);
    return '<div class="stage"><span>' + s.label + '</span><span class="' + cls + '">' + txt + '</span><button class="mini-btn" data-link="' + link + '">进入阶段</button></div>';
  }).join("");
  var el = document.getElementById("stages");
  el.innerHTML = html;
  var btns = el.querySelectorAll('.mini-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function (e) {
      var link = e.currentTarget.getAttribute('data-link');
      if (link) window.location.href = link;
    });
  }
}

function run() {
  var recordId = getParam("recordId");
  if (!recordId) {
    document.getElementById("title").textContent = "项目详情（缺少recordId）";
    document.getElementById("meta").textContent = "请从记录列表点击进入项目。";
    return;
  }
  var all = getUploads();
  var record = all.find(function (x) { return (x.recordId || "") === recordId; });
  if (!record) {
    document.getElementById("title").textContent = "项目详情";
    document.getElementById("meta").textContent = "未找到该记录，请返回重试。";
    return;
  }
  document.getElementById("title").textContent = (record.projectName || record.projectId) + " - 项目详情";
  document.getElementById("meta").textContent = "记录ID: " + recordId + " | 项目ID: " + (record.projectId || "") + " | 风格: " + (record.style || "默认风格");
  renderStages(record);
}

run();
