# Device Binding - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     User's Browser                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────────┐  │
│  │   Bushido Extension  │         │   Dashboard (localhost)   │  │
│  │  (background.js)     │         │   (index.html, app.js)   │  │
│  │                      │         │                          │  │
│  │ Storage:             │         │ Uses DataAPI to:         │  │
│  │ - boundDeviceId      │◄────────┤ - Fetch binding status   │  │
│  │ - profile            │  via    │ - Bind device            │  │
│  │ - protection state   │ Message │ - Unbind device          │  │
│  │ - pause state        │  API    │ - Populate device list   │  │
│  │                      │         │                          │  │
│  └──────────────────────┘         └──────────────────────────┘  │
│           │                                 │                    │
│           │                                 │                    │
│           └─────────────────┬───────────────┘                    │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                    HTTP Requests to:
                    - /api/state
                    - /api/devices
                    - /api/extension-binding
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Dashboard Server                              │
│              (dashboard/server.js)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Express.js Routes:                                              │
│  ├─ GET  /api/state → All dashboard state                       │
│  ├─ GET  /api/devices → Device list                             │
│  ├─ GET  /api/extension-binding → Current binding               │
│  ├─ PATCH /api/extension-binding → Update binding               │
│  └─ DELETE /api/extension-binding → Clear binding               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Persistence Layer (state.json)                           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ {                                                         │   │
│  │   "devices": [...],                                       │   │
│  │   "profiles": [...],                                      │   │
│  │   "extensionBinding": "dev-123",  ◄── This field!        │   │
│  │   "settings": {...},                                      │   │
│  │   ...                                                     │   │
│  │ }                                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Message Flow - Binding Device

```
User clicks "Bind Device"
          │
          ▼
┌─────────────────────────────────────┐
│ Dashboard (app.js)                  │
│ - User selects device "Bushido-01"  │
│ - Clicks "Bind Device" button        │
│ - Calls DataAPI.bindExtensionToDevice()
│ - Shows toast "Binding..."           │
└─────────────────────────────────────┘
          │
          ▼ API.runtime.sendMessage()
┌─────────────────────────────────────┐
│ Extension (background.js)           │
│ - Receives BIND_DEVICE message      │
│ - Calls setBoundDevice('dev-123')   │
│ - Stores in chrome.storage.local    │
│ - Returns success response          │
└─────────────────────────────────────┘
          │
          ▼ Response
┌─────────────────────────────────────┐
│ Dashboard (app.js)                  │
│ - Receives { ok: true,              │
│     boundDeviceId: 'dev-123' }      │
│ - Calls updateDeviceBindingUI()     │
│ - Shows status "✓ Bound to: ..."    │
│ - Toast "✓ Extension bound"         │
└─────────────────────────────────────┘
          │
          ▼ (Optional) Sync to server
┌─────────────────────────────────────┐
│ Dashboard Server                    │
│ - Updates state.json with binding   │
│ - Persists for next session         │
└─────────────────────────────────────┘
```

## Data Structures

### Extension Storage (chrome.storage.local)
```javascript
{
  state: {
    sites: { /* ... */ },
    device: {
      name: "This device",
      mode: "Default",
      boundDeviceId: "dev-bushido-01"  // null if not bound
    },
    blocking: { /* ... */ }
  }
}
```

### Dashboard State (state.json)
```json
{
  "devices": [
    {
      "id": "dev-bushido-01",
      "name": "Bushido-01 (Pi 5 Pro)",
      "enabled": true,
      "profileId": "prof-default"
    }
  ],
  "extensionBinding": "dev-bushido-01",
  "settings": { /* ... */ }
}
```

## State Synchronization

### Flow 1: Extension Changes Binding
```
Extension Storage          Dashboard State (state.json)
┌──────────────────────┐   ┌──────────────────────┐
│ boundDeviceId:       │   │ extensionBinding:    │
│ "dev-123"            │   │ null                 │
└──────────────────────┘   └──────────────────────┘
        │ (User binds)            
        ▼
┌──────────────────────┐
│ boundDeviceId:       │
│ "dev-123" ✓          │
└──────────────────────┘
        │ (Optional sync)
        ▼
┌──────────────────────┐
│ extensionBinding:    │
│ "dev-123" ✓          │
└──────────────────────┘
```

### Flow 2: Server Persistence
```
Dashboard UI            Server (state.json)
┌──────────────────┐   ┌──────────────────┐
│ Bind UI opened   │   │ extensionBinding:│
│ with "Unbind"    │   │ "dev-123"        │ (from before)
│ button visible   │   └──────────────────┘
└──────────────────┘
        │ (Page refresh)
        ▼
        │ GET /api/extension-binding
        ├─────────────────────────────► 
        │                              │ Returns
        │◄───────────────────────────────
        │ { boundDeviceId: "dev-123" }
┌──────────────────┐
│ Bind UI shows    │
│ "✓ Bound to..." │
│ "Unbind" visible │
└──────────────────┘
```

## Message Protocol

### Extension Messages

```javascript
// BIND_DEVICE
{
  type: "BIND_DEVICE",
  deviceId: "dev-123"
}
// Response
{
  ok: true,
  boundDeviceId: "dev-123"
}

// UNBIND_DEVICE
{
  type: "UNBIND_DEVICE"
}
// Response
{
  ok: true,
  boundDeviceId: null
}

// GET_BOUND_DEVICE
{
  type: "GET_BOUND_DEVICE"
}
// Response
{
  ok: true,
  boundDeviceId: "dev-123"
}
```

## API Endpoints

### GET /api/extension-binding
Get current device binding
- **Response:** `{ boundDeviceId: "dev-123" | null }`

### PATCH /api/extension-binding
Update device binding (validates device exists)
- **Body:** `{ deviceId: "dev-123" }`
- **Response:** `{ boundDeviceId: "dev-123" }`

### DELETE /api/extension-binding
Clear device binding
- **Response:** `{ boundDeviceId: null }`

## Error Handling

### Extension Level
```javascript
try {
  const result = await DataAPI.bindExtensionToDevice(deviceId);
  if (!result) {
    toast('Failed to bind device');
  }
} catch (e) {
  console.error('Binding error:', e);
  toast('Error binding device');
}
```

### Dashboard Level
- Invalid device ID: Server rejects with 400
- Network error: Catch block shows generic error toast
- Missing device: Toast "Device not found"

## Performance Considerations

✓ **Minimal API calls:**
  - UI only fetches binding when Advanced modal opens
  - No polling or background sync

✓ **Local-first design:**
  - Extension stores binding locally (instant)
  - Server sync is secondary

✓ **Efficient storage:**
  - Single deviceId field, minimal overhead
  - JSON is small and fast to persist

## Future Enhancement Points

1. **Real-time sync**: WebSocket for instant updates
2. **Multi-device**: Show all devices and their binding status
3. **Per-device settings**: Profile, protection, pause state per device
4. **Device info**: Show device type, last seen, online status
5. **Bulk operations**: Bind multiple extensions to same device
