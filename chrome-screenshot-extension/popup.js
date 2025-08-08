const statusEl = document.getElementById("status");
const saveBtn = document.getElementById("save");
const copyBtn = document.getElementById("copy");
const selectBtn = document.getElementById("select");

let lastCroppedDataUrl = null; // if present, Save/Copy will use this

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = type;
}

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const min = pad(date.getMinutes());
  const sec = pad(date.getSeconds());
  return `${year}${month}${day}-${hour}${min}${sec}`;
}

function captureVisibleAsDataUrl(windowId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
      const error = chrome.runtime.lastError;
      if (error || !dataUrl) {
        reject(new Error(error?.message || "截图失败"));
      } else {
        resolve(dataUrl);
      }
    });
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function cropDataUrl(originalDataUrl, rect, dpr) {
  const img = new Image();
  img.src = originalDataUrl;
  await img.decode();

  const scale = dpr || 1;
  const sx = Math.round(rect.x * scale);
  const sy = Math.round(rect.y * scale);
  const sw = Math.round(rect.width * scale);
  const sh = Math.round(rect.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, sw);
  canvas.height = Math.max(1, sh);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL("image/png");
}

async function loadLastSelectionForActiveTab() {
  try {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    const key = `selection_${tab.id}`;
    const data = await chrome.storage.session.get(key);
    const payload = data[key];
    if (payload && payload.dataUrl && payload.rect) {
      // produce cropped preview for subsequent Save/Copy
      lastCroppedDataUrl = await cropDataUrl(payload.dataUrl, payload.rect, payload.dpr);
      setStatus("已加载选区，保存/复制将使用该选区", "ok");
    }
  } catch (e) {
    // ignore
  }
}

async function ensureDataUrlForSaveOrCopy() {
  if (lastCroppedDataUrl) return lastCroppedDataUrl;
  const tab = await getActiveTab();
  const dataUrl = await captureVisibleAsDataUrl(tab.windowId);
  return dataUrl;
}

saveBtn.addEventListener("click", async () => {
  setStatus("处理中…");
  try {
    const dataUrl = await ensureDataUrlForSaveOrCopy();
    const filename = `screenshot-${formatTimestamp()}.png`;
    await chrome.downloads.download({ url: dataUrl, filename, saveAs: false });
    setStatus("已保存到下载目录", "ok");
  } catch (err) {
    setStatus(`保存失败：${err.message || err}`, "err");
  }
});

copyBtn.addEventListener("click", async () => {
  setStatus("处理中…");
  try {
    const dataUrl = await ensureDataUrlForSaveOrCopy();
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    setStatus("已复制为图片到剪贴板", "ok");
  } catch (err) {
    setStatus(`复制失败：${err.message || err}`, "err");
  }
});

selectBtn.addEventListener("click", async () => {
  setStatus("请在页面上拖拽选择区域，完成后可重新打开此窗口保存/复制");
  try {
    const tab = await getActiveTab();

    const url = tab?.url || "";
    const isChromeUrl = url.startsWith("chrome://");
    const isChromeWebStore = url.startsWith("https://chrome.google.com/webstore");
    const isExtensionUrl = url.startsWith("chrome-extension://");
    const isEdgeAddons = url.startsWith("https://microsoftedge.microsoft.com/addons");
    const isFileUrl = url.startsWith("file://");

    if (isChromeUrl || isChromeWebStore || isExtensionUrl || isEdgeAddons) {
      setStatus("该页面受浏览器保护，无法选择区域。请在普通网页（http/https）使用。", "err");
      return;
    }
    if (isFileUrl) {
      setStatus("文件页面可能受限。请在扩展详情中开启“允许访问文件网址”，或在 http/https 页面使用。", "err");
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["select-region.js"],
    });
  } catch (err) {
    const msg = (err && err.message) || String(err);
    if (/Cannot access.*chrome:\/\//i.test(msg)) {
      setStatus("该页面受浏览器保护，无法选择区域。请在普通网页（http/https）使用。", "err");
    } else {
      setStatus(`无法启动选择：${msg}`, "err");
    }
  }
});

// Load cached selection for current tab on open
loadLastSelectionForActiveTab();