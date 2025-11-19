# 🔧 LOGIN TROUBLESHOOTING GUIDE

## Current Issues You're Experiencing:
1. ❌ 403 Forbidden on `/auth/v1/user`
2. ❌ 406 Not Acceptable on users table query
3. ❌ 400 Invalid login credentials

## Root Cause:
- RLS (Row Level Security) was disabled on `users` table for debugging
- This causes 406 errors when querying the table
- Old sessions are conflicting with new login attempts

---

## 🚀 COMPLETE FIX (Follow in Order):

### Step 1: Re-enable RLS with Proper Policies
```sql
-- Run this in Supabase SQL Editor:
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- Copy and paste the contents of:
database/FIX_LOGIN_COMPLETE.sql

-- Then click "Run"
```

This will:
- ✅ Re-enable RLS on users table
- ✅ Create proper policies (owners can see all, users can see own)
- ✅ Ensure auto-confirm trigger is active
- ✅ Confirm all existing users

---

### Step 2: Clear Browser Storage
```javascript
// Open browser DevTools (F12 or Cmd+Option+I)
// Go to Console tab
// Copy and paste the contents of:
scripts/clear-browser-storage.js

// Then press Enter
// Then refresh the page (Cmd+R or F5)
```

This will:
- ✅ Clear localStorage (including sb-manager-session, sb-owner-session)
- ✅ Clear sessionStorage
- ✅ Clear IndexedDB (Supabase session cache)
- ✅ Clear cookies

---

### Step 3: Test Login Flow

#### Test SuperAdmin Login:
1. Go to http://localhost:5174/login
2. Click the **purple "Admin Login"** panel on the LEFT
3. Enter SuperAdmin credentials:
   - Email: `your_superadmin_email@example.com`
   - Password: `your_password`
4. Click "Sign In"
5. Should redirect to: `/superadmin/dashboard`

#### Test Staff Login:
1. Go to http://localhost:5174/login
2. Use the **blue "Staff Login"** panel on the RIGHT (default)
3. Enter manager credentials:
   - Email: `manager@example.com`
   - Password: `manager_password`
4. Click "Sign In"
5. Should redirect to: `/manager/dashboard`

---

## 🎯 Expected Behavior After Fix:

### When Login Works:
✅ No 403 errors in console  
✅ No 406 errors in console  
✅ User profile fetched successfully  
✅ Redirects to correct dashboard based on role  
✅ Session persists on page refresh  

### Console Logs You Should See:
```
Checking existing session...
Staff session: false
Owner session: false
No active session found, showing login page
Setting checkingSession to false
```

After successful login:
```
Login successful, user: [user_object]
User role: owner (or manager, chef, waiter)
Redirecting to: /superadmin/dashboard (or appropriate dashboard)
```

---

## 🐛 If Still Not Working:

### Check #1: Verify RLS Policies
```sql
-- Run in Supabase SQL Editor:
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
```

You should see 5 policies:
- `users_select_own` (SELECT)
- `users_select_all_for_owner` (SELECT)
- `users_insert_owner` (INSERT)
- `users_update_owner` (UPDATE)
- `users_delete_owner` (DELETE)

### Check #2: Verify User Exists and is Confirmed
```sql
-- Run in Supabase SQL Editor:
SELECT 
    au.email,
    au.email_confirmed_at,
    pu.role,
    pu.is_owner,
    pu.is_active,
    pu.restaurant_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'YOUR_EMAIL_HERE';
```

You should see:
- ✅ `email_confirmed_at` is NOT NULL
- ✅ `is_active` is `true`
- ✅ `is_owner` is `true` (for SuperAdmin) or `false` (for staff)
- ✅ `role` is `owner` (SuperAdmin) or `manager`/`chef`/`waiter`

### Check #3: Verify Auto-Confirm Trigger
```sql
-- Run in Supabase SQL Editor:
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'auto_confirm_user_trigger';
```

You should see:
- ✅ `trigger_name`: `auto_confirm_user_trigger`
- ✅ `event_object_table`: `users` (in auth schema)
- ✅ `action_timing`: `BEFORE`

---

## 📝 Common Mistakes:

### ❌ Don't Do This:
- Using wrong login panel (SuperAdmin using Staff panel)
- Not clearing browser storage after RLS changes
- Running DEBUG_DISABLE_RLS.sql (keeps RLS disabled)

### ✅ Do This:
- Use Admin panel (LEFT, purple) for SuperAdmin
- Use Staff panel (RIGHT, blue) for managers/waiters/chefs
- Run FIX_LOGIN_COMPLETE.sql (re-enables RLS properly)
- Clear browser storage after database changes

---

## 🎓 Understanding the Two Login Panels:

### Admin Login Panel (LEFT, Purple)
- **Who:** SuperAdmin ONLY (is_owner = true)
- **Client:** supabaseOwner
- **Session Key:** sb-owner-session
- **Redirects to:** /superadmin/dashboard
- **Can do:** Manage all restaurants, create managers, view all data

### Staff Login Panel (RIGHT, Blue)
- **Who:** Managers, Chefs, Waiters (is_owner = false)
- **Client:** supabase
- **Session Key:** sb-manager-session
- **Redirects to:** /manager/dashboard, /chef/dashboard, /waiter/dashboard
- **Can do:** Manage their own restaurant's data only

---

## 🆘 Emergency Contacts:

If nothing works, check:
1. Supabase project is running (not paused)
2. API keys are correct in `.env`
3. Database migrations are applied
4. Internet connection is stable

---

## ✅ Success Checklist:

- [ ] Ran `FIX_LOGIN_COMPLETE.sql` in Supabase
- [ ] Cleared browser storage using `clear-browser-storage.js`
- [ ] Refreshed the page
- [ ] Can see login page without errors
- [ ] Can login as SuperAdmin via Admin panel
- [ ] Can login as staff via Staff panel
- [ ] Sessions persist on refresh
- [ ] No 403/406 errors in console

---

**Last Updated:** November 13, 2025  
**Status:** Ready to test after running fixes
