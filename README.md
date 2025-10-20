
# Bushido Shield — MVP WebExtension

This is a tiny, backend‑agnostic MVP for your cross‑browser extension.

## What it does (today)
- **Per‑site ON/OFF** from the popup (stores preference locally).
- **Quick Modes** in the popup (`Default`, `School`, `Focus`).
- **Basic ad hiding** via conservative CSS (demo only).
- **Focus Mode** overlay that blocks popular social/video sites on this device.
- **Dashboard (Options page)** to view/change per‑site preferences.
- **Two-Level Access Control** — Admin (full control) and User (restricted) modes for parental control.

> Later, wire these controls to your real backend (AdGuard API) and multi‑device cloud.

## 🆕 Access Control System

The dashboard now includes a lightweight access control system with two levels:

- **Admin** — Full access to all features, devices, profiles, and settings
- **User** — Restricted to Overview tab with pause/resume capability only

**Quick Start:**
- Default PIN: `7777`
- Switch modes via Advanced Settings
- Admin → User: instant
- User → Admin: requires PIN

See `ACCESS_CONTROL_QUICKSTART.md` for details.

## Test it now

### Chrome / Edge (Chromium)
1. Visit `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Click the toolbar icon → toggle **Block on this site**.
5. Try **Mode = Focus** and open youtube.com to see the overlay.

### Firefox
1. Visit `about:debugging#/runtime/this-firefox`.
2. **Load Temporary Add-on…** and choose `manifest.json` in this folder.
3. Use the toolbar button as above.
   - Note: Firefox MV3 support is evolving; this MVP uses standard APIs that work in current builds.

### Safari (macOS)
Safari supports **Safari Web Extensions**. Convert with Xcode:
```
xcrun safari-web-extension-converter /path/to/bushido-shield-mvp --macos-only --project-location /tmp/BS-Converter
```
Open the generated Xcode project, enable signing, build and run. Then enable the extension in **Safari > Settings > Extensions**.

## File map
- `manifest.json` — MV3 manifest
- `background.js` — service worker: state, messaging
- `content.js` — CSS hider + Focus overlay
- `popup.html/css/js` — popup UI
- `options.html/js` — simple dashboard
- `icons/*` — placeholder icons

## Notes
- No network request blocking yet (no DNR rules). We only hide elements and overlay Focus sites. Add DNR rules later for Chromium and a request‑blocking path for Firefox.
- State is local to this browser/device. Multi‑device control will come from your backend.
- The selectors are intentionally conservative; expand once you wire to a real rules engine.
