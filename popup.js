// BUSHIDO SHIELD POPUP
const API_ORIGINS = ["http://127.0.0.1:5179", "http://localhost:5179"];
const POPUP_CACHE_KEY = "popupCache";
let preferredOrigin = null;
let devices = [];
let profiles = [];
let isProtectionOn = true;
let globalPauseUntil = null;
let activeProfileId = null;
let metrics = {
  blockedToday: null,
  blockedTotal: null,
  activeLists: null
};
let quickStateReady = false;
let boundDeviceId = null; // when bound, homescreen controls target this device

document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await hydrateFromCache();
  renderHomeView();
  loadQuickState().catch(() => {});
  await loadData();
  render();
});

function setupEventListeners() {
  const menuButton = document.getElementById("menuButton");
  const menuList = document.getElementById("menuList");
  
  menuButton?.addEventListener("click", () => {
    if (!menuList) return;
    const isOpen = menuList.dataset.open === "true";
    const next = isOpen ? "false" : "true";
    menuList.dataset.open = next;
    menuButton.setAttribute("aria-expanded", next);
  });
  
  document.addEventListener("click", (e) => {
    if (menuButton && menuList && !menuButton.contains(e.target) && !menuList.contains(e.target)) {
      menuList.dataset.open = "false";
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
  
  menuList?.querySelectorAll(".menu__item").forEach(item => {
    item.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      const origin = preferredOrigin || API_ORIGINS[0];
      
      if (action === "dashboard") {
        chrome.tabs.create({ url: origin });
      } else if (action === "options") {
        chrome.runtime.openOptionsPage();
      }
      
      menuList.dataset.open = "false";
      menuButton?.setAttribute("aria-expanded", "false");
    });
  });
  
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const viewName = tab.dataset.view;
      
      document.querySelectorAll(".tab").forEach(t => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      
      document.querySelectorAll(".view").forEach(v => {
        v.classList.remove("is-active");
        v.setAttribute("aria-hidden", "true");
      });

      const activeView = document.getElementById(`view-${viewName}`);
      activeView?.classList.add("is-active");
      activeView?.setAttribute("aria-hidden", "false");
    });
  });
  
  const shieldBtn = document.getElementById("shieldBtn");
  shieldBtn?.addEventListener("click", async () => {
    try {
      if (boundDeviceId) {
        const updated = await updateDevice(boundDeviceId, { enabled: !isProtectionOn });
        isProtectionOn = !!updated?.enabled;
      } else {
        // fallback: local toggle + toast
        isProtectionOn = !isProtectionOn;
      }
    } catch (_) {
      // ignore, keep current state
    }
    const protectionToggle = document.getElementById("protectionToggle");
    if (protectionToggle) protectionToggle.checked = isProtectionOn;
    render();
    showToast(isProtectionOn ? "Protection enabled" : "Protection disabled");
  });
  
  const protectionToggle = document.getElementById("protectionToggle");
  protectionToggle?.addEventListener("change", async (e) => {
    const next = !!e.target.checked;
    try {
      if (boundDeviceId) {
        const updated = await updateDevice(boundDeviceId, { enabled: next });
        isProtectionOn = !!updated?.enabled;
      } else {
        isProtectionOn = next;
      }
    } catch (_) {
      e.target.checked = isProtectionOn; // revert on failure
    }
    render();
    showToast(isProtectionOn ? "Protection enabled" : "Protection disabled");
  });
  
  const pauseBtn = document.getElementById("pauseBtn");
  const pauseMenu = document.getElementById("pauseMenu");
  
  pauseBtn?.addEventListener("click", () => {
    pauseMenu?.classList.toggle("is-open");
  });
  
  pauseMenu?.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const minutes = parseInt(e.target.dataset.minutes);
      if (boundDeviceId) {
        await handleDevicePause(boundDeviceId, "This device", minutes);
      } else {
        await handlePause(minutes);
      }
      pauseMenu.classList.remove("is-open");
    });
  });
  
  document.addEventListener("click", (e) => {
    if (pauseBtn && !pauseBtn.contains(e.target) && !pauseMenu?.contains(e.target)) {
      pauseMenu?.classList.remove("is-open");
    }
  });
  
  const profileSelect = document.getElementById("profileSelect");
  profileSelect?.addEventListener("change", async (e) => {
    const newProfileId = e.target.value;
    const profileName = e.target.options[e.target.selectedIndex].text;
    try {
      if (boundDeviceId) {
        const updated = await updateDevice(boundDeviceId, { profileId: newProfileId });
        activeProfileId = updated?.profileId || newProfileId;
      } else {
        // fallback: update global active profile via background
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ type: "SET_MODE", mode: newProfileId }, (resp) => {
            if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
            if (resp?.ok) return resolve(true);
            reject(new Error('SET_MODE failed'));
          });
        });
        activeProfileId = newProfileId;
      }
      showToast(`Applied ${profileName}`);
    } catch (_) {
      // revert UI
      if (activeProfileId) e.target.value = activeProfileId;
      showToast('Failed to apply profile', 'error');
    }
  });
  
  const openDashboard = document.getElementById("openDashboard");
  openDashboard?.addEventListener("click", () => {
    const origin = preferredOrigin || API_ORIGINS[0];
    chrome.tabs.create({ url: `${origin}/#devices` });
  });
}

async function loadData() {
  try {
    const state = await fetchJSON("/api/state");
    devices = state.devices || [];
    profiles = state.profiles || [
      { id: "default", name: "Default" },
      { id: "school", name: "School" },
      { id: "focus", name: "Focus" }
    ];
    if (typeof state.extensionBinding !== "undefined") {
      boundDeviceId = state.extensionBinding || null;
    }

    const boundDevice = boundDeviceId ? devices.find((d) => d.id === boundDeviceId) : null;

    if (boundDevice) {
      activeProfileId = boundDevice.profileId || activeProfileId;
      globalPauseUntil = boundDevice.pausedUntil || null;
      if (typeof boundDevice.enabled === "boolean") {
        isProtectionOn = boundDevice.enabled;
      }
    } else {
      activeProfileId = state.activeProfile || activeProfileId;
      globalPauseUntil = state.pausedUntil || null;
      if (typeof state.enabledGlobal === "boolean") {
        isProtectionOn = state.enabledGlobal;
      }
    }
    const activeListsFromState = extractActiveLists(state);
    if (activeListsFromState !== null) {
      metrics.activeLists = activeListsFromState;
    }
    if (!quickStateReady && Array.isArray(state.logs)) {
      const fallbackMetrics = deriveMetricsFromLogs(state.logs);
      metrics.blockedToday = fallbackMetrics.blockedToday;
      metrics.blockedTotal = fallbackMetrics.blockedTotal;
    }
    
    const profileSelect = document.getElementById("profileSelect");
    if (profileSelect) {
      profileSelect.innerHTML = profiles.map(p => 
        `<option value="${p.id}">${p.name}</option>`
      ).join("");
      if (activeProfileId) {
        profileSelect.value = activeProfileId;
      }
    }
    
    const statusPill = document.getElementById("statusPill");
    if (statusPill) {
      statusPill.textContent = "Connected";
      statusPill.className = "pill connected";
    }
  } catch (error) {
    console.error("Load error:", error);
    const statusPill = document.getElementById("statusPill");
    if (statusPill) {
      statusPill.textContent = "Offline";
      statusPill.className = "pill paused";
    }
  }
}

function render() {
  renderHomeView();
  renderDevicesView();
  savePopupCache();
}

function renderHomeView() {
  const shieldBtn = document.getElementById("shieldBtn");
  const shieldLabel = document.getElementById("shieldLabel");
  const protectionToggle = document.getElementById("protectionToggle");
  const statusText = document.getElementById("statusText");
  const isPaused = isGlobalPauseActive();
  
  if (shieldBtn && shieldLabel) {
    shieldBtn.classList.toggle("is-paused", isPaused);
    if (isPaused) {
      shieldBtn.classList.remove("is-off");
      shieldLabel.textContent = "PAUSED";
    } else if (isProtectionOn) {
      shieldBtn.classList.remove("is-off");
      shieldLabel.textContent = "ON";
    } else {
      shieldBtn.classList.add("is-off");
      shieldLabel.textContent = "OFF";
    }

    shieldBtn.setAttribute("aria-pressed", String(isProtectionOn && !isPaused));
  }
  
  if (protectionToggle) {
    protectionToggle.checked = isProtectionOn;
  }
  
  if (statusText) {
    if (isPaused) {
      statusText.textContent = "Paused";
    } else {
      statusText.textContent = isProtectionOn ? "Protected" : "Disabled";
    }
  }

  const footerDot = document.querySelector(".status-dot");
  const footerText = document.querySelector(".footer__status span:last-child");
  if (footerDot && footerText) {
    footerDot.classList.remove("paused", "off");

    if (isPaused) {
      footerDot.classList.add("paused");
      footerText.textContent = "Protection is paused";
    } else if (!isProtectionOn) {
      footerDot.classList.add("off");
      footerText.textContent = "Protection is disabled";
    } else {
      footerText.textContent = "Protection is active";
    }
  }
  
  const blockedToday = document.getElementById("blockedToday");
  const blockedTotal = document.getElementById("blockedTotal");
  const activeLists = document.getElementById("activeLists");
  
  if (blockedToday) blockedToday.textContent = formatNumber(metrics.blockedToday);
  if (blockedTotal) blockedTotal.textContent = formatNumber(metrics.blockedTotal);
  if (activeLists) {
    if (Array.isArray(metrics.activeLists) && metrics.activeLists.length) {
      activeLists.textContent = metrics.activeLists.join(", ");
    } else if (Array.isArray(metrics.activeLists)) {
      activeLists.textContent = "No lists enabled";
    } else {
      activeLists.textContent = "--";
    }
  }

  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    if (isPaused) {
      pauseBtn.classList.add("is-paused");
      pauseBtn.textContent = getPauseCountdownLabel(globalPauseUntil);
    } else {
      pauseBtn.classList.remove("is-paused");
      pauseBtn.innerHTML = "Pause &#9662;";
    }
  }

  const profileSelect = document.getElementById("profileSelect");
  if (profileSelect && activeProfileId) {
    profileSelect.value = activeProfileId;
  }
}

function renderDevicesView() {
  const deviceList = document.getElementById("deviceList");
  if (!deviceList) return;
  
  if (devices.length === 0) {
    deviceList.innerHTML = '<p style="text-align:center;color:#94A3B8;padding:20px;">No devices found</p>';
    return;
  }
  
  deviceList.innerHTML = devices.map(device => createDeviceCard(device)).join("");
  
  deviceList.querySelectorAll(".device-card").forEach((card, index) => {
    const device = devices[index];
    
    const shieldToggle = card.querySelector(".device-shield-toggle");
    shieldToggle?.addEventListener("change", async (e) => {
      try {
        await updateDevice(device.id, { enabled: e.target.checked });
        showToast(`${device.name} ${e.target.checked ? "enabled" : "disabled"}`);
      } catch (error) {
        showToast("Failed to update device", "error");
        e.target.checked = !e.target.checked;
      }
    });
    
    const profileSelect = card.querySelector(".device-profile-select");
    profileSelect?.addEventListener("change", async (e) => {
      try {
        await updateDevice(device.id, { profileId: e.target.value });
        const profileName = e.target.options[e.target.selectedIndex].text;
        showToast(`Applied ${profileName} to ${device.name}`);
      } catch (error) {
        showToast("Failed to update profile", "error");
      }
    });
    
    const pauseBtn = card.querySelector(".device-pause-btn");
    const pauseMenu = card.querySelector(".device-pause-menu");
    
    if (pauseBtn && pauseMenu) {
      pauseBtn.addEventListener("click", () => {
        pauseMenu.classList.toggle("is-open");
      });
      
      pauseMenu.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const minutes = parseInt(e.target.dataset.minutes);
          await handleDevicePause(device.id, device.name, minutes);
          pauseMenu.classList.remove("is-open");
        });
      });
    }
  });
}

function createDeviceCard(device) {
  const isPaused = device.pausedUntil && new Date(device.pausedUntil) > new Date();
  const status = isPaused ? "paused" : (device.enabled ? "active" : "off");
  const statusText = isPaused ? "PAUSED" : (device.enabled ? "ACTIVE" : "OFF");
  
  let pauseBtnText = "Pause &#9662;";
  let pauseBtnClass = "device-pause-btn";
  
  if (isPaused) {
    const remaining = Math.ceil((new Date(device.pausedUntil) - new Date()) / 60000);
    pauseBtnText = formatTime(remaining);
    pauseBtnClass += " is-paused";
  }
  
  return `
    <div class="device-card">
      <div class="device-card__header">
        <div class="device-card__name">${device.name}</div>
        <div class="device-card__status ${status}">${statusText}</div>
      </div>
      <div class="device-card__controls">
        <div class="device-control-row">
          <div class="device-control-row__label">Shield:</div>
          <div class="device-control-row__input">
            <label class="sw">
              <input type="checkbox" class="device-shield-toggle" role="switch" ${device.enabled ? "checked" : ""} />
              <span class="sw__track"><span class="sw__thumb"></span></span>
            </label>
          </div>
        </div>
        <div class="device-control-row">
          <div class="device-control-row__label">Profile:</div>
          <div class="device-control-row__input">
            <select class="select device-profile-select">
              ${profiles.map(p => `<option value="${p.id}" ${p.id === device.profileId ? "selected" : ""}>${p.name}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="device-control-row">
          <div class="device-control-row__label">Pause:</div>
          <div class="device-control-row__input">
            <div class="device-pause-wrapper">
              <button class="${pauseBtnClass}">${pauseBtnText}</button>
              <div class="device-pause-menu">
                <button data-minutes="15">15 min</button>
                <button data-minutes="30">30 min</button>
                <button data-minutes="60">1 hour</button>
                <button data-minutes="240">4 hours</button>
                <button data-minutes="1440">24 hours</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function updateDevice(deviceId, payload) {
  const origin = preferredOrigin || API_ORIGINS[0];
  const res = await fetch(`${origin}/api/devices/${deviceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const updated = await res.json();
  const idx = devices.findIndex((d) => d.id === updated.id);
  if (idx !== -1) {
    devices[idx] = { ...devices[idx], ...updated };
  } else {
    devices.push(updated);
  }
  if (boundDeviceId === updated.id) {
    if (typeof updated.enabled === "boolean") {
      isProtectionOn = updated.enabled;
    }
    if (typeof updated.profileId !== "undefined") {
      activeProfileId = updated.profileId || activeProfileId;
    }
    globalPauseUntil = updated.pausedUntil || null;
  }
  return updated;
}

async function handlePause(minutes) {
  try {
    const pauseUntil = new Date(Date.now() + minutes * 60000).toISOString();
    for (const device of devices) {
      await updateDevice(device.id, { pausedUntil: pauseUntil });
    }
    
    globalPauseUntil = pauseUntil;
    renderHomeView();
    savePopupCache();
    
    showToast(`Paused for ${formatTime(minutes)}`);
  } catch (error) {
    showToast("Failed to pause", "error");
  }
}

async function handleDevicePause(deviceId, deviceName, minutes) {
  try {
    const until = new Date(Date.now() + minutes * 60000).toISOString();
    const updated = await updateDevice(deviceId, { pausedUntil: until });
    if (boundDeviceId === deviceId) {
      globalPauseUntil = updated?.pausedUntil || until;
      renderHomeView();
    }
    renderDevicesView();
    showToast(`${deviceName} paused for ${formatTime(minutes)}`);
  } catch (error) {
    showToast("Failed to pause device", "error");
  }
}

function formatTime(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function showToast(message, type = "success") {
  const toastRoot = document.getElementById("toastRoot");
  if (!toastRoot) return;
  
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  
  toastRoot.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

async function loadQuickState() {
  if (!chrome?.runtime?.sendMessage) return null;
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 600);

    chrome.runtime.sendMessage({ type: "GET_QUICK_STATE" }, (response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }

      if (response) {
        applyQuickState(response);
      }

      resolve(response || null);
    });
  });
}

function applyQuickState(snapshot) {
  quickStateReady = true;

  if (typeof snapshot?.boundDeviceId !== 'undefined') {
    boundDeviceId = snapshot.boundDeviceId;
  }

  const stats = snapshot?.blocking?.stats;
  if (stats) {
    if (typeof stats.totalBlocked !== "undefined") {
      const total = Number(stats.totalBlocked);
      if (Number.isFinite(total)) {
        metrics.blockedTotal = total;
      }
    }
    if (typeof stats.daily?.count !== "undefined") {
      const daily = Number(stats.daily.count);
      if (Number.isFinite(daily)) {
        metrics.blockedToday = daily;
      }
    }
  }

  const rulesets = snapshot?.blocking?.rulesets;
  if (Array.isArray(rulesets)) {
    metrics.activeLists = rulesets.filter(r => r.enabled).map(r => r.label);
  }

  if (Array.isArray(snapshot?.blocking?.activeRulesetIds)) {
    isProtectionOn = snapshot.blocking.activeRulesetIds.length > 0;
  }

  // If we know the bound device and we have full devices loaded, hydrate home view from that device
  if (boundDeviceId && Array.isArray(devices)) {
    const d = devices.find(x => x.id === boundDeviceId);
    if (d) {
      isProtectionOn = !!d.enabled;
      activeProfileId = d.profileId || activeProfileId;
      globalPauseUntil = d.pausedUntil || globalPauseUntil;
    }
  }

  renderHomeView();
  savePopupCache();
}

async function fetchWithTimeout(url, options = {}, timeout = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJSON(path) {
  const attemptOrigin = async (origin) => {
    const res = await fetchWithTimeout(`${origin}${path}`, {}, 1500);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    preferredOrigin = origin;
    return data;
  };

  const origins = preferredOrigin
    ? [preferredOrigin, ...API_ORIGINS.filter((origin) => origin !== preferredOrigin)]
    : [...API_ORIGINS];

  let lastError;
  for (const origin of origins) {
    try {
      return await attemptOrigin(origin);
    } catch (error) {
      lastError = error;
      preferredOrigin = null;
    }
  }

  throw lastError || new Error("All API origins failed");
}

async function hydrateFromCache() {
  if (!chrome?.storage?.local?.get) return null;
  return new Promise((resolve) => {
    chrome.storage.local.get(POPUP_CACHE_KEY, (result) => {
      if (chrome.runtime?.lastError) {
        resolve(null);
        return;
      }

      const cache = result?.[POPUP_CACHE_KEY];
      if (cache && typeof cache === "object") {
        if (typeof cache.isProtectionOn === "boolean") {
          isProtectionOn = cache.isProtectionOn;
        }

        if (typeof cache.globalPauseUntil === "string") {
          globalPauseUntil = cache.globalPauseUntil;
        }

        if (typeof cache.activeProfileId === "string") {
          activeProfileId = cache.activeProfileId;
        }

        if (cache.metrics && typeof cache.metrics === "object") {
          if (typeof cache.metrics.blockedToday === "number") {
            metrics.blockedToday = cache.metrics.blockedToday;
          }
          if (typeof cache.metrics.blockedTotal === "number") {
            metrics.blockedTotal = cache.metrics.blockedTotal;
          }
          if (Array.isArray(cache.metrics.activeLists)) {
            metrics.activeLists = cache.metrics.activeLists.slice();
          }
        }
      }

      resolve(cache || null);
    });
  });
}

function savePopupCache() {
  if (!chrome?.storage?.local?.set) return;
  const payload = {
    isProtectionOn,
    globalPauseUntil,
    activeProfileId,
    metrics: {
      blockedToday: typeof metrics.blockedToday === "number" ? metrics.blockedToday : null,
      blockedTotal: typeof metrics.blockedTotal === "number" ? metrics.blockedTotal : null,
      activeLists: Array.isArray(metrics.activeLists) ? metrics.activeLists.slice() : []
    }
  };

  chrome.storage.local.set({ [POPUP_CACHE_KEY]: payload }, () => {});
}

function extractActiveLists(state) {
  const blocklists = state?.filters?.blocklists;
  if (!Array.isArray(blocklists)) return null;
  return blocklists
    .filter((item) => item.enabled !== false)
    .map((item) => item.name)
    .filter(Boolean);
}

function deriveMetricsFromLogs(logs) {
  const todayKey = new Date().toISOString().slice(0, 10);
  let blockedTotal = 0;
  let blockedToday = 0;

  for (const entry of logs) {
    if (entry?.action !== "blocked") continue;
    blockedTotal += 1;
    const entryDate = normalizeLogDate(entry.time);
    if (entryDate === todayKey) {
      blockedToday += 1;
    }
  }

  return { blockedToday, blockedTotal };
}

function normalizeLogDate(raw) {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatNumber(value) {
  if (value === null || typeof value === "undefined") {
    return "--";
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return number.toLocaleString();
}

function isGlobalPauseActive() {
  if (!globalPauseUntil) return false;
  const until = new Date(globalPauseUntil).getTime();
  if (!Number.isFinite(until)) {
    globalPauseUntil = null;
    return false;
  }
  if (until <= Date.now()) {
    globalPauseUntil = null;
    return false;
  }
  return true;
}

function getPauseCountdownLabel(untilIso) {
  if (!untilIso) return "Pause";
  const until = new Date(untilIso).getTime();
  if (!Number.isFinite(until)) return "Pause";
  const diffMs = until - Date.now();
  if (diffMs <= 0) {
    globalPauseUntil = null;
    return "Pause";
  }
  const minutes = Math.ceil(diffMs / 60000);
  return `Resume in ${formatTime(minutes)}`;
}
