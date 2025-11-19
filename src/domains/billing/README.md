# 💳 Billing Domain

## Overview
The Billing domain manages all financial transactions, payments, subscriptions, and billing operations for the Praahis platform. It handles payment processing, invoice generation, subscription management, refunds, and financial reporting for restaurants and customers.

---

## 📂 Structure

```
src/domains/billing/
├── components/
│   ├── PaymentMethodCard.jsx     # Payment method display
│   ├── PricingCard.jsx           # Subscription pricing card
│   ├── SubscriptionCard.jsx      # Subscription status card
│   └── TransactionHistory.jsx    # Transaction list
├── hooks/
│   ├── usePayment.js             # Payment processing hook
│   └── useSubscription.js        # Subscription management hook
├── utils/
│   ├── billingHelpers.js         # Billing calculations
│   └── paymentProcessor.js       # Payment gateway integration
├── events.js                     # Domain events
└── index.js                      # Public API exports
```

---

## 🎯 Purpose

### Business Capabilities
- Payment processing (online and offline)
- Subscription management (plans, upgrades, downgrades)
- Invoice generation and tracking
- Refund processing
- Transaction history and reporting
- Multi-currency support
- Tax calculations
- Payment method management

### Technical Responsibilities
- Payment gateway integration (Razorpay, Stripe)
- Secure payment token handling
- Subscription lifecycle management
- Billing cycle automation
- Invoice PDF generation
- Payment retry logic
- Webhook handling for payment events

---

## 🔌 Public API

### Components

#### `PricingCard`
```jsx
import { PricingCard } from '@domains/billing';

<PricingCard
  plan={{
    id: 'plan-basic',
    name: 'Basic',
    price: 999,
    interval: 'month',
    features: [
      '100 orders/month',
      'Basic analytics',
      'Email support'
    ],
    recommended: false
  }}
  currentPlan="plan-free"
  onSelect={(planId) => console.log('Selected:', planId)}
  loading={false}
/>
```

**Props:**
- `plan` (object, required): Plan details
- `currentPlan` (string, optional): Current active plan ID
- `onSelect` (function, required): Plan selection handler
- `loading` (boolean, optional): Loading state
- `showFeatures` (boolean, optional): Show/hide features list

**Features:**
- Plan comparison
- Highlighted recommended plan
- Feature list with checkmarks
- Price display with interval
- CTA button with states
- Discount badges

---

#### `SubscriptionCard`
```jsx
import { SubscriptionCard } from '@domains/billing';

<SubscriptionCard
  subscription={{
    id: 'sub-123',
    plan: 'Basic',
    status: 'active',
    currentPeriodStart: '2025-11-01',
    currentPeriodEnd: '2025-12-01',
    cancelAtPeriodEnd: false,
    amount: 999
  }}
  onCancel={() => {}}
  onResume={() => {}}
  onUpgrade={() => {}}
/>
```

**Props:**
- `subscription` (object, required): Subscription data
- `onCancel` (function, optional): Cancel subscription handler
- `onResume` (function, optional): Resume subscription handler
- `onUpgrade` (function, optional): Upgrade plan handler
- `showActions` (boolean, optional): Show action buttons

**Features:**
- Status badge (active, cancelled, expired)
- Billing cycle display
- Auto-renewal indicator
- Quick actions (cancel, resume, upgrade)
- Payment method display
- Next billing date

---

#### `TransactionHistory`
```jsx
import { TransactionHistory } from '@domains/billing';

<TransactionHistory
  transactions={transactions}
  filters={{
    type: ['payment', 'refund'],
    status: ['completed'],
    dateRange: { start: '2025-01-01', end: '2025-12-31' }
  }}
  onViewDetails={(txn) => {}}
  onDownloadInvoice={(txnId) => {}}
/>
```

**Props:**
- `transactions` (array, required): Transaction list
- `filters` (object, optional): Active filters
- `onViewDetails` (function, optional): View transaction details
- `onDownloadInvoice` (function, optional): Download invoice PDF
- `pagination` (object, optional): Pagination config

**Features:**
- Sortable columns
- Status filters
- Date range picker
- Amount formatting
- Invoice download
- Transaction details modal
- Export to CSV

---

#### `PaymentMethodCard`
```jsx
import { PaymentMethodCard } from '@domains/billing';

<PaymentMethodCard
  paymentMethod={{
    id: 'pm-123',
    type: 'card',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2028,
    isDefault: true
  }}
  onSetDefault={(pmId) => {}}
  onDelete={(pmId) => {}}
  showActions={true}
/>
```

**Props:**
- `paymentMethod` (object, required): Payment method data
- `onSetDefault` (function, optional): Set as default handler
- `onDelete` (function, optional): Delete payment method
- `showActions` (boolean, optional): Show action buttons

---

### Hooks

#### `usePayment`
```jsx
import { usePayment } from '@domains/billing';

function CheckoutPage() {
  const {
    processPayment,
    loading,
    error,
    paymentMethods,
    addPaymentMethod
  } = usePayment({
    restaurantId: 'restaurant-123'
  });

  const handlePay = async (amount) => {
    const result = await processPayment({
      amount,
      currency: 'INR',
      method: 'card',
      orderId: 'order-456'
    });

    if (result.success) {
      toast.success('Payment successful');
    }
  };

  return <PaymentForm onSubmit={handlePay} loading={loading} />;
}
```

**Parameters:**
- `restaurantId` (string, required): Restaurant ID

**Returns:**
```javascript
{
  processPayment: fn,          // Process payment function
  loading: false,              // Loading state
  error: null,                 // Error object
  paymentMethods: [],          // Saved payment methods
  addPaymentMethod: fn,        // Add new payment method
  deletePaymentMethod: fn,     // Delete payment method
  setDefaultPaymentMethod: fn  // Set default payment method
}
```

---

#### `useSubscription`
```jsx
import { useSubscription } from '@domains/billing';

function SubscriptionPage() {
  const {
    subscription,
    plans,
    loading,
    subscribe,
    cancelSubscription,
    upgradeSubscription
  } = useSubscription({
    restaurantId: 'restaurant-123'
  });

  const handleUpgrade = async (newPlanId) => {
    await upgradeSubscription(newPlanId);
    toast.success('Subscription upgraded');
  };

  return (
    <div>
      <SubscriptionCard subscription={subscription} />
      <PricingPlans plans={plans} onSelect={handleUpgrade} />
    </div>
  );
}
```

**Parameters:**
- `restaurantId` (string, required): Restaurant ID

**Returns:**
```javascript
{
  subscription: {},            // Current subscription
  plans: [],                   // Available plans
  loading: false,              // Loading state
  error: null,                 // Error object
  subscribe: fn,               // Subscribe to plan
  cancelSubscription: fn,      // Cancel subscription
  upgradeSubscription: fn,     // Upgrade to new plan
  downgradeSubscription: fn,   // Downgrade to lower plan
  resumeSubscription: fn       // Resume cancelled subscription
}
```

---

### Utilities

#### `billingHelpers.js`

```javascript
import {
  calculateTax,
  calculateDiscount,
  generateInvoice,
  formatAmount,
  validatePaymentData
} from '@domains/billing';
```

##### `calculateTax(amount, taxRate, region)`
Calculate tax amount.

```javascript
const tax = calculateTax(1000, 0.18, 'IN');
// Returns: { amount: 1000, tax: 180, total: 1180 }
```

**Parameters:**
- `amount` (number, required): Base amount
- `taxRate` (number, required): Tax rate (0.18 = 18%)
- `region` (string, optional): Region code for tax rules

**Returns:** Tax breakdown object

---

##### `calculateDiscount(amount, discount)`
Calculate discount amount.

```javascript
const discounted = calculateDiscount(1000, {
  type: 'percentage',
  value: 10
});
// Returns: { original: 1000, discount: 100, final: 900 }

const fixed = calculateDiscount(1000, {
  type: 'fixed',
  value: 150
});
// Returns: { original: 1000, discount: 150, final: 850 }
```

**Parameters:**
- `amount` (number, required): Original amount
- `discount` (object, required): Discount configuration
  - `type` (string): 'percentage' | 'fixed'
  - `value` (number): Discount value

**Returns:** Discount breakdown object

---

##### `generateInvoice(transaction, options)`
Generate invoice PDF or data.

```javascript
const invoice = await generateInvoice(transaction, {
  format: 'pdf',
  includeDetails: true,
  template: 'standard'
});

// Returns: {
//   invoiceNumber: 'INV-2025-001',
//   pdfUrl: 'https://...',
//   downloadUrl: 'https://...'
// }
```

**Parameters:**
- `transaction` (object, required): Transaction data
- `options` (object, optional): Generation options

**Returns:** Promise<Invoice>

---

##### `formatAmount(amount, currency)`
Format amount with currency symbol.

```javascript
const formatted = formatAmount(1250, 'INR');
// Returns: '₹1,250.00'

const usd = formatAmount(1250, 'USD');
// Returns: '$1,250.00'
```

**Parameters:**
- `amount` (number, required): Amount to format
- `currency` (string, optional): Currency code (default: 'INR')

**Returns:** Formatted string

---

#### `paymentProcessor.js`

```javascript
import {
  initializePayment,
  verifyPayment,
  processRefund,
  capturePayment
} from '@domains/billing';
```

##### `initializePayment(paymentData)`
Initialize payment with gateway.

```javascript
const paymentSession = await initializePayment({
  amount: 1000,
  currency: 'INR',
  orderId: 'order-123',
  customerId: 'customer-456',
  method: 'card',
  metadata: { orderType: 'dine-in' }
});

// Returns: {
//   sessionId: 'sess_xyz',
//   paymentUrl: 'https://payment.gateway.com/...',
//   expiresAt: '2025-11-08T11:00:00Z'
// }
```

**Parameters:**
- `paymentData` (object, required): Payment details

**Returns:** Promise<PaymentSession>

---

##### `verifyPayment(paymentId, signature)`
Verify payment completion.

```javascript
const verified = await verifyPayment('pay_123', 'signature_abc');

if (verified.success) {
  // Payment confirmed
  await completeOrder(orderId);
}
```

**Parameters:**
- `paymentId` (string, required): Payment ID from gateway
- `signature` (string, required): Payment signature

**Returns:** Promise<VerificationResult>

---

##### `processRefund(transactionId, amount, reason)`
Process refund for a transaction.

```javascript
const refund = await processRefund('txn-123', 500, 'customer_request');

// Returns: {
//   refundId: 'refund-456',
//   status: 'processed',
//   amount: 500,
//   processedAt: '2025-11-08T10:45:00Z'
// }
```

**Parameters:**
- `transactionId` (string, required): Original transaction ID
- `amount` (number, required): Refund amount
- `reason` (string, required): Refund reason

**Returns:** Promise<Refund>

---

## 🔔 Events

This domain emits the following events:

### `PAYMENT_INITIATED`
```javascript
{
  type: 'PAYMENT_INITIATED',
  payload: {
    paymentId: 'pay-123',
    orderId: 'order-456',
    amount: 1320,
    currency: 'INR',
    method: 'card',
    timestamp: '2025-11-08T10:30:00Z'
  }
}
```

### `PAYMENT_COMPLETED`
```javascript
{
  type: 'PAYMENT_COMPLETED',
  payload: {
    paymentId: 'pay-123',
    transactionId: 'txn-789',
    orderId: 'order-456',
    amount: 1320,
    status: 'success',
    completedAt: '2025-11-08T10:31:00Z'
  }
}
```

### `PAYMENT_FAILED`
```javascript
{
  type: 'PAYMENT_FAILED',
  payload: {
    paymentId: 'pay-123',
    orderId: 'order-456',
    error: 'insufficient_funds',
    message: 'Payment declined by bank'
  }
}
```

### `SUBSCRIPTION_CREATED`
```javascript
{
  type: 'SUBSCRIPTION_CREATED',
  payload: {
    subscriptionId: 'sub-123',
    restaurantId: 'restaurant-123',
    planId: 'plan-basic',
    amount: 999,
    interval: 'month'
  }
}
```

### `SUBSCRIPTION_CANCELLED`
```javascript
{
  type: 'SUBSCRIPTION_CANCELLED',
  payload: {
    subscriptionId: 'sub-123',
    cancelledAt: '2025-11-08T10:30:00Z',
    cancelAtPeriodEnd: true,
    reason: 'user_request'
  }
}
```

### `REFUND_PROCESSED`
```javascript
{
  type: 'REFUND_PROCESSED',
  payload: {
    refundId: 'refund-456',
    transactionId: 'txn-789',
    amount: 500,
    reason: 'customer_request',
    processedAt: '2025-11-08T10:45:00Z'
  }
}
```

---

## 📊 Database Schema

### `transactions` table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'payment', 'refund', 'subscription'
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  payment_method TEXT,
  payment_gateway TEXT, -- 'razorpay', 'stripe', 'cash'
  gateway_transaction_id TEXT,
  gateway_response JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### `subscriptions` table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL, -- 'active', 'cancelled', 'expired', 'past_due'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `payment_methods` table
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'card', 'upi', 'bank_account'
  provider TEXT NOT NULL, -- 'razorpay', 'stripe'
  provider_payment_method_id TEXT,
  is_default BOOLEAN DEFAULT false,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 Dependencies

### Internal Dependencies
```javascript
// Shared utilities
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency } from '@shared/utils/helpers/formatters';

// Shared components
import { Button } from '@shared/components/primitives/Button';
import { Modal } from '@shared/components/compounds/Modal';
```

### External Dependencies
- `razorpay` - Payment gateway (India)
- `stripe` - Payment gateway (International)
- `pdfkit` - PDF invoice generation
- `date-fns` - Date calculations

---

## 🎨 Usage Examples

### Example 1: Process Payment
```jsx
import { usePayment } from '@domains/billing';
import { useOrder } from '@domains/ordering';

function CheckoutPage() {
  const { order } = useOrder();
  const { processPayment, loading } = usePayment({
    restaurantId: order.restaurant_id
  });

  const handlePayment = async (paymentMethod) => {
    try {
      const result = await processPayment({
        amount: order.total_amount,
        currency: 'INR',
        orderId: order.id,
        method: paymentMethod
      });

      if (result.success) {
        // Redirect to success page
        navigate(`/order/${order.id}/success`);
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message);
    }
  };

  return (
    <div>
      <OrderSummary order={order} />
      <PaymentMethodSelector onSelect={handlePayment} />
      {loading && <LoadingSpinner />}
    </div>
  );
}
```

### Example 2: Subscription Management
```jsx
import { useSubscription, PricingCard } from '@domains/billing';

function SubscriptionManagement() {
  const { subscription, plans, upgradeSubscription } = useSubscription({
    restaurantId: restaurantId
  });

  const handleUpgrade = async (planId) => {
    const confirmed = await confirmDialog({
      title: 'Upgrade Subscription',
      message: 'Are you sure you want to upgrade?'
    });

    if (confirmed) {
      await upgradeSubscription(planId);
      toast.success('Subscription upgraded successfully');
    }
  };

  return (
    <div>
      <h2>Current Plan: {subscription.plan.name}</h2>
      
      <div className="pricing-grid">
        {plans.map(plan => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentPlan={subscription.plan_id}
            onSelect={handleUpgrade}
          />
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Invoice Generation
```jsx
import { generateInvoice } from '@domains/billing';

async function downloadInvoice(transactionId) {
  const transaction = await fetchTransaction(transactionId);
  
  const invoice = await generateInvoice(transaction, {
    format: 'pdf',
    includeDetails: true,
    template: 'standard'
  });

  // Trigger download
  window.open(invoice.downloadUrl, '_blank');
}
```

---

## 🧪 Testing

### Unit Tests
```javascript
describe('billingHelpers', () => {
  it('should calculate tax correctly', () => {
    const result = calculateTax(1000, 0.18);
    expect(result.tax).toBe(180);
    expect(result.total).toBe(1180);
  });

  it('should calculate percentage discount', () => {
    const result = calculateDiscount(1000, { type: 'percentage', value: 10 });
    expect(result.discount).toBe(100);
    expect(result.final).toBe(900);
  });
});
```

### Integration Tests
```javascript
it('should process payment end-to-end', async () => {
  // Initialize payment
  const session = await initializePayment({
    amount: 1000,
    currency: 'INR',
    orderId: 'order-123'
  });

  // Simulate payment completion
  const verified = await verifyPayment(session.paymentId, 'signature');
  
  expect(verified.success).toBe(true);
  
  // Check order status updated
  const order = await fetchOrder('order-123');
  expect(order.payment_status).toBe('completed');
});
```

---

## 🔐 Security

### Payment Security
- PCI DSS compliant
- Tokenized payment methods
- Encrypted transaction data
- Secure webhook verification
- 3D Secure support

### RLS Policies
- Users can only view their own transactions
- Restaurants can view their transactions
- Payment methods are user-scoped
- Sensitive data is encrypted

---

## 🚀 Performance

### Optimization Strategies
- **Webhook processing:** Async background jobs
- **Caching:** Cache subscription plans
- **Batch operations:** Bulk invoice generation
- **Lazy loading:** Load transaction history on demand

### Metrics
- Payment initialization: <500ms
- Payment verification: <200ms
- Invoice generation: <2s
- Subscription check: <100ms

---

## 🔄 Cross-Domain Integration

### Receives Events From:
- **Ordering Domain:** Order completion for payment
- **Staff Domain:** Manual payment recording

### Sends Events To:
- **Ordering Domain:** Payment confirmation
- **Notifications Domain:** Payment receipts
- **Analytics Domain:** Revenue metrics

---

## 📝 Future Enhancements

- [ ] Multiple currency support
- [ ] Installment payments
- [ ] Automatic billing retry
- [ ] Dunning management
- [ ] Tax compliance automation
- [ ] Payment analytics dashboard
- [ ] Fraud detection
- [ ] Wallet functionality

---

**Domain Owner:** Billing Team  
**Last Updated:** November 8, 2025  
**Version:** 1.0.0
