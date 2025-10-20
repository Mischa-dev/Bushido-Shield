# Access Control System Implementation

**Date:** October 19, 2025  
**Feature:** Two-Level Access System for Bushido Shield Dashboard

## Overview

A lightweight, localStorage-based access control system has been implemented to provide two distinct user experience levels:

### Access Levels

#### Level 1: Admin (Full Control)
- **Complete access** to all dashboard features
- Can view and modify all devices
- Can create, edit, and delete profiles
- Can change filtering rules and blocklists
- Can modify global settings
- Can access advanced features (Settings, Filtering, Logs tabs)
- Can change system PIN
- Can switch between Admin and User access levels

#### Level 2: User (Restricted)
- **Limited access** designed for family members or supervised users
- Can view the Overview tab only
- Can pause/resume ad blocking protection
- **Cannot** view or edit the Devices tab
- **Cannot** modify profiles
- **Cannot** change global settings
- **Cannot** access Advanced Settings modal
- **Cannot** view Filtering, Settings, or Logs tabs
- Must authenticate with PIN to switch back to Admin level

## Implementation Details

### 1. Visual Indicators

#### Access Level Pill (Header)
- Located in the top-right hero section
- Shows current access level with distinctive styling:
  - **Admin**: Red/brand-colored pill with user icon
  - **User**: Blue/info-colored pill with user icon
- Always visible to maintain awareness of current access level

#### Advanced Settings Modal
- New "Access Level" section added
- Radio button selection for Admin/User
- Warning message when switching to User level
- PIN authentication required when switching back to Admin

### 2. Technical Architecture

#### localStorage-based Storage
```javascript
const ACCESS_LEVEL_KEY = 'bs:accessLevel';
```
- Access level stored locally in browser's localStorage
- Default level: 'admin'
- No server-side authentication required (lightweight design)
- Persists across browser sessions

#### Core Functions

**`getAccessLevel()`**
- Retrieves current access level from localStorage
- Returns 'admin' by default if not set

**`setAccessLevel(level)`**
- Saves access level to localStorage
- Immediately applies UI restrictions via `applyAccessLevel()`

**`applyAccessLevel(level)`**
- Main enforcement function
- Controls visibility of tabs, buttons, and UI elements
- Manages navigation restrictions
- Updates visual indicators

### 3. UI Restrictions for User Level

#### Hidden Elements
- Devices tab
- Profiles tab
- Filtering tab (advanced)
- Settings tab (advanced)
- Logs tab (advanced)
- Advanced Settings button
- Quick panel (left sidebar)
- "Add device" and "Add profile" buttons
- Management links in Overview cards

#### Enforced Navigation
- Automatically redirects to Overview tab if on restricted page
- Prevents access to admin-only sections

### 4. Access Level Switching

#### Admin → User
- Simple click, no authentication required
- Shows warning about restricted access
- Immediately applies restrictions
- Toast notification confirms switch

#### User → Admin
- Requires PIN authentication via existing PIN prompt system
- Prompts for admin PIN before switching
- Only proceeds if PIN is correct
- Toast notification confirms switch
- If PIN is incorrect, remains in User mode

### 5. Integration with Existing Features

#### PIN Protection System
- Leverages existing `promptForPinIfNeeded()` function
- Reuses PIN modal and authentication logic
- Consistent with existing security model

#### Family Mode
- Works alongside Family Mode toggle
- Family Mode controls advanced tabs visibility for Admin users
- User level always hides advanced tabs regardless of Family Mode
- Both systems work independently and complement each other

### 6. CSS Styling

New pill styles added to distinguish access levels:

```css
.pill--admin {
  background: color-mix(in srgb, #fff 88%, var(--brand) 12%);
  border-color: color-mix(in srgb, var(--brand) 50%, #fff 50%);
  color: var(--brand);
}

.pill--user {
  background: color-mix(in srgb, #fff 90%, var(--info) 10%);
  border-color: color-mix(in srgb, var(--info) 40%, #fff 60%);
  color: var(--info);
}
```

### 7. Initialization

Access level is applied during bootstrap:

1. Page loads → DOMContentLoaded fires
2. `bootstrap()` function runs
3. Retrieves access level from localStorage
4. Applies restrictions via `applyAccessLevel()`
5. User sees appropriate UI for their access level

## User Experience Flow

### Admin User Workflow
1. Opens dashboard → enters PIN
2. Sees "Admin" pill in header
3. Has full access to all features
4. Can switch to User mode via Advanced Settings
5. Sees warning about restricted access
6. Switches to User mode

### User Level Workflow
1. Dashboard loads in User mode (or Admin switches to it)
2. Sees "User" pill in header
3. Can only view Overview tab
4. Can pause/resume protection
5. Cannot access admin features (buttons hidden)
6. Must enter PIN to switch back to Admin mode

## Security Considerations

### Lightweight Design
- No server-side session management
- No cloud authentication
- Simple localStorage-based control
- Suitable for family/home use

### Limitations
- Client-side only (can be bypassed with browser dev tools)
- Not suitable for enterprise security requirements
- Assumes trust within household environment
- Local browser storage can be cleared

### Recommended Use
- Family internet protection scenarios
- Supervised user environments
- Parental control situations
- Home network management

## Files Modified

1. **index.html**
   - Added access level pill to header
   - Added Access Level section to Advanced Settings modal
   - Added CSS styles for access level pills

2. **app.js**
   - Added access control constants and functions
   - Implemented `getAccessLevel()`, `setAccessLevel()`, `applyAccessLevel()`
   - Added event listeners for access level radio buttons
   - Integrated access level enforcement in bootstrap
   - Updated UI visibility logic

## Testing Checklist

- [x] Access level pill displays correctly
- [x] Admin mode shows all tabs and features
- [x] User mode hides restricted tabs
- [x] User mode hides Advanced Settings button
- [x] Switching Admin → User works without PIN
- [x] Switching User → Admin requires PIN
- [x] Access level persists across page reloads
- [x] Works alongside Family Mode
- [x] Toast notifications show on access level change
- [x] Redirect to Overview when switching to User on restricted tab

## Future Enhancements

Potential improvements for future iterations:

1. **Site-based restrictions**: Check if current browsing site is banned before allowing pause
2. **Time-based auto-switch**: Automatically switch to User mode during certain hours
3. **Activity logging**: Track when access level switches occur
4. **Multiple user profiles**: Support for multiple named users with different restrictions
5. **Password protection**: Option for password instead of PIN
6. **Server-side enforcement**: For more robust security in multi-device scenarios

## Conclusion

The two-level access system provides a simple yet effective way to manage who can control the Bushido Shield protection system. It maintains the lightweight, local-first design philosophy while adding an important layer of parental control and user management.
