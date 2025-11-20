# 📱 Multi-Device Cart Testing Guide

## ✅ What We've Implemented

Your restaurant system now has a **fully database-driven shared cart** with real-time syncing across ALL devices.

### Key Features:
- ✅ **Zero localStorage for cart/session** - everything from database
- ✅ **ONE shared cart per table** - all devices see the same cart
- ✅ **Real-time sync** - instant updates across devices
- ✅ **Duplicate prevention** - only one active session per table
- ✅ **Feedback status** - manager sees "Feedback ✓" badge

---

## 🔧 Technical Implementation

### Database-Driven Session Flow
```javascript
// Customer scans QR → opens /table/:id?restaurant=slug

1. getOrCreateActiveSessionId(tableId)
   ├─ Check database: SELECT * FROM table_sessions WHERE table_id=X AND status='active'
   ├─ If exists → return existing session_id ✅ REUSE
   └─ If not → create new session → return new session_id

2. All devices get SAME session_id from database
   ├─ Device 1 (Phone): session_id = abc-123
   ├─ Device 2 (Tablet): session_id = abc-123
   └─ Device 3 (Laptop): session_id = abc-123

3. Load shared cart from database
   ├─ SELECT cart_items FROM table_sessions WHERE id = 'abc-123'
   └─ All devices get SAME cart array

4. Subscribe to real-time updates
   ├─ Supabase Realtime: postgres_changes (primary)
   └─ Broadcast channel (backup)
```

### Real-Time Sync Architecture
```
Device A (Phone)                    Database                    Device B (Laptop)
     │                                 │                               │
     │   Add "Butter Chicken"          │                               │
     ├──────UPDATE cart_items──────────>│                               │
     │                                 │                               │
     │                                 │   🔔 Realtime Event           │
     │                                 ├───────────────────────────────>│
     │                                 │                               │
     │                                 │   Cart Updated!               │
     │                                 │   [Butter Chicken]            │
```

---

## 🧪 Testing Instructions

### Test 1: Multi-Device Cart Sync ⭐ CRITICAL

**You Need:**
- Computer (Chrome/Safari)
- Phone (any browser)
- Same WiFi network (or 4G/5G)

**Steps:**

1. **Start your development server** (if not running):
   ```bash
   cd /Users/prashanth/Downloads/Praahis
   npm run dev
   ```

2. **Open on Computer:**
   - Go to: `http://localhost:5173`
   - Login as Manager
   - Navigate to Tables → Click any table → Click QR Code icon
   - **Keep this QR code visible**

3. **Open on Phone:**
   - Use phone camera/QR scanner
   - Scan the QR code from your computer screen
   - Phone should open: `http://[computer-ip]:5173/table/[table-id]?restaurant=...`
   - ⚠️ **If localhost doesn't work on phone**, replace `localhost` with your computer's IP:
     - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
     - Windows: `ipconfig` → look for IPv4 Address

4. **Test Real-Time Sync:**

   **A. Add item on PHONE:**
   - Browse menu on phone
   - Click "Add to Cart" for any item (e.g., "Butter Chicken")
   - ✅ **Expected:** Item appears instantly on PHONE cart
   - 🔍 **Check COMPUTER:** Item should appear instantly WITHOUT refresh

   **B. Add item on COMPUTER:**
   - Browse menu on computer
   - Click "Add to Cart" for different item
   - ✅ **Expected:** Item appears instantly on COMPUTER cart
   - 🔍 **Check PHONE:** Item should appear instantly WITHOUT refresh

   **C. Change quantity on PHONE:**
   - Click "+" on any cart item
   - ✅ **Expected:** Quantity increases on PHONE
   - 🔍 **Check COMPUTER:** Quantity updates instantly

   **D. Remove item on COMPUTER:**
   - Click "Remove" on any cart item
   - ✅ **Expected:** Item removed from COMPUTER cart
   - 🔍 **Check PHONE:** Item disappears instantly

5. **Open Console Logs** (F12 → Console tab on computer):
   ```
   ✅ Should see:
   📦 getSharedCart result: { sessionId: "abc-123", cartLength: 2 }
   📡 Subscription status: SUBSCRIBED
   🔔 Real-time UPDATE received (postgres_changes)
   📡 Broadcast sent as backup
   📻 Broadcast received (backup method)
   
   ❌ Should NOT see:
   ❌ Error updating shared cart
   ❌ Subscription channel error
   ❌ 400/406 errors
   ```

---

### Test 2: Duplicate Cart Prevention

**Steps:**

1. **Open Table on Device 1:**
   - Computer: `http://localhost:5173/table/[table-id]`
   - Add 3 items to cart

2. **Open SAME Table on Device 2:**
   - Phone: Scan same QR code
   - ✅ **Expected:** Phone shows SAME 3 items in cart
   - ❌ **Should NOT:** Create new empty cart

3. **Verify in Database:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT 
     id, 
     table_id, 
     status, 
     cart_items,
     created_at
   FROM table_sessions
   WHERE table_id = '[your-table-id]'
     AND status = 'active';
   ```
   - ✅ **Expected:** Only ONE active session
   - ✅ **cart_items:** Should contain all items
   - ❌ **Should NOT:** See multiple active sessions

---

### Test 3: Session Reuse After Refresh

**Steps:**

1. **Device 1 - Add items:**
   - Computer: Add 5 items to cart

2. **Device 1 - Refresh browser:**
   - Press F5 or Cmd+R
   - ✅ **Expected:** All 5 items still in cart
   - ✅ **Session ID:** Same as before (check console logs)

3. **Device 2 - Open table:**
   - Phone: Scan QR code
   - ✅ **Expected:** Same 5 items appear
   - ✅ **Session ID:** Same as Device 1

---

### Test 4: Feedback Status Display

**Steps:**

1. **Customer Journey:**
   - Open table on phone
   - Add items to cart
   - Click "Proceed to Payment"
   - Complete payment (use test mode)
   - Submit feedback with rating

2. **Manager Dashboard:**
   - Open Manager Dashboard on computer
   - Look at "Recent Orders" section
   - ✅ **Expected:** Order shows **"Feedback ✓"** badge below table number
   - Badge should be green/success color

3. **Verify in Database:**
   ```sql
   SELECT 
     order_number,
     feedback_submitted,
     feedback_submitted_at,
     total
   FROM orders
   WHERE restaurant_id = '[your-restaurant-id]'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   - ✅ **feedback_submitted:** Should be `true`
   - ✅ **feedback_submitted_at:** Should have timestamp

---

## 🐛 Troubleshooting

### Issue: Real-time not working between devices

**Symptoms:**
- Device A adds item → Device B doesn't update
- Console shows: "Subscription channel error"

**Solution:**
1. Check Supabase Realtime is enabled:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
   - Should show `table_sessions` table

2. Verify REPLICA IDENTITY:
   ```sql
   SELECT relname, relreplident 
   FROM pg_class 
   WHERE relname = 'table_sessions';
   ```
   - `relreplident` should be `'f'` (FULL)

3. Check RLS policies allow anonymous updates:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'table_sessions';
   ```
   - Should have policy allowing `UPDATE` with `USING (true)`

---

### Issue: Multiple carts created for same table

**Symptoms:**
- Device A and B have different cart contents
- Database shows 2+ active sessions for same table

**Solution:**
1. Check for duplicate sessions:
   ```sql
   SELECT table_id, COUNT(*) as session_count
   FROM table_sessions
   WHERE status = 'active'
   GROUP BY table_id
   HAVING COUNT(*) > 1;
   ```

2. Clean up duplicates (keep latest):
   ```sql
   -- Mark old sessions as completed
   UPDATE table_sessions
   SET status = 'completed', ended_at = NOW()
   WHERE id IN (
     SELECT id FROM table_sessions
     WHERE table_id = '[problem-table-id]'
       AND status = 'active'
     ORDER BY created_at DESC
     OFFSET 1
   );
   ```

3. Restart devices and scan QR again

---

### Issue: Cart persists after closing browser

**This is CORRECT behavior!** 

The cart is stored in the database, not browser localStorage. This means:
- ✅ Cart survives browser close/reopen
- ✅ Cart survives device restart
- ✅ Cart survives network disconnect

**To clear cart manually:**
```sql
UPDATE table_sessions
SET cart_items = '[]'::jsonb
WHERE id = '[session-id]';
```

---

## 📊 Database Verification Queries

### Check Active Sessions
```sql
SELECT 
  ts.id as session_id,
  t.table_number,
  ts.status,
  jsonb_array_length(ts.cart_items) as item_count,
  ts.created_at,
  ts.last_activity_at
FROM table_sessions ts
JOIN tables t ON t.id = ts.table_id
WHERE ts.status = 'active'
ORDER BY ts.last_activity_at DESC;
```

### View Cart Contents
```sql
SELECT 
  t.table_number,
  ts.cart_items,
  ts.last_activity_at
FROM table_sessions ts
JOIN tables t ON t.id = ts.table_id
WHERE ts.status = 'active'
  AND jsonb_array_length(ts.cart_items) > 0;
```

### Check Feedback Submissions
```sql
SELECT 
  o.order_number,
  t.table_number,
  o.total,
  o.feedback_submitted,
  o.feedback_submitted_at,
  f.rating,
  f.comment
FROM orders o
JOIN tables t ON t.id = o.table_id
LEFT JOIN feedbacks f ON f.session_id = o.session_id
WHERE o.restaurant_id = '[your-restaurant-id]'
  AND o.feedback_submitted = true
ORDER BY o.created_at DESC
LIMIT 10;
```

---

## ✅ Success Criteria

Your multi-device cart is working correctly if:

- ✅ **No localStorage usage** for cart/session (check DevTools → Application → Local Storage)
- ✅ **ONE session per table** in database (verified with SQL query)
- ✅ **Real-time sync** works across phone + computer (tested manually)
- ✅ **Cart persists** after browser refresh (all devices see same data)
- ✅ **Feedback badge** shows in manager dashboard (after customer submits feedback)
- ✅ **Console logs** show successful subscription and updates
- ✅ **No errors** in browser console or Supabase logs

---

## 🎯 Next Steps

1. **Test with 3+ devices** (phone + tablet + laptop)
2. **Test with poor network** (disable WiFi, use 4G)
3. **Test order completion** (verify cart clears after checkout)
4. **Monitor Supabase logs** for any errors
5. **Share QR code** with beta testers for real-world feedback

---

## 📚 Related Documentation

- [SHARED_CART_IMPLEMENTATION.md](./SHARED_CART_IMPLEMENTATION.md) - Technical implementation details
- [ENABLE_REALTIME_FOR_CART.md](./ENABLE_REALTIME_FOR_CART.md) - Supabase Realtime setup guide
- [TABLE_SESSION_CLEANUP.md](../TABLE_SESSION_CLEANUP.md) - Session cleanup automation

---

**Last Updated:** November 20, 2025
**Status:** ✅ Fully Implemented & Ready for Testing
