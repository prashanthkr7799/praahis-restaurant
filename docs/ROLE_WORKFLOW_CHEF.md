# 👨‍🍳 CHEF ROLE - COMPLETE WORKFLOW DOCUMENTATION

**Document Version:** 1.0  
**Last Updated:** November 24, 2025  
**Role:** Kitchen Chef / Cook  
**Primary Device:** Tablet (Mobile-First, Landscape Optimized)  

---

## 🎯 ROLE OVERVIEW

### Purpose
The Chef is responsible for managing the kitchen workflow, preparing orders, and ensuring timely food delivery. They track individual dish preparation, update item statuses, and coordinate with service staff.

### Key Responsibilities
- Monitor incoming orders in real-time
- Track per-item cooking status (queued → received → preparing → ready)
- Update dish status as preparation progresses
- Prioritize orders by creation time (FIFO - First In First Out)
- Handle special instructions and dietary requirements
- Maintain kitchen efficiency and minimize delays
- Coordinate with waiters for order pickup

### Access Level
**KITCHEN-ONLY ACCESS** - Can view and update orders, but cannot manage payments, tables, or settings (scoped to their restaurant only)

---

## 📱 SCREENS & PAGES

### 1. **Chef Dashboard** (`/chef/dashboard`)
**Purpose:** Real-time kitchen display system (KDS - Kitchen Display System)

**Layout:** 3-Column Kanban Board
- **Column 1:** Received Orders (Blue) - New orders ready to start
- **Column 2:** Preparing (Yellow) - Currently cooking
- **Column 3:** Ready (Green) - Ready for waiter pickup

**Components:**

#### Header Bar
- **Logo + Title:** "Chef Dashboard"
- **Stats Cards (4 quick-glance metrics):**
  - **Received:** Count of new orders (blue badge)
  - **Preparing:** Count of cooking orders (yellow badge)
  - **Ready:** Count of ready orders (green badge)
  - **Active:** Total orders not served (gray badge)
- **Refresh Button:** Manual refresh trigger
- **Logout Button:** End chef session

#### Filters Bar (Below Header)
- **Type Filters:**
  - All Orders (default)
  - Dine-In (table orders)
  - Takeaway (pickup orders)
  - Delayed (>20 mins preparing or >10 mins received)
- **Search Bar:** Search by order number, table number, or item name

#### Kanban Columns (3-column grid)

**Column 1: RECEIVED**
- Background: Light blue
- Header: "NEW ORDERS" + count badge
- Shows orders with status = 'received'
- Sorted: Oldest first (FIFO)
- Action: "Accept Order" or "Start Preparing" (per item)

**Column 2: PREPARING**
- Background: Light yellow
- Header: "PREPARING" + count badge
- Shows orders with status = 'preparing'
- Timer shows elapsed time since started
- Action: "Mark Ready" (per item)

**Column 3: READY TO SERVE**
- Background: Light green
- Header: "READY TO SERVE" + count badge
- Shows orders with status = 'ready'
- Waiter picks up from here
- No chef action needed (waiter marks "Served")

#### Empty States
- **No orders:** "Kitchen is clear 🍽️" with icon
- **All served:** "Great work! All orders served ✅"

### 2. **Order Card Component** (`ChefOrderCard.jsx`)
**Structure:**

```
┌─────────────────────────────────────────┐
│ Order #ORD-20251124-0001                │
│ Table 5 • 12:30 PM • Dine-In            │
├─────────────────────────────────────────┤
│ Items (3):                              │
│  □ 2x Butter Chicken - RECEIVED        │
│     [Start Preparing]                   │
│  ⏱ 1x Dal Makhani - PREPARING (5m)     │
│     [Mark Ready]                        │
│  ✓ 2x Naan - READY                     │
├─────────────────────────────────────────┤
│ ⚠️ Special: Less spicy, no onions      │
├─────────────────────────────────────────┤
│ Customer: Prashant                      │
│ Payment: Paid ✓                         │
└─────────────────────────────────────────┘
```

**Card Elements:**
- **Header:** Order number + Table number + Time + Type badge
- **Items List:** Each menu item with:
  - Quantity + Name
  - Status badge (Received / Preparing / Ready / Served)
  - Timer (if preparing, shows elapsed time)
  - Action button (context-dependent)
- **Special Instructions:** Yellow alert box (if present)
- **Customer Name:** (if provided)
- **Payment Status:** Badge (Paid / Pending)
- **Priority Indicator:** (if marked urgent - future feature)

**Item Status Badges:**
- **Queued:** Gray (not started, unpaid)
- **Received:** Blue (paid, ready to cook)
- **Preparing:** Yellow (currently cooking)
- **Ready:** Green (cooked, ready to serve)
- **Served:** Purple (delivered to customer)

**Action Buttons:**
- **Start Preparing:** Blue button, shows for 'received' items
- **Mark Ready:** Green button, shows for 'preparing' items
- No button for 'ready' or 'served' items (waiter handles)

### 3. **Compact Mode Toggle**
- Smaller card view for high-volume kitchens
- Reduces vertical space per card
- Shows fewer details, focuses on item status

---

## 🔴 REAL-TIME UPDATES

### Order Subscriptions

#### Realtime Updates Hook (`useRealtimeOrderUpdates`)
**Subscribed Table:** `orders`  
**Filter:** `restaurant_id = chef's restaurant`  
**Events:** INSERT, UPDATE, DELETE

**Triggers:**

1. **New Order Inserted (INSERT):**
   - Toast notification: "📋 New order received! Order #123"
   - Sound alert plays: `newOrder.mp3` (if audio unlocked)
   - Order appears in "Received" column
   - Stats cards update (+1 to Received count)
   - Order card fades in with animation

2. **Order Updated (UPDATE):**
   - Order card updates in real-time
   - If status changed:
     - Card moves to appropriate column
     - Stats cards recalculated
   - If item status changed:
     - Item badge updates
     - Action button changes
     - Timer starts/stops
   - Smooth transition animation (200ms)

3. **Order Deleted (DELETE):**
   - Order card fades out
   - Removed from all columns
   - Stats cards update

#### Polling Fallback
- **Interval:** 5 seconds
- **Purpose:** Backup if WebSocket connection drops
- **Action:** Refetches all orders
- Prevents data staleness in poor network conditions

### Broadcast Messages

**Channel:** `broadcast:{restaurant_id}`  
**Event:** `announcement`

**Payload:**
```json
{
  "message": "Kitchen is closing in 15 minutes",
  "priority": "high",
  "roles": ["chef", "all"],
  "from": "Manager"
}
```

**Triggers:**
- Manager sends broadcast → Chef receives toast notification
- Priority "high": Red border, urgent sound, requires interaction
- Priority "normal": Blue border, standard sound, auto-dismiss

**Display:**
- Toast message with sender name
- Sound plays based on priority
- Browser notification (if permission granted)

---

## ⚡ ACTIONS & CAPABILITIES

### Order Management Actions

#### 1. **View New Order**
**Trigger:** New order appears in Received column  
**Flow:**
1. Order card displays in left column
2. Chef reviews:
   - Items + quantities
   - Special instructions
   - Table number
   - Payment status
3. Decides order of preparation (FIFO default)

#### 2. **Start Preparing Item** (Received → Preparing)
**Trigger:** Click "Start Preparing" button on item  
**Requirements:**
- Item status = 'received' (order must be paid)
- Item not already preparing

**Flow:**
1. Click "Start Preparing" on specific item
2. Frontend: Button shows spinner
3. Backend: `updateOrderItemStatus(orderId, itemId, 'preparing')`
4. Database updates:
   - `items[i].item_status = 'preparing'`
   - `items[i].started_at = current_timestamp`
   - `order.order_status = 'preparing'` (if first item)
5. Order card moves to "Preparing" column
6. Timer starts for that item
7. Button changes to "Mark Ready"
8. Success toast: "Started preparing [Item Name]"
9. Real-time update propagates to:
   - Manager dashboard
   - Waiter dashboard
   - Customer order status page

**Item-Level Logic:**
- Each item tracked independently
- Can start multiple items simultaneously
- Order-level status derived from items:
  - If ANY item preparing → order status = 'preparing'

#### 3. **Mark Item Ready** (Preparing → Ready)
**Trigger:** Click "Mark Ready" button on item  
**Requirements:**
- Item status = 'preparing'
- Item started cooking

**Flow:**
1. Click "Mark Ready" on specific item
2. Frontend: Button shows spinner
3. Backend: `updateOrderItemStatus(orderId, itemId, 'ready')`
4. Database updates:
   - `items[i].item_status = 'ready'`
   - `items[i].ready_at = current_timestamp`
   - `order.order_status = 'ready'` (if all items ready)
5. Item badge changes to green
6. If ALL items ready:
   - Order card moves to "Ready" column
   - Waiter notification sent
7. Success toast: "[Item Name] is ready!"
8. Real-time update propagates:
   - Waiter sees "Ready to Serve" badge
   - Manager sees status change
   - Customer sees "Your food is ready!"

**Order-Level Status Logic:**
```javascript
if (all items are 'served') → order.status = 'served'
else if (all items are 'ready' or 'served') → order.status = 'ready'
else if (any item is 'preparing') → order.status = 'preparing'
else if (all items are 'received') → order.status = 'received'
```

#### 4. **Manual Refresh**
**Trigger:** Click refresh button  
**Flow:**
1. Shows loading spinner
2. Refetches all orders from database
3. Replaces current order state
4. Updates stats cards
5. Spinner stops
6. Toast: "Orders refreshed" (optional)

**Use Case:** Network hiccup recovery, verify real-time sync

#### 5. **Search Orders**
**Trigger:** Type in search bar  
**Flow:**
1. User types query (e.g., "Order #123" or "Table 5" or "Butter Chicken")
2. Frontend filters orders in real-time:
   - Matches order_number (e.g., "123")
   - Matches table_number (e.g., "5")
   - Matches item name (e.g., "Butter")
3. Unmatched orders fade out
4. Matched orders remain visible
5. Clear search → All orders reappear

#### 6. **Filter by Type**
**Trigger:** Click filter button (All / Dine-In / Takeaway / Delayed)  
**Flow:**

**Dine-In Filter:**
- Shows orders where `order_type != 'takeaway'` and `order_type != 'delivery'`
- Hides takeaway/delivery orders

**Takeaway Filter:**
- Shows orders where `order_type = 'takeaway'` or `order_type = 'delivery'`
- Hides dine-in orders

**Delayed Filter:**
- Calculates elapsed time since `created_at`
- Shows orders where:
  - Status = 'received' AND elapsed > 10 minutes
  - OR Status = 'preparing' AND elapsed > 20 minutes
- Highlights delayed orders in red

**All Filter (Default):**
- Shows all active orders (excluding served/cancelled)

---

## 🔒 DATA ACCESS PERMISSIONS

### What Chef CAN See:
✅ Orders for their restaurant (all types: dine-in, takeaway)  
✅ Order details: items, quantities, table number, time  
✅ Special instructions and dietary notes  
✅ Customer name (if provided)  
✅ Payment status (paid / pending)  
✅ Order timestamps (created, started, ready times)  
✅ Item-level statuses (queued, received, preparing, ready, served)  

### What Chef CANNOT See:
❌ Payment amounts or financial data  
❌ Customer phone numbers or contact info (beyond name)  
❌ Table management or status changes  
❌ Staff management or activity logs  
❌ Restaurant settings  
❌ Analytics or reports  
❌ Orders from other restaurants  
❌ Cannot cancel orders (manager/customer only)  
❌ Cannot process refunds  
❌ Cannot manage menu items  

### Data Isolation:
- **All queries filtered by:** `restaurant_id = chef's restaurant`
- **RLS Policies:** Enforced at database level
- **Role check:** User.role must be 'chef', 'manager', or 'admin'

---

## 📋 WORKFLOW: STEP-BY-STEP

### A. Chef Login → Dashboard

**Step 1: Login**
1. Navigate to `/login`
2. Enter email + password (role: chef)
3. Supabase authentication validates
4. Redirects to `/chef/dashboard`

**Step 2: Dashboard Load**
1. Fetch chef's restaurant data
2. Subscribe to orders (real-time channel)
3. Load all active orders (status ≠ 'served', 'cancelled')
4. Sort by created_at (oldest first - FIFO)
5. Group into columns by status
6. Calculate stats (counts per status)
7. Enable audio notifications (on user gesture)
8. Display 3-column kanban board

**Step 3: Audio Unlock**
- Browser requires user gesture to play audio
- Chef clicks anywhere on page → Audio context unlocked
- Notification sounds can now play

### B. Receiving New Order

**Real-Time Flow:**
1. Customer places order + pays
2. Order created in database: `order_status = 'received'`, `payment_status = 'paid'`
3. Real-time INSERT event fires
4. Chef's subscription receives new order
5. Sound plays: "Ding!" (newOrder.mp3)
6. Toast notification: "📋 New order received! Order #123, Table 5"
7. Order card appears in "Received" column (fade-in animation)
8. Stats card: "Received" count increments

**Chef Actions:**
1. Reviews order card:
   - Table number (priority if multiple orders)
   - Items + quantities
   - Special instructions (if any)
   - Customer name (if provided)
2. Decides which item to start first
3. Clicks "Start Preparing" on first item

### C. Cooking Workflow (Per Item)

**Step 1: Start Preparing First Item**
1. Click "Start Preparing" on item (e.g., "Butter Chicken")
2. Button shows spinner
3. Backend updates:
   - `item_status = 'preparing'`
   - `started_at = now()`
4. Order status → 'preparing'
5. Order card moves to "Preparing" column
6. Timer starts showing elapsed time
7. Button changes to "Mark Ready"

**Step 2: Continue with Other Items**
1. Click "Start Preparing" on next item (e.g., "Naan")
2. Same flow as Step 1
3. Multiple items now show "Preparing" status
4. Timers run independently

**Step 3: Mark Items Ready as Cooked**
1. When Butter Chicken is cooked:
   - Click "Mark Ready"
   - `item_status = 'ready'`
   - `ready_at = now()`
   - Item badge turns green
2. When Naan is cooked:
   - Click "Mark Ready"
   - Item badge turns green
3. If ALL items ready:
   - Order status → 'ready'
   - Order card moves to "Ready" column
   - Waiter receives notification
   - Toast: "Order #123 is ready for Table 5!"

**Step 4: Wait for Waiter Pickup**
- Order remains in "Ready" column
- Chef cannot mark "Served" (waiter's responsibility)
- If order sits too long, appears in "Delayed" filter

### D. Handling Multiple Orders

**Priority Logic:**
1. **Default:** FIFO (First In, First Out)
   - Oldest order at top of each column
   - Chef works down the list
2. **Special Cases:**
   - Takeaway orders (customer waiting on-site) - higher priority
   - Delayed orders (>20 mins) - urgent attention
   - Manager can mark orders as "Priority" (future feature)

**Parallel Preparation:**
- Chef can start multiple items across different orders
- E.g., Start 3 items from Order A, then switch to Order B
- Each item tracked independently
- Flexible workflow for kitchen efficiency

### E. Handling Special Instructions

**Example Order:**
```
Order #123, Table 5
Items:
- 2x Butter Chicken - "Less spicy, no onions"
- 1x Dal Makhani - "Extra ghee"
- 2x Naan - (no notes)
```

**Workflow:**
1. Order arrives in "Received" column
2. Yellow alert box shows: "⚠️ Special: Less spicy, no onions | Extra ghee"
3. Chef reads instructions before starting
4. Follows modifications during preparation
5. No explicit confirmation needed (visual reminder only)

### F. Filtering & Search

**Scenario 1: View Only Takeaway Orders**
1. Click "Takeaway" filter button
2. Dine-in orders hide
3. Only takeaway orders visible across all columns
4. Chef focuses on pickup orders
5. Click "All Orders" to restore full view

**Scenario 2: Find Specific Order**
1. Type "Table 8" in search bar
2. All orders except Table 8 fade out
3. Locate order quickly
4. Clear search → All orders reappear

**Scenario 3: Check Delayed Orders**
1. Click "Delayed" filter
2. Shows orders stuck >20 mins in preparing
3. Or >10 mins in received (not started)
4. Red highlight on delayed cards
5. Chef prioritizes these orders

### G. Handling Errors

**Error 1: Cannot Start Item**
**Cause:** Network error or item already started

**Handling:**
1. Button shows error state
2. Toast: "Failed to update item status. Try again."
3. Order remains in previous state
4. Chef clicks "Retry" or refreshes manually
5. Real-time sync corrects state

**Error 2: Order Disappears**
**Cause:** Manager cancelled order or customer refunded

**Handling:**
1. Order card fades out
2. Toast: "Order #123 was cancelled"
3. Stats cards update
4. Chef stops preparing if already started

**Error 3: Payment Pending**
**Cause:** Customer hasn't paid yet

**Handling:**
1. Order appears with `item_status = 'queued'` (gray badge)
2. No action buttons available
3. Chef cannot start preparing
4. When payment completes → Status → 'received' → Chef can start

### H. End of Shift / Logout

**Step 1: Handoff to Next Chef**
1. Review "Preparing" column (active orders)
2. Verbal handoff to next chef
3. All orders persist in system (state maintained)

**Step 2: Logout**
1. Click "Logout" button
2. Session cleared
3. Real-time subscriptions closed
4. Redirects to `/login`

**Note:** No explicit shift-end process; orders continue for next chef

---

## 🔄 EVENT DEPENDENCIES & STATE CHANGES

### Item Status State Machine (Per Item)

```
queued → [Payment Completed] → received
received → [Chef Clicks "Start Preparing"] → preparing
preparing → [Chef Clicks "Mark Ready"] → ready
ready → [Waiter Clicks "Serve"] → served
```

**Note:** Chef controls `received → preparing → ready`. Waiter controls `ready → served`.

### Order Status Derivation

**Logic:**
```javascript
// Derived from all item statuses
const itemStatuses = order.items.map(item => item.item_status);

if (itemStatuses.every(s => s === 'served')) {
  order.status = 'served'; // Waiter completed
} else if (itemStatuses.every(s => s === 'ready' || s === 'served')) {
  order.status = 'ready'; // All items cooked
} else if (itemStatuses.some(s => s === 'preparing' || s === 'received' || s === 'queued')) {
  order.status = 'preparing'; // At least one item cooking
} else {
  order.status = 'received'; // All items waiting
}
```

### Dependencies on Other Roles

**Customer → Chef:**
- Customer places order → Chef receives in dashboard
- Customer pays → Order status → 'received' → Chef can start
- Customer provides special instructions → Chef sees in order card

**Chef → Waiter:**
- Chef marks item ready → Waiter sees "Ready to Serve" badge
- Chef completes all items → Order moves to waiter's "Ready" column
- Waiter cannot serve until chef marks ready

**Manager → Chef:**
- Manager creates takeaway order → Chef receives in dashboard
- Manager marks cash paid → Order → 'received' → Chef can start
- Manager broadcasts message → Chef receives notification

**Chef → Manager:**
- Chef marks order ready → Manager sees status update
- Chef delays on order → Manager sees in "Delayed Orders" metric

**Chef → Customer:**
- Chef updates item status → Customer sees real-time progress on order status page
- Chef marks ready → Customer notification: "Your food is ready!"

---

## ⚠️ EDGE CASES & ERROR HANDLING

### 1. **Duplicate Start Click**
**Scenario:** Chef rapidly clicks "Start Preparing" twice

**Handling:**
- Button disabled during API call
- Debounce: 500ms delay between clicks
- Backend idempotency: If already 'preparing', no-op
- No error shown (silent handling)

### 2. **Network Disconnection Mid-Preparation**
**Scenario:** WiFi drops while chef is cooking

**Handling:**
- Dashboard shows "Offline" indicator
- Actions queued (if possible) or show error
- Real-time updates pause
- On reconnect: Auto-refresh + sync state
- Chef sees toast: "Connection restored, orders updated"

### 3. **Order Cancelled After Chef Starts**
**Scenario:** Customer cancels order while chef is cooking

**Handling:**
- Real-time DELETE event fires
- Order card fades out with red border
- Toast: "⚠️ Order #123 was cancelled by customer"
- Chef stops preparing (wasted effort, but rare)
- Manager handles refund (if paid)

### 4. **Item Already Marked Ready**
**Scenario:** Waiter marks item served before chef sees "Ready" column update

**Handling:**
- Real-time update triggers
- Order disappears from all columns (status = 'served')
- Stats cards recalculate
- Normal workflow (no error)

### 5. **Payment Completed Mid-View**
**Scenario:** Order visible with status 'queued', then customer pays

**Handling:**
- Real-time UPDATE event fires
- Order card updates: Status badge 'queued' → 'received'
- "Start Preparing" button appears
- Toast: "Payment received for Order #123"
- Chef can now start cooking

### 6. **Multiple Chefs Same Restaurant**
**Scenario:** 2 chefs logged in, both see same orders

**Handling:**
- Both see all orders (no explicit assignment)
- If Chef A starts item, Chef B sees real-time update (button changes)
- Coordination via visual state (color-coded badges)
- No conflict: Real-time sync prevents duplicate work
- Kitchen teamwork model (flexible assignment)

### 7. **Special Instructions Missing**
**Scenario:** Customer adds instructions but field is null

**Handling:**
- Order card renders without special instructions box
- No yellow alert shown
- Chef proceeds with standard preparation
- Normal workflow

### 8. **Long Order (>10 Items)**
**Scenario:** Large group order with many items

**Handling:**
- Order card expands vertically
- Scroll within card (if needed)
- Items list shows all items with individual statuses
- Chef can start items in any order
- "Preparing" column may show partially-ready order (some items green, some yellow)

### 9. **Delayed Order (>20 Mins)**
**Scenario:** Order stuck in 'preparing' for 20+ minutes

**Handling:**
- "Delayed" filter highlights this order (red border)
- Manager sees in "Delayed Orders" metric
- Chef notices red highlight → Prioritizes completion
- No automatic escalation (manual intervention)

### 10. **Browser Refresh During Cooking**
**Scenario:** Chef accidentally refreshes browser

**Handling:**
- Page reloads
- Dashboard re-initializes
- Fetches all orders from database
- Order state preserved (server-side)
- Timers restart (calculated from `started_at` timestamp)
- Chef continues from previous state (no data loss)

---

## 📱 UI/UX REQUIREMENTS

### Device Optimization
- **Primary:** Tablet (landscape mode, 10-12 inch)
- **Secondary:** Desktop (full-width layout)
- **Not optimized for:** Mobile phone (too small for kitchen use)

### Layout
- **3-Column Kanban:** Equal width (33% each)
- **Horizontal Scroll:** If screen width < 1024px
- **Sticky Header:** Stats cards always visible
- **Full Height:** Columns fill viewport height

### Performance
- **Dashboard Load:** < 2 seconds
- **Real-time Update:** < 3 seconds (from database change)
- **Action Response:** Instant UI feedback, < 1 second backend
- **Smooth Animations:** 60 FPS (hardware-accelerated)

### Accessibility
- **High Contrast:** Kitchen environments (bright lighting)
- **Large Touch Targets:** 48x48px minimum (chef may wear gloves)
- **Color Blindness:** Status icons + text labels (not color alone)
- **Sound Alerts:** Visual + audio notifications

### Visual Hierarchy
- **Order Number:** Bold, large (primary identifier)
- **Table Number:** Medium, next to order number
- **Item Names:** Regular weight, readable font
- **Status Badges:** Color-coded, always visible
- **Action Buttons:** Large, prominent, color-coded by action

### Status Colors
- **Received (Blue):** #3B82F6 (calm, new)
- **Preparing (Yellow):** #F59E0B (active, in-progress)
- **Ready (Green):** #10B981 (success, complete)
- **Served (Purple):** #8B5CF6 (finished, delivered)
- **Delayed (Red):** #EF4444 (urgent, attention needed)

### Animations
- **Order Card Entrance:** Fade-in + slide-down (300ms)
- **Column Move:** Slide animation when status changes (200ms)
- **Button Click:** Scale down (0.98) + ripple effect
- **Badge Update:** Pulse animation on change

### Loading States
- **Dashboard Load:** Full-page spinner with kitchen icon
- **Action Button:** Spinner inside button (button disabled)
- **Column Refresh:** Shimmer effect on cards

### Empty States
- **No Received Orders:** "All caught up! 🎉" with chef hat icon
- **No Preparing Orders:** "Kitchen is clear 🍽️"
- **No Ready Orders:** "Great work! All orders completed ✅"

### Sound Alerts
- **New Order:** Bell sound (newOrder.mp3) - 1 second
- **Order Ready:** Success chime (foodReady.mp3) - 0.5 seconds
- **Broadcast Message:** Notification sound (based on priority)
- **Volume:** Configurable (future feature)
- **Mute Option:** Toggle in header (future feature)

---

## 📝 NOTES FOR DESIGNERS

### Design System
- **Primary Color:** Yellow/Orange (#F59E0B → #FF6B35) for "Preparing"
- **Secondary Color:** Blue (#3B82F6) for "Received"
- **Success Color:** Green (#10B981) for "Ready"
- **Background:** Light gray (#F9FAFB) for columns
- **Card Background:** White (#FFFFFF) with shadow

### Typography
- **Order Numbers:** Bold, 18px, monospace (tabular-nums)
- **Table Numbers:** Semibold, 14px
- **Item Names:** Regular, 16px, sans-serif
- **Timers:** Monospace, 14px (e.g., "5m 32s")

### Spacing
- **Column Padding:** 16px
- **Card Margin:** 12px between cards
- **Card Padding:** 16px inside cards
- **Button Padding:** 12px vertical, 24px horizontal

### Iconography
- **Icons:** Lucide React library
- **Sizes:** 20px (inline), 24px (buttons), 48px (empty states)
- **Style:** Outlined (consistent with app)

### Cards
- **Border Radius:** 12px (rounded-xl)
- **Shadow:** md (hover: lg)
- **Border:** 1px solid (color-coded by status)
- **Hover:** Lift effect (scale 1.02, shadow increase)

### Touch Interactions
- **Tap Target:** Minimum 48x48px (chef may wear gloves)
- **Swipe:** Future feature - swipe card to change status
- **Long Press:** Future feature - show order details

### Landscape Orientation
- **Lock Orientation:** Suggest landscape mode on tablets
- **Responsive:** Adjust column width for 1024px+ screens
- **Sidebar:** None (full-width kanban board)

### Kitchen Environment Considerations
- **Brightness:** High contrast for well-lit kitchens
- **Water Resistance:** Design for touchscreen covers
- **Noise:** Visual + audio alerts (kitchen is noisy)
- **Interruptions:** Auto-save state (no form submissions)

---

## 🎯 SUCCESS CRITERIA

### Chef can successfully:
✅ View all active orders in real-time  
✅ Receive instant notifications for new orders (sound + toast)  
✅ Start preparing items individually  
✅ Mark items ready as they're cooked  
✅ Track cooking time with visual timers  
✅ See special instructions clearly  
✅ Filter orders by type (dine-in, takeaway, delayed)  
✅ Search orders by number or table  
✅ Handle multiple orders in parallel  
✅ Coordinate with waiters through status updates  
✅ Recover from network issues (auto-sync)  
✅ Work efficiently on tablet in landscape mode  

---

**End of Chef Workflow Documentation**
