# 🎯 Quick Fix Checklist - All 4 Issues

## ⚡ Run These SQL Scripts (IN ORDER!)

Go to: **Supabase Dashboard → SQL Editor**

### 1️⃣ Fix Logout 401 Error
```
database/SIMPLE_FIX_AUTH_LOGS.sql
```
Click **Run** → Wait for ✅ success message

---

### 2️⃣ Fix Staff Creation
```
database/FIX_STAFF_CREATION_RLS.sql
```
Click **Run** → Look for: `✅ Policy created: users_select_self`

---

### 3️⃣ Fix Staff Login (AUTO-CONFIRM) ← NEW!
```
database/FIX_STAFF_LOGIN_CONFIRMATION.sql
```
Click **Run** → Look for:
- `✅ Auto-confirm trigger created`
- `✅ Confirmed X unconfirmed users`

---

## 🔄 Restart Everything

### 4️⃣ Restart Dev Server
```bash
# In terminal:
Ctrl+C
npm run dev
```
Wait for: `Local: http://localhost:5173/`

---

### 5️⃣ Hard Refresh Browser
Press: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)

---

### 6️⃣ Logout and Login
1. Click "Logout" in app
2. Go to: `http://localhost:5173/login`
3. Login as manager

---

## ✅ Test Workflow

### 7️⃣ Test Everything Works

- [ ] Manager login works (no "context missing")
- [ ] Manager can add chef (kumar@spice.com)
- [ ] Manager can add waiter (ravi@spice.com)
- [ ] Logout works (no 401 console errors)
- [ ] **Chef can login immediately** ← NEW TEST!
- [ ] **Waiter can login immediately** ← NEW TEST!

---

## 🎉 Success!

All 4 issues fixed:
1. ✅ Manager login timing
2. ✅ Logout 401 error
3. ✅ Staff creation permission
4. ✅ Staff login auto-confirm

**Your complete hierarchy is working!** 🚀
