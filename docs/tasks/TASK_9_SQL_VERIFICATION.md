# 🔍 Quick Customer Journey Test - SQL Verification Scripts

Run these SQL queries in your Supabase SQL Editor to verify test data exists.

## 1. Check Test Restaurants

```sql
-- List all restaurants with their slugs
SELECT 
  id,
  name,
  slug,
  is_active,
  created_at
FROM restaurants
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** At least 1 active restaurant with a `slug` value.

---

## 2. Check Tables for Testing

```sql
-- Get tables for a specific restaurant
-- Replace 'your-restaurant-id' with actual UUID from query above
SELECT 
  id,
  table_number,
  status,
  restaurant_id
FROM tables
WHERE restaurant_id = 'your-restaurant-id'
ORDER BY table_number
LIMIT 10;
```

**Expected:** Multiple tables (1-10) with restaurant_id.

---

## 3. Check Menu Items

```sql
-- Get menu items with categories
SELECT 
  id,
  name,
  category,
  price,
  is_available,
  restaurant_id
FROM menu_items
WHERE restaurant_id = 'your-restaurant-id'
  AND is_available = true
ORDER BY category, name
LIMIT 20;
```

**Expected:** At least 10+ items across categories (Starters, Mains, Desserts, Beverages).

---

## 4. Check Razorpay Configuration

```sql
-- Check payment settings
SELECT 
  id,
  name,
  payment_settings
FROM restaurants
WHERE id = 'your-restaurant-id';
```

**Expected payment_settings structure:**
```json
{
  "razorpay_key_id": "rzp_test_xxxxxxxxx",
  "razorpay_key_secret": "xxxxxxxxxxxxxxxx"
}
```

**If NULL or missing:** Payment will use platform fallback keys from `.env`

---

## 5. Build Test URL

Based on your data above, construct the customer URL:

```
http://localhost:5173/table/[TABLE_ID]?restaurant=[SLUG]
```

**Example:**
```
http://localhost:5173/table/1?restaurant=test-restaurant
```

---

## 6. Monitor During Test

### Track Table Status Change
```sql
-- Run BEFORE opening table page
SELECT id, table_number, status FROM tables WHERE id = 1;
-- status should be 'available'

-- Run AFTER opening table page
SELECT id, table_number, status FROM tables WHERE id = 1;
-- status should change to 'occupied'
```

### Track Session Creation
```sql
-- Get latest session for table
SELECT 
  id,
  table_id,
  restaurant_id,
  is_active,
  created_at
FROM table_sessions
WHERE table_id = 1
ORDER BY created_at DESC
LIMIT 1;
```

### Track Order Creation
```sql
-- Get latest order
SELECT 
  id,
  order_number,
  table_id,
  items,
  subtotal,
  tax,
  total,
  order_status,
  payment_status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;
```

### Track Payment Records
```sql
-- Get latest payment
SELECT 
  id,
  order_id,
  amount,
  payment_method,
  status,
  razorpay_payment_id,
  created_at
FROM order_payments
ORDER BY created_at DESC
LIMIT 1;
```

### Track Feedback Submissions
```sql
-- Get latest feedback
SELECT 
  id,
  restaurant_id,
  session_id,
  rating,
  comment,
  created_at
FROM feedback
ORDER BY created_at DESC
LIMIT 1;
```

---

## 7. Cleanup After Test (Optional)

```sql
-- Delete test orders (keeps data clean)
DELETE FROM order_payments WHERE order_id IN (
  SELECT id FROM orders WHERE created_at > NOW() - INTERVAL '1 hour'
);

DELETE FROM orders WHERE created_at > NOW() - INTERVAL '1 hour';

-- Reset table status
UPDATE tables 
SET status = 'available' 
WHERE id = 1;

-- Close test sessions
UPDATE table_sessions 
SET is_active = false 
WHERE table_id = 1 
  AND created_at > NOW() - INTERVAL '1 hour';
```

**⚠️ Warning:** Only run cleanup in development/testing environments!

---

## 8. Quick RLS Policy Check

```sql
-- Test anonymous user can read menu
SELECT COUNT(*) FROM menu_items; 
-- Should return count > 0

-- Test anonymous user can insert orders (if allowed)
-- This might fail due to RLS - that's expected if customer needs auth

-- Check if tables are readable
SELECT COUNT(*) FROM tables;
-- Should return count > 0
```

---

## 🎯 Ready to Test?

1. Run queries 1-3 to get your test data
2. Note the `restaurant slug` and `table id`
3. Build your test URL: `http://localhost:5173/table/[ID]?restaurant=[SLUG]`
4. Open the URL in browser
5. Follow the test guide in `TASK_9_CUSTOMER_JOURNEY_TEST.md`
6. Run monitoring queries as you progress through the flow

---

**Good luck with testing! 🚀**
