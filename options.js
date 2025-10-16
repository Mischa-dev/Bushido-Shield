
const API = typeof browser !== 'undefined' ? browser : chrome;

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
    chk.checked = !!sites[origin].enabled;
    chk.addEventListener('change', async () => {
      const st = await getState();
      st.sites[origin] = st.sites[origin] || {};
      st.sites[origin].enabled = chk.checked;
      await setState(st);
    });
    td2.appendChild(chk);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
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
}

init().catch(console.error);
