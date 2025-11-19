# SuperAdmin Password Reset Fix

## Problem
SuperAdmin password reset emails were not being sent when clicking the reset link from the SuperAdmin login page.

## Root Cause
The password reset flow (`ForgotPassword.jsx` and `ResetPassword.jsx`) only used the `supabase` client (staff/manager authentication), but SuperAdmin accounts use a separate `supabaseOwner` client with a different storage key (`sb-owner-session` vs `sb-manager-session`).

## Solution
Implemented URL parameter-based routing to detect user type and use the appropriate Supabase client:

### 1. URL Parameter Convention
- Regular users: `/forgot-password` (no parameter)
- SuperAdmin users: `/forgot-password?type=superadmin`

### 2. Files Modified

#### `/src/pages/auth/SuperAdminLogin.jsx`
- **Change**: Added "Forgot Password?" link before submit button
- **Link**: `/forgot-password?type=superadmin`
- **Styling**: Purple theme to match SuperAdmin branding

#### `/src/pages/auth/ForgotPassword.jsx`
- **Changes**:
  1. Added `useSearchParams` to detect `?type=superadmin` parameter
  2. Conditional client selection: `supabaseOwner` for superadmin, `supabase` for others
  3. Updated UI theme: Purple colors for superadmin, orange for regular users
  4. Heading text: "SuperAdmin Password Reset" vs "Forgot Password?"
  5. Email link includes type parameter: `redirectTo` includes `?type=superadmin`

#### `/src/pages/auth/ResetPassword.jsx`
- **Changes**:
  1. Added `useSearchParams` to detect user type from URL
  2. `useEffect` checks session with appropriate client
  3. `handleSubmit` uses correct client for password update
  4. Redirects to `/superadmin-login` or `/unified-login` based on type
  5. Updated UI theme: Purple for superadmin, orange for regular users
  6. Heading text: "SuperAdmin Password Reset" vs "Reset Your Password"

### 3. Password Reset Flow

#### For SuperAdmin:
1. User goes to `/superadmin-login`
2. Clicks "Forgot Password?" → redirects to `/forgot-password?type=superadmin`
3. Enters email → system uses `supabaseOwner.auth.resetPasswordForEmail()`
4. Receives email with reset link (includes `?type=superadmin` parameter)
5. Clicks link → opens `/reset-password?type=superadmin`
6. Enters new password → system uses `supabaseOwner.auth.updateUser()`
7. Success → redirects to `/superadmin-login`

#### For Regular Users (Manager/Staff):
1. User goes to `/unified-login`
2. Clicks "Forgot Password?" → redirects to `/forgot-password`
3. Enters email → system uses `supabase.auth.resetPasswordForEmail()`
4. Receives email with reset link
5. Clicks link → opens `/reset-password`
6. Enters new password → system uses `supabase.auth.updateUser()`
7. Success → redirects to `/unified-login`

## Visual Indicators

### SuperAdmin Theme (when `?type=superadmin`):
- Background gradient: Purple (`from-purple-50 to-white`)
- Icon background: Purple (`bg-purple-100`)
- Icon color: Purple (`text-purple-600`)
- Heading: "SuperAdmin Password Reset"
- Submit button: Purple (`bg-purple-600 hover:bg-purple-700`)

### Regular User Theme (default):
- Background gradient: Orange (`from-orange-50 to-white`)
- Icon background: Orange (`bg-orange-100`)
- Icon color: Orange (`text-orange-600`)
- Heading: "Forgot Password?" / "Reset Your Password"
- Submit button: Orange (`bg-orange-600 hover:bg-orange-700`)

## Testing Steps

1. **Test SuperAdmin Password Reset:**
   ```bash
   # Navigate to SuperAdmin login
   open http://localhost:5174/superadmin-login
   
   # Click "Forgot Password?" link
   # Verify URL is /forgot-password?type=superadmin
   # Verify page has purple theme
   
   # Enter superadmin email (check Supabase dashboard)
   # Click "Send Reset Link"
   # Check email inbox (and spam folder)
   
   # Click reset link from email
   # Verify URL is /reset-password?type=superadmin
   # Verify page has purple theme
   
   # Enter new password (8+ chars, mixed case, number)
   # Click "Reset Password"
   # Verify redirects to /superadmin-login
   
   # Test login with new password
   ```

2. **Test Regular User Password Reset:**
   ```bash
   # Navigate to unified login
   open http://localhost:5174/unified-login
   
   # Click "Forgot Password?" link
   # Verify URL is /forgot-password (no type parameter)
   # Verify page has orange theme
   
   # Follow same testing steps as above
   # Verify redirects to /unified-login after reset
   ```

## Supabase Configuration

### Email Templates
Ensure email templates in Supabase dashboard include the full URL with parameters:
```
{{ .SiteURL }}/reset-password?type=superadmin
```

### Email Settings
- Navigate to: Authentication > URL Configuration
- Set Site URL: `http://localhost:5174` (dev) or production URL
- Set Redirect URLs: Include reset password paths

## Verification

✅ No lint errors in modified files
✅ Both clients (supabase/supabaseOwner) properly initialized
✅ URL parameters correctly passed through entire flow
✅ Theme colors correctly applied based on user type
✅ Redirects go to correct login page after password reset

## Related Files
- `/src/shared/utils/api/supabaseClient.js` - Manager/staff client
- `/src/shared/utils/api/supabaseOwnerClient.js` - SuperAdmin client
- `/src/pages/auth/UnifiedLogin.jsx` - Has forgot password link to `/forgot-password`
- `/HOW_TO_CHECK_EMAILS.md` - Email configuration guide

## Date
Fixed: December 2024
