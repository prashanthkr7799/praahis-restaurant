# 🚀 Order Cancellation - Quick Reference

## For Managers/Staff

### How to Cancel an Order

1. **Navigate to Orders Tab** in Manager Dashboard
2. **Find the order** you want to cancel
3. **Click the Cancel button** (❌) on the order card
4. **Select a reason** from the dropdown
5. **Add notes** (optional) for additional context
6. **Check refund option** if order was paid
7. **Review the confirmation checklist**
8. **Click "Confirm Cancellation"**

### When You CAN Cancel

✅ Order status is "Received"  
✅ Order status is "Preparing"  
✅ Order status is "Ready"  
✅ Payment is pending  
✅ Payment is completed (with refund option)

### When You CANNOT Cancel

❌ Order status is "Served"  
❌ Order is already cancelled

### Cancellation Reasons

1. **Customer Request** - Customer changed their mind
2. **Items Unavailable** - Out of stock ingredients
3. **Kitchen Delay** - Too busy to fulfill
4. **Wrong Order** - Incorrect order placed
5. **Payment Issue** - Payment problems
6. **Duplicate** - Order placed twice
7. **Quality Concern** - Food quality issues
8. **No-Show** - Customer didn't arrive
9. **Staff Error** - Mistake by staff
10. **Other** - Any other reason

---

## For Developers

### Import the Modal

```jsx
import { CancelOrderModal } from './modals/CancelOrderModal';
```

### Use in Component

```jsx
const [showCancelModal, setShowCancelModal] = useState(false);

const handleCancelOrder = async (orderId, cancelData) => {
  await cancelOrder(orderId, cancelData);
  // Handle success/error
};

<CancelOrderModal
  order={order}
  isOpen={showCancelModal}
  onClose={() => setShowCancelModal(false)}
  onConfirmCancel={handleCancelOrder}
/>
```

### Service Function

```javascript
import { cancelOrder } from '@shared/utils/api/supabaseClient';

await cancelOrder(orderId, {
  reason: 'customer_request',
  notes: 'Customer called to cancel',
  refund: true,
  refundAmount: 500.00
});
```

### Database Columns

```sql
SELECT 
  order_status,
  cancelled_at,
  cancellation_reason,
  cancellation_notes
FROM orders
WHERE order_status = 'cancelled';
```

---

## Filter Cancelled Orders

In Manager Dashboard → Orders Tab:

1. Click **Filter** button
2. Check **"Cancelled"** in Order Status
3. Orders are filtered instantly

---

## Real-time Updates

- Kitchen dashboard automatically updates
- No manual notification needed
- Uses Supabase real-time subscriptions
- All connected users see changes instantly

---

## Tips

💡 **Always add notes** - Helps with future analysis  
💡 **Check refund option** - For paid orders  
💡 **Inform customer** - Before cancelling  
💡 **Notify kitchen** - Stop food preparation  
💡 **Use correct reason** - For accurate reporting
