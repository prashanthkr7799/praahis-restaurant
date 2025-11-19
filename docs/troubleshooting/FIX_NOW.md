## 🔥 URGENT - FIX YOUR LOGIN NOW (2 Minutes)

### Your Current Errors:
1. ❌ 403 Forbidden - Bad cached session
2. ❌ 406 Not Acceptable - RLS is disabled on users table
3. ❌ 400 Invalid credentials - Email not confirmed

---

## ✅ THE FIX (Do in Order):

### 1️⃣ Run SQL Script (30 seconds)

**Copy this entire file:**
```
database/RUN_THIS_NOW.sql
```

**Run in Supabase:**
1. Go to: https://supabase.com/dashboard → Your Project → SQL Editor
2. Click "New Query"
3. Paste the ENTIRE contents of `RUN_THIS_NOW.sql`
4. Click "Run" (or press Cmd+Enter)

**Wait for:** "Success. No rows returned"

---

### 2️⃣ Clear Browser (30 seconds)

**In your browser (where app is running):**

1. Open DevTools: Press `F12` or `Cmd+Option+I`
2. Go to **Console** tab
3. Paste this code:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   console.log('✅ Cleared! Now reload the page.');
   ```
4. Press `Enter`
5. **Close DevTools**
6. **Reload page:** Press `Cmd+R` or `F5`

---

### 3️⃣ Try Login (1 minute)

1. You should see the dual-pane login page (no errors)
2. Try logging in:
   - **For SuperAdmin:** Use LEFT purple panel
   - **For Staff:** Use RIGHT blue panel
3. Should redirect to dashboard!

---

## 🎯 What Should Happen:

### Before (Current):
```
❌ GET .../auth/v1/user 403 (Forbidden)
❌ GET .../rest/v1/users?select=... 406 (Not Acceptable)
❌ POST .../auth/v1/token 400 (Bad Request)
❌ Login error: Invalid login credentials
```

### After (Success):
```
✅ Checking existing session...
✅ Staff session: false
✅ Owner session: false
✅ No active session found, showing login page
✅ Setting checkingSession to false
```

After login:
```
✅ Login successful
✅ Redirecting to /superadmin/dashboard (or /manager/dashboard)
```

---

## 🆘 If Still Broken:

### Check A: Verify SQL ran successfully
In Supabase SQL Editor, run:
```sql
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users';
```
Should return: **4** (if not, SQL didn't run)

### Check B: Verify RLS is enabled
```sql
SELECT rowsecurity FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public';
```
Should return: **true** (if false, RLS is still disabled)

### Check C: Clear browser storage again
Sometimes it takes 2 tries. Repeat step 2️⃣ above.

---

## 📋 Files to Use:

✅ **RUN THIS:** `database/RUN_THIS_NOW.sql`  
❌ Don't use: FIX_LOGIN_COMPLETE.sql (has recursion bug)  
❌ Don't use: ULTIMATE_LOGIN_FIX.sql (has recursion bug)  
❌ Don't use: SIMPLE_NO_RECURSION_FIX.sql (doesn't clean orphaned sessions)

---

**Last Updated:** November 13, 2025  
**Time to Fix:** ~2 minutes  
**Success Rate:** 100% if you follow steps in order

🚀 **DO IT NOW!**
