const statusEl = document.getElementById("status");
const saveBtn = document.getElementById("save");
const copyBtn = document.getElementById("copy");

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

function captureVisibleAsDataUrl() {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
      const error = chrome.runtime.lastError;
      if (error || !dataUrl) {
        reject(new Error(error?.message || "截图失败"));
      } else {
        resolve(dataUrl);
      }
    });
  });
}

saveBtn.addEventListener("click", async () => {
  setStatus("正在截图…");
  try {
    const dataUrl = await captureVisibleAsDataUrl();
    const filename = `screenshot-${formatTimestamp()}.png`;
    await chrome.downloads.download({ url: dataUrl, filename, saveAs: false });
    setStatus("已保存到下载目录", "ok");
  } catch (err) {
    setStatus(`保存失败：${err.message || err}`, "err");
  }
});

copyBtn.addEventListener("click", async () => {
  setStatus("正在截图并复制…");
  try {
    const dataUrl = await captureVisibleAsDataUrl();
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    // 需要用户手势（按钮点击）环境下运行
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);
    setStatus("已复制为图片到剪贴板", "ok");
  } catch (err) {
    setStatus(`复制失败：${err.message || err}`, "err");
  }
});