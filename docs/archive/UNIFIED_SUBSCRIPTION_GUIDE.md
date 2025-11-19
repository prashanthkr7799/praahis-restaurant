# Praahis Unified Subscription System
## Netflix-Style Single Plan Model

## 📋 Overview

This is a complete subscription management system for Praahis restaurant platform with:
- **Single Flat Plan**: ₹35,000/month (no tiers)
- **One-time Setup Fee**: ₹5,000 (branding, QR, deployment)
- **3-Day Free Trial**: Full access to test the platform
- **3-Day Grace Period**: After expiry before suspension
- **Automatic Suspension**: No access if payment not received
- **Instant Reactivation**: Pay and restore immediately (no data loss)

---

## 🏗️ Architecture

### Database Schema

#### 1. **subscriptions** table
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK → restaurants)
- start_date (TIMESTAMPTZ)
- end_date (TIMESTAMPTZ)
- status (TEXT) → 'trial', 'active', 'grace', 'suspended', 'cancelled'
- last_payment_date (TIMESTAMPTZ)
- next_billing_date (TIMESTAMPTZ)
- setup_fee_paid (BOOLEAN)
- trial_ends_at (TIMESTAMPTZ)
- grace_period_days (INTEGER, default: 3)
- grace_period_start (TIMESTAMPTZ)
- suspended_at (TIMESTAMPTZ)
- suspended_reason (TEXT)
```

#### 2. **payments** table
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK)
- subscription_id (UUID, FK)
- amount (DECIMAL)
- payment_type (TEXT) → 'setup_fee', 'monthly_subscription', 'renewal'
- payment_method (TEXT) → 'razorpay', 'stripe', 'manual'
- payment_gateway_id (TEXT)
- payment_gateway_order_id (TEXT)
- status (TEXT) → 'pending', 'processing', 'completed', 'failed', 'refunded'
- payment_date (TIMESTAMPTZ)
- receipt_url (TEXT)
- invoice_number (TEXT)
- metadata (JSONB)
```

### Database Functions

#### 1. `check_subscription_status(restaurant_id)`
Returns current subscription status:
```sql
{
  status: 'trial' | 'active' | 'grace' | 'suspended' | 'cancelled',
  is_active: boolean,
  days_remaining: integer,
  in_grace_period: boolean,
  message: text
}
```

#### 2. `auto_suspend_expired_subscriptions()`
Runs daily (cron job):
- Moves expired subscriptions to 'grace' status
- Suspends subscriptions after grace period ends
- Returns list of suspended restaurants

#### 3. `process_payment_and_reactivate(restaurant_id, amount, payment_type, ...)`
Processes payment and:
- Creates payment record
- Updates subscription end_date (+30 days)
- Changes status to 'active'
- Reactivates restaurant
- Returns new end date

#### 4. `create_trial_subscription(restaurant_id)`
Creates 3-day trial subscription for new restaurants

#### 5. `toggle_subscription_status(restaurant_id, action, reason)`
Manual suspend/reactivate by Super Admin

#### 6. `get_expiring_subscriptions(days_before)`
Gets subscriptions expiring in X days (for notifications)

---

## 🔐 Row Level Security (RLS)

### Subscriptions Table
- **Restaurants**: Can only view their own subscription
- **Super Admin**: Full access to all subscriptions

### Payments Table
- **Restaurants**: Can only view their own payments
- **Super Admin**: Full access to all payments

---

## ⚛️ React Components

### 1. `useSubscriptionGuard` Hook
```jsx
import { useSubscriptionGuard } from '../hooks/useSubscriptionGuard';

const { subscription, loading, hasAccess, checkStatus } = useSubscriptionGuard({
  redirectOnExpired: true,
  redirectPath: '/subscription-expired'
});
```

**Features**:
- Auto-checks subscription on mount
- Blocks access if expired/suspended
- Redirects to lock screen
- Manual refresh with `checkStatus()`

### 2. `SubscriptionExpiredScreen` Component
Full-page lock screen shown when subscription suspended/expired

**Features**:
- Clean Netflix-style UI
- Shows pricing (₹35,000/month + ₹5,000 setup)
- "Renew Now" CTA button
- Contact support option
- Data safety reassurance

### 3. `GracePeriodBanner` Component
Warning banner during grace period

**Usage**:
```jsx
import { GracePeriodBanner } from '../Components/SubscriptionBanners';

<GracePeriodBanner daysRemaining={2} />
```

### 4. `RenewalCountdown` Component
Shows days remaining on dashboard

**Usage**:
```jsx
import { RenewalCountdown } from '../Components/SubscriptionBanners';

<RenewalCountdown 
  daysRemaining={15} 
  status="active" 
  endDate="2025-12-01" 
/>
```

### 5. `TrialBanner` Component
Banner shown during trial period

### 6. `SubscriptionStatusBadge` Component
Status badge (Trial, Active, Grace, Suspended)

---

## 💳 Payment Integration

### Razorpay Helper (`subscriptionPaymentHelper.js`)

#### Simple Usage:
```jsx
import { processSubscriptionPayment } from '../lib/subscriptionPaymentHelper';

const handlePayment = async () => {
  try {
    const result = await processSubscriptionPayment({
      restaurantId: 'uuid',
      restaurantName: 'My Restaurant',
      email: 'owner@example.com',
      phone: '9876543210',
      paymentType: 'monthly_subscription' // or 'setup_fee'
    });
    
    console.log('Payment successful:', result);
    // { success: true, payment_id, subscription_id, new_end_date }
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

#### Backend API Endpoints Required:
1. **POST `/api/razorpay/create-order`**
   - Creates Razorpay order
   - Returns `{ id, amount, currency, notes }`

2. **POST `/api/razorpay/verify-payment`**
   - Verifies payment signature
   - Calls `process_payment_and_reactivate` function
   - Returns `{ payment_id, subscription_id, new_end_date }`

---

## 🎯 User Flows

### Flow 1: New Restaurant (Trial)
1. Restaurant signs up
2. `create_trial_subscription()` creates 3-day trial
3. `TrialBanner` shows days remaining
4. After 3 days → status changes to 'grace'
5. `GracePeriodBanner` shows "Payment Overdue"
6. After 3 more days → `auto_suspend_expired_subscriptions()` suspends
7. `SubscriptionExpiredScreen` blocks access

### Flow 2: Payment & Reactivation
1. User clicks "Renew Now"
2. Razorpay checkout opens
3. Payment completed
4. Backend calls `process_payment_and_reactivate()`
5. Subscription status → 'active'
6. Access restored immediately
7. New end_date = NOW() + 30 days

### Flow 3: Active Subscription Renewal
1. User has active subscription
2. `RenewalCountdown` shows days remaining
3. Before expiry, user pays
4. New end_date extends from current end_date + 30 days
5. No interruption

### Flow 4: Super Admin Manual Control
1. Super Admin views all subscriptions
2. Can manually suspend: `toggle_subscription_status(id, 'suspend', 'reason')`
3. Can manually reactivate: `toggle_subscription_status(id, 'reactivate')`

---

## 📧 Notification System

### Automatic Email/SMS Triggers:
- **3 days before expiry**: "Your subscription expires in 3 days"
- **1 day before expiry**: "Last day to renew"
- **On expiry day**: "Payment overdue - 3 days grace period"
- **3 days after expiry**: "Final warning - suspension today"

### Implementation:
Use `get_expiring_subscriptions(3)` to fetch restaurants needing notifications.

---

## 🔄 Cron Job Setup

### Option 1: Supabase Edge Function (Recommended)
```typescript
// supabase/functions/auto-suspend/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase
    .rpc('auto_suspend_expired_subscriptions');

  return new Response(JSON.stringify({ data, error }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Schedule**: Daily at 2 AM UTC via Supabase Cron

### Option 2: pg_cron
```sql
SELECT cron.schedule(
  'auto-suspend-expired',
  '0 2 * * *', -- 2 AM daily
  'SELECT auto_suspend_expired_subscriptions();'
);
```

---

## 🚀 Setup Instructions

### 1. Database Setup
```bash
# Run in Supabase SQL Editor
psql -f database/30_unified_subscription_system.sql
```

### 2. Environment Variables
```env
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx (backend only)
```

### 3. Install Dependencies
```bash
npm install
# Razorpay script loaded dynamically in helper
```

### 4. Add Routes
```jsx
// App.jsx
import SubscriptionExpiredScreen from './Components/SubscriptionExpiredScreen';

<Route path="/subscription-expired" element={<SubscriptionExpiredScreen />} />
```

### 5. Add Subscription Check to Dashboard
```jsx
// AdminDashboard.jsx
import { useSubscriptionGuard } from '../hooks/useSubscriptionGuard';
import { GracePeriodBanner, RenewalCountdown } from '../Components/SubscriptionBanners';

const Dashboard = () => {
  const { subscription, hasAccess, isInGracePeriod, daysRemaining } = useSubscriptionGuard({
    redirectOnExpired: true
  });

  if (!hasAccess) return null; // Will redirect

  return (
    <div>
      {isInGracePeriod && <GracePeriodBanner daysRemaining={daysRemaining} />}
      
      <RenewalCountdown 
        daysRemaining={daysRemaining}
        status={subscription?.status}
        endDate={subscription?.end_date}
      />
      
      {/* Rest of dashboard */}
    </div>
  );
};
```

---

## 📊 Super Admin Dashboard

### Subscription Management View
Shows all restaurants with:
- Restaurant name, email, phone
- Subscription status badge
- Days remaining
- Last payment date
- Total revenue
- Actions: Suspend, Reactivate, View Payments

### Payment History
- All payments for a restaurant
- Amount, date, status, receipt
- Filter by date range
- Export to CSV

---

## 🧪 Testing Checklist

### Trial Flow
- [ ] New restaurant gets 3-day trial
- [ ] Trial banner shows correct days
- [ ] After 3 days, status changes to 'grace'
- [ ] Grace banner appears

### Payment Flow
- [ ] Razorpay checkout opens
- [ ] Payment success reactivates subscription
- [ ] End date extends by 30 days
- [ ] Access restored immediately

### Suspension Flow
- [ ] After 3-day grace, status → 'suspended'
- [ ] Lock screen appears
- [ ] Dashboard inaccessible
- [ ] Data retained (no deletion)

### Reactivation Flow
- [ ] Payment on suspended account works
- [ ] Status changes to 'active'
- [ ] Access restored
- [ ] All data intact

### Super Admin
- [ ] View all subscriptions
- [ ] Manual suspend works
- [ ] Manual reactivate works
- [ ] Payment history visible

---

## 🔧 Troubleshooting

### Issue: Subscription not auto-suspending
**Solution**: Check if cron job is running. Verify `auto_suspend_expired_subscriptions()` executes.

### Issue: Payment successful but not reactivating
**Solution**: Check backend API `/api/razorpay/verify-payment` calls `process_payment_and_reactivate()`.

### Issue: RLS blocks subscription view
**Solution**: Ensure user has `restaurant_id` in users table or is `super_admin`.

### Issue: Razorpay checkout not opening
**Solution**: Check `VITE_RAZORPAY_KEY_ID` env variable. Verify script loaded.

---

## 📝 File Structure

```
database/
  └── 30_unified_subscription_system.sql

src/
  ├── hooks/
  │   └── useSubscriptionGuard.js
  ├── Components/
  │   ├── SubscriptionExpiredScreen.jsx
  │   └── SubscriptionBanners.jsx (Grace, Trial, Countdown, Badge)
  ├── lib/
  │   └── subscriptionPaymentHelper.js
  └── pages/
      └── Payment.jsx (to be created)
```

---

## 💡 Next Steps

1. **Run database migration**: `30_unified_subscription_system.sql`
2. **Set up Supabase Edge Function** for daily auto-suspension
3. **Build backend API** for Razorpay order creation & verification
4. **Add subscription check to login flow**
5. **Update RestaurantsListEnhanced** for Super Admin subscription management
6. **Set up email notifications** for expiry warnings
7. **Test full payment flow** in sandbox mode
8. **Go live** with production Razorpay keys

---

## 📞 Support

For questions or issues:
- Email: support@praahis.com
- Documentation: This file
- Database Functions: Check SQL comments in migration file

---

**Built with ❤️ for Praahis Restaurant Management Platform**
