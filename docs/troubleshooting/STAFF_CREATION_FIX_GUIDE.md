# 🔧 Fix: Staff Creation Issues (409 & 400 Errors)

**Date:** November 15, 2025  
**Issues:** 409 Conflict, 400 Bad Request when adding staff members

---

## 🐛 Problems Fixed

### Issue 1: 409 Conflict - Duplicate Insert
**Error:**
```
Failed to load resource: the server responded with a status of 409 ()
Error: This email is already registered
```

**Root Cause:**
The `signUp` function was inserting into the `users` table, then the `admin_upsert_user_profile` RPC was trying to insert again, causing a conflict.

**Fix Applied:**
- Removed the direct insert from `signUp` function
- Let the RPC function `admin_upsert_user_profile` handle the insert
- This prevents duplicate insert attempts

---

### Issue 2: 400 Bad Request - RPC Function Failures
**Error:**
```
Failed to load resource: the server responded with a status of 400 ()
RPC function admin_upsert_user_profile failed
```

**Common Causes:**
1. **Not logged in as manager** - You must be logged in with a manager account
2. **Missing restaurant_id** - Your manager account needs a restaurant assigned
3. **Cross-restaurant attempt** - Trying to add staff to a different restaurant

**Fix Applied:**
- Better error messages for each failure case
- Clear feedback about what went wrong
- Validation checks before RPC call

---

## ✅ Changes Made

### 1. Fixed auth.js - Removed Duplicate Insert
**File:** `src/shared/utils/auth/auth.js`

**Before:**
```javascript
// Create user record in users table
if (data.user) {
  const { error: insertError } = await supabase.from('users').insert({
    id: data.user.id,
    email: data.user.email,
    // ... more fields
  });
  if (insertError) throw insertError;
}
```

**After:**
```javascript
// NOTE: We no longer insert into users table here
// The RPC function admin_upsert_user_profile will handle that
// This prevents duplicate insert errors
```

### 2. Improved StaffForm.jsx - Better Error Messages
**File:** `src/domains/staff/components/StaffForm.jsx`

**Added specific error handling:**
- ✅ "This email is already registered"
- ✅ "Password must be at least 6 characters"
- ✅ "You must be logged in as a manager"
- ✅ "Only managers and admins can add staff"
- ✅ "Cannot add staff to a different restaurant"

---

## 🧪 Testing Procedure

### Prerequisites
1. **You must be logged in as Manager**
   ```sql
   -- Check your current user
   SELECT id, email, role, restaurant_id 
   FROM users 
   WHERE id = auth.uid();
   
   -- Result should show:
   -- role: 'manager' or 'admin'
   -- restaurant_id: should have a valid UUID
   ```

2. **Your account must have a restaurant_id**
   ```sql
   -- If missing, assign one:
   UPDATE users
   SET restaurant_id = (SELECT id FROM restaurants LIMIT 1)
   WHERE id = auth.uid();
   ```

### Test Adding Staff

1. **Refresh Browser:**
   ```
   Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   ```

2. **Navigate to Staff Management:**
   ```
   http://localhost:5174/manager/staff
   ```

3. **Click "Add Staff Member"**

4. **Fill Form:**
   - Full Name: Test Staff
   - Email: teststaff@example.com (use NEW email)
   - Password: password123 (at least 6 characters)
   - Role: Chef or Waiter
   - Phone: Optional

5. **Click Save**

6. **Expected Results:**
   - ✅ Success toast: "Staff member added successfully"
   - ✅ Modal closes
   - ✅ Staff list refreshes with new member
   - ✅ No 409 or 400 errors

---

## 🔍 Troubleshooting

### Error: "This email is already registered"
**Cause:** Email exists in Supabase Auth

**Solutions:**
1. **Use a different email**
2. **Delete the existing user:**
   ```sql
   -- WARNING: This deletes the user permanently
   -- Get the user ID first
   SELECT id FROM auth.users WHERE email = 'existing@example.com';
   
   -- Delete from public.users
   DELETE FROM users WHERE id = 'USER_ID_HERE';
   
   -- Then delete from Supabase Dashboard:
   -- Authentication > Users > Find user > Delete
   ```

### Error: "You must be logged in as a manager"
**Cause:** Not authenticated or session expired

**Solution:**
```javascript
// Check session in browser console
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// If null, logout and login again
```

### Error: "Only managers and admins can add staff"
**Cause:** Your role is not manager or admin

**Solution:**
```sql
-- Update your role
UPDATE users
SET role = 'manager'
WHERE id = auth.uid();

-- Then logout and login again
```

### Error: "Cannot add staff to a different restaurant"
**Cause:** Restaurant mismatch

**Solution:**
```sql
-- Check your restaurant_id
SELECT restaurant_id FROM users WHERE id = auth.uid();

-- All staff you create will be assigned this same restaurant_id
-- Make sure you have a valid restaurant assigned
```

### Error: "Password must be at least 6 characters"
**Cause:** Password too short

**Solution:**
- Use a password with at least 6 characters
- Supabase Auth requirement

---

## 🎯 Common Scenarios

### Scenario 1: Fresh Setup
If you're setting up for the first time:

```sql
-- 1. Create a test restaurant
INSERT INTO restaurants (name, slug, is_active)
VALUES ('Test Restaurant', 'test-restaurant', true)
RETURNING id;

-- 2. Assign yourself as manager
UPDATE users
SET role = 'manager',
    restaurant_id = 'PASTE_RESTAURANT_ID_HERE'
WHERE id = auth.uid();

-- 3. Logout and login again

-- 4. Now you can add staff
```

### Scenario 2: Email Already Exists
If you keep getting "email already registered":

```sql
-- Find all users with that email
SELECT u.id, u.email, u.role, au.email as auth_email
FROM users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.email = 'problematic@email.com';

-- Delete from public.users
DELETE FROM users WHERE email = 'problematic@email.com';

-- Then delete from Supabase Dashboard > Authentication > Users
```

### Scenario 3: Testing with Multiple Emails
```javascript
// Use + trick for testing with Gmail
// All these go to same inbox but Supabase sees as different:
testuser+1@gmail.com
testuser+2@gmail.com
testuser+chef@gmail.com
testuser+waiter@gmail.com
```

---

## 📋 Verification Checklist

**Before Adding Staff:**
- [ ] Logged in as manager/admin
- [ ] Manager account has restaurant_id
- [ ] Using NEW email (not already registered)
- [ ] Password is 6+ characters
- [ ] Restaurant is active

**After Adding Staff:**
- [ ] Success message appears
- [ ] Staff appears in list
- [ ] Can click on staff to view/edit
- [ ] Staff has correct role
- [ ] Staff has same restaurant_id as manager

---

## 🛠️ SQL Helper Queries

### Check Current User Status
```sql
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.restaurant_id,
  u.is_active,
  r.name as restaurant_name,
  r.is_active as restaurant_active
FROM users u
LEFT JOIN restaurants r ON r.id = u.restaurant_id
WHERE u.id = auth.uid();
```

### Check All Staff in Your Restaurant
```sql
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.is_active,
  u.created_at
FROM users u
WHERE u.restaurant_id = (
  SELECT restaurant_id FROM users WHERE id = auth.uid()
)
ORDER BY u.created_at DESC;
```

### Check RPC Function Exists
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%admin_upsert%';
```

### Test RPC Function Manually
```sql
-- This should work if you're logged in as manager
SELECT admin_upsert_user_profile(
  'SOME_UUID_HERE'::uuid,  -- p_id
  'test@example.com',       -- p_email
  'Test User',              -- p_full_name
  'chef',                   -- p_role
  '1234567890',             -- p_phone
  (SELECT restaurant_id FROM users WHERE id = auth.uid())  -- p_restaurant_id
);
```

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No 409 errors in console
- ✅ No 400 errors in console
- ✅ Success toast appears
- ✅ Staff member appears in list
- ✅ Can view staff details
- ✅ Staff has correct restaurant_id

---

## 📞 Still Having Issues?

1. **Check Browser Console** (F12) for exact error message
2. **Check Supabase Logs** (Dashboard > Logs > Error Logs)
3. **Verify Database Migration** (Run database/14_staff_admin.sql)
4. **Check RLS Policies** (Table Editor > users > Policies)
5. **Try with fresh email** (use +trick for testing)

---

**Last Updated:** November 15, 2025  
**Status:** Fixed - Removed duplicate insert, improved error messages  
**Next Action:** Refresh browser and try adding staff again
