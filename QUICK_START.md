# ⚡ QUICK EXECUTION GUIDE

## 🗄️ DATABASE - Run These SQL Files in Order

### Execute in Supabase SQL Editor:

1. **Main Billing System:**
   ```
   database/80_complete_billing_system_3day_trial.sql
   ```
   - Copy entire file
   - Paste in Supabase SQL Editor
   - Click "Run"
   - Wait for success message

2. **Cron Jobs:**
   ```
   database/81_automated_cron_jobs.sql
   ```
   - Copy entire file
   - Paste in Supabase SQL Editor
   - Click "Run"
   - Wait for success message

### Verify Database:
```sql
-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('create_trial_subscription', 'generate_monthly_bills');

-- Check cron jobs
SELECT * FROM cron.job;
```

---

## 🔧 ENVIRONMENT VARIABLES

Add to your `.env` file:

```bash
# Platform Razorpay (for subscription payments)
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
RAZORPAY_KEY_SECRET=YOUR_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# Already have these:
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

---

## 🚀 DEPLOY EDGE FUNCTIONS (Optional - For Production)

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy create-subscription-order
supabase functions deploy verify-subscription-payment  
supabase functions deploy subscription-payment-webhook

# Set secrets
supabase secrets set RAZORPAY_KEY_ID=your_key
supabase secrets set RAZORPAY_KEY_SECRET=your_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## 🎨 FRONTEND - Add Routes

### Add to your router configuration:

**Manager Route:**
```javascript
import BillingPage from '@/pages/manager/BillingPage';

{
  path: '/manager/billing',
  element: <BillingPage />
}
```

**Superadmin Route:**
```javascript
import BillingManagementPage from '@/pages/superadmin/billing/BillingManagementPage';

{
  path: '/superadmin/billing',
  element: <BillingManagementPage />
}
```

---

## ✅ TEST IT

### 1. Create Test Restaurant
- Login as superadmin
- Go to Restaurants → Add New
- Fill form and submit
- Should see "3-day free trial" message

### 2. Check Database
```sql
-- Verify trial created
SELECT * FROM subscriptions 
WHERE status = 'trial' 
ORDER BY created_at DESC 
LIMIT 5;
```

### 3. Generate Test Bill
```sql
-- Manually generate bill for current month
SELECT * FROM generate_monthly_bills();

-- Check bills created
SELECT * FROM billing 
ORDER BY created_at DESC 
LIMIT 5;
```

### 4. View Dashboard
- Login as manager
- Go to /manager/billing
- Should see trial status

### 5. Superadmin Dashboard
- Login as superadmin  
- Go to /superadmin/billing
- Should see all bills

---

## 🎯 THAT'S IT!

**Database:** ✅ Run 2 SQL files  
**Environment:** ✅ Add Razorpay keys  
**Routes:** ✅ Add 2 routes  
**Edge Functions:** ⚠️ Optional (needed for payment processing)

**System is ready for testing!**
