# Quick Fix Guide - Billing System Deployment

## 🔥 If You're Seeing Errors

The error `column "payment_status" of relation "payments" does not exist` typically means there's a conflict with existing database objects.

---

## ✅ Solution 1: Clean Deployment (Recommended)

### Step 1: Run Diagnostic
```bash
psql $DATABASE_URL -f database/DIAGNOSTIC.sql
```

This will show you what exists and what might be conflicting.

### Step 2: Clean Slate
```bash
psql $DATABASE_URL -f database/CLEANUP_BILLING.sql
```

**WARNING:** This deletes all existing billing/payment data!

### Step 3: Fresh Install
```bash
psql $DATABASE_URL -f database/40_billing_payments_system.sql
```

---

## ✅ Solution 2: Manual Cleanup

Run these commands in your PostgreSQL client:

```sql
-- Drop everything related to billing
DROP TRIGGER IF EXISTS update_billing_timestamp_trigger ON billing CASCADE;
DROP TRIGGER IF EXISTS update_payments_timestamp_trigger ON payments CASCADE;

DROP FUNCTION IF EXISTS calculate_billing_amount CASCADE;
DROP FUNCTION IF EXISTS generate_monthly_bills CASCADE;
DROP FUNCTION IF EXISTS mark_bill_as_paid CASCADE;
DROP FUNCTION IF EXISTS suspend_overdue_restaurants CASCADE;
DROP FUNCTION IF EXISTS get_restaurant_billing_summary CASCADE;
DROP FUNCTION IF EXISTS update_billing_timestamp CASCADE;

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS billing CASCADE;
```

Then run:
```bash
psql $DATABASE_URL -f database/40_billing_payments_system.sql
```

---

## ✅ Solution 3: Supabase Dashboard

If using Supabase:

1. Go to **SQL Editor**
2. Copy the contents of `database/CLEANUP_BILLING.sql`
3. Run it
4. Then copy and run `database/40_billing_payments_system.sql`

---

## 🧪 Verify Installation

After installation, run this SQL:

```sql
-- Check tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('billing', 'payments');

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'generate_monthly_bills',
    'suspend_overdue_restaurants',
    'mark_bill_as_paid',
    'get_restaurant_billing_summary',
    'calculate_billing_amount'
);

-- Test calculation
SELECT calculate_billing_amount(10, 100, 30);
-- Should return: 30000.00
```

---

## 🎯 Quick Test

Once installed, test the system:

```sql
-- 1. Generate test bills
SELECT * FROM generate_monthly_bills();

-- 2. View generated bills
SELECT 
    r.name,
    b.table_count,
    b.total_amount,
    b.status,
    b.due_date
FROM billing b
JOIN restaurants r ON r.id = b.restaurant_id
LIMIT 5;

-- 3. Test payment function (use actual billing_id from above)
SELECT mark_bill_as_paid(
    '<billing_id>'::UUID,
    'manual',
    'TEST123',
    NULL
);
```

---

## 🚨 Common Issues & Fixes

### Issue: "relation billing does not exist"
**Fix:** The table wasn't created. Check if there are errors earlier in the script.

### Issue: "function already exists"
**Fix:** Run the cleanup script first, then reinstall.

### Issue: "permission denied"
**Fix:** Make sure you're running as a superuser or have appropriate permissions.

### Issue: RLS policies failing
**Fix:** Check if `auth.users` table exists and has the required columns.

---

## 📁 Helper Scripts

| Script | Purpose |
|--------|---------|
| `DIAGNOSTIC.sql` | Check what exists |
| `CLEANUP_BILLING.sql` | Remove all billing objects |
| `40_billing_payments_system.sql` | Main installation |
| `DEPLOY_BILLING_SYSTEM.sql` | Safe deployment with verification |

---

## 💡 Pro Tips

1. **Always backup first**: `pg_dump $DATABASE_URL > backup.sql`
2. **Use transactions**: Wrap installation in `BEGIN; ... COMMIT;`
3. **Check logs**: Look for detailed error messages
4. **Test on staging first**: Never test directly on production

---

## 🆘 Still Having Issues?

1. Check the error message carefully
2. Run `DIAGNOSTIC.sql` to see the current state
3. Look for conflicting column names or types
4. Check if you have the required `restaurants` and `tables` tables
5. Verify your PostgreSQL version (9.6+ required)

---

## ✅ Success Checklist

- [ ] No errors during installation
- [ ] Tables `billing` and `payments` exist
- [ ] All 5 functions exist
- [ ] Triggers are attached
- [ ] Test calculation returns 30000
- [ ] Can generate bills successfully
- [ ] RLS policies are working

---

**Last Updated**: November 7, 2025  
**Version**: 1.0

## 🎉 Once Working

Proceed to:
1. Create Supabase Edge Functions
2. Build React UI components
3. Test end-to-end flow
4. Deploy to production

See `IMPLEMENTATION_GUIDE.md` for full details.
