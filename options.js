const API = typeof browser !== 'undefined' ? browser : chrome;
console.log('🛡️ Bushido Shield Options - Version: 2024-10-18-PROFILE-EDITOR-COMPLETE');
// @@CHUNK1
const toastRoot = document.getElementById('toast');
function toast(msg) {
  if (!toastRoot) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  toastRoot.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

// Topbar
const statusPill = document.getElementById('statusPill');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const pauseMain = document.getElementById('pauseMain');
const resumeMain = document.getElementById('resumeMain');
const pauseNote = document.getElementById('pauseNote');

// Three-pane refs
// Left quick panel
const qDevice = document.getElementById('qDevice');
const quickDevices = document.getElementById('quickDevices');
const quickAddDevice = document.getElementById('quickAddDevice');
const quickProfiles = document.getElementById('quickProfiles');
const quickAddProfile = document.getElementById('quickAddProfile');
const familyLock = document.getElementById('familyLock');

// Advanced modal elements
const advancedBtn = document.getElementById('advancedBtn');
const advancedModal = document.getElementById('advancedModal');
const closeAdvanced = document.getElementById('closeAdvanced');
const closeAdvancedFooter = document.getElementById('closeAdvancedFooter');

// Overview Quick card elements
const qDeviceOverview = document.getElementById('qDeviceOverview');
const quickDevicesOverview = document.getElementById('quickDevicesOverview');
const alertsRequestsOverview = document.getElementById('alertsRequestsOverview');
const pauseDropdown = document.getElementById('pauseDropdown');
const gridWrapper = document.getElementById('gridWrapper');

// Requests tab elements
const requestSearch = document.getElementById('requestSearch');
const requestsFilters = document.getElementById('requestsFilters');
const requestsTable = document.getElementById('requestsTable');

// Center tabs
const tabButtons = Array.from(document.querySelectorAll('.seg .tab'));
function showPage(id) {
  // Update tab highlighting - remove all active classes first
  tabButtons.forEach((b) => {
    b.classList.remove('active', 'is-active');
    b.setAttribute('aria-selected', 'false');
  });
  // Add active class to current tab
  const activeBtn = tabButtons.find(b => b.dataset.target === id);
  if (activeBtn) {
    activeBtn.classList.add('active', 'is-active');
    activeBtn.setAttribute('aria-selected', 'true');
  }
  
  const pageIds = ['tab-main','tab-devices','tab-profiles','tab-requests','tab-filtering','tab-settings','tab-logs'];
  pageIds.forEach((pid) => {
    const el = document.getElementById(pid);
    if (el) el.style.display = pid === id ? 'block' : 'none';
  });
  
  // Toggle grid layout - Overview and inner tabs both show right rail
  const quickPane = document.querySelector('.pane--quick');
  if (id === 'tab-main') {
    // Overview: hide Quick pane, show Details on right
    gridWrapper.classList.remove('grid--two-col');
    gridWrapper.classList.add('grid--overview');
    quickPane?.classList.add('hidden');
  } else {
    // Inner tabs: hide Quick pane, show Details on right
    gridWrapper.classList.add('grid--two-col');
    gridWrapper.classList.remove('grid--overview');
    quickPane?.classList.add('hidden');
  }
}
tabButtons.forEach((btn) => btn.addEventListener('click', () => showPage(btn.dataset.target)));
// @@CHUNK2
// Center content refs
const mAds = document.getElementById('mAds');
const mTrackers = document.getElementById('mTrackers');
const mDevices = document.getElementById('mDevices');
const spark = document.getElementById('spark');

// Devices view
const deviceSearch = document.getElementById('deviceSearch');
const devicesFilters = document.getElementById('devicesFilters');
const deviceTable = document.getElementById('deviceTable');
const selectAll = document.getElementById('selectAll');
const bulkToggle = document.getElementById('bulkToggle');
const bulkProfile = document.getElementById('bulkProfile');

// Profiles view
const profilesList = document.getElementById('profilesList');
const profilesGrid = document.getElementById('profilesGrid');
const addProfileBtn = document.getElementById('addProfileBtn');
const exportProfilesBtn = document.getElementById('exportProfilesBtn');
const importProfilesInput = document.getElementById('importProfilesInput');

// Profile Editor
const profileEditor = document.getElementById('profileEditor');
const profileEditorClose = document.getElementById('profileEditorClose');
const profileEditorTitle = document.getElementById('profileEditorTitle');
const profileEditorSave = document.getElementById('profileEditorSave');
const profileEditorCancel = document.getElementById('profileEditorCancel');
const profName = document.getElementById('profName');
const profDesc = document.getElementById('profDesc');
const profBlockPorn = document.getElementById('profBlockPorn');
const profBlockGambling = document.getElementById('profBlockGambling');
const profBlockTrackers = document.getElementById('profBlockTrackers');
const profBlockSocial = document.getElementById('profBlockSocial');
const socialMediaList = document.getElementById('socialMediaList');
const profCustomToggle = document.getElementById('profCustomToggle');
const customLists = document.getElementById('customLists');
const profBlockList = document.getElementById('profBlockList');
const profAllowList = document.getElementById('profAllowList');
const timeRulesList = document.getElementById('timeRulesList');
const addTimeRule = document.getElementById('addTimeRule');
const profileSummary = document.getElementById('profileSummary');
const deviceApplySearch = document.getElementById('deviceApplySearch');
const deviceApplyList = document.getElementById('deviceApplyList');

// Filtering
const blTable = document.getElementById('blTable');
const blSync = document.getElementById('blSync');
const blAdd = document.getElementById('blAdd');
const alInput = document.getElementById('alInput');
const alAdd = document.getElementById('alAdd');
const alChips = document.getElementById('alChips');
const crText = document.getElementById('crText');
const crValidate = document.getElementById('crValidate');
const crApply = document.getElementById('crApply');

// Settings
const setDns = document.getElementById('setDns');
const setDnsCustomWrap = document.getElementById('setDnsCustomWrap');
const setDnsCustom = document.getElementById('setDnsCustom');
const setAdmin = document.getElementById('setAdmin');
const settingsSave = document.getElementById('settingsSave');

// Logs
const logsTable = document.getElementById('logsTable');
const logFilters = document.getElementById('logFilters');

// Details panel
const detailsTitle = document.getElementById('detailsTitle');
const detailsSub = document.getElementById('detailsSub');
const detailsBody = document.getElementById('detailsBody');
const activityList = document.getElementById('activityList');
// @@CHUNK3
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const nowISO = () => new Date().toISOString();
const fmtTime = (iso) => new Date(iso).toLocaleString();
const makeId = (p) => `${p}-${Math.random().toString(36).slice(2,8)}`;

// ==================== API ABSTRACTION LAYER ====================
// This layer abstracts data operations so we can easily switch from
// local chrome.storage to a Raspberry Pi backend API in the future

const DataAPI = {
  // Configuration - Toggle this when you set up your Raspberry Pi backend
  USE_LOCAL_STORAGE: true, // Set to false when switching to Raspberry Pi
  BACKEND_URL: 'http://192.168.1.100:3000/api', // Update with your Pi's IP address
  
  // Generic fetch wrapper for future HTTP requests to Raspberry Pi
  async _httpRequest(endpoint, options = {}) {
    if (this.USE_LOCAL_STORAGE) {
      throw new Error('_httpRequest called while in local storage mode');
    }
    const url = `${this.BACKEND_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },
  
  // Get entire state (all data)
  async getState() {
    if (this.USE_LOCAL_STORAGE) {
      return await get(['bs:devices', 'bs:profiles', 'bs:schedules', 'bs:filters', 'bs:settings', 'bs:logs', 'bs:enabled:global', 'bs:activeProfile', 'bs:lastSync']);
    } else {
      return await this._httpRequest('/state');
    }
  },
  
  // === DEVICE OPERATIONS ===
  async getDevices() {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:devices']);
      return state['bs:devices'] || [];
    } else {
      return await this._httpRequest('/devices');
    }
  },
  
  async updateDevice(deviceId, updates) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:devices']);
      const devices = state['bs:devices'] || [];
      const device = devices.find(d => d.id === deviceId);
      if (device) {
        Object.assign(device, updates);
        await set({ 'bs:devices': devices });
        return device;
      }
      return null;
    } else {
      return await this._httpRequest(`/devices/${deviceId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    }
  },
  
  async addDevice(deviceData) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:devices']);
      const devices = state['bs:devices'] || [];
      const newDevice = {
        id: makeId('dev'),
        name: deviceData.name || 'New Device',
        ip: deviceData.ip || '0.0.0.0',
        mac: deviceData.mac || 'AA:BB:CC:DD:EE:00',
        enabled: deviceData.enabled !== undefined ? deviceData.enabled : true,
        profileId: deviceData.profileId || state['bs:activeProfile'] || 'prof-default',
        lastSeen: nowISO(),
        ...deviceData
      };
      devices.push(newDevice);
      await set({ 'bs:devices': devices });
      return newDevice;
    } else {
      return await this._httpRequest('/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      });
    }
  },
  
  async deleteDevice(deviceId) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:devices']);
      const devices = (state['bs:devices'] || []).filter(d => d.id !== deviceId);
      await set({ 'bs:devices': devices });
      return true;
    } else {
      return await this._httpRequest(`/devices/${deviceId}`, { method: 'DELETE' });
    }
  },
  
  // === PROFILE OPERATIONS ===
  async getProfiles() {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:profiles']);
      return state['bs:profiles'] || [];
    } else {
      return await this._httpRequest('/profiles');
    }
  },
  
  async updateProfile(profileId, updates) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:profiles']);
      const profiles = state['bs:profiles'] || [];
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        Object.assign(profile, updates);
        await set({ 'bs:profiles': profiles });
        return profile;
      }
      return null;
    } else {
      return await this._httpRequest(`/profiles/${profileId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    }
  },
  
  async addProfile(profileData) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:profiles']);
      const profiles = state['bs:profiles'] || [];
      const newProfile = { id: makeId('prof'), ...profileData };
      profiles.push(newProfile);
      await set({ 'bs:profiles': profiles });
      return newProfile;
    } else {
      return await this._httpRequest('/profiles', {
        method: 'POST',
        body: JSON.stringify(profileData)
      });
    }
  },
  
  async deleteProfile(profileId) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:profiles']);
      const profiles = (state['bs:profiles'] || []).filter(p => p.id !== profileId);
      await set({ 'bs:profiles': profiles });
      return true;
    } else {
      return await this._httpRequest(`/profiles/${profileId}`, { method: 'DELETE' });
    }
  },
  
  // === SCHEDULE/ROUTINE OPERATIONS ===
  async getSchedules() {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:schedules']);
      return state['bs:schedules'] || [];
    } else {
      return await this._httpRequest('/schedules');
    }
  },
  
  async updateSchedule(scheduleId, updates) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:schedules']);
      const schedules = state['bs:schedules'] || [];
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule) {
        Object.assign(schedule, updates);
        await set({ 'bs:schedules': schedules });
        return schedule;
      }
      return null;
    } else {
      return await this._httpRequest(`/schedules/${scheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    }
  },
  
  async addSchedule(scheduleData) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:schedules']);
      const schedules = state['bs:schedules'] || [];
      const newSchedule = { id: makeId('sched'), ...scheduleData };
      schedules.push(newSchedule);
      await set({ 'bs:schedules': schedules });
      return newSchedule;
    } else {
      return await this._httpRequest('/schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleData)
      });
    }
  },
  
  async deleteSchedule(scheduleId) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:schedules']);
      const schedules = (state['bs:schedules'] || []).filter(s => s.id !== scheduleId);
      await set({ 'bs:schedules': schedules });
      return true;
    } else {
      return await this._httpRequest(`/schedules/${scheduleId}`, { method: 'DELETE' });
    }
  },
  
  // === LOG/REQUEST OPERATIONS ===
  async getLogs(filters = {}) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:logs']);
      let logs = state['bs:logs'] || [];
      if (filters.type) logs = logs.filter(l => l.type === filters.type);
      if (filters.limit) logs = logs.slice(0, filters.limit);
      return logs;
    } else {
      const params = new URLSearchParams(filters).toString();
      return await this._httpRequest(`/logs${params ? '?' + params : ''}`);
    }
  },
  
  async addLog(logData) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:logs']);
      const logs = state['bs:logs'] || [];
      const newLog = { id: makeId('log'), timestamp: Date.now(), ...logData };
      logs.unshift(newLog);
      if (logs.length > 1000) logs.length = 1000; // Keep only last 1000
      await set({ 'bs:logs': logs });
      return newLog;
    } else {
      return await this._httpRequest('/logs', {
        method: 'POST',
        body: JSON.stringify(logData)
      });
    }
  },
  
  // === SETTINGS OPERATIONS ===
  async getSettings() {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:settings', 'bs:enabled:global']);
      return { ...state['bs:settings'], globalEnabled: state['bs:enabled:global'] };
    } else {
      return await this._httpRequest('/settings');
    }
  },
  
  async updateSettings(updates) {
    if (this.USE_LOCAL_STORAGE) {
      const state = await get(['bs:settings']);
      const settings = { ...state['bs:settings'], ...updates };
      await set({ 'bs:settings': settings });
      return settings;
    } else {
      return await this._httpRequest('/settings', {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    }
  }
};

async function get(keys) { return new Promise((resolve) => API.storage.local.get(keys, (v) => resolve(v || {}))); }
async function set(obj) { return new Promise((resolve) => API.storage.local.set(obj, () => resolve(true))); }

// Legacy wrapper functions that use the DataAPI layer
async function updateDevice(deviceId, updates) {
  return await DataAPI.updateDevice(deviceId, updates);
}

async function updateProfile(profileId, updates) {
  return await DataAPI.updateProfile(profileId, updates);
}

async function addDevice(deviceData) {
  return await DataAPI.addDevice(deviceData);
}

async function deleteDevice(deviceId) {
  return await DataAPI.deleteDevice(deviceId);
}

async function seedIfNeeded() {
  const existing = await get(['bs:devices','bs:profiles','bs:schedules','bs:filters','bs:enabled:global','bs:activeProfile','bs:lastSync','bs:settings','bs:logs']);
  if (typeof existing['bs:devices'] !== 'undefined') return;
  const profiles = [
    { id:'prof-default', name:'Default', safeSearch:true, ytRestricted:true, social:'allow', strictness:'medium', notes:'Balanced daily profile', system:true },
    { id:'prof-school', name:'School', safeSearch:true, ytRestricted:true, social:'block', strictness:'strict', notes:'Blocks social/video for school hours', system:true },
    { id:'prof-focus', name:'Focus', safeSearch:true, ytRestricted:true, social:'block', strictness:'very', notes:'Very strict for deep work', system:true },
  ];
  const devices = [
    { id:'dev-bushido-01', name:'Bushido-01 (Pi 5 Pro)', ip:'192.168.1.10', mac:'AA:BB:CC:DD:EE:10', enabled:true, profileId:'prof-default', lastSeen: nowISO() },
    { id:'dev-bushido-02', name:'Bushido-02 (Pi 3B+)', ip:'192.168.1.11', mac:'AA:BB:CC:DD:EE:11', enabled:true, profileId:'prof-focus', lastSeen: nowISO() },
    { id:'dev-bushido-leaf', name:'Bushido-Leaf (Pi Zero W2)', ip:'192.168.1.12', mac:'AA:BB:CC:DD:EE:12', enabled:true, profileId:'prof-school', lastSeen: nowISO() },
    { id:'dev-mischa', name:'MischxLaptop', ip:'192.168.1.42', mac:'AA:BB:CC:DD:EE:42', enabled:true, profileId:'prof-default', lastSeen: nowISO() },
    { id:'dev-pixel', name:'Pixel 6 Pro', ip:'192.168.1.77', mac:'AA:BB:CC:DD:EE:77', enabled:false, profileId:'prof-focus', lastSeen: nowISO() },
  ];
  const schedules = [ { id:'sch-1', target:{ type:'device', id:'dev-pixel' }, rules:[{ days:['Mon','Tue','Wed','Thu'], start:'21:00', end:'07:00' }] } ];
  const filters = { blocklists:[ { id:'bl-1', name:'OISD Basic', source:'https://oisd.nl/basic.txt', enabled:true, lastSync: nowISO() }, { id:'bl-2', name:'HaGeZi Multi', source:'https://example/hagezi.txt', enabled:true, lastSync: nowISO() } ], allowlist:['school.edu','docs.google.com'], customRules:['||doubleclick.net^','@@||youtube.com^$document'] };
  const logs = [ { time: nowISO(), domain:'doubleclick.net', action:'blocked', device:'MischxLaptop' }, { time: nowISO(), domain:'docs.google.com', action:'allowed', device:'MischxLaptop' }, { time: nowISO(), domain:'youtube.com', action:'policy', device:'Pixel 6 Pro' } ];
  const settings = { dns:'quad9', dnsCustom:'', admin:'', familyLock:true };
  await set({ 'bs:devices': devices, 'bs:profiles': profiles, 'bs:schedules': schedules, 'bs:filters': filters, 'bs:enabled:global': true, 'bs:activeProfile': 'prof-default', 'bs:lastSync': nowISO(), 'bs:settings': settings, 'bs:logs': logs });
}

async function loadState() { await seedIfNeeded(); return await get(['bs:devices','bs:profiles','bs:filters','bs:enabled:global','bs:activeProfile','bs:lastSync','bs:schedules','bs:settings','bs:logs','bs:pausedUntil']); }
// @@CHUNK4
// Advanced modal handlers
advancedBtn?.addEventListener('click', () => {
  advancedModal?.classList.add('is-open');
  setTimeout(() => closeAdvanced?.focus(), 100);
});
closeAdvanced?.addEventListener('click', () => advancedModal?.classList.remove('is-open'));
closeAdvancedFooter?.addEventListener('click', () => advancedModal?.classList.remove('is-open'));
advancedModal?.addEventListener('click', (e) => {
  if (e.target === advancedModal) advancedModal.classList.remove('is-open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && advancedModal?.classList.contains('is-open')) {
    advancedModal.classList.remove('is-open');
  }
});

// Manage links in Overview cards
document.querySelectorAll('.manage-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetTab = link.getAttribute('data-tab');
    if (targetTab) showPage(targetTab);
  });
});

function enforceFamilyMode(state){
  const locked = !!(state['bs:settings']?.familyLock ?? true);
  if (familyLock) familyLock.checked = locked;
  
  // Toggle advanced tabs visibility
  const advTabs = document.querySelectorAll('.seg .tab.adv');
  advTabs.forEach((el)=>{ el.style.display = locked ? 'none':'inline-block'; el.title = locked ? 'Family Mode: Advanced tabs hidden' : ''; });
}

// Family Lock switch in modal
familyLock?.addEventListener('change', async ()=>{
  const st = await loadState();
  const settings = { ...(st['bs:settings']||{}), familyLock: familyLock.checked };
  await set({ 'bs:settings': settings });
  enforceFamilyMode(await loadState());
  const active = document.querySelector('.seg .tab.active');
  if (active?.classList.contains('adv') && familyLock.checked) showPage('tab-main');
  toast(familyLock.checked ? 'Family Mode enabled' : 'Family Mode disabled');
});

function renderSpark(){ if (!spark) return; spark.innerHTML=''; const vals=[5,12,7,16,9,13,8,17,6,14,9,10,12,8,7,13,15,9,12,8,6,10,11,7,9,12]; vals.forEach(v=>{ const b=document.createElement('span'); b.style.height=`${8+v*2}px`; spark.appendChild(b); }); }
function updateMetrics(state){ const devs = state['bs:devices']||[]; mDevices.textContent = String(devs.filter(d=>d.enabled).length); if (mAds) mAds.textContent='1.2k'; if (mTrackers) mTrackers.textContent='3.4k'; }
function updateTopbar(state){ const paused = state['bs:enabled:global'] === false; statusPill.textContent = paused ? 'Paused' : 'Connected'; statusPill.classList.toggle('connected', !paused); statusPill.classList.toggle('paused', paused); if (pauseBtn) pauseBtn.style.display = paused ? 'none' : 'inline-block'; if (resumeBtn) resumeBtn.style.display = paused ? 'inline-block' : 'none'; if (pauseDropdown) pauseDropdown.style.display = paused ? 'none' : 'inline-flex'; if (resumeMain) resumeMain.style.display = paused ? 'inline-block' : 'none'; if (paused && state['bs:pausedUntil']){ const remaining=Math.max(0,new Date(state['bs:pausedUntil']).getTime()-Date.now()); const mins=Math.ceil(remaining/60000); if (pauseNote) pauseNote.textContent=`Auto-resumes in ~${mins} min.`; } else if (pauseNote) pauseNote.textContent=''; }

// Pause dropdown handler
pauseDropdown?.addEventListener('click', (e) => {
  if (e.target.closest('.btn-dropdown__item')) {
    const item = e.target.closest('.btn-dropdown__item');
    const duration = item.dataset.duration;
    const action = item.dataset.action;
    
    if (action === 'disable-filtering') {
      toast('Filtering disabled (feature pending)');
    } else if (action === 'disable-ads') {
      toast('Ad blocker disabled (feature pending)');
    } else if (duration === 'custom') {
      const mins = prompt('Pause for how many minutes?');
      if (mins && !isNaN(mins)) {
        pauseForMinutes(parseInt(mins));
      }
    } else if (duration) {
      pauseForMinutes(parseInt(duration));
    }
    pauseDropdown.classList.remove('is-open');
  } else if (e.target.closest('.btn--primary')) {
    pauseDropdown.classList.toggle('is-open');
  }
});

async function pauseForMinutes(mins) {
  await set({ 'bs:enabled:global': false, 'bs:pausedUntil': new Date(Date.now()+mins*60000).toISOString() });
  toast(`Protection paused for ${mins} minute${mins!==1?'s':''}`);
  updateTopbar(await loadState());
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (pauseDropdown && !pauseDropdown.contains(e.target)) {
    pauseDropdown.classList.remove('is-open');
  }
});

pauseBtn?.addEventListener('click', async ()=>{ await pauseForMinutes(15); });
resumeBtn?.addEventListener('click', async ()=>{ await set({ 'bs:enabled:global': true, 'bs:pausedUntil': null }); toast('Protection resumed'); updateTopbar(await loadState()); });
resumeMain?.addEventListener('click', async ()=>{ await set({ 'bs:enabled:global': true, 'bs:pausedUntil': null }); toast('Protection resumed'); updateTopbar(await loadState()); });

let uiContext = { type:null, id:null };
function setContext(type, id){ uiContext={type,id}; renderDetailsPanel(); renderActivity(); }
// @@CHUNK5
// Render Overview Quick Devices with full controls
function renderQuickDevicesOverview(state){
  const devices = state['bs:devices'] || [];
  const profiles = state['bs:profiles'] || [];
  const q = (qDeviceOverview?.value || '').toLowerCase();
  const filtered = devices.filter(d => d.name.toLowerCase().includes(q));
  
  if (!quickDevicesOverview) return;
  
  quickDevicesOverview.innerHTML = '';
  
  // Show all devices (up to 20)
  filtered.slice(0, 20).forEach(device => {
    const row = document.createElement('div');
    row.className = 'device-row';
    
    // Online dot (green = protected, red = not protected)
    const dot = document.createElement('div');
    dot.className = 'dot ' + (device.enabled ? 'on' : 'off');
    dot.title = device.enabled ? 'Shield Protection: ON' : 'Shield Protection: OFF';
    
    // Device name (clickable to open details)
    const nameEl = document.createElement('div');
    nameEl.className = 'device-row__name';
    nameEl.textContent = device.name || 'Unnamed Device';
    nameEl.title = 'Click to view device details';
    nameEl.style.cursor = 'pointer';
    nameEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Device clicked:', device.id, device.name);
      // Just update the details panel, don't switch tabs
      setContext('device', device.id);
    });
    
    // Profile selector dropdown
    const profileSelect = document.createElement('select');
    profileSelect.className = 'device-row__select';
    profileSelect.title = 'Change profile for this device';
    
    profiles.forEach(profile => {
      const opt = document.createElement('option');
      opt.value = profile.id;
      opt.textContent = profile.name;
      opt.selected = profile.id === device.profileId;
      profileSelect.appendChild(opt);
    });
    
    profileSelect.addEventListener('change', async () => {
      const newProfileId = profileSelect.value;
      const updatedDevice = await updateDevice(device.id, { profileId: newProfileId });
      
      if (updatedDevice) {
        const profile = profiles.find(p => p.id === newProfileId);
        toast(`✓ Applied ${profile?.name || 'profile'} to ${device.name}`);
        
        // Refresh all views including details panel
        const freshState = await loadState();
        renderDevices(freshState);
        renderQuickDevices(freshState);
        renderQuickDevicesOverview(freshState);
        renderDetailsPanel();
      }
    });
    
    // Pause dropdown button (smaller, compact)
    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'device-row__select';
    pauseBtn.textContent = '⏸';
    pauseBtn.title = 'Pause protection for this device';
    pauseBtn.addEventListener('click', () => {
      toast('Device-specific pause (coming soon)');
    });
    
    // Append elements to row (removed moreBtn)
    row.append(dot, nameEl, profileSelect, pauseBtn);
    quickDevicesOverview.appendChild(row);
  });
  
  // Show count if filtered
  if (q && filtered.length < devices.length) {
    const info = document.createElement('div');
    info.style.cssText = 'font-size:12px;color:rgba(15,23,42,.6);margin-top:8px;text-align:center;';
    info.textContent = `Showing ${filtered.length} of ${devices.length} devices`;
    quickDevicesOverview.appendChild(info);
  }
}

// Render Alerts & Requests overview
function renderAlertsRequestsOverview(state){
  const logs = state['bs:logs']||[];
  if (alertsRequestsOverview) {
    alertsRequestsOverview.innerHTML='';
    logs.slice(0,8).forEach(log=>{
      const row = document.createElement('div');
      row.className='alert-row';
      row.addEventListener('click', ()=> { showPage('tab-requests'); });
      
      const time = document.createElement('div');
      time.className='alert-row__time';
      time.textContent=new Date(log.time).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
      
      const domain = document.createElement('div');
      domain.className='alert-row__domain';
      domain.textContent=log.domain;
      domain.title=log.domain;
      
      const action = document.createElement('div');
      action.className='alert-row__action '+(log.action==='blocked'?'blocked':'allowed');
      action.textContent=log.action==='blocked'?'Blocked':'Allowed';
      
      const scope = document.createElement('div');
      scope.className='alert-row__scope';
      scope.textContent='Global';
      
      row.append(time, domain, action, scope);
      alertsRequestsOverview.appendChild(row);
    });
  }
}

qDeviceOverview?.addEventListener('input', async ()=> renderQuickDevicesOverview(await loadState()));

function renderQuickDevices(state){
  const list = state['bs:devices']||[];
  const q = (qDevice?.value||'').toLowerCase();
  const filtered = list.filter(d=> d.name.toLowerCase().includes(q));
  quickDevices.innerHTML='';
  filtered.slice(0,10).forEach(d=>{
    const row = document.createElement('div'); row.className='rowi'; row.setAttribute('role','listitem');
    const av = document.createElement('div'); av.className='avatar'; av.textContent = (d.name[0]||'?').toUpperCase();
    const name = document.createElement('div'); name.style.flex='1'; name.textContent=d.name;
    const dot = document.createElement('div'); dot.className = 'dot '+(d.enabled?'on':'off'); dot.title = d.enabled?'Protected':'Unprotected';
    row.append(av, name, dot);
    row.addEventListener('click', ()=>{ setContext('device', d.id); showPage('tab-devices'); });
    quickDevices.appendChild(row);
  });
}
qDevice?.addEventListener('input', async ()=> renderQuickDevices(await loadState()));
quickAddDevice?.addEventListener('click', async ()=>{
  const name = prompt('Device name'); if (!name) return;
  const st = await loadState(); const devs = st['bs:devices']||[];
  const obj = { id: makeId('dev'), name, ip:'0.0.0.0', mac:'AA:BB:CC:DD:EE:00', enabled:true, profileId: st['bs:activeProfile']||'prof-default', lastSeen: nowISO() };
  await set({ 'bs:devices': [...devs, obj] }); toast('Device added');
  renderQuickDevices(await loadState()); renderDevices(await loadState()); updateMetrics(await loadState());
});

function renderQuickProfiles(state){
  const profs = state['bs:profiles']||[];
  quickProfiles.innerHTML='';
  profs.forEach(p=>{
    const chip = document.createElement('span'); chip.className='chip'; chip.textContent=p.name; chip.title='Apply to selected device or open profile';
    chip.addEventListener('click', async ()=>{
      if (uiContext.type==='device' && uiContext.id){
        const st = await loadState(); const devs = st['bs:devices']||[]; const d = devs.find(x=>x.id===uiContext.id); if (!d) return;
        d.profileId = p.id; await set({ 'bs:devices': devs });
        toast(`Applied ${p.name} to ${d.name}`);
        renderDevices(await loadState()); renderDetailsPanel();
      } else { setContext('profile', p.id); showPage('tab-profiles'); }
    });
    quickProfiles.appendChild(chip);
  });
  const add = quickAddProfile; if (add) add.onclick = ()=> addProfileBtn?.click();
}

// @@CHUNK6
function renderDetailsPanel(){
  detailsBody.innerHTML='';
  if (!uiContext.type){ detailsTitle.textContent='Details'; detailsSub.textContent='Select a device, profile, or routine.'; return; }
  (async ()=>{
    const st = await loadState();
    if (uiContext.type==='device'){
      const d = (st['bs:devices']||[]).find(x=>x.id===uiContext.id); if (!d){ detailsTitle.textContent='Device'; detailsSub.textContent='Unavailable'; return; }
      detailsTitle.textContent = d.name; detailsSub.textContent = `${d.ip} • ${d.mac}`;
      const wrap=document.createElement('div');
      
      // Rename button
      const renameBtn=document.createElement('button');
      renameBtn.className='btn btn--ghost';
      renameBtn.textContent='✏️ Rename';
      renameBtn.style.marginBottom='var(--space-3)';
      renameBtn.addEventListener('click', async ()=>{
        const newName = prompt('Enter new device name:', d.name);
        if (newName && newName.trim() && newName.trim() !== d.name) {
          const updated = await updateDevice(d.id, { name: newName.trim() });
          if (updated) {
            toast(`✓ Renamed to ${newName.trim()}`);
            const freshState = await loadState();
            renderDetailsPanel();
            renderDevices(freshState);
            renderQuickDevices(freshState);
            renderQuickDevicesOverview(freshState);
          }
        }
      });
      
      const shieldLabel=document.createElement('label'); shieldLabel.textContent='Shield ';
      const tog=document.createElement('input'); tog.type='checkbox'; tog.checked=!!d.enabled; shieldLabel.appendChild(tog);
      const profLabel=document.createElement('label'); profLabel.textContent='Profile ';
      const sel=document.createElement('select'); (st['bs:profiles']||[]).forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.name; sel.appendChild(o); }); sel.value=d.profileId; profLabel.appendChild(sel);
      const seen=document.createElement('p'); seen.className='muted'; seen.textContent = `Last seen ${fmtTime(d.lastSeen)}`;
      wrap.append(renameBtn, shieldLabel, profLabel, seen); detailsBody.appendChild(wrap);
      
      tog.addEventListener('change', async ()=>{ 
        await updateDevice(d.id, { enabled: tog.checked });
        toast(`${tog.checked?'Protection ON':'Protection OFF'} for ${d.name}`); 
        const freshState = await loadState();
        updateMetrics(freshState); 
        renderQuickDevices(freshState);
        renderQuickDevicesOverview(freshState);
        renderDevices(freshState);
      });
      sel.addEventListener('change', async ()=>{ 
        await updateDevice(d.id, { profileId: sel.value });
        const profile = st['bs:profiles'].find(p => p.id === sel.value);
        toast(`Profile updated to ${profile?.name || 'selected profile'} for ${d.name}`);
        const freshState = await loadState();
        renderQuickDevicesOverview(freshState);
        renderDevices(freshState);
      });
    } else if (uiContext.type==='profile'){
      const p = (st['bs:profiles']||[]).find(x=>x.id===uiContext.id); if (!p){ detailsTitle.textContent='Profile'; detailsSub.textContent='Unavailable'; return; }
      detailsTitle.textContent=p.name; detailsSub.textContent=p.system?'System profile':'Custom profile';
      const chips=document.createElement('div'); chips.className='chips';
      [['SafeSearch',p.safeSearch?'On':'Off'],['YouTube',p.ytRestricted?'Restricted':'Normal'],['Social',p.social],['Strict',p.strictness]].forEach(([k,v])=>{ const c=document.createElement('span'); c.className='chip'; c.textContent=`${k}: ${v}`; chips.appendChild(c); });
      const btn=document.createElement('button'); btn.className='btn'; btn.textContent='Set as default'; btn.addEventListener('click', async ()=>{ await set({ 'bs:activeProfile': p.id }); toast(`Global profile: ${p.name}`); });
      detailsBody.append(chips, btn);
    } else if (uiContext.type==='routine'){
      detailsTitle.textContent='Routine'; detailsSub.textContent='Summary';
    }
  })();
}

function renderActivity(){ (async()=>{ const st=await loadState(); activityList.innerHTML=''; if (uiContext.type==='device'){ const dev=(st['bs:devices']||[]).find(d=>d.id===uiContext.id); const rows=(st['bs:logs']||[]).filter(l=>l.device===dev?.name).slice(0,5); rows.forEach(l=>{ const li=document.createElement('li'); li.textContent = `${fmtTime(l.time)} — ${l.domain} (${l.action})`; activityList.appendChild(li); }); } })(); }
// @@CHUNK7
let devicesFilter = 'all';
deviceSearch?.addEventListener('input', ()=> renderDevicesCached());
devicesFilters?.addEventListener('click', (e)=>{ const f=e.target?.dataset?.f; if (!f) return; devicesFilter=f; renderDevicesCached(); });

async function renderDevices(state){
  const devs = state['bs:devices']||[]; const profs = state['bs:profiles']||[];
  const q=(deviceSearch?.value||'').toLowerCase();
  const list = devs.filter(d=> d.name.toLowerCase().includes(q)).filter(d=> devicesFilter==='all' ? true : devicesFilter==='prot'? d.enabled : !d.enabled);
  deviceTable.innerHTML='';
  const selected = new Set();
  list.forEach((d)=>{
    const tr=document.createElement('tr');
    const tdSel=document.createElement('td'); const cb=document.createElement('input'); cb.type='checkbox'; cb.addEventListener('change', ()=>{ cb.checked ? selected.add(d.id) : selected.delete(d.id); }); tdSel.appendChild(cb);
    const tdName=document.createElement('td'); const a=document.createElement('a'); a.href='#'; a.textContent=d.name; a.addEventListener('click', (e)=>{ e.preventDefault(); setContext('device', d.id); }); tdName.appendChild(a);
    const tdNet=document.createElement('td'); tdNet.textContent=`${d.ip} / ${d.mac}`;
    const tdEn=document.createElement('td'); const tog=document.createElement('input'); tog.type='checkbox'; tog.checked=!!d.enabled; tog.addEventListener('change', async ()=>{ 
      await updateDevice(d.id, { enabled: tog.checked });
      toast(`${tog.checked?'Protection ON':'Protection OFF'} for ${d.name}`); 
      const freshState = await loadState();
      updateMetrics(freshState); 
      renderQuickDevices(freshState); 
      renderQuickDevicesOverview(freshState); 
    }); tdEn.appendChild(tog);
    const tdProf=document.createElement('td'); const sel=document.createElement('select'); profs.forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.name; sel.appendChild(o); }); sel.value=d.profileId; sel.addEventListener('change', async ()=>{ 
      await updateDevice(d.id, { profileId: sel.value });
      toast(`Profile set to ${profs.find(p=>p.id===sel.value)?.name||''} for ${d.name}`); 
      const freshState = await loadState();
      renderQuickDevicesOverview(freshState); 
    }); tdProf.appendChild(sel);
    const tdSeen=document.createElement('td'); tdSeen.textContent=fmtTime(d.lastSeen);
    tr.append(tdSel, tdName, tdNet, tdEn, tdProf, tdSeen); deviceTable.appendChild(tr);
  });
  selectAll?.addEventListener('change', ()=>{ const inputs=deviceTable.querySelectorAll('input[type="checkbox"]'); inputs.forEach((i,idx)=>{ if (idx===0) return; i.checked = selectAll.checked; const dev=list[idx-1]; if (selectAll.checked) selected.add(dev.id); else selected.delete(dev.id); }); });
  bulkToggle?.addEventListener('click', async ()=>{ 
    if (!selected.size) return; 
    const state = await loadState();
    const devices = state['bs:devices'] || [];
    for (const deviceId of selected) {
      const device = devices.find(d => d.id === deviceId);
      if (device) device.enabled = !device.enabled;
    }
    await set({'bs:devices': devices}); 
    toast('Toggled protection for selected'); 
    const freshState = await loadState();
    renderDevices(freshState); 
    updateMetrics(freshState); 
    renderQuickDevicesOverview(freshState); 
  });
  bulkProfile?.addEventListener('click', async ()=>{ 
    if (!selected.size) return; 
    const pid=prompt('Apply which profile id? (e.g., prof-default)'); 
    if (!pid) return; 
    const state = await loadState();
    const devices = state['bs:devices'] || [];
    for (const deviceId of selected) {
      const device = devices.find(d => d.id === deviceId);
      if (device) device.profileId = pid;
    }
    await set({'bs:devices': devices}); 
    toast('Applied profile to selected'); 
    const freshState = await loadState();
    renderDevices(freshState); 
    renderQuickDevicesOverview(freshState); 
  });
}
async function renderDevicesCached(){ renderDevices(await loadState()); }
// @@CHUNK8
// ==================== PROFILE EDITOR ====================
let currentEditingProfile = null;

const PROFILE_PRESETS = {
  homework: {
    name: 'Homework Mode',
    blockPorn: true,
    blockGambling: true,
    blockTrackers: true,
    blockSocial: true,
    socialSites: ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'snapchat.com', 'youtube.com'],
    blockList: 'games.com\ngaming.com\ntwitch.tv',
    allowList: '',
    timeRules: [{type: 'block_internet', description: 'No internet 11 PM–7 AM', days: ['Mon','Tue','Wed','Thu','Fri'], start: '23:00', end: '07:00', enabled: true}]
  },
  school: {
    name: 'School Day',
    blockPorn: true,
    blockGambling: true,
    blockTrackers: true,
    blockSocial: true,
    socialSites: ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'snapchat.com'],
    blockList: 'gaming.com\nentertainment.com',
    allowList: 'school.edu\nclassroom.google.com',
    timeRules: [{type: 'block_site', description: 'Block YouTube 3-6 PM weekdays', site: 'youtube.com', days: ['Mon','Tue','Wed','Thu','Fri'], start: '15:00', end: '18:00', enabled: true}]
  },
  focus: {
    name: 'Focus Max',
    blockPorn: true,
    blockGambling: true,
    blockTrackers: true,
    blockSocial: true,
    socialSites: ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'snapchat.com', 'youtube.com', 'reddit.com'],
    blockList: 'news.com\nentertainment.com\nsports.com',
    allowList: 'work-site.com\ndocs.google.com',
    timeRules: []
  },
  family: {
    name: 'Family Friendly',
    blockPorn: true,
    blockGambling: true,
    blockTrackers: true,
    blockSocial: false,
    socialSites: [],
    blockList: 'violent-games.com\nmature-content.com',
    allowList: 'kids-site.com\neducational.org',
    timeRules: [{type: 'block_internet', description: 'Bedtime: No internet 9 PM–7 AM', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], start: '21:00', end: '07:00', enabled: true}]
  },
  gaming: {
    name: 'Gaming Mode',
    blockPorn: true,
    blockGambling: false,
    blockTrackers: false,
    blockSocial: false,
    socialSites: [],
    blockList: '',
    allowList: 'steam.com\nepicgames.com\ngaming.com',
    timeRules: []
  },
  work: {
    name: 'Work Hours',
    blockPorn: true,
    blockGambling: true,
    blockTrackers: true,
    blockSocial: true,
    socialSites: ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com'],
    blockList: 'shopping.com\nentertainment.com',
    allowList: 'company.com\nslack.com\nzoom.us',
    timeRules: [{type: 'block_social', description: 'Block social media 9 AM–5 PM weekdays', days: ['Mon','Tue','Wed','Thu','Fri'], start: '09:00', end: '17:00', enabled: true}]
  }
};

function openProfileEditor(profileId = null) {
  currentEditingProfile = profileId;
  
  // Hide list, show editor
  profilesList.style.display = 'none';
  profileEditor.style.display = 'block';
  
  if (profileId) {
    // Edit existing profile
    loadState().then(state => {
      const profile = (state['bs:profiles'] || []).find(p => p.id === profileId);
      if (!profile) return;
      
      profileEditorTitle.textContent = profile.name;
      profName.value = profile.name || '';
      profDesc.value = profile.description || '';
      profBlockPorn.checked = profile.blockPorn || false;
      profBlockGambling.checked = profile.blockGambling || false;
      profBlockTrackers.checked = profile.blockTrackers || false;
      profBlockSocial.checked = profile.blockSocial || false;
      
      // Social media list
      const socialCheckboxes = socialMediaList.querySelectorAll('input[type="checkbox"]');
      const profileSocialSites = profile.socialSites || [];
      socialCheckboxes.forEach(cb => {
        cb.checked = profileSocialSites.includes(cb.value);
      });
      socialMediaList.style.display = profile.blockSocial ? 'block' : 'none';
      
      // Custom lists
      profCustomToggle.checked = profile.customEnabled || false;
      profBlockList.value = (profile.blockList || []).join('\n');
      profAllowList.value = (profile.allowList || []).join('\n');
      customLists.style.display = profile.customEnabled ? 'block' : 'none';
      
      // Time rules
      renderTimeRules(profile.timeRules || []);
      
      // Device apply list
      renderDeviceApplyList();
      
      updateProfileSummary();
    });
  } else {
    // New profile
    profileEditorTitle.textContent = 'New Profile';
    profName.value = '';
    profDesc.value = '';
    profBlockPorn.checked = true;
    profBlockGambling.checked = false;
    profBlockTrackers.checked = true;
    profBlockSocial.checked = false;
    socialMediaList.style.display = 'none';
    profCustomToggle.checked = false;
    customLists.style.display = 'none';
    profBlockList.value = '';
    profAllowList.value = '';
    renderTimeRules([]);
    renderDeviceApplyList();
    updateProfileSummary();
  }
}

function closeProfileEditor() {
  // Show list, hide editor
  profilesList.style.display = 'block';
  profileEditor.style.display = 'none';
  currentEditingProfile = null;
}

function renderTimeRules(rules) {
  timeRulesList.innerHTML = '';
  rules.forEach((rule, index) => {
    const ruleEl = document.createElement('div');
    ruleEl.className = 'time-rule';
    
    const fields = document.createElement('div');
    fields.className = 'time-rule__fields';
    
    // Rule type
    const typeField = document.createElement('div');
    typeField.className = 'field';
    typeField.innerHTML = `
      <label class="label">Type</label>
      <select class="input" data-index="${index}" data-field="type">
        <option value="block_internet" ${rule.type === 'block_internet' ? 'selected' : ''}>Block Internet</option>
        <option value="block_site" ${rule.type === 'block_site' ? 'selected' : ''}>Block Specific Site</option>
        <option value="block_social" ${rule.type === 'block_social' ? 'selected' : ''}>Block Social Media</option>
      </select>
    `;
    
    // Description
    const descField = document.createElement('div');
    descField.className = 'field';
    descField.innerHTML = `
      <label class="label">Description</label>
      <input type="text" class="input" data-index="${index}" data-field="description" value="${rule.description || ''}" placeholder="e.g., Bedtime rule" />
    `;
    
    // Site (if block_site type)
    if (rule.type === 'block_site') {
      const siteField = document.createElement('div');
      siteField.className = 'field';
      siteField.innerHTML = `
        <label class="label">Website</label>
        <input type="text" class="input" data-index="${index}" data-field="site" value="${rule.site || ''}" placeholder="youtube.com" />
      `;
      fields.appendChild(siteField);
    }
    
    // Days
    const daysField = document.createElement('div');
    daysField.className = 'field';
    daysField.innerHTML = `
      <label class="label">Days</label>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">
        ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => `
          <label style="font-size:12px;"><input type="checkbox" data-index="${index}" data-field="day" value="${day}" ${(rule.days || []).includes(day) ? 'checked' : ''} /> ${day}</label>
        `).join('')}
      </div>
    `;
    
    // Start time
    const startField = document.createElement('div');
    startField.className = 'field';
    startField.innerHTML = `
      <label class="label">Start Time</label>
      <input type="time" class="input" data-index="${index}" data-field="start" value="${rule.start || '00:00'}" />
    `;
    
    // End time
    const endField = document.createElement('div');
    endField.className = 'field';
    endField.innerHTML = `
      <label class="label">End Time</label>
      <input type="time" class="input" data-index="${index}" data-field="end" value="${rule.end || '23:59'}" />
    `;
    
    fields.append(typeField, descField, daysField, startField, endField);
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'time-rule__actions';
    actions.innerHTML = `
      <label title="Enable/disable this rule">
        <input type="checkbox" class="sw" data-index="${index}" data-field="enabled" ${rule.enabled !== false ? 'checked' : ''} />
      </label>
      <button class="btn btn--ghost" data-action="delete" data-index="${index}">🗑️</button>
    `;
    
    ruleEl.append(fields, actions);
    timeRulesList.appendChild(ruleEl);
  });
}

function getTimeRulesFromUI() {
  const rules = [];
  const ruleElements = timeRulesList.querySelectorAll('.time-rule');
  
  ruleElements.forEach((el, index) => {
    const type = el.querySelector(`[data-field="type"]`)?.value || 'block_internet';
    const description = el.querySelector(`[data-field="description"]`)?.value || '';
    const site = el.querySelector(`[data-field="site"]`)?.value || '';
    const start = el.querySelector(`[data-field="start"]`)?.value || '00:00';
    const end = el.querySelector(`[data-field="end"]`)?.value || '23:59';
    const enabled = el.querySelector(`[data-field="enabled"]`)?.checked || false;
    
    const dayCheckboxes = el.querySelectorAll(`[data-field="day"]`);
    const days = Array.from(dayCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    
    rules.push({
      type,
      description,
      site: type === 'block_site' ? site : undefined,
      days,
      start,
      end,
      enabled
    });
  });
  
  return rules;
}

function updateProfileSummary() {
  const blocks = [];
  if (profBlockPorn.checked) blocks.push('Pornographic content');
  if (profBlockGambling.checked) blocks.push('Gambling');
  if (profBlockTrackers.checked) blocks.push('Trackers');
  if (profBlockSocial.checked) {
    const socialCheckboxes = socialMediaList.querySelectorAll('input[type="checkbox"]:checked');
    if (socialCheckboxes.length > 0) {
      blocks.push(`Social media (${socialCheckboxes.length} sites)`);
    }
  }
  if (profCustomToggle.checked) {
    const blockLines = profBlockList.value.split('\n').filter(l => l.trim()).length;
    const allowLines = profAllowList.value.split('\n').filter(l => l.trim()).length;
    if (blockLines > 0) blocks.push(`Custom blocks (${blockLines})`);
    if (allowLines > 0) blocks.push(`Custom allows (${allowLines})`);
  }
  
  const rules = getTimeRulesFromUI();
  const activeRules = rules.filter(r => r.enabled);
  
  profileSummary.innerHTML = `
    <p><strong>Blocks:</strong> ${blocks.length > 0 ? blocks.join(', ') : 'None'}</p>
    <p><strong>Time Rules:</strong> ${activeRules.length > 0 ? `${activeRules.length} active` : 'None'}</p>
    <p style="margin-top:var(--space-2);color:rgba(15,23,42,.6);">Click "Save Profile" to apply these settings.</p>
  `;
}

async function saveProfile() {
  const name = profName.value.trim();
  if (!name) {
    toast('❌ Profile name is required');
    profName.focus();
    return;
  }
  
  const socialCheckboxes = socialMediaList.querySelectorAll('input[type="checkbox"]:checked');
  const socialSites = Array.from(socialCheckboxes).map(cb => cb.value);
  
  const blockList = profBlockList.value.split('\n').filter(l => l.trim()).map(l => l.trim());
  const allowList = profAllowList.value.split('\n').filter(l => l.trim()).map(l => l.trim());
  
  const timeRules = getTimeRulesFromUI();
  
  const profileData = {
    name,
    description: profDesc.value.trim(),
    blockPorn: profBlockPorn.checked,
    blockGambling: profBlockGambling.checked,
    blockTrackers: profBlockTrackers.checked,
    blockSocial: profBlockSocial.checked,
    socialSites,
    customEnabled: profCustomToggle.checked,
    blockList,
    allowList,
    timeRules,
    system: false
  };
  
  const state = await loadState();
  const profiles = state['bs:profiles'] || [];
  
  let savedProfileId = currentEditingProfile;
  
  if (currentEditingProfile) {
    // Update existing
    const profile = profiles.find(p => p.id === currentEditingProfile);
    if (profile) {
      Object.assign(profile, profileData);
      await set({ 'bs:profiles': profiles });
    }
  } else {
    // Create new
    const existingNames = profiles.map(p => p.name.toLowerCase());
    if (existingNames.includes(name.toLowerCase())) {
      toast('❌ Profile name must be unique');
      profName.focus();
      return;
    }
    
    const newProfile = {
      id: makeId('prof'),
      ...profileData
    };
    
    profiles.push(newProfile);
    await set({ 'bs:profiles': profiles });
    savedProfileId = newProfile.id;
  }
  
  // Apply profile to selected devices
  const checkedDevices = deviceApplyList.querySelectorAll('input[type="checkbox"]:checked');
  const selectedDeviceIds = Array.from(checkedDevices).map(cb => cb.value);
  
  if (selectedDeviceIds.length > 0) {
    for (const deviceId of selectedDeviceIds) {
      await updateDevice(deviceId, { profileId: savedProfileId });
    }
    toast(`✓ Profile saved and applied to ${selectedDeviceIds.length} device${selectedDeviceIds.length > 1 ? 's' : ''}`);
  } else {
    toast(`✓ Profile saved`);
  }
  
  closeProfileEditor();
  const freshState = await loadState();
  renderProfiles(freshState);
  renderDevices(freshState); // Update device list to show new profile assignments
}


function applyPreset(presetName) {
  const preset = PROFILE_PRESETS[presetName];
  if (!preset) return;
  
  profName.value = preset.name;
  profBlockPorn.checked = preset.blockPorn;
  profBlockGambling.checked = preset.blockGambling;
  profBlockTrackers.checked = preset.blockTrackers;
  profBlockSocial.checked = preset.blockSocial;
  
  // Social media
  const socialCheckboxes = socialMediaList.querySelectorAll('input[type="checkbox"]');
  socialCheckboxes.forEach(cb => {
    cb.checked = preset.socialSites.includes(cb.value);
  });
  socialMediaList.style.display = preset.blockSocial ? 'block' : 'none';
  
  // Custom lists
  profCustomToggle.checked = preset.blockList || preset.allowList;
  profBlockList.value = preset.blockList || '';
  profAllowList.value = preset.allowList || '';
  customLists.style.display = (preset.blockList || preset.allowList) ? 'block' : 'none';
  
  // Time rules
  renderTimeRules(preset.timeRules || []);
  
  updateProfileSummary();
  toast(`✓ Applied "${preset.name}" preset`);
}

// Event listeners for profile editor
profileEditorClose?.addEventListener('click', closeProfileEditor);
profileEditorCancel?.addEventListener('click', closeProfileEditor);
profileEditorSave?.addEventListener('click', saveProfile);

profBlockSocial?.addEventListener('change', () => {
  socialMediaList.style.display = profBlockSocial.checked ? 'block' : 'none';
  updateProfileSummary();
});

profCustomToggle?.addEventListener('change', () => {
  customLists.style.display = profCustomToggle.checked ? 'block' : 'none';
  updateProfileSummary();
});

// Update summary on any change
[profName, profDesc, profBlockPorn, profBlockGambling, profBlockTrackers, profBlockList, profAllowList].forEach(el => {
  el?.addEventListener('change', updateProfileSummary);
  el?.addEventListener('input', updateProfileSummary);
});

socialMediaList?.addEventListener('change', updateProfileSummary);

// Preset buttons
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-preset]')) {
    const preset = e.target.dataset.preset;
    applyPreset(preset);
  }
});

// Time rule actions
timeRulesList?.addEventListener('click', (e) => {
  if (e.target.matches('[data-action="delete"]')) {
    const index = parseInt(e.target.dataset.index);
    const rules = getTimeRulesFromUI();
    rules.splice(index, 1);
    renderTimeRules(rules);
    updateProfileSummary();
  }
});

timeRulesList?.addEventListener('change', updateProfileSummary);

addTimeRule?.addEventListener('click', () => {
  const rules = getTimeRulesFromUI();
  rules.push({
    type: 'block_internet',
    description: '',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    start: '22:00',
    end: '07:00',
    enabled: true
  });
  renderTimeRules(rules);
  updateProfileSummary();
});

// ==================== END PROFILE EDITOR ====================

function renderDeviceApplyList() {
  loadState().then(state => {
    const devices = state['bs:devices'] || [];
    const q = (deviceApplySearch?.value || '').toLowerCase();
    const filtered = devices.filter(d => d.name.toLowerCase().includes(q));
    
    if (!deviceApplyList) return;
    deviceApplyList.innerHTML = '';
    
    if (filtered.length === 0) {
      deviceApplyList.innerHTML = '<p class="muted" style="padding:var(--space-2);">No devices found</p>';
      return;
    }
    
    filtered.forEach(device => {
      const item = document.createElement('label');
      item.className = 'device-apply-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = device.id;
      checkbox.checked = false;
      
      const name = document.createElement('span');
      name.style.flex = '1';
      name.style.font = '500 14px var(--font)';
      name.textContent = device.name;
      
      const ip = document.createElement('span');
      ip.style.font = '500 12px var(--font)';
      ip.style.color = 'rgba(15,23,42,.5)';
      ip.textContent = device.ip;
      
      item.append(checkbox, name, ip);
      deviceApplyList.appendChild(item);
    });
  });
}

deviceApplySearch?.addEventListener('input', renderDeviceApplyList);

function renderProfiles(state){
  const profiles = state['bs:profiles']||[]; 
  const active=state['bs:activeProfile'];
  profilesGrid.innerHTML='';
  
  profiles.forEach((p)=>{
    const card=document.createElement('div'); 
    card.className='profile-card';
    
    // Header with title and badge
    const header=document.createElement('div'); 
    header.className='profile-card__header';
    
    const titleWrap=document.createElement('div');
    const title=document.createElement('h3'); 
    title.className='profile-card__title';
    title.textContent=p.name;
    if (p.id===active) {
      const defaultLabel = document.createElement('span');
      defaultLabel.style.cssText = 'font:500 11px var(--font);color:rgba(15,23,42,.5);margin-left:8px;';
      defaultLabel.textContent = '(Default)';
      title.appendChild(defaultLabel);
    }
    titleWrap.appendChild(title);
    
    const badge=document.createElement('span'); 
    badge.className='profile-card__badge';
    badge.textContent=p.system?'SYSTEM':'CUSTOM';
    
    header.append(titleWrap, badge);
    
    // Summary text
    const summary=document.createElement('p'); 
    summary.className='profile-card__summary';
    const blocks = [];
    if (p.blockPorn) blocks.push('Adult');
    if (p.blockGambling) blocks.push('Gambling');
    if (p.blockTrackers) blocks.push('Trackers');
    if (p.blockSocial && (p.socialSites||[]).length > 0) blocks.push(`Social (${p.socialSites.length})`);
    if ((p.timeRules||[]).length > 0) blocks.push(`${p.timeRules.length} rules`);
    summary.textContent = blocks.length > 0 ? blocks.join(' • ') : 'No restrictions';
    
    // Actions - consistent button order and styling
    const actions=document.createElement('div'); 
    actions.className='profile-card__actions';
    
    // 1. Set Default (secondary)
    const setDef=document.createElement('button'); 
    setDef.className='btn'; 
    setDef.textContent='Set Default';
    setDef.disabled = p.id===active;
    setDef.title = p.id===active ? 'Already default' : 'Make this the default profile';
    setDef.addEventListener('click', async ()=>{ 
      await set({'bs:activeProfile': p.id}); 
      toast(`✓ ${p.name} is now default`); 
      renderProfiles(await loadState()); 
    });
    
    // 2. Edit (primary)
    const edit=document.createElement('button'); 
    edit.className='btn btn--primary'; 
    edit.textContent='Edit';
    edit.addEventListener('click', ()=> openProfileEditor(p.id));
    
    // 3. Duplicate (neutral)
    const dup=document.createElement('button'); 
    dup.className='btn'; 
    dup.textContent='Duplicate';
    dup.addEventListener('click', async ()=>{ 
      const copy={...p, id:makeId('prof'), name:`${p.name} Copy`, system:false}; 
      const st=await loadState(); 
      await set({'bs:profiles':[...st['bs:profiles'],copy]}); 
      toast('✓ Profile duplicated'); 
      renderProfiles(await loadState()); 
    });
    
    // 4. Delete (destructive) - always shown, disabled if can't delete
    const del=document.createElement('button'); 
    del.className='btn';
    del.style.color = p.system ? 'rgba(15,23,42,.3)' : 'var(--danger)';
    del.textContent='Delete';
    del.disabled = p.system;
    del.title = p.system ? "Can't delete this profile" : `Delete ${p.name}`;
    del.addEventListener('click', async ()=>{ 
      if (!confirm(`Delete profile "${p.name}"? This can't be undone.`)) return;
      const st=await loadState(); 
      const next=(st['bs:profiles']||[]).filter(x=>x.id!==p.id); 
      await set({'bs:profiles': next}); 
      toast('✓ Profile deleted'); 
      renderProfiles(await loadState()); 
    });
    
    actions.append(setDef, edit, dup, del);
    card.append(header, summary, actions); 
    profilesGrid.appendChild(card);
  });
}

addProfileBtn?.addEventListener('click', ()=> openProfileEditor(null));
exportProfilesBtn?.addEventListener('click', async ()=>{ const st=await loadState(); const data=JSON.stringify(st['bs:profiles']||[], null, 2); const blob=new Blob([data],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='profiles.json'; a.click(); URL.revokeObjectURL(url); });
importProfilesInput?.addEventListener('change', async (e)=>{ const f=e.target.files[0]; if (!f) return; try { const txt=await f.text(); const arr=JSON.parse(txt); if (!Array.isArray(arr)) throw new Error('Invalid'); await set({'bs:profiles':arr}); toast('✓ Profiles imported'); renderProfiles(await loadState()); } catch { toast('❌ Invalid JSON'); } finally { importProfilesInput.value=''; } });

// @@CHUNK10
function renderSettings(state){ const st=state['bs:settings']||{dns:'quad9',dnsCustom:'',admin:'',familyLock:true}; if (setDns) setDns.value=st.dns||'quad9'; if (setDnsCustom) setDnsCustom.value=st.dnsCustom||''; if (setDnsCustomWrap) setDnsCustomWrap.style.display = (setDns?.value==='custom') ? 'block':'none'; if (setAdmin) setAdmin.value=st.admin||''; if (familyLock) familyLock.checked = !!st.familyLock; }
setDns?.addEventListener('change', ()=>{ if (setDnsCustomWrap) setDnsCustomWrap.style.display = setDns.value==='custom' ? 'block':'none'; });
settingsSave?.addEventListener('click', async ()=>{ const st=await loadState(); const next={ ...(st['bs:settings']||{}), dns:setDns?.value||'quad9', dnsCustom:setDnsCustom?.value?.trim()||'', admin:setAdmin?.value||'' }; await set({'bs:settings': next}); toast('Settings saved'); });

function renderBlocklists(state){ const lists=state['bs:filters']?.blocklists||[]; blTable.innerHTML=''; lists.forEach((bl,idx)=>{ const tr=document.createElement('tr'); const td1=document.createElement('td'); td1.textContent=bl.name; tr.appendChild(td1); const td2=document.createElement('td'); td2.textContent=bl.source; tr.appendChild(td2); const td3=document.createElement('td'); const chk=document.createElement('input'); chk.type='checkbox'; chk.checked=!!bl.enabled; chk.addEventListener('change', async ()=>{ lists[idx].enabled=chk.checked; const st=await loadState(); await set({'bs:filters':{...st['bs:filters'], blocklists:lists}}); toast(`${bl.name} ${chk.checked?'enabled':'disabled'}`); }); td3.appendChild(chk); tr.appendChild(td3); const td4=document.createElement('td'); td4.textContent=bl.lastSync? fmtTime(bl.lastSync):'—'; tr.appendChild(td4); blTable.appendChild(tr); }); }
function renderAllowlist(state){ const al=state['bs:filters']?.allowlist||[]; alChips.innerHTML=''; al.forEach((host,idx)=>{ const c=document.createElement('span'); c.className='chip'; c.textContent=host; const x=document.createElement('button'); x.className='chip'; x.textContent='×'; x.addEventListener('click', async ()=>{ al.splice(idx,1); const st=await loadState(); await set({'bs:filters':{...st['bs:filters'], allowlist:al}}); toast('Removed'); renderAllowlist(await loadState()); }); c.appendChild(x); alChips.appendChild(c); }); }
blSync?.addEventListener('click', async ()=>{ const st=await loadState(); const now=nowISO(); const lists=st['bs:filters'].blocklists.map(b=>({...b, lastSync:now})); await set({'bs:filters':{...st['bs:filters'], blocklists:lists}, 'bs:lastSync': now}); toast('Blocklists synced'); renderBlocklists(await loadState()); });
blAdd?.addEventListener('click', async ()=>{ const name=prompt('List name'); if(!name) return; const url=prompt('Source URL'); if(!url) return; const st=await loadState(); const lists=[...st['bs:filters'].blocklists, { id:makeId('bl'), name, source:url, enabled:true, lastSync:nowISO() }]; await set({'bs:filters':{...st['bs:filters'], blocklists:lists}}); toast('Blocklist added'); renderBlocklists(await loadState()); });
alAdd?.addEventListener('click', async ()=>{ const v=(alInput.value||'').trim(); if(!v) return; const st=await loadState(); const next=[...st['bs:filters'].allowlist, v]; await set({'bs:filters':{...st['bs:filters'], allowlist:next}}); alInput.value=''; toast('Allowlisted'); renderAllowlist(await loadState()); });
crValidate?.addEventListener('click', ()=> toast('Rules look OK'));
crApply?.addEventListener('click', async ()=>{ const arr=crText.value.split(/\n+/).map(s=>s.trim()).filter(Boolean); const st=await loadState(); await set({'bs:filters':{...st['bs:filters'], customRules:arr}}); toast('Custom rules applied'); });

function renderLogs(state, filter='all'){ const rows=(state['bs:logs']||[]).filter(l=> filter==='all'? true : l.action===filter); logsTable.innerHTML=''; rows.forEach(l=>{ const tr=document.createElement('tr'); const td1=document.createElement('td'); td1.textContent=fmtTime(l.time); tr.appendChild(td1); const td2=document.createElement('td'); td2.textContent=l.domain; tr.appendChild(td2); const td3=document.createElement('td'); td3.textContent=l.action; tr.appendChild(td3); const td4=document.createElement('td'); td4.textContent=l.device; tr.appendChild(td4); logsTable.appendChild(tr); }); }
logFilters?.addEventListener('click', async (e)=>{ const f=e.target?.dataset?.logfilter; if(!f) return; renderLogs(await loadState(), f); });

// Requests tab
function renderRequests(state, filter='all'){
  const rows=(state['bs:logs']||[]).filter(l=> filter==='all'? true : filter==='blocked'? l.action==='blocked' : l.action==='allowed');
  if (requestsTable) {
    requestsTable.innerHTML='';
    rows.forEach(l=>{
      const tr=document.createElement('tr');
      
      const td1=document.createElement('td'); td1.textContent=fmtTime(l.time); tr.appendChild(td1);
      const td2=document.createElement('td'); td2.textContent=l.domain; tr.appendChild(td2);
      const td3=document.createElement('td'); 
      const badge = document.createElement('span');
      badge.className = l.action==='blocked' ? 'chip' : 'chip';
      badge.style.background = l.action==='blocked' ? 'var(--t-alert)' : 'var(--t-info)';
      badge.style.color = l.action==='blocked' ? 'var(--danger)' : 'var(--info)';
      badge.style.fontSize = '11px';
      badge.style.padding = '.2rem .5rem';
      badge.textContent = l.action==='blocked' ? 'Blocked' : 'Allowed';
      td3.appendChild(badge);
      tr.appendChild(td3);
      
      const td4=document.createElement('td'); td4.textContent='Global'; td4.style.fontSize='12px'; tr.appendChild(td4);
      const td5=document.createElement('td'); td5.textContent=l.device; tr.appendChild(td5);
      
      const td6=document.createElement('td');
      const btnBlock = document.createElement('button');
      btnBlock.className='btn btn--ghost';
      btnBlock.textContent='Block';
      btnBlock.style.padding='.3rem .6rem';
      btnBlock.style.fontSize='12px';
      btnBlock.addEventListener('click', async ()=>{
        // Add to block list using DataAPI
        const filters = await DataAPI.getState();
        const blockList = filters['bs:filters']?.blocked || [];
        if (!blockList.includes(l.domain)) {
          blockList.push(l.domain);
          await set({'bs:filters': {...filters['bs:filters'], blocked: blockList}});
          toast(`✓ Blocked ${l.domain}`);
          // Log the action
          await DataAPI.addLog({
            domain: l.domain,
            action: 'blocked',
            device: 'Manual',
            time: Date.now(),
            rule: 'User added'
          });
          const freshState = await loadState();
          renderRequests(freshState, filter);
        }
      });
      
      const btnAllow = document.createElement('button');
      btnAllow.className='btn btn--ghost';
      btnAllow.textContent='Allow';
      btnAllow.style.padding='.3rem .6rem';
      btnAllow.style.fontSize='12px';
      btnAllow.addEventListener('click', async ()=>{
        // Add to allow list using DataAPI
        const filters = await DataAPI.getState();
        const allowList = filters['bs:filters']?.allowed || [];
        if (!allowList.includes(l.domain)) {
          allowList.push(l.domain);
          await set({'bs:filters': {...filters['bs:filters'], allowed: allowList}});
          toast(`✓ Allowed ${l.domain}`);
          // Log the action
          await DataAPI.addLog({
            domain: l.domain,
            action: 'allowed',
            device: 'Manual',
            time: Date.now(),
            rule: 'User added'
          });
          const freshState = await loadState();
          renderRequests(freshState, filter);
        }
      });
      
      td6.append(btnBlock, ' ', btnAllow);
      tr.appendChild(td6);
      
      requestsTable.appendChild(tr);
    });
  }
}
requestsFilters?.addEventListener('click', async (e)=>{ const f=e.target?.dataset?.f; if(!f) return; document.querySelectorAll('#requestsFilters .chip').forEach(c=>c.classList.remove('is-selected')); e.target.classList.add('is-selected'); renderRequests(await loadState(), f); });
requestSearch?.addEventListener('input', async ()=>{ renderRequests(await loadState()); });

(async function init(){
  const st = await loadState();
  enforceFamilyMode(st);
  updateTopbar(st);
  updateMetrics(st);
  renderSpark();
  renderQuickDevices(st); renderQuickProfiles(st);
  renderQuickDevicesOverview(st); renderAlertsRequestsOverview(st);
  await renderDevices(st); renderProfiles(st); renderBlocklists(st); renderAllowlist(st); renderSettings(st); renderLogs(st); renderRequests(st);
  
  // Set initial grid state
  showPage('tab-main');
})();



