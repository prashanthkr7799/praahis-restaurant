# 👨‍💼 MANAGER ROLE - COMPLETE WORKFLOW DOCUMENTATION

**Document Version:** 1.0  
**Last Updated:** November 24, 2025  
**Role:** Restaurant Manager  
**Primary Device:** Desktop/Laptop (Responsive)  

---

## 🎯 ROLE OVERVIEW

### Purpose
The Manager is the central administrative role responsible for overseeing all restaurant operations, monitoring performance, managing staff, handling payments, and ensuring smooth service delivery.

### Key Responsibilities
- Monitor real-time orders across all channels (dine-in, takeaway)
- Manage tables, staff, and kitchen operations
- Track payments and handle cash reconciliation
- Generate reports and analyze performance metrics
- Manage menu items and pricing
- Handle customer complaints and feedback
- Configure restaurant settings and QR codes
- Supervise chef and waiter activities

### Access Level
**FULL ACCESS** to all restaurant data and operations (scoped to their restaurant only)

---

## 📱 SCREENS & PAGES

### 1. **Manager Dashboard** (`/manager/dashboard`)
**Purpose:** Central command center with tabs for different operational areas

**Tabs Available:**
- **Overview** (default) - Dashboard with stats, charts, recent orders
- **Orders** - Manage all orders (dine-in, takeaway)
- **Tables** - Table management and status monitoring
- **Kitchen** - Menu management and kitchen metrics
- **Staff** - Staff management, complaints, and communications

**Quick Access Pages:**
- Analytics (`/manager/analytics`)
- Reports (`/manager/reports`)
- Payments Tracking (`/manager/payments`)
- Settings (`/manager/settings`)
- Billing (`/manager/billing`)
- Activity Logs (`/manager/logs`)

### 2. **Overview Tab**
**Components:**
- **KPI Cards (5):**
  - Revenue (today vs yesterday)
  - Orders count (today vs yesterday)
  - Table Occupancy (occupied/total)
  - Pending Payments (count + amount)
  - Complaints (today's count)
  
- **Mini Chart Sparklines** (7-day trend for revenue/orders)
- **Quick Actions Grid** (4 buttons):
  - Orders → Navigate to Orders tab
  - Tables → Navigate to Tables tab
  - Kitchen → Navigate to Kitchen tab
  - Staff → Navigate to Staff tab
  - Reports → Navigate to Reports page

- **Recent Orders List** (last 10 orders)
  - Order number, table, time, status, payment status
  - Quick action: "Cash Paid" button (for cash orders)

- **Sidebar Widgets:**
  - Subscription Status (plan name, days remaining)
  - Analytics Card (link to full analytics)
  - Reports Card (link to reports page)
  - Settings Card (link to settings)

### 3. **Orders Tab**
**Components:**
- **Top Action Bar:**
  - Create Takeaway Order button
  - Refresh button
  - Filter button (opens filter modal)

- **Stats Row (4 cards):**
  - Total Orders
  - Pending Orders
  - Preparing Orders
  - Completed Orders

- **Filter Controls:**
  - Status filter: All, Received, Preparing, Ready, Served, Completed, Cancelled
  - Payment filter: All, Paid, Pending
  - Date range picker
  - Order type: All, Dine-In, Takeaway

- **Orders Layout (2 columns):**
  - **Left (2/3 width):** Dine-in/Delivery orders grid
  - **Right (1/3 width):** Takeaway orders column

- **Order Cards Display:**
  - Order number, table/customer name, time
  - Items list with quantities
  - Status badge, payment status badge
  - Total amount
  - Actions: View details, Cancel (if unpaid), Mark paid (cash), Issue complaint

### 4. **Tables Tab**
**Components:**
- **Header:**
  - View All QR Codes button
  - Add New Table button
  - View toggle: Grid / List

- **Stats Row (4 cards):**
  - Total Tables
  - Available Tables
  - Occupied Tables
  - Reserved Tables

- **Table Grid View:**
  - Cards showing table number, capacity, status
  - Status colors:
    - **Green (Available):** No active session
    - **Orange (Occupied):** Customer seated
    - **Blue (Ordering):** Cart has items
    - **Yellow (Eating):** Order being prepared
    - **Purple (Ready):** Food ready to serve
    - **Gray (Served):** Food delivered
  - Click → Opens Table Details Modal

- **Table List View:**
  - Tabular format with columns: Number, Capacity, Status, Actions
  - Actions: View Details, Mark Available, Generate QR

**Table Details Modal:**
- Table info (number, capacity, QR code)
- Active orders list
- Customer session info
- Actions: Mark Available, Call Waiter

### 5. **Kitchen Tab**
**Components:**
- **Header:**
  - Add Menu Item button
  - Category filter dropdown
  - Search bar

- **Kitchen Metrics (3 cards):**
  - Orders in Queue
  - Average Prep Time (today)
  - Delayed Orders (>20 mins)

- **Menu Items Grid:**
  - Item card showing:
    - Image, name, price
    - Category, availability status
    - In stock / Out of stock toggle
  - Click → Opens Edit Menu Item Modal

**Add/Edit Menu Item Modal:**
- Name, description, price
- Category dropdown
- Image upload
- Availability toggle
- Save/Cancel buttons

### 6. **Staff Tab**
**Components:**
- **Header:**
  - Add Staff button
  - Send Broadcast Message button
  - View Activity Logs button

- **Staff Metrics (4 cards):**
  - Total Staff
  - Active Now
  - On Leave
  - New This Month

- **Staff List:**
  - Staff cards showing:
    - Name, email, role (Chef/Waiter)
    - Phone, status (active/inactive)
    - Orders served count
    - Actions: Message, Call, View Activity

- **Complaints Panel:**
  - Recent complaints list
  - Status: Open, In Progress, Resolved
  - Priority: Low, Medium, High
  - Actions: Assign, Resolve, Add Note

**Broadcast Message Modal:**
- Message text area
- Priority: Normal / High
- Recipients: All / Chefs / Waiters / Specific staff
- Send button

### 7. **Analytics Page** (`/manager/analytics`)
**Components:**
- Date range selector
- **Revenue Analytics:**
  - Total revenue chart (line/area)
  - Revenue by category (pie chart)
  - Revenue trends (daily/weekly/monthly)

- **Order Analytics:**
  - Order volume chart
  - Order type breakdown (dine-in vs takeaway)
  - Average order value

- **Performance Metrics:**
  - Peak hours heatmap
  - Table turnover rate
  - Average prep time
  - Customer satisfaction score

### 8. **Reports Page** (`/manager/reports`)
**Tabs:**
- **Overview:** High-level KPIs
- **Orders:** Detailed order reports
- **Revenue:** Financial reports
- **Menu:** Item performance
- **Staff:** (Coming soon)

**Features:**
- Export to CSV
- Date range filtering
- Printable format

### 9. **Payments Tracking Page** (`/manager/payments`)
**Components:**
- **Stats Cards:**
  - Today's Revenue
  - Pending Payments
  - Completed Payments
  - Failed Payments

- **Payment List:**
  - Order number, amount, method
  - Status, timestamp
  - Actions: Mark Paid, Refund

- **Filters:**
  - Status: All, Paid, Pending, Failed
  - Method: All, Online, Cash
  - Date range

### 10. **Settings Page** (`/manager/settings`)
**Tabs:**
- **Restaurant:** Name, address, phone, email, logo
- **Profile:** Personal info, password change
- **Security:** 2FA, session management
- **Notifications:** Email/SMS preferences

---

## 🔴 REAL-TIME UPDATES

### Order Updates
**Subscribed Events:**
- `orders` table changes (INSERT, UPDATE, DELETE)
- Filter: `restaurant_id = manager's restaurant`

**Triggers:**
1. **New Order Created:**
   - Toast notification: "New order received!"
   - Auto-refresh orders list
   - Update stats cards
   - Play sound (if enabled)

2. **Order Status Changed:**
   - Update order card status badge
   - Move order to appropriate column/section
   - Update stats cards

3. **Payment Completed:**
   - Update payment status badge
   - Update revenue stats
   - Show success toast

### Table Updates
**Subscribed Events:**
- `tables` table changes
- Filter: `restaurant_id = manager's restaurant`

**Triggers:**
1. **Table Status Changed:**
   - Update table card color
   - Update occupancy stats

2. **Table Booked/Freed:**
   - Refresh table grid
   - Update available count

### Broadcast Messages
**Channel:** `broadcast:{restaurant_id}`
**Events:**
- Announcements from other managers
- System alerts

---

## ⚡ ACTIONS & CAPABILITIES

### Order Management Actions

#### 1. **Create Takeaway Order**
**Trigger:** Click "Create Takeaway Order" button  
**Flow:**
1. Modal opens with menu items
2. Select items, set quantities
3. Enter customer name, phone (optional)
4. Set payment method: Online / Cash
5. Click "Create Order"
6. Order created with status: `pending_payment` (if unpaid) or `received` (if paid)

**Validation:**
- At least one item required
- Positive quantities only

#### 2. **Mark Cash Paid**
**Trigger:** Click "Cash Paid" button on order card  
**Requirements:** 
- Payment method = cash
- Payment status = pending

**Flow:**
1. Creates payment record
2. Updates order: `payment_status = 'paid'`, `order_status = 'received'`
3. Shows success toast
4. Refreshes orders list

#### 3. **Cancel Order**
**Trigger:** Click "Cancel Order" on order card  
**Requirements:**
- Order not paid (payment_status = 'pending')
- Order status ≠ 'served' or 'cancelled'

**Flow:**
1. Confirmation dialog
2. Updates order: `order_status = 'cancelled'`
3. Releases table (if dine-in)
4. Shows toast
5. Order moves to cancelled section

#### 4. **Process Refund**
**Trigger:** Click "Refund" button  
**Requirements:**
- Order paid (payment_status = 'paid')
- Order status = 'cancelled' or 'completed'

**Flow:**
1. Confirmation dialog with refund amount
2. Creates refund payment record
3. Updates order: `payment_status = 'refunded'`
4. Shows toast
5. Sends notification to customer (if contact available)

#### 5. **Apply Discount**
**Trigger:** Click "Discount" button on order  
**Flow:**
1. Modal opens
2. Select discount type: Percentage / Fixed amount
3. Enter discount value
4. Enter reason (optional)
5. Recalculates order total
6. Updates order with discount_amount

#### 6. **Report Issue/Complaint**
**Trigger:** Click "Issue" button on order  
**Flow:**
1. Modal opens
2. Select complaint type: Food Quality / Service / Billing / Other
3. Enter description
4. Set priority: Low / Medium / High
5. Creates complaint record linked to order
6. Notifies assigned staff

### Table Management Actions

#### 7. **Add New Table**
**Trigger:** Click "Add New Table" button  
**Flow:**
1. Modal opens
2. Enter table number
3. Set capacity (number of seats)
4. Click "Create"
5. Table created with status: 'available'
6. QR code auto-generated

**Validation:**
- Table number must be unique
- Capacity must be > 0

#### 8. **Mark Table Available**
**Trigger:** Click "Mark Available" in table details  
**Requirements:** No active unpaid orders

**Flow:**
1. Confirmation dialog
2. Updates table: `status = 'available'`, clears `booked_at`
3. Closes any active session
4. Shows toast
5. Refreshes table grid

#### 9. **Call Waiter (from Manager)**
**Trigger:** Click "Call Waiter" in table details  
**Flow:**
1. Broadcasts to `waiter-alerts` channel
2. Creates notification for waiters
3. Shows toast: "Waiter has been notified! 🔔"
4. Waiter dashboard shows alert banner

#### 10. **View/Download QR Codes**
**Trigger:** Click "View All QR Codes" button  
**Flow:**
1. Modal opens showing all table QR codes
2. Options: Download All (ZIP) / Download Individual / Print
3. QR format: PNG, 512x512px
4. URL format: `{domain}/table/{table_id}`

### Kitchen/Menu Actions

#### 11. **Add Menu Item**
**Trigger:** Click "Add Menu Item" button  
**Flow:**
1. Modal opens
2. Fill form: Name, description, price, category
3. Upload image (optional)
4. Set availability: In Stock
5. Click "Save"
6. Item added to menu_items table

**Validation:**
- Name required
- Price must be > 0
- Category required

#### 12. **Edit Menu Item**
**Trigger:** Click on menu item card  
**Flow:**
1. Modal opens with pre-filled data
2. Modify fields
3. Click "Save Changes"
4. Updates menu_items record
5. Shows toast

#### 13. **Toggle Item Availability**
**Trigger:** Click "In Stock" / "Out of Stock" toggle  
**Flow:**
1. Updates menu_items: `is_available = true/false`
2. Shows toast
3. Item grayed out if out of stock
4. Customers cannot order unavailable items

### Staff Management Actions

#### 14. **Add New Staff**
**Trigger:** Click "Add Staff" button  
**Flow:**
1. Modal opens
2. Enter: Name, email, phone, role (Chef/Waiter)
3. Set initial password
4. Click "Create"
5. Creates user record with restaurant_id
6. Sends welcome email (if configured)

**Validation:**
- Email must be unique
- Role required
- Password min 6 chars

#### 15. **Send Message to Staff**
**Trigger:** Click "Message" on staff card  
**Flow:**
1. Modal opens
2. Enter message
3. Set priority: Normal / High
4. Click "Send"
5. Broadcasts to staff member's channel
6. Shows in-app notification + toast
7. Optional: Sends SMS/email

#### 16. **Broadcast Message to All**
**Trigger:** Click "Broadcast Message" button  
**Flow:**
1. Modal opens
2. Enter message
3. Select recipients: All / Chefs / Waiters
4. Set priority: Normal / High
5. Click "Send"
6. Broadcasts to `broadcast:{restaurant_id}` channel
7. All selected staff receive notification

#### 17. **View Staff Activity**
**Trigger:** Click "View Activity" on staff card  
**Flow:**
1. Modal opens showing activity log
2. Displays: Login times, orders handled, actions performed
3. Filter by date range

---

## 🔒 DATA ACCESS PERMISSIONS

### What Manager CAN See:
✅ All orders for their restaurant (all types, all statuses)  
✅ All tables and their statuses  
✅ All menu items  
✅ All staff members (chefs, waiters)  
✅ All payments and financial data  
✅ All complaints and feedback  
✅ All analytics and reports  
✅ All customer sessions (anonymized)  
✅ Activity logs for their restaurant  
✅ Restaurant settings and configuration  

### What Manager CANNOT See:
❌ Orders from other restaurants  
❌ Other restaurants' data  
❌ Superadmin functions (subscription management, system settings)  
❌ Customer personal data beyond what's in orders (name, phone only if provided)  
❌ Staff passwords or sensitive auth data  

### Data Isolation:
- **All queries filtered by:** `restaurant_id = manager's restaurant`
- **RLS Policies:** Enforced at database level
- **Client-side filtering:** Additional safety layer

---

## 📋 WORKFLOW: STEP-BY-STEP

### A. Manager Login → Dashboard

**Step 1: Login**
1. Navigate to `/login`
2. Enter email + password (role: manager or admin)
3. Supabase authentication validates
4. Redirects to `/manager/dashboard`

**Step 2: Dashboard Load**
1. Fetch restaurant data (restaurant_id from user record)
2. Load stats (today's revenue, orders, tables, complaints)
3. Load chart data (last 7 days revenue/orders)
4. Load recent orders (last 10)
5. Subscribe to real-time updates (orders, tables)
6. Display dashboard (default: Overview tab)

### B. Monitoring Orders (Overview Tab)

**Continuous Monitoring:**
1. Recent orders list auto-updates every 10 seconds
2. Real-time subscription triggers instant updates
3. Toast notifications for new orders
4. Stats cards refresh on changes

**Manager Actions:**
- Click order → View details
- Click "Cash Paid" → Mark payment complete
- Monitor order status progression

### C. Managing Orders (Orders Tab)

**Step 1: Navigate to Orders Tab**
1. Click "Orders" tab or Quick Action button
2. Orders tab loads all orders
3. Displays in 2-column layout (dine-in + takeaway)

**Step 2: Filter Orders (Optional)**
1. Click "Filter" button
2. Set status filter (e.g., "Preparing")
3. Set payment filter (e.g., "Pending")
4. Set date range
5. Click "Apply"
6. Orders list updates

**Step 3: Create Takeaway Order**
1. Click "Create Takeaway Order"
2. Modal opens with menu
3. Select items, set quantities
4. Enter customer name (optional)
5. Select payment method
6. Click "Create"
7. Order appears in takeaway column

**Step 4: Handle Cash Payment**
1. Find order with payment_method='cash', payment_status='pending'
2. Click "Cash Paid" button
3. Confirmation toast
4. Order status → 'received'
5. Payment status → 'paid'
6. Chef sees order in kitchen

**Step 5: Cancel Order (if needed)**
1. Find unpaid order
2. Click "Cancel Order"
3. Confirm cancellation
4. Order status → 'cancelled'
5. Table released (if dine-in)

**Step 6: Process Refund (if needed)**
1. Find paid order that needs refund
2. Click "Refund"
3. Confirm refund amount
4. Payment status → 'refunded'
5. Customer notified (if contact available)

### D. Managing Tables (Tables Tab)

**Step 1: Navigate to Tables Tab**
1. Click "Tables" tab
2. Tables grid loads
3. Shows all tables with status colors

**Step 2: Monitor Table Status**
- **Green:** Available for new customers
- **Orange/Yellow/Purple:** Various stages of service
- **Gray:** Served, waiting for payment/cleanup

**Step 3: View Table Details**
1. Click table card
2. Modal opens showing:
   - Table info + QR code
   - Active orders
   - Customer session details

**Step 4: Mark Table Available**
1. In table details modal
2. Click "Mark Available"
3. Confirm action
4. Table status → 'available'
5. Session closed

**Step 5: Generate/View QR Codes**
1. Click "View All QR Codes"
2. Modal shows all QR codes
3. Options:
   - Download individual (PNG)
   - Download all (ZIP)
   - Print (opens print dialog)

**Step 6: Add New Table**
1. Click "Add New Table"
2. Enter table number + capacity
3. Click "Create"
4. Table created with auto-generated QR
5. Appears in grid

### E. Managing Kitchen & Menu (Kitchen Tab)

**Step 1: Navigate to Kitchen Tab**
1. Click "Kitchen" tab
2. Loads kitchen metrics + menu items

**Step 2: Monitor Kitchen Metrics**
- Orders in Queue: Active orders count
- Avg Prep Time: Today's average
- Delayed Orders: Orders >20 mins old

**Step 3: Add New Menu Item**
1. Click "Add Menu Item"
2. Fill form (name, price, category, description)
3. Upload image (optional)
4. Set availability: In Stock
5. Click "Save"
6. Item appears in menu grid

**Step 4: Edit Menu Item**
1. Click item card
2. Modal opens with current data
3. Modify fields
4. Click "Save Changes"
5. Item updated

**Step 5: Toggle Availability**
1. Find item card
2. Click "In Stock" / "Out of Stock" toggle
3. Status updates immediately
4. Customers see updated menu

**Step 6: Filter/Search Menu**
1. Use category dropdown (All, Appetizers, Mains, etc.)
2. Or use search bar (by name)
3. Grid filters in real-time

### F. Managing Staff (Staff Tab)

**Step 1: Navigate to Staff Tab**
1. Click "Staff" tab
2. Loads staff list + complaints panel

**Step 2: View Staff Overview**
- Staff metrics (total, active, on leave)
- Staff cards (chefs, waiters)
- Recent complaints

**Step 3: Add New Staff**
1. Click "Add Staff"
2. Fill form (name, email, phone, role)
3. Set initial password
4. Click "Create"
5. User account created
6. Staff appears in list

**Step 4: Message Individual Staff**
1. Find staff card
2. Click "Message"
3. Enter message + priority
4. Click "Send"
5. Staff receives in-app notification

**Step 5: Broadcast to All Staff**
1. Click "Broadcast Message"
2. Enter message
3. Select recipients (All / Chefs / Waiters)
4. Set priority (Normal / High)
5. Click "Send"
6. All selected staff notified

**Step 6: Handle Complaints**
1. View complaints panel (right side)
2. Complaints listed by priority
3. Click complaint → View details
4. Actions:
   - Assign to staff member
   - Add internal note
   - Change status (Open → In Progress → Resolved)
5. Customer notified on resolution (if contact available)

### G. Analytics & Reports

**Step 1: View Analytics**
1. Navigate to `/manager/analytics`
2. Set date range (Today, Week, Month, Custom)
3. View charts:
   - Revenue trends
   - Order volume
   - Category breakdown
   - Peak hours
4. Export data (CSV) if needed

**Step 2: Generate Reports**
1. Navigate to `/manager/reports`
2. Select report type (Orders, Revenue, Menu, Staff)
3. Set filters (date range, status, etc.)
4. View report tables/charts
5. Export to CSV
6. Print report (if needed)

### H. Payment Tracking

**Step 1: Navigate to Payments Page**
1. Go to `/manager/payments`
2. View payment stats
3. Payment list loads

**Step 2: Filter Payments**
1. Status: All, Paid, Pending, Failed
2. Method: All, Online, Cash
3. Date range
4. List updates

**Step 3: Mark Cash Payment**
1. Find pending cash payment
2. Click "Mark Paid"
3. Confirm
4. Payment status → 'paid'

**Step 4: Process Refund**
1. Find paid payment
2. Click "Refund"
3. Enter refund reason
4. Confirm amount
5. Payment status → 'refunded'

### I. Settings Management

**Step 1: Navigate to Settings**
1. Go to `/manager/settings`
2. View tabs: Restaurant, Profile, Security, Notifications

**Step 2: Update Restaurant Info**
1. Click "Restaurant" tab
2. Edit name, address, phone, email
3. Upload new logo (optional)
4. Click "Save Changes"
5. Updates reflected everywhere

**Step 3: Change Password**
1. Click "Security" tab
2. Enter current password
3. Enter new password (min 6 chars)
4. Confirm new password
5. Click "Update Password"
6. Success toast

### J. Manager Logout

**Step 1: Logout**
1. Click user menu (top right)
2. Click "Logout"
3. Session cleared
4. Redirects to `/login`

---

## 🔄 EVENT DEPENDENCIES & STATE CHANGES

### Order Status State Machine

```
pending_payment → [Payment Completed] → received
received → [Chef Starts] → preparing
preparing → [Chef Marks Ready] → ready
ready → [Waiter Serves] → served
served → [Customer Feedback] → completed

Any stage → [Manager Cancels] → cancelled (only if unpaid)
```

### Payment Status State Machine

```
pending → [Payment Success] → paid
pending → [Payment Failed] → failed
paid → [Refund Processed] → refunded
```

### Table Status Logic

```
available → [Customer Scans QR] → occupied
occupied → [Order Created] → eating
eating → [Order Ready] → ready
ready → [Waiter Serves] → served
served → [Manager Marks Available] → available
```

### Dependencies Between Roles

**Manager → Chef:**
- Manager creates takeaway order → Chef sees in kitchen
- Manager marks cash paid → Order appears in chef queue

**Manager → Waiter:**
- Manager calls waiter (from table) → Waiter receives alert
- Manager broadcasts message → Waiter receives notification

**Chef → Manager:**
- Chef marks order ready → Manager sees status update in dashboard
- Chef delayed on order → Manager sees in "Delayed Orders" metric

**Waiter → Manager:**
- Waiter serves order → Manager sees status update
- Waiter reports issue → Complaint appears in Staff tab

**Customer → Manager:**
- Customer places order → Manager sees in recent orders
- Customer calls waiter → Manager can monitor (indirect)

---

## ⚠️ EDGE CASES & ERROR HANDLING

### 1. **Concurrent Order Modifications**
**Scenario:** Manager and chef update same order simultaneously

**Handling:**
- Real-time updates resolve conflict
- Last write wins (database level)
- Both see updated state within 1-3 seconds
- No data loss due to optimistic updates

### 2. **Network Disconnection**
**Scenario:** Manager loses internet connection

**Handling:**
- Dashboard shows "Offline" indicator
- Data cached in browser (last known state)
- Actions queued (if possible) or show error
- Auto-reconnect on network restore
- Data re-synced automatically

### 3. **Cancelled Order with Payment**
**Scenario:** Order paid but needs cancellation

**Handling:**
- Manager cannot cancel directly
- Must process refund first
- Then cancel order
- Workflow: Refund → Cancel
- Prevents payment loss

### 4. **Table Status Conflicts**
**Scenario:** Manager marks table available but customer still has active order

**Handling:**
- System checks for active unpaid orders
- Shows warning: "Table has active orders"
- Cannot mark available until orders completed/cancelled
- Prevents premature table turnover

### 5. **Menu Item Deletion with Active Orders**
**Scenario:** Manager tries to delete item that's in active orders

**Handling:**
- Soft delete: `is_active = false` (not actual deletion)
- Item remains in existing orders (data integrity)
- Removed from menu for new orders
- Can be restored if needed

### 6. **Staff Account Deletion**
**Scenario:** Manager deletes staff account mid-shift

**Handling:**
- Soft delete: `is_active = false`
- Staff immediately logged out (session invalidated)
- Historical data preserved (orders, actions)
- Cannot login again

### 7. **Duplicate QR Code Scan**
**Scenario:** Same table QR scanned by multiple devices

**Handling:**
- Each device gets separate cart (localStorage)
- Orders linked to same table_id
- Manager sees multiple orders for same table
- Normal behavior (group dining scenario)

### 8. **Payment Gateway Timeout**
**Scenario:** Customer payment initiated but gateway doesn't respond

**Handling:**
- Order stuck in `pending_payment`
- Manager can manually verify payment
- If confirmed: Click "Mark Paid" (cash option)
- If failed: Cancel order
- Webhook reconciliation (if configured)

### 9. **Empty Order Creation**
**Scenario:** Manager tries to create order without items

**Validation:**
- Frontend blocks: "Add at least one item"
- Submit button disabled until items added
- Backend validation: Returns 400 error if bypassed

### 10. **Invalid Discount Amount**
**Scenario:** Manager enters discount > order total

**Validation:**
- Frontend blocks: "Discount cannot exceed order total"
- Backend validation: Caps discount at order total
- Shows warning toast

---

## 📱 UI/UX REQUIREMENTS

### Responsive Design
- **Desktop (>1024px):** Full layout with sidebar + tabs
- **Tablet (768px - 1024px):** Condensed sidebar, full tabs
- **Mobile (<768px):** Bottom navigation, stacked cards, horizontal scroll for tabs

### Performance
- **Dashboard Load:** < 2 seconds
- **Real-time Updates:** < 3 seconds
- **Action Response:** Instant UI feedback, < 1 second backend confirmation

### Accessibility
- **Keyboard Navigation:** Full support (Tab, Enter, Esc)
- **Screen Readers:** ARIA labels on all interactive elements
- **Color Contrast:** WCAG AA compliant
- **Focus Indicators:** Visible on all focusable elements

### Visual Hierarchy
- **Primary Actions:** Large, prominent buttons (Create Order, Add Table)
- **Secondary Actions:** Medium buttons (Filter, Refresh)
- **Tertiary Actions:** Icon buttons (Edit, Delete, View)

### Status Indicators
- **Order Status:** Color-coded badges (Blue, Yellow, Green, Gray, Red)
- **Payment Status:** Color-coded badges (Yellow, Green, Red)
- **Table Status:** Color-coded cards (Green, Orange, Purple, Gray)

### Notifications
- **Toast Position:** Top-right corner
- **Duration:** 3-5 seconds (5s for errors, 3s for success)
- **Sound:** Optional (configurable in settings)
- **Browser Notifications:** Requires permission, used for critical alerts

### Loading States
- **Full Page:** Spinner with logo
- **Component:** Skeleton loaders (cards, lists)
- **Actions:** Button spinner + disabled state

### Empty States
- **No Orders:** Illustration + "No orders yet" message
- **No Tables:** "Add your first table" CTA
- **No Staff:** "Invite team members" CTA

---

## 📝 NOTES FOR DESIGNERS

### Design System
- **Primary Color:** Orange/Red gradient (#FF6B35 → #F44336)
- **Secondary Color:** Blue (#3B82F6)
- **Success:** Green (#10B981)
- **Warning:** Yellow (#F59E0B)
- **Error:** Red (#EF4444)
- **Neutral:** Zinc/Gray shades

### Typography
- **Headings:** Bold, uppercase tracking for section headers
- **Body:** Regular weight, 14-16px for readability
- **Monospace:** For order numbers, amounts (tabular-nums)

### Spacing
- **Card Padding:** 16-24px (mobile-desktop)
- **Section Gaps:** 24-32px
- **Component Gaps:** 12-16px

### Animations
- **Page Transitions:** Fade + slide (200ms)
- **Modal Entrance:** Scale up from center (150ms)
- **Toast:** Slide in from right (200ms)
- **Hover Effects:** Scale 1.02, brightness 1.1 (100ms)

### Icons
- **Library:** Lucide React (16px, 20px, 24px sizes)
- **Style:** Outlined (consistent across app)
- **Color:** Inherit from parent or use theme colors

### Cards
- **Border Radius:** 12px (rounded-xl)
- **Shadow:** sm (small), md (hover), lg (modal)
- **Border:** 1px solid (white/10 for dark mode)

### Mobile Considerations
- **Touch Targets:** Min 44x44px
- **Horizontal Scroll:** Snap to items (tabs, quick actions)
- **Bottom Sheet:** For filters, modals on mobile
- **Sticky Header:** Logo + user menu always visible

---

## 🎯 SUCCESS CRITERIA

### Manager can successfully:
✅ View real-time dashboard with accurate stats  
✅ Monitor all orders across dine-in and takeaway  
✅ Create, modify, and cancel orders  
✅ Process payments (mark paid, refund)  
✅ Manage tables (add, edit, mark available)  
✅ Generate and view QR codes  
✅ Manage menu items (add, edit, toggle availability)  
✅ Manage staff (add, message, view activity)  
✅ Handle complaints and feedback  
✅ Generate reports and view analytics  
✅ Configure restaurant settings  
✅ Receive real-time notifications for critical events  

---

**End of Manager Workflow Documentation**
