const API = typeof browser !== 'undefined' ? browser : chrome;

const rulesetListEl = document.getElementById('rulesetList');
const customHostForm = document.getElementById('customHostForm');
const customHostInput = document.getElementById('customHostInput');
const customHostList = document.getElementById('customHostList');
const customHostEmpty = document.getElementById('customHostEmpty');
const resetStatsBtn = document.getElementById('resetStatsBtn');
const blockingStatusEl = document.getElementById('blockingStatus');

const formatNumber = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
};

function siteEnabledValue(entry) {
  if (!entry || typeof entry.enabled === 'undefined') return true;
  return Boolean(entry.enabled);
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

function renderSites(sites) {
  const tbody = document.querySelector('#sitesTable tbody');
  tbody.innerHTML = "";
  const origins = Object.keys(sites).sort();
  if (origins.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = "No per-site preferences yet.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  for (const origin of origins) {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    td1.textContent = origin;
    const td2 = document.createElement('td');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = siteEnabledValue(sites[origin]);
    chk.addEventListener('change', async () => {
      chk.disabled = true;
      try {
        await API.runtime.sendMessage({ type: 'SET_SITE_PREFERENCE', origin, enabled: chk.checked });
        const latest = await getState();
        renderSites(latest.sites || {});
      } catch (e) {
        console.error('Unable to update site preference', e);
        chk.checked = !chk.checked;
      } finally {
        chk.disabled = false;
      }
    });
    td2.appendChild(chk);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  }
}

function renderRulesets(blocking) {
  if (!rulesetListEl) return;
  rulesetListEl.innerHTML = "";
  if (!blocking || !blocking.hasDnr) {
    const warn = document.createElement('p');
    warn.className = 'muted status-text warning';
    warn.textContent = 'Network blocking requires a Chromium-based browser with MV3 support.';
    rulesetListEl.appendChild(warn);
    return;
  }
  blocking.rulesets.forEach((ruleset) => {
    const label = document.createElement('label');
    label.className = 'toggle-item';

    const textWrap = document.createElement('div');
    textWrap.style.display = 'flex';
    textWrap.style.flexDirection = 'column';
    textWrap.style.gap = '2px';

    const title = document.createElement('strong');
    title.textContent = ruleset.label;

    const subtitle = document.createElement('span');
    subtitle.textContent = ruleset.defaultEnabled ? 'Recommended for all devices' : 'Optional layer';

    textWrap.appendChild(title);
    textWrap.appendChild(subtitle);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(ruleset.enabled);
    checkbox.dataset.rulesetId = ruleset.id;
    checkbox.addEventListener('change', async (event) => {
      checkbox.disabled = true;
      try {
        const response = await API.runtime.sendMessage({
          type: 'SET_BLOCKING_RULESET',
          rulesetId: ruleset.id,
          enabled: event.target.checked,
        });
        if (response?.blocking) {
          updateBlockingUI(response.blocking);
        }
      } catch (error) {
        console.error('Unable to update blocklist ruleset', error);
        checkbox.checked = !event.target.checked;
      } finally {
        checkbox.disabled = false;
      }
    });

    label.appendChild(textWrap);
    label.appendChild(checkbox);
    rulesetListEl.appendChild(label);
  });
}

function renderCustomHosts(blocking) {
  if (!customHostList || !customHostEmpty) return;
  customHostList.innerHTML = '';
  const hosts = Array.isArray(blocking?.customBlocklist) ? blocking.customBlocklist : [];
  if (hosts.length === 0) {
    customHostEmpty.style.display = 'block';
    return;
  }
  customHostEmpty.style.display = 'none';
  hosts.forEach((host) => {
    const item = document.createElement('li');
    item.className = 'chip';
    const text = document.createElement('span');
    text.textContent = host;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Remove ${host} from custom blocklist`);
    btn.textContent = '×';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        const response = await API.runtime.sendMessage({ type: 'REMOVE_CUSTOM_BLOCK_HOST', value: host });
        if (response?.blocking) {
          updateBlockingUI(response.blocking);
        }
      } catch (error) {
        console.error('Unable to remove custom host', error);
      } finally {
        btn.disabled = false;
      }
    });
    item.appendChild(text);
    item.appendChild(btn);
    customHostList.appendChild(item);
  });
}

function updateBlockingStatus(blocking) {
  if (!blockingStatusEl) return;
  if (!blocking || !blocking.hasDnr) {
    blockingStatusEl.textContent = 'Network blocking is disabled in this browser.';
    blockingStatusEl.classList.add('warning');
    blockingStatusEl.classList.remove('success');
    return;
  }
  const stats = blocking.stats || {};
  const todayCount = stats.daily && typeof stats.daily.count !== 'undefined' ? stats.daily.count : 0;
  blockingStatusEl.textContent = `Requests blocked today: ${formatNumber(todayCount)} · Total: ${formatNumber(stats.totalBlocked)}`;
  blockingStatusEl.classList.remove('warning');
  blockingStatusEl.classList.add('success');
}

function updateBlockingUI(blocking) {
  renderRulesets(blocking);
  renderCustomHosts(blocking);
  updateBlockingStatus(blocking);
}

async function refreshBlockingConfig() {
  try {
    const response = await API.runtime.sendMessage({ type: 'GET_BLOCKING_CONFIG' });
    if (response?.blocking) {
      updateBlockingUI(response.blocking);
    }
  } catch (error) {
    console.error('Unable to load blocking configuration', error);
  }
}

async function init() {
  const st = await getState();
  document.getElementById('mode').value = st.device.mode || "Default";
  document.getElementById('mode').addEventListener('change', async (e) => {
    const next = await getState();
    next.device.mode = e.target.value;
    await setState(next);
  });
  renderSites(st.sites || {});
  await refreshBlockingConfig();
}

init().catch(console.error);

if (customHostForm) {
  customHostForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = customHostInput?.value?.trim();
    if (!value) return;
    const submitButton = customHostForm.querySelector('button[type="submit"]');
    if (customHostInput) customHostInput.disabled = true;
    if (submitButton) submitButton.disabled = true;
    try {
      const response = await API.runtime.sendMessage({ type: 'ADD_CUSTOM_BLOCK_HOST', value });
      if (response?.blocking) {
        updateBlockingUI(response.blocking);
        if (response.ok && customHostInput) {
          customHostInput.value = '';
        }
      }
    } catch (error) {
      console.error('Unable to add custom host', error);
    } finally {
      if (customHostInput) customHostInput.disabled = false;
      if (submitButton) submitButton.disabled = false;
    }
  });
}

if (resetStatsBtn) {
  resetStatsBtn.addEventListener('click', async () => {
    resetStatsBtn.disabled = true;
    try {
      const response = await API.runtime.sendMessage({ type: 'RESET_BLOCKING_STATS' });
      if (response?.blocking) {
        updateBlockingUI(response.blocking);
      }
    } catch (error) {
      console.error('Unable to reset blocking stats', error);
    } finally {
      resetStatsBtn.disabled = false;
    }
  });
}
