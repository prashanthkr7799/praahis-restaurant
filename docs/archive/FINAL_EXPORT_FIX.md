# ✅ Final Export Fix - Deploy SQL Required

## 🐛 Issue
`permission denied for table users` when exporting billing/payments

## ✅ Solution Created

### 1. SQL File: `database/44_fix_billing_rls_policies.sql`
Updates RLS policies to use `platform_admins` instead of `auth.users`

### 2. UI Text Color Fixed
- Date range dropdown → `text-gray-900` ✅
- Date options → `text-gray-900` ✅  
- Date inputs → `text-gray-900` ✅

---

## 🚀 Deploy SQL (Copy & Paste to Supabase SQL Editor)

```sql
-- Fix billing RLS policy
DROP POLICY IF EXISTS "Superadmin full access to billing" ON billing;
CREATE POLICY "Superadmin full access to billing" ON billing
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM platform_admins
        WHERE user_id = auth.uid()
        AND role = 'superadmin'
        AND is_active = true
    )
);

-- Fix payments RLS policy
DROP POLICY IF EXISTS "Superadmin full access to payments" ON payments;
CREATE POLICY "Superadmin full access to payments" ON payments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM platform_admins
        WHERE user_id = auth.uid()
        AND role = 'superadmin'
        AND is_active = true
    )
);
```

---

## ✅ After Deployment

- ✅ Billing export will work
- ✅ Payments export will work  
- ✅ All text visible (black color)
- ✅ All 4 data types working!

**Deploy the SQL now to fix the permission errors!** 🚀
