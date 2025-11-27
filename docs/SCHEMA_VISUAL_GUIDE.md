# Database Schema Updates - Visual Reference

## 📊 Orders Table - Before & After

### BEFORE (Version 1.0.0)
```
orders
├── id (UUID, PK)
├── restaurant_id (UUID, FK)
├── table_id (UUID, FK)
├── order_number (VARCHAR)
├── order_type (TEXT)
├── customer_name (TEXT)
├── customer_phone (TEXT)
├── items (JSONB)
├── subtotal (NUMERIC)
├── tax (NUMERIC)
├── discount_type (TEXT) ✓ Already existed
├── discount_value (NUMERIC) ✓ Already existed
├── discount_reason (TEXT) ✓ Already existed
├── total (NUMERIC)
├── payment_status (TEXT)
├── payment_method (TEXT) → ['cash','razorpay','upi','card','online']
├── order_status (TEXT)
├── cancelled_at (TIMESTAMPTZ) ✓ Already existed
├── cancellation_reason (TEXT) ✓ Already existed
├── marked_ready_at (TIMESTAMPTZ)
├── customer_notified_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### AFTER (Version 1.1.0)
```
orders
├── id (UUID, PK)
├── restaurant_id (UUID, FK)
├── table_id (UUID, FK)
├── order_number (VARCHAR)
├── order_type (TEXT)
├── customer_name (TEXT)
├── customer_phone (TEXT)
├── items (JSONB)
├── subtotal (NUMERIC)
├── tax (NUMERIC)
├── discount_type (TEXT)
├── discount_value (NUMERIC)
├── discount_reason (TEXT)
├── total (NUMERIC)
├── payment_status (TEXT)
├── payment_method (TEXT) → ['cash','razorpay','upi','card','online','split'] 🆕
├── payment_split_details (JSONB) 🆕 NEW COLUMN
├── order_status (TEXT)
├── cancelled_at (TIMESTAMPTZ)
├── cancellation_reason (TEXT)
├── refund_amount (NUMERIC) 🆕 NEW COLUMN
├── refund_reason (TEXT) 🆕 NEW COLUMN
├── refunded_at (TIMESTAMPTZ) 🆕 NEW COLUMN
├── marked_ready_at (TIMESTAMPTZ)
├── customer_notified_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## 🔍 Payment Split Details Structure

```json
{
  "cash_amount": 500.00,
  "online_amount": 1500.00,
  "razorpay_payment_id": "pay_MXaBCxyz123",
  "split_timestamp": "2025-11-21T14:30:45.123Z"
}
```

**Use Cases:**
- Customer pays ₹500 cash + ₹1500 online
- Track both payment methods in one order
- Calculate cash totals for reconciliation
- Maintain payment audit trail

---

## 📋 Complaints Table - Before & After

### BEFORE (Version 1.0.0)
```
complaints
├── id (UUID, PK)
├── restaurant_id (UUID, FK)
├── order_id (UUID, FK)
├── table_id (UUID, FK)
├── issue_types (TEXT[]) ← Array of multiple issues
├── description (TEXT)
├── priority (TEXT) ['low','medium','high']
├── status (TEXT) ['open','in_progress','resolved','closed']
├── action_taken (TEXT)
├── reported_by (UUID, FK)
├── resolved_by (UUID, FK)
├── resolved_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### AFTER (Version 1.1.0)
```
complaints
├── id (UUID, PK)
├── restaurant_id (UUID, FK)
├── order_id (UUID, FK)
├── table_id (UUID, FK)
├── issue_type (TEXT) ← Single value 🔄 CHANGED
│   └── ['food_quality','wrong_item','wait_time','service','cleanliness','billing','other']
├── description (TEXT)
├── priority (TEXT) ['low','medium','high']
├── status (TEXT) ['open','in_progress','resolved','closed']
├── action_taken (TEXT)
├── reported_by (UUID, FK)
├── resolved_by (UUID, FK)
├── resolved_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

**Breaking Change:** `issue_types` (array) → `issue_type` (single value)

**Migration Strategy:**
```sql
-- If you have existing data with multiple issue types:
-- Option 1: Take first issue type
UPDATE complaints SET issue_type = issue_types[1];

-- Option 2: Create separate records per issue
INSERT INTO complaints (...)
SELECT ..., unnest(issue_types) as issue_type FROM old_complaints;
```

---

## 📈 New Performance Indexes

### Orders Table Indexes

```
✅ idx_orders_restaurant        (existing)
✅ idx_orders_table             (existing)
✅ idx_orders_type              (existing)
✅ idx_orders_created_by        (existing)
🆕 idx_orders_payment_status    (NEW)
🆕 idx_orders_order_status      (NEW)
🆕 idx_orders_payment_method    (NEW)
🆕 idx_orders_cancelled_at      (NEW)
🆕 idx_orders_refunded_at       (NEW)
🆕 idx_orders_created_at        (NEW)
```

**Query Performance Impact:**
```sql
-- These queries will be MUCH faster:
SELECT * FROM orders WHERE payment_status = 'paid';  -- Uses idx_orders_payment_status
SELECT * FROM orders WHERE order_status = 'ready';   -- Uses idx_orders_order_status
SELECT * FROM orders WHERE refunded_at IS NOT NULL;  -- Uses idx_orders_refunded_at
SELECT * FROM orders WHERE created_at >= '2025-11-01'; -- Uses idx_orders_created_at
```

### Complaints Table Indexes

```
✅ idx_complaints_restaurant_id (existing)
✅ idx_complaints_order_id      (existing)
✅ idx_complaints_status        (existing)
✅ idx_complaints_priority      (existing)
✅ idx_complaints_created_at    (existing)
🆕 idx_complaints_resolved_at   (NEW)
🆕 idx_complaints_issue_type    (NEW)
```

**Query Performance Impact:**
```sql
-- These queries will be faster:
SELECT * FROM complaints WHERE issue_type = 'food_quality'; -- Uses idx_complaints_issue_type
SELECT * FROM complaints WHERE resolved_at IS NOT NULL;     -- Uses idx_complaints_resolved_at
```

---

## 🎯 Feature Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                     ORDERS TABLE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  payment_split_details (JSONB)                             │
│  ├─► CashReconciliationPage.jsx                            │
│  │    └─ Calculate daily cash breakdown                    │
│  │                                                          │
│  └─► ManagerDashboard.jsx                                  │
│       └─ Display split payment orders                      │
│                                                             │
│  refund_amount, refund_reason, refunded_at                 │
│  ├─► RefundReportsPage.jsx (future)                       │
│  │    └─ Track refunds by date/reason                     │
│  │                                                          │
│  └─► OrderDetailsModal.jsx                                 │
│       └─ Show refund information                           │
│                                                             │
│  cancelled_at, cancellation_reason                         │
│  └─► OrderManagement.jsx                                   │
│       └─ Filter cancelled orders                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   COMPLAINTS TABLE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  issue_type (TEXT)                                         │
│  ├─► ComplaintsPage.jsx                                    │
│  │    └─ Filter by single issue type                      │
│  │                                                          │
│  └─► ComplaintAnalytics.jsx (future)                      │
│       └─ Issue type breakdown charts                       │
│                                                             │
│  resolved_at                                               │
│  └─► ComplaintMetrics.jsx                                  │
│       └─ Calculate resolution time                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Cash Reconciliation Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        ORDERS TABLE                              │
│                                                                  │
│  Order #1: payment_method = 'cash'                              │
│  ├─ order_type = 'dine_in'                                      │
│  └─ total = ₹1000                                               │
│                                                                  │
│  Order #2: payment_method = 'cash'                              │
│  ├─ order_type = 'takeaway'                                     │
│  └─ total = ₹500                                                │
│                                                                  │
│  Order #3: payment_method = 'split'                             │
│  ├─ order_type = 'dine_in'                                      │
│  ├─ payment_split_details = {                                   │
│  │    "cash_amount": 300,                                       │
│  │    "online_amount": 700                                      │
│  │  }                                                            │
│  └─ total = ₹1000                                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                             ↓
                    Calculate Breakdown
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│              CASH RECONCILIATION BREAKDOWN                       │
├──────────────────────────────────────────────────────────────────┤
│  Dine-In Cash:        ₹1000 (1 order)                          │
│  Takeaway Cash:       ₹500  (1 order)                          │
│  Split Payment Cash:  ₹300  (1 order)                          │
│  ─────────────────────────────────────────                     │
│  Total Expected:      ₹1800                                     │
└──────────────────────────────────────────────────────────────────┘
                             ↓
                    Store in daily_reconciliation
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│              DAILY_RECONCILIATION TABLE                          │
├──────────────────────────────────────────────────────────────────┤
│  dinein_cash_amount: 1000                                       │
│  dinein_cash_orders_count: 1                                    │
│  takeaway_cash_amount: 500                                      │
│  takeaway_cash_orders_count: 1                                  │
│  split_payment_cash_amount: 300                                 │
│  split_payment_orders_count: 1                                  │
│  total_expected_cash: 1800                                      │
│  actual_cash_counted: [Manager enters]                          │
│  difference: [Auto-calculated]                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ SQL Query Examples

### Query Split Payment Cash Totals

```sql
-- Calculate today's split payment cash
SELECT 
  SUM((payment_split_details->>'cash_amount')::numeric) as total_split_cash,
  COUNT(*) as split_order_count
FROM orders
WHERE restaurant_id = 'xxx'
  AND payment_method = 'split'
  AND payment_status = 'paid'
  AND DATE(created_at) = CURRENT_DATE;
```

### Query Refunded Orders

```sql
-- Get all refunded orders this month
SELECT 
  order_number,
  total,
  refund_amount,
  refund_reason,
  refunded_at
FROM orders
WHERE restaurant_id = 'xxx'
  AND refunded_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND refund_amount > 0
ORDER BY refunded_at DESC;
```

### Query Complaints by Issue Type

```sql
-- Count complaints by issue type
SELECT 
  issue_type,
  COUNT(*) as complaint_count,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours
FROM complaints
WHERE restaurant_id = 'xxx'
  AND status = 'resolved'
  AND resolved_at >= NOW() - INTERVAL '30 days'
GROUP BY issue_type
ORDER BY complaint_count DESC;
```

### Query Cash Breakdown for Reconciliation

```sql
-- Today's cash breakdown for reconciliation
WITH cash_breakdown AS (
  SELECT 
    -- Dine-in cash
    SUM(CASE 
      WHEN payment_method = 'cash' AND order_type IN ('dine_in', 'delivery')
      THEN total ELSE 0 
    END) as dinein_cash,
    
    -- Takeaway cash
    SUM(CASE 
      WHEN payment_method = 'cash' AND order_type = 'takeaway'
      THEN total ELSE 0 
    END) as takeaway_cash,
    
    -- Split payment cash
    SUM(CASE 
      WHEN payment_method = 'split'
      THEN (payment_split_details->>'cash_amount')::numeric ELSE 0 
    END) as split_cash
    
  FROM orders
  WHERE restaurant_id = 'xxx'
    AND payment_status = 'paid'
    AND DATE(created_at) = CURRENT_DATE
)
SELECT 
  dinein_cash,
  takeaway_cash,
  split_cash,
  (dinein_cash + takeaway_cash + split_cash) as total_expected_cash
FROM cash_breakdown;
```

---

## 📝 Testing Checklist

### Orders Table Tests

```sql
-- ✓ Test 1: Insert order with split payment
INSERT INTO orders (
  id, restaurant_id, order_number, items, subtotal, total,
  payment_method, payment_split_details, payment_status
) VALUES (
  gen_random_uuid(), 'your-restaurant-id', 'ORD-TEST-001',
  '[]'::jsonb, 1000, 1000,
  'split',
  '{"cash_amount": 400, "online_amount": 600}'::jsonb,
  'paid'
);

-- ✓ Test 2: Insert order with refund
INSERT INTO orders (
  id, restaurant_id, order_number, items, subtotal, total,
  payment_status, refund_amount, refund_reason, refunded_at
) VALUES (
  gen_random_uuid(), 'your-restaurant-id', 'ORD-TEST-002',
  '[]'::jsonb, 500, 500,
  'refunded', 500, 'Wrong order delivered', NOW()
);

-- ✓ Test 3: Query split payment cash
SELECT 
  (payment_split_details->>'cash_amount')::numeric as cash_portion
FROM orders 
WHERE payment_method = 'split';
```

### Complaints Table Tests

```sql
-- ✓ Test 1: Insert complaint with issue_type
INSERT INTO complaints (
  id, restaurant_id, issue_type, description, priority, status
) VALUES (
  gen_random_uuid(), 'your-restaurant-id',
  'food_quality', 'Food was cold', 'high', 'open'
);

-- ✓ Test 2: Query by issue type
SELECT * FROM complaints WHERE issue_type = 'wait_time';

-- ✓ Test 3: Check constraint works
-- This should FAIL:
INSERT INTO complaints (id, restaurant_id, issue_type, description)
VALUES (gen_random_uuid(), 'xxx', 'invalid_type', 'Test');
```

### Index Performance Tests

```sql
-- ✓ Test index usage with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE payment_status = 'paid' 
  AND created_at >= NOW() - INTERVAL '1 day';
-- Should show: Index Scan using idx_orders_payment_status

EXPLAIN ANALYZE
SELECT * FROM complaints
WHERE issue_type = 'food_quality'
  AND status = 'open';
-- Should show: Index Scan using idx_complaints_issue_type
```

---

## 🚨 Important Notes

1. **Breaking Change**: `issue_types` array → `issue_type` single value
   - Requires application code updates
   - May require data migration for existing complaints

2. **Payment Method**: Added `'split'` to enum
   - Application must handle split payment orders
   - Cash reconciliation must extract cash_amount from JSONB

3. **Indexes**: 8 new indexes added
   - May slow down INSERT/UPDATE slightly (negligible)
   - Significantly speeds up SELECT queries
   - Build time on large tables may be notable

4. **JSONB Column**: `payment_split_details` uses JSONB
   - Flexible structure for future extensions
   - Can be queried with `->` and `->>` operators
   - Can add GIN index if needed for complex queries

---

**Visual Guide Version**: 1.0
**Last Updated**: November 21, 2025
**Related Docs**: MIGRATIONS.md, SCHEMA_MIGRATION_SUMMARY.md
