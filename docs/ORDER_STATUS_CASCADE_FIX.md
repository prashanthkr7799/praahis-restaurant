# 🎯 Order Status Cascade - FIXED!

## ✅ Problems Solved

### Issue 1: Inconsistent Order/Item Status ❌ → ✅
**Before:**
- Manager clicked "Update" → Only `orders.order_status` changed
- All `items[].item_status` stayed at old value
- Customer saw "Waiting to start" forever
- Chef dashboard items didn't update
- Item-level progress stuck

**After:**
- Manager clicks "Update" → BOTH `orders.order_status` AND all `items[].item_status` update together
- Customer sees accurate item progress
- Chef dashboard reflects correct item states
- All real-time dashboards stay in sync

---

### Issue 2: Manager Actions Don't Cascade ❌ → ✅
**Before:**
- "Update" button only updated order table
- "Serve" button only updated order table
- "Complete" button only updated order table
- Items never matched order status

**After:**
- ALL Manager actions cascade to items
- One atomic database operation
- Timestamps set automatically (`started_at`, `ready_at`, `served_at`)
- Real-time events trigger for all dashboards

---

### Issue 3: Missing Feedback Completion Label ❌ → ✅
**Before:**
- Customer submitted feedback
- Manager dashboard showed order in Recent Orders
- No visual indicator that feedback was submitted
- No "Completed" label

**After:**
- **"Completed ✓"** badge appears next to price
- Green emerald color
- Only shows when `feedback_submitted = true`
- Clear visual confirmation order is fully complete

---

## 🔧 Technical Implementation

### 1. SQL Cascade Function

**File:** `phase3_migrations/01_core_schema.sql`

```sql
CREATE OR REPLACE FUNCTION public.update_order_status_cascade(
  p_order_id UUID,
  p_new_status TEXT
)
RETURNS TABLE (
  id UUID,
  order_status TEXT,
  items JSONB,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_items JSONB;
  v_item JSONB;
  v_updated_items JSONB := '[]'::JSONB;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Validate status
  IF p_new_status NOT IN ('pending_payment', 'received', 'preparing', 'ready', 'served', 'cancelled', 'completed') THEN
    RAISE EXCEPTION 'Invalid order status: %', p_new_status;
  END IF;

  -- Fetch current items
  SELECT o.items INTO v_items
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_items IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Update each item's status to match order status
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    -- Set item_status to match order status
    v_item := jsonb_set(v_item, '{item_status}', to_jsonb(p_new_status));
    
    -- Set timestamps based on status
    IF p_new_status = 'preparing' AND (v_item->>'started_at' IS NULL) THEN
      v_item := jsonb_set(v_item, '{started_at}', to_jsonb(v_now::TEXT));
    END IF;
    
    IF p_new_status = 'ready' AND (v_item->>'ready_at' IS NULL) THEN
      v_item := jsonb_set(v_item, '{ready_at}', to_jsonb(v_now::TEXT));
    END IF;
    
    IF p_new_status = 'served' AND (v_item->>'served_at' IS NULL) THEN
      v_item := jsonb_set(v_item, '{served_at}', to_jsonb(v_now::TEXT));
    END IF;
    
    v_updated_items := v_updated_items || jsonb_build_array(v_item);
  END LOOP;

  -- Update order with new status and updated items
  RETURN QUERY
  UPDATE public.orders o
  SET 
    order_status = p_new_status,
    items = v_updated_items,
    updated_at = v_now
  WHERE o.id = p_order_id
  RETURNING o.id, o.order_status, o.items, o.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**What It Does:**
1. Takes order ID and new status
2. Fetches all items from `orders.items` JSONB array
3. Updates each item's `item_status` to match order status
4. Sets timestamps (`started_at`, `ready_at`, `served_at`) based on status
5. Updates order with new status and updated items
6. Returns updated order data
7. All in ONE atomic transaction

---

### 2. JavaScript Wrapper

**File:** `src/shared/utils/api/supabaseClient.js`

```javascript
// Update order status with cascade to all items
// This ensures order_status and all item_status fields stay in sync
export const updateOrderStatusCascade = async (orderId, status) => {
  const { data, error } = await supabase
    .rpc('update_order_status_cascade', {
      p_order_id: orderId,
      p_new_status: status
    });

  if (error) {
    console.error('Error in updateOrderStatusCascade:', error);
    throw error;
  }

  // RPC returns array, get first result
  const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!result) {
    throw new Error('No data returned from cascade update');
  }

  return result;
};
```

**Usage:**
```javascript
// Instead of:
await supabase.from('orders').update({ order_status: 'preparing' }).eq('id', orderId);

// Use:
await updateOrderStatusCascade(orderId, 'preparing');
// ^ Updates order AND all items in one call
```

---

### 3. Manager Dashboard Integration

**File:** `src/pages/manager/ManagerDashboard.jsx`

```javascript
const handleQuickUpdate = async (e, order) => {
  e.stopPropagation();

  let nextStatus = '';
  switch (order.order_status) {
    case 'pending':
    case 'received':
      nextStatus = 'preparing';
      break;
    case 'preparing':
      nextStatus = 'ready';
      break;
    case 'ready':
      nextStatus = 'served';
      break;
    case 'served':
      nextStatus = 'completed';
      break;
    default:
      return;
  }

  try {
    // Use cascade function to update both order and all items
    await updateOrderStatusCascade(order.id, nextStatus);

    toast.success(`Order #${order.order_number} and all items updated to ${nextStatus}`);
    loadDashboardData(); // Refresh data
  } catch (error) {
    console.error('Error updating order:', error);
    toast.error('Failed to update order status');
  }
};
```

**Feedback Completion Badge:**
```jsx
<div className="text-right">
  <span className="text-sm font-bold text-white">
    {formatCurrency(order.total)}
  </span>
  {order.feedback_submitted && (
    <span className="text-[10px] text-emerald-400 font-semibold uppercase">
      Completed ✓
    </span>
  )}
</div>
```

---

## 📊 Complete Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│              ORDER STATUS CASCADE FLOW                        │
└──────────────────────────────────────────────────────────────┘

Manager Dashboard                Database                 All Dashboards
     │                              │                            │
     │  1. Click "Update"           │                            │
     │  (Order: received)           │                            │
     ├──────────────────────────────>│                            │
     │  updateOrderStatusCascade()  │                            │
     │  orderId, 'preparing'        │                            │
     │                              │                            │
     │                              │  2. SQL Function Executes  │
     │                              │  ┌───────────────────────┐ │
     │                              │  │ Update order_status   │ │
     │                              │  │ = 'preparing'         │ │
     │                              │  ├───────────────────────┤ │
     │                              │  │ Loop through items[]  │ │
     │                              │  │ Set item_status =     │ │
     │                              │  │ 'preparing'           │ │
     │                              │  ├───────────────────────┤ │
     │                              │  │ Set started_at =      │ │
     │                              │  │ NOW() on all items    │ │
     │                              │  └───────────────────────┘ │
     │                              │                            │
     │                              │  3. Database UPDATE Event  │
     │                              ├────────────────────────────>│
     │                              │     Realtime Broadcast      │
     │                              │                            │
     │                              │                            │  4. All Dashboards Update
     │                              │                            ├─> Chef: Items now "Preparing"
     │                              │                            ├─> Customer: Progress bar advances
     │                              │                            ├─> Waiter: Order moves sections
     │                              │                            └─> Manager: Order status updated
     │                              │                            │
     │  5. Success Response         │                            │
     │<──────────────────────────────┤                            │
     │  { id, order_status,         │                            │
     │    items[], updated_at }     │                            │
     │                              │                            │
     │  6. Toast: "Order and all    │                            │
     │     items updated"           │                            │
     └──────────────────────────────┴────────────────────────────┘
```

---

## 🧪 Testing Instructions

### Test 1: Manager Status Update Cascades

**Setup:**
1. Create an order with 3 items (Butter Chicken, Naan, Biryani)
2. Order payment_status = 'paid'
3. Order order_status = 'received'
4. Open Manager Dashboard

**Test Steps:**

1. **Manager:** Click "Update" button on the order
2. **Expected:** Order status changes to "preparing"
3. **Verify in database:**
   ```sql
   SELECT 
     order_number,
     order_status,
     items
   FROM orders
   WHERE id = '[ORDER_ID]';
   ```
4. **Expected Database State:**
   - `order_status` = `'preparing'`
   - ALL items have `item_status` = `'preparing'`
   - ALL items have `started_at` timestamp

5. **Chef Dashboard:** Should show all 3 items with "Preparing" badge
6. **Customer Order Status:** Progress bar should show "Preparing" step
7. **Waiter Dashboard:** Order should move to "Preparing" section

---

### Test 2: Item-Level Progress Shows Correctly

**Setup:**
1. Use order from Test 1 (now in "preparing")
2. Open Customer Order Status page

**Test Steps:**

1. **Customer Page:** Check "Items grouped by status" section
2. **Expected:** All 3 items listed under "Preparing"
3. **Manager:** Click "Update" again (preparing → ready)
4. **Customer Page:** Should automatically update (no refresh)
5. **Expected:** All 3 items move to "Ready" section
6. **Manager:** Click "Serve"
7. **Customer Page:** All 3 items move to "Served" section
8. **Expected:** Auto-redirect to post-meal page after 2 seconds

---

### Test 3: Feedback Completion Badge

**Setup:**
1. Customer completes order and submits feedback

**Test Steps:**

1. **Manager Dashboard:** Navigate to Recent Orders section
2. **Find the order** that has feedback
3. **Expected:** See two indicators:
   - "Feedback ✓" badge below table number (green, small)
   - "Completed ✓" text below price (emerald color)
4. **Verify both badges** appear only on orders with `feedback_submitted = true`

**SQL Verification:**
```sql
SELECT 
  order_number,
  total,
  feedback_submitted,
  feedback_submitted_at
FROM orders
WHERE feedback_submitted = true
ORDER BY created_at DESC
LIMIT 5;
```

---

### Test 4: Real-Time Propagation Across Dashboards

**Setup:**
1. Open 4 browser windows:
   - Window 1: Manager Dashboard
   - Window 2: Chef Dashboard
   - Window 3: Customer Order Status
   - Window 4: Waiter Dashboard

**Test Steps:**

1. **Window 1 (Manager):** Click "Update" on an order (received → preparing)
2. **Window 2 (Chef):** Should see items update to "Preparing" instantly
3. **Window 3 (Customer):** Progress bar should advance instantly
4. **Window 4 (Waiter):** Order should move to "Preparing" section instantly
5. **All Windows:** Should update within 1-2 seconds (no refresh needed)

---

## 📊 Database Verification Queries

### Check Order and Item Status Consistency

```sql
SELECT 
  order_number,
  order_status as overall_status,
  jsonb_array_length(items) as item_count,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(items) as item
    WHERE item->>'item_status' = order_status
  ) as items_matching_order_status,
  (
    SELECT jsonb_agg(item->'item_status')
    FROM jsonb_array_elements(items) as item
  ) as all_item_statuses
FROM orders
WHERE restaurant_id = '[YOUR_RESTAURANT_ID]'
  AND order_status IN ('preparing', 'ready', 'served')
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
- `item_count` should equal `items_matching_order_status`
- `all_item_statuses` should show all items have same status as order

---

### Check Timestamp Consistency

```sql
SELECT 
  order_number,
  order_status,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', item->>'name',
        'item_status', item->>'item_status',
        'started_at', item->>'started_at',
        'ready_at', item->>'ready_at',
        'served_at', item->>'served_at'
      )
    )
    FROM jsonb_array_elements(items) as item
  ) as items_with_timestamps
FROM orders
WHERE id = '[ORDER_ID]';
```

**Expected Result:**
- If `order_status` = `'preparing'` → All items have `started_at`
- If `order_status` = `'ready'` → All items have `started_at` AND `ready_at`
- If `order_status` = `'served'` → All items have all 3 timestamps

---

### Check Feedback Completion

```sql
SELECT 
  o.order_number,
  o.order_status,
  o.feedback_submitted,
  o.feedback_submitted_at,
  f.rating,
  f.comment,
  f.created_at as feedback_created
FROM orders o
LEFT JOIN feedbacks f ON f.order_id = o.id
WHERE o.feedback_submitted = true
ORDER BY o.created_at DESC
LIMIT 10;
```

---

## ⚠️ Important Notes

### What This Does NOT Change

✅ **Individual Item Updates Still Work**
- Chef can still update individual items
- `updateOrderItemStatus()` function unchanged
- Chef clicks "Start" on one item → that item updates
- Order status recalculated based on all items

✅ **Real-Time Subscriptions Unchanged**
- All existing real-time subscriptions work
- No changes to subscription logic
- Events still broadcast to all dashboards

✅ **Cart Sync Unchanged**
- Shared cart functionality unaffected
- Multi-device cart sync still works
- Payment status sync still works

### When to Use Cascade vs Individual Update

**Use `updateOrderStatusCascade()`:**
- Manager bulk updates ("Update All", "Serve All", "Complete All")
- When you want ALL items to match order status
- When transitioning order through lifecycle stages

**Use `updateOrderItemStatus()`:**
- Chef updates individual items ("Start Preparing", "Mark Ready")
- When items progress at different rates
- When you want granular control per item

---

## ✅ Success Criteria

Your system is working correctly if:

- ✅ **Manager clicks "Update"** → All items update to same status
- ✅ **Chef Dashboard** shows correct item statuses after manager update
- ✅ **Customer Order Status** shows accurate progress for all items
- ✅ **Waiter Dashboard** reflects correct order sections
- ✅ **All timestamps set** (started_at, ready_at, served_at)
- ✅ **"Completed ✓" badge** shows on orders with feedback
- ✅ **Real-time updates** propagate to all dashboards within 2 seconds
- ✅ **No duplicate status updates** or conflicts
- ✅ **Individual item updates** still work for chef

---

## 🚀 What's Fixed

| Before | After |
|--------|-------|
| ❌ Manager updates order only | ✅ Manager updates order + all items |
| ❌ Items stay "Waiting to start" | ✅ Items show correct progress |
| ❌ Chef doesn't see manager changes | ✅ Chef sees all updates instantly |
| ❌ Customer stuck on old status | ✅ Customer sees live progress |
| ❌ No feedback completion label | ✅ "Completed ✓" badge shows |
| ❌ Inconsistent timestamps | ✅ All timestamps set correctly |
| ❌ Manual status sync needed | ✅ Automatic cascade sync |

---

## 📝 Files Modified

**SQL (1 file):**
- `phase3_migrations/01_core_schema.sql` - Added `update_order_status_cascade()` function

**JavaScript (2 files):**
- `src/shared/utils/api/supabaseClient.js` - Added `updateOrderStatusCascade()` wrapper
- `src/pages/manager/ManagerDashboard.jsx` - Uses cascade function + completion badge

**No New Files Created** ✓  
**No Existing Schema Broken** ✓  
**Real-Time Functionality Preserved** ✓  

---

**Status:** ✅ **COMPLETE & READY FOR TESTING**  
**Date:** November 20, 2025  
**Commit:** `bcfdac6 feat: cascade order status to all items + feedback completion badge`
