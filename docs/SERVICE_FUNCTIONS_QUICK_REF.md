# Service Functions Quick Reference

## 📞 Import Statements

```javascript
// Main functions
import {
  applyDiscount,
  cancelOrder,
  processRefund,
  createComplaint,
  processSplitPayment,
  handleSplitPayment
} from '@shared/utils/api/supabaseClient';

// Complaint service
import complaintService, {
  ISSUE_TYPES,
  PRIORITIES,
  STATUSES
} from '@shared/utils/api/complaintService';
```

---

## ⚡ Quick Function Calls

### Apply Discount
```javascript
await applyDiscount(orderId, {
  type: 'percentage',  // or 'fixed'
  value: 10,
  amount: 100,
  reason: 'Loyalty discount',
  newTotal: 900
});
```

### Cancel Order (with refund)
```javascript
await cancelOrder(orderId, {
  reason: 'Customer request',
  refund: true,
  refundAmount: 500,
  refundMethod: 'cash'
});
```

### Process Refund
```javascript
await processRefund(orderId, {
  refundAmount: 500,
  reason: 'Wrong order',
  refundMethod: 'original_method'
});
```

### Split Payment
```javascript
await processSplitPayment(
  orderId,
  300,  // cash
  700,  // online
  'pay_razorpay123'
);
```

### Create Complaint
```javascript
await createComplaint({
  orderId,
  issueType: 'food_quality',
  description: 'Food was cold',
  priority: 'high'
});
```

---

## 🎯 Complaint Service Functions

### Create
```javascript
await complaintService.createComplaint({
  orderId: 'uuid',
  issueType: ISSUE_TYPES.FOOD_QUALITY,
  description: 'Food was cold and undercooked',
  priority: PRIORITIES.HIGH,
  reportedBy: userId
});
```

### Update
```javascript
await complaintService.updateComplaint(complaintId, {
  status: STATUSES.IN_PROGRESS,
  actionTaken: 'Remaking the dish'
});
```

### Get All (with filters)
```javascript
const { complaints } = await complaintService.getComplaintsByRestaurant(
  restaurantId,
  {
    status: STATUSES.OPEN,
    priority: PRIORITIES.HIGH,
    issueType: ISSUE_TYPES.WAIT_TIME,
    limit: 50
  }
);
```

### Mark Resolved
```javascript
await complaintService.markComplaintResolved(
  complaintId,
  'Provided complimentary dessert',
  managerId
);
```

### Get Stats
```javascript
const { stats } = await complaintService.getComplaintStats(
  restaurantId,
  startDate,
  endDate
);
```

---

## 📋 Valid Values

### Issue Types
```
food_quality | wrong_item | wait_time | service | cleanliness | billing | other
```

### Priorities
```
low | medium | high
```

### Statuses
```
open | in_progress | resolved | closed
```

### Discount Types
```
percentage | fixed
```

### Refund Methods
```
cash | online | original_method
```

### Payment Methods
```
cash | razorpay | upi | card | online | split
```

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Order ID is required" | Missing orderId | Pass valid UUID |
| "Invalid issue type" | Wrong string | Use ISSUE_TYPES constants |
| "Description must be at least 10 characters" | Too short | Add more detail |
| "Refund amount exceeds order total" | Math error | Check calculation |
| "Split payment total does not match" | Wrong amounts | Cash + Online = Total |

---

## 🔍 Testing Commands

```javascript
// Test discount
applyDiscount('order-uuid', {
  type: 'fixed',
  value: 50,
  amount: 50,
  reason: 'Test discount',
  newTotal: 450
}).then(console.log).catch(console.error);

// Test split payment
processSplitPayment('order-uuid', 200, 300, null)
  .then(r => console.log('Success:', r))
  .catch(e => console.error('Error:', e.message));

// Test complaint creation
complaintService.createComplaint({
  orderId: 'order-uuid',
  issueType: 'food_quality',
  description: 'Test complaint - food was cold',
  priority: 'medium'
}).then(console.log).catch(console.error);
```

---

## 📊 Response Formats

### Success Response
```javascript
{
  success: true,
  order: { /* updated order object */ },
  // or
  complaint: { /* complaint object */ },
  // or
  splitDetails: { /* payment details */ }
}
```

### Error Response
```javascript
throw new Error('Failed to ...: Specific error message');
```

---

## 💡 Pro Tips

1. **Always use try-catch** when calling service functions
2. **Use constants** for enum values (ISSUE_TYPES, PRIORITIES, etc.)
3. **Validate on frontend** before API call to avoid network overhead
4. **Show loading states** - these are async operations
5. **Toast notifications** for user feedback
6. **Check permissions** before allowing operations
7. **Log errors** for debugging
8. **Use TypeScript** for better type safety (if available)

---

## 🚀 Usage in Components

```jsx
import { useState } from 'react';
import { applyDiscount } from '@shared/utils/api/supabaseClient';
import toast from 'react-hot-toast';

function DiscountButton({ orderId, orderTotal }) {
  const [loading, setLoading] = useState(false);

  const handleDiscount = async () => {
    setLoading(true);
    try {
      const discountValue = 10; // 10%
      const discountAmount = (orderTotal * discountValue) / 100;
      const newTotal = orderTotal - discountAmount;

      await applyDiscount(orderId, {
        type: 'percentage',
        value: discountValue,
        amount: discountAmount,
        reason: 'Manager discount',
        newTotal
      });

      toast.success('Discount applied!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDiscount} disabled={loading}>
      {loading ? 'Applying...' : 'Apply 10% Discount'}
    </button>
  );
}
```

---

**Version**: 1.0  
**Last Updated**: November 21, 2025  
**Full Docs**: SERVICE_FUNCTIONS_UPDATE_SUMMARY.md
