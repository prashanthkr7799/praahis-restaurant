# 🚀 Schema Migration Quick Reference Card

## What Changed?

### ✅ NEW: Split Payment Support
```sql
-- orders table
payment_method: Added 'split' option
payment_split_details: NEW JSONB column
```
**Why?** Track cash + online mixed payments

### ✅ NEW: Refund Tracking  
```sql
-- orders table
refund_amount: NEW NUMERIC column
refund_reason: NEW TEXT column
refunded_at: NEW TIMESTAMPTZ column
```
**Why?** Direct order-level refund tracking

### ⚠️ CHANGED: Complaint Issue Type
```sql
-- complaints table
REMOVED: issue_types (TEXT[])
ADDED: issue_type (TEXT)
```
**Why?** Simplified single-issue tracking

### ⚡ NEW: Performance Indexes
```sql
-- 8 new indexes for faster queries
idx_orders_payment_status
idx_orders_order_status
idx_orders_payment_method
idx_orders_cancelled_at
idx_orders_refunded_at
idx_orders_created_at
idx_complaints_resolved_at
idx_complaints_issue_type
```

---

## Migration Commands (Copy & Paste)

### For Existing Databases

```sql
-- 1. Add split payment support
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('cash','razorpay','upi','card','online','split'));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_split_details JSONB DEFAULT NULL;

-- 2. Add refund tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT 0 CHECK (refund_amount >= 0);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- 3. Update complaints (BREAKING - backup first!)
ALTER TABLE public.complaints DROP COLUMN IF EXISTS issue_types;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS issue_type TEXT NOT NULL DEFAULT 'other' 
CHECK (issue_type IN ('food_quality', 'wrong_item', 'wait_time', 'service', 'cleanliness', 'billing', 'other'));

-- 4. Add indexes
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON public.orders(cancelled_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_refunded_at ON public.orders(refunded_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_resolved_at ON public.complaints(resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_issue_type ON public.complaints(issue_type);
```

---

## Verification (Copy & Paste)

```sql
-- Check all new columns exist
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
AND column_name IN ('payment_split_details', 'refund_amount', 'refund_reason', 'refunded_at');

-- Check all new indexes exist
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN ('orders', 'complaints')
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Test split payment insert
INSERT INTO orders (id, restaurant_id, order_number, items, subtotal, total, payment_method, payment_split_details, payment_status)
VALUES (gen_random_uuid(), 'your-restaurant-id', 'TEST-001', '[]'::jsonb, 1000, 1000, 'split', 
'{"cash_amount": 400, "online_amount": 600}'::jsonb, 'paid');

-- Test split payment query
SELECT order_number, (payment_split_details->>'cash_amount')::numeric as cash_portion
FROM orders WHERE payment_method = 'split';
```

---

## Application Code Updates

### JavaScript/React

```javascript
// ✅ Handle split payment method
if (order.payment_method === 'split') {
  const cashAmount = order.payment_split_details?.cash_amount || 0;
  const onlineAmount = order.payment_split_details?.online_amount || 0;
  console.log(`Cash: ₹${cashAmount}, Online: ₹${onlineAmount}`);
}

// ✅ Display refund info
if (order.refunded_at) {
  console.log(`Refunded ₹${order.refund_amount} - ${order.refund_reason}`);
}

// ⚠️ Update complaints handling (BREAKING CHANGE)
// OLD: complaint.issue_types (array)
// NEW: complaint.issue_type (single value)
console.log(complaint.issue_type); // 'food_quality', 'wait_time', etc.
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| **MIGRATIONS.md** | Complete migration guide with rollback |
| **SCHEMA_MIGRATION_SUMMARY.md** | High-level overview |
| **SCHEMA_VISUAL_GUIDE.md** | Visual diagrams and examples |
| **This file** | Quick copy-paste reference |

---

## Need Help?

1. **Read full guide**: `MIGRATIONS.md`
2. **See examples**: `SCHEMA_VISUAL_GUIDE.md`
3. **Check summary**: `SCHEMA_MIGRATION_SUMMARY.md`
4. **Backup first!** Always backup before migrating
5. **Test in dev** before production

---

**Schema Version**: 1.1.0 (Nov 21, 2025)
**Breaking Changes**: ⚠️ Yes (complaints.issue_types → issue_type)
**New Installations**: ✅ Just use `01_core_schema.sql`

---

## One-Liner Checklist

```
□ Backup database
□ Copy migration commands
□ Run in transaction
□ Run verification queries
□ Update application code (complaints)
□ Test split payments
□ Test refund tracking
□ Monitor index build (large tables)
□ Update API documentation
```

**Estimated Time**: 5-15 minutes (depends on table size)
