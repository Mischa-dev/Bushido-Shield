const BROWSER_API = typeof browser !== "undefined" ? browser : null;
const CHROME_API = typeof chrome !== "undefined" ? chrome : null;
const API = BROWSER_API || CHROME_API || {};
const supportsPromiseMessaging = Boolean(BROWSER_API?.runtime?.sendMessage);

const MODE_LABELS = {
  Default: "Normal",
  School: "School",
  Focus: "Focus",
  Sleep: "Sleep",
  Custom: "Custom",
  Travel: "Travel",
  Gaming: "Gaming",
  Reading: "Reading",
};

const DEVICE_MODE_OPTIONS = [
  { value: "Default", label: "Normal" },
  { value: "School", label: "School" },
  { value: "Focus", label: "Focus" },
  { value: "Sleep", label: "Sleep" },
  { value: "Custom", label: "Custom" },
  { value: "Travel", label: "Travel" },
  { value: "Gaming", label: "Gaming" },
  { value: "Reading", label: "Reading" },
];

const DEFAULT_DEVICES = [
  { id: "this-browser", name: "This browser", type: "Laptop — Chromium", enabled: true, mode: "Default" },
  { id: "emma-tablet", name: "Emma's iPad", type: "Tablet — Screen time", enabled: false, mode: "School" },
  { id: "family-switch", name: "Family Switch", type: "Console — Living room", enabled: true, mode: "Gaming" },
  { id: "guest-tv", name: "Guest TV", type: "Smart TV — Upstairs", enabled: false, mode: "Sleep" },
  { id: "work-mbp", name: "Work MBP", type: "Laptop — Work", enabled: true, mode: "Focus" },
];

const toggleBtn = document.getElementById("toggleBtn");
const dialLabel = document.getElementById("dialLabel");
const statusPill = document.getElementById("statusPill");
const modeSel = document.getElementById("mode");
const deviceName = document.getElementById("deviceName");
const homePrimary = document.getElementById("homePrimary");
const homeSecondary = document.getElementById("homeSecondary");
const manageDevices = document.getElementById("manageDevices");
const footerSite = document.getElementById("footerSite");
const footerProfile = document.getElementById("footerProfile");
const blockedTodayEl = document.getElementById("blockedToday");
const blockedTotalEl = document.getElementById("blockedTotal");
const blocklistSummary = document.getElementById("blocklistSummary");
const deviceList = document.getElementById("deviceList");
const tabButtons = Array.from(document.querySelectorAll(".tab[data-target]"));
const views = Array.from(document.querySelectorAll(".view"));
const toastRoot = document.getElementById("toastRoot");

const menu = document.querySelector(".menu");
const menuButton = document.getElementById("menuButton");
const menuList = document.getElementById("menuList");
const menuPause = document.getElementById("menuPause");

let devices = [...DEFAULT_DEVICES];
let currentEnabled = true;
let currentOrigin = null;
let currentMode = "Default";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomLatency = () => 150 + Math.floor(Math.random() * 150);

function runtimeSendMessage(message) {
  if (!API?.runtime?.sendMessage) {
    return Promise.reject(new Error("Runtime messaging unavailable"));
  }
  if (supportsPromiseMessaging) {
    return API.runtime.sendMessage(message);
  }
  return new Promise((resolve, reject) => {
    API.runtime.sendMessage(message, (response) => {
      const err = API.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
      } else {
        resolve(response);
      }
    });
  });
}

function toast(message) {
  if (!toastRoot) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  toastRoot.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 2500);
}

async function withLatency(target, action) {
  if (target) target.classList.add("is-loading");
  try {
    await wait(randomLatency());
    return await action();
  } finally {
    if (target) target.classList.remove("is-loading");
  }
}

function hostFromOrigin(origin) {
  if (!origin) return "—";
  try {
    return new URL(origin).host;
  } catch (e) {
    return origin;
  }
}

function labelForMode(mode) {
  return MODE_LABELS[mode] || mode || MODE_LABELS.Default;
}

function updateStatusPill(enabled) {
  if (!statusPill) return;
  const label = enabled ? "Connected" : "Paused";
  statusPill.textContent = label;
  statusPill.classList.toggle("pill--ok", enabled);
  statusPill.classList.toggle("pill--paused", !enabled);
  statusPill.classList.toggle("connected", enabled);
  statusPill.classList.toggle("paused", !enabled);
}

function updatePrimaryCta(enabled) {
  const actionLabel = enabled ? "Pause 15m" : "Resume";
  if (homePrimary) {
    homePrimary.textContent = actionLabel;
    homePrimary.dataset.intent = enabled ? "pause" : "resume";
  }
  if (menuPause) {
    menuPause.textContent = actionLabel;
    const intent = enabled ? "pause" : "resume";
    menuPause.dataset.intent = intent;
    menuPause.dataset.action = intent === "pause" ? "pause" : "resume";
  }
}

function setToggleUI(enabled) {
  currentEnabled = Boolean(enabled);
  if (toggleBtn) {
    toggleBtn.dataset.state = currentEnabled ? "on" : "off";
    toggleBtn.classList.toggle("on", currentEnabled);
    toggleBtn.classList.toggle("off", !currentEnabled);
    toggleBtn.setAttribute("aria-checked", currentEnabled ? "true" : "false");
  }
  if (dialLabel) {
    dialLabel.textContent = currentEnabled ? "ON" : "OFF";
  }
  updateStatusPill(currentEnabled);
  updatePrimaryCta(currentEnabled);
}

function setModeUI(mode) {
  const fallback = MODE_LABELS[mode] ? mode : "Default";
  currentMode = fallback;
  if (modeSel) modeSel.value = fallback;
  if (footerProfile) footerProfile.textContent = labelForMode(fallback);
}

function updateBlockingSummary(blocking) {
  if (!blockedTodayEl || !blockedTotalEl || !blocklistSummary) return;
  const stats = blocking?.stats || {};
  const todayCount = Number(stats.daily?.count || 0);
  const totalCount = Number(stats.totalBlocked || 0);
  blockedTodayEl.textContent = Number.isFinite(todayCount) ? todayCount.toLocaleString() : "0";
  blockedTotalEl.textContent = Number.isFinite(totalCount) ? totalCount.toLocaleString() : "0";

  if (!blocking) {
    blocklistSummary.textContent = "Unavailable";
    return;
  }
  const active = Array.isArray(blocking.activeRulesetIds) ? blocking.activeRulesetIds.length : 0;
  const total = typeof blocking.totalRulesets === "number" ? blocking.totalRulesets : active;
  const custom = Array.isArray(blocking.customBlocklist) ? blocking.customBlocklist.length : 0;
  const customLabel = `${custom} custom`;
  blocklistSummary.textContent = `${active}/${total} active • ${customLabel}`;
}

function showView(id) {
  views.forEach((view) => {
    const isActive = view.id === id;
    view.classList.toggle("is-active", isActive);
  });
  tabButtons.forEach((tab) => {
    const isActive = tab.dataset.target === id;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

tabButtons.forEach((tab) => {
  tab.addEventListener("click", (event) => {
    event.preventDefault();
    showView(tab.dataset.target);
  });
});

function createDeviceRow(device) {
  const row = document.createElement("article");
  row.className = "device-row";

  const meta = document.createElement("div");
  meta.className = "device-row__meta";
  const nameEl = document.createElement("span");
  nameEl.className = "device-row__name";
  nameEl.textContent = device.name;
  const typeEl = document.createElement("span");
  typeEl.className = "device-row__type";
  typeEl.textContent = device.type;
  meta.append(nameEl, typeEl);

  const controls = document.createElement("div");
  controls.className = "device-row__controls";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "switch";
  toggle.dataset.state = device.enabled ? "on" : "off";
  toggle.setAttribute("role", "switch");
  toggle.setAttribute("aria-checked", device.enabled ? "true" : "false");
  toggle.title = `Toggle protection for ${device.name}`;
  toggle.setAttribute("aria-label", `Turn protection ${device.enabled ? "off" : "on"} for ${device.name}`);

  const track = document.createElement("span");
  track.className = "switch__track";
  const thumb = document.createElement("span");
  thumb.className = "switch__thumb";
  track.appendChild(thumb);

  const switchText = document.createElement("span");
  switchText.className = "switch__text";
  switchText.textContent = device.enabled ? "On" : "Off";

  toggle.append(track, switchText);

  const selectWrap = document.createElement("label");
  selectWrap.className = "device-row__select field select--small";
  const selectLabel = document.createElement("span");
  selectLabel.className = "label";
  selectLabel.textContent = "Profile";

  const selectBox = document.createElement("div");
  selectBox.className = "select select--small";
  const select = document.createElement("select");
  select.setAttribute("aria-label", `Select profile for ${device.name}`);

  DEVICE_MODE_OPTIONS.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    select.appendChild(option);
  });
  select.value = DEVICE_MODE_OPTIONS.some((opt) => opt.value === device.mode) ? device.mode : "Default";

  selectBox.appendChild(select);
  selectWrap.append(selectLabel, selectBox);

  controls.append(toggle, selectWrap);
  row.append(meta, controls);

  toggle.addEventListener("click", async () => {
    const previous = device.enabled;
    try {
      await withLatency(toggle, async () => {
        device.enabled = !device.enabled;
        toggle.dataset.state = device.enabled ? "on" : "off";
        toggle.setAttribute("aria-checked", device.enabled ? "true" : "false");
        switchText.textContent = device.enabled ? "On" : "Off";
        toggle.setAttribute("aria-label", `Turn protection ${device.enabled ? "off" : "on"} for ${device.name}`);
        await persistDevices();
      });
      toast(`${device.name}: ${device.enabled ? "Protection on" : "Protection off"}`);
    } catch (error) {
      console.error("Unable to update device", error);
      device.enabled = previous;
      renderDevices();
      toast("Could not update device. Try again.");
    }
  });

  select.addEventListener("change", async (event) => {
    const target = event.currentTarget;
    const wrapper = target.closest(".select");
    const previous = device.mode;
    try {
      await withLatency(wrapper, async () => {
        device.mode = target.value;
        await persistDevices();
      });
      toast(`${device.name}: profile set to ${labelForMode(device.mode)}`);
    } catch (error) {
      console.error("Unable to update device mode", error);
      device.mode = previous;
      target.value = previous;
      toast("Could not save profile. Try again.");
    }
  });

  return row;
}

function renderDevices() {
  if (!deviceList) return;
  deviceList.innerHTML = "";
  const top = devices.slice(0, 4);
  if (!top.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No devices to show yet.";
    deviceList.appendChild(empty);
    return;
  }
  top.forEach((device) => {
    const row = createDeviceRow(device);
    deviceList.appendChild(row);
  });
}

function storageGet(key) {
  if (!API.storage?.local) return Promise.resolve({});
  const getter = API.storage.local.get.bind(API.storage.local);
  if (getter.length <= 1) {
    return getter(key);
  }
  return new Promise((resolve) => {
    getter(key, (value) => resolve(value || {}));
  });
}

function storageSet(value) {
  if (!API.storage?.local) return Promise.resolve();
  const setter = API.storage.local.set.bind(API.storage.local);
  if (setter.length <= 1) {
    return setter(value);
  }
  return new Promise((resolve) => {
    setter(value, () => resolve());
  });
}

async function persistDevices() {
  try {
    await storageSet({ uiDevices: devices });
  } catch (error) {
    console.warn("Unable to persist devices", error);
  }
}

async function loadDevices() {
  try {
    const stored = await storageGet("uiDevices");
    if (stored && Array.isArray(stored.uiDevices)) {
      devices = stored.uiDevices.map((dev) => ({
        ...dev,
        mode: dev.mode || "Default",
        enabled: typeof dev.enabled === "boolean" ? dev.enabled : true,
      }));
    } else {
      devices = [...DEFAULT_DEVICES];
    }
  } catch (error) {
    console.warn("Unable to load stored devices", error);
    devices = [...DEFAULT_DEVICES];
  }
  renderDevices();
}

async function handleSiteToggle(triggerElement) {
  const previous = currentEnabled;
  try {
    await withLatency(triggerElement || toggleBtn, async () => {
      const response = await runtimeSendMessage({ type: "TOGGLE_SITE" });
      if (!response || typeof response.enabled === "undefined") {
        throw new Error("No response");
      }
      setToggleUI(response.enabled);
      toast(response.enabled ? "Protection resumed" : "Protection paused for this site");
      await refresh();
    });
  } catch (error) {
    console.error("Unable to toggle site", error);
    setToggleUI(previous);
    toast("Unable to update protection. Please try again.");
  }
}

function closeMenu() {
  if (!menu) return;
  menu.dataset.open = "false";
  if (menuButton) menuButton.setAttribute("aria-expanded", "false");
}

if (menuButton) {
  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!menu) return;
    const isOpen = menu?.dataset.open === "true";
    menu.dataset.open = isOpen ? "false" : "true";
    menuButton.setAttribute("aria-expanded", isOpen ? "false" : "true");
  });
}

if (menuList) {
  menuList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    if (!action) return;
    closeMenu();
    if (action === "dashboard") {
      runtimeSendMessage({ type: "OPEN_DASHBOARD" }).catch((error) => console.error(error));
    } else if (action === "options") {
      API.runtime.openOptionsPage();
    } else if (action === "pause" || action === "resume") {
      handleSiteToggle(menuPause).catch(() => {});
    }
  });
}

document.addEventListener("click", (event) => {
  if (!menu) return;
  if (!menu.contains(event.target)) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => handleSiteToggle(toggleBtn));
}

if (homePrimary) {
  homePrimary.addEventListener("click", () => handleSiteToggle(homePrimary));
}

if (homeSecondary) {
  homeSecondary.addEventListener("click", () => {
    runtimeSendMessage({ type: "OPEN_DASHBOARD" }).catch((error) => console.error(error));
  });
}

if (manageDevices) {
  manageDevices.addEventListener("click", () => {
    API.runtime.openOptionsPage();
  });
}

if (modeSel) {
  modeSel.addEventListener("change", async () => {
    const selectionWrapper = modeSel.closest(".select");
    const previous = currentMode;
    const next = modeSel.value;
    try {
      await withLatency(selectionWrapper, async () => {
        await runtimeSendMessage({ type: "SET_MODE", mode: next });
        setModeUI(next);
      });
      toast(`Profile set to ${labelForMode(next)}`);
      await refresh();
    } catch (error) {
      console.error("Unable to update profile", error);
      setModeUI(previous);
      if (modeSel) modeSel.value = previous;
      toast("Could not update profile. Try again.");
    }
  });
}

async function refresh() {
  try {
    const response = await runtimeSendMessage({ type: "GET_QUICK_STATE" });
    if (!response) return;
    currentOrigin = response.origin || null;
    setToggleUI(response.enabled !== false);
    setModeUI(response.mode || "Default");
    if (deviceName) {
      const valueEl = deviceName.querySelector(".device-chip__value");
      if (valueEl) valueEl.textContent = response.device || "This device";
    }
    if (footerSite) footerSite.textContent = hostFromOrigin(response.origin) || "—";
    updateBlockingSummary(response.blocking);
  } catch (error) {
    console.error("Unable to refresh popup state", error);
  }
}

showView("view-home");
loadDevices().catch((error) => console.error(error));
refresh().catch((error) => console.error(error));
