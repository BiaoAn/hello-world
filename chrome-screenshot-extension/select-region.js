(() => {
  // Avoid duplicate overlays
  const existing = document.getElementById("__sre_overlay__");
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "__sre_overlay__";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    cursor: "crosshair",
    background: "rgba(0,0,0,0.12)",
    backdropFilter: "blur(0px)",
  });

  const info = document.createElement("div");
  info.textContent = "拖动选择区域，按 Esc 取消";
  Object.assign(info.style, {
    position: "fixed",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "6px 10px",
    borderRadius: "6px",
    font: "12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    pointerEvents: "none",
  });

  const rectEl = document.createElement("div");
  Object.assign(rectEl.style, {
    position: "fixed",
    border: "2px solid #42a5f5",
    background: "rgba(66,165,245,0.15)",
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.12)",
    pointerEvents: "none",
  });

  let startX = 0;
  let startY = 0;
  let active = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function cleanup() {
    window.removeEventListener("mousemove", onMove, true);
    window.removeEventListener("mouseup", onUp, true);
    window.removeEventListener("keydown", onKey, true);
    overlay.remove();
  }

  function onDown(e) {
    if (e.button !== 0) return; // only left click
    active = true;
    startX = e.clientX;
    startY = e.clientY;
    rectEl.style.left = `${startX}px`;
    rectEl.style.top = `${startY}px`;
    rectEl.style.width = "0px";
    rectEl.style.height = "0px";

    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("mouseup", onUp, true);
    window.addEventListener("keydown", onKey, true);

    e.preventDefault();
    e.stopPropagation();
  }

  function onMove(e) {
    if (!active) return;
    const x = clamp(e.clientX, 0, window.innerWidth);
    const y = clamp(e.clientY, 0, window.innerHeight);
    const left = Math.min(startX, x);
    const top = Math.min(startY, y);
    const width = Math.abs(x - startX);
    const height = Math.abs(y - startY);

    rectEl.style.left = `${left}px`;
    rectEl.style.top = `${top}px`;
    rectEl.style.width = `${width}px`;
    rectEl.style.height = `${height}px`;

    e.preventDefault();
    e.stopPropagation();
  }

  function onUp(e) {
    if (!active) return;
    active = false;
    const left = parseFloat(rectEl.style.left || "0");
    const top = parseFloat(rectEl.style.top || "0");
    const width = parseFloat(rectEl.style.width || "0");
    const height = parseFloat(rectEl.style.height || "0");

    if (width < 5 || height < 5) {
      // too small, treat as cancel
      cleanup();
      chrome.runtime.sendMessage({ type: "region-canceled" });
      return;
    }

    const rect = { x: Math.round(left), y: Math.round(top), width: Math.round(width), height: Math.round(height) };

    chrome.runtime.sendMessage({
      type: "region-selected",
      rect,
      dpr: window.devicePixelRatio || 1,
    }, (resp) => {
      // ignore response; background stores selection
    });

    cleanup();
    e.preventDefault();
    e.stopPropagation();
  }

  function onKey(e) {
    if (e.key === "Escape") {
      cleanup();
      chrome.runtime.sendMessage({ type: "region-canceled" });
      e.preventDefault();
      e.stopPropagation();
    }
  }

  overlay.addEventListener("mousedown", onDown, true);
  overlay.appendChild(info);
  overlay.appendChild(rectEl);
  document.documentElement.appendChild(overlay);
})();