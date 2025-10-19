# Quick Test - Device Binding Fix

## Step 1: Start Dashboard Server
```bash
cd dashboard
npm start
```
You should see: `listening on http://localhost:5179`

## Step 2: Open Dashboard
- Go to: `http://localhost:5179/`
- Should load without errors

## Step 3: Test Device Binding

### Open Advanced Settings
1. Click "Advanced" button (top right)
2. Should see "Device Binding" section
3. Status should show: "⚠ Not bound to any device"

### Bind to a Device
1. Click dropdown "Select Device:"
2. Select "Bushido-01 (Pi 5 Pro)"
3. Click "Bind Device" button
4. Check for:
   - ✅ Toast message appears: "✓ Extension bound to Bushido-01..."
   - ✅ Status updates to: "✓ Bound to: Bushido-01 (Pi 5 Pro)"
   - ✅ "Unbind" button now visible
   - ✅ "Bind Device" button now hidden

### Check Browser Console (F12)
Should see logs:
```
Binding to device: dev-bushido-01
Bind result: dev-bushido-01
```

### Test Unbinding
1. Click "Unbind" button
2. Check for:
   - ✅ Toast message: "✓ Extension unbound"
   - ✅ Status returns to: "⚠ Not bound to any device"
   - ✅ "Bind Device" button visible again
   - ✅ "Unbind" button hidden

### Test Persistence
1. Bind to a device again
2. Press F5 (refresh page)
3. Click "Advanced" again
4. Status should still show: "✓ Bound to: [Device]"

### Test Different Device
1. Select different device (e.g., "MischxLaptop")
2. Click "Bind Device"
3. Status updates to new device

## Expected Results

| Test | Expected | Status |
|------|----------|--------|
| Bind works | Toast + UI update | ✅ |
| Unbind works | Toast + UI update | ✅ |
| Persistence | Binding survives refresh | ✅ |
| Multiple devices | Can bind/unbind multiple times | ✅ |
| Error messages | Clear if device not selected | ✅ |

## If Tests Fail

### "Error binding device" still appears?
1. Open DevTools (F12)
2. Go to Network tab
3. Try binding again
4. Look for request to `/api/extension-binding`
5. Check Response status (should be 200, not 400/500)
6. Copy the error message

### Console shows errors?
1. F12 → Console tab
2. Look for red error messages
3. Copy exact error and check:
   - Is server running?
   - Is there network error?
   - Is the URL correct?

### Device dropdown empty?
1. F12 → Console
2. Run: `fetch('/api/devices').then(r => r.json()).then(d => console.log(d))`
3. Should show list of devices
4. If error, server might not be running

## Success Indicators

✅ All toasts appear immediately  
✅ UI buttons toggle correctly  
✅ Status text updates  
✅ Console logs show device IDs (not null)  
✅ Binding persists after refresh  
✅ Can bind/unbind multiple times  

---

**If all tests pass:** Device binding is working! ✅  
**If any test fails:** Check console for error messages and refer to BUGFIX_DEVICE_BINDING.md
