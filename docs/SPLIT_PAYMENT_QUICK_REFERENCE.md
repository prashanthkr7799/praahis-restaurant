# Split Payment - Quick Reference

## 🚀 Setup (One-Time)

### 1. Run Database Migration
```sql
-- In Supabase SQL Editor, run:
-- File: phase3_migrations/17_split_payment_support.sql

-- This adds:
-- 1. payment_split_details JSONB column to orders table
-- 2. 'split' option to payment_method constraint
-- 3. Index for querying split payments
```

### 2. Update UPI Merchant Details (Optional)
In `SplitPaymentModal.jsx`, line ~368:
```javascript
// Replace with your actual UPI details:
value={`upi://pay?pa=YOUR_UPI_ID@upi&pn=YOUR_RESTAURANT_NAME&am=${onlineValue.toFixed(2)}&cu=INR&tn=Order${order?.order_number || ''}`}
```

---

## 🎯 How to Use

### For Managers:

1. **Open any order** with pending payment in Manager Dashboard

2. **Click "Payment" button** → Dropdown appears

3. **Select "Split Payment"** → Modal opens

4. **Enter amounts:**
   - Option A: Use quick split buttons (50/50, 60/40, 70/30)
   - Option B: Manually type cash and online amounts
   - Option C: Enter one amount, click "Fill" for the other

5. **Verify:**
   - Remaining amount shows ₹0 (green checkmark)
   - QR code appears for online portion

6. **Customer pays online:**
   - Scan QR code with any UPI app
   - Complete payment

7. **Manager receives cash:**
   - Collect cash amount from customer

8. **Click "Confirm Split Payment"**
   - Order marked as paid
   - Split details saved and displayed

---

## 📱 Features

### Quick Split Buttons
- **50/50** - Equal split
- **60/40** - 60% cash, 40% online
- **70/30** - 70% cash, 30% online

### Fill Buttons
- Enter cash amount → Click "Fill" on online → Automatically fills remaining
- Enter online amount → Click "Fill" on cash → Automatically fills remaining

### Real-time Validation
- ✅ Green indicator when total matches order amount
- ⚠️ Amber indicator when amount remaining
- ❌ Red indicator when exceeding total
- Shows exact remaining/excess amount

### QR Code
- Appears automatically when online amount > 0
- UPI-compatible (works with all UPI apps)
- Shows online amount prominently
- 180x180px size for easy scanning

---

## 🎨 Visual Guide

### Split Payment Badge in OrderCard:
```
┌─────────────────────────────────┐
│ 💳 Split Payment                │
│                                 │
│ 💵 Cash:     ₹500.00           │
│ 💳 Online:   ₹300.00           │
└─────────────────────────────────┘
```

### Modal Layout:
```
┌────────────────────────────────────┐
│ Order Total: ₹800.00              │
├────────────────────────────────────┤
│ Quick Split: [50/50][60/40][70/30]│
├────────────────────────────────────┤
│ 💵 Cash Amount:  ₹ [500.00] [Fill]│
│ 💳 Online Amount: ₹ [300.00] [Fill]│
├────────────────────────────────────┤
│ ✅ Payment Complete    ₹0.00      │
├────────────────────────────────────┤
│ 💳 Scan to Pay Online              │
│ ┌────────────────┐                │
│ │   QR CODE      │   ₹300.00      │
│ │   [========]   │                │
│ └────────────────┘                │
├────────────────────────────────────┤
│ [Cancel] [Confirm Split Payment]  │
└────────────────────────────────────┘
```

---

## 🔍 Database Structure

### orders table (after migration):
```sql
payment_method: 'split'
payment_status: 'paid'
payment_split_details: {
  "cash_amount": 500.00,
  "online_amount": 300.00,
  "split_timestamp": "2025-11-21T10:30:00Z"
}
```

---

## 🐛 Troubleshooting

### Issue: "Split Payment" option not appearing
**Solution:** Check if migration `17_split_payment_support.sql` has been run

### Issue: QR code not showing
**Solution:** Make sure you entered an online amount > 0

### Issue: Cannot confirm payment
**Solution:** Verify that cash + online = order total (check remaining amount)

### Issue: Split details not showing in OrderCard
**Solution:** 
1. Check if `payment_method` is 'split'
2. Check if `payment_split_details` column exists
3. Run migration if missing

### Issue: Validation error even when amounts match
**Solution:** Floating point precision - ensure amounts have max 2 decimal places

---

## 📊 Example Scenarios

### Scenario 1: Even Split
```
Order Total: ₹1000
Cash: ₹500
Online: ₹500
✅ Valid
```

### Scenario 2: Mostly Cash
```
Order Total: ₹850
Cash: ₹600
Online: ₹250
✅ Valid
```

### Scenario 3: Mostly Online
```
Order Total: ₹1200
Cash: ₹300
Online: ₹900
✅ Valid
```

### Scenario 4: Invalid - Exceeds Total
```
Order Total: ₹800
Cash: ₹500
Online: ₹400
❌ Invalid - Exceeds by ₹100
```

### Scenario 5: Invalid - Incomplete
```
Order Total: ₹800
Cash: ₹500
Online: ₹200
❌ Invalid - Remaining ₹100
```

---

## ⌨️ Keyboard Shortcuts

- **Enter** - Confirm payment (when valid)
- **Esc** - Close modal
- **Tab** - Navigate between inputs

---

## 🔐 Security Notes

1. **Cash handling:** Manager must physically verify cash received
2. **Online verification:** Check UPI payment success before confirming
3. **Split details:** Stored in database for audit trail
4. **Payment records:** Both cash and online portions logged separately
5. **Timestamps:** Split payment time recorded automatically

---

## 📞 Support

**Issue:** Split payment feature not working  
**Check:**
1. Migration run? → `17_split_payment_support.sql`
2. Browser console errors? → Check developer tools
3. Database permissions? → Verify RLS policies
4. Component imports? → Check file paths

---

## ✅ Pre-Production Checklist

- [ ] Migration `17_split_payment_support.sql` executed
- [ ] UPI merchant ID updated in QR code
- [ ] Tested on desktop browser
- [ ] Tested on mobile device
- [ ] Verified database writes correctly
- [ ] Tested validation edge cases
- [ ] Confirmed QR code scans successfully
- [ ] Checked OrderCard displays split details

---

**Last Updated:** November 21, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
