# 🔐 Session Management - Quick Reference

## ⚡ Quick Fix (Do This Now!)

### Step 1: Update Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Authentication → Settings
4. JWT expiry: Change **3600** to **14400**
5. Save

### Step 2: Tell All Staff to Re-Login
- Current sessions will expire normally
- New sessions will last 4 hours

## 🎯 What Changed

| Feature | Before | After |
|---------|--------|-------|
| Session Duration | 1 hour | 4 hours |
| Auto-refresh | Manual only | Every 15 min |
| Inactivity logout | 1 hour | 1 hour |
| Session tracking | None | Activity-based |

## 🔍 Quick Test

Run in browser console after login:
```javascript
// Should show token expiring ~4 hours from now
const { data } = await supabase.auth.getSession()
console.log('Expires:', new Date(data.session?.expires_at * 1000))
```

## 📱 What Staff Will Experience

✅ **Good:**
- Can work full shift without re-logging in
- No interruptions during active work
- Smooth, invisible session refreshes

✅ **Expected:**
- Auto-logout after 4 hours of inactivity (security feature)
- Must re-login if they leave for lunch and come back later

❌ **If This Happens (Bug):**
- Logout within 1 hour of active work
- "Session expired" while actively using app
- → Check console for errors
- → Verify JWT expiry was changed in dashboard

## 🛠️ Troubleshooting

**Problem: Still logging out after 1 hour**
- Solution: Did you change JWT expiry in Supabase Dashboard?
- Solution: Did staff re-login after the change?

**Problem: Heartbeat not showing in console**
- Solution: Clear cache and reload (Ctrl+Shift+R)
- Solution: Check for JavaScript errors in console

**Problem: Token not refreshing**
- Solution: Check Network tab for failed refresh requests
- Solution: Verify Supabase credentials are correct

## 🎉 Success Indicators

Look for these in browser console:
- `🫀 Session heartbeat started` - On login
- `🔄 Manager session refreshed` - Every 15 min
- `💔 Session heartbeat stopped` - On logout

No console spam = everything working perfectly!
