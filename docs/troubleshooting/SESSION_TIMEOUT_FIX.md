# Session Timeout Fix - Complete Guide

## 🔴 Problem
Staff members were getting logged out automatically after a short time (around 1 hour), disrupting their work. This happens because:
1. Default JWT token expires after 1 hour
2. No automatic token refresh during user activity
3. No session persistence configured

## ✅ Solutions Implemented

### 1. **Client-Side Fixes** (Automatic - Already Applied)

#### Updated Supabase Clients:
- ✅ Added `detectSessionInUrl: true` - Detects sessions from URL parameters
- ✅ Added `flowType: 'pkce'` - Uses more secure PKCE flow
- ✅ Added custom headers for client identification

**Files Modified:**
- `/src/shared/utils/api/supabaseClient.js`
- `/src/shared/utils/api/supabaseOwnerClient.js`

#### Created Session Heartbeat Manager:
- ✅ Automatically refreshes tokens every 15 minutes
- ✅ Tracks user activity (mouse, keyboard, scroll, touch)
- ✅ Stops refreshing after 4 hours of inactivity
- ✅ Logs refresh events for debugging

**File Created:**
- `/src/shared/utils/api/sessionHeartbeat.js`

**Integration:**
- ✅ Auto-starts when user logs in
- ✅ Auto-stops when user logs out
- ✅ Imported in `/src/main.jsx`

### 2. **Server-Side Configuration** (Manual - You Must Do This)

#### Extend JWT Expiry in Supabase Dashboard:

1. **Go to Supabase Dashboard** → Your Project
2. Click **Authentication** in left sidebar
3. Click **Settings** tab
4. Scroll to **JWT Settings** section
5. Find **JWT expiry** field (currently 3600 seconds = 1 hour)
6. Change to **14400 seconds** (4 hours)
7. Click **Save**

**Why 4 hours?**
- Long enough for a typical work shift
- Short enough for security
- Matches the heartbeat inactivity timeout

## 📊 How It Works Now

### Before Fix:
```
Login → 1 hour passes → Token expires → Logged out ❌
```

### After Fix:
```
Login → Every 15 min (if active) → Token auto-refreshed → Stays logged in ✅
       → After 4 hours inactive → Logged out (security) ✅
```

### Timeline Example:
```
0:00  - User logs in
0:15  - Token refreshed (still active)
0:30  - Token refreshed (still active)
0:45  - Token refreshed (still active)
1:00  - Token refreshed (OLD: would expire here ❌)
...
3:45  - Token refreshed (still active)
4:00  - User inactive for 4 hours → Auto logout ✅
```

## 🧪 Testing

### Test 1: Verify Heartbeat is Running
1. Login as any staff member
2. Open browser console (F12)
3. You should see: `🫀 Session heartbeat started`
4. Wait 15 minutes
5. You should see: `🔄 Manager session refreshed` or `🔄 Owner session refreshed`

### Test 2: Verify Session Persists
1. Login as chef/waiter
2. Work normally for 2-3 hours
3. You should remain logged in ✅
4. No unexpected logouts

### Test 3: Verify Inactivity Timeout
1. Login as any user
2. Leave the tab open but don't touch anything
3. After 4 hours, you should be logged out
4. This is expected behavior for security

## 🔍 Debugging

### Check Current Session:
Open console and run:
```javascript
// Check manager session
await supabase.auth.getSession()

// Check owner session
await supabaseOwner.auth.getSession()
```

### Monitor Token Expiry:
```javascript
const { data } = await supabase.auth.getSession()
const expiresAt = data.session?.expires_at
console.log('Token expires at:', new Date(expiresAt * 1000))
```

### Force Refresh:
```javascript
await supabase.auth.refreshSession()
```

## ⚙️ Configuration Options

### Adjust Heartbeat Interval:
Edit `/src/shared/utils/api/sessionHeartbeat.js`:
```javascript
this.HEARTBEAT_INTERVAL = 15 * 60 * 1000; // Change 15 to desired minutes
```

### Adjust Inactivity Timeout:
```javascript
this.INACTIVITY_TIMEOUT = 4 * 60 * 60 * 1000; // Change 4 to desired hours
```

## 📝 Checklist

- [x] Client-side code updated
- [x] Session heartbeat created
- [x] Heartbeat integrated in main.jsx
- [ ] **TODO: Update JWT expiry in Supabase Dashboard** ⚠️ REQUIRED
- [ ] Test with real staff members
- [ ] Monitor console for heartbeat logs
- [ ] Verify no unexpected logouts

## 🚨 Important Notes

1. **All users must re-login** after you change JWT expiry in dashboard for the new timeout to take effect
2. **Monitor the console** for heartbeat logs - if you don't see them, something is wrong
3. **4-hour inactivity** is intentional for security - users who leave their computer should be logged out
4. **Token refresh happens in background** - users won't notice it

## 📞 If Issues Persist

1. Check browser console for errors
2. Verify JWT expiry was changed in Supabase Dashboard
3. Clear localStorage and re-login: `localStorage.clear()`
4. Check if heartbeat is running: Look for `🫀` emoji in console
5. Verify network tab shows token refresh requests every 15 min

## ✨ Expected Behavior

✅ Staff can work for 3-4 hours without interruption
✅ Sessions automatically refresh during active use
✅ No random logouts while working
✅ Secure auto-logout after 4 hours of inactivity
✅ Smooth, invisible token refreshes
