# 🎯 Task 9: Customer Journey Testing Guide

**Status:** In Progress  
**Priority:** CRITICAL (Revenue Flow)  
**Last Updated:** November 15, 2025

---

## 📋 Overview

This is the **most critical test** as it covers the primary revenue-generating user flow:
```
QR Scan → Browse Menu → Add to Cart → Place Order → Payment → Track Order → Feedback
```

If this flow has any issues, customers cannot order food and your business stops working.

---

## 🎯 Test Objectives

1. ✅ Verify complete customer ordering workflow
2. ✅ Ensure no console errors throughout the journey
3. ✅ Validate data persistence (cart, session, order)
4. ✅ Test real-time order status updates
5. ✅ Confirm payment integration works
6. ✅ Check mobile responsiveness (most customers use mobile)

---

## 🚀 Pre-Test Setup

### Database Requirements:
```sql
-- 1. Verify you have test data
SELECT id, name, slug FROM restaurants LIMIT 5;
SELECT id, table_number, restaurant_id FROM tables LIMIT 5;
SELECT id, name, price, category FROM menu_items LIMIT 10;

-- 2. Check Razorpay settings are configured
SELECT id, name, payment_settings FROM restaurants WHERE id = 'your-restaurant-id';
-- Should have razorpay_key_id and razorpay_key_secret

-- 3. Verify RLS policies allow customer operations
-- Test as anonymous user (customer doesn't need login)
```

### Environment Variables:
Check `/.env` or Supabase dashboard:
```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key  # Platform fallback
```

### Test Restaurant Data:
You need at least:
- 1 restaurant with `slug` (e.g., "test-restaurant")
- 5+ tables with different table_numbers
- 10+ menu items across categories (Starters, Mains, Desserts, Beverages)
- Payment settings configured with Razorpay keys

---

## 📝 Step-by-Step Test Procedure

### **Step 1: QR Code Generation** (5 min)

#### 1.1 Generate QR Code
1. Login as Manager
2. Navigate to `/manager/qr-codes`
3. Find Table 1 (or any table)
4. Click "Download QR" button
5. QR code should download as `Table-1.png`

**Expected URL format:**
```
http://localhost:5173/table/1?restaurant=test-restaurant
```

**Check:**
- ✅ QR code image downloads successfully
- ✅ URL includes table ID and restaurant slug
- ✅ No console errors

---

### **Step 2: QR Code Scan Simulation** (2 min)

#### 2.1 Open Table Page
Open the URL manually (simulates QR scan):
```
http://localhost:5173/table/1?restaurant=test-restaurant
```

**What should happen:**
1. Page loads with restaurant name in header
2. Menu items appear grouped by categories
3. Table number displayed (e.g., "Table #1")
4. Category tabs show (Starters, Mains, Desserts, Beverages)

#### 2.2 Check Console
Open browser DevTools (F12) → Console tab

**Should see:**
- ✅ No errors
- ✅ Minimal or no debug logs (we cleaned these up)
- ⚠️ Possibly one log: "Restaurant context loaded" (intentional)

**Should NOT see:**
- ❌ "👤 Customer entered table"
- ❌ "Cart items:", "Prepared order data:"
- ❌ Multiple GoTrueClient warnings
- ❌ 401/403 errors (except harmless audit log warnings)

#### 2.3 Verify Database
Check table was marked occupied:
```sql
SELECT table_number, status, updated_at 
FROM tables 
WHERE id = 1;
-- status should be 'occupied'
```

Check session was created:
```sql
SELECT * FROM table_sessions 
WHERE table_id = 1 
ORDER BY created_at DESC 
LIMIT 1;
-- Should have a recent session with is_active=true
```

---

### **Step 3: Browse Menu** (5 min)

#### 3.1 Test Category Navigation
1. Click each category tab (Starters → Mains → Desserts → Beverages)
2. Verify items display correctly
3. Check item cards show:
   - Image (or placeholder)
   - Name
   - Description
   - Price (₹XX.XX format)
   - Vegetarian icon (if applicable)
   - Add/Remove buttons

**Expected behavior:**
- Smooth tab switching
- Items filter by category
- No loading delays
- Responsive grid layout

#### 3.2 Test Search Functionality
1. Click search bar at top
2. Type "chicken" (or any dish name)
3. Verify search results display
4. Check "Found X items" message appears
5. Click X button to clear search
6. Verify menu returns to category view

**Expected behavior:**
- Search filters items in real-time
- Search works on name, description, category
- Clear button resets to normal view

#### 3.3 Test Item Details
1. Click on a menu item card
2. Verify you can see:
   - Full description
   - Accurate price
   - Category badge
   - Preparation time (if available)

---

### **Step 4: Add Items to Cart** (8 min)

#### 4.1 Add Single Item
1. Click "+ Add" button on any item
2. Verify:
   - Button changes to quantity controls (- [1] +)
   - Cart badge appears in header (or bottom bar on mobile)
   - Cart count updates (shows "1")

#### 4.2 Add Multiple Quantities
1. Click "+" button multiple times on same item
2. Verify quantity increases (2, 3, 4...)
3. Click "-" button
4. Verify quantity decreases
5. When quantity reaches 0, button should return to "+ Add"

#### 4.3 Add Multiple Items
1. Add 3-5 different items to cart
2. Mix different categories
3. Verify cart count updates correctly (total items)

#### 4.4 Check localStorage
Open DevTools → Application → Local Storage → `http://localhost:5173`

**Should see:**
```javascript
praahis_cart_1  // Cart for table 1
praahis_session_1  // Session for table 1
```

Click on `praahis_cart_1` and verify:
- Array of items with id, name, price, quantity
- Accurate data matching your selections

#### 4.5 Mobile: Test Cart Panel
**On mobile/responsive view:**
1. Add item to cart
2. Cart panel should slide in from right automatically
3. Click outside or X to close
4. Cart panel should slide out

**On desktop:**
1. Cart should be sticky on right side
2. Always visible with items listed

---

### **Step 5: Cart Management** (5 min)

#### 5.1 Open Cart Summary
**Mobile:** Tap cart icon in bottom bar  
**Desktop:** Cart is already visible on right

#### 5.2 Update Quantities in Cart
1. Click + button on item in cart
2. Verify:
   - Quantity increases
   - Price updates (item total = price × quantity)
   - Subtotal updates at bottom

#### 5.3 Remove Item
1. Click trash icon or "Remove" button
2. Verify:
   - Item disappears from cart
   - Cart count decreases
   - Subtotal recalculates

#### 5.4 Empty Cart Test
1. Remove all items from cart
2. Verify:
   - "Your cart is empty" message appears
   - Checkout button disabled or hidden
   - Cart count shows 0

#### 5.5 Re-add Items
Add 3-4 items back to cart for next steps

---

### **Step 6: Place Order** (10 min)

#### 6.1 Initiate Checkout
1. Click "Pay Now" or "Place Order" button in cart
2. Should see loading spinner with "Creating order..." message

#### 6.2 Navigation to Payment Page
**Should automatically redirect to:**
```
http://localhost:5173/payment/ORDER_ID
```

**Check:**
- ✅ URL has valid order ID (UUID format)
- ✅ Payment page loads
- ✅ No console errors during transition

#### 6.3 Verify Payment Page Content
**Should display:**
1. Order summary section:
   - List of items with quantities and prices
   - Subtotal amount
   - Tax amount (if applicable)
   - Total amount in large text

2. Restaurant information:
   - Restaurant name
   - Table number

3. Payment button:
   - "Pay ₹XXX" or "Pay with Razorpay"
   - Button should be enabled and clickable

#### 6.4 Check Database - Order Created
Open SQL editor:
```sql
-- Get the most recent order
SELECT 
  id,
  order_number,
  restaurant_id,
  table_id,
  session_id,
  items,
  subtotal,
  tax,
  total,
  order_status,
  payment_status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;

-- Verify:
-- ✅ order_status = 'pending_payment'
-- ✅ payment_status = 'pending'
-- ✅ items JSONB array has correct data
-- ✅ subtotal/tax/total calculated correctly
```

#### 6.5 Test Payment Flow

**Option A: Test Mode (Recommended)**
1. Click "Pay Now" button
2. Razorpay modal should open
3. Use test card details:
   ```
   Card: 4111 1111 1111 1111
   Expiry: 12/25
   CVV: 123
   ```
4. Complete payment
5. Should redirect to order status page

**Option B: Skip Payment (Dev Mode)**
If Razorpay not configured, you might see error. That's OK for now.

#### 6.6 Check Database - Payment Record
```sql
-- Check order_payments table
SELECT 
  id,
  order_id,
  payment_method,
  amount,
  status,
  razorpay_payment_id,
  created_at
FROM order_payments
ORDER BY created_at DESC
LIMIT 1;

-- Verify payment record created with correct amount
```

#### 6.7 Check Database - Order Status Updated
```sql
-- Verify order status changed
SELECT order_status, payment_status 
FROM orders 
ORDER BY created_at DESC 
LIMIT 1;

-- After successful payment:
-- ✅ order_status = 'received' or 'pending'
-- ✅ payment_status = 'paid'
```

---

### **Step 7: Real-Time Order Tracking** (8 min)

#### 7.1 Navigate to Order Status Page
After payment, you should be on:
```
http://localhost:5173/order-status/ORDER_ID
```

**Should display:**
1. Order number (e.g., "ORD-001")
2. Current status with icon/color
3. Items list with quantities
4. Total amount paid
5. Estimated time or progress indicator

#### 7.2 Test Real-Time Updates

**You need two browser windows/tabs:**

**Window 1: Customer View**
- Keep order status page open
- Should see current status (e.g., "Received")

**Window 2: Chef Dashboard**
1. Open new tab/window
2. Login as chef (or manager)
3. Navigate to `/chef/dashboard`
4. Find the order you just placed

**Test real-time propagation:**
1. In Chef Dashboard, change order status:
   - Click "Start Preparing" → status becomes "preparing"
2. Switch to Customer View (Window 1)
3. **Within 2-3 seconds**, status should update automatically
4. Change status again:
   - Click "Ready to Serve" → status becomes "ready"
5. Check Customer View updates again

**Expected behavior:**
- ✅ Status updates in real-time (no page refresh needed)
- ✅ Status changes propagate within 2-3 seconds
- ✅ Progress bar or icons update accordingly
- ✅ No console errors related to Supabase Realtime

#### 7.3 Check Console for Realtime
**In Customer View console, should see:**
```
✅ Minimal logs like "Subscribed to order updates"
✅ No "Multiple GoTrueClient instances" warnings
✅ No memory leak warnings
```

**Should NOT see:**
```
❌ "REALTIME_SUBSCRIPTION_ERROR"
❌ Repeated connection/disconnection logs
❌ 429 Too Many Requests errors
```

#### 7.4 Test Status Progression
Update order through all statuses:
1. **Received** → Just placed
2. **Preparing** → Chef started cooking
3. **Ready** → Food ready for serving
4. **Served** → Delivered to table

After "Served" status, should automatically redirect to:
```
http://localhost:5173/post-meal/SESSION_ID/TABLE_NUMBER
```

---

### **Step 8: Post-Meal Options** (3 min)

#### 8.1 Verify Post-Meal Page
**Should display two options:**

1. **Order More** card
   - Icon: Shopping bag
   - Text: "Order more - Browse the menu and add more items"

2. **Give Feedback** card
   - Icon: Message
   - Text: "Share your experience"

#### 8.2 Test "Order More"
1. Click "Order More" button
2. Should redirect back to table page: `/table/TABLE_ID`
3. Menu should load
4. Previous order should still be in database (not deleted)
5. Cart should be empty (ready for new order)

#### 8.3 Test "Give Feedback"
1. Go back to post-meal page
2. Click "Give Feedback" button
3. Should redirect to: `/feedback/SESSION_ID`

---

### **Step 9: Submit Feedback** (5 min)

#### 9.1 Verify Feedback Page
**Should display:**
1. Restaurant name
2. Table number
3. Rating section (5 stars)
4. Comment textarea
5. Submit button

#### 9.2 Submit Rating
1. Click star rating (e.g., 5 stars)
2. Type comment in textarea: "Great food and service!"
3. Click "Submit Feedback" button

**Expected behavior:**
- Loading indicator appears
- Success message: "Thank you for your feedback!"
- Redirects to thank you page

#### 9.3 Verify in Database
```sql
-- Check feedback was saved
SELECT 
  id,
  restaurant_id,
  session_id,
  rating,
  comment,
  created_at
FROM feedback
ORDER BY created_at DESC
LIMIT 1;

-- Verify:
-- ✅ rating = 5 (or whatever you selected)
-- ✅ comment saved correctly
-- ✅ session_id matches your session
```

---

### **Step 10: Thank You Page** (2 min)

#### 10.1 Verify Thank You Page
**Should display:**
1. Success icon/animation
2. "Thank you for dining with us!" message
3. Optional: "Order more" button or back to menu link

#### 10.2 Test Navigation
1. If there's a "Back to Menu" button, click it
2. Should return to table page
3. Ready for new customer session

---

## 🐛 Common Issues & Fixes

### Issue 1: "Restaurant context missing" error
**Symptom:** Error on table page load  
**Fix:**
```sql
-- Ensure restaurant slug is in URL
-- URL should be: /table/1?restaurant=your-slug
-- NOT: /table/1
```

### Issue 2: Menu items not loading
**Symptom:** Empty menu, no items displayed  
**Fix:**
```sql
-- Check menu items exist for restaurant
SELECT * FROM menu_items WHERE restaurant_id = 'your-id';

-- Verify RLS policies allow anon access
SELECT * FROM menu_items; -- Test as anonymous user
```

### Issue 3: Cart not saving
**Symptom:** Cart empties on page refresh  
**Fix:**
- Check localStorage is enabled in browser
- Verify `praahis_cart_X` key exists in localStorage
- Try incognito mode to rule out extensions

### Issue 4: Payment page errors
**Symptom:** "Payment configuration error"  
**Fix:**
```sql
-- Check Razorpay keys configured
SELECT payment_settings FROM restaurants WHERE id = 'your-id';

-- Should have:
-- {"razorpay_key_id": "rzp_test_xxx", "razorpay_key_secret": "xxx"}
```

### Issue 5: Real-time not working
**Symptom:** Order status doesn't update automatically  
**Fix:**
1. Check Supabase Realtime is enabled for `orders` table
2. Run database file: `/database/03_enable_realtime.sql`
3. Verify RLS policies allow SELECT on orders table
4. Check browser console for subscription errors

### Issue 6: Order creation fails
**Symptom:** "Failed to create order" toast  
**Fix:**
```sql
-- Check RLS policies allow INSERT for anonymous users
-- Or ensure orders table has proper insert policies

-- Test insert as anon:
INSERT INTO orders (restaurant_id, table_id, items, total, order_status)
VALUES ('rest-id', 1, '[]'::jsonb, 100, 'pending');
```

---

## ✅ Success Criteria

### Minimum Requirements (Must Pass):
- ✅ Table page loads without errors
- ✅ Menu items display correctly
- ✅ Can add items to cart
- ✅ Cart persists on page refresh
- ✅ Order creation succeeds
- ✅ Payment page displays order summary
- ✅ Order status page shows order details

### Ideal (Should Pass):
- ✅ No console errors throughout journey
- ✅ Real-time status updates work
- ✅ Mobile responsive on all pages
- ✅ Smooth animations and transitions
- ✅ Payment flow completes (if configured)
- ✅ Feedback submission works
- ✅ Can complete multiple orders in same session

### Stretch Goals (Nice to Have):
- ✅ Sub-second real-time updates
- ✅ Progressive image loading
- ✅ Offline cart persistence
- ✅ Payment retry on failure
- ✅ Order history accessible to customer

---

## 📊 Test Report Template

**Date:** November 15, 2025  
**Tester:** [Your Name]  
**Environment:** Development (localhost:5173)  
**Browser:** Chrome 119 / Safari 17 / Firefox 120  
**Device:** Desktop / Mobile (iPhone 14) / Tablet (iPad)

### Results:

| Step | Status | Notes |
|------|--------|-------|
| 1. QR Code Generation | ✅ Pass | |
| 2. QR Scan Simulation | ✅ Pass | |
| 3. Browse Menu | ✅ Pass | |
| 4. Add to Cart | ✅ Pass | |
| 5. Cart Management | ✅ Pass | |
| 6. Place Order | ✅ Pass | |
| 7. Real-Time Tracking | ✅ Pass | |
| 8. Post-Meal Options | ✅ Pass | |
| 9. Submit Feedback | ✅ Pass | |
| 10. Thank You Page | ✅ Pass | |

### Console Errors Found:
```
[List any errors found during testing]
```

### Performance Issues:
```
[List any slow loading, lag, or performance problems]
```

### Bugs Discovered:
```
[List any functional bugs or incorrect behavior]
```

### Recommendations:
```
[List suggestions for improvements]
```

---

## 🚀 Quick Test (5-Minute Smoke Test)

If you're short on time, run this abbreviated test:

1. **Open table page:** `/table/1?restaurant=test-restaurant`
2. **Add 2 items** to cart
3. **Click "Pay Now"** → Should create order and redirect
4. **Verify payment page** displays order summary
5. **Check console** for errors (F12)

**If all 5 steps pass → Likely working correctly**  
**If any step fails → Run full test procedure above**

---

## 📞 Need Help?

**Common Questions:**

**Q: Payment fails with "Invalid key" error**  
A: Check `.env` file has correct `VITE_RAZORPAY_KEY_ID` or configure per-restaurant keys in database.

**Q: Real-time not working?**  
A: Run `/database/03_enable_realtime.sql` and verify Supabase Realtime is enabled in dashboard.

**Q: Cart empties on refresh?**  
A: Check browser localStorage is enabled. Try incognito mode.

**Q: Menu items not showing?**  
A: Verify `restaurant` query parameter is in URL and menu items exist in database.

---

## 📝 Next Steps After Testing

1. **Document findings** in test report template above
2. **Create GitHub issues** for any bugs found
3. **If all tests pass:** Move to Task 10 (Payment Integration Testing)
4. **If tests fail:** Fix critical bugs before proceeding

---

**Ready to test? Start with Step 1! 🚀**
