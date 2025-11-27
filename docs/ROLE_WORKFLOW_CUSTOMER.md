# 🧑‍💼 CUSTOMER ROLE - COMPLETE WORKFLOW DOCUMENTATION

**Document Version:** 1.0  
**Last Updated:** November 24, 2025  
**Role:** Restaurant Customer / Diner  
**Primary Device:** Mobile Phone (Mobile-First, Touch-Optimized)  

---

## 🎯 ROLE OVERVIEW

### Purpose
The Customer is the end-user who scans table QR codes, browses menus, places orders, makes payments, and tracks their dining experience. The customer-facing interface is designed for zero-training, intuitive interactions.

### Key Responsibilities
- Scan table QR code to access menu
- Browse menu and add items to cart
- Place orders with special instructions
- Make payments (online or request cash)
- Track order status in real-time
- Call waiter when needed
- Provide feedback after dining

### Access Level
**PUBLIC ACCESS** - No authentication required. Session-based access tied to table ID. Can only view/modify their own cart and orders for their table session.

---

## 📱 SCREENS & PAGES

### 1. **Table Page** (`/table/:tableId`)
**Purpose:** Primary customer interface - Menu browsing + Cart + Checkout

**URL Format:** `https://restaurant.com/table/uuid-table-id`  
**Access:** Via QR code scan (no login required)

**Layout:** Full-screen mobile app experience

---

## 🍽️ TABLE PAGE COMPONENTS

### Header (Sticky)
- **Restaurant Logo:** Top-left
- **Table Number:** "Table 5" (prominent display)
- **Cart Button (Floating):** 
  - Fixed bottom-right corner
  - Shows item count badge (e.g., "3 items")
  - Shows cart total (e.g., "₹450")
  - Pulses when items added
  - Always visible while scrolling

### Menu Section

#### Category Tabs (Horizontal Scroll)
- **Sticky below header**
- Tabs: All, Appetizers, Mains, Desserts, Beverages, etc.
- Active tab highlighted (orange/red gradient)
- Smooth scroll to category section on tap

#### Menu Items Grid
- **2-column layout on mobile**
- **3-4 columns on tablet**

**Menu Item Card:**
```
┌─────────────────────────┐
│   [Item Image]          │
│   150x150px             │
├─────────────────────────┤
│ 🟢 Butter Chicken       │
│ ₹240                    │
│                         │
│ Creamy tomato curry...  │
│                         │
│ [−] 0 [+]               │
└─────────────────────────┘
```

**Card Elements:**
- **Image:** Square, 150x150px (lazy loaded)
- **Availability:** Green dot (in stock) or Gray "Out of stock"
- **Name:** Bold, 16px
- **Price:** ₹ format, 14px
- **Description:** Truncated to 2 lines, gray text
- **Quantity Stepper:** 
  - Minus button (disabled at 0)
  - Quantity display (center)
  - Plus button
  - Haptic feedback on tap

**Out of Stock Items:**
- Grayed out
- "Out of stock" badge
- Stepper disabled
- Cannot add to cart

### Cart Sheet (Bottom Sheet)
**Trigger:** Click cart button  
**Behavior:** Slides up from bottom (covers 70% of screen)

**Structure:**
```
┌─────────────────────────────────────┐
│ Your Cart               [X Close]   │
├─────────────────────────────────────┤
│ Table 5                             │
│ 3 items                             │
├─────────────────────────────────────┤
│ 2x Butter Chicken       ₹480        │
│    [−] 2 [+]            [Remove]    │
│                                     │
│ 1x Dal Makhani          ₹180        │
│    [−] 1 [+]            [Remove]    │
│                                     │
│ 2x Naan                 ₹80         │
│    [−] 2 [+]            [Remove]    │
├─────────────────────────────────────┤
│ Subtotal                ₹740        │
│ Tax (5%)                ₹37         │
│ ────────────────────────            │
│ Total                   ₹777        │
├─────────────────────────────────────┤
│ [← Continue Shopping]               │
│ [Proceed to Checkout →]             │
└─────────────────────────────────────┘
```

**Features:**
- **Item List:** All cart items with quantity steppers
- **Remove Button:** Per item (with confirmation)
- **Subtotal/Tax/Total:** Live calculation
- **Continue Shopping:** Close sheet, return to menu
- **Proceed to Checkout:** Navigate to checkout flow

**Edge Cases:**
- **Empty Cart:** Shows "Cart is empty" message + "Browse menu" button
- **Minimum Order:** Optional - can configure minimum order value

### Checkout Flow (Multi-Step)

**Step 1: Order Review** (Same as cart sheet with "Place Order" button)

**Step 2: Special Instructions** (Optional)
- Modal or expanded section
- Text area: "Any dietary preferences or special requests?"
- Examples: "Less spicy", "No onions", "Extra sauce"
- Character limit: 200 chars

**Step 3: Customer Details** (Optional)
- Name input (optional, for personalized service)
- Phone input (optional, for order updates)
- Pre-filled if provided previously (localStorage)

**Step 4: Payment Method Selection**
```
┌─────────────────────────────────────┐
│ Choose Payment Method               │
├─────────────────────────────────────┤
│ ○ Pay Online (Razorpay)             │
│   Credit/Debit Card, UPI, Wallets   │
│                                     │
│ ○ Pay Later (Order First)           │
│   Pay after dining                  │
│                                     │
│ ○ Request Cash Payment              │
│   Notify waiter for cash            │
├─────────────────────────────────────┤
│ [Confirm Order]                     │
└─────────────────────────────────────┘
```

**Payment Options:**

1. **Pay Online (Recommended):**
   - Immediate payment via Razorpay
   - Supports: Cards, UPI, Wallets
   - Order sent to kitchen immediately after payment
   - Order status: `payment_status = 'paid'`, `order_status = 'received'`

2. **Pay Later:**
   - Order created without payment
   - Food prepared and served
   - Payment at end of meal (online or cash)
   - Order status: `payment_status = 'pending'`, `order_status = 'pending_payment'`
   - **Note:** Kitchen may not start preparing until payment (restaurant policy)

3. **Request Cash Payment:**
   - Order created without payment
   - Broadcasts alert to waiters: "Table 5 - Cash Payment Request: ₹777"
   - Waiter brings POS or informs manager
   - Manager marks as "Cash Paid" in dashboard
   - Order status updates accordingly

**Step 5: Order Confirmation**
- Success animation (checkmark)
- Order number displayed: "Order #ORD-20251124-0001"
- Redirect to Order Status Page

---

### 2. **Payment Page** (`/payment/:orderId`)
**Purpose:** Razorpay payment gateway integration

**Trigger:** After clicking "Confirm Order" with "Pay Online" selected

**Flow:**
1. Backend creates Razorpay order
2. Returns order_id, amount, restaurant details
3. Frontend opens Razorpay modal
4. Customer completes payment
5. Razorpay webhook confirms payment
6. Order status updated: `payment_status = 'paid'`
7. Redirect to Order Status Page

**Payment Modal (Razorpay):**
- Card details / UPI ID / Wallet selection
- Razorpay-hosted UI (secure, PCI-compliant)
- Loading state during processing
- Success → Order Status Page
- Failure → Retry or "Pay Later" option

---

### 3. **Order Status Page** (`/order-status/:orderId`)
**Purpose:** Real-time order tracking for customers

**URL:** `/order-status/uuid-order-id`  
**Access:** Auto-redirect after order placement, or via link

**Layout:** Vertical timeline + item status

---

## 📊 ORDER STATUS PAGE COMPONENTS

### Header
- **Order Number:** "Order #ORD-20251124-0001" (bold)
- **Table Number:** "Table 5"
- **Order Time:** "12:45 PM"
- **Payment Status:** Badge (Paid ✓ / Pending ⏳)

### Order Progress Timeline (Vertical Stepper)

```
┌─────────────────────────────────────┐
│ ✓ Order Received                    │
│   12:45 PM                          │
│   │                                 │
│   ▼                                 │
│ ⏱ Preparing                         │
│   In the kitchen...                 │
│   │                                 │
│   ▼                                 │
│ ○ Ready to Serve                    │
│   Not yet                           │
│   │                                 │
│   ▼                                 │
│ ○ Served                            │
│   Waiting...                        │
└─────────────────────────────────────┘
```

**Step States:**
- **✓ Completed:** Green checkmark, timestamp shown
- **⏱ In Progress:** Yellow pulsing icon, "In the kitchen..."
- **○ Pending:** Gray outline circle, "Not yet"

**Timeline Steps:**
1. **Received:** Order confirmed, payment complete
2. **Preparing:** Chef is cooking
3. **Ready to Serve:** Food ready, waiter picking up
4. **Served:** Food delivered to table

### Item Status Breakdown

**Grouped by Status:**
```
┌─────────────────────────────────────┐
│ Started Preparing (2 items)         │
│  ⏱ 2x Butter Chicken                │
│  ⏱ 1x Dal Makhani                   │
│                                     │
│ Ready to Serve (1 item)             │
│  ✓ 2x Naan                          │
│                                     │
│ Waiting to Start (0 items)          │
│  (none)                             │
└─────────────────────────────────────┘
```

**Item Status Colors:**
- **Waiting:** Gray (not started)
- **Preparing:** Yellow (cooking)
- **Ready:** Green (cooked, waiting for waiter)
- **Served:** Purple (delivered)

### Estimated Time

**Dynamic Calculation:**
```
┌─────────────────────────────────────┐
│ ⏱ Estimated Time                    │
│ ≈ 12 minutes                        │
│                                     │
│ Based on current kitchen load       │
└─────────────────────────────────────┘
```

**Logic:**
- Base prep time per category (e.g., curries: 15 min, breads: 5 min)
- Adjusted by kitchen queue length
- Updates in real-time as items progress

### Order Summary (Right Column on Desktop, Below Timeline on Mobile)

```
┌─────────────────────────────────────┐
│ Order Details                       │
├─────────────────────────────────────┤
│ 2x Butter Chicken       ₹480        │
│ 1x Dal Makhani          ₹180        │
│ 2x Naan                 ₹80         │
│                                     │
│ Subtotal                ₹740        │
│ Tax (5%)                ₹37         │
│ ────────────────────────            │
│ Total                   ₹777        │
│                                     │
│ Payment: Paid ✓                     │
└─────────────────────────────────────┘
```

### Action Buttons

**1. Call Waiter Button (Floating)**
- Fixed bottom-left corner
- Bell icon 🔔
- "Call Waiter" label
- Pulses gently
- Click → Broadcasts alert to waiters

**2. Pay Now Button (If Pending)**
- Shows if `payment_status = 'pending'`
- "Complete Payment" button
- Redirects to Payment Page

**3. Provide Feedback Button (After Served)**
- Shows when `order_status = 'served'`
- "Rate Your Experience" button
- Opens Feedback Modal

---

### 4. **Feedback Page** (`/feedback/:orderId`)
**Purpose:** Collect customer ratings and comments

**Trigger:** 
- Button on Order Status Page (after order served)
- Optional link sent via SMS/email

**Components:**

#### Rating Section
```
┌─────────────────────────────────────┐
│ How was your experience?            │
│                                     │
│ ⭐⭐⭐⭐⭐ (5 stars)                  │
│ Tap to rate                         │
└─────────────────────────────────────┘
```

**Star Rating:**
- 1-5 stars
- Large, tappable stars (48x48px)
- Animates on selection
- Required field

#### Comments Section
```
┌─────────────────────────────────────┐
│ Tell us more (optional)             │
│                                     │
│ [Text area - 500 chars max]        │
└─────────────────────────────────────┘
```

#### Quick Tags (Optional)
- Pre-defined tags for common feedback
- Examples: "Delicious", "Fast Service", "Good Value", "Too Spicy", "Cold Food"
- Multi-select chips
- Optional, but helpful for analytics

#### Submit Button
- "Submit Feedback" button
- Shows loading state
- Success → Thank you message
- Error → Retry option

**After Submission:**
- Thank you animation
- "Thank you for your feedback!" message
- Button: "Back to Order Status" or "Close"

---

## 🔴 REAL-TIME UPDATES

### Order Status Updates

#### Subscribed Events
**Table:** `orders`  
**Filter:** `id = customer's order_id`  
**Events:** UPDATE (only for customer's order)

**Triggers:**

1. **Order Status Changed:**
   - Chef starts preparing → `order_status = 'preparing'`
   - Timeline updates: "Preparing" step becomes active (yellow pulse)
   - Toast: "Your order is being prepared! 🍳"

2. **Item Status Changed:**
   - Chef marks item ready → `item_status = 'ready'`
   - Item moves to "Ready to Serve" section
   - Toast: "Your Butter Chicken is ready! 🔔"

3. **Order Ready:**
   - All items ready → `order_status = 'ready'`
   - Timeline updates: "Ready to Serve" step becomes active
   - Toast: "Your food is ready! Waiter will serve soon. 🍽️"

4. **Order Served:**
   - Waiter marks served → `order_status = 'served'`
   - Timeline updates: "Served" step becomes active (green checkmark)
   - Toast: "Enjoy your meal! ❤️"
   - Feedback button appears

5. **Payment Status Changed:**
   - Manager marks cash paid → `payment_status = 'paid'`
   - Payment badge updates: "Paid ✓"
   - "Pay Now" button disappears

**Real-Time Sync:**
- WebSocket connection via Supabase Realtime
- Updates appear within 1-3 seconds
- Smooth animations for status changes
- No page refresh needed

### Table Session Security

**Session Management:**
- No authentication required (friction-free)
- Session tied to `table_id` + browser session
- Cart stored in `localStorage` (persists on refresh)
- Orders linked to `table_id` (not user account)

**Security Checks:**
1. **Order Viewing:**
   - Customer can only view orders for their `table_id`
   - Cannot access other tables' orders
   - Backend validates `order.table_id` matches session

2. **Payment Status:**
   - Checks if order already paid (prevents double payment)
   - Redirects to Order Status if already paid

3. **Session Expiry:**
   - Session expires after table marked "available" by manager
   - Or after 24 hours (configurable)
   - Cart cleared on session expiry

---

## ⚡ ACTIONS & CAPABILITIES

### Menu Browsing Actions

#### 1. **View Menu**
**Trigger:** Scan QR code → Land on Table Page  
**Flow:**
1. Customer scans QR code (camera app or QR reader)
2. Opens URL: `/table/{table_id}`
3. Frontend validates table exists and is active
4. Loads menu items for restaurant
5. Displays menu grid with categories
6. Table marked as "occupied" (if not already)

**Initial State:**
- Cart empty
- Menu visible
- Categories loaded
- No orders yet

#### 2. **Filter by Category**
**Trigger:** Tap category tab  
**Flow:**
1. Tap "Appetizers" tab
2. Page scrolls to Appetizers section
3. Tab highlighted (active state)
4. Smooth scroll animation

**Alternative:** Tap "All" to show all items

#### 3. **Search Menu** (Future Feature)
**Trigger:** Type in search bar  
**Flow:**
1. Enter "Chicken"
2. Real-time filter: Show only items with "Chicken" in name/description
3. Clear search → Show all items

### Cart Management Actions

#### 4. **Add Item to Cart**
**Trigger:** Click "+" button on menu item  
**Flow:**
1. Click "+" on "Butter Chicken" card
2. Quantity increases: 0 → 1
3. Haptic feedback (vibration)
4. Item added to cart (localStorage)
5. Cart button updates:
   - Badge shows: "1 item"
   - Total shows: "₹240"
6. Cart button pulses (draws attention)
7. Item card shows quantity: [−] 1 [+]

**Repeat:**
- Click "+" again → Quantity: 1 → 2
- Cart total updates: ₹240 → ₹480

#### 5. **Remove Item from Cart**
**Trigger:** Click "−" button on menu item or in cart sheet  
**Flow:**
1. Click "−" on "Butter Chicken" card
2. Quantity decreases: 2 → 1
3. Cart total updates: ₹480 → ₹240
4. If quantity reaches 0:
   - Item removed from cart
   - Stepper resets to [−] 0 [+]

**Alternative:** Click "Remove" in cart sheet
- Confirmation: "Remove Butter Chicken from cart?"
- Click "Yes" → Item removed (quantity → 0)

#### 6. **View Cart**
**Trigger:** Click cart button  
**Flow:**
1. Click floating cart button (bottom-right)
2. Bottom sheet slides up (covers 70% of screen)
3. Shows cart items list
4. Shows subtotal, tax, total
5. Shows action buttons: "Continue Shopping", "Proceed to Checkout"

**Empty Cart:**
- Shows "Your cart is empty 🛒"
- Button: "Browse Menu" (closes sheet)

#### 7. **Modify Cart in Sheet**
**Trigger:** Change quantity in cart sheet  
**Flow:**
1. In cart sheet, click "+" on "Dal Makhani"
2. Quantity: 1 → 2
3. Total updates: ₹777 → ₹957
4. localStorage updates
5. Cart button badge updates

**Remove Item:**
1. Click "Remove" button
2. Confirmation: "Remove Dal Makhani?"
3. Click "Yes"
4. Item removed from cart
5. Total recalculates

### Order Placement Actions

#### 8. **Proceed to Checkout**
**Trigger:** Click "Proceed to Checkout" in cart sheet  
**Flow:**
1. Cart sheet closes
2. Checkout flow begins (multi-step)

**Step 1: Order Review**
- Shows cart items (read-only)
- Shows total
- Button: "Add Special Instructions" (optional)
- Button: "Next" → Payment Selection

**Step 2: Special Instructions (Optional)**
1. Click "Add Special Instructions"
2. Modal opens with text area
3. Enter: "Less spicy, no onions"
4. Click "Save"
5. Instructions saved to order draft
6. Returns to Order Review
7. Shows instructions badge

**Step 3: Customer Details (Optional)**
1. Click "Add Your Name" (optional field)
2. Enter: "Prashant"
3. Phone: "+91 98765 43210" (optional)
4. Click "Save"
5. Details saved to localStorage (pre-fill next time)

**Step 4: Payment Method Selection**
1. Screen shows 3 payment options:
   - Pay Online (Razorpay) - recommended
   - Pay Later (Order First, Pay After)
   - Request Cash Payment
2. Customer selects: "Pay Online"
3. Click "Confirm Order"
4. Backend creates order:
   - `order_status = 'pending_payment'` (temporarily)
   - `payment_status = 'pending'`
   - `items` array with all cart items
   - `table_id`, `restaurant_id`, `customer_name`, `special_instructions`
5. Order ID returned
6. Navigate to Payment Page

#### 9. **Complete Payment (Online)**
**Trigger:** After clicking "Confirm Order" with "Pay Online"  
**Flow:**

**Step 1: Razorpay Order Creation**
1. Backend calls Razorpay API: `orders.create()`
2. Returns: `razorpay_order_id`, `amount`, `currency`
3. Frontend receives payment details

**Step 2: Open Razorpay Modal**
1. Razorpay checkout modal opens
2. Customer sees payment options:
   - Credit/Debit Cards
   - UPI (Google Pay, PhonePe, Paytm)
   - Wallets (Paytm, MobiKwik, etc.)
   - Net Banking

**Step 3: Customer Completes Payment**
1. Select UPI → Enter UPI ID: "customer@okicici"
2. Click "Pay ₹777"
3. UPI app opens (Google Pay, etc.)
4. Customer authorizes payment
5. Payment processing (10-30 seconds)

**Step 4: Payment Success**
1. Razorpay confirms payment
2. Frontend receives: `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`
3. Backend verifies signature (security check)
4. Backend updates order:
   - `payment_status = 'paid'`
   - `order_status = 'received'`
   - Creates payment record in `payments` table
5. Success animation (checkmark)
6. Toast: "Payment successful! Your order is confirmed. 🎉"
7. **Cart cleared** (localStorage)
8. Redirect to Order Status Page

**Payment Failure:**
1. Razorpay returns error
2. Frontend shows error message
3. Options:
   - Retry payment
   - Choose different payment method
   - Cancel order (if not yet submitted)

#### 10. **Order Without Payment (Pay Later)**
**Trigger:** Select "Pay Later" in payment method  
**Flow:**
1. Customer selects "Pay Later"
2. Click "Confirm Order"
3. Backend creates order:
   - `order_status = 'pending_payment'`
   - `payment_status = 'pending'`
4. Order appears in Manager/Chef dashboard with "Pending Payment" badge
5. **Kitchen may wait** until payment before cooking (restaurant policy)
6. Customer sees Order Status Page with "Payment Pending" warning
7. "Pay Now" button prominently displayed
8. Customer can pay anytime during meal:
   - Click "Pay Now" → Redirects to Payment Page
   - Complete payment → Order sent to kitchen

#### 11. **Request Cash Payment**
**Trigger:** Select "Request Cash Payment" in payment method  
**Flow:**
1. Customer selects "Request Cash Payment"
2. Click "Confirm Order"
3. Backend creates order:
   - `order_status = 'pending_payment'`
   - `payment_status = 'pending'`
   - `payment_method = 'cash'`
4. Broadcasts alert to all waiters:
   - Channel: `waiter-alerts-{restaurant_id}`
   - Event: `request_cash_payment`
   - Payload: `{ tableNumber: 5, amount: 777, orderId: 'uuid' }`
5. Waiter receives alert on dashboard:
   - Red banner: "TABLE 5 - 💵 CASH PAYMENT: ₹777"
   - Sound plays
6. Waiter responds:
   - Walks to Table 5
   - Collects cash
   - Informs manager
7. Manager marks order as "Cash Paid" in dashboard
8. Order status updates:
   - `payment_status = 'paid'`
   - `order_status = 'received'`
9. Customer sees "Payment Received ✓" on Order Status Page
10. Order sent to kitchen

### Order Tracking Actions

#### 12. **View Order Status**
**Trigger:** Auto-redirect after order placement, or bookmark link  
**Flow:**
1. Land on `/order-status/{order_id}`
2. Backend fetches order details
3. Real-time subscription established
4. Timeline displays current status
5. Item statuses grouped and displayed
6. Estimated time calculated and shown

**Real-Time Updates:**
- Order status changes → Timeline updates
- Item status changes → Item list updates
- Toast notifications for key milestones

#### 13. **Call Waiter**
**Trigger:** Click "Call Waiter" button  
**Flow:**
1. Customer needs assistance (e.g., extra napkins, check on order)
2. Click "Call Waiter" button (bell icon 🔔)
3. Confirmation: "Call waiter to your table?"
4. Click "Yes"
5. Broadcast sent to waiter channel:
   - Event: `call_waiter`
   - Payload: `{ tableNumber: 5, at: timestamp, restaurantId: 'uuid' }`
6. **All waiters receive alert:**
   - Red banner on waiter dashboard
   - Sound plays (urgent.mp3)
   - Toast: "Table 5 is calling for service!"
7. Waiter responds (within 1-2 minutes)
8. Success toast for customer: "Waiter notified! 🔔"

**Use Cases:**
- Need water refill
- Extra cutlery
- Check on order status
- Request bill
- Dietary question

#### 14. **Provide Feedback**
**Trigger:** Click "Rate Your Experience" after order served  
**Flow:**
1. Order status = 'served'
2. "Rate Your Experience" button appears
3. Customer clicks button
4. Feedback modal opens (or navigates to Feedback Page)

**Step 1: Star Rating**
1. Tap stars: 1 to 5 (e.g., 4 stars)
2. Stars animate (fill with color)
3. Required field

**Step 2: Comments (Optional)**
1. Enter comments: "Delicious food, fast service!"
2. Character limit: 500 chars

**Step 3: Quick Tags (Optional)**
1. Tap tags: "Delicious", "Fast Service"
2. Tags highlight (multi-select)

**Step 4: Submit**
1. Click "Submit Feedback"
2. Backend creates feedback record:
   - `order_id`, `rating`, `comment`, `tags`, `table_id`
3. Success animation
4. Toast: "Thank you for your feedback! ❤️"
5. Manager can view feedback in dashboard

---

## 🔒 DATA ACCESS PERMISSIONS

### What Customer CAN See:
✅ Menu items for the restaurant (public data)  
✅ Their own cart (stored in localStorage)  
✅ Their own orders for their table session  
✅ Order status and item statuses (real-time)  
✅ Table number and restaurant info  
✅ Payment status for their orders  
✅ Estimated time for order preparation  

### What Customer CANNOT See:
❌ Other tables' orders or carts  
❌ Other customers' data  
❌ Restaurant staff information  
❌ Kitchen operations (beyond order status)  
❌ Payment methods or financial data (beyond their own payments)  
❌ Restaurant analytics or reports  
❌ Menu item costs or profit margins  
❌ Staff communications  
❌ Cannot modify other customers' orders  
❌ Cannot access manager/chef/waiter dashboards  

### Data Isolation:
- **Cart:** Isolated by browser session (localStorage)
- **Orders:** Filtered by `table_id` (backend validation)
- **Real-time updates:** Only for customer's order (not others)
- **No authentication:** Public access, session-based security

---

## 📋 WORKFLOW: STEP-BY-STEP

### A. Customer Arrival → QR Scan

**Step 1: Customer Arrives at Restaurant**
1. Host seats customer at Table 5
2. Customer sees QR code on table (printed card or tent)

**Step 2: Scan QR Code**
1. Customer opens camera app (iOS/Android)
2. Points camera at QR code
3. QR code recognized: `https://restaurant.com/table/{table_id}`
4. Notification appears: "Open in Browser"
5. Tap notification → Opens in browser (Chrome, Safari, etc.)

**Step 3: Table Page Loads**
1. URL: `/table/uuid-table-5`
2. Frontend validates table:
   - Checks table exists
   - Checks table is active (`is_active = true`)
   - If invalid: Shows error "Table not found"
3. Loads restaurant data (name, logo)
4. Loads menu items (from `menu_items` table)
5. Groups by category
6. Displays menu grid
7. Cart initialized (empty)

**Step 4: Table Status Update**
1. Backend checks if table has active session
2. If no session: Creates session (`session_started_at = now()`)
3. Table status → 'occupied'
4. Manager/Waiter dashboard shows Table 5 as "Occupied"

### B. Browsing Menu

**Step 1: View Menu**
1. Customer sees menu grid (2 columns on mobile)
2. Categories displayed at top (tabs)
3. Menu items show: Image, Name, Price, Description, Availability

**Step 2: Filter by Category**
1. Customer interested in appetizers
2. Tap "Appetizers" tab
3. Page scrolls to appetizers section
4. Customer browses appetizer items

**Step 3: View Item Details**
1. Customer taps "Paneer Tikka" card
2. Modal opens (future feature) or card expands
3. Shows: Full image, full description, price, ingredients

### C. Adding Items to Cart

**Step 1: Add First Item**
1. Customer decides: "2x Butter Chicken"
2. Tap "+" button twice
3. Quantity shows: [−] 2 [+]
4. Haptic feedback (vibration) on each tap
5. Cart button updates:
   - Badge: "2 items"
   - Total: "₹480"
6. Cart button pulses (draws attention)

**Step 2: Add More Items**
1. Tap "Appetizers" tab
2. Add "1x Paneer Tikka" (tap "+" once)
3. Tap "Breads" tab
4. Add "2x Naan" (tap "+" twice)
5. Cart button updates:
   - Badge: "5 items" (2 Chicken + 1 Tikka + 2 Naan)
   - Total: "₹740"

**Step 3: Review Cart**
1. Tap cart button (bottom-right)
2. Bottom sheet slides up
3. Shows:
   - 2x Butter Chicken - ₹480
   - 1x Paneer Tikka - ₹180
   - 2x Naan - ₹80
   - Subtotal: ₹740
   - Tax (5%): ₹37
   - Total: ₹777

**Step 4: Modify Cart**
1. Customer realizes: "Too much food"
2. Tap "−" on Paneer Tikka
3. Quantity: 1 → 0 (item removed)
4. Total updates: ₹777 → ₹597

**Step 5: Continue Shopping**
1. Customer: "Need dessert"
2. Tap "← Continue Shopping"
3. Cart sheet closes
4. Returns to menu
5. Tap "Desserts" tab
6. Add "1x Gulab Jamun"
7. Cart total: ₹597 → ₹647

### D. Placing Order

**Step 1: Proceed to Checkout**
1. Tap cart button
2. Cart sheet opens
3. Review items:
   - 2x Butter Chicken - ₹480
   - 2x Naan - ₹80
   - 1x Gulab Jamun - ₹87
   - Total: ₹647 + ₹32.35 tax = ₹679.35
4. Tap "Proceed to Checkout"

**Step 2: Add Special Instructions**
1. Screen shows: "Any special requests?"
2. Tap "Add Instructions"
3. Enter: "Less spicy, extra sauce on the side"
4. Tap "Save"
5. Instructions saved

**Step 3: Add Customer Details (Optional)**
1. Screen shows: "Your Name (optional)"
2. Enter: "Prashant"
3. Phone: "+91 98765 43210" (skipped)
4. Tap "Next"

**Step 4: Choose Payment Method**
1. Screen shows 3 options:
   - ⚡ Pay Online (Recommended)
   - ⏰ Pay Later
   - 💵 Request Cash Payment
2. Customer selects: "Pay Online" (for immediate order)
3. Tap "Confirm Order"
4. Loading spinner (1-2 seconds)

**Step 5: Complete Payment**
1. Razorpay modal opens
2. Customer sees amount: ₹679.35
3. Options: Cards, UPI, Wallets, Net Banking
4. Customer selects: UPI
5. Enter UPI ID: "prashant@oksbi"
6. Tap "Pay"
7. Google Pay opens (UPI app)
8. Customer authorizes payment with PIN/biometric
9. Payment processing (10-15 seconds)
10. Payment successful!
11. Razorpay modal closes
12. Success animation (green checkmark)
13. Toast: "Payment successful! Your order is confirmed. 🎉"

**Step 6: Order Confirmation**
1. Screen shows: "Order Placed Successfully!"
2. Order number: "Order #ORD-20251124-0012"
3. Button: "Track Your Order"
4. Auto-redirect (3 seconds) → Order Status Page

### E. Tracking Order

**Step 1: Order Status Page Loads**
1. URL: `/order-status/uuid-order-12`
2. Page displays:
   - Order number + Table number
   - Timeline: "Order Received ✓" (green)
   - Payment status: "Paid ✓"
   - Items list: All items "Waiting to Start" (gray)
   - Estimated time: "≈ 18 minutes"

**Step 2: Real-Time Updates (Chef Starts Cooking)**
1. Chef sees order in kitchen dashboard
2. Chef clicks "Start Preparing" on "Butter Chicken"
3. Real-time UPDATE event fires
4. Customer's phone:
   - Timeline updates: "Preparing ⏱" (yellow pulse)
   - Item status: "2x Butter Chicken - Preparing" (yellow badge)
   - Toast: "Your order is being prepared! 🍳"
   - Estimated time: "≈ 15 minutes" (updated)

**Step 3: Chef Marks Items Ready**
1. Chef completes "Butter Chicken" (after 12 minutes)
2. Chef clicks "Mark Ready"
3. Real-time UPDATE event fires
4. Customer's phone:
   - Item status: "2x Butter Chicken - Ready ✓" (green badge)
   - Toast: "Your Butter Chicken is ready! 🔔"
   - Timeline still shows "Preparing" (not all items ready)

**Step 4: All Items Ready**
1. Chef completes "Naan" and "Gulab Jamun"
2. Chef marks all as "Ready"
3. Order status → 'ready'
4. Real-time UPDATE event fires
5. Customer's phone:
   - Timeline updates: "Ready to Serve ✓" (green)
   - All items show green "Ready" badge
   - Toast: "Your food is ready! Waiter will serve soon. 🍽️"
   - Estimated time: "Arriving in ~2 minutes"

**Step 5: Waiter Serves Food**
1. Waiter sees order in "Ready" column
2. Waiter picks up food from kitchen
3. Walks to Table 5
4. Serves food: "Enjoy your meal!"
5. Waiter opens phone → Clicks "Mark All Served"
6. Real-time UPDATE event fires
7. Customer's phone:
   - Timeline updates: "Served ✓" (green, completed)
   - All items show purple "Served" badge
   - Toast: "Enjoy your meal! ❤️"
   - Button appears: "Rate Your Experience"

### F. Post-Meal Actions

**Step 1: Finish Eating**
1. Customer enjoys meal (30 minutes)
2. Ready to leave

**Step 2: Provide Feedback (Optional)**
1. Customer taps "Rate Your Experience"
2. Feedback modal opens
3. Tap 5 stars: ⭐⭐⭐⭐⭐
4. Enter comment: "Absolutely delicious! Fast service too."
5. Select tags: "Delicious", "Fast Service", "Great Value"
6. Tap "Submit Feedback"
7. Success animation
8. Toast: "Thank you for your feedback! ❤️"

**Step 3: Leave Restaurant**
1. Customer closes browser (or keeps open for future visits)
2. Cart cleared (already emptied after order)
3. Session persists (table still "occupied" until manager clears)

**Step 4: Manager Cleans Table**
1. Manager sees Table 5 as "Served" (gray)
2. After customer leaves, manager clicks "Mark Available"
3. Table status → 'available' (green)
4. Session closed
5. Next customer can scan QR and start fresh

### G. Alternative Flows

**Scenario 1: Pay Later (Dine First, Pay After)**

**Different at Step D.4:**
1. Customer selects: "Pay Later"
2. Tap "Confirm Order"
3. Order created:
   - `order_status = 'pending_payment'`
   - `payment_status = 'pending'`
4. Order appears in dashboard with "Pending Payment" badge
5. **Kitchen waits** until payment (restaurant policy)
6. Customer eats first
7. After meal, customer:
   - Opens Order Status Page
   - Sees "Payment Pending ⏳" warning
   - Tap "Pay Now" button
   - Completes payment (same Razorpay flow)
8. Order sent to kitchen after payment

**Scenario 2: Request Cash Payment**

**Different at Step D.4:**
1. Customer selects: "Request Cash Payment"
2. Tap "Confirm Order"
3. Order created with `payment_method = 'cash'`
4. Broadcast alert sent to waiters
5. Waiter receives alert: "TABLE 5 - 💵 CASH PAYMENT: ₹679.35"
6. Waiter walks to Table 5
7. Customer pays cash
8. Waiter informs manager
9. Manager marks "Cash Paid" in dashboard
10. Order status updates: `payment_status = 'paid'`, `order_status = 'received'`
11. Kitchen starts preparing

**Scenario 3: Call Waiter During Meal**

**At Step E.5 (During Eating):**
1. Customer needs water refill
2. Tap "Call Waiter" button (bell icon)
3. Confirmation: "Call waiter to your table?"
4. Tap "Yes"
5. Broadcast sent to waiters
6. All waiters receive alert (red banner + sound)
7. Waiter responds (within 1 minute)
8. Waiter arrives: "How can I help?"
9. Customer: "Can I get water refill?"
10. Waiter: "Of course!" (refills water)
11. Waiter dismisses alert on dashboard

---

## 🔄 EVENT DEPENDENCIES & STATE CHANGES

### Order Lifecycle (Customer's View)

```
Cart (localStorage) 
  ↓ [Customer clicks "Confirm Order"]
Order Created (`pending_payment`)
  ↓ [Customer pays or manager marks paid]
Order Received (`received`) → Chef can start
  ↓ [Chef starts cooking]
Order Preparing (`preparing`)
  ↓ [Chef marks ready]
Order Ready (`ready`)
  ↓ [Waiter serves]
Order Served (`served`)
  ↓ [Customer provides feedback]
Order Completed (`completed`)
```

### Real-Time Triggers (Customer Receives)

**From Chef:**
- Chef starts item → Customer sees "Preparing"
- Chef marks ready → Customer sees "Ready"

**From Waiter:**
- Waiter serves → Customer sees "Served"
- Waiter responds to "Call Waiter" → (physical interaction, no system event)

**From Manager:**
- Manager marks cash paid → Customer sees "Paid ✓"
- Manager broadcasts message → Customer receives (future feature)

### Customer Actions Trigger:

**To Waiter:**
- Customer clicks "Call Waiter" → Waiter receives alert

**To Manager:**
- Customer requests cash payment → Waiter notified → Manager marks paid

**To Chef:**
- Customer places order + pays → Chef sees in kitchen queue

---

## ⚠️ EDGE CASES & ERROR HANDLING

### 1. **QR Code Scan Fails**
**Scenario:** QR code damaged or invalid

**Handling:**
- Shows error: "Invalid QR code. Please contact staff."
- Customer informs waiter
- Waiter provides fresh QR code or manual table selection

### 2. **Menu Not Loading**
**Scenario:** Network error or server down

**Handling:**
- Shows error: "Unable to load menu. Please try again."
- Retry button
- Offline mode (cached menu - future feature)

### 3. **Payment Gateway Timeout**
**Scenario:** Razorpay doesn't respond

**Handling:**
- Shows error: "Payment timed out. Please try again."
- Options:
  - Retry payment
  - Choose "Pay Later"
  - Contact staff
- Order remains in `pending_payment` state

### 4. **Payment Success But Order Not Updated**
**Scenario:** Webhook delay or failure

**Handling:**
- Customer sees "Payment successful" from Razorpay
- But order status still "pending"
- Webhook reconciliation (10-30 seconds delay)
- If >1 minute:
  - Show warning: "Payment received but order pending. Our team is checking."
  - Manual verification by manager
  - Manager marks as paid if confirmed

### 5. **Duplicate Order Submission**
**Scenario:** Customer clicks "Confirm Order" twice rapidly

**Handling:**
- Button disabled after first click
- Loading spinner shown
- Backend idempotency check (if order already exists, return existing order)
- Prevents duplicate orders

### 6. **Order Status Not Updating**
**Scenario:** Real-time subscription disconnects

**Handling:**
- "Offline" indicator shown
- Manual refresh button
- On reconnect: Auto-sync state
- Customer sees updated status

### 7. **Item Out of Stock After Adding to Cart**
**Scenario:** Chef marks item unavailable after customer adds to cart

**Handling:**
- On checkout: Backend validation
- If item unavailable:
  - Shows error: "Butter Chicken is no longer available. Please remove from cart."
  - Highlights unavailable item
  - Customer removes item
  - Proceeds with remaining items

### 8. **Table Already Has Active Order**
**Scenario:** Previous customer's order still active

**Handling:**
- New customer scans QR
- Shows warning: "Table has an active order. Please wait or ask staff."
- Or: Shows previous order (if same session)
- Manager must clear table session before new customers

### 9. **Customer Leaves Without Paying**
**Scenario:** "Pay Later" order, customer leaves

**Prevention:**
- Waiter monitors unpaid orders
- Manager can track `payment_status = 'pending'`
- Alert shown if table marked "available" with unpaid order
- Manual intervention required

### 10. **Feedback Submitted Multiple Times**
**Scenario:** Customer submits feedback twice

**Handling:**
- Backend checks if feedback already exists for order
- If exists: Shows message "You already submitted feedback. Thank you!"
- Cannot submit again
- Or: Allows update (replaces previous feedback)

---

## 📱 UI/UX REQUIREMENTS

### Device Optimization
- **Primary:** Mobile phone (portrait mode, 5-7 inch screen)
- **Secondary:** Tablet (both orientations)
- **Works on:** Desktop (not optimized, but functional)

### Layout
- **Mobile:** Single column, vertical scroll
- **Tablet:** 2-3 column grid (menu items)
- **Sticky Elements:** Header + category tabs
- **Floating Button:** Cart button (bottom-right)

### Performance
- **Page Load:** < 2 seconds on 4G
- **Image Loading:** Lazy loading (only visible images)
- **Real-time Updates:** < 3 seconds from database change
- **Smooth Scroll:** 60 FPS on mid-range phones

### Accessibility
- **Touch Targets:** 44x44px minimum (thumb-friendly)
- **High Contrast:** Readable in restaurant lighting (bright/dim)
- **Color Blind Safe:** Status colors + icons/text
- **Screen Reader:** ARIA labels on all interactive elements

### Visual Hierarchy
- **Cart Button (Floating):** Highest priority - always visible
- **Category Tabs:** Second priority - sticky below header
- **Menu Items:** Primary content - large images, clear pricing
- **Feedback Prompts:** After order served - clear CTA

### Colors
- **Primary (Brand):** Orange/Red gradient (#FF6B35 → #F44336)
- **Success (Paid, Ready):** Green (#10B981)
- **Warning (Pending):** Yellow (#F59E0B)
- **Info (Preparing):** Blue (#3B82F6)
- **Completed (Served):** Purple (#8B5CF6)

### Animations
- **Cart Add:** Pulse + badge animation (200ms)
- **Order Placed:** Success animation (1 second)
- **Status Update:** Fade + scale (300ms)
- **Call Waiter:** Button pulse (continuous)

### Loading States
- **Page Load:** Skeleton loaders (cards, images)
- **Payment:** Full-screen spinner with message
- **Action Button:** Spinner inside button

### Empty States
- **Empty Cart:** "Your cart is empty 🛒" + "Browse Menu" CTA
- **No Orders Yet:** "Place your first order to start tracking"

### Notifications
- **Toast Position:** Bottom-center (mobile), top-right (desktop)
- **Duration:** 3-5 seconds
- **Sounds:** Optional (browser may block)
- **Browser Notifications:** Requires permission (for order updates)

### Haptic Feedback (Mobile)
- **Add to Cart:** Light vibration (50ms)
- **Order Placed:** Strong vibration (500ms)
- **Call Waiter:** Pattern vibration (3 pulses)

---

## 📝 NOTES FOR DESIGNERS

### Design System
- **Primary Color:** Orange (#FF6B35) for CTAs
- **Accent Color:** Red (#F44336) for highlights
- **Background:** White (#FFFFFF) or Light Gray (#F9FAFB)
- **Text:** Dark Gray (#1F2937) for readability

### Typography
- **Headings:** Bold, 20-24px, sans-serif
- **Body:** Regular, 14-16px, sans-serif
- **Prices:** Bold, 16px, monospace (tabular-nums)
- **Buttons:** Semibold, 16px, uppercase

### Spacing
- **Card Padding:** 16px
- **Card Margin:** 12px
- **Section Padding:** 16px horizontal
- **Button Padding:** 12px vertical, 32px horizontal

### Iconography
- **Library:** Lucide React
- **Sizes:** 20px (inline), 24px (buttons), 48px (empty states)
- **Style:** Outlined

### Cards
- **Border Radius:** 12px (rounded-xl)
- **Shadow:** sm (default), md (hover), lg (modals)
- **Border:** 1px solid #E5E7EB

### Images
- **Menu Items:** Square, 150x150px, object-fit: cover
- **Placeholders:** Gray background with icon
- **Lazy Loading:** Load only when in viewport

### Buttons
- **Primary (CTA):** Orange gradient, white text, large
- **Secondary:** White background, gray border, gray text
- **Disabled:** Gray background, lighter text, no hover

### Mobile Considerations
- **Thumb Zone:** Primary actions within bottom 2/3 of screen
- **One-Handed Use:** Cart button bottom-right (thumb reach)
- **Landscape Mode:** Adjust grid (3-4 columns)

### Restaurant Environment
- **Varying Lighting:** High contrast for visibility
- **Table Space Limited:** Optimized for phone-only use
- **Interruptions:** Auto-save cart (localStorage persistence)

---

## 🎯 SUCCESS CRITERIA

### Customer can successfully:
✅ Scan QR code and access menu instantly (no login)  
✅ Browse menu by category with images and prices  
✅ Add/remove items from cart with clear feedback  
✅ View cart with accurate totals (subtotal, tax, total)  
✅ Place order with optional special instructions  
✅ Choose payment method (online, later, cash)  
✅ Complete payment via Razorpay (cards, UPI, wallets)  
✅ Receive order confirmation with order number  
✅ Track order status in real-time (preparing, ready, served)  
✅ See estimated time for order completion  
✅ Call waiter when needed (instant alert)  
✅ Provide feedback after meal (star rating + comments)  
✅ Enjoy seamless experience on mobile phone  

---

**End of Customer Workflow Documentation**
