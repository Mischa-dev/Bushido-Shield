// Bushido Shield - content script
const API = typeof browser !== 'undefined' ? browser : chrome;

let siteEnabled = false;
let currentMode = "Default";

const focusBlockedHosts = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "tiktok.com",
  "www.tiktok.com",
  "twitter.com",
  "x.com",
  "www.facebook.com",
  "facebook.com",
  "instagram.com",
  "www.instagram.com"
]);

function ensureStyleEl() {
  let el = document.getElementById("bushido-shield-style");
  if (!el) {
    el = document.createElement("style");
    el.id = "bushido-shield-style";
    document.documentElement.appendChild(el);
  }
  return el;
}

function applyAdHidingCSS(active) {
  const el = ensureStyleEl();
  if (!active) {
    el.textContent = "";
    return;
  }
  // Very conservative starter selectors for a demo; expand later.
  el.textContent = `
/* Generic ad containers */
[id*="ad-"], [id^="ad_"], [class*="ad-"], [class^="ad_"], [class*="advert"], [class*="adsbox"], [class*="sponsor"],
iframe[src*="doubleclick.net"], iframe[src*="adservice.google.com"],
iframe[src*="googlesyndication.com"], iframe[src*="adsystem"], iframe[src*="adnxs.com"] {
  display: none !important;
  visibility: hidden !important;
  max-height: 0 !important;
  height: 0 !important;
  pointer-events: none !important;
}
/* YouTube: hide ads/ticker-ish (non-breaking) */
ytd-rich-section-renderer, ytd-ad-slot-renderer, ytd-player-legacy-desktop-watch-ads-renderer, .ytd-display-ad-renderer {
  display: none !important;
}
`;
}

function ensureFocusOverlay() {
  let el = document.getElementById("bushido-focus-overlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "bushido-focus-overlay";
    el.style.position = "fixed";
    el.style.inset = "0";
    el.style.background = "rgba(0,0,0,0.9)";
    el.style.zIndex = "2147483647";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    el.style.color = "white";
    el.style.fontSize = "clamp(18px, 3vw, 28px)";
    el.style.textAlign = "center";
    el.style.padding = "24px";
    el.innerHTML = "<div><strong>Blocked by Focus Mode</strong><br/><span style='opacity:.85'>You can turn this off from the Bushido Shield popup.</span></div>";
    document.documentElement.appendChild(el);
  }
  return el;
}

function applyFocusBlocking(active) {
  const host = location.hostname;
  const shouldBlock = active && focusBlockedHosts.has(host);
  const existing = document.getElementById("bushido-focus-overlay");
  if (shouldBlock) {
    ensureFocusOverlay().style.display = "flex";
  } else if (existing) {
    existing.style.display = "none";
  }
}

function render() {
  // Ad CSS only if site toggle is on
  applyAdHidingCSS(siteEnabled);
  // Focus overlay if mode is Focus
  applyFocusBlocking(currentMode === "Focus");
}

// Listen for background messages
API.runtime.onMessage.addListener((msg) => {
  if (msg.type === "APPLY_SITE_STATE") {
    siteEnabled = Boolean(msg.enabled);
    render();
  } else if (msg.type === "APPLY_MODE") {
    currentMode = msg.mode || "Default";
    render();
  }
});
