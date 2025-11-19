# How to Check and Test Emails in Supabase

**Date:** November 15, 2025  
**Purpose:** Guide to viewing email configuration and testing password reset emails

---

## 🔍 Where to Find Email Configuration

### Method 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `iwczwjttqunyvhkvlspl`

2. **Navigate to Authentication Settings**
   ```
   Dashboard → Authentication → Email Templates
   ```

3. **Check Email Templates**
   You'll see templates for:
   - ✉️ **Confirm Signup** - Welcome email with confirmation link
   - ✉️ **Invite User** - Team invitation emails
   - ✉️ **Magic Link** - Passwordless login
   - ✉️ **Change Email Address** - Email change confirmation
   - ✉️ **Reset Password** - Password reset link ⭐ (What we need!)

4. **Check Email Provider**
   ```
   Dashboard → Project Settings → Authentication → SMTP Settings
   ```
   
   Options:
   - **Supabase Built-in** (default) - Limited, for testing only
   - **Custom SMTP** - Your own email server (recommended for production)

---

## 📧 View Registered Users & Emails

### Method 1: Supabase Dashboard

1. **Navigate to Users:**
   ```
   Dashboard → Authentication → Users
   ```

2. **You'll see a table with:**
   - Email addresses
   - Last sign-in time
   - Confirmation status
   - Created date

### Method 2: SQL Query

Run this in the SQL Editor:

```sql
-- View all user emails
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;
```

### Method 3: Via API (in browser console)

```javascript
// Get current user (if logged in)
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user email:', user?.email)

// Note: You cannot query other users' emails via client for security
```

---

## 🧪 Test Password Reset Email Flow

### Step 1: Prepare Test Email

**Option A: Use Your Own Email**
- Use an email you have access to
- Gmail, Outlook, etc.

**Option B: Use Temp Email Service** (for testing only)
- https://temp-mail.org/
- https://10minutemail.com/
- Get a temporary email address

### Step 2: Create Test User (if needed)

**Via Supabase Dashboard:**
```
Dashboard → Authentication → Users → Add User
Email: test@example.com
Password: TestPass123!
```

**Via SQL:**
```sql
-- This will create a confirmed user
INSERT INTO auth.users (
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test@yourdomain.com',
  crypt('YourPassword123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
);
```

### Step 3: Test the Flow

1. **Open Your App:**
   ```
   http://localhost:5174/unified-login
   ```

2. **Click "Forgot Password?"**

3. **Enter Test Email:**
   ```
   test@yourdomain.com
   ```

4. **Click "Send Reset Link"**

5. **Check Email Inbox:**
   - Check spam/junk folder if not in inbox
   - Email should arrive within 1-2 minutes

6. **Email Should Contain:**
   - Subject: "Reset Your Password"
   - Reset link with token
   - Link format: `http://localhost:5174/reset-password?token=...`

---

## 🔍 Check Email Logs

### Supabase Dashboard Method:

1. **Navigate to Logs:**
   ```
   Dashboard → Logs → Auth Logs
   ```

2. **Filter by Event:**
   - Look for `password_recovery` events
   - Check timestamp and email address

3. **Common Log Messages:**
   - ✅ `Password recovery email sent to user@example.com`
   - ❌ `Email delivery failed: [reason]`

### SQL Query Method:

```sql
-- View recent auth events
SELECT 
  created_at,
  action,
  actor_username as email,
  log_type
FROM auth.audit_log_entries
WHERE action = 'password_recovery'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📋 Check Current Email Settings

### Check in .env.local File:

```bash
# In terminal
cat .env.local | grep SUPABASE
```

Should show:
```
VITE_SUPABASE_URL=https://iwczwjttqunyvhkvlspl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Check Email Configuration:

1. **Supabase Dashboard:**
   ```
   Project Settings → Authentication → Email Templates → Reset Password
   ```

2. **Verify Template Contains:**
   - Reset link: `{{ .ConfirmationURL }}`
   - Token expiration info
   - Your app branding

---

## 🧪 Quick Email Test Script

Create a test file to quickly verify email functionality:

```javascript
// test-email.js
import { supabase } from './src/shared/utils/api/supabaseClient.js';

async function testPasswordReset(email) {
  console.log('Testing password reset for:', email);
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:5174/reset-password',
  });
  
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Reset email sent successfully!');
    console.log('Check your inbox:', email);
  }
}

// Replace with your test email
testPasswordReset('your-email@example.com');
```

---

## 🔧 Troubleshooting

### Email Not Received?

1. **Check Spam/Junk Folder**

2. **Verify Email Provider:**
   ```
   Dashboard → Project Settings → Authentication
   ```
   - Is SMTP configured?
   - Is email sending enabled?

3. **Check Rate Limits:**
   - Supabase free tier: Limited emails per hour
   - Wait a few minutes between attempts

4. **Verify User Exists:**
   ```sql
   SELECT email FROM auth.users WHERE email = 'test@example.com';
   ```

5. **Check Email Template:**
   - Ensure "Reset Password" template is enabled
   - Verify template has `{{ .ConfirmationURL }}`

### Email Received But Link Doesn't Work?

1. **Check Redirect URL:**
   ```javascript
   // In ForgotPassword.jsx
   redirectTo: 'http://localhost:5174/reset-password'
   ```

2. **Verify Token in URL:**
   - Link should have `?token=...` parameter
   - Token should be long (JWT format)

3. **Check Token Expiration:**
   - Default: 1 hour
   - Configurable in Supabase dashboard

---

## 📊 Email Configuration Checklist

Before testing, verify:

- [ ] Supabase project is active
- [ ] Email templates are enabled
- [ ] SMTP is configured (or using Supabase built-in)
- [ ] Test user exists in auth.users
- [ ] Test user email is confirmed
- [ ] Password reset template has reset link
- [ ] Redirect URL matches your app URL
- [ ] No rate limits exceeded

---

## 🎯 Production Email Setup

For production, you should:

1. **Configure Custom SMTP:**
   - Use SendGrid, Mailgun, or AWS SES
   - More reliable than built-in
   - Better deliverability

2. **Customize Email Templates:**
   - Add your branding
   - Use your domain
   - Professional styling

3. **Set Up SPF/DKIM:**
   - Prevents emails going to spam
   - Improves deliverability

4. **Monitor Email Delivery:**
   - Track send rates
   - Monitor bounces
   - Check spam reports

---

## 🔑 Quick Command Reference

```bash
# View environment variables
cat .env.local | grep SUPABASE

# Check Supabase status
curl https://iwczwjttqunyvhkvlspl.supabase.co/rest/v1/

# Open Supabase dashboard
open https://supabase.com/dashboard/project/iwczwjttqunyvhkvlspl

# Test app locally
npm run dev
# Then visit: http://localhost:5174/unified-login
```

---

## 📞 Need Help?

**Check These First:**
1. Supabase Docs: https://supabase.com/docs/guides/auth/auth-email
2. Email Templates: Dashboard → Authentication → Email Templates
3. Auth Logs: Dashboard → Logs → Auth Logs
4. This guide: `HOW_TO_CHECK_EMAILS.md`

**Common Questions:**

**Q: Where do I see all user emails?**
A: Dashboard → Authentication → Users

**Q: How do I test password reset?**
A: Use ForgotPassword page at `/forgot-password`

**Q: Email not arriving?**
A: Check spam, verify SMTP, check rate limits

**Q: How to add a test user?**
A: Dashboard → Authentication → Users → Add User

---

**Ready to test!** 🚀

Start at: http://localhost:5174/forgot-password
