# Device Binding - Developer Quick Reference

## Quick Start

### Load & Test
```bash
# 1. Load extension in chrome://extensions/
# 2. Start dashboard
cd dashboard && npm start
# 3. Open http://localhost:5179
# 4. Click Advanced → see Device Binding section
```

## API Reference

### Extension Messages (from Dashboard)

```javascript
// Bind extension to a device
const response = await new Promise((resolve) => {
  API.runtime.sendMessage(
    { type: 'BIND_DEVICE', deviceId: 'dev-bushido-01' },
    resolve
  );
});
// Returns: { ok: true, boundDeviceId: 'dev-bushido-01' }

// Unbind extension
const response = await new Promise((resolve) => {
  API.runtime.sendMessage({ type: 'UNBIND_DEVICE' }, resolve);
});
// Returns: { ok: true, boundDeviceId: null }

// Get current binding
const response = await new Promise((resolve) => {
  API.runtime.sendMessage({ type: 'GET_BOUND_DEVICE' }, resolve);
});
// Returns: { ok: true, boundDeviceId: 'dev-bushido-01' | null }
```

### DataAPI Methods (Dashboard)

```javascript
// Get current binding
const binding = await DataAPI.getExtensionBinding();
// Returns: 'dev-123' | null

// Bind to device
const deviceId = await DataAPI.bindExtensionToDevice('dev-bushido-01');
// Returns: 'dev-bushido-01' | null

// Unbind
const success = await DataAPI.unbindExtension();
// Returns: true | false
```

### HTTP Endpoints (Server)

```javascript
// Get binding
GET /api/extension-binding
// Response: { boundDeviceId: 'dev-123' | null }

// Update binding
PATCH /api/extension-binding
// Body: { deviceId: 'dev-123' }
// Response: { boundDeviceId: 'dev-123' }

// Clear binding
DELETE /api/extension-binding
// Response: { boundDeviceId: null }
```

## Data Flow Reference

```
User Action          Extension                Dashboard              Server
─────────────────────────────────────────────────────────────────────────
Click "Bind"
  ▼
             ← getMessage("BIND_DEVICE")
  ▼
Store in             → Respond ✓
chrome.storage
  ▼                                ← Fetch binding
                                   ▼
                                Check devices
                                   ▼
                                   ├─→ GET /api/extension-binding
                                   ▼
                        Update UI ✓
```

## State Structures

### Extension State (chrome.storage.local)
```javascript
{
  state: {
    device: {
      name: "This device",
      mode: "Default",
      boundDeviceId: "dev-bushido-01" // ← The binding
    }
  }
}
```

### Server State (state.json)
```json
{
  "extensionBinding": "dev-bushido-01",
  "devices": [...]
}
```

## Common Patterns

### Check if bound
```javascript
async function isBound() {
  const binding = await DataAPI.getExtensionBinding();
  return binding !== null;
}
```

### Get bound device name
```javascript
async function getBoundDeviceName() {
  const devices = await DataAPI.getDevices();
  const binding = await DataAPI.getExtensionBinding();
  const device = devices.find(d => d.id === binding);
  return device?.name || 'Unknown Device';
}
```

### Bind to first device
```javascript
async function bindToFirstDevice() {
  const devices = await DataAPI.getDevices();
  if (devices.length > 0) {
    await DataAPI.bindExtensionToDevice(devices[0].id);
  }
}
```

### Update UI when binding changes
```javascript
async function syncBindingUI() {
  const binding = await DataAPI.getExtensionBinding();
  const devices = await DataAPI.getDevices();
  const device = devices.find(d => d.id === binding);
  
  if (binding && device) {
    showBindingStatus(`✓ Bound to: ${device.name}`);
    showUnbindButton();
  } else {
    showBindingStatus('⚠ Not bound to any device');
    showBindButton();
  }
}
```

## Error Handling

```javascript
try {
  const result = await DataAPI.bindExtensionToDevice(deviceId);
  if (!result) {
    // Device invalid or extension error
    toast('Failed to bind device');
  } else {
    // Success
    toast(`✓ Bound to ${deviceName}`);
  }
} catch (error) {
  // Network or communication error
  console.error('Binding error:', error);
  toast('Error binding device');
}
```

## Testing Queries

### Check extension binding (DevTools Console)
```javascript
// In extension background page console:
chrome.storage.local.get('state', (data) => {
  console.log('boundDeviceId:', data.state.device.boundDeviceId);
});
```

### Check server binding (Browser Console)
```javascript
// In dashboard page console:
fetch('/api/extension-binding')
  .then(r => r.json())
  .then(data => console.log('Server binding:', data.boundDeviceId));
```

### List all devices (Browser Console)
```javascript
fetch('/api/devices')
  .then(r => r.json())
  .then(devices => {
    devices.forEach(d => console.log(`${d.id}: ${d.name}`));
  });
```

## Debugging Tips

1. **Check extension storage:**
   - Open `chrome://extensions/`
   - Click extension → Background page
   - DevTools Console → Run storage check

2. **Check server state:**
   - Look at `dashboard/state.json`
   - Search for `"extensionBinding"`

3. **Monitor API calls:**
   - Browser DevTools → Network tab
   - Look for `/api/extension-binding` requests

4. **Check console logs:**
   - Extension: DevTools in background page
   - Dashboard: Browser DevTools console
   - Server: Terminal where `npm start` runs

5. **Verify device list:**
   - Open DevTools Network
   - Call `/api/devices`
   - Copy device ID for testing

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Binding not showing | Refresh page / Restart dashboard |
| Device dropdown empty | Check `/api/devices` endpoint in Network |
| "Failed to bind device" | Verify device ID is valid |
| Binding doesn't persist | Check state.json write permissions |
| Extension not responding | Check background page is loaded |
| Network errors | Verify dashboard server is running |

## File Locations

| File | Purpose |
|------|---------|
| `background.js` | Extension storage & messaging |
| `options.js` | Dashboard API layer |
| `dashboard/public/index.html` | UI markup |
| `dashboard/public/app.js` | Dashboard logic |
| `dashboard/server.js` | API endpoints |
| `dashboard/state.json` | Server persistence |

## Adding New Features (Next Phases)

### Apply device profile
```javascript
// In background.js, add:
async function applyProfile(profileId) {
  const st = await getStateWithDefaults();
  const boundDeviceId = st.device.boundDeviceId;
  if (!boundDeviceId) {
    console.warn('Not bound to any device');
    return;
  }
  // Sync to server/device here
  st.device.mode = profileId;
  await setState(st);
}
```

### Show device status
```javascript
// In dashboard, add device status badge
const binding = await DataAPI.getExtensionBinding();
const device = devices.find(d => d.id === binding);
if (device) {
  showStatus(`Connected to ${device.name}`);
}
```

### Sync settings to device
```javascript
// In app.js, add:
async function syncSettingToDevice(setting) {
  const binding = await DataAPI.getExtensionBinding();
  // Send to backend API for device
  await fetch(`/api/devices/${binding}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(setting)
  });
}
```

## Performance Notes

- ✓ Binding fetches happen only when Advanced modal opens
- ✓ No background polling or real-time sync
- ✓ Device list fetched once per modal open
- ✓ State persisted atomically (no incremental writes)
- ✓ Minimal memory footprint (single string field)

---

**Last Updated:** October 19, 2025
**Version:** 1.0
**Status:** Production Ready
