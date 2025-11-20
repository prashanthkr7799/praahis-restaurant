# Enable Supabase Realtime for Shared Cart

## 🎯 Issue
Real-time cart synchronization across devices requires Supabase Realtime to be enabled for the `table_sessions` table.

## ✅ Solution: Enable Realtime via Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `hpcwpkjbmcelptwwxicn`
3. Navigate to **Database** → **Replication**

### Step 2: Enable Replication for table_sessions
1. Find `table_sessions` in the tables list
2. Click the toggle to **Enable** replication
3. Confirm the action

### Step 3: Verify Settings
The following should be enabled:
- **Schema**: `public`
- **Table**: `table_sessions`
- **Replica Identity**: `FULL` (recommended for cart sync)

## 🔍 How to Test

### Test 1: Check Subscription Status
1. Open browser console on TablePage
2. Look for: `📡 Subscription status: SUBSCRIBED`
3. Should see: `✅ Successfully subscribed to cart updates`

### Test 2: Multi-Device Sync
1. Open same QR code on **two devices** (or browser windows)
2. **Device A**: Add item to cart
3. **Device B**: Should see item appear automatically (no refresh)
4. **Device B**: Change quantity
5. **Device A**: Should see quantity update instantly

### Expected Console Logs
```
🔌 Setting up real-time subscription for session: <uuid>
📡 Subscription status: SUBSCRIBED
✅ Successfully subscribed to cart updates

// When update happens:
🔔 Real-time UPDATE received: {
  sessionId: '<uuid>',
  cartItems: [...],
  timestamp: '2025-11-20T...'
}
```

## ⚠️ Troubleshooting

### Issue: Subscription status shows CHANNEL_ERROR
**Solution**: Verify Realtime is enabled in Supabase dashboard

### Issue: No real-time updates received
**Checklist**:
- [ ] Realtime enabled for `table_sessions` in dashboard
- [ ] RLS policies allow UPDATE for anonymous users (fixed in migration 12)
- [ ] Both devices using same `sessionId` (check console logs)
- [ ] `cart_items` column exists in database (added in migration 08)

### Issue: 406 error when loading cart
**Status**: ✅ Fixed in latest commit (using `.maybeSingle()`)

## 🚀 Alternative: SQL Method (if dashboard access unavailable)

If you have direct database access:

```sql
-- Run via Supabase SQL Editor
ALTER TABLE public.table_sessions REPLICA IDENTITY FULL;

-- Verify
SELECT schemaname, tablename, 
       CASE 
         WHEN relreplident = 'f' THEN '✅ FULL (enabled)'
         ELSE '❌ Not enabled'
       END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE t.tablename = 'table_sessions';
```

## 📊 Architecture Diagram

```
Device A                 Supabase Realtime              Device B
   |                            |                           |
   | Add item                   |                           |
   |--------------------------->|                           |
   | UPDATE table_sessions      |                           |
   |                            |                           |
   |                            |--[postgres_changes]------>|
   |                            |   event: UPDATE            |
   |                            |   payload.new.cart_items   |
   |                            |                           |
   |                            |                    setCartItems(new)
   |                            |                           | ✅
```

## 🎉 Success Indicators

When working correctly, you'll see:
1. ✅ No 406/400 errors in console
2. ✅ `SUBSCRIBED` status logged
3. ✅ Real-time `UPDATE` events logged when cart changes
4. ✅ Cart items appear instantly on all devices
5. ✅ No page refresh needed

## 📝 Related Files
- `src/shared/utils/api/supabaseClient.js` - Cart functions
- `src/pages/customer/TablePage.jsx` - Real-time subscription setup
- `phase3_migrations/08_table_sessions_and_auth.sql` - Schema with cart_items
- `phase3_migrations/12_rls_policies.sql` - RLS policies allowing updates

## 🔗 Resources
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Postgres Changes Events](https://supabase.com/docs/guides/realtime/postgres-changes)
