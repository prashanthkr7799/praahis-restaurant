# Multi-Payment Gateway Implementation

## Overview

Praahis now supports multiple payment gateways, allowing each restaurant to choose their preferred payment provider:

- **Razorpay** (default) - Popup-based checkout
- **PhonePe** - Redirect-based checkout
- **Paytm** - Redirect-based checkout

## Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `src/domains/billing/utils/paymentGateway.js` | Gateway abstraction layer with factory pattern |
| `src/domains/billing/components/PaymentGatewayConfig.jsx` | Admin UI to configure gateway per restaurant |
| `src/pages/customer/PaymentCallbackPage.jsx` | Handle redirect returns from PhonePe/Paytm |
| `supabase/functions/create-payment-order/index.ts` | Unified Edge Function for all gateways |
| `phase3_migrations/20_multi_payment_gateway_support.sql` | Database schema for multi-gateway support |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.jsx` | Added PaymentCallbackPage route |
| `src/pages/manager/PaymentSettingsPage.jsx` | Integrated PaymentGatewayConfig component |
| `src/domains/billing/index.js` | Exported new components and utilities |

## Database Schema Changes

```sql
-- New columns on restaurants table
payment_provider TEXT DEFAULT 'razorpay' CHECK (payment_provider IN ('razorpay', 'phonepe', 'paytm'))
phonepe_merchant_id TEXT
phonepe_salt_key TEXT
phonepe_salt_index TEXT DEFAULT '1'
paytm_merchant_id TEXT
paytm_merchant_key TEXT

-- New columns on order_payments table
gateway_provider TEXT DEFAULT 'razorpay'
gateway_order_id TEXT
gateway_payment_id TEXT
gateway_signature TEXT
```

## Usage

### For Restaurant Managers

1. Go to **Settings → Payment Settings**
2. Select your preferred payment gateway (Razorpay, PhonePe, or Paytm)
3. Enter your credentials
4. Save settings

### For Developers

```javascript
import { PaymentGatewayFactory } from '@/domains/billing/utils/paymentGateway';

// Create gateway instance for restaurant
const gateway = await PaymentGatewayFactory.create(restaurantId);

// Initiate payment
await gateway.initiatePayment({
  orderId: order.id,
  orderNumber: order.order_number,
  amount: order.total,
  customerName: 'John Doe',
  customerPhone: '9876543210',
}, {
  onSuccess: (response) => {
    console.log('Payment successful:', response);
  },
  onFailure: (error) => {
    console.error('Payment failed:', error);
  },
  onDismiss: () => {
    console.log('Payment cancelled');
  },
});
```

## Deployment Steps

1. **Run the database migration:**
   ```bash
   # In Supabase SQL Editor or via CLI
   psql -f phase3_migrations/20_multi_payment_gateway_support.sql
   ```

2. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy create-payment-order
   ```

3. **Add environment variables** (Supabase Dashboard → Edge Functions → Secrets):
   ```env
   # PhonePe (optional - for platform fallback)
   PHONEPE_MERCHANT_ID=xxx
   PHONEPE_SALT_KEY=xxx
   PHONEPE_SALT_INDEX=1
   PHONEPE_ENVIRONMENT=UAT  # or PRODUCTION

   # Paytm (optional - for platform fallback)
   PAYTM_MERCHANT_ID=xxx
   PAYTM_MERCHANT_KEY=xxx
   PAYTM_ENVIRONMENT=STAGING  # or PRODUCTION
   ```

4. **Deploy frontend:**
   ```bash
   npm run build
   # Deploy to Vercel or your hosting provider
   ```

## Payment Flow Comparison

| Gateway | Checkout Type | Flow |
|---------|---------------|------|
| Razorpay | Popup | Customer stays on page, popup opens |
| PhonePe | Redirect | Customer redirected to PhonePe, returns to `/payment-callback` |
| Paytm | Redirect | Customer redirected to Paytm, returns to `/payment-callback` |

## Security Notes

- Secret keys are only stored in database and used server-side (Edge Functions)
- Public keys (key_id, merchant_id) are exposed to frontend for SDK initialization
- All credential changes are logged in `payment_credential_audit` table
- PhonePe/Paytm use SHA256 checksum for signature verification

## Testing

### Razorpay Test Mode
- Use keys starting with `rzp_test_`
- Test card: 4111 1111 1111 1111
- Test UPI: success@razorpay

### PhonePe UAT
- Set `PHONEPE_ENVIRONMENT=UAT`
- Use sandbox merchant credentials

### Paytm Staging
- Set `PAYTM_ENVIRONMENT=STAGING`
- Use staging merchant credentials
