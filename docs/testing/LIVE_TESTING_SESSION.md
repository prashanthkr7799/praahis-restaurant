# Live Testing Session - November 15, 2025

**Dev Server:** http://localhost:5174/  
**Status:** 🟢 RUNNING  
**Session Start:** Now

---

## 🎯 Priority Testing Areas

Based on recent fixes, here's what to test in order of priority:

### 1. ✅ Authentication Error Fixes (HIGHEST PRIORITY)
**What Changed:** Fixed multiple GoTrueClient warnings and invalid token errors

**Test Steps:**
1. Open browser DevTools (F12) → Console tab
2. Navigate to http://localhost:5174/
3. **Verify Console Shows:**
   - ✅ "Auth error handling initialized"
   - ❌ NO "Multiple GoTrueClient instances" warning
   - ❌ NO "Invalid Refresh Token" errors
   - ❌ NO 401 unauthorized errors on page load

**Clear localStorage and test:**
```javascript
// In browser console
localStorage.clear()
location.reload()
```

**Expected:** Clean console with only the initialization message

---

### 2. 🔐 Password Reset Flow (HIGH PRIORITY)
**What Changed:** Added ForgotPassword & ResetPassword pages + links

#### Test A: Forgot Password Link Access
1. Go to http://localhost:5174/unified-login
2. **Verify:** "Forgot Password?" link visible (white text)
3. Click link → Should redirect to `/forgot-password`

4. Go to http://localhost:5174/waiter-login
5. **Verify:** "Forgot Password?" link visible (blue text)
6. Click link → Should redirect to `/forgot-password`

7. Go to http://localhost:5174/chef-login
8. **Verify:** "Forgot Password?" link visible (orange text)
9. Click link → Should redirect to `/forgot-password`

#### Test B: ForgotPassword Page
1. Navigate to http://localhost:5174/forgot-password
2. **Verify Page Elements:**
   - [ ] "Praahis" logo displayed
   - [ ] "Reset Password" heading
   - [ ] Email input field
   - [ ] "Send Reset Link" button
   - [ ] "Remember your password? Sign in" link

3. **Test Validation:**
   - Leave email empty → Click button → Should show error toast
   - Enter invalid email "test@" → Should show error toast
   - Enter valid email → Should accept

#### Test C: ResetPassword Page
1. Navigate to http://localhost:5174/reset-password?token=test123
2. **Verify Page Elements:**
   - [ ] "Praahis" logo displayed
   - [ ] "Set New Password" heading
   - [ ] Password input with eye icon
   - [ ] Confirm password input with eye icon
   - [ ] "Reset Password" button

3. **Test Password Toggle:**
   - [ ] Click eye icon → password becomes visible
   - [ ] Click again → password becomes hidden

---

### 3. 🧹 Console Log Cleanup (MEDIUM PRIORITY)
**What Changed:** Removed 95+ debug console logs

**Test Steps:**
1. Navigate through different pages
2. Check console for unwanted logs
3. **Should NOT see:**
   - Random debug messages
   - "Fetching..." logs
   - Data dumps
4. **OK to see:**
   - Error warnings (console.warn)
   - DEV-wrapped debug logs (if in dev mode)

---

### 4. 🔑 Legacy Reference Cleanup (MEDIUM PRIORITY)
**What Changed:** Replaced "mealmate" with "praahis" in localStorage

**Test Steps:**
```javascript
// In browser console
Object.keys(localStorage).filter(key => key.includes('mealmate'))
// Should return: []

Object.keys(localStorage).filter(key => key.includes('praahis'))
// Should return: ['praahis_restaurant_ctx', etc.]
```

---

## 🧪 Manual Test Checklist

### Basic Navigation
- [ ] Home page loads without errors
- [ ] Navigation menu works
- [ ] All routes are accessible
- [ ] No console errors during navigation

### Login Pages
- [ ] http://localhost:5174/unified-login loads
- [ ] http://localhost:5174/waiter-login loads
- [ ] http://localhost:5174/chef-login loads
- [ ] http://localhost:5174/superadmin-login loads
- [ ] All have "Forgot Password?" links (except maybe superadmin)

### Authentication
- [ ] Can access login page
- [ ] Form validation works
- [ ] Error messages display correctly
- [ ] No auth errors in console on page load

### Password Reset Flow
- [ ] Forgot password links work on all login pages
- [ ] ForgotPassword page renders correctly
- [ ] Form validation works (empty, invalid, valid email)
- [ ] ResetPassword page renders correctly
- [ ] Password visibility toggle works
- [ ] Password validation works (matching, length)

---

## 🔍 Console Checks

### Expected to See:
```
✅ Auth error handling initialized
ℹ️ Vite [plugin:vite:css] ... (build messages)
```

### Should NOT See:
```
❌ Multiple GoTrueClient instances detected
❌ AuthApiError: Invalid Refresh Token
❌ Failed to load resource: 400
❌ Failed to load resource: 401 (on initial load)
❌ Random console.log/debug messages
❌ "mealmate" references
```

---

## 🐛 Issue Reporting Template

If you find issues, document them here:

### Issue 1:
**Page:** _________________  
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** _________________  
**Actual:** _________________  
**Console Errors:** _________________  
**Screenshot:** [paste here]

---

## 🎬 Quick 5-Minute Test

**For a fast verification:**

1. **Open:** http://localhost:5174/
2. **Check Console:** Should show auth initialized message
3. **Navigate to:** /unified-login
4. **Click:** "Forgot Password?" link
5. **Verify:** Redirects to /forgot-password
6. **Enter:** test@example.com
7. **Click:** "Send Reset Link"
8. **Verify:** Shows success message (or validation error if email required)

**If all above work → Basic functionality is good! ✅**

---

## 📊 Test Results

**Tester:** _________________  
**Date/Time:** _________________  
**Browser:** _________________  

### Results Summary
- Authentication Errors: ⬜ PASS / ⬜ FAIL
- Password Reset UI: ⬜ PASS / ⬜ FAIL
- Console Cleanup: ⬜ PASS / ⬜ FAIL
- Navigation: ⬜ PASS / ⬜ FAIL

### Issues Found: _____ (count)

**Overall Status:** ⬜ PASS / ⬜ NEEDS FIXES

---

## 🔧 Troubleshooting

### If Dev Server Crashes:
```bash
# Kill all node processes
pkill -f node

# Restart
npm run dev
```

### If Port is Busy:
Server is on port 5174 (not 5173) - use http://localhost:5174/

### If You See Auth Errors:
```javascript
// Clear all localStorage and refresh
localStorage.clear()
location.reload()
```

### To Check Server Status:
```bash
# In terminal
lsof -i :5174
```

---

**Ready to test! 🚀**

Open http://localhost:5174/ in your browser and follow the checklist above.
