# Payment Dropdown - Quick Reference Guide

## 🚀 Quick Start

### 1. Using the Payment Dropdown

```jsx
import { PaymentActionsDropdown } from '@domains/ordering/components/PaymentActionsDropdown';

<PaymentActionsDropdown
  onAction={(type) => {
    if (type === 'cash') openCashModal();
    if (type === 'online') openOnlineModal();
    if (type === 'split') openSplitModal();
  }}
  disabled={false}
/>
```

---

## 💵 Cash Payment Modal

### Features

**Denominations Helper:**
```
[₹2000] [₹500] [₹200] [₹100]
[₹50]   [₹20]  [₹10]  [Exact Amount]
```

**Auto Change Calculation:**
- Input: ₹1000
- Total: ₹750
- Change: ₹250 (auto-calculated)

**Print Receipt:**
- [✓] Print Receipt (checkbox)
- Included in payment data

### Usage

```jsx
<CashPaymentModal
  order={{ total_amount: 750, order_number: 'ORD-001' }}
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={(data) => {
    console.log(data);
    // {
    //   method: 'cash',
    //   amount: 750,
    //   cashReceived: 1000,
    //   change: 250,
    //   printReceipt: true
    // }
  }}
/>
```

---

## 💳 Online Payment Modal

### Features

**QR Code:**
- Toggle Show/Hide
- 200×200px scannable code
- UPI deep link embedded

**Copy UPI ID:**
- One-click copy
- Visual feedback (2s)
- restaurant@paytm

**Open in UPI App:**
- Direct link to PhonePe, GPay, Paytm
- Pre-filled amount and order details

### Usage

```jsx
<ConfirmOnlinePaymentModal
  order={{ total_amount: 750, order_number: 'ORD-001' }}
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={(data) => {
    console.log(data);
    // {
    //   method: 'online',
    //   amount: 750,
    //   gateway: 'UPI',
    //   transactionId: 'TXN123' // optional
    // }
  }}
/>
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# .env
VITE_UPI_ID=restaurant@paytm
VITE_MERCHANT_NAME=My Restaurant
```

### Custom Denominations

Edit `CashPaymentModal.jsx`:
```javascript
const denominations = [2000, 500, 200, 100, 50, 20, 10];
// Add/remove as needed
```

### Payment Gateways

Edit `ConfirmOnlinePaymentModal.jsx`:
```javascript
const paymentGateways = [
  'UPI',
  'Razorpay',
  'PhonePe',
  'Paytm',
  'Google Pay',
  'Other'
];
```

---

## 📱 Mobile Features

### Dropdown Positioning
- **Mobile:** Left-aligned
- **Desktop:** Right-aligned

### Button Text
- **Mobile:** "Pay"
- **Desktop:** "Mark Paid"

### Touch Targets
- All buttons ≥ 44px
- Adequate spacing
- Active press feedback

---

## 🎨 Visual Guide

### Cash Payment Flow

```
1. Click [Mark Paid ▼]
2. Select "Full Cash Payment"
3. Modal opens:
   ┌─────────────────────────┐
   │ Order Total: ₹750      │
   ├─────────────────────────┤
   │ Cash Received: [____]   │
   │ [Show Helper] →         │
   │   [₹500] [₹200] [₹50]  │
   │   [Exact Amount]        │
   ├─────────────────────────┤
   │ Change: ₹250           │
   ├─────────────────────────┤
   │ [✓] Print Receipt       │
   ├─────────────────────────┤
   │ [Cancel] [Confirm]      │
   └─────────────────────────┘
```

### Online Payment Flow

```
1. Click [Mark Paid ▼]
2. Select "Full Online Payment"
3. Modal opens:
   ┌─────────────────────────┐
   │ Order Total: ₹750      │
   ├─────────────────────────┤
   │ [Show QR] →            │
   │   ▀▀▀▀▀▀▀▀▀▀▀▀▀        │
   │   █ QR CODE █          │
   │   ▄▄▄▄▄▄▄▄▄▄▄▄▄        │
   │                         │
   │ UPI: restaurant@paytm   │
   │ [Copy] [Open in App]    │
   ├─────────────────────────┤
   │ Gateway: [UPI ▼]       │
   │ Transaction ID: [____]  │
   ├─────────────────────────┤
   │ [✓] Payment verified    │
   ├─────────────────────────┤
   │ [Cancel] [Confirm]      │
   └─────────────────────────┘
```

---

## 🧪 Testing Shortcuts

### Cash Payment

```javascript
// Test exact amount
handleExactAmount(); // Sets exact order total

// Test denominations
handleDenominationClick(500); // Adds ₹500
handleDenominationClick(200); // Adds ₹200
// Total: ₹700

// Test validation
setCashReceived('100'); // Should show error if total > 100
```

### Online Payment

```javascript
// Test QR code
setShowQRCode(true);  // Display QR

// Test UPI copy
handleCopyUPI();      // Copy to clipboard
// copiedUPI = true for 2 seconds

// Test UPI link
const link = generateUPIString();
console.log(link);
// upi://pay?pa=restaurant@paytm&...
```

---

## 🐛 Common Issues & Fixes

### Issue: QR Code not showing
```javascript
// Fix 1: Check package installed
npm install react-qr-code

// Fix 2: Verify import
import QRCode from 'react-qr-code';

// Fix 3: Check state
console.log(showQRCode); // Should be true
```

### Issue: Copy button not working
```javascript
// Fix 1: Check HTTPS
// Clipboard API requires secure context

// Fix 2: Check browser support
if (navigator.clipboard) {
  // Supported
} else {
  // Use fallback
}
```

### Issue: Denominations not adding
```javascript
// Fix: Check parseFloat
const current = parseFloat(cashReceived) || 0;
// Use || 0 to handle NaN
```

---

## 💡 Tips & Tricks

### Tip 1: Auto-hide denominations
When adding denominations, the helper auto-hides if amount ≥ total.

### Tip 2: Keyboard shortcuts
- **Enter** = Confirm payment
- **Esc** = Close modal

### Tip 3: Quick exact amount
Click "Exact Amount" button to instantly set the order total.

### Tip 4: Print receipt default
Print receipt is checked by default. Uncheck if not needed.

### Tip 5: Mobile QR scanning
QR code is optimized for mobile camera scanning with high error correction.

---

## 📊 Data Flow

```
User Clicks Payment
       ↓
PaymentActionsDropdown
       ↓
  onAction('cash')
       ↓
CashPaymentModal Opens
       ↓
User Enters Amount
       ↓
System Calculates Change
       ↓
User Clicks Confirm
       ↓
onSuccess(paymentData)
       ↓
Parent Component
       ↓
Save to Database
       ↓
Update Order Status
       ↓
Print Receipt (if enabled)
```

---

## 🔗 Related Components

- **SplitPaymentModal** - Combine cash + online
- **OrderCard** - Uses PaymentActionsDropdown
- **ManagerDashboard** - Payment management

---

## 📞 Quick Help

### Where are the modals?
```
src/domains/ordering/components/modals/
├── CashPaymentModal.jsx
├── ConfirmOnlinePaymentModal.jsx
└── SplitPaymentModal.jsx
```

### Where is the dropdown?
```
src/domains/ordering/components/
└── PaymentActionsDropdown.jsx
```

### How to customize colors?
```javascript
// Cash: Emerald (green)
className="bg-emerald-600"

// Online: Blue
className="bg-blue-600"

// Split: Purple
className="bg-purple-600"
```

---

## ✅ Checklist

Before deployment:

- [ ] Set UPI ID in environment variables
- [ ] Test cash payment with various amounts
- [ ] Test QR code scanning
- [ ] Test UPI ID copy
- [ ] Test on mobile devices
- [ ] Test print receipt functionality
- [ ] Verify all gateways listed
- [ ] Check error handling
- [ ] Test loading states
- [ ] Verify data sent to backend

---

## 🚀 Next Steps

1. **Deploy to staging**
2. **Test with real devices**
3. **Configure print server**
4. **Train staff on new features**
5. **Monitor payment success rates**

---

**Version:** 1.0  
**Last Updated:** 21 November 2025  
**Quick Reference:** `PAYMENT_DROPDOWN_IMPLEMENTATION.md`
