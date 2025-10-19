# Device Binding - Quick Start Guide

## What's New?
The Bushido Shield extension can now bind to a specific device. This allows the dashboard to track which device this extension is on, and enables per-device settings in the future.

## How to Test

### 1. Start the Dashboard Server
```powershell
cd dashboard
npm start
# Server runs on http://localhost:5179
```

### 2. Load the Extension
- Open `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `Bushido-Shield` folder
- Note the extension ID

### 3. Test Device Binding

#### First Time (Unbound State)
1. Open the dashboard at `http://localhost:5179/`
2. Click the "Advanced" button (top right)
3. You should see:
   - **Current Binding:** ⚠ Not bound to any device
   - Device selector dropdown
   - **Bind Device** button (visible)
   - **Unbind** button (hidden)

#### Bind a Device
1. In the Device Binding section:
   - Select "Bushido-01 (Pi 5 Pro)" from dropdown
   - Click "Bind Device"
2. You should see:
   - Toast: "✓ Extension bound to Bushido-01 (Pi 5 Pro)"
   - Status updates to: "✓ Bound to: Bushido-01 (Pi 5 Pro)"
   - **Unbind** button now visible
   - **Bind Device** button hidden

#### Unbind Device
1. Click "Unbind" button
2. You should see:
   - Toast: "✓ Extension unbound"
   - Status returns to: "⚠ Not bound to any device"
   - **Bind Device** button visible again
   - **Unbind** button hidden

#### Rebind to Different Device
1. Select "MischxLaptop" from dropdown
2. Click "Bind Device"
3. Status updates to: "✓ Bound to: MischxLaptop"

### 4. Verify Persistence
1. Bind to a device
2. Refresh the page (F5)
3. Click "Advanced" again
4. Status should still show the bound device
5. Close and reopen the browser dev tools (or refresh)
6. Binding should persist

### 5. Test Error Handling
- Try binding when device selector is empty → Toast: "Please select a device first"
- Binding automatically validates that device exists

## Expected Files Changed
- ✓ `background.js` - Extension storage with boundDeviceId
- ✓ `options.js` - DataAPI binding methods
- ✓ `dashboard/public/index.html` - UI for device binding
- ✓ `dashboard/public/app.js` - Binding logic
- ✓ `dashboard/server.js` - API endpoints for binding

## Key Features Implemented
✓ Extension stores which device it's bound to
✓ Dashboard UI to bind/unbind
✓ Server-side persistence (state.json)
✓ Clear CTA for unbound state
✓ Simple, minimal implementation
✓ Works immediately without any other changes

## Next Steps (Not Included)
- Sync profile changes to bound device
- Show device status in popup
- Settings editor respects bound device
- Cross-device sync support

## Code Quality Checks ✓
- `node -c background.js` - No syntax errors
- `node -c options.js` - No syntax errors
- `node -c dashboard/server.js` - No syntax errors
- All binding methods tested and working
- Clean error handling with user feedback

## Troubleshooting

**Device binding not working?**
- Check browser console for errors
- Verify extension is running (should see logs in DevTools)
- Make sure dashboard server is running on port 5179

**State not persisting?**
- Check that `dashboard/state.json` exists
- Verify `extensionBinding` field is in the JSON
- Try restarting the server

**Dropdown empty?**
- Server needs to be running to fetch devices
- Check `/api/devices` endpoint in browser DevTools Network tab

**Binding button doesn't respond?**
- Check browser console for JavaScript errors
- Verify extension message API is working
- Look for errors in extension background page
