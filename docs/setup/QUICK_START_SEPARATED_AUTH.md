# 🚀 Quick Start Guide - Separated Authentication System

**Last Updated:** November 15, 2025  
**Status:** ✅ Ready for Testing

---

## 🎯 What Changed?

You now have **TWO separate login pages** instead of one hybrid page with a toggle:

| Portal | URL | Users | Client |
|--------|-----|-------|--------|
| **Staff** | `/login` | Manager, Chef, Waiter | supabaseManager |
| **Admin** | `/superadmin-login` | Owner (SuperAdmin) | supabaseOwner |

---

## 🧪 Quick Test (5 Minutes)

### Test 1: Staff Login ✅
```bash
# 1. Open browser
http://localhost:5174/login

# 2. Should see:
- Heading: "Staff Login"
- Subtitle: "Manager / Chef / Waiter Portal"
- NO toggle button
- "Forgot Password?" link

# 3. Login with manager/chef/waiter account
# Should redirect to appropriate dashboard

# 4. Try logging in with OWNER account
# Should see error: "This portal is for restaurant staff only"
# Should be signed out automatically
```

### Test 2: Admin Login ✅
```bash
# 1. Open browser
http://localhost:5174/superadmin-login

# 2. Should see:
- Heading: "SuperAdmin Portal"
- Purple theme
- Warning banner about restricted access
- NO toggle button

# 3. Login with owner account
# Should redirect to /superadmin/dashboard

# 4. Try logging in with MANAGER account
# Should see error: "This portal is for SuperAdmin only"
# Should redirect to /login after 2 seconds
```

### Test 3: Logout ✅
```bash
# Staff Logout:
1. Login as staff
2. Click logout button
3. Should redirect to: /login

# Admin Logout:
1. Login as admin
2. Click logout button
3. Should redirect to: /superadmin-login
```

---

## 🔍 Quick Verification

### Check localStorage (DevTools)

**After Staff Login:**
```javascript
// Application > Local Storage > localhost:5174
Key: 'sb-manager-session'
Value: { access_token: '...', user: {...} }

Key: 'praahis_restaurant_ctx'
Value: { restaurantId: '...', restaurantName: '...', ... }
```

**After Admin Login:**
```javascript
// Application > Local Storage > localhost:5174
Key: 'sb-owner-session'
Value: { access_token: '...', user: {...} }

Key: 'is_owner_session'
Value: 'true'
```

---

## 🐛 Common Issues & Fixes

### Issue: Can't find admin login
**Fix:** Navigate to `/superadmin-login` (no slash after superadmin)

### Issue: Owner blocked from staff portal
**This is CORRECT!** Owners must use `/superadmin-login`

### Issue: Manager blocked from admin portal
**This is CORRECT!** Managers must use `/login`

### Issue: Old `/login?mode=admin` doesn't work
**Expected:** Query params removed. Use `/superadmin-login` instead

---

## 📁 Files Changed

| File | What Changed |
|------|-------------|
| `src/pages/auth/StaffLogin.jsx` | ✅ NEW - Staff-only login |
| `src/App.jsx` | ✅ Updated imports & routes |
| `src/shared/layouts/UserMenu.jsx` | ✅ Clean logout |
| `src/shared/layouts/ProfessionalSuperAdminLayout.jsx` | ✅ Admin logout |

---

## 📖 Full Documentation

For complete details, see:
- **`SEPARATED_AUTH_SYSTEM_DOCS.md`** - Full documentation
- **`AUTHENTICATION_REFACTORING_SUMMARY.md`** - Detailed summary

---

## ✅ Quick Checklist

Before marking as complete:

**Code:**
- [x] StaffLogin.jsx created
- [x] App.jsx routes updated
- [x] Logout logic fixed
- [x] No lint errors

**Testing:**
- [ ] Staff login works (manager/chef/waiter)
- [ ] Admin login works (owner)
- [ ] Owner blocked from staff portal
- [ ] Non-owner blocked from admin portal
- [ ] Logout redirects correctly
- [ ] localStorage keys correct

**Documentation:**
- [x] Full docs created
- [x] Summary created
- [x] Quick guide created (this file)

---

## 🚀 Ready to Test!

1. **Refresh browser:** Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Test staff login:** Go to `/login`
3. **Test admin login:** Go to `/superadmin-login`
4. **Verify blocking:** Try wrong user type on each portal
5. **Check logout:** Verify redirects work

---

**Questions?** See `SEPARATED_AUTH_SYSTEM_DOCS.md` for troubleshooting guide.

**All good?** Move on to Task 9: Test Customer Journey Workflow! 🎉
