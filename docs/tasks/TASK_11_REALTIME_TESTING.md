# 🎯 Task 11: Real-Time Features Testing Guide

**Status:** In Progress  
**Priority:** 🔴 CRITICAL (Core UX Feature)  
**Last Updated:** November 15, 2025  
**Prerequisites:** Tasks 9 & 10 completed

---

## 📋 Overview

Test the real-time update system that enables instant communication between customers, kitchen staff, and waiters. This is **THE MOST CRITICAL** feature for restaurant operations.

### What We're Testing:
```
Real-Time Flow:
1. Customer places order → Chef sees it instantly
2. Chef changes status → Customer sees update instantly  
3. Order ready → Waiter gets notification
4. Subscription cleanup (no memory leaks)
5. Fallback polling when Realtime fails
6. Multiple concurrent users
```

---

## 🎯 Test Objectives

1. ✅ Verify Supabase Realtime subscriptions work
2. ✅ Test update propagation speed (< 3 seconds)
3. ✅ Validate subscription cleanup (no memory leaks)
4. ✅ Test fallback polling mechanism
5. ✅ Verify multiple simultaneous users
6. ✅ Check console for subscription errors
7. ✅ Test on slow network connections

---

## 🚀 Pre-Test Setup

### 1. Verify Realtime is Enabled

Run this in **Supabase SQL Editor**:

```sql
-- Check if Realtime is enabled for orders table
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'orders';

-- Expected: Should return one row with schemaname='public', tablename='orders'
```

**If NOT enabled:**
```bash
# Run the Realtime enable script
# File: database/03_enable_realtime.sql
```

### 2. Check Current Implementation

**Key Files with Real-Time:**
- `src/pages/customer/OrderStatusPage.jsx` - Customer tracking
- `src/pages/chef/ChefDashboard.jsx` - Kitchen display
- `src/pages/waiter/WaiterDashboard.jsx` - Waiter interface
- `src/shared/utils/api/supabaseClient.js` - Subscription helpers

**Subscription Pattern Used:**
```javascript
// OrderStatusPage.jsx (lines 71-89)
subscription = subscribeToOrder(orderId, (payload) => {
  if (payload.new) {
    const newStatus = payload.new.order_status;
    toast.success(`Order status updated: ${newStatus}`);
    setOrder(payload.new);
  }
});
```

**Fallback Polling:**
```javascript
// Polls every 10 seconds if Realtime fails
pollingInterval = setInterval(async () => {
  const updatedOrder = await getOrder(orderId);
  setOrder(updatedOrder);
}, 10000);
```

---

## 📝 Testing Scenarios

### **Scenario 1: Basic Real-Time Update** ⭐ (CRITICAL)

#### Setup:
1. Open **2 browser windows** side-by-side
2. Window 1: Customer view (order status page)
3. Window 2: Chef dashboard (after logging in as chef)

#### Test Steps:
1. **Place an order** (customer flow from Task 9)
2. **Window 1 (Customer):** Should redirect to order status page
   - Initial status: "Received"
   - Order number displayed
   - Items list shown

3. **Window 2 (Chef):** Login as chef
   - Navigate to `/chef/dashboard`
   - Verify order appears in queue
   - Should see new order notification (toast + sound)

4. **Change Status (Chef Dashboard):**
   - Click on the order card
   - Change status from "Received" → "Preparing"
   - Click save/confirm

5. **Verify Customer View Updates:**
   - **Window 1 should update automatically within 2-3 seconds**
   - Status changes from "Received" → "Preparing"
   - Toast notification: "🔔 Order status updated: Preparing"
   - Progress indicator updates
   - **NO PAGE REFRESH needed!**

6. **Continue Status Changes:**
   - Chef: "Preparing" → "Ready"
   - Customer: Should see update within 2-3 seconds
   - Chef: "Ready" → "Served"
   - Customer: Should auto-redirect to post-meal page

#### Expected Results:
- ✅ Updates propagate in < 3 seconds
- ✅ Toast notifications appear on status change
- ✅ No page refresh required
- ✅ Auto-redirect after "Served"
- ✅ No console errors

#### SQL Monitoring:
```sql
-- Watch order updates in real-time
SELECT 
  id,
  order_number,
  order_status,
  updated_at
FROM orders
WHERE id = 'your-order-id'
ORDER BY updated_at DESC;

-- Run this repeatedly while testing to see updates
```

---

### **Scenario 2: Chef Dashboard Real-Time**

#### Test New Order Detection:
1. **Window 1:** Chef dashboard open
2. **Window 2:** Customer places new order
3. **Verify Chef Dashboard:**
   - New order appears in queue instantly
   - Sound notification plays
   - Toast: "🔔 New order received: #ORD-XXX"
   - Order card shows in "Received" section

#### Test Multi-Order Updates:
1. Have 3-5 orders in different states
2. Update one order status
3. Verify only that order card updates
4. Other cards remain unchanged
5. No unnecessary re-renders

---

### **Scenario 3: Subscription Cleanup (Memory Leak Test)**

This tests that subscriptions are properly cleaned up when components unmount.

#### Test Steps:
1. Open customer order status page
2. **Open DevTools** → Console tab
3. Note: Look for subscription messages
4. Navigate away from order status (click back/home)
5. Return to order status page
6. Repeat 3-4 times

#### Check Console:
**Should see:**
```
✅ "Subscribed to order updates" (on mount)
✅ Cleanup logs (on unmount)
```

**Should NOT see:**
```
❌ "Multiple subscriptions detected"
❌ "Memory leak warning"
❌ Exponentially increasing logs
```

#### Browser Memory Check:
1. Open DevTools → Performance tab
2. Click "Record"
3. Navigate between order status and other pages 10 times
4. Stop recording
5. Check memory graph
   - Should be relatively flat
   - No continuous upward trend
   - Memory should release after navigation

---

### **Scenario 4: Fallback Polling** 

Test what happens when Realtime fails.

#### Simulate Realtime Failure:
**Method 1: Disable in Supabase**
```sql
-- Temporarily remove orders from publication
ALTER PUBLICATION supabase_realtime DROP TABLE orders;
```

**Method 2: Network Throttling**
- Open DevTools → Network tab
- Throttle to "Slow 3G"
- Realtime websocket may fail

#### Test:
1. With Realtime disabled, open order status page
2. Console should show: "⚠️ Realtime subscription failed, using polling only"
3. In chef dashboard, change order status
4. **Customer view should update within 10 seconds** (polling interval)
5. Updates still work, just slower

#### Re-enable Realtime:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

---

### **Scenario 5: Multiple Concurrent Users**

Test system under realistic load.

#### Setup:
1. Open **4 browser windows/tabs**:
   - Window 1: Customer 1 (order A)
   - Window 2: Customer 2 (order B)  
   - Window 3: Chef dashboard
   - Window 4: Waiter dashboard

#### Test:
1. Place 2 orders from customers
2. Both should appear in Chef & Waiter dashboards
3. Update order A status
4. Only Customer 1 should see update
5. Customer 2 should not be affected
6. Update order B status
7. Only Customer 2 should see update

#### Verify Isolation:
- Each customer only gets updates for THEIR order
- Chef/Waiter see all orders for restaurant
- No cross-contamination
- All updates propagate correctly

---

### **Scenario 6: Long Session (Stability Test)**

Test for memory leaks and connection stability over time.

#### Test:
1. Open order status page
2. Leave it open for 30 minutes
3. Have someone periodically update the order status
4. Monitor:
   - Does it still receive updates?
   - Any console errors?
   - Memory usage stable?
   - Still responsive?

#### Check DevTools:
- Console: No repeated error messages
- Memory: No continuous growth
- Network: Websocket still connected
- Performance: Page still responsive

---

### **Scenario 7: Rapid Status Changes**

Test system handles quick successive updates.

#### Test:
1. Open customer order status
2. In chef dashboard, rapidly change status:
   - Received → Preparing (wait 1 sec)
   - Preparing → Ready (wait 1 sec)
   - Ready → Served
3. Customer view should handle all updates
4. No errors or missed updates
5. UI should not "flash" or glitch

---

## 🐛 Common Issues & Fixes

### Issue 1: Updates not propagating
**Symptom:** Status changes in chef dashboard don't appear in customer view  
**Check:**
```sql
-- Verify Realtime enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'orders';
```
**Fix:** Run `database/03_enable_realtime.sql`

### Issue 2: "Multiple subscriptions" warning
**Symptom:** Console shows duplicate subscription warnings  
**Cause:** Component not cleaning up properly  
**Fix:** Check `useEffect` cleanup in OrderStatusPage.jsx (lines 106-115)

### Issue 3: Updates delayed > 10 seconds
**Symptom:** Status changes take too long to appear  
**Check:**
- Is Realtime working? Look for "Realtime subscription failed" in console
- Network speed? Check DevTools → Network tab
- Polling working? Should update every 10 seconds minimum

### Issue 4: Memory leak
**Symptom:** Browser slows down over time  
**Check:** DevTools → Memory tab  
**Common Causes:**
- Subscriptions not unsubscribed
- Polling intervals not cleared
- Event listeners not removed

### Issue 5: "CHANNEL_ERROR" in console
**Symptom:** `console.error('Channel error')`  
**Causes:**
- RLS policies blocking subscription
- Invalid filter in subscription
- Supabase project issues
**Fix:** Check RLS policies allow SELECT on orders table

---

## ✅ Success Criteria

### Minimum Requirements (Must Pass):
- [ ] Real-time updates work (< 5 seconds)
- [ ] Chef sees new orders instantly
- [ ] Customer sees status changes
- [ ] Subscriptions clean up properly
- [ ] No console errors

### Production Ready (Should Pass):
- [ ] Updates propagate in < 3 seconds
- [ ] Fallback polling works
- [ ] Multiple users work simultaneously
- [ ] No memory leaks after 30 min
- [ ] Handles rapid status changes
- [ ] Works on slow connections (with polling)

### Ideal (Nice to Have):
- [ ] Updates in < 1 second
- [ ] Sound notifications work
- [ ] Browser notifications work
- [ ] Reconnects after network interruption
- [ ] Graceful degradation

---

## 📊 Test Report Template

```markdown
## Real-Time Features Test Results

**Date:** November 15, 2025  
**Tester:** [Your Name]  
**Browser:** [Chrome/Safari/Firefox]

### Scenario Results:

1. **Basic Real-Time Update:**
   - [ ] PASS / [ ] FAIL
   - Update speed: ___ seconds
   - Notes:

2. **Chef Dashboard Real-Time:**
   - [ ] PASS / [ ] FAIL
   - New order detection: [ ] YES / [ ] NO
   - Notes:

3. **Subscription Cleanup:**
   - [ ] PASS / [ ] FAIL
   - Memory leaks detected: [ ] YES / [ ] NO
   - Notes:

4. **Fallback Polling:**
   - [ ] PASS / [ ] FAIL
   - Polling works: [ ] YES / [ ] NO
   - Notes:

5. **Multiple Concurrent Users:**
   - [ ] PASS / [ ] FAIL
   - Isolation verified: [ ] YES / [ ] NO
   - Notes:

6. **Long Session:**
   - [ ] PASS / [ ] FAIL
   - Duration tested: ___ minutes
   - Notes:

7. **Rapid Status Changes:**
   - [ ] PASS / [ ] FAIL
   - All updates received: [ ] YES / [ ] NO
   - Notes:

### Performance Metrics:
- Average update time: ___ seconds
- Slowest update: ___ seconds
- Fastest update: ___ seconds
- Memory usage after 30 min: ___ MB

### Console Errors:
```
[List any errors]
```

### Issues Found:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 
```

---

## 🎬 Quick Test (10 Minutes)

**Fastest way to verify real-time system:**

1. **Setup (2 min):**
   - Open 2 browser windows side-by-side
   - Window 1: Place order, go to order status page
   - Window 2: Login as chef, go to chef dashboard

2. **Test (5 min):**
   - Chef: Change order status
   - Customer: Watch for update (should be < 3 sec)
   - Repeat 2-3 times with different statuses

3. **Verify (3 min):**
   - Check console for errors
   - Verify toast notifications appeared
   - Navigate away and back (test cleanup)

4. **If all pass:** Real-time works! ✅

---

## 📞 Need Help?

**Quick Troubleshooting:**
1. Check Supabase Realtime is enabled (SQL query above)
2. Look for subscription errors in console
3. Verify RLS policies allow SELECT on orders
4. Check network tab for websocket connection
5. Try with fallback polling disabled

**Files to Review:**
- `src/pages/customer/OrderStatusPage.jsx` - Customer real-time
- `src/pages/chef/ChefDashboard.jsx` - Chef real-time
- `src/shared/utils/api/supabaseClient.js` - Subscription logic
- `database/03_enable_realtime.sql` - Realtime setup

---

## 🚀 Next Steps

After completing Task 11:
1. Document findings (update speed, any issues)
2. Mark Task 11 complete
3. Move to Task 12: Chef Dashboard Testing (full feature test)

---

**Ready to test? This is the most important UX feature! Start with the Quick Test above! ⚡**
