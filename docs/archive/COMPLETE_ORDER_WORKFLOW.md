# 🍽️ Complete Order Workflow - Tabun Restaurant System

## 📋 Table of Contents
1. [Customer Ordering Process](#customer-ordering-process)
2. [Payment Flow](#payment-flow)
3. [Chef/Kitchen Workflow](#chefkitchen-workflow)
4. [Waiter Service Workflow](#waiter-service-workflow)
5. [Order Status Lifecycle](#order-status-lifecycle)
6. [Real-time Updates](#real-time-updates)
7. [Post-Meal Options](#post-meal-options)

---

## 🛒 Customer Ordering Process

### Step 1: QR Code Scan
**Location**: Customer scans QR code on physical table
**URL Pattern**: `/table/:tableId?restaurant=slug`

**What Happens:**
1. Customer scans QR code → redirects to table page
2. System loads table information from database
3. Table status automatically updated to `"occupied"`
4. Menu items fetched for that restaurant

**Files Involved:**
- `src/pages/TablePage.jsx` - Main customer interface
- `src/lib/supabaseClient.js` - `getTable()`, `getMenuItems()`, `markTableOccupied()`

### Step 2: Browse Menu
**Features:**
- **Category Tabs**: Filter by Starters, Main Course, Desserts, Beverages, etc.
- **Search**: Real-time search by dish name or description
- **Menu Item Display**:
  - 5:4 aspect ratio images
  - Vegetarian indicator (green border + dot)
  - Price in ₹
  - 5-star rating display
  - Hot/Cold/Popular tags
  - Description (2-line clamp)

**Components:**
- `src/Components/MenuItem.jsx` - Individual dish card
- `src/Components/CategoryTabs.jsx` - Category navigation
- `src/pages/TablePage.jsx` - Grid layout (2/3/4 columns responsive)

### Step 3: Add to Cart
**Actions Customer Can Take:**
1. Click "Add to Cart" button → adds 1 quantity
2. View cart summary (desktop: right sidebar, mobile: bottom banner)
3. Adjust quantities (+/- buttons)
4. Remove items
5. Add special notes/instructions per item

**Cart Storage:**
- **LocalStorage Key**: `mealmate_cart_${tableId}`
- **Data Stored**: 
  ```javascript
  {
    id: menuItemId,
    name: "Butter Chicken",
    price: 450,
    quantity: 2,
    notes: "Extra spicy",
    is_vegetarian: false
  }
  ```

**Files:**
- `src/Components/CartSummary.jsx` - Cart UI
- `src/lib/localStorage.js` - Cart management functions

### Step 4: Checkout
**When customer clicks "Proceed to Checkout":**

1. **Validation**:
   - Cart not empty
   - Table data loaded
   - Restaurant ID present

2. **Order Preparation** (`prepareOrderData()`):
   ```javascript
   {
     restaurant_id: uuid,
     table_id: uuid,
     table_number: "5",
     order_number: "ORD-20251106-0001", // Auto-generated
     order_token: "abc123xyz", // For tracking
     items: [
       {
         menu_item_id: uuid,
         name: "Butter Chicken",
         price: 450,
         quantity: 2,
         notes: "Extra spicy",
         is_veg: false,
         item_status: "queued", // Initial status
         started_at: null,
         ready_at: null,
         served_at: null
       }
     ],
     subtotal: 900,
     tax: 162, // 18% GST
     discount: 0,
     total: 1062,
     payment_status: "pending",
     order_status: "pending_payment" // Won't show in chef dashboard yet
   }
   ```

3. **Database Insert**:
   - Order created in `orders` table
   - Order items stored in JSONB `items` column
   - Returns order ID

4. **Navigation**:
   - Cart cleared from localStorage
   - Redirect to `/payment/:orderId`

**Files:**
- `src/lib/orderHelpers.js` - `prepareOrderData()`, `generateOrderNumber()`
- `src/lib/supabaseClient.js` - `createOrder()`

---

## 💳 Payment Flow

### Payment Page
**URL**: `/payment/:orderId`
**Component**: `src/pages/PaymentPage.jsx`

**What's Displayed:**
1. **Order Summary**:
   - Order number
   - Table number
   - List of items with quantities and prices
   - Subtotal, Tax (18%), Total

2. **Customer Details** (editable):
   - Name (optional)
   - Phone (optional)
   - Email (optional)

3. **Payment Methods**:
   - Razorpay Integration (UPI, Cards, Wallets)
   - Test cards shown in development

### Payment Process

#### Option 1: Pay Now (Razorpay)
1. Click "Pay with Razorpay"
2. Razorpay modal opens
3. Customer selects payment method:
   - **UPI**: Enter UPI ID or scan QR
   - **Cards**: Credit/Debit card details
   - **Wallets**: Paytm, PhonePe, Google Pay
4. Payment processed
5. **On Success**:
   - Payment record created in `payments` table
   - Order `payment_status` → `"paid"`
   - Order `order_status` → `"received"` (now visible to chef!)
   - Redirect to `/order-status/:orderId`

#### Option 2: Skip Payment (Pay at Counter)
1. Click "Skip Payment"
2. Order `payment_status` → `"pending"`
3. Order `order_status` → `"received"` (visible to chef)
4. Redirect to `/order-status/:orderId`

**Files:**
- `src/pages/PaymentPage.jsx` - Payment UI
- `src/lib/razorpayHelper.js` - Razorpay integration
- `src/lib/supabaseClient.js` - `createPayment()`, `updateOrder()`

---

## 👨‍🍳 Chef/Kitchen Workflow

### Chef Dashboard
**URL**: `/chef`
**Component**: `src/pages/ChefDashboard.jsx`
**Authentication**: Email/password (role: chef, manager, or admin)

### What Chef Sees

**Stats Cards:**
- **Received**: Orders paid but not started (blue)
- **Preparing**: Orders being cooked (yellow)
- **Ready**: Orders ready for pickup (green)
- **Active**: Total orders not yet served (gray)

**Filters:**
- Active Orders (default)
- All Orders
- Ready for Service
- Search by order number or table

**Order Cards** (`src/Components/OrderCard.jsx`):
```
┌─────────────────────────────────────┐
│ Order #ORD-20251106-0001            │
│ Table 5 • 12:30 PM • 5 items        │
├─────────────────────────────────────┤
│ ✓ 2x Butter Chicken - READY        │
│ ⏱ 1x Dal Makhani - PREPARING       │
│ ⏳ 2x Naan - RECEIVED               │
├─────────────────────────────────────┤
│ 💡 Special: Extra spicy             │
├─────────────────────────────────────┤
│ Total: ₹1,062                       │
│ Payment: PAID ✓                     │
└─────────────────────────────────────┘
```

### Chef Actions - Per Item Status

Each menu item in an order has its own status:

**1. QUEUED** (Gray)
- Initial state when order created
- Not yet paid
- Chef doesn't see this

**2. RECEIVED** (Blue)
- Payment completed
- Order appears in chef dashboard
- Chef can click: **"Start Preparing" →** Changes to PREPARING

**3. PREPARING** (Yellow)
- Chef is cooking the item
- Timer starts (`started_at` timestamp set)
- Chef can click: **"Mark Ready" →** Changes to READY

**4. READY** (Green)
- Item is cooked and ready to serve
- `ready_at` timestamp set
- Waiter gets notification
- Chef cannot change to SERVED (waiter does this)

**5. SERVED** (Purple)
- Waiter delivered to customer
- `served_at` timestamp set
- Item complete

### Order-Level Status

The overall order status is determined by items:

**Order Status Logic:**
- If ALL items are `served` → Order status: `"served"`
- If ANY item is `ready` → Order status: `"ready"`
- If ANY item is `preparing` and none ready → Order status: `"preparing"`
- If all items are `received` → Order status: `"received"`

### Real-time Updates for Chef

**Supabase Realtime Subscription:**
```javascript
subscribeToOrders(restaurantId, (newOrders) => {
  // New orders appear instantly
  // Sound notification plays
  // Toast: "New order received: #ORD-20251106-0001"
})
```

**Fallback Polling:**
- Every 3 seconds if realtime fails
- Ensures chef never misses orders

**Files:**
- `src/pages/ChefDashboard.jsx` - Main chef interface
- `src/Components/OrderCard.jsx` - Order display component
- `src/lib/supabaseClient.js` - `updateOrderItemStatus()`, `subscribeToOrders()`
- `src/lib/notificationService.js` - Sound + browser notifications

---

## 🍽️ Waiter Service Workflow

### Waiter Dashboard
**URL**: `/waiter`
**Component**: `src/pages/waiter/WaiterDashboard.jsx`
**Authentication**: Email/password (role: waiter, manager, or admin)

### Dashboard Sections

#### 1. Stats Overview
- **Available Tables**: Green (not occupied)
- **Occupied Tables**: Orange (customers seated)
- **Orders Ready**: Blue (items ready to serve)

#### 2. Tables Grid
Visual grid showing all tables with status indicators:

**Table Status Colors:**
- **Available** (Green): No customers, ready for seating
- **Occupied** (Orange): Customers seated, no active orders
- **Ordering** (Blue): Customer has items in cart
- **Eating** (Yellow): Order placed, being prepared
- **Ready** (Purple): Food ready to serve
- **Served** (Gray): Food delivered, waiting for feedback/payment

**Table Status Logic:**
```javascript
function getTableStatus(tableId) {
  const orders = ordersForTable(tableId);
  
  if (!orders.length) return 'available';
  
  const latestOrder = orders[0];
  
  if (latestOrder.order_status === 'served') return 'served';
  if (latestOrder.order_status === 'ready') return 'ready';
  if (latestOrder.order_status === 'preparing') return 'eating';
  if (latestOrder.order_status === 'received') return 'eating';
  if (latestOrder.order_status === 'pending_payment') return 'ordering';
  
  return 'occupied';
}
```

#### 3. Orders Section

**Order Filters:**
- **Active** (default): received, preparing, ready, served (not completed)
- **All**: Every order
- **Ready**: Items ready to serve
- **Served**: Already delivered
- **Item Ready**: Any order with at least one item ready

**Order Card Display:**
```
┌─────────────────────────────────────┐
│ #ORD-20251106-0001                  │
│ Table: 5                            │
│ ₹1,062 • [READY] [PAID]             │
├─────────────────────────────────────┤
│ Items:                              │
│ • 2x Butter Chicken [READY] [Serve] │
│ • 1x Dal Makhani [PREPARING]        │
│ • 2x Naan [READY] [Serve]           │
└─────────────────────────────────────┘
```

### Waiter Actions

#### Action 1: Mark Item as Served
**When:** Item status is `"ready"` AND payment is `"paid"`

**Process:**
1. Waiter clicks **"Serve"** button next to item
2. System calls `markOrderItemServed(orderId, itemIndex)`
3. Item `item_status` → `"served"`
4. Item `served_at` → current timestamp
5. **Real-time update** sent to all dashboards

**What Updates:**
- Customer sees item marked as served on `/order-status/:orderId`
- If ALL items served → Order status becomes `"served"`
- Customer redirected to `/post-meal/:orderId/:tableNumber`

#### Action 2: Call for Waiter
**Customer-initiated:**
- Customer clicks "Call Waiter" button on table page
- Waiter sees notification (optional feature, not fully implemented)

### Payment Collection (For Skip Payment Orders)

If customer skipped payment:
1. Waiter can view payment status: `"pending"`
2. Can mark order as paid manually (admin function)
3. Or direct customer to complete payment at counter

**Files:**
- `src/pages/waiter/WaiterDashboard.jsx` - Main waiter interface
- `src/lib/supabaseClient.js` - `markOrderItemServed()`, `subscribeToOrders()`

---

## 📊 Order Status Lifecycle

### Complete Status Flow

```
┌─────────────────┐
│  CUSTOMER ADDS  │
│   TO CART       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CLICK CHECKOUT │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  ORDER CREATED                  │
│  order_status: "pending_payment"│
│  payment_status: "pending"      │
│  items[].item_status: "queued"  │
└────────┬────────────────────────┘
         │
         ├─────────────────┬───────────────┐
         ▼                 ▼               ▼
    ┌─────────┐      ┌──────────┐   ┌──────────┐
    │ PAY NOW │      │   SKIP   │   │  CANCEL  │
    │ (Razorpay)│    │ PAYMENT  │   │          │
    └─────┬────┘      └─────┬────┘   └──────────┘
          │                  │
          ▼                  ▼
    ┌──────────────────────────┐
    │  PAYMENT COMPLETED       │
    │  payment_status: "paid"  │
    │  order_status: "received"│
    │  items[]: "received"     │
    └──────────┬───────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │   CHEF DASHBOARD        │
    │   Order appears!        │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │   CHEF: Start Preparing │
    │   item_status: "preparing"│
    │   started_at: timestamp │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │   CHEF: Mark Ready      │
    │   item_status: "ready"  │
    │   ready_at: timestamp   │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │   WAITER DASHBOARD      │
    │   Order shows "READY"   │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │   WAITER: Serve Item    │
    │   item_status: "served" │
    │   served_at: timestamp  │
    └──────────┬──────────────┘
               │
               ▼
    ┌─────────────────────────────┐
    │   ALL ITEMS SERVED?         │
    │   order_status: "served"    │
    └──────────┬──────────────────┘
               │
               ▼
    ┌─────────────────────────┐
    │   CUSTOMER REDIRECTED   │
    │   to POST-MEAL OPTIONS  │
    └─────────────────────────┘
```

### Status Tracking

**Database Fields:**

**Order Level (`orders` table):**
- `order_status`: received | preparing | ready | served | cancelled | completed
- `payment_status`: pending | paid | failed | refunded
- `created_at`: Order creation time
- `updated_at`: Last modification time

**Item Level (`items` JSONB array):**
- `item_status`: queued | received | preparing | ready | served
- `started_at`: When chef started cooking
- `ready_at`: When chef marked ready
- `served_at`: When waiter served to customer

---

## 🔄 Real-time Updates

### Technologies Used

**Supabase Realtime:**
- WebSocket connection to PostgreSQL
- Subscriptions to `orders` table changes
- Broadcasts INSERT, UPDATE, DELETE events

**Polling Fallback:**
- 3-second interval for chef
- 10-second interval for order status page
- Ensures updates even if WebSocket fails

### Who Gets What Updates?

#### Chef Dashboard
**Subscribes to**: All orders where `restaurant_id = currentRestaurant`

**Receives:**
- ✅ New orders (INSERT)
- ✅ Status changes (UPDATE)
- ✅ Item status changes (UPDATE)
- 🔔 Sound + toast notification for new orders

#### Waiter Dashboard
**Subscribes to**: All orders + all tables for restaurant

**Receives:**
- ✅ New orders
- ✅ Status changes (especially ready → served)
- ✅ Table status changes
- 🔔 Notification when items become ready

#### Customer Order Status Page
**Subscribes to**: Single order by `order_id`

**Receives:**
- ✅ Order status updates
- ✅ Item status changes
- 🔔 Toast: "Your Butter Chicken is ready!"
- 🔔 Toast: "Order status updated: Served"

#### Manager/Admin Dashboard
**Subscribes to**: All orders for restaurant (10-second auto-refresh)

**Receives:**
- ✅ New orders
- ✅ All status changes
- 📊 Stats auto-update

### Real-time Implementation

**Setup:**
```javascript
// src/lib/supabaseClient.js
export const subscribeToOrders = async (restaurantId, onOrderChange, onError) => {
  const subscription = supabase
    .channel('orders')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`
      },
      (payload) => {
        onOrderChange(payload.new || payload.old);
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
};
```

**Usage in Components:**
```javascript
useEffect(() => {
  const unsubscribe = subscribeToOrders(
    restaurantId,
    (newOrders) => {
      setOrders(newOrders);
      toast.success("New order received!");
    },
    (error) => console.error(error)
  );

  return () => unsubscribe();
}, [restaurantId]);
```

**Files:**
- `src/lib/supabaseClient.js` - Realtime subscriptions
- `src/hooks/useRealtimeOrders.js` - Custom hook for orders
- `src/pages/OrderStatusPage.jsx` - Customer realtime tracking

---

## 🎉 Post-Meal Options

### When Triggered
**Automatically when:** All order items are served
**URL**: `/post-meal/:orderId/:tableNumber`
**Component**: `src/pages/PostMealOptions.jsx`

### Options Presented

```
┌─────────────────────────────────────┐
│   What would you like to do next?  │
├─────────────────────────────────────┤
│  [🍽️ Order More Items]             │
│  Returns to /table/:tableId         │
│                                     │
│  [✅ Complete Visit]                │
│  Redirects to /feedback/:orderId    │
└─────────────────────────────────────┘
```

#### Option 1: Order More Items
1. Customer clicks "Order More"
2. Redirects to `/table/:tableNumber`
3. Same table, new cart starts
4. Can add more items and checkout again
5. Creates a **new order** for same table

#### Option 2: Complete Visit
1. Customer clicks "Complete Visit"
2. Redirects to `/feedback/:orderId`
3. Feedback form appears

### Feedback Form
**URL**: `/feedback/:orderId`
**Component**: `src/pages/FeedbackPage.jsx`

**Fields:**
1. **Rating**: 1-5 stars (required)
2. **Comments**: Text area (optional)
3. **Item-specific feedback**: Rate each dish

**On Submit:**
```javascript
// Create feedback record
{
  order_id: orderId,
  rating: 5,
  comments: "Excellent food and service!",
  customer_name: "John Doe",
  created_at: timestamp
}

// Update order
order.feedback_submitted = true
order.feedback_submitted_at = timestamp
```

**After Submission:**
- Thank you message
- Option to order again → `/table/:tableNumber`
- Option to go home → `/`

**Files:**
- `src/pages/PostMealOptions.jsx` - Post-meal choice screen
- `src/pages/FeedbackPage.jsx` - Feedback form
- `src/lib/supabaseClient.js` - `createFeedback()`

---

## 🔐 Security & Permissions

### Row Level Security (RLS)

**Orders Table:**
- ✅ Customers: Can read their own orders (by order_token)
- ✅ Chef: Can read/update orders for their restaurant
- ✅ Waiter: Can read/update orders for their restaurant
- ✅ Manager: Can read/update all orders for their restaurant
- ✅ Owner: Can read all orders across all restaurants

**Menu Items Table:**
- ✅ Anyone: Can read active items (for customer ordering)
- ✅ Manager: Can create/update/delete for their restaurant
- ✅ Owner: Full access across restaurants

**Payments Table:**
- ✅ Customers: Can create payment for their order
- ✅ Manager: Can view payments for their restaurant
- ✅ Owner: Can view all payments

### Authentication Flow

**Customer:** No login required (uses order_token for tracking)
**Staff:** 
- Login at `/login?mode=manager` or `/chef/login` or `/waiter/login`
- Session stored in localStorage
- JWT token in Supabase auth
- Auto-logout on session expiry

---

## 📱 Notifications

### Types of Notifications

#### 1. Browser Notifications
**Requires**: User permission
**Who gets them**: Chef, Waiter, Manager

**Events:**
- 🔔 New order received (Chef)
- ✅ Order ready for pickup (Waiter)
- 💰 Payment completed (Manager)

#### 2. Toast Notifications
**In-app toasts** (React Hot Toast):
- ✓ Success: "Order created successfully"
- ⚠️ Warning: "Cart is empty"
- ❌ Error: "Failed to load menu"
- ℹ️ Info: "Order status updated: Preparing"

#### 3. Sound Alerts
**Audio notifications** for:
- 🔊 New order (Chef) - `newOrder.mp3`
- 🔊 Order ready (Waiter) - `foodReady.mp3`
- 🔊 Payment received (Manager) - `payment.mp3`

**Files:**
- `src/lib/notificationService.js` - Notification management
- `public/sounds/` - Audio files

---

## 🎯 Manager Dashboard Options

### Order Management
**URL**: `/manager/orders`
**Features:**

1. **View All Orders**
   - Real-time order list with auto-refresh (10 seconds)
   - Filter by status, payment status, date range
   - Search by order number, table, customer

2. **Status Management**
   - Manually change order status if needed
   - Override chef/waiter actions (emergency)
   - Cancel orders (only if not paid)

3. **Payment Status**
   - View payment details
   - Mark as paid manually (for cash payments)
   - Refund processing (admin only)

4. **Export Options**
   - Export to CSV/PDF
   - Date range selection
   - Include payment details

### Analytics
**URL**: `/manager/dashboard`
- Total orders today/week/month
- Revenue statistics
- Popular items
- Average order value
- Table turnover rate
- Customer feedback scores

---

## 🔄 Edge Cases & Error Handling

### Customer Side

**1. Lost Connection During Order**
- Cart saved in localStorage
- Can resume after reconnection
- Order creation retried on network restore

**2. Payment Failure**
- Order stays in `"pending_payment"` status
- Customer can retry payment
- Or skip and pay at counter

**3. Browser Refresh**
- Cart persists (localStorage)
- Order tracking via URL (order_token)
- No data loss

### Kitchen/Waiter Side

**1. Realtime Subscription Fails**
- Automatic fallback to polling
- No interruption in service
- Orders still update

**2. Concurrent Updates**
- Last write wins (database level)
- Optimistic UI updates
- Conflict resolution via timestamps

**3. Offline Mode**
- Show "Offline" indicator
- Queue actions when reconnected
- Prevent order submission without connection

---

## 📝 Summary: Complete Flow

### Happy Path Workflow

1. **Customer** scans QR → Table marked `occupied`
2. **Customer** browses menu → Adds items to cart (localStorage)
3. **Customer** clicks checkout → Order created (`pending_payment`)
4. **Customer** pays via Razorpay → `payment_status`: `paid`, `order_status`: `received`
5. **Chef** sees new order in dashboard → Sound alert plays
6. **Chef** clicks "Start Preparing" per item → `item_status`: `preparing`
7. **Chef** clicks "Mark Ready" when cooked → `item_status`: `ready`, `ready_at`: timestamp
8. **Waiter** sees "Ready" badge in dashboard
9. **Waiter** picks up food, clicks "Serve" → `item_status`: `served`, `served_at`: timestamp
10. **Customer** sees real-time update → "Your Butter Chicken is served!"
11. **When all items served** → Customer redirected to post-meal options
12. **Customer** chooses "Complete Visit" → Feedback form
13. **Customer** submits 5-star review → `feedback_submitted`: true
14. **Done!** Order complete, table ready for next customer

---

## 🛠️ Technical Files Reference

### Customer Journey
| Feature | File |
|---------|------|
| Table Page | `src/pages/TablePage.jsx` |
| Menu Item Card | `src/Components/MenuItem.jsx` |
| Cart Summary | `src/Components/CartSummary.jsx` |
| Payment | `src/pages/PaymentPage.jsx` |
| Order Tracking | `src/pages/OrderStatusPage.jsx` |
| Post-Meal | `src/pages/PostMealOptions.jsx` |
| Feedback | `src/pages/FeedbackPage.jsx` |

### Staff Journey
| Feature | File |
|---------|------|
| Chef Dashboard | `src/pages/ChefDashboard.jsx` |
| Waiter Dashboard | `src/pages/waiter/WaiterDashboard.jsx` |
| Manager Dashboard | `src/pages/admin/Dashboard.jsx` |
| Order Management | `src/pages/admin/OrdersManagement.jsx` |
| Menu Management | `src/pages/admin/MenuManagement.jsx` |

### Utilities
| Feature | File |
|---------|------|
| Database Client | `src/lib/supabaseClient.js` |
| Order Helpers | `src/lib/orderHelpers.js` |
| Local Storage | `src/lib/localStorage.js` |
| Notifications | `src/lib/notificationService.js` |
| Razorpay | `src/lib/razorpayHelper.js` |
| Permissions | `src/utils/permissions.js` |

### Database
| Table | Purpose |
|-------|---------|
| `restaurants` | Restaurant info |
| `tables` | Physical table details |
| `menu_items` | Menu with prices |
| `orders` | Customer orders |
| `payments` | Payment records |
| `feedbacks` | Customer reviews |
| `users` | Staff accounts |

---

## 🎬 Conclusion

This system provides a **complete, real-time, contactless ordering experience** from customer scan to feedback submission, with parallel dashboards for kitchen and service staff, all synced via Supabase real-time subscriptions.

**Key Features:**
✅ QR code-based ordering
✅ Real-time status updates
✅ Per-item status tracking
✅ Integrated payment processing
✅ Multi-role dashboards
✅ Customer feedback loop
✅ Offline-ready architecture
✅ Sound + browser notifications
✅ Responsive design (mobile-first)

**For questions or customization, refer to:**
- `README.md` - Setup instructions
- `PROJECT_OVERVIEW.md` - Architecture details
- `PERFORMANCE_OPTIMIZATION.md` - Performance tips
- `database/` folder - SQL schemas and migrations
