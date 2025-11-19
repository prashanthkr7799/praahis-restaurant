# Payment Error Debugging Guide

## Current Issue
"Payment processed but failed to update order. Please contact support."

## Enhanced Debugging (Just Added)

### 🔍 What to Check in Browser Console

When you test the payment now, you'll see detailed logs:

#### 1. **Order Loading**
```
📦 Loaded order data: { ... }
🏪 Restaurant ID: <uuid or undefined>
```
**Check:** Is restaurant_id present? If it's `undefined`, that's the problem!

#### 2. **Payment Processing**
```
💳 Processing payment success...
📦 Order data: { id: ..., restaurant_id: ..., total_amount: ... }
```
**Check:** Verify all three fields are present

#### 3. **Payment Creation**
```
💾 Creating payment record...
✅ Payment record created: { ... }
```
**Check:** Does this step complete without errors?

#### 4. **Order Update**
```
🔄 Updating order status...
✅ Order status updated: { ... }
```
**Check:** Does this step fail? What's the error?

---

## Common Issues & Solutions

### Issue 1: Missing `restaurant_id`

**Symptom:**
```
🏪 Restaurant ID: undefined
❌ Missing restaurant_id in order
```

**Solution A - Check Database:**
```sql
-- Run in Supabase SQL Editor
SELECT id, restaurant_id, order_status, payment_status 
FROM orders 
WHERE id = 'YOUR_ORDER_ID';
```

If `restaurant_id` is NULL:
```sql
-- Fix by backfilling from table
UPDATE orders o
SET restaurant_id = t.restaurant_id
FROM tables t
WHERE o.table_id = t.id
AND o.restaurant_id IS NULL;
```

**Solution B - Check Order Creation:**
The order might not be created with `restaurant_id`. Check where orders are created in:
- `src/pages/customer/TablePage.jsx`
- Or wherever `createOrder()` is called

### Issue 2: RLS Policy Blocking Payment Creation

**Symptom:**
```
Error code: 42501
Error message: Permission denied
```

**Solution:**
```sql
-- Check current RLS policies on payments table
SELECT * FROM pg_policies WHERE tablename = 'payments';

-- Temporarily disable RLS for testing (ONLY IN DEVELOPMENT)
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Test payment again
-- Then re-enable:
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
```

### Issue 3: Missing Required Column

**Symptom:**
```
Error code: 23502
Error: null value in column "xxx" violates not-null constraint
```

**Solution:**
Check payments table schema:
```sql
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'payments';
```

Make sure all NOT NULL columns have values in the payment creation.

### Issue 4: Order Status Update Fails

**Symptom:**
Payment record created successfully, but order status doesn't update.

**Solution:**
Check RLS policies on orders table:
```sql
-- Check if authenticated users can update orders
SELECT * FROM pg_policies 
WHERE tablename = 'orders' 
AND policyname LIKE '%update%';
```

---

## Step-by-Step Testing

### 1. Open Browser Dev Tools
- Press `F12` or `Cmd+Option+I` (Mac)
- Go to **Console** tab

### 2. Clear Console
- Click the 🚫 icon to clear old logs

### 3. Test Payment
- Place an order as customer
- Go to payment page
- Click "Pay Now"
- Watch the console logs

### 4. Record the Output
Copy the entire console output and check:
- ✅ Which steps complete successfully (green checkmarks)
- ❌ Which step fails (red X)
- 📊 What error details appear

---

## Quick Database Check

Run this in Supabase SQL Editor to check your data:

```sql
-- Check if orders have restaurant_id
SELECT 
  id,
  restaurant_id,
  table_id,
  order_status,
  payment_status,
  total,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- Check if payments table exists and has correct columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- Check recent payments
SELECT 
  id,
  order_id,
  restaurant_id,
  amount,
  status,
  payment_method,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 5;
```

---

## Expected Successful Flow

When everything works correctly, you should see:

```
📦 Loaded order data: {...}
🏪 Restaurant ID: 123e4567-e89b-12d3-a456-426614174000
💳 Processing payment success...
📦 Order data: { id: ..., restaurant_id: ..., total_amount: 100 }
💾 Creating payment record...
✅ Payment record created: { id: ..., order_id: ..., status: 'captured' }
🔄 Updating order status...
✅ Order status updated: { payment_status: 'paid', order_status: 'received' }
```

Then redirect to order status page!

---

## Next Steps After Finding the Error

1. **Copy the exact error from console**
2. **Note which emoji step (📦, 💳, 💾, 🔄) it fails at**
3. **Check the error code and message**
4. **Share the console output** so we can fix the exact issue

The enhanced logging will pinpoint exactly where and why it's failing!

---

## Files Modified for Debugging

- `src/pages/customer/PaymentPage.jsx` - Added detailed logs
- `src/shared/utils/api/supabaseClient.js` - Include restaurant data in getOrder

All changes committed in: `314b947`

---

**Test now and share what the console shows!** 🔍
