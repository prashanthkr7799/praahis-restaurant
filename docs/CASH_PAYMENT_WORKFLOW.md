# 💵 Cash Payment Workflow - Complete Guide

## Overview

This document describes the complete cash payment workflow for Praahis Restaurant POS system. When customers choose to pay with cash, the Manager can manually mark the order as paid, which triggers real-time updates across all devices.

---

## 🎯 Feature Requirements

### Manager Dashboard
- Show **"CASH PAID"** button ONLY when:
  - `payment_method = 'cash'`
  - `payment_status = 'pending'`
- Button appears on hover next to order price in Recent Orders list
- Clicking button marks order as paid and updates status

### Customer Experience
- When manager clicks "CASH PAID", customer devices instantly:
  - Receive real-time payment status update
  - Redirect to Order Status page
  - See "Payment successful" message
  - Cannot return to cart or add new items
  - Progress bar shows order tracking

### Database Updates
- Create payment record with `payment_method = 'cash'`
- Update `orders.payment_status = 'paid'`
- If `order_status = 'pending'`, change to `'received'`
- Cascade status to all items using existing SQL function
- Trigger Supabase real-time broadcast

---

## 🔧 Technical Implementation

### 1. Manager Dashboard - Button Condition

**File:** `src/pages/manager/ManagerDashboard.jsx`

**Query Enhancement:**
```javascript
// Added payment_method to SELECT query
const { data: recent, error: recentError } = await supabase
  .from('orders')
  .select(`
    id,
    order_number,
    order_status,
    payment_status,
    payment_method,  // ← ADDED
    total,
    created_at,
    table_id,
    feedback_submitted,
    tables (table_number)
  `)
  .eq('restaurant_id', restaurantId)
  .order('created_at', { ascending: false })
  .limit(6);
```

**Button Rendering:**
```jsx
{/* Cash Payment Confirmation - Only for cash orders that are unpaid */}
{order.payment_method === 'cash' && order.payment_status === 'pending' && (
  <button
    onClick={(e) => handleMarkCashPaid(e, order)}
    className="glass-button px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30 transition-all md:opacity-0 md:group-hover:opacity-100"
  >
    Cash Paid
  </button>
)}
```

**What Changed:**
- **Before:** Button showed for ALL unpaid orders (`payment_status !== 'paid'`)
- **After:** Button shows ONLY for cash orders that are pending (`payment_method === 'cash' AND payment_status === 'pending'`)

---

### 2. Cash Payment Handler Function

**File:** `src/pages/manager/ManagerDashboard.jsx`

```javascript
const handleMarkCashPaid = async (e, order) => {
  e.stopPropagation();
  try {
    // 1. Create a payment record for cash
    await createPayment({
      order_id: order.id,
      restaurant_id: restaurantId,
      amount: order.total,
      currency: 'INR',
      status: 'captured',
      payment_method: 'cash',
      payment_details: {
        completed_at: new Date().toISOString(),
      },
    });

    // 2. Update order payment status to paid
    await updatePaymentStatus(order.id, 'paid');

    // 3. If order is still in 'pending' status, move it to 'received' and cascade to items
    if (order.order_status === 'pending') {
      await updateOrderStatusCascade(order.id, 'received');
    }

    toast.success(`Order #${order.order_number} marked as cash paid`);
    loadDashboardData();
  } catch (err) {
    console.error('Error marking cash payment:', err);
    toast.error('Failed to confirm cash payment');
  }
};
```

**What It Does:**

1. **Creates Payment Record:**
   - Inserts into `payments` table
   - `payment_method = 'cash'`
   - `status = 'captured'` (completed)
   - Stores completion timestamp

2. **Updates Order Payment Status:**
   - Sets `orders.payment_status = 'paid'`
   - Triggers Supabase real-time UPDATE event
   - All subscribed devices receive notification

3. **Cascades Order Status (if needed):**
   - If order is still `'pending'`, moves to `'received'`
   - Uses existing `update_order_status_cascade()` SQL function
   - Updates all `items[].item_status` to match
   - Sets `started_at` timestamp on items

4. **UI Feedback:**
   - Shows success toast to manager
   - Refreshes dashboard data
   - Button disappears (no longer pending)

---

### 3. Customer Real-Time Detection

**File:** `src/pages/customer/TablePage.jsx`

**Existing Implementation (No changes needed):**

```javascript
// Real-time subscription already in place
supabase
  .channel(`order-updates-${sessionId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `session_id=eq.${sessionId}`
    },
    (payload) => {
      console.log('💰 Order UPDATE received:', payload);
      
      // Check if payment_status changed to 'paid'
      if (payload.new.payment_status === 'paid' && payload.old.payment_status !== 'paid') {
        console.log('🎉 PAYMENT DETECTED! Order is now paid:', payload.new.id);
        setOrderPaid(true);
        setPaidOrderId(payload.new.id);
        
        // Show toast notification
        toast.success('🎉 Payment completed! Redirecting to order status...');
        
        // Redirect all devices to order status page
        setTimeout(() => {
          navigate(`/order-status/${payload.new.id}`, { replace: true });
        }, 1500);
      }
    }
  )
  .subscribe();
```

**Payment Guards (Already Implemented):**

```javascript
const handleAddToCart = async (menuItem, quantity) => {
  // Block if order is already paid
  if (orderPaid) {
    toast.error('Order is already paid. You cannot add more items.');
    return;
  }
  // ... rest of function
};

const handleUpdateQuantity = async (itemId, change) => {
  if (orderPaid) {
    toast.error('Order is already paid. You cannot modify items.');
    return;
  }
  // ... rest of function
};

const handleRemoveItem = async (itemId) => {
  if (orderPaid) {
    toast.error('Order is already paid. You cannot remove items.');
    return;
  }
  // ... rest of function
};

const handleProceedToPayment = () => {
  if (orderPaid) {
    toast.error('Order is already paid.');
    return;
  }
  // ... rest of function
};
```

---

## 📊 Complete Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                  CASH PAYMENT WORKFLOW                              │
└────────────────────────────────────────────────────────────────────┘

Customer                Manager                Database              All Devices
   │                       │                       │                      │
   │  1. Choose "Pay      │                       │                      │
   │     with Cash"       │                       │                      │
   ├──────────────────────>                       │                      │
   │                       │                       │                      │
   │  2. Order created    │                       │                      │
   │     payment_method   │                       │                      │
   │     = 'cash'         │                       │                      │
   │                      │                       │                      │
   │                      │  3. Manager Dashboard │                      │
   │                      │     Shows:            │                      │
   │                      │     "CASH PAID"       │                      │
   │                      │     button            │                      │
   │                      │                       │                      │
   │                      │  4. Click "CASH PAID" │                      │
   │                      ├───────────────────────>                      │
   │                      │  handleMarkCashPaid() │                      │
   │                      │                       │                      │
   │                      │                       │  5. Create Payment   │
   │                      │                       │     Record           │
   │                      │                       │     payment_method   │
   │                      │                       │     = 'cash'         │
   │                      │                       │     status =         │
   │                      │                       │     'captured'       │
   │                      │                       │                      │
   │                      │                       │  6. UPDATE orders    │
   │                      │                       │     SET payment_     │
   │                      │                       │     status = 'paid'  │
   │                      │                       │                      │
   │                      │                       │  7. IF order_status  │
   │                      │                       │     = 'pending':     │
   │                      │                       │     call cascade()   │
   │                      │                       │     → 'received'     │
   │                      │                       │     → update items[] │
   │                      │                       │                      │
   │                      │                       │  8. Real-time        │
   │                      │                       │     UPDATE event     │
   │                      │                       ├──────────────────────>
   │                      │                       │     Broadcast        │
   │                      │                       │                      │
   │  9. Subscription     │                       │                      │
   │     Receives:        │                       │                      │
   │     payment_status   │                       │                      │
   │     = 'paid'         │                       │                      │
   <──────────────────────┼───────────────────────┼──────────────────────┤
   │                      │                       │                      │
   │  10. setOrderPaid    │                       │                      │
   │      (true)          │                       │                      │
   │                      │                       │                      │
   │  11. Toast:          │                       │                      │
   │      "Payment        │                       │                      │
   │      completed!"     │                       │                      │
   │                      │                       │                      │
   │  12. Redirect to     │                       │                      │
   │      Order Status    │                       │                      │
   │      page            │                       │                      │
   │                      │                       │                      │
   │  13. Cart blocked    │                       │                      │
   │      (payment guards)│                       │                      │
   └──────────────────────┴───────────────────────┴──────────────────────┘
```

---

## 🧪 Testing Instructions

### Test 1: Cash Payment Button Visibility

**Setup:**
1. Create 3 orders:
   - Order A: `payment_method = 'cash'`, `payment_status = 'pending'`
   - Order B: `payment_method = 'online'`, `payment_status = 'pending'`
   - Order C: `payment_method = 'cash'`, `payment_status = 'paid'`

**Expected Result:**
- ✅ Order A: "CASH PAID" button visible on hover
- ❌ Order B: No button (online payment)
- ❌ Order C: No button (already paid)

**SQL Query:**
```sql
-- Verify order payment methods
SELECT 
  order_number,
  payment_method,
  payment_status,
  CASE 
    WHEN payment_method = 'cash' AND payment_status = 'pending' 
    THEN 'Should show CASH PAID button'
    ELSE 'No button'
  END as button_visibility
FROM orders
WHERE restaurant_id = '[YOUR_RESTAURANT_ID]'
ORDER BY created_at DESC
LIMIT 10;
```

---

### Test 2: Manager Clicks "CASH PAID"

**Setup:**
1. Create cash order (Order #123)
2. Open Manager Dashboard
3. Open Customer device on same table

**Test Steps:**

1. **Manager:** Hover over Order #123 in Recent Orders
2. **Expected:** "CASH PAID" button appears (green emerald color)
3. **Manager:** Click "CASH PAID" button
4. **Expected Manager:**
   - Toast: "Order #123 marked as cash paid"
   - Button disappears (no longer pending)
   - Order status updates if needed

5. **Expected Customer (Device 1):**
   - Toast: "🎉 Payment completed! Redirecting..."
   - Automatic redirect to Order Status page after 1.5 seconds
   - See "Payment successful. Tracking your order below."

6. **Expected Customer (Device 2):**
   - Same behavior as Device 1
   - Both devices redirect together

**Database Verification:**
```sql
-- Check payment record created
SELECT 
  o.order_number,
  o.payment_status,
  o.order_status,
  p.payment_method,
  p.status,
  p.payment_details
FROM orders o
LEFT JOIN payments p ON p.order_id = o.id
WHERE o.order_number = '123';
```

**Expected Database State:**
- `orders.payment_status` = `'paid'`
- `orders.order_status` = `'received'` (if was 'pending')
- `payments` table has new row:
  - `payment_method` = `'cash'`
  - `status` = `'captured'`
  - `payment_details` has `completed_at` timestamp

---

### Test 3: Order Status Cascade

**Setup:**
1. Create cash order with 3 items (Paneer Tikka, Naan, Raita)
2. Order status = 'pending'
3. All items have `item_status = 'pending'`

**Test Steps:**

1. **Manager:** Click "CASH PAID" on order
2. **Database Check:**
   ```sql
   SELECT 
     order_number,
     order_status,
     items
   FROM orders
   WHERE order_number = '[ORDER_NUMBER]';
   ```

**Expected:**
- `order_status` = `'received'`
- ALL items have `item_status` = `'received'`
- All items have `started_at` timestamp set

**Chef Dashboard:**
- All 3 items appear in "Received" section
- Items can be started by chef

---

### Test 4: Customer Cart Blocking

**Setup:**
1. Customer has items in cart
2. Open Customer page on Device A
3. Open Manager Dashboard

**Test Steps:**

1. **Device A:** View cart with 2 items
2. **Manager:** Click "CASH PAID"
3. **Device A:** Should redirect to Order Status
4. **Device A:** Try to navigate back to `/table/[tableId]`
5. **Expected:** Redirect to Order Status again (existing paid order detected)
6. **Try to open cart:** Should not be possible
7. **Try to add items:** Payment guards block operations

**Console Logs (Device A):**
```
💰 Order UPDATE received: { new: { payment_status: 'paid' }, old: { payment_status: 'pending' } }
🎉 PAYMENT DETECTED! Order is now paid: [ORDER_ID]
```

---

### Test 5: Multi-Device Real-Time Sync

**Setup:**
1. Table 5 has 3 devices:
   - Device A: Customer phone (iPhone)
   - Device B: Customer tablet (iPad)
   - Device C: Customer laptop
2. All devices on cart page
3. Manager Dashboard open

**Test Steps:**

1. **All Devices:** Show cart with items
2. **Manager:** Click "CASH PAID" for Table 5 order
3. **All 3 Devices (within 2 seconds):**
   - ✅ Receive real-time payment update
   - ✅ Show toast: "Payment completed!"
   - ✅ Redirect to Order Status page
   - ✅ Cannot return to cart
   - ✅ Cannot add new items

**Expected Timing:**
- Manager click → Database update: < 500ms
- Database update → Real-time broadcast: < 500ms
- Broadcast → All devices redirect: 1.5 seconds
- **Total time:** < 2.5 seconds from click to all redirects

---

### Test 6: Payment Method Filtering

**Setup:**
1. Create 5 orders:
   - Order 1: `payment_method = 'cash'`, `payment_status = 'pending'`
   - Order 2: `payment_method = 'razorpay'`, `payment_status = 'pending'`
   - Order 3: `payment_method = 'cash'`, `payment_status = 'paid'`
   - Order 4: `payment_method = 'upi'`, `payment_status = 'pending'`
   - Order 5: `payment_method = 'cash'`, `payment_status = 'failed'`

**Expected Button Visibility:**
| Order | Payment Method | Payment Status | CASH PAID Button? |
|-------|---------------|----------------|-------------------|
| 1     | cash          | pending        | ✅ YES            |
| 2     | razorpay      | pending        | ❌ NO             |
| 3     | cash          | paid           | ❌ NO             |
| 4     | upi           | pending        | ❌ NO             |
| 5     | cash          | failed         | ❌ NO             |

**Only Order 1 should show the button.**

---

## 🔄 Integration with Existing Features

### Cart Sync (Unchanged)
- Real-time cart sync across devices still works
- Shared cart updates continue as before
- Payment guards prevent cart operations after payment

### Order Status Tracking (Enhanced)
- Cash paid orders now automatically move to 'received'
- Items cascade to 'received' status
- Chef can immediately see new orders
- Customer sees progress bar start

### Manager Dashboard (Enhanced)
- "CASH PAID" button only for cash + pending
- "UPDATE" button works for status transitions
- Recent Orders show both buttons appropriately
- Feedback badges still appear

### Real-Time Subscriptions (Unchanged)
- All existing subscriptions work
- Chef Dashboard updates
- Waiter Dashboard updates
- Customer Order Status updates

---

## ⚠️ Important Notes

### SQL Changes
- ✅ **No new SQL files created**
- ✅ Uses existing `update_order_status_cascade()` function
- ✅ Uses existing `payments` table
- ✅ Uses existing `orders` table columns

### API Functions Used
```javascript
// From src/shared/utils/api/supabaseClient.js
createPayment()              // Create cash payment record
updatePaymentStatus()        // Update orders.payment_status
updateOrderStatusCascade()   // Update order + all items
```

### Real-Time Channels
- Uses existing order subscription: `order-updates-${sessionId}`
- Listens for `postgres_changes` on `orders` table
- Detects `payment_status` change from 'pending' → 'paid'

### State Management
- `orderPaid` state prevents cart operations
- `paidOrderId` used for redirect
- Guards in place for: add, update, remove, checkout

---

## ✅ Success Criteria

Your cash payment workflow is working correctly if:

- ✅ **"CASH PAID" button** shows ONLY for cash + pending orders
- ✅ **Manager clicks button** → Payment record created
- ✅ **Order payment_status** → 'paid' in database
- ✅ **Order status cascade** → 'received' if was 'pending'
- ✅ **All items update** → Match order status
- ✅ **Real-time broadcast** → All devices notified within 2 seconds
- ✅ **Customer redirect** → Order Status page automatically
- ✅ **Cart operations blocked** → Payment guards prevent changes
- ✅ **Toast notifications** → Manager and customers see feedback
- ✅ **Button disappears** → No longer shows after payment
- ✅ **Chef Dashboard** → Order appears in received section
- ✅ **Waiter Dashboard** → Order trackable

---

## 🚀 Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `src/pages/manager/ManagerDashboard.jsx` | Added `payment_method` to query | Enable button condition check |
| `src/pages/manager/ManagerDashboard.jsx` | Updated button condition | Show only for cash + pending |
| `src/pages/manager/ManagerDashboard.jsx` | Enhanced `handleMarkCashPaid()` | Cascade status if needed |

**Total Files Modified:** 1  
**New Files Created:** 0  
**SQL Files Modified:** 0  

**Customer-side:** No changes needed (already working)

---

## 📊 Database Schema (Reference)

### Orders Table
```sql
orders {
  id UUID PRIMARY KEY
  order_number TEXT
  restaurant_id UUID
  table_id UUID
  session_id UUID
  payment_status TEXT  -- 'pending', 'paid', 'failed'
  payment_method TEXT  -- 'cash', 'razorpay', 'upi'
  order_status TEXT    -- 'pending', 'received', 'preparing', 'ready', 'served', 'completed'
  items JSONB          -- Array of items with item_status
  total DECIMAL
  created_at TIMESTAMP
  updated_at TIMESTAMP
}
```

### Payments Table
```sql
payments {
  id UUID PRIMARY KEY
  order_id UUID REFERENCES orders(id)
  restaurant_id UUID
  amount DECIMAL
  currency TEXT
  status TEXT           -- 'captured', 'pending', 'failed'
  payment_method TEXT   -- 'cash', 'razorpay', 'upi'
  payment_details JSONB -- { completed_at: timestamp }
  created_at TIMESTAMP
}
```

---

## 🎯 Summary

The cash payment workflow allows managers to manually confirm payment for orders where customers choose to pay with cash. When the manager clicks "CASH PAID":

1. **Payment record created** with method = 'cash'
2. **Order marked as paid** in database
3. **Status cascaded** to 'received' (if needed)
4. **Real-time update** broadcasts to all devices
5. **Customers redirected** to Order Status page
6. **Cart operations blocked** by payment guards
7. **Order tracking begins** across all dashboards

**All without creating new SQL files or breaking existing functionality.**

---

**Status:** ✅ **COMPLETE & READY FOR TESTING**  
**Date:** November 20, 2025  
**Implementation:** Cash payment workflow fully integrated
