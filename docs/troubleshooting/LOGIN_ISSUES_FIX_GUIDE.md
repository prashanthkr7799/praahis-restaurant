# 🔧 Quick Fix: Login Issues After Auth Refactoring

**Issue Date:** November 15, 2025  
**Symptoms:** "Restaurant context is missing" error when logging in as manager

---

## 🐛 Issues & Fixes

### Issue 1: "Restaurant context is missing" Error

**Symptom:**
```
Access Denied
Restaurant context is missing. Please log in again.
```

**Root Cause:**
Manager user account doesn't have a `restaurant_id` assigned in the database.

**Fix:**

1. **Check Supabase Dashboard:**
   ```
   Go to: https://supabase.com/dashboard/project/iwczwjttqunyvhkvlspl
   Navigate to: Table Editor > users
   Find your manager user
   Check: restaurant_id column
   ```

2. **Assign Restaurant ID:**
   
   **Option A - Via Supabase Dashboard:**
   - Find the user row
   - Click the `restaurant_id` cell
   - Select a restaurant from dropdown (or paste UUID)
   - Save

   **Option B - Via SQL Editor:**
   ```sql
   -- First, get a restaurant ID
   SELECT id, name FROM restaurants LIMIT 1;
   
   -- Then assign it to your user
   UPDATE users
   SET restaurant_id = 'PASTE_RESTAURANT_UUID_HERE'
   WHERE email = 'your-manager-email@example.com';
   ```

3. **Verify:**
   ```sql
   SELECT 
     email, 
     role, 
     restaurant_id,
     (SELECT name FROM restaurants WHERE id = users.restaurant_id) as restaurant_name
   FROM users 
   WHERE email = 'your-manager-email@example.com';
   ```

4. **Test Login Again:**
   - Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
   - Navigate to http://localhost:5174/login
   - Login with manager credentials
   - Should redirect to dashboard successfully

---

### Issue 2: 403 Forbidden on auth_activity_logs

**Symptom:**
```
POST https://iwczwjttqunyvhkvlspl.supabase.co/rest/v1/auth_activity_logs 403 (Forbidden)
```

**Root Cause:**
The `auth_activity_logs` table either doesn't exist or RLS policies are blocking inserts.

**Status:** ✅ FIXED - Audit logging now fails silently (non-critical feature)

**Details:**
- SuperAdmin login will still work even if audit logging fails
- This is expected if you haven't run the audit logging migration yet
- To enable audit logging (optional):
  ```sql
  -- Run this migration file:
  -- database/71_security_audit_logging.sql
  ```

**Verification:**
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'auth_activity_logs'
) as table_exists;
```

---

## ✅ Changes Made to Fix

### 1. StaffLogin.jsx - Restaurant ID Validation
**Change:** Now blocks login if `restaurant_id` is NULL

**Before:**
```javascript
if (restaurantId) await hydrateRestaurantContext(userId);
// Would continue even without restaurant_id
```

**After:**
```javascript
if (!restaurantId) {
  toast.error('Your account is not assigned to a restaurant.');
  await supabaseManager.auth.signOut();
  return;
}
await hydrateRestaurantContext(userId);
```

### 2. SuperAdminLogin.jsx - Silent Audit Logging
**Change:** Audit logging failures no longer break login

**Before:**
```javascript
catch (error) {
  console.error('Failed to log login attempt:', error);
}
```

**After:**
```javascript
catch (error) {
  // Silently fail - login should still work
  if (import.meta.env.DEV) {
    console.warn('[SuperAdmin] Audit logging failed:', error.message);
  }
}
```

---

## 🧪 Testing Procedure

### Test Staff Login

1. **Ensure User Has Restaurant:**
   ```sql
   SELECT email, role, restaurant_id 
   FROM users 
   WHERE email = 'your-email@example.com';
   ```

2. **Login:**
   - Navigate to http://localhost:5174/login
   - Enter credentials
   - Should redirect to dashboard

3. **Check Console:**
   - Should see: ✅ Auth error handling initialized
   - Should NOT see: "Restaurant context is missing"

4. **Check localStorage:**
   ```javascript
   // Open DevTools Console
   JSON.parse(localStorage.getItem('praahis_restaurant_ctx'))
   // Should show: { restaurantId: '...', restaurantName: '...', ... }
   ```

### Test SuperAdmin Login

1. **Login:**
   - Navigate to http://localhost:5174/superadmin-login
   - Enter owner credentials
   - Should redirect to /superadmin/dashboard

2. **Check Console:**
   - May see warning about audit logging (OK)
   - Login should still succeed

3. **Check localStorage:**
   ```javascript
   localStorage.getItem('is_owner_session') // Should be 'true'
   localStorage.getItem('sb-owner-session') // Should exist
   ```

---

## 🔍 Debugging Tips

### Check User Profile
```sql
SELECT 
  id,
  email,
  full_name,
  role,
  is_owner,
  is_active,
  restaurant_id,
  (SELECT name FROM restaurants WHERE id = users.restaurant_id) as restaurant_name
FROM users
WHERE email = 'your-email@example.com';
```

### Check Restaurant Assignment
```sql
-- See all staff without restaurants
SELECT email, role, restaurant_id
FROM users
WHERE role IN ('manager', 'chef', 'waiter')
  AND restaurant_id IS NULL;
```

### Check Restaurant Exists
```sql
SELECT id, name, slug, is_active
FROM restaurants
ORDER BY created_at DESC
LIMIT 5;
```

### Clear All Sessions (Fresh Start)
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 📋 Quick Checklist

**Before Login:**
- [ ] User exists in database
- [ ] User has correct role (manager/chef/waiter for staff)
- [ ] User has `is_active = true`
- [ ] User has `restaurant_id` assigned (for staff)
- [ ] Restaurant exists and is active

**After Login:**
- [ ] No "Restaurant context is missing" error
- [ ] Redirects to correct dashboard
- [ ] localStorage has correct session key
- [ ] localStorage has restaurant context (staff only)

---

## 🚑 Emergency Fix

If you're completely stuck:

1. **Create Test Restaurant:**
   ```sql
   INSERT INTO restaurants (name, slug, is_active)
   VALUES ('Test Restaurant', 'test-restaurant', true)
   RETURNING id;
   ```

2. **Assign to User:**
   ```sql
   UPDATE users
   SET restaurant_id = 'PASTE_ID_FROM_ABOVE'
   WHERE email = 'your-email@example.com';
   ```

3. **Clear Browser:**
   - Clear cache: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Clear localStorage: DevTools > Application > Local Storage > Clear All

4. **Login Again:**
   - Navigate to http://localhost:5174/login
   - Enter credentials
   - Should work now

---

## 📞 Still Having Issues?

1. **Check Supabase Logs:**
   - Dashboard > Logs > Error Logs
   - Look for RLS policy violations

2. **Check Browser Console:**
   - Press F12
   - Look for red errors
   - Share error messages

3. **Check Network Tab:**
   - F12 > Network
   - Look for failed requests (red)
   - Check response messages

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Login redirects to dashboard
- ✅ No "Restaurant context is missing" error
- ✅ Dashboard loads with restaurant data
- ✅ No 403 errors (or only harmless audit log warning)
- ✅ Console shows: "✅ Auth error handling initialized"

---

**Last Updated:** November 15, 2025  
**Status:** Issues identified and fixed  
**Next Action:** Assign restaurant_id to users and test login
