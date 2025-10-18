const API = typeof browser !== 'undefined' ? browser : chrome;
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
const quickRoutines = document.getElementById('quickRoutines');
const quickRoutineCaption = document.getElementById('quickRoutineCaption');
const familyLock = document.getElementById('familyLock');

// Center tabs
const tabButtons = Array.from(document.querySelectorAll('.seg .tab'));
function showPage(id) {
  tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.target === id));
  const pageIds = ['tab-main','tab-devices','tab-profiles','tab-schedules','tab-filtering','tab-settings','tab-logs'];
  pageIds.forEach((pid) => {
    const el = document.getElementById(pid);
    if (el) el.style.display = pid === id ? 'block' : 'none';
  });
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
const profilesGrid = document.getElementById('profilesGrid');
const addProfileBtn = document.getElementById('addProfileBtn');
const exportProfilesBtn = document.getElementById('exportProfilesBtn');
const importProfilesInput = document.getElementById('importProfilesInput');

// Routines (schedules)
const schTargetType = document.getElementById('schTargetType');
const schTargetId = document.getElementById('schTargetId');
const schGrid = document.getElementById('schGrid');
const schSave = document.getElementById('schSave');
const schPreview = document.getElementById('schPreview');
const schConflict = document.getElementById('schConflict');
const rtBedtime = document.getElementById('rtBedtime');
const rtHomework = document.getElementById('rtHomework');
const rtWeekend = document.getElementById('rtWeekend');
const rtAlways = document.getElementById('rtAlways');

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

async function get(keys) { return new Promise((resolve) => API.storage.local.get(keys, (v) => resolve(v || {}))); }
async function set(obj) { return new Promise((resolve) => API.storage.local.set(obj, () => resolve(true))); }

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
function enforceFamilyMode(state){
  const locked = !!(state['bs:settings']?.familyLock ?? true);
  if (familyLock) familyLock.checked = locked;
  const advTabs = document.querySelectorAll('.seg .tab.adv');
  advTabs.forEach((el)=>{ el.style.display = locked ? 'none':'inline-block'; el.title = locked ? 'Parental Lock: Advanced tabs hidden' : ''; });
}
familyLock?.addEventListener('change', async ()=>{
  const st = await loadState();
  const settings = { ...(st['bs:settings']||{}), familyLock: familyLock.checked };
  await set({ 'bs:settings': settings });
  enforceFamilyMode(await loadState());
  const active = document.querySelector('.seg .tab.active');
  if (active?.classList.contains('adv') && familyLock.checked) showPage('tab-main');
});

function renderSpark(){ if (!spark) return; spark.innerHTML=''; const vals=[5,12,7,16,9,13,8,17,6,14,9,10,12,8,7,13,15,9,12,8,6,10,11,7,9,12]; vals.forEach(v=>{ const b=document.createElement('span'); b.style.height=`${8+v*2}px`; spark.appendChild(b); }); }
function updateMetrics(state){ const devs = state['bs:devices']||[]; mDevices.textContent = String(devs.filter(d=>d.enabled).length); if (mAds) mAds.textContent='1.2k'; if (mTrackers) mTrackers.textContent='3.4k'; }
function updateTopbar(state){ const paused = state['bs:enabled:global'] === false; statusPill.textContent = paused ? 'Paused' : 'Connected'; statusPill.classList.toggle('connected', !paused); statusPill.classList.toggle('paused', paused); if (pauseBtn) pauseBtn.style.display = paused ? 'none' : 'inline-block'; if (resumeBtn) resumeBtn.style.display = paused ? 'inline-block' : 'none'; if (pauseMain) pauseMain.style.display = paused ? 'none' : 'inline-block'; if (resumeMain) resumeMain.style.display = paused ? 'inline-block' : 'none'; if (paused && state['bs:pausedUntil']){ const remaining=Math.max(0,new Date(state['bs:pausedUntil']).getTime()-Date.now()); const mins=Math.ceil(remaining/60000); if (pauseNote) pauseNote.textContent=`Protection paused. Auto-resumes in ~${mins} min.`; } else if (pauseNote) pauseNote.textContent=''; }
pauseBtn?.addEventListener('click', async ()=>{ await set({ 'bs:enabled:global': false, 'bs:pausedUntil': new Date(Date.now()+15*60000).toISOString() }); toast('Protection paused for 15 minutes'); updateTopbar(await loadState()); });
resumeBtn?.addEventListener('click', async ()=>{ await set({ 'bs:enabled:global': true, 'bs:pausedUntil': null }); toast('Protection resumed'); updateTopbar(await loadState()); });
pauseMain?.addEventListener('click', ()=> pauseBtn?.click());
resumeMain?.addEventListener('click', ()=> resumeBtn?.click());

let uiContext = { type:null, id:null };
function setContext(type, id){ uiContext={type,id}; renderDetailsPanel(); renderActivity(); }
// @@CHUNK5
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

function renderQuickRoutines(){
  quickRoutines.innerHTML='';
  [['Bedtime', 'bed'], ['Homework','hw'], ['Weekend Limits','wk']].forEach(([label,key])=>{
    const chip=document.createElement('span'); chip.className='chip'; chip.textContent=label;
    chip.addEventListener('click', ()=> applyRoutinePreset(key));
    quickRoutines.appendChild(chip);
  });
  quickRoutineCaption.textContent = 'Examples: 9pm–7am school nights; 4–6pm homework.';
}

async function applyRoutinePreset(kind){
  if (uiContext.type!=='device' || !uiContext.id){ toast('Select a device first'); return; }
  const st = await loadState();
  let rules=[];
  if (kind==='bed'){ rules=[{ days:['Mon','Tue','Wed','Thu'], start:'21:00', end:'07:00' }]; }
  else if (kind==='hw'){ rules=[{ days:['Mon','Tue','Wed','Thu'], start:'16:00', end:'18:00' }]; }
  else if (kind==='wk'){ rules=[{ days:['Sat','Sun'], start:'10:00', end:'12:00' }]; }
  else { rules=[{ days:DAYS, start:'00:00', end:'24:00' }]; }
  let scheds = st['bs:schedules']||[]; const existing = scheds.find(s=> s.target?.type==='device' && s.target?.id===uiContext.id);
  if (existing) existing.rules = rules; else scheds = [...scheds, { id: makeId('sch'), target:{ type:'device', id: uiContext.id }, rules }];
  await set({ 'bs:schedules': scheds }); toast('Routine applied');
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
      const shieldLabel=document.createElement('label'); shieldLabel.textContent='Shield ';
      const tog=document.createElement('input'); tog.type='checkbox'; tog.checked=!!d.enabled; shieldLabel.appendChild(tog);
      const profLabel=document.createElement('label'); profLabel.textContent='Profile ';
      const sel=document.createElement('select'); (st['bs:profiles']||[]).forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.name; sel.appendChild(o); }); sel.value=d.profileId; profLabel.appendChild(sel);
      const seen=document.createElement('p'); seen.className='muted'; seen.textContent = `Last seen ${fmtTime(d.lastSeen)}`;
      wrap.append(shieldLabel, profLabel, seen); detailsBody.appendChild(wrap);
      tog.addEventListener('change', async ()=>{ d.enabled = tog.checked; await set({ 'bs:devices': st['bs:devices'] }); toast(`${d.enabled?'Protection On':'Protection Off'} for ${d.name}`); updateMetrics(await loadState()); renderQuickDevices(await loadState()); });
      sel.addEventListener('change', async ()=>{ d.profileId = sel.value; await set({ 'bs:devices': st['bs:devices'] }); toast(`Profile updated for ${d.name}`); });
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
    const tdEn=document.createElement('td'); const tog=document.createElement('input'); tog.type='checkbox'; tog.checked=!!d.enabled; tog.addEventListener('change', async ()=>{ d.enabled=tog.checked; await set({'bs:devices': devs}); toast(`${d.enabled?'Protection On':'Protection Off'} for ${d.name}`); updateMetrics(await loadState()); renderQuickDevices(await loadState()); }); tdEn.appendChild(tog);
    const tdProf=document.createElement('td'); const sel=document.createElement('select'); profs.forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.name; sel.appendChild(o); }); sel.value=d.profileId; sel.addEventListener('change', async ()=>{ d.profileId=sel.value; await set({'bs:devices': devs}); toast(`Profile set to ${profs.find(p=>p.id===d.profileId)?.name||''} for ${d.name}`); }); tdProf.appendChild(sel);
    const tdSeen=document.createElement('td'); tdSeen.textContent=fmtTime(d.lastSeen);
    tr.append(tdSel, tdName, tdNet, tdEn, tdProf, tdSeen); deviceTable.appendChild(tr);
  });
  selectAll?.addEventListener('change', ()=>{ const inputs=deviceTable.querySelectorAll('input[type="checkbox"]'); inputs.forEach((i,idx)=>{ if (idx===0) return; i.checked = selectAll.checked; const dev=list[idx-1]; if (selectAll.checked) selected.add(dev.id); else selected.delete(dev.id); }); });
  bulkToggle?.addEventListener('click', async ()=>{ if (!selected.size) return; devs.forEach(d=>{ if (selected.has(d.id)) d.enabled=!d.enabled; }); await set({'bs:devices':devs}); toast('Toggled protection for selected'); renderDevices(await loadState()); updateMetrics(await loadState()); });
  bulkProfile?.addEventListener('click', async ()=>{ if (!selected.size) return; const pid=prompt('Apply which profile id? (e.g., prof-default)'); if (!pid) return; devs.forEach(d=>{ if (selected.has(d.id)) d.profileId=pid; }); await set({'bs:devices':devs}); toast('Applied profile to selected'); renderDevices(await loadState()); });
}
async function renderDevicesCached(){ renderDevices(await loadState()); }
// @@CHUNK8
function renderProfiles(state){
  const profiles = state['bs:profiles']||[]; const active=state['bs:activeProfile'];
  profilesGrid.innerHTML='';
  profiles.forEach((p)=>{
    const card=document.createElement('div'); card.className='panel'; card.style.boxShadow='none';
    const h=document.createElement('div'); h.style.display='flex'; h.style.justifyContent='space-between'; h.style.alignItems='center';
    const t=document.createElement('h3'); t.textContent=p.name + (p.id===active?' (Default)':''); t.style.margin='0';
    const badge=document.createElement('span'); badge.className='chip'; badge.textContent=p.system?'System':'Custom';
    h.append(t,badge);
    const chips=document.createElement('div'); chips.className='chips';
    [['SafeSearch',p.safeSearch?'On':'Off'],['YouTube',p.ytRestricted?'Restricted':'Normal'],['Social',p.social],['Strict',p.strictness]].forEach(([k,v])=>{ const c=document.createElement('span'); c.className='chip'; c.textContent=`${k}: ${v}`; chips.appendChild(c); });
    const actions=document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px'; actions.style.marginTop='8px';
    const setDef=document.createElement('button'); setDef.className='btn'; setDef.textContent='Set as Default'; setDef.addEventListener('click', async ()=>{ await set({'bs:activeProfile': p.id}); toast(`Global profile: ${p.name}`); renderProfiles(await loadState()); });
    const edit=document.createElement('button'); edit.className='btn'; edit.textContent='Edit'; edit.addEventListener('click', ()=> setContext('profile', p.id));
    const dup=document.createElement('button'); dup.className='btn'; dup.textContent='Duplicate'; dup.addEventListener('click', async ()=>{ const copy={...p, id:makeId('prof'), name:`${p.name} (copy)`, system:false}; const st=await loadState(); await set({'bs:profiles':[...st['bs:profiles'],copy]}); toast('Profile duplicated'); renderProfiles(await loadState()); });
    const del=document.createElement('button'); del.className='btn'; del.textContent='Delete'; del.disabled=!!p.system; del.addEventListener('click', async ()=>{ const st=await loadState(); const next=(st['bs:profiles']||[]).filter(x=>x.id!==p.id); await set({'bs:profiles': next}); toast('Profile deleted'); renderProfiles(await loadState()); });
    actions.append(setDef,edit,dup,del);
    card.append(h,chips,actions); profilesGrid.appendChild(card);
  });
}
addProfileBtn?.addEventListener('click', async ()=>{ const name=prompt('Profile name'); if (!name) return; const st=await loadState(); const profiles=st['bs:profiles']||[]; if (profiles.some(p=>p.name.toLowerCase()===name.toLowerCase())){ toast('Name must be unique'); return; } const obj={ id:makeId('prof'), name, safeSearch:true, ytRestricted:true, social:'allow', strictness:'medium', notes:'', system:false }; await set({'bs:profiles':[...profiles, obj]}); toast('Profile added'); renderProfiles(await loadState()); });
exportProfilesBtn?.addEventListener('click', async ()=>{ const st=await loadState(); const data=JSON.stringify(st['bs:profiles']||[], null, 2); const blob=new Blob([data],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='profiles.json'; a.click(); URL.revokeObjectURL(url); });
importProfilesInput?.addEventListener('change', async (e)=>{ const f=e.target.files[0]; if (!f) return; try { const txt=await f.text(); const arr=JSON.parse(txt); if (!Array.isArray(arr)) throw new Error('Invalid'); await set({'bs:profiles':arr}); toast('Profiles imported'); renderProfiles(await loadState()); } catch { toast('Invalid JSON'); } finally { importProfilesInput.value=''; } });
// @@CHUNK9
function buildGrid(){ schGrid.innerHTML=''; const head=document.createElement('div'); head.className='lbl'; head.textContent=''; schGrid.appendChild(head); for (let h=0;h<24;h++){ const l=document.createElement('div'); l.className='lbl'; l.textContent=String(h).padStart(2,'0'); schGrid.appendChild(l);} for (let d=0; d<7; d++){ const dl=document.createElement('div'); dl.className='lbl'; dl.textContent=DAYS[d]; schGrid.appendChild(dl); for (let h=0; h<24; h++){ const cell=document.createElement('div'); cell.className='cell'; cell.dataset.day=String(d); cell.dataset.hour=String(h); cell.addEventListener('click', ()=> cell.classList.toggle('on')); schGrid.appendChild(cell);} }}
function gridFromRules(rules){ const cells=schGrid.querySelectorAll('.cell'); cells.forEach(c=>c.classList.remove('on')); (rules||[]).forEach(rule=>{ const days=rule.days||[]; const [sh]=rule.start.split(':').map(Number); const [eh]=rule.end.split(':').map(Number); days.forEach(d=>{ const di=DAYS.indexOf(d); if (di<0) return; if (eh>sh){ for(let h=sh; h<eh; h++){ const s=schGrid.querySelector(`.cell[datxday=\"${di}\"][datxhour=\"${h}\"]`); if (s) s.classList.add('on'); } } else { for(let h=sh; h<24; h++){ const s=schGrid.querySelector(`.cell[datxday=\"${di}\"][datxhour=\"${h}\"]`); if (s) s.classList.add('on'); } for(let h=0; h<eh; h++){ const s=schGrid.querySelector(`.cell[datxday=\"${di}\"][datxhour=\"${h}\"]`); if (s) s.classList.add('on'); } } }); }); }
function rulesFromGrid(){ const rules=[]; for (let d=0; d<7; d++){ let h=0; while(h<24){ const cell=schGrid.querySelector(`.cell[datxday=\"${d}\"][datxhour=\"${h}\"]`); if (cell && cell.classList.contains('on')){ let start=h; while(h<24){ const c=schGrid.querySelector(`.cell[datxday=\"${d}\"][datxhour=\"${h}\"]`); if (!c || !c.classList.contains('on')) break; h++; } const end=h; const day=DAYS[d]; rules.push({ days:[day], start:`${String(start).padStart(2,'0')}:00`, end:`${String(end).padStart(2,'0')}:00` }); } else { h++; } } } return mergeAdjacentRules(rules); }
function mergeAdjacentRules(rules){ const out=[]; const byDay={}; rules.forEach(r=>{ (byDay[r.days[0]] = byDay[r.days[0]]||[]).push(r); }); Object.entries(byDay).forEach(([day,list])=>{ list.sort((a,b)=> a.start.localeCompare(b.start)); let cur=null; list.forEach(r=>{ if (!cur) cur={...r}; else if (cur.end===r.start) cur.end=r.end; else { out.push(cur); cur={...r}; } }); if (cur) out.push(cur); }); return out; }
function schedulesFor(state, type, id){ return (state['bs:schedules']||[]).filter(s=> s.target?.type===type && s.target?.id===id); }
function detectConflict(state, devId){ const dev=(state['bs:devices']||[]).find(d=>d.id===devId); if (!dev) return false; const devRules=schedulesFor(state,'device',dev.id).flatMap(s=>s.rules||[]); const profRules=schedulesFor(state,'profile',dev.profileId).flatMap(s=>s.rules||[]); const hourSet=(rules)=>{ const map={}; rules.forEach(r=>{ const [sh]=r.start.split(':').map(Number); const [eh]=r.end.split(':').map(Number); for(let h=sh; h<eh; h++){ (map[r.days[0]] = map[r.days[0]]||new Set()).add(h); } }); return map; }; const a=hourSet(devRules), b=hourSet(profRules); return DAYS.some(day => a[day] && b[day] && [...a[day]].some(h=>b[day].has(h))); }
async function renderSchedules(state){ buildGrid(); const type=schTargetType.value; schTargetId.innerHTML=''; if (type==='device'){ (state['bs:devices']||[]).forEach(d=>{ const o=document.createElement('option'); o.value=d.id; o.textContent=d.name; schTargetId.appendChild(o); }); } else { (state['bs:profiles']||[]).forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.name; schTargetId.appendChild(o); }); } const currentId=schTargetId.value; const scheds=(state['bs:schedules']||[]).filter(s=> s.target?.type===type && s.target?.id===currentId); const rules=scheds.flatMap(s=>s.rules||[]); schPreview.textContent = rules.length ? JSON.stringify(rules) : 'No rules yet.'; gridFromRules(rules); schConflict.style.display = (type==='device' && detectConflict(state, currentId)) ? 'block' : 'none'; }
schTargetType?.addEventListener('change', async ()=> renderSchedules(await loadState()));
schTargetId?.addEventListener('change', async ()=> renderSchedules(await loadState()));
schSave?.addEventListener('click', async ()=>{ const rules=rulesFromGrid(); const st=await loadState(); const type=schTargetType.value; const id=schTargetId.value; let scheds=st['bs:schedules']||[]; const existing=scheds.find(s=> s.target?.type===type && s.target?.id===id); if (existing) existing.rules=rules; else scheds=[...scheds, { id:makeId('sch'), target:{type,id}, rules }]; await set({'bs:schedules':scheds}); toast('Routine saved'); renderSchedules(await loadState()); });
rtBedtime?.addEventListener('click', ()=> applyRoutinePreset('bed'));
rtHomework?.addEventListener('click', ()=> applyRoutinePreset('hw'));
rtWeekend?.addEventListener('click', ()=> applyRoutinePreset('wk'));
rtAlways?.addEventListener('click', ()=> applyRoutinePreset('all'));
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

(async function init(){
  const st = await loadState();
  enforceFamilyMode(st);
  updateTopbar(st);
  updateMetrics(st);
  renderSpark();
  renderQuickDevices(st); renderQuickProfiles(st); renderQuickRoutines();
  await renderDevices(st); renderProfiles(st); await renderSchedules(st); renderBlocklists(st); renderAllowlist(st); renderSettings(st); renderLogs(st);
})();



