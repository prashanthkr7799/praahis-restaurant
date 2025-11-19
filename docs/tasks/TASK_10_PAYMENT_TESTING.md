# 🎯 Task 10: Payment Integration Testing Guide

**Status:** In Progress  
**Priority:** HIGH (Revenue Collection)  
**Last Updated:** November 15, 2025  
**Prerequisites:** Task 9 (Customer Journey) completed

---

## 📋 Overview

Test the complete payment integration to ensure customers can successfully pay for orders and money flows correctly through the system.

### What We're Testing:
```
Payment Flow:
1. Restaurant Razorpay Configuration
2. Payment Page Display
3. Razorpay Checkout Modal
4. Payment Success/Failure Handling
5. Database Records (order_payments table)
6. Order Status Updates
7. Platform Fallback Keys
```

---

## 🎯 Test Objectives

1. ✅ Verify restaurant-specific Razorpay keys work
2. ✅ Test platform fallback keys (if restaurant not configured)
3. ✅ Payment success flow creates correct records
4. ✅ Payment failure handling works properly
5. ✅ order_payments table records are accurate
6. ✅ Order status updates after payment
7. ✅ Webhook handling (if configured)

---

## 🚀 Pre-Test Setup

### 1. Check Current Payment Implementation

The payment page has **TWO MODES**:

#### Mode 1: TEST/DEMO Mode (Currently Active)
- Located in: `src/pages/customer/PaymentPage.jsx` (lines 58-76)
- Simulates payment with 2-second delay
- Creates test payment IDs
- **No real Razorpay integration**

#### Mode 2: PRODUCTION Mode (Commented Out)
- Real Razorpay integration
- Uses restaurant-specific keys
- Lines 78-109 in PaymentPage.jsx

### 2. Database Tables to Check

```sql
-- Check if restaurant has Razorpay configured
SELECT 
  id,
  name,
  payment_gateway_enabled,
  razorpay_key_id,
  payment_settings
FROM restaurants
WHERE id = 'your-restaurant-id';

-- Check order_payments table exists
SELECT * FROM order_payments LIMIT 1;
```

---

## 📝 Testing Scenarios

### **Scenario 1: Test Mode (Current Implementation)**

#### What It Tests:
- Payment flow without real Razorpay
- Database record creation
- Order status updates
- Error handling

#### Steps:
1. Complete Task 9 flow up to payment page
2. Click "Pay Now" button
3. Wait 2 seconds (simulated payment)
4. Verify:
   - ✅ Success toast appears
   - ✅ Redirects to order status page
   - ✅ order_payments record created
   - ✅ Order payment_status = 'paid'
   - ✅ Order order_status = 'received'

#### SQL Verification:
```sql
-- Check payment record
SELECT 
  id,
  order_id,
  razorpay_payment_id,
  amount,
  status,
  created_at
FROM order_payments
ORDER BY created_at DESC
LIMIT 1;
-- Expected: status = 'captured', razorpay_payment_id starts with 'pay_test_'

-- Check order updated
SELECT 
  id,
  order_number,
  payment_status,
  order_status
FROM orders
WHERE id = '[your-order-id]';
-- Expected: payment_status = 'paid', order_status = 'received'
```

---

### **Scenario 2: Restaurant Razorpay Keys (Production Mode)**

⚠️ **This requires enabling real Razorpay integration**

#### Steps to Enable:
1. Uncomment lines 78-109 in `src/pages/customer/PaymentPage.jsx`
2. Comment out lines 58-76 (test mode)
3. Restart dev server

#### Prerequisites:
```sql
-- Restaurant must have Razorpay configured
UPDATE restaurants
SET 
  razorpay_key_id = 'rzp_test_xxxxxx',
  razorpay_key_secret = 'your_key_secret',
  payment_gateway_enabled = true,
  payment_settings = '{
    "currency": "INR",
    "accepted_methods": ["card", "netbanking", "wallet", "upi"]
  }'::jsonb
WHERE id = 'your-restaurant-id';
```

#### Test Steps:
1. Configure restaurant Razorpay keys (see above)
2. Place order as customer
3. On payment page, click "Pay Now"
4. Razorpay modal should open with restaurant's branding
5. Use test card:
   - Card: `4111 1111 1111 1111`
   - Expiry: Any future date
   - CVV: `123`
   - Name: Any name
6. Complete payment
7. Verify success flow

#### Expected Results:
- ✅ Razorpay modal opens with restaurant name
- ✅ Payment processes with restaurant's keys
- ✅ Success callback triggered
- ✅ order_payments record created with real Razorpay IDs
- ✅ Order status updated
- ✅ Customer redirected to order status

---

### **Scenario 3: Platform Fallback Keys**

#### When It's Used:
- Restaurant hasn't configured their own keys
- `restaurants.razorpay_key_id` is NULL
- System falls back to `.env` key

#### Setup:
```bash
# In .env file
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx  # Platform fallback key
```

#### Test Steps:
1. Ensure restaurant has NO Razorpay keys configured:
```sql
UPDATE restaurants
SET 
  razorpay_key_id = NULL,
  razorpay_key_secret = NULL,
  payment_gateway_enabled = false
WHERE id = 'your-restaurant-id';
```

2. Place order
3. On payment page, click "Pay Now"
4. Should use fallback key from `.env`

#### Expected Behavior:
- ⚠️ If no fallback key: Error message
- ✅ If fallback key exists: Payment proceeds with platform key
- ⚠️ Warning in console: "Restaurant using platform fallback keys"

---

### **Scenario 4: Payment Failure Handling**

#### How to Test:
1. Use invalid test card in Razorpay:
   - Card: `4000 0000 0000 0002` (Razorpay decline test card)
   - OR: Close Razorpay modal without paying
2. Verify error handling

#### Expected Results:
- ✅ Error toast appears
- ✅ User stays on payment page
- ✅ Can retry payment
- ✅ No order_payments record created
- ✅ Order remains in 'pending_payment' status
- ✅ Console shows helpful error message

---

### **Scenario 5: Payment Record Validation**

After successful payment, verify database integrity:

```sql
-- Get payment record details
SELECT 
  op.id,
  op.order_id,
  op.restaurant_id,
  op.razorpay_payment_id,
  op.razorpay_order_id,
  op.amount,
  op.currency,
  op.status,
  op.payment_method,
  op.created_at,
  o.order_number,
  o.total_amount,
  o.payment_status,
  o.order_status
FROM order_payments op
JOIN orders o ON op.order_id = o.id
WHERE op.order_id = 'your-order-id';
```

#### Validations:
- [ ] `order_id` matches the order
- [ ] `restaurant_id` is NOT NULL
- [ ] `amount` matches `orders.total_amount`
- [ ] `currency` is 'INR' (or configured currency)
- [ ] `status` is 'captured' or 'authorized'
- [ ] `razorpay_payment_id` is valid format
- [ ] `created_at` is recent timestamp
- [ ] Order `payment_status` changed to 'paid'
- [ ] Order `order_status` changed to 'received'

---

### **Scenario 6: Manager Payment Settings**

Test the Manager's Payment Settings page:

#### Steps:
1. Login as Manager
2. Navigate to `/manager/payment-settings`
3. Enter Razorpay credentials:
   - Key ID: `rzp_test_xxxxxxxxxxxx`
   - Key Secret: (your secret)
   - Webhook Secret: (optional)
4. Select accepted payment methods
5. Click "Test Connection"
6. Click "Save Settings"

#### Expected Results:
- ✅ Settings page loads without errors
- ✅ Current settings display if already configured
- ✅ "Test Connection" verifies credentials
- ✅ Save updates `restaurants` table
- ✅ Success toast appears
- ✅ `payment_gateway_enabled` set to true

#### SQL Verification:
```sql
SELECT 
  razorpay_key_id,
  payment_gateway_enabled,
  payment_settings
FROM restaurants
WHERE id = 'your-restaurant-id';
```

---

### **Scenario 7: Webhook Handling** (Advanced)

⚠️ **Optional** - Only if webhook configured

#### Setup Required:
1. Deploy Supabase Edge Function:
```bash
cd supabase/functions/payment-webhook
supabase functions deploy payment-webhook
```

2. Configure Razorpay webhook:
- URL: `https://[PROJECT].supabase.co/functions/v1/payment-webhook`
- Events: `payment.captured`, `payment.failed`
- Secret: Set in Supabase secrets

#### Test:
1. Make real payment
2. Check webhook logs in Razorpay dashboard
3. Verify payment status updated via webhook

---

## 🐛 Common Issues & Fixes

### Issue 1: "Payment gateway not enabled"
**Symptom:** Error when clicking Pay Now  
**Fix:**
```sql
UPDATE restaurants
SET payment_gateway_enabled = true
WHERE id = 'your-restaurant-id';
```

### Issue 2: Razorpay modal doesn't open
**Symptom:** Button click does nothing  
**Fixes:**
1. Check browser console for script loading errors
2. Verify internet connection
3. Check Razorpay script loaded: `window.Razorpay`
4. Verify restaurant has valid key_id

### Issue 3: "Missing restaurant_id" error
**Symptom:** Payment fails with database error  
**Fix:** This should be fixed. Verify order has restaurant_id:
```sql
SELECT id, restaurant_id FROM orders WHERE id = 'order-id';
```

### Issue 4: Payment succeeds but order not updated
**Symptom:** Payment record created but order still 'pending'  
**Fix:** Check RLS policies:
```sql
-- Verify anyone can update order payment status
SELECT * FROM orders WHERE id = 'order-id';
```

### Issue 5: Using wrong Razorpay keys
**Symptom:** Payment fails or goes to wrong account  
**Check:**
```sql
-- Verify restaurant's keys
SELECT razorpay_key_id FROM restaurants WHERE id = 'restaurant-id';

-- Check fallback in .env
cat .env | grep RAZORPAY
```

---

## ✅ Success Criteria

### Minimum Requirements:
- [ ] Test mode payment works (current implementation)
- [ ] order_payments record created correctly
- [ ] Order status updates after payment
- [ ] Payment page displays order summary
- [ ] Success toast and redirect work
- [ ] No console errors

### Production Ready:
- [ ] Real Razorpay integration enabled
- [ ] Restaurant keys configured and working
- [ ] Test card payment succeeds
- [ ] Payment failure handled gracefully
- [ ] Can retry failed payments
- [ ] Webhook configured (optional)

### Ideal:
- [ ] Multiple restaurants tested
- [ ] All payment methods work (UPI, Cards, Wallets)
- [ ] Mobile payment flow smooth
- [ ] Payment confirmation email sent (if configured)
- [ ] Webhook updates working
- [ ] Audit logs recording payments

---

## 📊 Test Report Template

```markdown
## Payment Integration Test Results

**Date:** November 15, 2025  
**Tester:** [Your Name]  
**Mode Tested:** [ ] Test Mode  [ ] Production Mode

### Scenario Results:

1. **Test Mode Payment:**
   - [ ] PASS / [ ] FAIL
   - Notes: 

2. **Restaurant Razorpay Keys:**
   - [ ] PASS / [ ] FAIL / [ ] SKIPPED
   - Notes:

3. **Platform Fallback:**
   - [ ] PASS / [ ] FAIL / [ ] SKIPPED
   - Notes:

4. **Payment Failure:**
   - [ ] PASS / [ ] FAIL
   - Notes:

5. **Database Records:**
   - [ ] PASS / [ ] FAIL
   - Notes:

6. **Manager Settings:**
   - [ ] PASS / [ ] FAIL
   - Notes:

7. **Webhook:**
   - [ ] PASS / [ ] FAIL / [ ] SKIPPED
   - Notes:

### Issues Found:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 
```

---

## 🎬 Quick Test (10 Minutes)

**Fastest way to verify payment system:**

1. **Check current mode:**
```bash
grep -A 20 "handlePayment" src/pages/customer/PaymentPage.jsx | head -25
# If you see "FOR DEMO/TESTING" → Test mode active
```

2. **Run test mode flow:**
- Place order (Task 9 flow)
- Click "Pay Now" on payment page
- Wait 2 seconds
- Verify redirect to order status

3. **Check database:**
```sql
SELECT * FROM order_payments ORDER BY created_at DESC LIMIT 1;
SELECT payment_status, order_status FROM orders ORDER BY created_at DESC LIMIT 1;
```

4. **If all pass:** Test mode works! ✅

5. **To test production mode:**
- Configure restaurant Razorpay keys
- Enable production mode in code
- Test with real Razorpay checkout

---

## 📞 Need Help?

**Quick Troubleshooting:**
1. Check if `order_payments` table exists
2. Verify restaurant has `restaurant_id` in orders
3. Check `.env` has Supabase keys
4. Look for errors in browser console
5. Check Supabase logs for RLS policy issues

**Files to Review:**
- `src/pages/customer/PaymentPage.jsx` - Payment UI
- `src/domains/billing/utils/razorpayHelper.js` - Razorpay logic
- `database/52_add_order_payments_table.sql` - Table schema
- `database/50_razorpay_per_restaurant.sql` - Restaurant keys setup

---

## 🚀 Next Steps

After completing Task 10:
1. Document findings in test report
2. Mark Task 10 complete
3. Move to Task 11: Real-time Features Testing

---

**Ready to test payments? Start with the Quick Test above! 💳**
