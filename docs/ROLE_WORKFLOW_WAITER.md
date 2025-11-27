# 🍽️ WAITER ROLE - COMPLETE WORKFLOW DOCUMENTATION

**Document Version:** 1.0  
**Last Updated:** November 24, 2025  
**Role:** Restaurant Waiter / Server  
**Primary Device:** Mobile Phone + Tablet (Mobile-First Design)  

---

## 🎯 ROLE OVERVIEW

### Purpose
The Waiter is the frontline service role responsible for table management, serving food, handling customer requests, and ensuring excellent dining experiences. They bridge kitchen operations with customer service.

### Key Responsibilities
- Monitor table statuses and customer sessions
- Track orders ready for serving
- Mark items/orders as "Served" when delivered
- Respond to "Call Waiter" alerts from customers
- Handle cash payment requests
- Monitor complaints and customer issues
- Coordinate with kitchen on order readiness
- Ensure timely table turnover

### Access Level
**SERVICE-ONLY ACCESS** - Can view orders and tables, update serving status, but cannot manage payments, menu, or settings (scoped to their restaurant only)

---

## 📱 SCREENS & PAGES

### 1. **Waiter Dashboard** (`/waiter/dashboard`)
**Purpose:** Mobile service management system for table and order monitoring

**Layout:** 2-Tab Interface
- **Tab 1:** Orders (3-column kanban view)
- **Tab 2:** Tables (grid view)

**Components:**

#### Header Bar (Sticky)
- **Logo + Title:** "Waiter Dashboard"
- **User Email:** Logged-in waiter's email
- **Alert Badge:** Red pulsing badge (if customer alerts present)
- **Refresh Button:** Manual refresh trigger (with spinner)
- **Logout Button:** End waiter session

#### Tab Navigation (Below Header)
- **Orders Tab:** Shows kanban board of orders
  - Badge: "Ready" count (green badge) if orders ready
- **Tables Tab:** Shows table grid
  - Badge: Alert count (red badge) if customer called

#### Alert Banner (Above Main Content - Only When Active)
**Appears when customer calls waiter or requests cash payment**

**Structure:**
```
┌─────────────────────────────────────────────────────┐
│ 🚨 CALL WAITER ALERT!         [2 active alerts]    │
│                                                     │
│ ┌─ TABLE 5 ─────────────────────────────┐         │
│ │ 🔔 SERVICE REQUEST                     │         │
│ │ [RESPOND NOW]  [Dismiss]               │         │
│ └────────────────────────────────────────┘         │
│                                                     │
│ ┌─ TABLE 8 ─────────────────────────────┐         │
│ │ 💵 CASH PAYMENT: ₹450                  │         │
│ │ [RESPOND NOW]  [Dismiss]               │         │
│ └────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Red background (urgent attention)
- Pulsing animation
- Sound plays on new alert
- Dismissible (per alert)
- "Respond Now" button (navigates to table)

---

## 📱 ORDERS TAB

### Stats Row (4 Cards)
- **Ready:** Count of orders ready to serve (green)
- **In Kitchen:** Count of orders preparing (yellow)
- **Served Today:** Total orders served today (blue)
- **Assigned:** Number of tables assigned to waiter (gray)

### Search Bar
- Search by order number or table number
- Real-time filtering

### 3-Column Kanban Board

**Column 1: PREPARING**
- **Header:** "Preparing" + count badge (yellow)
- Shows orders with status = 'preparing'
- Items being cooked in kitchen
- **Waiter Action:** Wait (no action button)

**Column 2: READY TO SERVE**
- **Header:** "Ready to Serve" + count badge (green)
- Shows orders with status = 'ready'
- Food ready for pickup from kitchen
- **Waiter Action:** "Mark Served" button (per item or entire order)

**Column 3: SERVED**
- **Header:** "Served" + count badge (purple)
- Shows orders with status = 'served'
- Already delivered to customers
- **Waiter Action:** None (completed)

### Order Card Component (`WaiterOrderCard.jsx`)

**Structure:**
```
┌───────────────────────────────────────┐
│ Order #ORD-20251124-0001              │
│ Table 5 • 12:45 PM                    │
├───────────────────────────────────────┤
│ Items:                                │
│  ✓ 2x Butter Chicken - READY         │
│  ✓ 1x Dal Makhani - READY            │
│  ✓ 2x Naan - READY                   │
├───────────────────────────────────────┤
│ Total: ₹650                           │
│ Payment: Paid ✓                       │
├───────────────────────────────────────┤
│ [Mark All Served]                     │
└───────────────────────────────────────┘
```

**Card Elements:**
- **Header:** Order number + Table number + Time
- **Items List:** Each item with quantity, name, status badge
- **Total Amount:** Order total (rupees)
- **Payment Status:** Badge (Paid / Pending)
- **Action Button:** "Mark Served" (per item) or "Mark All Served" (entire order)

**Item Status Badges:**
- **Preparing:** Yellow (kitchen cooking)
- **Ready:** Green (ready to serve)
- **Served:** Purple (delivered to customer)

---

## 📱 TABLES TAB

### Stats Row (4 Cards)
- **Total Tables:** Count of all tables
- **Available:** Green (no customers)
- **Occupied:** Yellow (customers seated)
- **Attention:** Red (customer alerts - call waiter or cash payment)

### Table Grid View
**Layout:** Responsive grid (2-5 columns depending on screen width)

**Table Card:**
```
┌─────────────────┐
│   TABLE 5       │
│                 │
│   ● Occupied    │
│   4 seats       │
│                 │
│   [View Details]│
└─────────────────┘
```

**Status Colors:**
- **Green (Available):** No active session, ready for seating
- **Yellow (Occupied):** Customers seated, may have orders
- **Blue (Ready):** Food ready to serve
- **Red (Alert):** Customer called waiter or requested cash payment

**Click Action:** Opens table details (future feature) or navigates to table orders

---

## 🔴 REAL-TIME UPDATES

### Order Updates

#### Subscribed Events
**Table:** `orders`  
**Filter:** `restaurant_id = waiter's restaurant`  
**Events:** INSERT, UPDATE, DELETE

**Triggers:**

1. **New Order Created (INSERT):**
   - Toast: "📋 New order placed! Order #123, Table 5"
   - Sound: newOrder.mp3
   - Order appears in "Preparing" column
   - Stats cards update (+1 to "In Kitchen")

2. **Order Status Changed to 'Ready' (UPDATE):**
   - **Critical Trigger:** `old.order_status != 'ready'` AND `new.order_status = 'ready'`
   - Toast: "🔔 Order #123 is READY!" (prominent notification)
   - Sound: foodReady.mp3 (loud, attention-grabbing)
   - Order moves from "Preparing" to "Ready" column
   - Stats cards update (-1 from "In Kitchen", +1 to "Ready")
   - Card pulses with green highlight

3. **Order Marked Served (UPDATE):**
   - Order moves to "Served" column
   - Stats cards update (+1 to "Served Today")

4. **Order Deleted (DELETE):**
   - Order card fades out
   - Stats cards recalculate

### Table Updates

#### Subscribed Events
**Table:** `tables`  
**Filter:** `restaurant_id = waiter's restaurant`  
**Events:** INSERT, UPDATE, DELETE

**Triggers:**

1. **Table Status Changed (UPDATE):**
   - Table card updates color immediately
   - Stats cards recalculate (available/occupied counts)

2. **New Table Added (INSERT):**
   - Table appears in grid

3. **Table Deleted (DELETE):**
   - Table card fades out

### Customer Alerts

#### Call Waiter Alert
**Channel:** `waiter-alerts` or `waiter-alerts-{restaurant_id}`  
**Event:** `call_waiter`  
**Payload:**
```json
{
  "tableNumber": "5",
  "at": "2025-11-24T14:30:00Z",
  "restaurantId": "uuid"
}
```

**Trigger Flow:**
1. Customer clicks "Call Waiter" button on table page
2. Broadcast sent to waiter channel
3. **All waiters receive alert** (not assigned to specific waiter)
4. Sound plays: urgent.mp3 (pulsing alert)
5. Red banner appears at top of dashboard
6. Alert card shows: "TABLE 5 - 🔔 SERVICE REQUEST"
7. Toast notification with bounce animation
8. Browser notification (if permission granted)

**Waiter Actions:**
- Click "Respond Now" → Navigate to table (or Orders tab filtered to table)
- Click "Dismiss" → Remove alert from list (doesn't clear for other waiters)

#### Cash Payment Request
**Channel:** Same as call waiter  
**Event:** `request_cash_payment`  
**Payload:**
```json
{
  "tableNumber": "8",
  "amount": 450,
  "at": "2025-11-24T14:35:00Z",
  "restaurantId": "uuid"
}
```

**Trigger Flow:**
1. Customer requests cash payment on payment page
2. Broadcast sent to waiter channel
3. Sound plays + alert banner appears
4. Alert card shows: "TABLE 8 - 💵 CASH PAYMENT: ₹450"
5. Toast notification

**Waiter Actions:**
- Respond Now → Go to table with cash POS or inform manager
- Dismiss → Remove from alert list

### Broadcast Messages
**Channel:** `broadcast:{restaurant_id}`  
**Event:** `announcement`

**Payload:**
```json
{
  "message": "Special event: Birthday at Table 10",
  "priority": "normal",
  "roles": ["waiter", "all"],
  "from": "Manager"
}
```

**Triggers:**
- Manager broadcasts message → Waiter receives toast
- Priority "high": Red border, urgent sound, stays on screen
- Priority "normal": Blue border, standard sound, auto-dismiss

### Complaints Hook

**Hook:** `useRealtimeComplaints`  
**Purpose:** Monitors complaints assigned to waiter

**Triggers:**
- New complaint created → Waiter receives notification
- Complaint status changed → Waiter receives update
- Not displayed in UI (background monitoring only)

---

## ⚡ ACTIONS & CAPABILITIES

### Order Serving Actions

#### 1. **Mark Item Served** (Ready → Served)
**Trigger:** Click "Mark Served" button on individual item  
**Requirements:**
- Item status = 'ready' (chef marked ready)
- Order not already served

**Flow:**
1. Click "Mark Served" on specific item (e.g., "Butter Chicken")
2. Button shows spinner
3. Backend: `updateOrderItemStatus(orderId, itemId, 'served')`
4. Database updates:
   - `items[i].item_status = 'served'`
   - `items[i].served_at = current_timestamp`
   - If ALL items served:
     - `order.order_status = 'served'`
     - Order moves to "Served" column
5. Item badge turns purple
6. Success toast: "Butter Chicken served to Table 5"
7. Real-time update propagates:
   - Manager sees status change
   - Customer sees "Delivered!" on order status page

#### 2. **Mark All Served** (Entire Order)
**Trigger:** Click "Mark All Served" button on order card  
**Requirements:**
- Order status = 'ready' (all items ready)
- At least one item not served

**Flow:**
1. Click "Mark All Served"
2. Confirmation modal (optional): "Confirm all items served to Table 5?"
3. Button shows spinner
4. Backend: Loop through all items, mark each as 'served'
5. Database updates:
   - All `items[i].item_status = 'served'`
   - All `items[i].served_at = current_timestamp`
   - `order.order_status = 'served'`
6. Order card moves to "Served" column
7. Success toast: "Order #123 fully served to Table 5 ✓"
8. Stats cards update (+1 to "Served Today")

**Use Case:** Serving entire order at once (most common scenario)

#### 3. **View Order Details**
**Trigger:** Click on order card (anywhere except action buttons)  
**Flow:**
1. Order card expands or modal opens (future feature)
2. Shows:
   - Full item list with quantities
   - Special instructions
   - Customer name (if provided)
   - Order timestamps (placed, ready, served)
   - Payment details

### Table Management Actions

#### 4. **View Table Status**
**Trigger:** Click table card in Tables tab  
**Flow:**
1. Navigate to table view (or show table details modal)
2. Displays:
   - Table number + capacity
   - Current status
   - Active orders for this table
   - Customer session info (if available)

**Status Calculation Logic:**
```javascript
function getTableStatus(tableId) {
  const orders = ordersForTable(tableId);
  
  if (!orders.length) return 'available';
  
  const latestOrder = orders[0];
  
  if (latestOrder.status === 'ready') return 'ready'; // PRIORITY
  if (latestOrder.status === 'served') return 'served';
  if (latestOrder.status === 'preparing') return 'occupied';
  if (latestOrder.status === 'received') return 'occupied';
  
  return 'occupied';
}
```

#### 5. **Respond to Call Waiter Alert**
**Trigger:** Click "Respond Now" in alert banner  
**Flow:**
1. Click "Respond Now" for Table 5
2. Navigate to table (physical action - waiter walks to table)
3. Attend to customer request:
   - Refill water
   - Extra napkins
   - Menu questions
   - Bill request
4. After attending, click "Dismiss" on alert
5. Alert removed from waiter's dashboard
6. Other waiters may still see alert (not centrally cleared)

#### 6. **Handle Cash Payment Request**
**Trigger:** Customer requests cash payment  
**Flow:**
1. Alert appears: "TABLE 8 - 💵 CASH PAYMENT: ₹450"
2. Waiter clicks "Respond Now"
3. Navigate to table
4. Collect cash from customer
5. Two options:
   - **Option A:** Inform manager to mark paid in system
   - **Option B:** Waiter has POS access (future feature)
6. Manager clicks "Cash Paid" button in dashboard
7. Order payment_status → 'paid'
8. Alert dismissed automatically

### Search & Filter Actions

#### 7. **Search Orders**
**Trigger:** Type in search bar  
**Flow:**
1. Enter "Table 5" or "Order #123"
2. Real-time filter:
   - Matches order_number
   - Matches table_number
3. Unmatched orders fade out
4. Matched orders highlighted
5. Clear search → All orders reappear

#### 8. **Manual Refresh**
**Trigger:** Click refresh button  
**Flow:**
1. Button shows spinner
2. Refetch all orders + tables
3. Update state
4. Spinner stops
5. Toast: "Data refreshed" (optional)

---

## 🔒 DATA ACCESS PERMISSIONS

### What Waiter CAN See:
✅ Orders for their restaurant (all types, all statuses)  
✅ Order details: items, table number, time, status  
✅ Customer name (if provided)  
✅ Payment status (paid / pending)  
✅ Tables and their statuses  
✅ Special instructions for orders  
✅ Customer alerts (call waiter, cash requests)  
✅ Broadcast messages from manager  

### What Waiter CANNOT See:
❌ Payment amounts or financial data  
❌ Customer phone numbers or contact details  
❌ Menu management or pricing  
❌ Staff management  
❌ Restaurant settings  
❌ Analytics or detailed reports  
❌ Orders from other restaurants  
❌ Cannot cancel orders (manager only)  
❌ Cannot process refunds  
❌ Cannot mark orders as paid (manager only)  
❌ Cannot modify menu items  

### Data Isolation:
- **All queries filtered by:** `restaurant_id = waiter's restaurant`
- **RLS Policies:** Enforced at database level
- **Role check:** User.role must be 'waiter', 'manager', or 'admin'

---

## 📋 WORKFLOW: STEP-BY-STEP

### A. Waiter Login → Dashboard

**Step 1: Login**
1. Navigate to `/login`
2. Enter email + password (role: waiter)
3. Supabase authentication validates
4. Redirects to `/waiter/dashboard`

**Step 2: Dashboard Load**
1. Fetch waiter's restaurant data
2. Subscribe to orders (real-time channel)
3. Subscribe to tables (real-time channel)
4. Subscribe to waiter alerts (call waiter, cash requests)
5. Subscribe to broadcast messages
6. Load all active orders (excluding cancelled)
7. Load all tables
8. Calculate stats (ready, preparing, served, table counts)
9. Enable audio notifications
10. Display dashboard (default: Orders tab)

**Step 3: Audio Unlock**
- User clicks anywhere → Audio context unlocked
- Notification sounds enabled

### B. Monitoring Orders (Orders Tab)

**Continuous Monitoring:**
1. Orders auto-update via real-time subscriptions
2. "Preparing" column shows kitchen activity
3. "Ready" column shows orders to serve
4. "Served" column shows completed orders

**Key Focus:** **READY COLUMN** (green) - Highest priority

### C. Serving Food (Primary Workflow)

**Step 1: Order Becomes Ready**
1. Chef marks all items ready in kitchen
2. Real-time UPDATE event fires: `order_status → 'ready'`
3. Sound plays: foodReady.mp3
4. Toast: "🔔 Order #123 is READY!"
5. Order appears in "Ready" column (or moves from "Preparing")
6. Green highlight pulses on card

**Step 2: Waiter Picks Up Food**
1. Waiter sees order in "Ready" column
2. Identifies table number (e.g., Table 5)
3. Walks to kitchen pickup area
4. Collects food items

**Step 3: Waiter Delivers to Table**
1. Walks to Table 5
2. Serves food to customers
3. "Enjoy your meal!"

**Step 4: Mark Order Served**
1. Opens waiter dashboard on phone
2. Finds Order #123 in "Ready" column
3. Click "Mark All Served" button
4. Confirmation (optional): "Confirm served to Table 5?"
5. Tap "Confirm"
6. Order moves to "Served" column
7. Toast: "Order #123 served to Table 5 ✓"
8. Stats card: "Served Today" increments

**Alternative: Mark Items Individually**
- If serving items at different times (e.g., appetizers first)
- Click "Mark Served" on specific item
- Item badge → purple
- When ALL items served → Order → "Served" column

### D. Handling Customer Alerts

**Scenario 1: Customer Calls Waiter**

**Step 1: Alert Received**
1. Customer scans QR → Table page → Clicks "Call Waiter" 🔔
2. Broadcast sent to all waiters
3. Waiter's phone:
   - Sound plays (urgent.mp3)
   - Red banner appears at top
   - Alert card: "TABLE 5 - 🔔 SERVICE REQUEST"
   - Toast: "Table 5 is calling for service!"
   - Browser notification (if enabled)

**Step 2: Waiter Responds**
1. Waiter sees alert banner (hard to miss - red, pulsing)
2. Click "Respond Now"
3. Walk to Table 5
4. Attend to customer:
   - "How can I help you?"
   - Common requests:
     - Water refill
     - Extra cutlery
     - Check on order status
     - Request bill

**Step 3: Dismiss Alert**
1. After attending, return to phone
2. Click "Dismiss" on Table 5 alert
3. Alert removed from waiter's dashboard
4. Continue monitoring other orders

**Scenario 2: Customer Requests Cash Payment**

**Step 1: Alert Received**
1. Customer finishes meal → Requests cash payment
2. Broadcast sent to all waiters
3. Alert card: "TABLE 8 - 💵 CASH PAYMENT: ₹450"

**Step 2: Waiter Responds**
1. Click "Respond Now"
2. Walk to Table 8
3. Inform customer: "I'll arrange cash payment"
4. Two options:
   - **A:** Inform manager to mark paid in system
   - **B:** Use POS device (if available)

**Step 3: Manager Marks Paid**
1. Waiter tells manager: "Table 8 paid cash, ₹450"
2. Manager opens dashboard → Finds Order #XYZ
3. Clicks "Cash Paid" button
4. Order payment_status → 'paid'
5. Alert auto-dismissed for all waiters

**Step 4: Continue Service**
1. Return to Tables tab
2. Monitor for more alerts

### E. Monitoring Tables (Tables Tab)

**Step 1: View Table Grid**
1. Click "Tables" tab
2. Grid displays all tables
3. Color-coded status cards

**Step 2: Identify Priority Tables**
- **Red cards:** Customer alerts (call waiter, cash request) - URGENT
- **Blue cards:** Order ready to serve - HIGH PRIORITY
- **Yellow cards:** Occupied, order preparing - MONITOR
- **Green cards:** Available for new customers - IDLE

**Step 3: Table Status Workflow**

**Available (Green):**
- No customers
- No active orders
- Ready for seating

**Occupied (Yellow):**
- Customers seated
- Order may be placed
- Order may be preparing

**Ready (Blue):**
- Order ready to serve
- Waiter should serve immediately

**Served (Gray):**
- Food delivered
- Waiting for customer to finish
- May request bill

**Alert (Red):**
- Customer called waiter
- Cash payment requested
- Requires immediate attention

### F. Handling Multiple Tables

**Priority System:**
1. **RED ALERTS (Call Waiter)** → Respond immediately
2. **BLUE (Ready Orders)** → Serve within 2 minutes
3. **YELLOW (Preparing)** → Monitor, no action yet
4. **GREEN (Available)** → Idle, ready for seating

**Multitasking:**
- Waiter may handle 5-10 tables simultaneously
- Dashboard provides clear priorities
- Real-time updates prevent missed orders

### G. End of Shift / Logout

**Step 1: Handoff**
1. Inform next waiter of pending orders
2. Mention any special table situations

**Step 2: Logout**
1. Click "Logout" button
2. Session cleared
3. Real-time subscriptions closed
4. Redirects to `/login`

**Note:** Orders persist in system; next waiter continues service

---

## 🔄 EVENT DEPENDENCIES & STATE CHANGES

### Order Status State Machine (Waiter's Perspective)

```
preparing → [Chef Marks Ready] → ready
ready → [Waiter Marks Served] → served
```

**Waiter Controls:** `ready → served` transition only

### Table Status Calculation

```
Available → [Customer Scans QR] → Occupied
Occupied → [Order Placed] → Occupied
Occupied → [Order Preparing] → Occupied
Occupied → [Order Ready] → Ready (PRIORITY)
Ready → [Waiter Serves] → Served
Served → [Customer Leaves] → Available (manager marks)
```

### Dependencies on Other Roles

**Chef → Waiter:**
- Chef marks item ready → Waiter sees in "Ready" column
- Chef completes order → Waiter receives notification
- Chef delays → Waiter sees order stuck in "Preparing"

**Customer → Waiter:**
- Customer places order → Waiter sees in "Preparing" column
- Customer calls waiter → Waiter receives alert
- Customer requests cash → Waiter receives alert
- Customer leaves → Manager marks table available

**Manager → Waiter:**
- Manager marks cash paid → Order status updates
- Manager broadcasts message → Waiter receives notification
- Manager cancels order → Waiter sees order disappear

**Waiter → Manager:**
- Waiter marks served → Manager sees status update in dashboard
- Waiter delays service → Manager sees order in "Ready" too long

**Waiter → Customer:**
- Waiter marks served → Customer sees "Delivered!" on order status page
- Waiter serves food → Customer can provide feedback

---

## ⚠️ EDGE CASES & ERROR HANDLING

### 1. **Double-Serve Prevention**
**Scenario:** Two waiters try to serve same order simultaneously

**Handling:**
- First waiter clicks "Mark Served" → Updates database
- Second waiter's button disabled (real-time update)
- Second waiter sees order already in "Served" column
- Toast: "Order already served by another waiter"

### 2. **Alert Spam**
**Scenario:** Customer clicks "Call Waiter" multiple times

**Handling:**
- Alert deduplicated by table number
- Only one alert per table shown
- Timestamp updated on new clicks
- No spam (single alert card per table)

### 3. **Network Disconnection Mid-Service**
**Scenario:** WiFi drops while serving

**Handling:**
- Dashboard shows "Offline" indicator
- Actions queued (if possible) or show error
- On reconnect: Auto-sync state
- Order status updates from server
- Toast: "Connection restored"

### 4. **Order Cancelled After Ready**
**Scenario:** Manager cancels order while waiter is serving

**Handling:**
- Real-time DELETE event fires
- Order card fades out with red border
- Toast: "⚠️ Order #123 was cancelled"
- Waiter returns food to kitchen
- Informs manager

### 5. **Cash Payment But Order Already Paid**
**Scenario:** Customer paid online but requests cash receipt

**Handling:**
- Alert shows amount
- Waiter checks order: payment_status = 'paid'
- Informs customer: "Payment already received online"
- Dismiss alert
- No action needed

### 6. **Item Served Before Chef Marks Ready**
**Scenario:** Waiter serves food before chef updates system

**Prevention:**
- "Mark Served" button disabled if status ≠ 'ready'
- Forces proper workflow: received → preparing → ready → served
- Waiter cannot skip steps

### 7. **Multiple Waiters, No Assignment**
**Scenario:** All waiters see all orders/alerts

**Handling:**
- Coordination via visual state (first to respond wins)
- No explicit table assignment (flexible team model)
- Real-time updates prevent duplicate work
- Manager can implement assignment system (future feature)

### 8. **Alert Dismissed by Mistake**
**Scenario:** Waiter accidentally dismisses alert before responding

**Issue:** Alert removed from waiter's dashboard, may forget

**Mitigation:**
- Alert persists in system (not database-deleted)
- Other waiters still see alert
- Manager can broadcast reminder
- Table status shows "Alert" color (red)

### 9. **Long Wait Time (Order Ready >10 Mins)**
**Scenario:** Order sits in "Ready" column for too long

**Handling:**
- Manager sees order in "Ready" column (timed badge - future feature)
- Manager can broadcast: "Waiter needed for Table 5"
- Waiter prioritizes this order
- Customer may call waiter if frustrated

### 10. **Browser Refresh During Service**
**Scenario:** Waiter accidentally refreshes browser

**Handling:**
- Page reloads
- Dashboard re-initializes
- Fetches all orders from database
- Order state preserved (server-side)
- Alerts refetched (active alerts reappear)
- No data loss

---

## 📱 UI/UX REQUIREMENTS

### Device Optimization
- **Primary:** Mobile phone (portrait mode, 5-6 inch screen)
- **Secondary:** Tablet (landscape mode, 7-10 inch)
- **Not optimized for:** Desktop (works but not designed for)

### Layout
- **Mobile:** Vertical scroll, single-column cards
- **Tablet:** 2-3 column kanban, horizontal scroll
- **Sticky Elements:** Header + tab navigation always visible
- **Bottom Navigation:** Optional (future feature)

### Performance
- **Dashboard Load:** < 2 seconds on 4G
- **Real-time Update:** < 3 seconds from database change
- **Action Response:** Instant UI feedback, < 1 second backend
- **Smooth Scroll:** 60 FPS on mid-range phones

### Accessibility
- **Large Touch Targets:** 48x48px minimum (thumb-friendly)
- **High Contrast:** Readable in bright restaurant lighting
- **Clear Status Colors:** Not relying on color alone (icons + text)
- **Sound + Visual Alerts:** Dual notification system

### Visual Hierarchy
- **RED ALERTS (Top Banner):** Highest priority - cannot miss
- **Ready Column (Green):** Second priority - serve now
- **Preparing Column (Yellow):** Monitor - no action yet
- **Served Column (Purple):** Completed - informational

### Status Colors
- **Available (Green):** #10B981
- **Occupied (Yellow):** #F59E0B
- **Ready (Blue):** #3B82F6
- **Served (Purple):** #8B5CF6
- **Alert (Red):** #EF4444 (pulsing animation)

### Animations
- **Alert Banner:** Slide-down + pulse (500ms entrance)
- **Order Ready:** Pulse + highlight (green glow)
- **Order Served:** Fade-out + slide-right (300ms)
- **Tab Switch:** Cross-fade (150ms)

### Loading States
- **Dashboard Load:** Full-page spinner with waiter icon
- **Action Button:** Spinner inside button (button disabled)
- **Refresh:** Spinner icon in refresh button

### Empty States
- **No Ready Orders:** "All caught up! 🎉" with checkmark icon
- **No Alerts:** "No customer requests" with peaceful icon
- **No Tables:** "No tables to manage" with table icon

### Sound Alerts
- **New Order:** Bell sound (newOrder.mp3) - informational
- **Order Ready:** Chime sound (foodReady.mp3) - loud, urgent
- **Call Waiter:** Urgent bell (urgent.mp3) - very loud, repeating
- **Broadcast:** Standard notification sound
- **Volume:** Loud enough to hear in noisy restaurant

### Haptic Feedback (Mobile)
- **Order Ready:** Strong vibration (500ms)
- **Call Waiter Alert:** Pattern vibration (3 pulses)
- **Button Tap:** Light vibration (50ms)

---

## 📝 NOTES FOR DESIGNERS

### Design System
- **Primary Color:** Blue (#3B82F6) for "Ready"
- **Alert Color:** Red (#EF4444) for "Call Waiter"
- **Success Color:** Green (#10B981) for "Available"
- **Warning Color:** Yellow (#F59E0B) for "Occupied"
- **Completed Color:** Purple (#8B5CF6) for "Served"

### Typography
- **Order Numbers:** Bold, 16px, monospace
- **Table Numbers:** Semibold, 18px (large for quick scanning)
- **Status Badges:** Semibold, 12px, uppercase
- **Body Text:** Regular, 14px

### Spacing
- **Card Margin:** 12px between cards
- **Card Padding:** 16px inside cards
- **Section Padding:** 16px horizontal, 8px vertical
- **Button Padding:** 12px vertical, 24px horizontal

### Iconography
- **Icons:** Lucide React library
- **Sizes:** 20px (inline), 24px (buttons), 40px (empty states)
- **Style:** Outlined (consistent)

### Cards
- **Border Radius:** 12px (rounded-xl)
- **Shadow:** sm (default), md (hover), lg (alert banner)
- **Border:** 2px solid (status color for alerts)

### Touch Interactions
- **Tap Target:** Minimum 48x48px (thumb-friendly)
- **Swipe:** Future feature - swipe to mark served
- **Long Press:** Future feature - show order details

### Mobile Considerations
- **One-Handed Use:** Primary actions within thumb reach
- **Portrait Orientation:** Optimized for portrait (phone in pocket)
- **Quick Access:** Minimal taps to complete actions
- **Notification Badges:** Clear indicators on tabs

### Restaurant Environment
- **Noise Levels:** Loud sound alerts + visual redundancy
- **Lighting:** High contrast for bright/dim areas
- **Movement:** Stable UI (no auto-scrolling during movement)
- **Water Resistance:** Design for touchscreen covers

---

## 🎯 SUCCESS CRITERIA

### Waiter can successfully:
✅ View all orders in real-time (preparing, ready, served)  
✅ Receive instant notifications when food is ready (sound + visual)  
✅ Mark items/orders as served after delivery  
✅ Respond to customer "call waiter" alerts within 1 minute  
✅ Handle cash payment requests efficiently  
✅ Monitor table statuses (available, occupied, ready, alert)  
✅ Search orders by table or order number  
✅ Handle multiple tables simultaneously (5-10 tables)  
✅ Coordinate with kitchen via real-time status updates  
✅ Recover from network issues (auto-sync)  
✅ Work efficiently on mobile phone during service  
✅ Prioritize urgent tasks (alerts > ready orders > preparing orders)  

---

**End of Waiter Workflow Documentation**
