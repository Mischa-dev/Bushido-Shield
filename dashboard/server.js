const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const PORT = Number(process.env.PORT || 5179);
const DATA_FILE = path.join(__dirname, 'state.json');
const STATIC_DIR = path.join(__dirname, 'public');
const MAX_LOGS = 1000;

const makeId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

function createDefaultState() {
  const now = new Date().toISOString();
  return {
    devices: [
      {
        id: 'dev-bushido-01',
        name: 'Bushido-01 (Pi 5 Pro)',
        type: 'Gateway — Pi 5 Pro',
        ip: '192.168.1.10',
        mac: 'AA:BB:CC:DD:EE:10',
        enabled: true,
        profileId: 'prof-default',
        lastSeen: now,
        pausedUntil: null,
        accessLevel: 'admin'
      },
      {
        id: 'dev-bushido-02',
        name: 'Bushido-02 (Pi 3B+)',
        type: 'Gateway — Pi 3B+',
        ip: '192.168.1.11',
        mac: 'AA:BB:CC:DD:EE:11',
        enabled: true,
        profileId: 'prof-focus',
        lastSeen: now,
        pausedUntil: null,
        accessLevel: 'admin'
      },
      {
        id: 'dev-bushido-leaf',
        name: 'Bushido-Leaf (Pi Zero W2)',
        type: 'Sensor — Pi Zero W2',
        ip: '192.168.1.12',
        mac: 'AA:BB:CC:DD:EE:12',
        enabled: true,
        profileId: 'prof-school',
        lastSeen: now,
        pausedUntil: null,
        accessLevel: 'user'
      },
      {
        id: 'dev-mischa',
        name: 'MischxLaptop',
        type: 'Laptop — Windows',
        ip: '192.168.1.42',
        mac: 'AA:BB:CC:DD:EE:42',
        enabled: true,
        profileId: 'prof-default',
        lastSeen: now,
        pausedUntil: null,
        accessLevel: 'admin'
      },
      {
        id: 'dev-pixel',
        name: 'Pixel 6 Pro',
        type: 'Phone — Android',
        ip: '192.168.1.77',
        mac: 'AA:BB:CC:DD:EE:77',
        enabled: false,
        profileId: 'prof-focus',
        lastSeen: now,
        pausedUntil: null,
        accessLevel: 'user'
      }
    ],
    profiles: [
      {
        id: 'prof-default',
        name: 'Default',
        description: 'Balanced protection for everyday browsing.',
        blockPorn: true,
        blockGambling: false,
        blockTrackers: true,
        blockSocial: false,
        socialSites: ['facebook.com', 'instagram.com'],
        customBlockList: [],
        customAllowList: [],
        timeRules: [],
        system: true
      },
      {
        id: 'prof-school',
        name: 'School',
        description: 'Locks down distractions during study hours.',
        blockPorn: true,
        blockGambling: true,
        blockTrackers: true,
        blockSocial: true,
        socialSites: ['youtube.com', 'tiktok.com', 'instagram.com'],
        customBlockList: [],
        customAllowList: [],
        timeRules: [
          {
            type: 'allow_internet',
            description: 'Homework window',
            days: ['Mon', 'Tue', 'Wed', 'Thu'],
            start: '15:30',
            end: '19:30',
            enabled: true
          }
        ],
        system: true
      },
      {
        id: 'prof-focus',
        name: 'Focus',
        description: 'Tight restrictions for deep work sessions.',
        blockPorn: true,
        blockGambling: true,
        blockTrackers: true,
        blockSocial: true,
        socialSites: ['reddit.com', 'twitter.com', 'news.ycombinator.com'],
        customBlockList: ['twitch.tv'],
        customAllowList: ['docs.google.com'],
        timeRules: [
          {
            type: 'block_internet',
            description: 'Wind down',
            days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
            start: '22:00',
            end: '06:00',
            enabled: true
          }
        ],
        system: true
      }
    ],
    schedules: [
      {
        id: 'sch-1',
        target: { type: 'device', id: 'dev-pixel' },
        rules: [
          { days: ['Mon', 'Tue', 'Wed', 'Thu'], start: '21:00', end: '07:00' }
        ]
      }
    ],
    filters: {
      blocklists: [
        {
          id: 'bl-1',
          name: 'OISD Basic',
          source: 'https://oisd.nl/basic.txt',
          enabled: true,
          lastSync: now
        },
        {
          id: 'bl-2',
          name: 'HaGeZi Multi',
          source: 'https://example/hagezi.txt',
          enabled: true,
          lastSync: now
        }
      ],
      allowlist: ['school.edu', 'docs.google.com'],
      customRules: ['||doubleclick.net^', '@@||youtube.com^$document'],
      blocked: ['doubleclick.net'],
      allowed: ['docs.google.com']
    },
    logs: [
      {
        id: makeId('log'),
        time: now,
        domain: 'doubleclick.net',
        action: 'blocked',
        device: 'MischxLaptop',
        rule: 'OISD Basic'
      },
      {
        id: makeId('log'),
        time: now,
        domain: 'docs.google.com',
        action: 'allowed',
        device: 'MischxLaptop',
        rule: 'Allowlist'
      },
      {
        id: makeId('log'),
        time: now,
        domain: 'youtube.com',
        action: 'policy',
        device: 'Pixel 6 Pro',
        rule: 'Focus profile'
      }
    ],
    settings: {
      dns: 'quad9',
      dnsCustom: '',
      admin: 'Mischa',
      familyLock: true,
      adminPin: '7777'
    },
    extensionBinding: null,
    enabledGlobal: true,
    activeProfile: 'prof-default',
    lastSync: now,
    pausedUntil: null
  };
}

async function loadState() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const seeded = createDefaultState();
    await saveState(seeded);
    return seeded;
  }
}

async function saveState(state) {
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function normalizeState(input = {}) {
  const defaults = createDefaultState();
  const state = {
    ...defaults,
    ...input,
    devices: Array.isArray(input.devices) ? input.devices : defaults.devices,
    profiles: Array.isArray(input.profiles) ? input.profiles : defaults.profiles,
    schedules: Array.isArray(input.schedules) ? input.schedules : defaults.schedules,
    filters: { ...defaults.filters, ...(input.filters || {}) },
    logs: Array.isArray(input.logs) ? input.logs : defaults.logs,
    settings: { ...defaults.settings, ...(input.settings || {}) }
  };
  if (state.settings) {
    if (typeof state.settings.adminPin === 'undefined' || state.settings.adminPin === null) {
      state.settings.adminPin = defaults.settings.adminPin;
    }
    state.settings.adminPin = String(state.settings.adminPin).trim() || defaults.settings.adminPin;
  }
  return state;
}

async function mutateState(mutator) {
  const state = await loadState();
  const next = await mutator(state);
  if (next) {
    await saveState(next);
    return next;
  }
  await saveState(state);
  return state;
}

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.static(STATIC_DIR));

app.get('/api/state', async (req, res, next) => {
  try {
    const state = await loadState();
    res.json(state);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/state', async (req, res, next) => {
  try {
    const updates = req.body || {};
    const updated = await mutateState((state) => {
      const next = { ...state };
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'devices' && Array.isArray(value)) {
          next.devices = value;
        } else if (key === 'profiles' && Array.isArray(value)) {
          next.profiles = value;
        } else if (key === 'schedules' && Array.isArray(value)) {
          next.schedules = value;
        } else if (key === 'filters' && value && typeof value === 'object') {
          next.filters = { ...next.filters, ...value };
        } else if (key === 'logs' && Array.isArray(value)) {
          next.logs = value.slice(0, MAX_LOGS);
        } else if (key === 'settings' && value && typeof value === 'object') {
          next.settings = { ...next.settings, ...value };
        } else if (key === 'enabledGlobal') {
          next.enabledGlobal = Boolean(value);
        } else if (key === 'activeProfile') {
          next.activeProfile = value;
        } else if (key === 'lastSync') {
          next.lastSync = value;
        } else if (key === 'pausedUntil') {
          next.pausedUntil = value;
        }
      }
      return next;
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.get('/api/devices', async (req, res, next) => {
  try {
    const { devices } = await loadState();
    res.json(devices);
  } catch (error) {
    next(error);
  }
});

app.post('/api/devices', async (req, res, next) => {
  try {
    const payload = req.body || {};
    let created;
    const state = await mutateState((current) => {
      created = {
        id: payload.id || makeId('dev'),
        name: payload.name || 'New Device',
        type: payload.type || 'Device',
        ip: payload.ip || '0.0.0.0',
        mac: payload.mac || 'AA:BB:CC:DD:EE:00',
        enabled: typeof payload.enabled === 'boolean' ? payload.enabled : true,
        profileId: payload.profileId || current.activeProfile || 'prof-default',
        lastSeen: payload.lastSeen || new Date().toISOString()
      };
      return { ...current, devices: [...current.devices, created] };
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/devices/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    let updatedDevice;
    const state = await mutateState((current) => {
      const devices = current.devices.map((device) => {
        if (device.id !== id) return device;
        updatedDevice = {
          ...device,
          ...payload,
          lastSeen: payload.lastSeen || device.lastSeen || new Date().toISOString()
        };
        return updatedDevice;
      });
      if (!updatedDevice) {
        return current;
      }
      return { ...current, devices };
    });
    if (!updatedDevice) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json(updatedDevice);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/devices/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let removed = false;
    await mutateState((current) => {
      const nextDevices = current.devices.filter((device) => {
        if (device.id === id) {
          removed = true;
          return false;
        }
        return true;
      });
      if (!removed) return current;
      return { ...current, devices: nextDevices };
    });
    if (!removed) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/profiles', async (req, res, next) => {
  try {
    const { profiles } = await loadState();
    res.json(profiles);
  } catch (error) {
    next(error);
  }
});

app.post('/api/profiles', async (req, res, next) => {
  try {
    const payload = req.body || {};
    let created;
    await mutateState((current) => {
      created = {
        id: payload.id || makeId('prof'),
        name: payload.name || 'New Profile',
        description: payload.description || '',
        blockPorn: Boolean(payload.blockPorn),
        blockGambling: Boolean(payload.blockGambling),
        blockTrackers: Boolean(payload.blockTrackers),
        blockSocial: Boolean(payload.blockSocial),
        socialSites: Array.isArray(payload.socialSites) ? payload.socialSites : [],
        customBlockList: Array.isArray(payload.customBlockList) ? payload.customBlockList : [],
        customAllowList: Array.isArray(payload.customAllowList) ? payload.customAllowList : [],
        timeRules: Array.isArray(payload.timeRules) ? payload.timeRules : [],
        system: Boolean(payload.system)
      };
      return { ...current, profiles: [...current.profiles, created] };
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/profiles/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    let updatedProfile;
    await mutateState((current) => {
      const profiles = current.profiles.map((profile) => {
        if (profile.id !== id) return profile;
        updatedProfile = {
          ...profile,
          ...payload,
          socialSites: Array.isArray(payload.socialSites) ? payload.socialSites : profile.socialSites,
          customBlockList: Array.isArray(payload.customBlockList) ? payload.customBlockList : profile.customBlockList,
          customAllowList: Array.isArray(payload.customAllowList) ? payload.customAllowList : profile.customAllowList,
          timeRules: Array.isArray(payload.timeRules) ? payload.timeRules : profile.timeRules
        };
        return updatedProfile;
      });
      if (!updatedProfile) return current;
      return { ...current, profiles };
    });
    if (!updatedProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/profiles/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let removed = false;
    await mutateState((current) => {
      const profiles = current.profiles.filter((profile) => {
        if (profile.id === id) {
          removed = true;
          return false;
        }
        return true;
      });
      if (!removed) return current;
      const devices = current.devices.map((device) => {
        if (device.profileId === id) {
          return { ...device, profileId: current.activeProfile || 'prof-default' };
        }
        return device;
      });
      return { ...current, profiles, devices };
    });
    if (!removed) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/schedules', async (req, res, next) => {
  try {
    const { schedules } = await loadState();
    res.json(schedules);
  } catch (error) {
    next(error);
  }
});

app.post('/api/schedules', async (req, res, next) => {
  try {
    const payload = req.body || {};
    let created;
    await mutateState((current) => {
      created = {
        id: payload.id || makeId('sched'),
        target: payload.target || { type: 'device', id: '' },
        rules: Array.isArray(payload.rules) ? payload.rules : []
      };
      return { ...current, schedules: [...current.schedules, created] };
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/schedules/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    let updated;
    await mutateState((current) => {
      const schedules = current.schedules.map((schedule) => {
        if (schedule.id !== id) return schedule;
        updated = {
          ...schedule,
          ...payload,
          rules: Array.isArray(payload.rules) ? payload.rules : schedule.rules
        };
        return updated;
      });
      if (!updated) return current;
      return { ...current, schedules };
    });
    if (!updated) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/schedules/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let removed = false;
    await mutateState((current) => {
      const schedules = current.schedules.filter((schedule) => {
        if (schedule.id === id) {
          removed = true;
          return false;
        }
        return true;
      });
      if (!removed) return current;
      return { ...current, schedules };
    });
    if (!removed) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/settings', async (req, res, next) => {
  try {
    const state = await loadState();
    res.json({ ...state.settings, globalEnabled: state.enabledGlobal });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/settings', async (req, res, next) => {
  try {
    const payload = req.body || {};
    const updated = await mutateState((current) => {
      const next = { ...current };
      if ('globalEnabled' in payload) {
        next.enabledGlobal = Boolean(payload.globalEnabled);
      }
      next.settings = {
        ...next.settings,
        dns: payload.dns ?? next.settings.dns,
        dnsCustom: payload.dnsCustom ?? next.settings.dnsCustom,
        admin: payload.admin ?? next.settings.admin,
        familyLock: typeof payload.familyLock === 'boolean' ? payload.familyLock : next.settings.familyLock
      };
      return next;
    });
    res.json({ ...updated.settings, globalEnabled: updated.enabledGlobal });
  } catch (error) {
    next(error);
  }
});

app.get('/api/logs', async (req, res, next) => {
  try {
    const state = await loadState();
    let logs = state.logs;
    const { type, limit } = req.query;
    if (type) {
      logs = logs.filter((log) => log.action === type);
    }
    if (limit) {
      const cap = Number(limit);
      if (Number.isFinite(cap) && cap > 0) {
        logs = logs.slice(0, cap);
      }
    }
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

app.post('/api/logs', async (req, res, next) => {
  try {
    const payload = req.body || {};
    let created;
    await mutateState((current) => {
      created = {
        id: payload.id || makeId('log'),
        time: payload.time || new Date().toISOString(),
        domain: payload.domain || 'unknown',
        action: payload.action || 'info',
        device: payload.device || 'unknown',
        rule: payload.rule || ''
      };
      const logs = [created, ...current.logs];
      if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
      return { ...current, logs };
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// Extension binding endpoints
app.get('/api/extension-binding', async (req, res, next) => {
  try {
    const state = await loadState();
    res.json({ boundDeviceId: state.extensionBinding });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/extension-binding', async (req, res, next) => {
  try {
    const { deviceId } = req.body || {};
    const state = await mutateState((current) => {
      // Verify device exists if binding to one
      if (deviceId && !current.devices.some(d => d.id === deviceId)) {
        return current;
      }
      return { ...current, extensionBinding: deviceId || null };
    });
    res.json({ boundDeviceId: state.extensionBinding });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/extension-binding', async (req, res, next) => {
  try {
    const state = await mutateState((current) => {
      return { ...current, extensionBinding: null };
    });
    res.json({ boundDeviceId: null });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Bushido dashboard server listening on http://localhost:${PORT}`);
});
