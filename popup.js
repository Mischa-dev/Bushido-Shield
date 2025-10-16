const API = typeof browser !== 'undefined' ? browser : chrome;

const originEl = document.getElementById('origin');
const toggleBtn = document.getElementById('toggleBtn');
const modeSel = document.getElementById('mode');
const openOptions = document.getElementById('openOptions');
const deviceName = document.getElementById('deviceName');
const deviceList = document.getElementById('deviceList');
const modeLabel = document.getElementById('modeLabel');
const navTabs = Array.from(document.querySelectorAll('.nav-item[data-target]'));
const pages = Array.from(document.querySelectorAll('.page'));

const MODE_LABELS = {
  Default: 'Normal',
  School: 'School',
  Focus: 'Focus',
  Sleep: 'Sleep',
  Custom: 'Custom',
  Travel: 'Travel',
  Gaming: 'Gaming',
  Reading: 'Reading',
};

const DEVICE_MODE_OPTIONS = [
  { value: 'Default', label: 'Normal' },
  { value: 'School', label: 'School' },
  { value: 'Focus', label: 'Focus' },
  { value: 'Sleep', label: 'Sleep' },
  { value: 'Custom', label: 'Custom' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Reading', label: 'Reading' },
];

const DEFAULT_DEVICES = [
  { id: 'this-browser', name: 'This browser', type: 'MacBook · Chromium', enabled: true, mode: 'Default' },
  { id: 'emma-tablet', name: "Emma's iPad", type: 'Tablet · Screen time', enabled: false, mode: 'School' },
  { id: 'family-switch', name: 'Family Switch', type: 'Console · Living room', enabled: true, mode: 'Gaming' },
  { id: 'guest-tv', name: 'Guest TV', type: 'Smart TV · Upstairs', enabled: false, mode: 'Sleep' },
];

let devices = [...DEFAULT_DEVICES];

function labelForMode(mode) {
  return MODE_LABELS[mode] || mode || MODE_LABELS.Default;
}

function setToggleUI(enabled) {
  toggleBtn.classList.toggle('on', enabled);
  toggleBtn.classList.toggle('off', !enabled);
  toggleBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  toggleBtn.querySelector('.state').textContent = enabled ? 'ON' : 'OFF';
  toggleBtn.setAttribute('aria-label', `${enabled ? 'Disable' : 'Enable'} ad blocking for this site`);
}

function setModeUI(mode) {
  const fallback = modeSel.querySelector(`option[value="${mode}"]`) ? mode : 'Default';
  modeSel.value = fallback;
  modeLabel.textContent = labelForMode(fallback);
}

function showPage(id) {
  pages.forEach((page) => {
    const isActive = page.id === id;
    page.classList.toggle('active', isActive);
  });
  navTabs.forEach((tab) => {
    const isActive = tab.dataset.target === id;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function storageGet(key) {
  if (!API.storage || !API.storage.local) {
    return Promise.resolve({});
  }
  const getter = API.storage.local.get.bind(API.storage.local);
  if (getter.length <= 1) {
    return getter(key);
  }
  return new Promise((resolve) => {
    getter(key, (result) => {
      if (API.runtime && API.runtime.lastError) {
        resolve({});
      } else {
        resolve(result || {});
      }
    });
  });
}

function storageSet(value) {
  if (!API.storage || !API.storage.local) {
    return Promise.resolve();
  }
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
  } catch (e) {
    console.warn('Unable to persist device preview', e);
  }
}

async function updateDevice(id, updates) {
  const idx = devices.findIndex((d) => d.id === id);
  if (idx === -1) return;
  devices[idx] = { ...devices[idx], ...updates };
  await persistDevices();
  renderDevices();
}

function createDeviceCard(device) {
  const card = document.createElement('article');
  card.className = 'device-card';
  card.dataset.enabled = String(device.enabled);

  const header = document.createElement('header');
  const meta = document.createElement('div');
  meta.className = 'meta';

  const nameEl = document.createElement('span');
  nameEl.className = 'name';
  nameEl.textContent = device.name;

  const typeEl = document.createElement('span');
  typeEl.className = 'type';
  typeEl.textContent = device.type;

  meta.appendChild(nameEl);
  meta.appendChild(typeEl);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'device-toggle';
  toggle.dataset.enabled = String(device.enabled);
  toggle.setAttribute('aria-pressed', device.enabled ? 'true' : 'false');
  toggle.setAttribute('aria-label', `${device.enabled ? 'Disable' : 'Enable'} ad blocking for ${device.name}`);
  toggle.addEventListener('click', () => {
    updateDevice(device.id, { enabled: !device.enabled }).catch(console.error);
  });

  header.appendChild(meta);
  header.appendChild(toggle);

  const controls = document.createElement('div');
  controls.className = 'controls';

  const status = document.createElement('span');
  status.className = 'status';
  status.textContent = device.enabled ? 'Ad blocking enabled' : 'Ad blocking disabled';

  const modeWrap = document.createElement('label');
  modeWrap.className = 'select';
  const modeLabelEl = document.createElement('span');
  modeLabelEl.textContent = 'Mode';

  const modeSelect = document.createElement('select');
  DEVICE_MODE_OPTIONS.forEach((mode) => {
    const option = document.createElement('option');
    option.value = mode.value;
    option.textContent = mode.label;
    modeSelect.appendChild(option);
  });
  modeSelect.value = device.mode && DEVICE_MODE_OPTIONS.some((opt) => opt.value === device.mode)
    ? device.mode
    : 'Default';
  modeSelect.addEventListener('change', (event) => {
    updateDevice(device.id, { mode: event.target.value }).catch(console.error);
  });

  modeWrap.appendChild(modeLabelEl);
  modeWrap.appendChild(modeSelect);
  controls.appendChild(status);
  controls.appendChild(modeWrap);

  card.appendChild(header);
  card.appendChild(controls);
  return card;
}

function renderDevices() {
  deviceList.innerHTML = '';
  if (devices.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No devices to preview yet.';
    deviceList.appendChild(empty);
    return;
  }
  devices.forEach((device) => {
    const card = createDeviceCard(device);
    deviceList.appendChild(card);
  });
}

async function loadDevices() {
  try {
    const stored = await storageGet('uiDevices');
    if (stored && Array.isArray(stored.uiDevices)) {
      devices = stored.uiDevices.map((dev) => ({
        ...dev,
        mode: dev.mode || 'Default',
        enabled: typeof dev.enabled === 'boolean' ? dev.enabled : true,
      }));
    } else {
      devices = [...DEFAULT_DEVICES];
    }
  } catch (e) {
    console.warn('Unable to load saved device preview', e);
    devices = [...DEFAULT_DEVICES];
  }
  renderDevices();
}

async function refresh() {
  const res = await API.runtime.sendMessage({ type: 'GET_QUICK_STATE' });
  if (res.origin) originEl.textContent = res.origin;
  setToggleUI(Boolean(res.enabled));
  setModeUI(res.mode || 'Default');
  deviceName.textContent = res.device || 'This device';
}

navTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    showPage(tab.dataset.target);
  });
});

showPage('home');
setModeUI(modeSel.value || 'Default');

openOptions.addEventListener('click', async () => {
  try {
    await API.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
  } catch (e) {
    console.error('Unable to open dashboard', e);
  }
});

toggleBtn.addEventListener('click', async () => {
  try {
    const res = await API.runtime.sendMessage({ type: 'TOGGLE_SITE' });
    if (res && typeof res.enabled !== 'undefined') setToggleUI(res.enabled);
  } catch (e) {
    console.error('Unable to toggle site', e);
  }
});

modeSel.addEventListener('change', async () => {
  const value = modeSel.value;
  try {
    await API.runtime.sendMessage({ type: 'SET_MODE', mode: value });
  } catch (e) {
    console.error('Unable to update mode', e);
  }
  setModeUI(value);
});

loadDevices().catch(console.error);
refresh().catch(console.error);
