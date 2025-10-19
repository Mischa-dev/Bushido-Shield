# Device Binding - Visual Reference Guide

## UI States

### 1. Unbound State (Initial)
```
┌─────────────────────────────────────────────┐
│ Device Binding                              │
├─────────────────────────────────────────────┤
│                                             │
│ Current Binding:                            │
│ ⚠ Not bound to any device                  │
│ Select a device below to bind this          │
│ extension.                                  │
│                                             │
│ Select Device:    [Choose a device...]      │
│                   [ Bind Device ]           │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. Bound State
```
┌─────────────────────────────────────────────┐
│ Device Binding                              │
├─────────────────────────────────────────────┤
│                                             │
│ Current Binding:                            │
│ ✓ Bound to: Bushido-01 (Pi 5 Pro)          │
│                                             │
│ Select Device:    [Bushido-01 (Pi 5 Pro)]  │
│                   [ Unbind ]                │
│                                             │
└─────────────────────────────────────────────┘
```

### 3. Device Selector Dropdown
```
Select Device:
└─ Choose a device...
└─ Bushido-01 (Pi 5 Pro)          ◄── Selectable
└─ Bushido-02 (Pi 3B+)
└─ Bushido-Leaf (Pi Zero W2)
└─ MischxLaptop
└─ Pixel 6 Pro
```

## User Interaction Flow

### Scenario A: Bind Device
```
┌──────────────────┐
│ Dashboard Open   │
└──────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ User clicks "Advanced" button     │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Advanced Settings Modal Opens     │
│ [Unbound] Status displayed        │
│ Device dropdown showing all       │
│ "Bind Device" button visible      │
│ "Unbind" button hidden            │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ User selects "Bushido-01" device │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ User clicks "Bind Device"         │
└──────────────────────────────────┘
         │
         ▼ (Behind the scenes)
┌──────────────────────────────────┐
│ DataAPI sends message to extension│
│ Extension stores binding          │
│ Extension responds with success   │
│ Dashboard updates UI              │
│ Server saves to state.json        │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Toast: "✓ Extension bound to...  │
│ Status: "✓ Bound to: Bushido-01" │
│ "Unbind" button now visible       │
│ "Bind Device" button now hidden   │
└──────────────────────────────────┘
```

### Scenario B: Unbind Device
```
┌──────────────────┐
│ Device Bound     │
│ "Unbind" visible │
└──────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ User clicks "Unbind" button       │
└──────────────────────────────────┘
         │
         ▼ (Behind the scenes)
┌──────────────────────────────────┐
│ DataAPI sends UNBIND message      │
│ Extension clears binding          │
│ Extension responds                │
│ Dashboard updates UI              │
│ Server saves to state.json        │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Toast: "✓ Extension unbound"      │
│ Status: "⚠ Not bound..."          │
│ "Bind Device" button visible      │
│ "Unbind" button hidden            │
└──────────────────────────────────┘
```

### Scenario C: Refresh Persistence
```
┌────────────────────────┐
│ Device Bound           │
│ Shows: "✓ Bound to..." │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ User presses F5        │
│ (Page refreshes)       │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Page reloads           │
│ App.js runs            │
│ Advanced modal closed  │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ User clicks Advanced   │
│ updateDeviceBindingUI()│
│ fetches from extension │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Status still shows:    │
│ "✓ Bound to: Bushido" │
│ Persistence works! ✓   │
└────────────────────────┘
```

## Data Movement Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Extension                  Dashboard                Server   │
│  (background.js)            (app.js)               (server.js)│
│                                                               │
│  Local Storage              In-Memory              state.json │
│  ────────────               ─────────              ──────────  │
│  {                          {                      {           │
│    device: {                  devices,              devices,   │
│      boundDeviceId:           profiles,             profiles,  │
│      "dev-123" ──────────┐    extensionBinding    extensionB: │
│    }                      │    ◄─────────────────► "dev-123"  │
│  }                        │                       }            │
│   │                       │                        │           │
│   └───────────────────────┼────────────────────────┘           │
│          Message API  + HTTP Requests                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────┐
│ Dashboard User Interface                                │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Advanced Settings Modal                           │   │
│ │ ┌─────────────────────────────────────────────┐   │   │
│ │ │ Device Binding Section                      │   │   │
│ │ │ ┌─────────────────────────────────────────┐ │   │   │
│ │ │ │ Current Status [Display Component]      │ │   │   │
│ │ │ │ - Shows bound/unbound state             │ │   │   │
│ │ │ └─────────────────────────────────────────┘ │   │   │
│ │ │ ┌─────────────────────────────────────────┐ │   │   │
│ │ │ │ Device Selector [Dropdown]              │ │   │   │
│ │ │ │ - Populated from /api/devices           │ │   │   │
│ │ │ └─────────────────────────────────────────┘ │   │   │
│ │ │ ┌─────────────────────────────────────────┐ │   │   │
│ │ │ │ Bind / Unbind Buttons                   │ │   │   │
│ │ │ │ - Show/hide based on state              │ │   │   │
│ │ │ └─────────────────────────────────────────┘ │   │   │
│ │ └─────────────────────────────────────────────┘   │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                    │                     │
         ▼                    ▼                     ▼
    ┌────────┐           ┌──────────┐          ┌──────────┐
    │API.msg │           │  HTTP    │          │ Storage  │
    │to Ext  │           │ Requests │          │  Layer   │
    └────────┘           └──────────┘          └──────────┘
         │                    │                     │
         ▼                    ▼                     ▼
    ┌────────────┐        ┌────────────┐       ┌────────────┐
    │ Extension  │        │ Dashboard  │       │ Chrome     │
    │ Background │        │ Server     │       │ Storage    │
    │ (bg.js)    │        │ (server.js)│       │ + state.json
    └────────────┘        └────────────┘       └────────────┘
```

## State Transitions

```
States:
  UNBOUND: boundDeviceId = null
  BOUND:   boundDeviceId = "dev-123"

Transitions:
  UNBOUND ──[BIND_DEVICE]───► BOUND
    │                            │
    │                            ▼
    │                       (Show "Bound to...")
    │                       (Show "Unbind" btn)
    │
    └──[No action]──────► UNBOUND (initial)
                              │
                              ▼
                         (Show CTA)
                         (Show "Bind" btn)

  BOUND ──[UNBIND_DEVICE]──► UNBOUND
    │                            │
    └─────────[No action]────────┘

  BOUND ──[BIND_DEVICE]──────► BOUND
    │                       (with new deviceId)
    └─[deviceId changed]──► Rebind to different device
```

## Toast Notifications

```
Success Toasts:
├─ "✓ Extension bound to Bushido-01 (Pi 5 Pro)"
├─ "✓ Extension unbound"
└─ Action completed successfully

Error Toasts:
├─ "Please select a device first"
├─ "Device not found"
├─ "Failed to bind device"
├─ "Failed to unbind extension"
└─ "Error [binding|unbinding] device"

Timing:
└─ Auto-dismiss after 2.4 seconds
```

## Accessibility Features

```
┌──────────────────────────────────────┐
│ Device Binding UI Accessibility      │
├──────────────────────────────────────┤
│                                      │
│ ✓ Proper labels for inputs           │
│ ✓ ARIA attributes on buttons         │
│ ✓ Keyboard navigation support        │
│ ✓ Focus visible on interactive items │
│ ✓ Color-coded status (+ text)        │
│ ✓ Clear error messages               │
│ ✓ Screen reader friendly             │
│                                      │
└──────────────────────────────────────┘
```

## Mobile/Responsive Considerations

```
Desktop (1200px+):
┌─────────────────────────────┐
│ Device Binding              │
├─────────────────────────────┤
│ Status: [Display]           │
│ [Device Selector] [Bind]    │
└─────────────────────────────┘

Tablet (600px+):
┌──────────────────────┐
│ Device Binding       │
├──────────────────────┤
│ Status: [Display]    │
│ [Device Selector]    │
│ [Bind]               │
└──────────────────────┘

Mobile (< 600px):
┌─────────────────┐
│ Device Binding  │
├─────────────────┤
│ Status display  │
│ [Selector]      │
│ [Bind btn]      │
└─────────────────┘
```

---

**Visual Design:** Clean, minimal, user-friendly
**Accessibility:** ✅ WCAG compliant
**Responsiveness:** ✅ Mobile-friendly
**Feedback:** ✅ Toast notifications
**Error Handling:** ✅ Clear messages
