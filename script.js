"use strict";

/* =====================================
   TAIVIDEO - MAIN JAVASCRIPT
===================================== */

const CONFIG = {
  apiEndpoint: "https://taivideo-eo07.onrender.com/api/download",
  maxHistory: 50
};

const PLATFORMS = [
  { name: "TikTok", icon: "<svg viewBox=\"0 0 24 24\" role=\"img\" aria-hidden=\"true\"><path fill=\"#000000\" d=\"M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z\"/></svg>", domains: ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"] },
  { name: "YouTube", icon: "<svg viewBox=\"0 0 24 24\" role=\"img\" aria-hidden=\"true\"><path fill=\"#FF0000\" d=\"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z\"/></svg>", domains: ["youtube.com", "youtu.be", "m.youtube.com"] },
  { name: "Instagram", icon: "<svg viewBox=\"0 0 24 24\" role=\"img\" aria-hidden=\"true\"><defs><linearGradient id=\"igg\" x1=\"0\" y1=\"1\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#FEDA75\"/><stop offset=\".35\" stop-color=\"#FA7E1E\"/><stop offset=\".6\" stop-color=\"#D62976\"/><stop offset=\".85\" stop-color=\"#962FBF\"/><stop offset=\"1\" stop-color=\"#4F5BD5\"/></linearGradient></defs><path fill=\"url(#igg)\" d=\"M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077\"/></svg>", domains: ["instagram.com"] },
  { name: "Douyin", icon: "<span class=\"badge-logo badge-dark\"><svg viewBox=\"0 0 24 24\" role=\"img\" aria-hidden=\"true\"><path fill=\"#fff\" d=\"M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z\"/></svg></span>", domains: ["douyin.com", "v.douyin.com", "iesdouyin.com"] },
  { name: "Facebook", icon: "<svg viewBox=\"0 0 24 24\" role=\"img\" aria-hidden=\"true\"><path fill=\"#0866FF\" d=\"M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z\"/></svg>", domains: ["facebook.com", "fb.watch", "fb.com"] },
  { name: "X", icon: "<svg viewBox=\"0 0 24 24\" role=\"img\" aria-hidden=\"true\"><path fill=\"#000000\" d=\"M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z\"/></svg>", domains: ["x.com", "twitter.com", "t.co"] },
  { name: "VK", icon: "<svg viewBox=\"0 0 24 24\" role=\"img\" aria-hidden=\"true\"><path fill=\"#0077FF\" d=\"m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z\"/></svg>", domains: ["vk.com", "vk.ru"] },
  { name: "Threads", icon: "<svg viewBox=\"0 0 24 24\" role=\"img\" aria-hidden=\"true\"><path fill=\"#000000\" d=\"M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z\"/></svg>", domains: ["threads.net"] },
  { name: "Bilibili", icon: "<svg viewBox=\"0 0 24 24\" role=\"img\" aria-hidden=\"true\"><path fill=\"#00A1D6\" d=\"M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z\"/></svg>", domains: ["bilibili.com", "b23.tv"] }
];

const TRANSLATIONS = {
  vi: {
    home: "Trang chủ",
    platforms: "Nền tảng",
    history: "Lịch sử",
    headline: 'Tải video & ảnh <span>siêu dễ dàng</span>',
    subtitle: "Tải nội dung yêu thích từ các nền tảng phổ biến.",
    pasteTitle: "Dán liên kết của bạn",
    analyze: "PHÂN TÍCH LIÊN KẾT",
    platformTitle: "Nền tảng hỗ trợ",
    whyTitle: "Tại sao chọn TaiVideo?",
    historyTitle: "Lịch sử tải xuống"
  },
  en: {
    home: "Home",
    platforms: "Platforms",
    history: "History",
    headline: 'Download videos & photos <span>easily</span>',
    subtitle: "Download content from popular platforms.",
    pasteTitle: "Paste your link",
    analyze: "ANALYZE LINK",
    platformTitle: "Supported platforms",
    whyTitle: "Why choose TaiVideo?",
    historyTitle: "Download history"
  },
  zh: {
    home: "首页",
    platforms: "平台",
    history: "历史记录",
    headline: '轻松下载<span>视频和图片</span>',
    subtitle: "从热门平台下载您喜欢的内容。",
    pasteTitle: "粘贴您的链接",
    analyze: "解析链接",
    platformTitle: "支持的平台",
    whyTitle: "为什么选择 TaiVideo？",
    historyTitle: "下载历史"
  }
};

const $ = id => document.getElementById(id);

let currentLanguage = localStorage.getItem("tv_lang") || "vi";
let currentUrl = "";
let currentPlatform = null;
let currentResult = null;

function extractCleanUrl(rawText) {
  const match = String(rawText || "").match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0].replace(/[.,;!?)]+$/, "") : String(rawText || "").trim();
}

function detectPlatform(value) {
  try {
    const cleanUrl = extractCleanUrl(value);
    const url = new URL(cleanUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return PLATFORMS.find(platform =>
      platform.domains.some(domain => host === domain || host.endsWith("." + domain))
    ) || null;
  } catch {
    return null;
  }
}

function renderPlatforms() {
  const grid = $("platformGrid");
  if (!grid) return;
  grid.innerHTML = PLATFORMS.map(platform => `
    <div class="platform-item" data-platform="${platform.name}" tabindex="0" role="button" aria-label="${platform.name}">
      <span class="emoji">${platform.icon}</span>
      <strong>${platform.name}</strong>
    </div>
  `).join("");

  document.querySelectorAll(".platform-item").forEach(item => {
    const choose = () => {
      const input = $("videoUrl");
      const name = item.dataset.platform;
      input.focus();
      $("message").textContent = `Bạn đã chọn ${name}. Hãy dán liên kết tương ứng.`;
      input.dataset.selected = name;
    };
    item.addEventListener("click", choose);
    item.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose();
      }
    });
  });
}

function updateDetection() {
  const value = extractCleanUrl($("videoUrl").value);
  currentPlatform = detectPlatform(value);
  $("detected").textContent = currentPlatform
    ? `✓ Đã nhận diện: ${currentPlatform.name}`
    : value ? "Không nhận diện được nền tảng" : "Chưa nhận diện nền tảng";
  $("detected").style.color = currentPlatform ? "#16a34a" : "#64748b";
}

function setLanguage(language) {
  currentLanguage = TRANSLATIONS[language] ? language : "vi";
  localStorage.setItem("tv_lang", currentLanguage);
  if ($("language")) $("language").value = currentLanguage;
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    if (TRANSLATIONS[currentLanguage][key]) {
      element.innerHTML = TRANSLATIONS[currentLanguage][key];
    }
  });
}

async function callApi(payload, timeoutMs = 180000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(CONFIG.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) throw new Error("HTTP_" + response.status);
    return await response.json();
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Máy chủ phản hồi quá lâu");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
async function analyzeLink() {
  const url = extractCleanUrl($("videoUrl").value);
  $("videoUrl").value = url;
  if (!url) {
    $("message").textContent = "Vui lòng nhập liên kết.";
    return;
  }

  const platform = detectPlatform(url);
  if (!platform) {
    $("message").textContent = "Liên kết không hợp lệ hoặc chưa hỗ trợ.";
    return;
  }

  currentUrl = url;
  currentPlatform = platform;

  $("analyzeBtn").disabled = true;
  $("analyzeBtn").textContent = "ĐANG PHÂN TÍCH...";
  $("message").textContent = "Đang phân tích... (lần đầu máy chủ có thể mất ~1 phút để khởi động)";
  $("downloadMessage").textContent = "";

  try {
    const data = await callApi({
      action: "analyze",
      url: currentUrl,
      platform: currentPlatform.name
    });
    if (!data.success) throw new Error(data.message || "Không thể phân tích.");

    currentResult = data;
    $("resultPlatform").textContent = `${platform.name} · ${data.title || "Nội dung đã nhận diện"}`;
    $("result").classList.remove("hidden");
    $("message").textContent = "Phân tích thành công!";

    if (Array.isArray(data.formats) && data.formats.length) {
      $("quality").innerHTML = data.formats.map(format => `
        <option value="${escapeHTML(format.id)}">${escapeHTML(format.label)}</option>
      `).join("");
    }
  } catch (error) {
    currentResult = null;
    $("resultPlatform").textContent = `${platform.name} · ${new URL(url).hostname}`;
    $("result").classList.remove("hidden");
    $("message").textContent = "Không thể phân tích: " + error.message;
  } finally {
    $("analyzeBtn").disabled = false;
    $("analyzeBtn").innerHTML = '↓ <span data-i18n="analyze"></span>';
    setLanguage(currentLanguage);
  }
}

async function downloadMedia() {
  if (!currentUrl || !currentPlatform) return;

  if (!currentResult) {
    $("downloadMessage").textContent = "Chưa có kết quả từ API. Hãy bấm PHÂN TÍCH LIÊN KẾT trước.";
    return;
  }

  $("downloadBtn").disabled = true;
  $("downloadBtn").textContent = "ĐANG TẢI VỀ MÁY CHỦ...";
  $("downloadMessage").textContent = "";

  try {
    const response = await fetch(CONFIG.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "download",
        url: currentUrl,
        platform: currentPlatform.name,
        quality: $("quality").value,
        formatId: $("quality").value
      })
    });

    if (!response.ok) throw new Error("HTTP_" + response.status);
    const data = await response.json();
    if (!data.success || !data.downloadUrl) {
      throw new Error(data.message || "Không có file tải xuống.");
    }

    const downloadUrl = new URL(data.downloadUrl);
    if (!["https:", "http:"].includes(downloadUrl.protocol)) {
      throw new Error("Địa chỉ tải xuống không hợp lệ.");
    }

    const link = document.createElement("a");
    link.href = downloadUrl.href;
    link.rel = "noopener";
    link.target = "_blank";
    link.download = data.filename || "";
    document.body.appendChild(link);
    link.click();
    link.remove();

    saveHistory(currentPlatform.name, currentUrl, "success");
    $("downloadMessage").textContent = "Tải xuống hoàn tất!";
  } catch (error) {
    $("downloadMessage").textContent = "Không thể tải file: " + error.message;
  } finally {
    $("downloadBtn").disabled = false;
    $("downloadBtn").textContent = "↓ TẢI XUỐNG";
  }
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("tv_history")) || [];
  } catch {
    return [];
  }
}

function saveHistory(platform, url, status) {
  const history = getHistory();
  history.unshift({ platform, url, status, date: new Date().toISOString() });
  localStorage.setItem("tv_history", JSON.stringify(history.slice(0, CONFIG.maxHistory)));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  const list = $("historyList");
  if (!list) return;
  if (!history.length) {
    list.innerHTML = '<p class="empty">Chưa có lịch sử tải xuống.</p>';
    return;
  }
  list.innerHTML = history.map(item => `
    <div class="history-item">
      <div>
        <strong>${escapeHTML(item.platform)}</strong>
        <small>${escapeHTML(item.url)}</small>
        <small>${new Date(item.date).toLocaleString()}</small>
      </div>
      <span class="muted">${item.status === "success" ? "✓ Hoàn tất" : "Đã ghi nhận"}</span>
    </div>
  `).join("");
}

function clearHistory() {
  if (!confirm("Bạn có chắc muốn xóa toàn bộ lịch sử?")) return;
  localStorage.removeItem("tv_history");
  renderHistory();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

document.addEventListener("DOMContentLoaded", () => {
  renderPlatforms();
  renderHistory();
  setLanguage(currentLanguage);

  $("videoUrl")?.addEventListener("input", updateDetection);
  $("analyzeBtn")?.addEventListener("click", analyzeLink);
  $("downloadBtn")?.addEventListener("click", downloadMedia);

  $("clearUrl")?.addEventListener("click", () => {
    $("videoUrl").value = "";
    $("result").classList.add("hidden");
    $("message").textContent = "";
    $("downloadMessage").textContent = "";
    currentUrl = "";
    currentPlatform = null;
    currentResult = null;
    updateDetection();
  });

  $("language")?.addEventListener("change", event => setLanguage(event.target.value));
  $("clearHistory")?.addEventListener("click", clearHistory);

  updateDetection();
});
