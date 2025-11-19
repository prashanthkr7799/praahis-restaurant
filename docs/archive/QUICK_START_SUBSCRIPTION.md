# 🚀 Quick Start Guide - Unified Subscription System

## 📦 What You Got

A complete Netflix-style subscription system for Praahis:
- **Single Plan**: ₹35,000/month + ₹5,000 setup fee
- **3-day trial** → **3-day grace** → **Auto-suspension**
- **Instant reactivation** on payment
- Complete UI, backend functions, payment integration

---

## ⚡ 5-Minute Setup

### Step 1: Run Database Migration (2 min)
```bash
# Open Supabase SQL Editor
# Copy & paste: database/30_unified_subscription_system.sql
# Click "Run"
# Verify: Tables created, Functions created, Settings populated
```

### Step 2: Add Environment Variables (1 min)
```bash
# .env (Frontend)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx

# .env (Backend - if separate)
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Add Routes (1 min)
```jsx
// src/App.jsx

import SubscriptionExpiredScreen from './Components/SubscriptionExpiredScreen';
import Payment from './pages/Payment';

// Add routes:
<Route path="/subscription-expired" element={<SubscriptionExpiredScreen />} />
<Route path="/payment" element={<Payment />} />
```

### Step 4: Add Subscription Check to Dashboard (1 min)
```jsx
// src/pages/admin/Dashboard.jsx

import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { GracePeriodBanner, RenewalCountdown } from '../../Components/SubscriptionBanners';

const Dashboard = () => {
  const { subscription, hasAccess, isInGracePeriod, daysRemaining } = useSubscriptionGuard({
    redirectOnExpired: true
  });

  if (!hasAccess) return null; // Will redirect to lock screen

  return (
    <div>
      {isInGracePeriod && <GracePeriodBanner daysRemaining={daysRemaining} />}
      
      <RenewalCountdown 
        daysRemaining={daysRemaining}
        status={subscription?.status}
        endDate={subscription?.end_date}
      />
      
      {/* Your dashboard content */}
    </div>
  );
};
```

### Step 5: Test It! (Testing in next section)

---

## 🧪 Testing (10 minutes)

### Test 1: Trial Flow
```sql
-- 1. Create test restaurant
INSERT INTO restaurants (name, email, phone, is_active)
VALUES ('Test Restaurant', 'test@example.com', '9876543210', true)
RETURNING id;

-- 2. Create trial subscription
SELECT create_trial_subscription('restaurant_id_here');

-- 3. Verify subscription
SELECT * FROM subscriptions WHERE restaurant_id = 'restaurant_id_here';
-- Should show: status='trial', trial_ends_at = NOW() + 3 days

-- 4. Test subscription check
SELECT * FROM check_subscription_status('restaurant_id_here');
-- Should return: is_active=true, status='trial', days_remaining=3
```

### Test 2: Grace Period
```sql
-- 1. Expire the trial
UPDATE subscriptions 
SET end_date = NOW() - INTERVAL '1 day',
    trial_ends_at = NOW() - INTERVAL '1 day'
WHERE restaurant_id = 'restaurant_id_here';

-- 2. Run auto-suspend
SELECT * FROM auto_suspend_expired_subscriptions();
-- Should return: Status changed to 'grace'

-- 3. Check status
SELECT * FROM check_subscription_status('restaurant_id_here');
-- Should return: status='grace', in_grace_period=true, is_active=true
```

### Test 3: Suspension
```sql
-- 1. Expire grace period
UPDATE subscriptions 
SET end_date = NOW() - INTERVAL '5 days',
    grace_period_start = NOW() - INTERVAL '4 days'
WHERE restaurant_id = 'restaurant_id_here';

-- 2. Run auto-suspend
SELECT * FROM auto_suspend_expired_subscriptions();
-- Should return: suspended_count=1

-- 3. Check status
SELECT * FROM check_subscription_status('restaurant_id_here');
-- Should return: status='suspended', is_active=false
```

### Test 4: Payment & Reactivation
```sql
-- Simulate payment (you'll use Razorpay in production)
SELECT * FROM process_payment_and_reactivate(
  'restaurant_id_here',
  35000,
  'monthly_subscription',
  'razorpay',
  'pay_test123',
  'order_test123'
);
-- Should return: success=true, new_end_date = NOW() + 30 days

-- Verify reactivation
SELECT * FROM check_subscription_status('restaurant_id_here');
-- Should return: status='active', is_active=true
```

---

## 🔄 Daily Auto-Suspension Setup

### Option A: Supabase Edge Function (Recommended)

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link project
supabase link --project-ref your-project-ref

# 4. Create function
supabase functions new auto-suspend

# 5. Copy code from: supabase-edge-function-example.ts
# to: supabase/functions/auto-suspend/index.ts

# 6. Deploy
supabase functions deploy auto-suspend

# 7. Get function URL
# Supabase Dashboard → Edge Functions → auto-suspend → Copy URL
```

### Schedule with Supabase Cron
```sql
-- In Supabase SQL Editor
-- Run daily at 2 AM UTC

SELECT cron.schedule(
  'auto-suspend-subscriptions',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/auto-suspend',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;
  $$
);

-- Verify cron job created
SELECT * FROM cron.job;
```

### Option B: pg_cron (Alternative)
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job
SELECT cron.schedule(
  'auto-suspend-expired',
  '0 2 * * *',
  'SELECT auto_suspend_expired_subscriptions();'
);

-- Verify
SELECT * FROM cron.job;
```

---

## 💳 Razorpay Setup (5 minutes)

### 1. Create Razorpay Account
- Go to: https://dashboard.razorpay.com
- Sign up for free
- Get test API keys

### 2. Configure Webhook
```
Webhook URL: https://your-backend.com/api/razorpay/webhook
Events to subscribe:
  ✅ payment.captured
  ✅ payment.failed
  ✅ payment.authorized

Get Webhook Secret → Save to .env
```

### 3. Backend API Setup (Node.js/Express)
```bash
# Install dependencies
npm install express razorpay @supabase/supabase-js crypto

# Copy code from: backend-api-example.js
# to your backend: routes/subscription.js

# Add to your Express app:
const subscriptionRoutes = require('./routes/subscription');
app.use('/api', subscriptionRoutes);

# Start server
npm run dev
```

### 4. Test Payment Flow
```bash
# 1. Login to your app as restaurant owner
# 2. Go to /payment page
# 3. Click "Pay ₹35,000"
# 4. Use Razorpay test card:
     Card: 4111 1111 1111 1111
     CVV: 123
     Expiry: Any future date
# 5. Complete payment
# 6. Verify subscription activated
```

---

## 📊 Super Admin Dashboard

Update `RestaurantsListEnhanced.jsx` to show subscription info:

```jsx
// Add to your restaurant list columns:
{
  name: 'Subscription',
  render: (restaurant) => {
    const sub = restaurant.subscription;
    return (
      <div>
        <SubscriptionStatusBadge status={sub?.status} />
        <div className="text-xs text-gray-500 mt-1">
          {sub?.days_remaining} days left
        </div>
      </div>
    );
  }
},
{
  name: 'Actions',
  render: (restaurant) => (
    <div className="flex gap-2">
      {restaurant.subscription?.status === 'suspended' ? (
        <button onClick={() => handleReactivate(restaurant.id)}>
          Reactivate
        </button>
      ) : (
        <button onClick={() => handleSuspend(restaurant.id)}>
          Suspend
        </button>
      )}
    </div>
  )
}
```

Add functions:
```jsx
const handleSuspend = async (restaurantId) => {
  const { error } = await supabaseOwner.rpc('toggle_subscription_status', {
    p_restaurant_id: restaurantId,
    p_action: 'suspend',
    p_reason: 'Manually suspended by admin'
  });
  if (!error) toast.success('Restaurant suspended');
};

const handleReactivate = async (restaurantId) => {
  const { error } = await supabaseOwner.rpc('toggle_subscription_status', {
    p_restaurant_id: restaurantId,
    p_action: 'reactivate'
  });
  if (!error) toast.success('Restaurant reactivated');
};
```

---

## 🎯 User Flows Summary

### New Restaurant
```
1. Sign up
2. Auto-create 3-day trial
3. See "Trial: 3 days left" banner
4. After 3 days → Grace period (3 days)
5. See "Payment Overdue" warning
6. After 6 days total → Suspended
7. Lock screen appears
```

### Payment
```
1. Click "Renew Now"
2. Choose payment type (Monthly ₹35,000 or Setup ₹5,000)
3. Razorpay opens
4. Complete payment
5. Instant reactivation
6. End date extended +30 days
```

### Active Subscription
```
1. Dashboard shows countdown
2. Before expiry: "15 days remaining"
3. At 3 days: Warning appears
4. Pay early → Extends from current end date
5. No interruption
```

---

## ✅ Deployment Checklist

### Pre-Production
- [ ] Database migration run successfully
- [ ] All functions tested in SQL editor
- [ ] Trial flow tested (create → expire → grace → suspend)
- [ ] Payment flow tested with Razorpay test mode
- [ ] Lock screen appears for suspended accounts
- [ ] Reactivation works after payment
- [ ] Cron job scheduled for auto-suspension
- [ ] Webhook endpoint configured in Razorpay

### Production
- [ ] Switch Razorpay to LIVE mode
- [ ] Update RAZORPAY_KEY_ID (live key)
- [ ] Update RAZORPAY_KEY_SECRET (live key)
- [ ] Verify webhook URL is production URL
- [ ] Test one payment in live mode
- [ ] Monitor first auto-suspension run
- [ ] Set up email notifications (optional)
- [ ] Train support team on manual suspend/reactivate

---

## 🐛 Troubleshooting

### "Subscription not found" error
```sql
-- Check if subscription exists
SELECT * FROM subscriptions WHERE restaurant_id = 'your_id';

-- If missing, create one
SELECT create_trial_subscription('your_restaurant_id');
```

### Auto-suspension not working
```sql
-- Manually run to test
SELECT * FROM auto_suspend_expired_subscriptions();

-- Check cron job exists
SELECT * FROM cron.job;

-- Check cron job logs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Payment not reactivating
```bash
# Check backend logs for errors
# Verify process_payment_and_reactivate function called
# Check payments table for record
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
```

### RLS blocking access
```sql
-- Check user's restaurant_id
SELECT id, email, restaurant_id, role FROM users WHERE email = 'user@example.com';

-- If role is super_admin, should see all
-- If role is admin/manager, should see only their restaurant_id's subscription
```

---

## 📞 Support

- **Email**: support@praahis.com
- **Documentation**: UNIFIED_SUBSCRIPTION_GUIDE.md
- **Implementation Summary**: UNIFIED_SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md

---

## 🎉 You're Done!

Your subscription system is ready to go live. Key features:

✅ Single flat plan (no confusion)  
✅ Automatic expiration flow  
✅ Payment integration ready  
✅ Lock screen for expired accounts  
✅ Instant reactivation  
✅ Super Admin controls  
✅ Zero data loss  

**Next**: Run the database migration and test the flow! 🚀
