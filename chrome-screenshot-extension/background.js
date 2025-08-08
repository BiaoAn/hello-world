// MV3 service worker: handle region selection and capture

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "region-selected") {
    const tabId = sender?.tab?.id;
    const windowId = sender?.tab?.windowId;
    const rect = message.rect;
    const dpr = message.dpr || 1;
    if (!tabId || !windowId || !rect) {
      sendResponse({ ok: false, error: "Missing sender.tab or rect" });
      return; // synchronous return is fine here
    }

    chrome.tabs.captureVisibleTab(windowId, { format: "png" }, async (dataUrl) => {
      const error = chrome.runtime.lastError;
      if (error || !dataUrl) {
        sendResponse({ ok: false, error: error?.message || "captureVisibleTab failed" });
        return;
      }

      try {
        const key = `selection_${tabId}`;
        const payload = {
          tabId,
          windowId,
          rect,
          dpr,
          dataUrl,
          ts: Date.now()
        };
        await chrome.storage.session.set({ [key]: payload });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: e?.message || String(e) });
      }
    });

    return true; // keep message channel open for async sendResponse
  }
});