# 💸 Refund System - Quick Reference

## For Managers/Staff

### How to Process a Refund

1. **Find the paid order** in Orders Tab
2. **Click [💸 Refund]** button on the order card
3. **Choose refund type:**
   - **Full Refund** - Refund entire amount
   - **Partial Refund** - Specify custom amount
4. **Enter amount** (if partial refund)
5. **Select refund reason** from dropdown
6. **Choose refund method:**
   - Original Payment Method
   - Cash Refund (immediate)
   - Online Reversal (3-7 days)
7. **Review summary** and click "Process Refund"

### When You Can Refund

✅ Order payment status is "Paid"  
✅ Order has not been fully refunded yet  
✅ Refund amount ≤ available amount

### When You Cannot Refund

❌ Order is not paid  
❌ Already fully refunded  
❌ No valid reason selected

---

## Refund Reasons Quick List

1. **Customer Request** - Customer changed mind
2. **Order Cancelled** - Order was cancelled
3. **Wrong Order** - Incorrect items delivered
4. **Quality Issue** - Food quality problems
5. **Service Issue** - Service problems
6. **Overcharge** - Customer was overcharged
7. **Duplicate Payment** - Paid twice by mistake
8. **Unavailable Items** - Items out of stock
9. **Late Delivery** - Delivery was late
10. **Other** - Any other reason

---

## Refund Methods

### 💳 Original Payment Method
- Reverses to the same method customer paid with
- Recommended for most refunds
- Timeline: 3-7 days for online payments

### 💵 Cash Refund
- Give cash to customer immediately
- Best for in-person refunds
- Timeline: Immediate

### 🔄 Online Reversal
- Process through payment gateway
- For online payments only
- Timeline: 3-7 business days

---

## For Developers

### Import Modal

```jsx
import { RefundModal } from '@domains/ordering/components/modals/RefundModal';
```

### Use in Component

```jsx
const [showRefundModal, setShowRefundModal] = useState(false);

const handleRefund = async (orderId, refundData) => {
  await processRefund(orderId, refundData);
  // Success!
};

<RefundModal
  order={order}
  isOpen={showRefundModal}
  onClose={() => setShowRefundModal(false)}
  onConfirmRefund={handleRefund}
/>
```

### Service Function

```javascript
import { processRefund } from '@shared/utils/api/supabaseClient';

const refundData = {
  refundAmount: 500.00,
  reason: 'customer_request',
  refundMethod: 'cash',
  alreadyRefunded: 0
};

const result = await processRefund(orderId, refundData);
// Returns: { success, refundAmount, newPaymentStatus, totalRefunded }
```

### Database Queries

**Get Refunded Orders:**
```sql
SELECT * FROM orders 
WHERE payment_status IN ('refunded', 'partially_refunded');
```

**Get Refund Details:**
```sql
SELECT 
  o.id,
  o.order_number,
  o.total,
  op.refund_amount,
  op.refund_reason,
  op.refund_method,
  op.refunded_at
FROM orders o
JOIN order_payments op ON o.id = op.order_id
WHERE op.refund_amount > 0;
```

**Refund Analytics:**
```sql
SELECT 
  DATE(refunded_at) as date,
  COUNT(*) as count,
  SUM(refund_amount) as total,
  refund_reason
FROM order_payments
WHERE refund_amount > 0
GROUP BY DATE(refunded_at), refund_reason;
```

---

## Tips & Best Practices

### For Staff
💡 **Always confirm** with customer before processing  
💡 **Choose correct reason** for accurate reporting  
💡 **Cash refunds** are fastest for in-person customers  
💡 **Document** any special circumstances  
💡 **Check available amount** before processing

### For Developers
💡 **Validate amount** on both frontend and backend  
💡 **Track cumulative refunds** to prevent over-refunding  
💡 **Log all refund actions** for audit trail  
💡 **Handle edge cases** (split payments, discounts)  
💡 **Test partial refunds** thoroughly

---

## Common Scenarios

### Scenario 1: Full Refund After Wrong Order
1. Customer received wrong order
2. Click [💸 Refund] → Select "Full Refund"
3. Reason: "Wrong Order Delivered"
4. Method: "Original Payment Method"
5. Process refund
6. Result: Order status → "Refunded"

### Scenario 2: Partial Refund for Missing Item
1. One item was missing from order
2. Click [💸 Refund] → Select "Partial Refund"
3. Enter amount (item price + proportional tax)
4. Reason: "Items Not Available"
5. Method: "Cash Refund"
6. Result: Order status → "Partially Refunded"

### Scenario 3: Multiple Partial Refunds
1. First refund: ₹200 for missing item
2. Second refund: ₹300 for quality issue
3. Total refunded: ₹500 out of ₹1000
4. Available: ₹500
5. Can continue until fully refunded

---

## Troubleshooting

### Button Not Showing
- ✓ Check order is paid (`payment_status = 'paid'`)
- ✓ Check order is not served/cancelled
- ✓ Refresh page

### Refund Failed
- ✓ Check available amount
- ✓ Verify refund reason selected
- ✓ Ensure refund method chosen
- ✓ Check console for errors

### Amount Validation Error
- ✓ Amount must be > 0
- ✓ Amount must be ≤ available
- ✓ Use decimal format (e.g., 50.00)

### Already Refunded Warning
- ✓ Order was already fully refunded
- ✓ Check `order_payments.refund_amount`
- ✓ View refund history

---

## Report Integration

Refunds are automatically tracked in:
- **Sales & Revenue Report** → "Refunds" metric
- **Net Revenue** = Total Revenue - Refunds
- **Daily Reports** → Includes refund totals

Access reports from: **Manager Dashboard → Reports Tab**

---

## Quick Stats

View refund statistics:
```sql
-- Today's refunds
SELECT SUM(refund_amount) as today_refunds
FROM order_payments
WHERE DATE(refunded_at) = CURRENT_DATE;

-- This month's refunds
SELECT SUM(refund_amount) as month_refunds
FROM order_payments
WHERE DATE_TRUNC('month', refunded_at) = DATE_TRUNC('month', CURRENT_DATE);

-- Refund rate
SELECT 
  COUNT(CASE WHEN refund_amount > 0 THEN 1 END)::float / COUNT(*) * 100 as refund_rate
FROM order_payments;
```

---

## Support

For issues or questions:
1. Check this guide first
2. Review REFUND_IMPLEMENTATION.md
3. Check console logs
4. Contact technical support
