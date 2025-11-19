# Password Reset Flow - Testing Guide

**Date:** November 15, 2025  
**Status:** Ready for Testing  
**Tester:** Run through all test cases below

---

## 🎯 Overview

This guide covers end-to-end testing of the password reset functionality implemented in Task 4 & 6:
- **ForgotPassword.jsx** - Email input and reset link request
- **ResetPassword.jsx** - New password entry and update
- **Forgot Password Links** - Added to UnifiedLogin, WaiterLogin, ChefLogin

---

## ⚙️ Prerequisites

Before testing, ensure:

1. **Supabase Email Settings Configured:**
   - Go to Supabase Dashboard → Authentication → Email Templates
   - Verify "Reset Password" template is enabled
   - Check that email provider is configured (SMTP or built-in)
   - Test email delivery is working in your environment

2. **Test User Account:**
   - Have a test user account with a confirmed email
   - Know the email address and current password
   - User should have access to the email inbox

3. **Development Server Running:**
   ```bash
   npm run dev
   ```

4. **Network Access:**
   - Ensure your development server can reach Supabase
   - Check that email delivery works from your network

---

## 📋 Test Cases

### **Test 1: Access Forgot Password Page**

#### From UnifiedLogin Page
1. Navigate to `/unified-login`
2. **Verify:** "Forgot Password?" link is visible (white text with underline)
3. Click the link
4. **Expected:** Redirects to `/forgot-password`

#### From WaiterLogin Page
1. Navigate to `/waiter-login`
2. **Verify:** "Forgot Password?" link is visible (blue-400 text)
3. Click the link
4. **Expected:** Redirects to `/forgot-password`

#### From ChefLogin Page
1. Navigate to `/chef-login`
2. **Verify:** "Forgot Password?" link is visible (orange-400 text)
3. Click the link
4. **Expected:** Redirects to `/forgot-password`

---

### **Test 2: ForgotPassword Page UI/UX**

1. Navigate to `/forgot-password`
2. **Verify Page Elements:**
   - [ ] "Praahis" logo at top
   - [ ] "Reset Password" heading
   - [ ] "Enter your email address..." subtitle
   - [ ] Email input field with placeholder
   - [ ] "Send Reset Link" button
   - [ ] "Remember your password? Sign in" link
3. **Verify Styling:**
   - [ ] Page has gradient background
   - [ ] Card has proper shadow and backdrop blur
   - [ ] Button has orange gradient (orange-500 to orange-600)

---

### **Test 3: ForgotPassword Form Validation**

#### Empty Email
1. Leave email field empty
2. Click "Send Reset Link"
3. **Expected:** Toast error: "Please enter your email address"

#### Invalid Email Format
1. Enter invalid email: `test@invalid`
2. Click "Send Reset Link"
3. **Expected:** Toast error: "Please enter a valid email address"

#### Valid Email Format
1. Enter valid email: `test@example.com`
2. **Expected:** No validation errors, ready to submit

---

### **Test 4: Password Reset Email Request**

#### Existing User Account
1. Enter email of existing user: `[your-test-email]@example.com`
2. Click "Send Reset Link"
3. **Expected:**
   - [ ] Button shows loading state ("Sending...")
   - [ ] Button is disabled during request
   - [ ] Success toast appears: "Password reset link sent! Check your email."
   - [ ] User redirected to `/unified-login` after 2 seconds

#### Non-Existent Email
1. Enter email that doesn't exist: `nonexistent@example.com`
2. Click "Send Reset Link"
3. **Expected:**
   - [ ] Success message still shows (security: don't reveal if email exists)
   - [ ] User redirected to login page
   - [ ] No email actually sent

#### Network Error
1. Disconnect network or simulate error
2. Try to send reset link
3. **Expected:** Error toast with helpful message

---

### **Test 5: Reset Email Delivery**

1. After requesting reset link, check email inbox
2. **Verify Email Contents:**
   - [ ] Email received within 1-2 minutes
   - [ ] Subject line indicates password reset
   - [ ] Email contains reset link
   - [ ] Link includes token parameter
   - [ ] Sender is Supabase/Praahis

3. **Email Link Format:**
   ```
   http://localhost:5173/reset-password?token=abc123...
   ```

---

### **Test 6: ResetPassword Page Access**

#### With Valid Token
1. Click reset link from email
2. **Expected:**
   - [ ] Redirects to `/reset-password?token=...`
   - [ ] Page loads successfully
   - [ ] Form is enabled

#### Without Token
1. Navigate directly to `/reset-password` (no token)
2. **Expected:**
   - [ ] Page shows error or redirects to forgot password

#### With Expired Token
1. Use an old reset link (>1 hour old)
2. **Expected:**
   - [ ] Error message about expired token
   - [ ] Option to request new reset link

---

### **Test 7: ResetPassword Page UI/UX**

1. Access reset page with valid token
2. **Verify Page Elements:**
   - [ ] "Praahis" logo at top
   - [ ] "Set New Password" heading
   - [ ] "Enter your new password below" subtitle
   - [ ] New password input field with eye icon toggle
   - [ ] Confirm password input field with eye icon toggle
   - [ ] "Reset Password" button
   - [ ] Back to login link

3. **Verify Password Toggle:**
   - [ ] Click eye icon - password becomes visible
   - [ ] Click again - password becomes hidden

---

### **Test 8: ResetPassword Form Validation**

#### Empty Fields
1. Leave both password fields empty
2. Click "Reset Password"
3. **Expected:** Toast error: "Please enter a new password"

#### Password Too Short
1. Enter password: `123` (< 6 characters)
2. Enter confirm: `123`
3. Click "Reset Password"
4. **Expected:** Toast error: "Password must be at least 6 characters"

#### Passwords Don't Match
1. Enter password: `newpassword123`
2. Enter confirm: `different123`
3. Click "Reset Password"
4. **Expected:** Toast error: "Passwords do not match"

#### Valid Passwords
1. Enter password: `SecurePass123!`
2. Enter confirm: `SecurePass123!`
3. **Expected:** Form submits successfully

---

### **Test 9: Password Update Success**

1. Fill form with valid matching passwords (min 6 chars)
2. Click "Reset Password"
3. **Expected:**
   - [ ] Button shows loading state ("Resetting...")
   - [ ] Button is disabled during request
   - [ ] Success toast: "Password updated successfully!"
   - [ ] Redirected to `/unified-login` after 2 seconds

---

### **Test 10: Login with New Password**

#### Using Old Password
1. Go to `/unified-login`
2. Enter email and OLD password
3. Click "Sign In"
4. **Expected:** Login fails with invalid credentials error

#### Using New Password
1. Go to `/unified-login`
2. Enter email and NEW password (set in reset flow)
3. Click "Sign In"
4. **Expected:**
   - [ ] Login succeeds
   - [ ] Redirected to appropriate dashboard
   - [ ] User session is active

---

### **Test 11: Error Handling**

#### Invalid/Expired Token
1. Modify token in URL manually
2. Try to reset password
3. **Expected:** Clear error message about invalid token

#### Network Interruption
1. Start password reset
2. Disconnect network mid-request
3. **Expected:** Error message with retry option

#### Supabase Service Down
1. If Supabase is unreachable
2. **Expected:** User-friendly error message

---

### **Test 12: Security Checks**

#### Token Can't Be Reused
1. Complete password reset successfully
2. Try to use the same reset link again
3. **Expected:** Token is invalid/expired

#### Password Complexity
1. Try weak passwords: `123456`, `password`
2. **Expected:** System accepts them (Supabase default: 6+ chars)
3. **Note:** Consider adding custom validation for stronger passwords

#### Rate Limiting
1. Request multiple password resets rapidly
2. **Expected:** Supabase may rate limit (check logs)

---

## ✅ Test Results Template

Copy this template to document your test results:

```markdown
## Password Reset Testing - [Date]

**Tested By:** [Your Name]
**Environment:** Development/Staging/Production
**Browser:** Chrome/Safari/Firefox
**Supabase Project:** [Project Name]

### Results Summary
- Total Tests: 12
- Passed: __/12
- Failed: __/12
- Blocked: __/12

### Detailed Results

#### Test 1: Access Forgot Password Page
- UnifiedLogin: ✅ PASS / ❌ FAIL
- WaiterLogin: ✅ PASS / ❌ FAIL
- ChefLogin: ✅ PASS / ❌ FAIL
- Notes: 

#### Test 2: ForgotPassword Page UI/UX
- Status: ✅ PASS / ❌ FAIL
- Notes:

#### Test 3: Form Validation
- Empty Email: ✅ PASS / ❌ FAIL
- Invalid Email: ✅ PASS / ❌ FAIL
- Valid Email: ✅ PASS / ❌ FAIL
- Notes:

#### Test 4: Email Request
- Existing User: ✅ PASS / ❌ FAIL
- Non-Existent: ✅ PASS / ❌ FAIL
- Notes:

#### Test 5: Email Delivery
- Status: ✅ PASS / ❌ FAIL
- Delivery Time: ____ seconds
- Notes:

#### Test 6: ResetPassword Access
- With Token: ✅ PASS / ❌ FAIL
- Without Token: ✅ PASS / ❌ FAIL
- Notes:

#### Test 7: ResetPassword UI/UX
- Status: ✅ PASS / ❌ FAIL
- Notes:

#### Test 8: Password Validation
- Empty Fields: ✅ PASS / ❌ FAIL
- Too Short: ✅ PASS / ❌ FAIL
- Mismatch: ✅ PASS / ❌ FAIL
- Notes:

#### Test 9: Password Update
- Status: ✅ PASS / ❌ FAIL
- Notes:

#### Test 10: Login with New Password
- Old Password: ✅ PASS / ❌ FAIL
- New Password: ✅ PASS / ❌ FAIL
- Notes:

#### Test 11: Error Handling
- Status: ✅ PASS / ❌ FAIL
- Notes:

#### Test 12: Security Checks
- Token Reuse: ✅ PASS / ❌ FAIL
- Notes:

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## 🐛 Common Issues & Solutions

### Issue: Email Not Received
**Solutions:**
- Check spam/junk folder
- Verify Supabase email settings
- Check Supabase logs for delivery errors
- Ensure test email is confirmed in Supabase Auth

### Issue: Reset Link Doesn't Work
**Solutions:**
- Check that token is in URL: `/reset-password?token=...`
- Verify redirect URLs in Supabase settings
- Check token hasn't expired (default: 1 hour)

### Issue: Password Update Fails
**Solutions:**
- Check browser console for errors
- Verify Supabase connection
- Ensure token is still valid
- Check minimum password requirements

### Issue: Can't Login After Reset
**Solutions:**
- Verify password was actually updated (check Supabase logs)
- Try the exact password entered during reset
- Clear browser cache and cookies
- Check if user account is active/confirmed

---

## 🔧 Debugging Tools

### Browser Console
Open DevTools (F12) and check:
- Network tab for API calls to Supabase
- Console tab for JavaScript errors
- Application tab for localStorage

### Supabase Dashboard
- Authentication → Users - Check user's last sign-in
- Logs → Check for password reset events
- Email Templates → Verify configuration

### Network Inspection
```javascript
// Check if reset email was sent
// Look for POST to /auth/v1/recover in Network tab

// Check if password update succeeded
// Look for PUT/POST to /auth/v1/user in Network tab
```

---

## 📊 Success Criteria

Task 7 is **COMPLETE** when:

✅ All 12 test cases pass  
✅ Email delivery works within 2 minutes  
✅ Reset link correctly redirects to ResetPassword page  
✅ Password update succeeds with valid token  
✅ User can login with new password  
✅ Old password no longer works  
✅ Form validations work correctly  
✅ Error handling is user-friendly  
✅ No console errors during flow  
✅ Mobile responsive (bonus)  

---

## 📝 Next Steps After Testing

Once testing is complete:

1. **If All Tests Pass:**
   - Mark Task 7 as complete
   - Document any observations
   - Move to Task 8: Customer Journey Testing

2. **If Issues Found:**
   - Document each issue with screenshots
   - Prioritize fixes (critical vs nice-to-have)
   - Fix issues before proceeding
   - Re-test after fixes

3. **Enhancements to Consider:**
   - Add password strength indicator
   - Add "Resend Email" button
   - Implement rate limiting UI feedback
   - Add email confirmation before reset
   - Support for magic link login

---

## 🎬 Quick Start Testing

**5-Minute Quick Test:**
1. Start dev server: `npm run dev`
2. Go to `/unified-login`
3. Click "Forgot Password?"
4. Enter your test email
5. Check email inbox
6. Click reset link
7. Enter new password twice
8. Click "Reset Password"
9. Login with new password

**Expected:** All steps complete without errors in ~5 minutes.

---

**Good luck with testing! 🚀**
