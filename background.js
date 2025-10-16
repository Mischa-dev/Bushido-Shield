// Bushido Shield - background service worker (MV3)
// Minimal per-origin toggle + quick modes stored locally.
// Note: This is backend-agnostic. Later, wire to your Pi/AdGuard API.

const API = typeof browser !== 'undefined' ? browser : chrome;

function getOriginFromUrl(url) {
  try {
    const u = new URL(url);
    return u.origin;
  } catch (e) {
    return null;
  }
}

async function getState() {
  return new Promise((resolve) => {
    API.storage.local.get({ state: { sites: {}, device: { name: "This device", mode: "Default" } } }, (data) => {
      resolve(data.state);
    });
  });
}

async function setState(next) {
  return new Promise((resolve) => {
    API.storage.local.set({ state: next }, () => resolve(true));
  });
}

async function getSiteEnabled(origin) {
  const st = await getState();
  return Boolean(st.sites[origin]?.enabled);
}

async function setSiteEnabled(origin, enabled) {
  const st = await getState();
  st.sites[origin] = st.sites[origin] || {};
  st.sites[origin].enabled = enabled;
  await setState(st);
}

async function setDeviceMode(mode) {
  const st = await getState();
  st.device.mode = mode;
  await setState(st);
}

async function getActiveTab() {
  const tabs = await API.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function notifyContent(tabId, payload) {
  try {
    await API.tabs.sendMessage(tabId, payload);
  } catch (e) {
    // Ignore: some pages (chrome://) cannot be messaged.
  }
}

// Handle popup requests
API.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "GET_QUICK_STATE") {
      const tab = await getActiveTab();
      const origin = getOriginFromUrl(tab.url);
      const st = await getState();
      const enabled = origin ? Boolean(st.sites[origin]?.enabled) : false;
      sendResponse({ origin, enabled, mode: st.device.mode, device: st.device.name });
    } else if (msg.type === "TOGGLE_SITE") {
      const tab = await getActiveTab();
      const origin = getOriginFromUrl(tab.url);
      if (!origin) return sendResponse({ ok: false });
      const current = await getSiteEnabled(origin);
      await setSiteEnabled(origin, !current);
      await notifyContent(tab.id, { type: "APPLY_SITE_STATE", origin, enabled: !current });
      sendResponse({ ok: true, enabled: !current });
    } else if (msg.type === "SET_MODE") {
      await setDeviceMode(msg.mode);
      const tab = await getActiveTab();
      await notifyContent(tab.id, { type: "APPLY_MODE", mode: msg.mode });
      sendResponse({ ok: true, mode: msg.mode });
    } else if (msg.type === "OPEN_OPTIONS") {
      API.runtime.openOptionsPage();
      sendResponse({ ok: true });
    }
  })();
  // Return true to signal async response
  return true;
});

// Apply rules when a tab is updated or activated
API.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" || changeInfo.status === "complete") {
    const origin = getOriginFromUrl(tab.url);
    if (!origin) return;
    const st = await getState();
    const enabled = Boolean(st.sites[origin]?.enabled);
    await notifyContent(tabId, { type: "APPLY_SITE_STATE", origin, enabled });
    await notifyContent(tabId, { type: "APPLY_MODE", mode: st.device.mode });
  }
});

API.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await API.tabs.get(activeInfo.tabId);
  const origin = getOriginFromUrl(tab.url);
  if (!origin) return;
  const st = await getState();
  const enabled = Boolean(st.sites[origin]?.enabled);
  await notifyContent(activeInfo.tabId, { type: "APPLY_SITE_STATE", origin, enabled });
  await notifyContent(activeInfo.tabId, { type: "APPLY_MODE", mode: st.device.mode });
});


