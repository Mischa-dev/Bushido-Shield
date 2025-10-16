
const API = typeof browser !== 'undefined' ? browser : chrome;

const originEl = document.getElementById('origin');
const toggleBtn = document.getElementById('toggleBtn');
const modeSel = document.getElementById('mode');
const openOptions = document.getElementById('openOptions');
const deviceName = document.getElementById('deviceName');

function setToggleUI(enabled) {
  toggleBtn.classList.toggle('on', enabled);
  toggleBtn.classList.toggle('off', !enabled);
  toggleBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  toggleBtn.querySelector('.state').textContent = enabled ? 'ON' : 'OFF';
}

async function refresh() {
  const res = await API.runtime.sendMessage({ type: "GET_QUICK_STATE" });
  if (res.origin) originEl.textContent = res.origin;
  setToggleUI(res.enabled);
  modeSel.value = res.mode || "Default";
  deviceName.textContent = res.device || "This device";
}

toggleBtn.addEventListener('click', async () => {
  const res = await API.runtime.sendMessage({ type: "TOGGLE_SITE" });
  if (res && typeof res.enabled !== 'undefined') setToggleUI(res.enabled);
});

modeSel.addEventListener('change', async () => {
  await API.runtime.sendMessage({ type: "SET_MODE", mode: modeSel.value });
});

openOptions.addEventListener('click', async () => {
  await API.runtime.sendMessage({ type: "OPEN_OPTIONS" });
});

refresh().catch(console.error);
