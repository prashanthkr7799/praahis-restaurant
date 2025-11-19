# 🧪 Quick Testing Checklist

**Purpose**: Validate changes made during refactoring session  
**Estimated Time**: 30-45 minutes  
**Priority**: HIGH - Run before deploying

---

## ✅ Pre-Testing Setup

- [ ] Ensure development server is running (`npm run dev`)
- [ ] Open browser DevTools console
- [ ] Clear browser cache and localStorage
- [ ] Have test user credentials ready

---

## 1️⃣ Route & Navigation Tests (5 min)

### SuperAdmin Routes
- [ ] Navigate to `/superadmin` - Should load new dashboard
- [ ] Navigate to `/superadmin/restaurants` - Should work
- [ ] Navigate to `/superadmin/old` - Should get 404 or redirect
- [ ] Check console for any import errors

### Manager Routes
- [ ] Navigate to `/manager/dashboard` - Should work
- [ ] All manager sidebar links work

### Expected Result:
- ✅ No 404 errors
- ✅ No missing component errors in console
- ✅ All navigation smooth

---

## 2️⃣ Password Reset Flow (10 min)

### Request Reset
1. [ ] Go to `/login`
2. [ ] Click "Forgot your password?" link (staff or admin panel)
3. [ ] Should navigate to `/forgot-password`
4. [ ] Enter email address
5. [ ] Click "Send Reset Link"
6. [ ] Should see success message

### Check Email
7. [ ] Open email inbox
8. [ ] Verify reset email received
9. [ ] Click reset link in email
10. [ ] Should navigate to `/reset-password`

### Reset Password
11. [ ] Enter new password (test validation):
    - [ ] Too short password - Should show error
    - [ ] No uppercase - Should show error
    - [ ] No number - Should show error
    - [ ] Valid password - Should accept
12. [ ] Confirm password mismatch - Should show error
13. [ ] Enter matching valid password
14. [ ] Click "Reset Password"
15. [ ] Should see success message
16. [ ] Should auto-redirect to `/login`

### Verify New Password
17. [ ] Login with new password
18. [ ] Should successfully login

### Expected Result:
- ✅ All validation works
- ✅ Email received
- ✅ Password updated
- ✅ Can login with new password

---

## 3️⃣ Customer Journey (10 min)

### Table Access
1. [ ] Scan QR code or navigate to `/table/:slug/:tableId`
2. [ ] Menu should load
3. [ ] Check console - Should see NO debug logs like "👤 Customer entered table"

### Cart & Order
4. [ ] Add items to cart
5. [ ] Cart counter updates
6. [ ] Click "Place Order"
7. [ ] Check console - Should see NO logs like "Cart items:", "Prepared order data:"

### Payment
8. [ ] Navigate to payment page
9. [ ] Check console - Should see NO logs like "📦 Loaded order data", "🏪 Restaurant ID"
10. [ ] Payment page loads correctly

### Expected Result:
- ✅ No customer-facing console logs
- ✅ Only console.error for actual errors
- ✅ Workflow functions normally

---

## 4️⃣ Staff Workflows (5 min)

### Waiter Login & Dashboard
1. [ ] Login as waiter
2. [ ] Check console - Should see NO logs like "🔐 Auth successful", "📝 Creating new profile"
3. [ ] Dashboard loads
4. [ ] Check console - Should see NO logs like "📥 Loading data", "✅ Tables loaded"
5. [ ] Real-time updates should still work

### Expected Result:
- ✅ No excessive logging
- ✅ Functionality intact
- ✅ Real-time updates work

---

## 5️⃣ Manager Dashboard (5 min)

### Dashboard Access
1. [ ] Login as manager
2. [ ] Dashboard loads
3. [ ] Check console - Should see NO "console.warn" for restaurantId
4. [ ] Only console.error for legitimate errors

### Menu Management
5. [ ] Navigate to Menu page
6. [ ] Check console - Should be clean

### Expected Result:
- ✅ No console.warn statements
- ✅ Only console.error for real issues

---

## 6️⃣ SuperAdmin Dashboard (5 min)

### Dashboard Access
1. [ ] Login as SuperAdmin (owner)
2. [ ] Should load `/superadmin` (not /superadmin/old)
3. [ ] Modern professional layout should display

### Restaurants Page
4. [ ] Navigate to Restaurants
5. [ ] Check console - Should see NO logs like "🔍 FETCHING RESTAURANTS", "📡 Querying"
6. [ ] Restaurants should load correctly
7. [ ] Check console - Should see NO logs like "🏪 Restaurant:", "✅ Processed data"

### Expected Result:
- ✅ New layout renders
- ✅ No debug logging
- ✅ Data loads correctly

---

## 7️⃣ Console Cleanliness Check (5 min)

### Run Through Each Role
1. [ ] Login as SuperAdmin
   - Navigate through 3-4 pages
   - Check console - Should be mostly clean
   
2. [ ] Login as Manager
   - Navigate through 3-4 pages
   - Check console - Should be mostly clean
   
3. [ ] Login as Waiter
   - Navigate through 2-3 pages
   - Check console - Should be mostly clean

4. [ ] Customer journey (no login)
   - Go through full flow
   - Check console - Should be clean except for errors

### Expected Result:
- ✅ No "🔍", "📦", "✅", "🏪" emoji logs
- ✅ No "console.log(...)" statements visible
- ✅ Only legitimate console.error for errors

---

## 8️⃣ No Regressions (5 min)

### Quick Feature Spot Checks
- [ ] Chef can see orders (real-time)
- [ ] Waiter can manage tables
- [ ] Manager can view analytics
- [ ] SuperAdmin can see all restaurants
- [ ] Customer can browse menu
- [ ] Payment page opens (even if test payment fails)

### Expected Result:
- ✅ All core features work
- ✅ No new bugs introduced

---

## 🚨 Red Flags to Watch For

### Critical Issues:
- ❌ 404 errors on any route
- ❌ "Cannot find module" errors
- ❌ White screen of death
- ❌ Authentication broken
- ❌ Real-time updates not working

### Minor Issues (can fix later):
- ⚠️ A few console.logs still visible (acceptable, we didn't clean all files yet)
- ⚠️ UI layout slightly off (existing issue, not from our changes)
- ⚠️ Slow loading (existing issue, not from our changes)

---

## 📊 Test Results Template

```
Date: _____________
Tester: _____________

✅ PASSED TESTS:
- [ ] Route & Navigation
- [ ] Password Reset Flow
- [ ] Customer Journey
- [ ] Staff Workflows
- [ ] Manager Dashboard
- [ ] SuperAdmin Dashboard
- [ ] Console Cleanliness
- [ ] No Regressions

❌ FAILED TESTS:
(List any failures here)

⚠️ ISSUES FOUND:
(List any issues here)

🎯 OVERALL RESULT:
[ ] Ready for Production
[ ] Needs Minor Fixes
[ ] Needs Major Fixes

NOTES:
_______________________________
_______________________________
_______________________________
```

---

## 💡 Testing Tips

1. **Use Incognito Mode**: Ensures clean state
2. **Check Mobile View**: Test responsiveness
3. **Test Different Roles**: Each role should work
4. **Monitor Network Tab**: Watch for failed requests
5. **Clear Cache Between Tests**: Avoid stale data

---

## 🔧 If Tests Fail

### Route 404 Errors:
1. Check App.jsx routes are correctly defined
2. Verify lazy imports match file names
3. Check for typos in paths

### Password Reset Not Working:
1. Check Supabase email settings
2. Verify email templates configured
3. Check redirect URL in Supabase dashboard

### Console Logs Still Appearing:
- Expected (we didn't clean ALL files yet)
- Only problematic if excessive
- Can continue cleanup later

### Real-time Not Working:
- Likely pre-existing issue
- Not caused by our refactoring
- Check Supabase Realtime settings

---

## ✅ Sign-Off

After completing all tests, update SESSION_SUMMARY.md with results.

**Tester**: _________________  
**Date**: _________________  
**Result**: [ ] PASS [ ] FAIL [ ] PARTIAL  
**Notes**: _______________________________

---

**Quick Test**: ~30-45 minutes  
**Full Test**: ~2-3 hours (including all edge cases)
