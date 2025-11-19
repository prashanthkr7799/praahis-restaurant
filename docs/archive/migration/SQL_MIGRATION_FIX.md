# SQL Migration Fix - November 8, 2025

## Issue Encountered
When running `database/50_razorpay_per_restaurant.sql`:
```
ERROR: 42703: column "is_superadmin" does not exist
```

## Root Cause
The SQL file was checking for a column `is_superadmin` in the `users` table, but the actual schema uses a **function** `is_superadmin(user_id)` instead.

## What Was Fixed

### 1. Superadmin Check
**Before:**
```sql
-- ❌ Incorrect - checking for column that doesn't exist
WHERE is_superadmin = true
```

**After:**
```sql
-- ✅ Correct - using the function
WHERE is_superadmin(auth.uid())
```

### 2. Auth UID Comparison
**Before:**
```sql
-- ❌ Incorrect - reversed comparison
WHERE auth.uid() = id
```

**After:**
```sql
-- ✅ Correct - proper comparison
WHERE users.id = auth.uid()
```

## Verification
The migration now runs successfully without errors. The RLS policies correctly:
- Allow restaurant owners/managers to view their own payment credentials
- Allow superadmins to manage all credentials
- Use the existing `is_superadmin()` function from `database/44_fix_billing_rls_policies.sql`

## How to Apply
Simply re-run the updated migration:
```sql
-- In Supabase SQL Editor
database/50_razorpay_per_restaurant.sql
```

The file now has the correct:
- Function call: `is_superadmin(auth.uid())`
- Comparison: `users.id = auth.uid()`

## Related Files
- `database/44_fix_billing_rls_policies.sql` - Contains `is_superadmin()` function definition
- `database/10_multitenancy.sql` - Shows `users` table has `restaurant_id` column
- `database/01_schema.sql` - Original `users` table schema

---

**Status:** ✅ Fixed and Committed (commit `b3b4178`)
