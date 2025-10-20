# Access Control Quick Reference

## What is the Access Control System?

Bushido Shield now has two access levels to help you control who can make changes to your family's internet protection.

## Access Levels

### 🔴 Admin (Full Control)
**Who should use this:** Parents, guardians, or primary system administrators

**What you can do:**
- View and modify all devices
- Create and edit protection profiles
- Change filtering rules
- Adjust system settings
- View logs and request history
- Pause or resume protection

**How to identify:** Look for the red "Admin" pill in the top-right corner

---

### 🔵 User (Restricted)
**Who should use this:** Children, supervised users, or family members

**What you can do:**
- View the Overview dashboard
- Pause or resume ad blocking protection

**What you CANNOT do:**
- View or edit devices
- Modify protection profiles
- Change any system settings
- Access advanced features

**How to identify:** Look for the blue "User" pill in the top-right corner

---

## How to Switch Access Levels

### Switching to User Mode (No PIN Required)

1. Click the **Advanced** button (🔒 icon) in the top-right
2. Scroll to the **Access Level** section
3. Select the **User — Restricted** radio button
4. The system immediately switches to User mode
5. Close the Advanced Settings dialog

**Note:** A warning will remind you that User mode has limited access.

---

### Switching to Admin Mode (PIN Required)

1. Open the Advanced Settings (if accessible)
   - **OR** wait for the PIN prompt if it's locked
2. Select the **Admin — Full control** radio button
3. Enter your Admin PIN when prompted
4. If correct, you'll switch to Admin mode
5. You now have full access

**Important:** You must enter the correct PIN to unlock Admin access.

---

## Visual Guide

### What Admins See:
```
Header: [Admin] [Connected] [Pause 15m] [Advanced]
Tabs:   Overview | Devices | Profiles | Requests | Filtering | Settings | Logs
```

### What Users See:
```
Header: [User] [Connected] [Pause 15m]
Tabs:   Overview
```

---

## Common Scenarios

### Scenario 1: Letting Your Child Use the Dashboard
1. Switch to User mode in Advanced Settings
2. Your child can now view protection status
3. They can pause protection if needed (for homework, etc.)
4. They cannot change any settings or disable filters

### Scenario 2: Making System Changes
1. Ensure you're in Admin mode (enter PIN if needed)
2. Make your changes to devices, profiles, or settings
3. Optionally switch back to User mode when done
4. This prevents accidental changes

### Scenario 3: Family Mode + User Access
- **Family Mode** hides advanced tabs (Filtering, Settings, Logs)
- **User Mode** hides ALL admin features
- Use both together for maximum simplification
- Parents can still access Admin mode with PIN

---

## Tips & Best Practices

✅ **DO:**
- Use User mode when you want a simplified interface
- Switch to User mode to prevent accidental changes
- Keep your Admin PIN secure and memorable
- Use both Family Mode and User mode together for kids

❌ **DON'T:**
- Share your Admin PIN with users who shouldn't have full access
- Forget your PIN (write it down securely if needed)
- Leave the dashboard in Admin mode if others use the computer

---

## Security Notes

⚠️ **Important:**
- This is a **lightweight, local** access control system
- It uses browser localStorage (not cloud-based)
- Someone with browser dev tools knowledge could bypass it
- It's designed for **home/family use**, not enterprise security
- If you need stronger security, consider additional device/network controls

---

## Troubleshooting

**Q: I forgot my Admin PIN. How do I reset it?**
A: You'll need to clear the browser's localStorage or check your system settings backup. Consider documenting your PIN in a secure location.

**Q: The User can still see some admin features?**
A: Make sure you've actually switched to User mode (check the pill color in the header). Refresh the page if needed.

**Q: Can I have multiple user accounts?**
A: Currently, the system supports two levels: Admin and User. Multiple named users may be added in a future update.

**Q: Does User mode prevent pause/resume?**
A: No! Users CAN pause and resume protection. They just can't modify settings, profiles, or devices.

**Q: How does this work with Family Mode?**
A: They're complementary:
- Family Mode hides advanced tabs
- User mode hides admin features entirely
- Use both for maximum simplification

---

## Need Help?

If you're having issues with access control:
1. Check that you're looking at the correct pill in the header
2. Try refreshing the page
3. Ensure you're entering the PIN correctly
4. Clear your browser cache if problems persist

---

**Last Updated:** October 19, 2025  
**Version:** 1.0
