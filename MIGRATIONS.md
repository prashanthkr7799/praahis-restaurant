# Database Schema Migrations

This document tracks all manual database schema changes that need to be applied to existing databases.

**IMPORTANT**: These migrations should be run in order on existing production databases. New installations should use the complete `phase3_migrations/01_core_schema.sql` file.

---

## Migration History

### Migration #1: Enhanced Orders Features (November 21, 2025)

**Purpose**: Add support for split payments, refunds, and order cancellations with proper tracking.

**Affected Tables**: `orders`, `complaints`

#### Orders Table Changes

##### 1. Add Split Payment Support

```sql
-- Add split payment method to payment_method enum
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('cash','razorpay','upi','card','online','split'));

-- Add payment_split_details column for split payment tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_split_details JSONB DEFAULT NULL;

COMMENT ON COLUMN public.orders.payment_split_details IS 
'For split payments: {cash_amount: number, online_amount: number, razorpay_payment_id: string, split_timestamp: string}';
```

**Use Case**: Track orders where customers pay partially with cash and partially online.

**Data Structure Example**:
```json
{
  "cash_amount": 500.00,
  "online_amount": 1500.00,
  "razorpay_payment_id": "pay_xyz123",
  "split_timestamp": "2025-11-21T14:30:00Z"
}
```

##### 2. Add Refund Tracking Columns

```sql
-- Add refund tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT 0 CHECK (refund_amount >= 0);

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.refund_amount IS 'Total amount refunded to customer';
COMMENT ON COLUMN public.orders.refund_reason IS 'Reason for refund (cancellation, complaint, wrong order, etc.)';
COMMENT ON COLUMN public.orders.refunded_at IS 'Timestamp when refund was processed';
```

**Use Case**: Track refunds directly on orders for quick reporting and reconciliation.

**Note**: These columns complement the `order_payments` table refund tracking. Use orders table for aggregated refund data.

#### Complaints Table Changes

##### 3. Update Issue Type Column

```sql
-- Drop old issue_types array column
ALTER TABLE public.complaints 
DROP COLUMN IF EXISTS issue_types;

-- Add new issue_type single value column
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS issue_type TEXT NOT NULL DEFAULT 'other' 
CHECK (issue_type IN ('food_quality', 'wrong_item', 'wait_time', 'service', 'cleanliness', 'billing', 'other'));

COMMENT ON COLUMN public.complaints.issue_type IS 'Single issue type for the complaint';
```

**Breaking Change**: This replaces the array-based `issue_types` column with a single-value `issue_type` column.

**Migration Strategy**: If you have existing complaints with multiple issue types, you may need to:
1. Create separate complaint records for each issue type, OR
2. Choose the primary issue type and migrate to the new column

```sql
-- Example: Migrate existing data by taking first issue type
UPDATE public.complaints 
SET issue_type = issue_types[1]
WHERE issue_types IS NOT NULL AND array_length(issue_types, 1) > 0;
```

#### Performance Indexes

##### 4. Add Indexes for Orders Table

```sql
-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON public.orders(cancelled_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_refunded_at ON public.orders(refunded_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
```

**Purpose**: Improve query performance for:
- Order status dashboards
- Payment status filtering
- Cancelled order reports
- Refund tracking
- Time-based order queries

##### 5. Add Indexes for Complaints Table

```sql
-- Add indexes for complaints queries
CREATE INDEX IF NOT EXISTS idx_complaints_resolved_at ON public.complaints(resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_issue_type ON public.complaints(issue_type);
```

**Purpose**: Improve query performance for:
- Resolved complaints reporting
- Issue type analytics
- Complaint resolution time tracking

---

## Verification Queries

### Verify Orders Table Changes

```sql
-- Check if payment_split_details column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND column_name IN ('payment_split_details', 'refund_amount', 'refund_reason', 'refunded_at');

-- Verify payment_method constraint includes 'split'
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass 
  AND conname = 'orders_payment_method_check';

-- Check orders indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'orders'
  AND schemaname = 'public'
  AND indexname LIKE 'idx_orders_%'
ORDER BY indexname;
```

### Verify Complaints Table Changes

```sql
-- Check if issue_type column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'complaints'
  AND column_name = 'issue_type';

-- Verify issue_type constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.complaints'::regclass 
  AND conname LIKE '%issue_type%';

-- Check complaints indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'complaints'
  AND schemaname = 'public'
  AND indexname LIKE 'idx_complaints_%'
ORDER BY indexname;
```

---

## Rollback Procedures

### Rollback Orders Changes

```sql
-- Remove new columns (WARNING: This will delete data)
ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_split_details;
ALTER TABLE public.orders DROP COLUMN IF EXISTS refund_amount;
ALTER TABLE public.orders DROP COLUMN IF EXISTS refund_reason;
ALTER TABLE public.orders DROP COLUMN IF EXISTS refunded_at;

-- Revert payment_method constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('cash','razorpay','upi','card','online'));

-- Drop new indexes
DROP INDEX IF EXISTS public.idx_orders_payment_status;
DROP INDEX IF EXISTS public.idx_orders_order_status;
DROP INDEX IF EXISTS public.idx_orders_payment_method;
DROP INDEX IF EXISTS public.idx_orders_cancelled_at;
DROP INDEX IF EXISTS public.idx_orders_refunded_at;
DROP INDEX IF EXISTS public.idx_orders_created_at;
```

### Rollback Complaints Changes

```sql
-- Remove issue_type column (WARNING: This will delete data)
ALTER TABLE public.complaints DROP COLUMN IF EXISTS issue_type;

-- Restore issue_types array (if backed up)
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS issue_types TEXT[];

-- Drop new indexes
DROP INDEX IF EXISTS public.idx_complaints_resolved_at;
DROP INDEX IF EXISTS public.idx_complaints_issue_type;
```

---

## Testing Checklist

After applying migrations, verify:

- [ ] **Split Payments**: Create test order with split payment method
- [ ] **Payment Split Details**: Insert and retrieve JSONB data correctly
- [ ] **Refund Tracking**: Test refund_amount, refund_reason, refunded_at columns
- [ ] **Complaints**: Create complaint with single issue_type value
- [ ] **Indexes**: Verify query performance improvement with EXPLAIN ANALYZE
- [ ] **Constraints**: Test that invalid values are rejected (payment_method, issue_type)
- [ ] **Cash Reconciliation**: Verify split payment cash amounts are calculated correctly
- [ ] **Reporting**: Check that refund reports include new columns

---

## Related Features

### Split Payment Integration

The `payment_split_details` column enables the Cash Reconciliation feature (`CashReconciliationPage.jsx`) to:
- Separate cash and online portions of split payments
- Calculate daily cash breakdown by order type
- Track split payment cash for end-of-day reconciliation

### Refund Tracking

The refund columns (`refund_amount`, `refund_reason`, `refunded_at`) support:
- Manager dashboard refund reports
- Financial reconciliation
- Customer service tracking
- Audit trails for cancelled/refunded orders

### Complaint Management

The `issue_type` column simplifies:
- Issue categorization and reporting
- Priority-based complaint routing
- Resolution time analytics by issue type
- Service quality metrics

---

## Schema Version

**Current Version**: 1.3.0 (November 22, 2025)
**Previous Versions**: 
- 1.2.0 (November 22, 2025) - Cash reconciliations and issue types array
- 1.1.0 (November 21, 2025) - Split payments and refunds
- 1.0.0 (Initial Phase 3 Schema)

---

### Migration #2: Cash Reconciliations Table (November 22, 2025)

**Purpose**: Add daily cash reconciliation tracking with denomination breakdown.

**File**: `phase3_migrations/18_cash_reconciliations.sql`

**New Table**: `cash_reconciliations`

```sql
CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL,
  expected_cash NUMERIC(10,2) NOT NULL CHECK (expected_cash >= 0),
  actual_cash NUMERIC(10,2) NOT NULL CHECK (actual_cash >= 0),
  difference NUMERIC(10,2) NOT NULL,
  dinein_cash NUMERIC(10,2) DEFAULT 0 CHECK (dinein_cash >= 0),
  dinein_count INT DEFAULT 0 CHECK (dinein_count >= 0),
  takeaway_cash NUMERIC(10,2) DEFAULT 0 CHECK (takeaway_cash >= 0),
  takeaway_count INT DEFAULT 0 CHECK (takeaway_count >= 0),
  split_cash NUMERIC(10,2) DEFAULT 0 CHECK (split_cash >= 0),
  split_count INT DEFAULT 0 CHECK (split_count >= 0),
  denominations JSONB,
  reason_for_difference TEXT,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, reconciliation_date)
);

CREATE INDEX idx_cash_recon_restaurant_date 
ON cash_reconciliations(restaurant_id, reconciliation_date DESC);

CREATE INDEX idx_cash_recon_submitted_at 
ON cash_reconciliations(submitted_at DESC);
```

**Use Case**: Track daily cash reconciliation with:
- Expected vs actual cash amounts
- Breakdown by order type (dine-in, takeaway, split)
- Denomination counting
- Discrepancy tracking

---

### Migration #3: Fix Complaints Issue Types (November 22, 2025)

**Purpose**: Convert complaints issue_type from single value to array to support multiple issues per complaint.

**File**: `phase3_migrations/19_fix_complaints_issue_types.sql`

**BREAKING CHANGE**: This reverses Migration #1's change to issue_type, converting it back to an array.

```sql
-- Drop existing constraint
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_issue_type_check;

-- Rename column
ALTER TABLE complaints RENAME COLUMN issue_type TO issue_types;

-- Create temporary column for conversion
ALTER TABLE complaints ADD COLUMN issue_types_temp TEXT[];

-- Convert single values to arrays
UPDATE complaints SET issue_types_temp = ARRAY[issue_types::TEXT];

-- Drop old column and rename temp
ALTER TABLE complaints DROP COLUMN issue_types;
ALTER TABLE complaints RENAME COLUMN issue_types_temp TO issue_types;

-- Add constraints
ALTER TABLE complaints ALTER COLUMN issue_types SET NOT NULL;
ALTER TABLE complaints ADD CONSTRAINT complaints_issue_types_check 
CHECK (
  issue_types <@ ARRAY['food_quality', 'wrong_item', 'wait_time', 'service', 'cleanliness', 'billing', 'other']::TEXT[]
  AND array_length(issue_types, 1) > 0
);

-- Create GIN index for array queries
CREATE INDEX idx_complaints_issue_types_gin ON complaints USING GIN (issue_types);
```

**Use Case**: Allow multiple issue types per complaint (e.g., "Food Quality" + "Wait Time").

**Application Changes Required**:
- Update `IssueReportModal.jsx` to send array of issue types
- Update `ComplaintsPanel.jsx` to display multiple badges
- Update `complaintService.js` to validate arrays

---

## Notes

1. **Idempotent Migrations**: All ALTER TABLE statements use `IF NOT EXISTS` or `IF EXISTS` to allow safe re-running.

2. **Data Loss Risk**: The `issue_types` → `issue_type` migration may cause data loss if you have complaints with multiple issue types. Back up data before migrating.

3. **Indexing Strategy**: New indexes may take time to build on large tables. Consider running during low-traffic periods.

4. **Application Updates**: Ensure your application code is updated to handle:
   - `payment_method = 'split'`
   - `payment_split_details` JSONB structure
   - Single `issue_type` instead of array `issue_types`

5. **Foreign Key Integrity**: All new columns maintain referential integrity. No foreign key changes were needed.

---

## Support

For questions or issues with migrations:
1. Review the verification queries above
2. Check application logs for constraint violations
3. Test in development environment first
4. Backup production data before applying

---

**Last Updated**: November 22, 2025
**Schema Files**: 
- `phase3_migrations/01_core_schema.sql` (base schema)
- `phase3_migrations/17_split_payment_support.sql` (split payments)
- `phase3_migrations/18_cash_reconciliations.sql` (cash reconciliation)
- `phase3_migrations/19_fix_complaints_issue_types.sql` (issue types array)
