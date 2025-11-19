# 🎯 Task 12: Chef Dashboard Testing Guide

**Status:** In Progress  
**Priority:** 🔴 HIGH (Kitchen Operations Critical)  
**Last Updated:** November 15, 2025  
**Prerequisites:** Tasks 9, 10, 11 completed

---

## 📋 Overview

Test the Chef Dashboard - the kitchen's command center for order management. This interface enables chefs to track incoming orders, update item-level cooking status, and coordinate kitchen operations.

### What We're Testing:
```
Chef Dashboard Features:
1. Real-time order display
2. Status filtering (Active/All/Ready)
3. Item-level status updates (Received → Preparing → Ready)
4. Order sorting and search
5. Payment status display
6. Restaurant isolation (chef sees only their restaurant)
7. New order notifications
8. UI responsiveness (compact mode for tablets)
```

---

## 🎯 Test Objectives

1. ✅ Verify orders display correctly
2. ✅ Test item-level status updates work
3. ✅ Validate filtering and search
4. ✅ Check real-time order synchronization
5. ✅ Verify restaurant data isolation
6. ✅ Test notification system (new orders)
7. ✅ Validate order cancellation rules
8. ✅ Check UI responsiveness (desktop/tablet)

---

## 🚀 Pre-Test Setup

### 1. Create Test Chef Account

**In Supabase SQL Editor:**
```sql
-- Check if chef exists
SELECT id, email, role FROM auth.users 
WHERE email = 'chef@test.com';

-- If not, create via Manager Dashboard:
-- Login as Manager → Staff Management → Add Staff → Role: Chef
```

### 2. Prepare Test Data

**Have at least 5 test orders in different states:**
```sql
-- Check current orders
SELECT 
  order_number,
  order_status,
  payment_status,
  table_number,
  total,
  created_at
FROM orders
WHERE restaurant_id = 'your-restaurant-id'
ORDER BY created_at DESC
LIMIT 10;
```

**If needed, place new orders:**
- Use customer flow (Task 9) to place 3-5 orders
- Keep them in different states (Received, Preparing, Ready)

---

## 📝 Testing Scenarios

### **Scenario 1: Basic Dashboard Display** ⭐ (CRITICAL)

#### Test Steps:
1. **Login as Chef:**
   - Navigate to `/chef/login`
   - Email: `chef@test.com`
   - Password: (your test password)
   - Should redirect to `/chef/dashboard`

2. **Verify Dashboard Layout:**
   - ✅ Header shows restaurant name
   - ✅ Logout button visible (top-right)
   - ✅ Stats cards display:
     * **Received** (blue badge) - Count of new orders
     * **Preparing** (yellow badge) - Count of cooking orders
     * **Ready** (green badge) - Count of ready orders
     * **Active** (gray badge) - Total orders not served
   - ✅ Filter buttons: Active Orders, All Orders, Ready for Service
   - ✅ Search bar for order/table number
   - ✅ Payment filter: All, Paid, Pending
   - ✅ Compact mode toggle

3. **Verify Order Cards Display:**
   Each order should show:
   - ✅ Order number (e.g., `#ORD-20251115-0042`)
   - ✅ Table number (e.g., `Table: 5`)
   - ✅ Created time (e.g., `12:30 PM`)
   - ✅ Item count (e.g., `5 items`)
   - ✅ Total amount (e.g., `₹1,062`)
   - ✅ Payment status badge (Paid/Pending)
   - ✅ Items list with individual status badges

4. **Verify Orders Grouped by Status:**
   - ✅ Section: **Received** (blue dot)
   - ✅ Section: **Preparing** (yellow dot)
   - ✅ Section: **Ready** (green dot)
   - ✅ Section: **Served** (gray dot) - only if filter is "All"

#### Expected Results:
- Dashboard loads in < 2 seconds
- All UI elements visible and properly styled
- Orders sorted newest first
- Stats cards show accurate counts
- No console errors

#### SQL Verification:
```sql
-- Compare dashboard counts with database
SELECT 
  order_status,
  COUNT(*) as count
FROM orders
WHERE restaurant_id = 'your-restaurant-id'
  AND order_status != 'pending_payment'
GROUP BY order_status
ORDER BY 
  CASE order_status
    WHEN 'received' THEN 1
    WHEN 'preparing' THEN 2
    WHEN 'ready' THEN 3
    WHEN 'served' THEN 4
  END;
```

---

### **Scenario 2: Item-Level Status Updates** ⭐⭐ (CRITICAL)

This is the **PRIMARY chef function** - updating cooking status for each item.

#### Test Steps:

**Part 1: Received → Preparing**
1. Find an order with status **Received**
2. Look at the items list
3. Each item should show:
   - Item name (e.g., "Butter Chicken")
   - Quantity (e.g., "x2")
   - Status badge: **RECEIVED** (blue)
   - Button: **"Start"** (blue button)

4. **Click "Start" on first item:**
   - Toast notification: "Item marked preparing"
   - Item status badge changes to **PREPARING** (yellow)
   - Button changes to **"Mark Ready"** (green button)
   - Order card moves to "Preparing" section (if it was the first item)

**Part 2: Preparing → Ready**
1. Find an item with status **PREPARING**
2. Should show:
   - Status badge: **PREPARING** (yellow)
   - Button: **"Mark Ready"** (green button)

3. **Click "Mark Ready":**
   - Toast notification: "Item marked ready"
   - Item status badge changes to **READY** (green)
   - Button disappears (chef cannot mark served - waiter does this)
   - Order card moves to "Ready" section (if all items ready)

**Part 3: Multiple Items in Same Order**
1. Find an order with 3+ items
2. Start preparing all items one by one
3. Mark 2 items ready (leave 1 preparing)
4. **Verify:**
   - Order stays in "Preparing" section (not all items ready)
   - Stats card "Ready" count doesn't increase yet
   - Items show mixed statuses correctly

5. Mark last item ready
6. **Verify:**
   - Order moves to "Ready" section
   - Stats card "Ready" count increases by 1
   - All items show green "READY" badges

#### Expected Results:
- ✅ Status updates instant (< 1 second)
- ✅ UI updates without page refresh
- ✅ Toast notifications appear
- ✅ Order moves between sections correctly
- ✅ Stats cards update automatically
- ✅ If real-time working: Customer sees updates instantly

#### SQL Verification:
```sql
-- Check item statuses for specific order
SELECT 
  order_number,
  order_status,
  items
FROM orders
WHERE id = 'your-order-id';

-- Items field is JSONB array - each item has:
-- { "menu_item_id": "...", "item_status": "preparing", "started_at": "...", ... }
```

---

### **Scenario 3: Filtering and Search**

#### Test Filtering:

**1. Active Orders Filter (Default):**
```
Click: "Active Orders"
Expected: Shows orders with status ≠ 'served'
Should show: Received, Preparing, Ready
Should NOT show: Served orders
```

**2. All Orders Filter:**
```
Click: "All Orders"
Expected: Shows ALL orders (including served)
Should show: Received, Preparing, Ready, Served sections
```

**3. Ready for Service Filter:**
```
Click: "Ready for Service"
Expected: Shows only orders with status = 'ready'
Should show: Only "Ready" section
Should NOT show: Received, Preparing, Served
```

**4. Payment Status Filter:**
```
Test: All (default) → Shows all orders
Test: Paid → Shows only paid orders
Test: Pending → Shows only unpaid orders

Verify count changes when switching filters
```

#### Test Search:

**1. Search by Order Number:**
```
Type: "ORD-20251115-0042"
Expected: Shows only matching order
Clear search → All orders return
```

**2. Search by Table Number:**
```
Type: "5"
Expected: Shows all orders for Table 5
Partial match works (type "tab" finds tables)
```

**3. Search with No Results:**
```
Type: "NONEXISTENT"
Expected: Shows "No Orders Found" message
```

#### Test Compact Mode:

**1. Toggle Compact:**
```
Check "Compact" toggle
Expected: Order cards shrink, smaller text, less padding
Uncheck → Returns to normal size
```

#### Expected Results:
- Filters work instantly
- Search is case-insensitive
- Filters combine (e.g., Active + Paid + Search)
- No page refresh needed
- Count badges update correctly

---

### **Scenario 4: Real-Time Synchronization** ⭐ (CRITICAL)

Test that chef dashboard updates when orders change elsewhere.

#### Setup:
1. **Window 1:** Chef Dashboard (logged in as chef)
2. **Window 2:** Customer Order Status page (from Task 9)

Or:

1. **Device 1:** Chef Dashboard on tablet
2. **Device 2:** Place new order from customer device

#### Test Steps:

**1. New Order Detection:**
```
1. Window 1: Chef Dashboard open
2. Window 2: Customer places new order
3. Chef Dashboard: 
   - 🔔 Toast notification: "New order received: #ORD-XXX"
   - 🔊 Sound notification plays (if enabled)
   - New order appears in "Received" section
   - Stats card "Received" count increases
```

**2. Status Update Synchronization:**
```
1. Have 2 chef dashboard windows open
2. Window 1: Mark item as "Preparing"
3. Window 2: Should update automatically within 3 seconds
4. Verify: Item status changes in both windows
5. Verify: Order moves to correct section
```

**3. Customer View Synchronization:**
```
1. Window 1: Chef marks item "Ready"
2. Window 2: Customer order status page
3. Verify: Customer sees update within 3 seconds
4. Verify: Customer gets toast notification
```

#### Expected Results:
- Updates propagate in < 3 seconds (real-time)
- Falls back to polling if Realtime unavailable (< 10 sec)
- Sound notification plays on new order
- Multiple chef windows stay synchronized
- No memory leaks (check DevTools Memory)

---

### **Scenario 5: Restaurant Isolation** ⭐⭐ (SECURITY CRITICAL)

Verify chef only sees orders from their assigned restaurant.

#### Test Steps:

**1. Check Auth & Restaurant:**
```sql
-- Find chef's restaurant
SELECT u.email, u.role, u.restaurant_id, r.name
FROM users u
LEFT JOIN restaurants r ON u.restaurant_id = r.id
WHERE u.email = 'chef@test.com';
```

**2. Verify Orders Filtered:**
```sql
-- All orders chef should see
SELECT order_number, restaurant_id, order_status
FROM orders
WHERE restaurant_id = 'chef-restaurant-id'
  AND order_status != 'pending_payment'
ORDER BY created_at DESC;

-- Orders from OTHER restaurants (chef should NOT see these)
SELECT order_number, restaurant_id, order_status
FROM orders
WHERE restaurant_id != 'chef-restaurant-id'
LIMIT 5;
```

**3. In Dashboard:**
- Count orders displayed
- Verify all orders belong to chef's restaurant
- None from other restaurants visible

**4. Try Direct URL Access (Security Test):**
```
Create order ID from different restaurant
Try to access via API or direct manipulation
Should fail with permission error
```

#### Expected Results:
- Chef sees ONLY their restaurant's orders
- RLS policies block cross-restaurant access
- No data leakage in console/network tab
- API returns 403 for unauthorized access

---

### **Scenario 6: Order Cancellation Rules**

Test that chef can only cancel unpaid orders.

#### Test Cases:

**1. Cancel Unpaid Order (Should Succeed):**
```
1. Find order with payment_status = 'pending'
2. Look for "Cancel" button on order card
3. Click Cancel
4. Confirm in dialog (if any)
5. Verify: Order status changes to 'cancelled'
6. Verify: Order removed from active list or marked cancelled
```

**2. Try Cancel Paid Order (Should Fail):**
```
1. Find order with payment_status = 'paid'
2. Look for "Cancel" button
3. If visible, click it
4. Expected: Toast error: "Cannot cancel a paid order"
5. Order status remains unchanged
```

**3. Try Cancel Served Order (Should Fail):**
```
1. Find order with status = 'served'
2. Try to cancel
3. Expected: Toast error: "Order cannot be cancelled"
```

#### Expected Results:
- Only unpaid, non-served orders can be cancelled
- Toast error messages clear and user-friendly
- No database changes on failed cancellation attempts

---

### **Scenario 7: Manual Refresh**

Test the manual refresh button functionality.

#### Test Steps:
1. **Initial State:** Chef Dashboard displaying orders
2. **Make External Change:**
   - In another window/device, place new order OR
   - Use SQL to update order status:
     ```sql
     UPDATE orders 
     SET order_status = 'preparing'
     WHERE order_number = 'ORD-XXX';
     ```
3. **Click Refresh Button** (top-right, circular arrow icon)
4. **Verify:**
   - Button shows loading spinner
   - Toast: "Orders refreshed"
   - Orders re-fetch from database
   - New changes appear immediately
   - Loading completes in < 2 seconds

#### Expected Results:
- Manual refresh works on demand
- Useful if real-time temporarily fails
- Loading state clear to user
- No duplicate orders after refresh

---

### **Scenario 8: UI Responsiveness**

Test dashboard on different screen sizes.

#### Desktop (1920x1080):
```
✅ 2-column grid for order cards
✅ Stats cards in 4-column row
✅ All filters visible in single row
✅ Search bar full width
✅ No horizontal scroll
```

#### Tablet (768x1024):
```
✅ 1-column grid for order cards (iPad portrait)
✅ Stats cards in 2x2 grid
✅ Filters wrap to 2 rows if needed
✅ Compact mode ON by default
✅ Touch-friendly button sizes (44px min)
```

#### Large Desktop (2560x1440):
```
✅ 2-column grid maintained
✅ Order cards max-width respected
✅ Centered layout, not stretched
```

#### Test Touch Gestures (Tablet):
```
✅ Tap "Start" button works
✅ Tap "Mark Ready" button works
✅ Scroll smooth (no lag)
✅ Tap filter buttons responsive
✅ Search keyboard appears correctly
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Orders not appearing
**Symptom:** Dashboard empty but orders exist in database  
**Check:**
```sql
-- Are orders excluded by status?
SELECT order_status, COUNT(*) 
FROM orders 
WHERE restaurant_id = 'your-id'
GROUP BY order_status;

-- Is 'pending_payment' the only status?
-- These are excluded from chef view
```
**Fix:** Complete payment on orders (they'll show as 'received')

### Issue 2: Status update doesn't change UI
**Symptom:** Click "Start" but nothing happens  
**Check:**
- Console errors?
- Network tab: Does API call succeed?
- Is real-time subscription working?
**Fix:**
```javascript
// Check src/shared/utils/api/supabaseClient.js
// updateOrderItemStatus function should return updated order
```

### Issue 3: Wrong restaurant orders showing
**Symptom:** Chef sees orders from other restaurants  
**Cause:** RLS policy issue or auth token problem  
**Check:**
```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'orders';

-- Check chef's restaurant_id
SELECT restaurant_id FROM auth.users WHERE email = 'chef@test.com';
```
**Fix:** Run `database/11_rls_public_and_owner.sql`

### Issue 4: New order notification doesn't play sound
**Symptom:** Toast appears but no sound  
**Cause:** Browser autoplay policy (needs user gesture)  
**Fix:**
```javascript
// notificationService requires user interaction first
// Click anywhere on dashboard to "unlock" audio
// Or check browser console for Audio errors
```

### Issue 5: Polling instead of real-time
**Symptom:** Console shows "using polling only"  
**Check:** Is Supabase Realtime enabled?
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'orders';
```
**Fix:** Run `database/03_enable_realtime.sql`

---

## ✅ Success Criteria

### Minimum Requirements (Must Pass):
- [ ] Dashboard loads and displays orders
- [ ] Item-level status updates work (Received → Preparing → Ready)
- [ ] Filtering (Active/All/Ready) works
- [ ] Search by order/table number works
- [ ] Chef sees only their restaurant's orders
- [ ] No console errors

### Production Ready (Should Pass):
- [ ] Real-time updates work (< 3 seconds)
- [ ] New order notifications (toast + sound)
- [ ] Order cancellation rules enforced
- [ ] Manual refresh works
- [ ] Stats cards update automatically
- [ ] UI responsive on tablet/desktop
- [ ] Compact mode works
- [ ] Payment filtering works

### Ideal (Nice to Have):
- [ ] Sound notifications customizable
- [ ] Keyboard shortcuts for common actions
- [ ] Order print functionality
- [ ] Item preparation time estimates
- [ ] Rush order highlighting

---

## 📊 Test Report Template

```markdown
## Chef Dashboard Test Results

**Date:** November 15, 2025  
**Tester:** [Your Name]  
**Browser:** [Chrome/Safari/Firefox]  
**Device:** [Desktop/Tablet]

### Scenario Results:

1. **Basic Dashboard Display:**
   - [ ] PASS / [ ] FAIL
   - Load time: ___ seconds
   - All UI elements visible: [ ] YES / [ ] NO
   - Stats accurate: [ ] YES / [ ] NO
   - Notes:

2. **Item-Level Status Updates:**
   - [ ] PASS / [ ] FAIL
   - Received → Preparing: [ ] Works / [ ] Fails
   - Preparing → Ready: [ ] Works / [ ] Fails
   - UI updates without refresh: [ ] YES / [ ] NO
   - Notes:

3. **Filtering and Search:**
   - [ ] PASS / [ ] FAIL
   - Active filter: [ ] Works
   - All filter: [ ] Works
   - Ready filter: [ ] Works
   - Search: [ ] Works
   - Payment filter: [ ] Works
   - Notes:

4. **Real-Time Synchronization:**
   - [ ] PASS / [ ] FAIL
   - New order appears: [ ] YES / [ ] NO
   - Update speed: ___ seconds
   - Sound notification: [ ] Works / [ ] Fails
   - Notes:

5. **Restaurant Isolation:**
   - [ ] PASS / [ ] FAIL
   - Only correct restaurant orders: [ ] YES / [ ] NO
   - Cross-restaurant blocked: [ ] YES / [ ] NO
   - Notes:

6. **Order Cancellation:**
   - [ ] PASS / [ ] FAIL
   - Unpaid orders cancelled: [ ] YES / [ ] NO
   - Paid orders blocked: [ ] YES / [ ] NO
   - Notes:

7. **Manual Refresh:**
   - [ ] PASS / [ ] FAIL
   - Refresh works: [ ] YES / [ ] NO
   - Notes:

8. **UI Responsiveness:**
   - [ ] PASS / [ ] FAIL
   - Desktop layout: [ ] Good / [ ] Issues
   - Tablet layout: [ ] Good / [ ] Issues
   - Touch gestures: [ ] Work / [ ] Fail
   - Notes:

### Performance Metrics:
- Dashboard load time: ___ seconds
- Item status update speed: ___ seconds
- Search response time: ___ ms
- Real-time update delay: ___ seconds

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

**Fastest way to verify Chef Dashboard:**

1. **Setup (2 min):**
   - Login as chef → `/chef/dashboard`
   - Verify dashboard loads with orders

2. **Test Core Function (5 min):**
   - Find order with "Received" item
   - Click "Start" → Verify changes to "Preparing"
   - Click "Mark Ready" → Verify changes to "Ready"
   - Check stats cards update correctly
   - Test one filter (e.g., "Ready for Service")

3. **Test Real-Time (3 min):**
   - Open 2 windows: Chef + Customer
   - Chef marks item ready
   - Customer sees update within 3 seconds

4. **If all pass:** Core kitchen operations work! ✅

---

## 📞 Need Help?

**Quick Troubleshooting:**
1. Check console for errors
2. Verify real-time enabled (Task 11 setup)
3. Confirm chef has restaurant_id assigned
4. Test with different orders (different statuses)
5. Try manual refresh button

**Files to Review:**
- `src/pages/chef/ChefDashboard.jsx` - Main component
- `src/domains/ordering/components/OrderCard.jsx` - Order display
- `src/shared/utils/api/supabaseClient.js` - API functions
- `database/11_rls_public_and_owner.sql` - RLS policies

---

## 🚀 Next Steps

After completing Task 12:
1. Document findings (any bugs or UX issues)
2. Mark Task 12 complete
3. Move to Task 13: Waiter Dashboard Testing

---

**This is the heart of kitchen operations! Make sure item-level status updates work flawlessly! 👨‍🍳**
