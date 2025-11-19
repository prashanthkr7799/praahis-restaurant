# ✅ Task 9: Quick Testing Checklist

Copy this checklist and check off items as you test.

---

## 📋 Pre-Test Setup

- [ ] `.env` file exists with Supabase credentials
- [ ] Dev server running (`http://localhost:5173`)
- [ ] Database has test data (restaurants, tables, menu items)
- [ ] Browser DevTools open (F12 → Console tab)

---

## 🧪 Test Steps

### 1️⃣ Table Page Access
- [ ] Open: `http://localhost:5173/table/1?restaurant=YOUR-SLUG`
- [ ] Page loads without errors
- [ ] Restaurant name displays in header
- [ ] Table number shows (e.g., "Table #1")
- [ ] Menu items appear
- [ ] Category tabs visible
- [ ] **Console:** No red errors

### 2️⃣ Browse Menu
- [ ] Click different category tabs
- [ ] Items filter correctly by category
- [ ] Item cards show: image, name, price, description
- [ ] Search bar works (type dish name)
- [ ] Search results display correctly
- [ ] Clear search returns to category view
- [ ] **Console:** No errors

### 3️⃣ Add to Cart
- [ ] Click "+ Add" on menu item
- [ ] Button changes to quantity controls (- [1] +)
- [ ] Cart badge appears in header/bottom bar
- [ ] Cart count updates correctly
- [ ] Click "+" to increase quantity
- [ ] Click "-" to decrease quantity
- [ ] Add 3-4 different items to cart
- [ ] **localStorage:** Check `praahis_cart_1` exists
- [ ] **Console:** No errors

### 4️⃣ Cart Management
- [ ] Open cart (click cart icon or auto-opens on mobile)
- [ ] All added items display in cart
- [ ] Item names, prices, quantities correct
- [ ] Update quantity in cart (+ and - buttons work)
- [ ] Remove item (trash icon works)
- [ ] Subtotal calculates correctly
- [ ] Tax displays (if applicable)
- [ ] Total amount correct
- [ ] **Console:** No errors

### 5️⃣ Place Order
- [ ] Click "Pay Now" or "Place Order" button
- [ ] Loading spinner appears ("Creating order...")
- [ ] Redirects to payment page automatically
- [ ] URL format: `/payment/ORDER_ID`
- [ ] **Database:** Order created with status `pending_payment`
- [ ] **Console:** No errors during transition

### 6️⃣ Payment Page
- [ ] Payment page loads successfully
- [ ] Order summary displays all items
- [ ] Item quantities and prices correct
- [ ] Subtotal, tax, total display correctly
- [ ] Restaurant name shows
- [ ] Table number displays
- [ ] "Pay Now" button visible and enabled
- [ ] **Console:** No errors

### 7️⃣ Payment Processing (Optional)
- [ ] Click "Pay Now" button
- [ ] Razorpay modal opens (if configured)
- [ ] Can enter test card details
- [ ] Payment completes or shows appropriate error
- [ ] **Database:** Payment record created in `order_payments`
- [ ] **Database:** Order status updated to `received`

### 8️⃣ Order Status Page
- [ ] After payment, redirects to `/order-status/ORDER_ID`
- [ ] Order number displays (e.g., "ORD-001")
- [ ] Current status shows with icon/color
- [ ] All order items listed
- [ ] Total amount displays
- [ ] Progress indicator or status badges visible
- [ ] **Console:** No errors

### 9️⃣ Real-Time Updates (Critical!)
**Setup:** Open two windows/tabs

**Window 1 - Customer View:**
- [ ] Keep order status page open
- [ ] Note current status (e.g., "Received")

**Window 2 - Chef Dashboard:**
- [ ] Login as chef/manager
- [ ] Navigate to `/chef/dashboard`
- [ ] Find the test order
- [ ] Change status to "Preparing"

**Back to Window 1:**
- [ ] Status updates automatically (within 2-3 seconds)
- [ ] No page refresh required
- [ ] Change status again in chef dashboard to "Ready"
- [ ] Status updates again in customer view
- [ ] **Console:** No subscription errors, no memory leaks

### 🔟 Post-Meal & Feedback
- [ ] When order status becomes "Served"
- [ ] Automatically redirects to `/post-meal/:sessionId/:tableNumber`
- [ ] Two options display: "Order More" and "Give Feedback"
- [ ] Click "Order More" → Returns to table page
- [ ] Go back to post-meal page
- [ ] Click "Give Feedback" → Redirects to `/feedback/:sessionId`
- [ ] Feedback page displays rating stars
- [ ] Can select star rating (1-5)
- [ ] Can type comment in textarea
- [ ] Click "Submit Feedback"
- [ ] Success message appears
- [ ] Redirects to thank you page
- [ ] **Database:** Feedback saved in `feedback` table

---

## 📊 Database Verification

Run these SQL queries after testing:

### Check Table Status Changed
```sql
SELECT table_number, status FROM tables WHERE id = 1;
-- Expected: status = 'occupied'
```
- [ ] Status is 'occupied' ✅

### Check Session Created
```sql
SELECT * FROM table_sessions 
WHERE table_id = 1 
ORDER BY created_at DESC 
LIMIT 1;
```
- [ ] Session exists with is_active = true ✅

### Check Order Created
```sql
SELECT 
  order_number,
  order_status,
  payment_status,
  items,
  total
FROM orders 
ORDER BY created_at DESC 
LIMIT 1;
```
- [ ] Order exists ✅
- [ ] Items JSONB array has correct data ✅
- [ ] Total matches what was paid ✅

### Check Payment Record
```sql
SELECT * FROM order_payments 
ORDER BY created_at DESC 
LIMIT 1;
```
- [ ] Payment record exists (if payment completed) ✅

### Check Feedback Saved
```sql
SELECT rating, comment FROM feedback 
ORDER BY created_at DESC 
LIMIT 1;
```
- [ ] Feedback saved with correct rating ✅

---

## 🐛 Issues Found

**List any bugs or problems encountered:**

1. 
2. 
3. 

---

## ⚡ Performance Notes

**Load times:**
- Table page: _____ seconds
- Menu items: _____ seconds
- Order creation: _____ seconds
- Payment page: _____ seconds

**Any lag or slowness?**
- 

---

## 📱 Mobile Testing (Critical!)

### Repeat key tests on mobile:
- [ ] Open table page on mobile device
- [ ] Menu displays correctly (responsive grid)
- [ ] Can add items to cart
- [ ] Cart panel slides in from right
- [ ] Touch interactions work smoothly
- [ ] Can complete order
- [ ] Payment page is mobile-friendly
- [ ] Order status page readable on mobile

---

## ✅ Final Verdict

### Overall Status:
- [ ] ✅ PASS - Customer journey works end-to-end
- [ ] ⚠️  PARTIAL - Some issues but core flow works
- [ ] ❌ FAIL - Critical issues blocking customer orders

### Blocker Issues (Must fix before production):
1. 
2. 
3. 

### Minor Issues (Can fix later):
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 

---

## 🎯 Next Steps

If testing passed:
- [ ] Mark Task 9 as complete
- [ ] Document findings in test report
- [ ] Move to Task 10: Payment Integration Testing

If testing failed:
- [ ] Create list of bugs to fix
- [ ] Prioritize critical vs minor issues
- [ ] Fix blockers first
- [ ] Re-test after fixes

---

**Test completed by:** _______________  
**Date:** _______________  
**Time spent:** _______________  
**Overall rating:** ⭐⭐⭐⭐⭐

---

✨ **Great job testing the most critical user flow!** ✨
