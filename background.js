// Bushido Shield - background service worker (MV3)
// Minimal per-origin toggle + quick modes stored locally.
// Note: This is backend-agnostic. Later, wire to your Pi/AdGuard API.

const API = typeof browser !== 'undefined' ? browser : chrome;
const DASHBOARD_API = 'http://localhost:5179/api';

const DEFAULT_STATE = {
  sites: {},
  device: { name: "This device", mode: "Default", boundDeviceId: null },
  blocking: {
    rulesets: {
      ads: true,
      trackers: true,
      malware: true,
      adult: false,
    },
    customBlocklist: [],
    stats: {
      totalBlocked: 0,
      daily: { date: todayKey(), count: 0 },
    },
  },
};

const BLOCK_RULESETS = [
  { id: "ads", label: "Ads & marketing", defaultEnabled: true },
  { id: "trackers", label: "Trackers & analytics", defaultEnabled: true },
  { id: "malware", label: "Security & malware", defaultEnabled: true },
  { id: "adult", label: "Adult content", defaultEnabled: false },
];

const DEFAULT_SITE_ENABLED = true;

const DNR = API.declarativeNetRequest;
const HAS_DNR = Boolean(DNR?.updateEnabledRulesets);
const DYNAMIC_RULE_WINDOW = 10000;
const SITE_ALLOW_BASE = 100000;
const CUSTOM_BLOCK_BASE = 200000;

const RESOURCE_TYPES = [
  "main_frame",
  "sub_frame",
  "script",
  "xmlhttprequest",
  "image",
  "media",
  "font",
  "stylesheet",
  "ping",
  "other",
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeStats(stats) {
  const today = todayKey();
  const total = Number(stats?.totalBlocked);
  const rawDaily = stats?.daily || {};
  const storedDate = typeof rawDaily.date === "string" ? rawDaily.date : today;
  const count = Number(rawDaily.count);
  return {
    totalBlocked: Number.isFinite(total) && total >= 0 ? total : 0,
    daily: {
      date: storedDate === today ? storedDate : today,
      count: storedDate === today && Number.isFinite(count) && count >= 0 ? count : 0,
    },
  };
}

function sanitizeCustomHost(input) {
  if (!input) return null;
  let value = String(input).trim();
  if (!value) return null;
  if (/[\^\|\*]/.test(value)) {
    return value;
  }
  if (value.includes("://")) {
    try {
      value = new URL(value).hostname;
    } catch (e) {
      value = value.replace(/^[^/]+:\/\//, "");
    }
  }
  value = value.replace(/^www\./, "");
  value = value.split("/")[0];
  value = value.replace(/\.+$/, "");
  value = value.trim().toLowerCase();
  return value || null;
}

function normalizeState(raw) {
  const state = raw && typeof raw === "object" ? raw : {};
  const rawSites = state.sites && typeof state.sites === "object" ? state.sites : {};
  const sites = {};
  for (const [origin, data] of Object.entries(rawSites)) {
    if (data && typeof data === "object") {
      sites[origin] = { ...data };
    }
  }
  const blocking = state.blocking && typeof state.blocking === "object" ? state.blocking : {};
  const customBlocklist = Array.isArray(blocking.customBlocklist)
    ? Array.from(new Set(blocking.customBlocklist.map(sanitizeCustomHost).filter(Boolean))).sort()
    : [];

  const normalized = {
    sites,
    device: {
      name: state.device?.name || DEFAULT_STATE.device.name,
      mode: state.device?.mode || DEFAULT_STATE.device.mode,
      boundDeviceId: state.device?.boundDeviceId || null,
    },
    blocking: {
      rulesets: {
        ...DEFAULT_STATE.blocking.rulesets,
        ...(blocking.rulesets && typeof blocking.rulesets === "object" ? blocking.rulesets : {}),
      },
      customBlocklist,
      stats: normalizeStats(blocking.stats),
    },
  };

  return normalized;
}

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
    API.storage.local.get({ state: DEFAULT_STATE }, (data) => {
      resolve(normalizeState(data.state));
    });
  });
}

async function setState(next) {
  const sanitized = normalizeState(next);
  return new Promise((resolve) => {
    API.storage.local.set({ state: sanitized }, () => resolve(sanitized));
  });
}

function getHostFromOrigin(origin) {
  try {
    return new URL(origin).host;
  } catch (e) {
    return null;
  }
}

function shouldDefaultEnableSite(entry) {
  if (!entry || typeof entry.enabled === "undefined") return DEFAULT_SITE_ENABLED;
  return Boolean(entry.enabled);
}

async function getStateWithDefaults() {
  const st = await getState();
  // Ensure we persist defaults if storage was empty
  if (!st || !st.blocking) {
    await setState(DEFAULT_STATE);
    return normalizeState(DEFAULT_STATE);
  }
  return st;
}

async function getSiteEnabled(origin) {
  const st = await getStateWithDefaults();
  return shouldDefaultEnableSite(st.sites[origin]);
}

async function setSiteEnabled(origin, enabled) {
  const st = await getStateWithDefaults();
  if (enabled === DEFAULT_SITE_ENABLED) {
    if (st.sites[origin]) {
      delete st.sites[origin].enabled;
      if (Object.keys(st.sites[origin]).length === 0) {
        delete st.sites[origin];
      }
    }
  } else {
    st.sites[origin] = st.sites[origin] || {};
    st.sites[origin].enabled = enabled;
  }
  const saved = await setState(st);
  await syncSiteAllowRules(saved.sites);
}

async function setDeviceMode(mode) {
  const st = await getStateWithDefaults();
  st.device.mode = mode;
  await setState(st);
  // Sync mode to server:
  // If we're bound to a device, update that device's profileId.
  // Otherwise, fall back to updating the global activeProfile.
  try {
    const boundDeviceId = st.device.boundDeviceId;
    if (boundDeviceId) {
      await fetch(`${DASHBOARD_API}/devices/${boundDeviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: mode })
      });
    } else {
      await fetch(`${DASHBOARD_API}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeProfile: mode })
      });
    }
  } catch (error) {
    console.warn('Dashboard sync failed', error);
  }
}

// Periodically sync local mode from server when bound device's profile changes on the dashboard
async function syncModeFromServer() {
  try {
    const st = await getStateWithDefaults();
    const boundDeviceId = st.device.boundDeviceId;
    if (!boundDeviceId) return;
    const res = await fetch(`${DASHBOARD_API}/devices`);
    if (!res.ok) return;
    const devices = await res.json();
    const dev = Array.isArray(devices) ? devices.find(d => d.id === boundDeviceId) : null;
    const serverProfileId = dev?.profileId;
    if (serverProfileId && serverProfileId !== st.device.mode) {
      st.device.mode = serverProfileId;
      await setState(st);
    }
  } catch (e) {
    // best effort
  }
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

async function dynamicRulesInRange(base) {
  if (!HAS_DNR || typeof DNR.getDynamicRules !== "function") return [];
  const rules = await DNR.getDynamicRules();
  return rules
    .filter((rule) => rule.id >= base && rule.id < base + DYNAMIC_RULE_WINDOW)
    .map((rule) => rule.id);
}

function allowRuleForHost(id, host) {
  return {
    id,
    priority: 1,
    action: { type: "allow" },
    condition: {
      initiatorDomains: [host],
      resourceTypes: RESOURCE_TYPES,
    },
  };
}

function blockRuleForHost(id, hostOrPattern) {
  const isPattern = /[\^\|\*]/.test(hostOrPattern);
  const filter = isPattern ? hostOrPattern : `||${hostOrPattern}^`;
  return {
    id,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: filter,
      resourceTypes: RESOURCE_TYPES,
    },
  };
}

function getActiveRulesetIds(rulesets) {
  return BLOCK_RULESETS.filter((meta) => {
    const value = rulesets?.[meta.id];
    if (typeof value === "boolean") return value;
    return meta.defaultEnabled;
  }).map((meta) => meta.id);
}

async function syncSiteAllowRules(sites) {
  if (!HAS_DNR || typeof DNR.updateDynamicRules !== "function") return;
  const removeRuleIds = await dynamicRulesInRange(SITE_ALLOW_BASE);
  const disabledHosts = Object.entries(sites || {})
    .filter(([, entry]) => !shouldDefaultEnableSite(entry))
    .map(([origin]) => getHostFromOrigin(origin))
    .filter(Boolean)
    .sort();
  const addRules = disabledHosts.map((host, index) => allowRuleForHost(SITE_ALLOW_BASE + index, host));
  if (removeRuleIds.length || addRules.length) {
    await DNR.updateDynamicRules({ removeRuleIds, addRules });
  }
}

async function syncCustomBlocklist(list) {
  if (!HAS_DNR || typeof DNR.updateDynamicRules !== "function") return;
  const removeRuleIds = await dynamicRulesInRange(CUSTOM_BLOCK_BASE);
  const addRules = (list || []).map((host, index) => blockRuleForHost(CUSTOM_BLOCK_BASE + index, host));
  if (removeRuleIds.length || addRules.length) {
    await DNR.updateDynamicRules({ removeRuleIds, addRules });
  }
}

async function setRulesetEnabled(rulesetId, enabled) {
  const st = await getStateWithDefaults();
  st.blocking.rulesets = {
    ...DEFAULT_STATE.blocking.rulesets,
    ...(st.blocking.rulesets || {}),
    [rulesetId]: Boolean(enabled),
  };
  const saved = await setState(st);
  await applyRulesetState(saved.blocking.rulesets);
  return saved;
}

async function addCustomBlockHost(host) {
  const sanitized = sanitizeCustomHost(host);
  if (!sanitized) {
    const state = await getStateWithDefaults();
    return { updated: false, state };
  }
  const st = await getStateWithDefaults();
  const set = new Set(st.blocking.customBlocklist || []);
  set.add(sanitized);
  st.blocking.customBlocklist = Array.from(set).sort();
  const saved = await setState(st);
  await syncCustomBlocklist(saved.blocking.customBlocklist);
  return { updated: true, state: saved, value: sanitized };
}

async function removeCustomBlockHost(host) {
  const sanitized = sanitizeCustomHost(host);
  const st = await getStateWithDefaults();
  const list = new Set(st.blocking.customBlocklist || []);
  if (!sanitized || !list.has(sanitized)) {
    return { updated: false, state: st };
  }
  list.delete(sanitized);
  st.blocking.customBlocklist = Array.from(list).sort();
  const saved = await setState(st);
  await syncCustomBlocklist(saved.blocking.customBlocklist);
  return { updated: true, state: saved, value: sanitized };
}

async function resetBlockingStats() {
  const st = await getStateWithDefaults();
  st.blocking.stats = { ...DEFAULT_STATE.blocking.stats, daily: { date: todayKey(), count: 0 } };
  const saved = await setState(st);
  return saved;
}

function buildBlockingSnapshot(st) {
  const activeIds = getActiveRulesetIds(st.blocking.rulesets);
  return {
    hasDnr: HAS_DNR,
    activeRulesetIds: activeIds,
    totalRulesets: BLOCK_RULESETS.length,
    rulesets: BLOCK_RULESETS.map((meta) => ({
      id: meta.id,
      label: meta.label,
      enabled: activeIds.includes(meta.id),
      defaultEnabled: meta.defaultEnabled,
    })),
    customBlocklist: st.blocking.customBlocklist || [],
    stats: st.blocking.stats,
  };
}

async function applyRulesetState(rulesets) {
  if (!HAS_DNR) return;
  const enable = [];
  const disable = [];
  for (const meta of BLOCK_RULESETS) {
    const enabled = typeof rulesets?.[meta.id] === "boolean" ? rulesets[meta.id] : meta.defaultEnabled;
    if (enabled) {
      enable.push(meta.id);
    } else {
      disable.push(meta.id);
    }
  }
  if (enable.length || disable.length) {
    await DNR.updateEnabledRulesets({ enableRulesetIds: enable, disableRulesetIds: disable });
  }
}

async function bootstrapBlocking() {
  if (!HAS_DNR) return;
  const st = await getStateWithDefaults();
  await applyRulesetState(st.blocking.rulesets);
  await syncCustomBlocklist(st.blocking.customBlocklist);
  await syncSiteAllowRules(st.sites);
}

bootstrapBlocking().catch(() => {});

if (API.runtime?.onInstalled) {
  API.runtime.onInstalled.addListener(() => {
    bootstrapBlocking().catch(() => {});
    try { API.alarms?.create('bushido-sync', { periodInMinutes: 0.2 }); } catch (_) {}
  });
}

// Pull binding from server (when dashboard binds/unbinds) and keep mode in sync
async function syncBindingFromServer() {
  try {
    const res = await fetch(`${DASHBOARD_API}/extension-binding`);
    if (!res.ok) return;
    const data = await res.json();
    const serverBoundId = data?.boundDeviceId || null;
    const st = await getStateWithDefaults();
    if (st.device.boundDeviceId !== serverBoundId) {
      st.device.boundDeviceId = serverBoundId;
      await setState(st);
    }
  } catch (e) {
    // best effort
  }
}

async function backgroundSync() {
  await syncBindingFromServer();
  await syncModeFromServer();
}

// Also schedule with alarms so MV3 service worker wakes periodically
try {
  API.alarms?.create('bushido-sync', { periodInMinutes: 0.2 }); // ~12s
  API.alarms?.onAlarm.addListener((alarm) => {
    if (alarm?.name === 'bushido-sync') backgroundSync();
  });
} catch (_) {}

if (HAS_DNR && DNR.onRuleMatchedDebug) {
  DNR.onRuleMatchedDebug.addListener(async () => {
    const st = await getStateWithDefaults();
    const stats = st.blocking.stats || { ...DEFAULT_STATE.blocking.stats };
    stats.totalBlocked = (stats.totalBlocked || 0) + 1;
    const today = todayKey();
    if (!stats.daily || stats.daily.date !== today) {
      stats.daily = { date: today, count: 0 };
    }
    stats.daily.count = (stats.daily.count || 0) + 1;
    st.blocking.stats = stats;
    await setState(st);
  });
}

async function setBoundDevice(deviceId) {
  const st = await getStateWithDefaults();
  st.device.boundDeviceId = deviceId;
  const saved = await setState(st);
  // Sync binding to server
  try {
    await fetch(`${DASHBOARD_API}/extension-binding`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: deviceId || null })
    });
  } catch (error) {
    console.warn('Failed to sync binding to server:', error);
  }
  // Pull latest mode from server for this device
  await syncModeFromServer();
  return saved;
}

async function getBoundDevice() {
  const st = await getStateWithDefaults();
  return st.device.boundDeviceId;
}

async function unbindDevice() {
  const st = await getStateWithDefaults();
  st.device.boundDeviceId = null;
  const saved = await setState(st);
  // Sync unbinding to server
  try {
    await fetch(`${DASHBOARD_API}/extension-binding`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.warn('Failed to sync unbinding to server:', error);
  }
  // No longer bound; nothing to sync from server
  return saved;
}

// Handle popup requests
API.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "GET_QUICK_STATE") {
      const tab = await getActiveTab();
      const origin = tab ? getOriginFromUrl(tab.url) : null;
      const st = await getStateWithDefaults();
      const enabled = origin ? shouldDefaultEnableSite(st.sites[origin]) : DEFAULT_SITE_ENABLED;
      sendResponse({
        origin,
        enabled,
        mode: st.device.mode,
        device: st.device.name,
        boundDeviceId: st.device.boundDeviceId,
        blocking: buildBlockingSnapshot(st),
      });
    } else if (msg.type === "TOGGLE_SITE") {
      const tab = await getActiveTab();
      if (!tab || !tab.url) return sendResponse({ ok: false });
      const origin = getOriginFromUrl(tab.url);
      if (!origin) return sendResponse({ ok: false });
      const current = await getSiteEnabled(origin);
      await setSiteEnabled(origin, !current);
      await notifyContent(tab.id, { type: "APPLY_SITE_STATE", origin, enabled: !current });
      sendResponse({ ok: true, enabled: !current });
    } else if (msg.type === "SET_MODE") {
      await setDeviceMode(msg.mode);
      const tab = await getActiveTab();
      if (tab && typeof tab.id !== "undefined") {
        await notifyContent(tab.id, { type: "APPLY_MODE", mode: msg.mode });
      }
      sendResponse({ ok: true, mode: msg.mode });
    } else if (msg.type === "OPEN_OPTIONS") {
      API.runtime.openOptionsPage();
      sendResponse({ ok: true });
    } else if (msg.type === "SET_SITE_PREFERENCE") {
      if (!msg.origin) {
        sendResponse({ ok: false });
        return;
      }
      await setSiteEnabled(msg.origin, Boolean(msg.enabled));
      const st = await getStateWithDefaults();
      sendResponse({ ok: true, enabled: shouldDefaultEnableSite(st.sites[msg.origin]), blocking: buildBlockingSnapshot(st) });
    } else if (msg.type === "GET_BLOCKING_CONFIG") {
      const st = await getStateWithDefaults();
      sendResponse({ ok: true, blocking: buildBlockingSnapshot(st) });
    } else if (msg.type === "SET_BLOCKING_RULESET") {
      const saved = await setRulesetEnabled(msg.rulesetId, msg.enabled);
      sendResponse({ ok: true, blocking: buildBlockingSnapshot(saved) });
    } else if (msg.type === "ADD_CUSTOM_BLOCK_HOST") {
      const result = await addCustomBlockHost(msg.value);
      sendResponse({
        ok: result.updated,
        value: result.value,
        blocking: buildBlockingSnapshot(result.state || (await getStateWithDefaults())),
      });
    } else if (msg.type === "REMOVE_CUSTOM_BLOCK_HOST") {
      const result = await removeCustomBlockHost(msg.value);
      sendResponse({
        ok: result.updated,
        value: result.value,
        blocking: buildBlockingSnapshot(result.state || (await getStateWithDefaults())),
      });
    } else if (msg.type === "RESET_BLOCKING_STATS") {
      const saved = await resetBlockingStats();
      sendResponse({ ok: true, blocking: buildBlockingSnapshot(saved) });
    } else if (msg.type === "BIND_DEVICE") {
      const saved = await setBoundDevice(msg.deviceId);
      sendResponse({ ok: true, boundDeviceId: saved.device.boundDeviceId });
    } else if (msg.type === "UNBIND_DEVICE") {
      const saved = await unbindDevice();
      sendResponse({ ok: true, boundDeviceId: null });
    } else if (msg.type === "GET_BOUND_DEVICE") {
      const boundDeviceId = await getBoundDevice();
      sendResponse({ ok: true, boundDeviceId });
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
    const st = await getStateWithDefaults();
    const enabled = shouldDefaultEnableSite(st.sites[origin]);
    await notifyContent(tabId, { type: "APPLY_SITE_STATE", origin, enabled });
    await notifyContent(tabId, { type: "APPLY_MODE", mode: st.device.mode });
  }
});

API.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await API.tabs.get(activeInfo.tabId);
  const origin = getOriginFromUrl(tab.url);
  if (!origin) return;
  const st = await getStateWithDefaults();
  const enabled = shouldDefaultEnableSite(st.sites[origin]);
  await notifyContent(activeInfo.tabId, { type: "APPLY_SITE_STATE", origin, enabled });
  await notifyContent(activeInfo.tabId, { type: "APPLY_MODE", mode: st.device.mode });
});


