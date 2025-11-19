# Password Reset - Quick Test Checklist

**Date:** November 15, 2025  
**Status:** ✅ Automated checks passed - Ready for manual testing

---

## ✅ Automated Verification Results

```
Total Checks: 14
Passed: 14
Failed: 0
Success Rate: 100%
```

**Verified:**
- ✓ ForgotPassword.jsx exists
- ✓ ResetPassword.jsx exists
- ✓ UnifiedLogin has forgot password link
- ✓ WaiterLogin has forgot password link
- ✓ ChefLogin has forgot password link
- ✓ Routes configured in App.jsx
- ✓ Supabase integration present
- ✓ Form validation implemented

---

## 🚀 Quick Manual Test (5 minutes)

### Prerequisites
- [ ] Dev server running: `npm run dev`
- [ ] Have a test email account you can access
- [ ] Know your Supabase project email settings are configured

### Test Steps

#### 1. Access Forgot Password Link
- [ ] Go to http://localhost:5173/unified-login
- [ ] Click "Forgot Password?" link
- [ ] Verify: Redirects to `/forgot-password` page

#### 2. Request Password Reset
- [ ] Enter your test email address
- [ ] Click "Send Reset Link"
- [ ] Verify: Success message appears
- [ ] Verify: Redirects to login page after 2 seconds

#### 3. Check Email
- [ ] Open your email inbox
- [ ] Verify: Password reset email received (check spam if needed)
- [ ] Verify: Email contains reset link with token

#### 4. Reset Password
- [ ] Click reset link from email
- [ ] Verify: Opens `/reset-password?token=...` page
- [ ] Enter new password (min 6 characters)
- [ ] Confirm new password (must match)
- [ ] Click "Reset Password"
- [ ] Verify: Success message appears
- [ ] Verify: Redirects to login page

#### 5. Login with New Password
- [ ] Go to login page
- [ ] Enter email and OLD password
- [ ] Verify: Login FAILS (old password no longer works)
- [ ] Enter email and NEW password
- [ ] Verify: Login SUCCEEDS
- [ ] Verify: Redirects to dashboard

---

## ⚠️ Common Issues

### Email Not Received?
1. Check spam/junk folder
2. Verify Supabase → Authentication → Email Templates → "Reset Password" is enabled
3. Check Supabase logs for email delivery errors
4. Ensure test email is confirmed in Supabase dashboard

### Reset Link Doesn't Work?
1. Check URL contains `?token=...` parameter
2. Verify token hasn't expired (default: 1 hour)
3. Check browser console for errors
4. Try requesting a fresh reset link

### Password Update Fails?
1. Ensure passwords match
2. Ensure password is at least 6 characters
3. Check browser console for errors
4. Verify Supabase connection is active

---

## 📋 Test Results

**Test Date:** _______________  
**Tester:** _______________  
**Browser:** _______________

| Test Step | Status | Notes |
|-----------|--------|-------|
| Access forgot password link | ⬜ Pass / ⬜ Fail | |
| Request reset email | ⬜ Pass / ⬜ Fail | |
| Email received | ⬜ Pass / ⬜ Fail | Time: ____ |
| Reset link works | ⬜ Pass / ⬜ Fail | |
| Password update succeeds | ⬜ Pass / ⬜ Fail | |
| Old password fails | ⬜ Pass / ⬜ Fail | |
| New password works | ⬜ Pass / ⬜ Fail | |

**Overall Result:** ⬜ PASS / ⬜ FAIL

**Issues Found:**
1. _________________________________
2. _________________________________
3. _________________________________

**Recommendations:**
1. _________________________________
2. _________________________________

---

## 📖 Full Testing Guide

For comprehensive testing with all edge cases and validation checks, see:
**PASSWORD_RESET_TESTING_GUIDE.md**

---

## ✅ Sign-Off

Once all tests pass:

- [ ] All manual tests passed
- [ ] No console errors observed
- [ ] Email delivery works reliably
- [ ] Password update is successful
- [ ] Login with new password works
- [ ] Documentation is complete

**Tested By:** _______________ **Date:** _______________  
**Approved By:** _______________ **Date:** _______________

---

**Status:** Ready to mark Task 7 as COMPLETE and proceed to Task 8 🚀
