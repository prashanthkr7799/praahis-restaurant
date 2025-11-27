# Manager Dashboard - Complete Features Reference

**Version**: 1.0 Final  
**Date**: November 22, 2025  
**Status**: ✅ Production Ready

---

## Overview

The Manager Dashboard is a comprehensive restaurant management interface with 5 core tabs and 15 major features for managing orders, tables, kitchen, staff, and complaints.

**Access**: `/manager/dashboard`  
**Authentication**: Requires manager role  
**Main Tabs**: Overview | Orders | Tables | Kitchen | Staff

---

## Feature List (15 Features)

### 1. ✅ Split Payment Processing

**Access**: Orders Tab → Order Card → Actions Dropdown → "Split Payment"

**Description**: Process payments that are partially cash and partially online.

**Workflow**:
1. Select order with pending payment
2. Click "Split Payment" from actions dropdown
3. Enter cash amount (e.g., ₹500)
4. Enter online amount (e.g., ₹1,500)
5. System validates: cash + online = order total
6. Enter Razorpay payment ID (optional, required for online portion)
7. Submit payment
8. Creates two payment records in `order_payments` table
9. Updates order `payment_method` to "split"
10. Stores split details in `payment_split_details` JSONB

**Database Changes**:
- `orders.payment_method`: includes 'split' option
- `orders.payment_split_details`: JSONB with {cash_amount, online_amount, razorpay_payment_id, split_timestamp}
- `order_payments`: One record for cash, one for online

**UI Display**:
- Order card shows split payment breakdown
- Badge displays "Split Payment"
- Cash and online amounts shown separately

**Files**:
- Modal: `src/domains/ordering/components/modals/SplitPaymentModal.jsx`
- Service: `src/shared/utils/api/supabaseClient.js` → `processSplitPayment()`

---

### 2. ✅ Discount System

**Access**: Orders Tab → Order Card → "Discount" Button

**Description**: Apply percentage or fixed discounts to unpaid orders with reason tracking.

**Workflow**:
1. Click "Discount" button on order card (only visible if payment_status !== 'paid')
2. Choose discount type: Percentage or Fixed Amount
3. Enter discount value
4. Enter reason for discount (optional but recommended)
5. Preview shows: Original Total → Discount Amount → New Total
6. Submit discount
7. Order updates with discount applied
8. Discount blocks payment on paid orders with warning

**Validation**:
- ✅ Blocks discounts on already paid orders
- ✅ Percentage: 0-100%
- ✅ Fixed amount: 0 to order total
- ✅ Real-time calculation preview
- ✅ Minimum discount: >₹0

**Database Fields**:
- `orders.discount_type`: 'percentage' or 'fixed'
- `orders.discount_value`: Original value entered
- `orders.discount_amount`: Calculated discount
- `orders.discount_reason`: Why discount was applied
- `orders.discount`: Same as discount_amount (legacy)

**Files**:
- Modal: `src/domains/ordering/components/modals/DiscountModal.jsx`
- Service: `src/shared/utils/api/supabaseClient.js` → `applyDiscount()`

---

### 3. ✅ Order Cancellation

**Access**: Orders Tab → Order Card → Actions Dropdown → "Cancel Order"

**Description**: Cancel orders with reason tracking and automatic refund processing.

**Workflow**:
1. Select order to cancel
2. Click "Cancel Order" from dropdown
3. Select cancellation reason:
   - Customer Request
   - Kitchen Issue
   - Wrong Order
   - Unavailable Items
   - Payment Issue
   - Other
4. Add cancellation notes (optional)
5. If order is paid, choose refund option:
   - Full Refund
   - Partial Refund (enter amount)
   - No Refund
6. Submit cancellation
7. Order status changes to 'cancelled'
8. Real-time notification sent to kitchen
9. Refund recorded if applicable

**Restrictions**:
- ❌ Cannot cancel 'served' orders
- ❌ Cannot cancel 'completed' orders
- ✅ Can cancel: received, preparing, ready

**Database Fields**:
- `orders.order_status`: 'cancelled'
- `orders.cancelled_at`: Timestamp
- `orders.cancellation_reason`: Reason enum
- `orders.cancellation_notes`: Free text
- `orders.refund_amount`: Amount refunded
- `orders.refund_reason`: Why refunded
- `orders.refunded_at`: Refund timestamp

**Files**:
- Modal: `src/domains/ordering/components/modals/CancelOrderModal.jsx`
- Service: `src/shared/utils/api/supabaseClient.js` → `cancelOrder()`

---

### 4. ✅ Refund Processing

**Access**: Orders Tab → Order Card → Actions Dropdown → "Process Refund"

**Description**: Issue full or partial refunds for paid orders.

**Workflow**:
1. Select paid order
2. Click "Process Refund"
3. Choose refund type:
   - **Full Refund**: Entire order amount
   - **Partial Refund**: Enter specific amount
4. Select refund reason:
   - Cancellation
   - Complaint
   - Wrong Order
   - Food Quality
   - Service Issue
   - Other
5. Add refund notes (optional)
6. Review refund summary
7. Confirm refund
8. Updates order payment_status to 'refunded' or 'partially_refunded'

**Razorpay Integration**:
- For online payments: Calls Razorpay refund API
- For cash payments: Records refund for manual processing
- For split payments: Allows refunding online portion only

**Database Fields**:
- `orders.payment_status`: 'refunded' or 'partially_refunded'
- `orders.refund_amount`: Total refunded
- `orders.refund_reason`: Reason text
- `orders.refunded_at`: Timestamp

**Files**:
- Modal: `src/domains/ordering/components/modals/RefundModal.jsx`
- Service: `src/shared/utils/api/supabaseClient.js` → `processRefund()`

---

### 5. ✅ Complaint Tracking

**Access**: 
- Overview Tab → Complaints Widget
- Orders Tab → Order Card → "Issue" Button

**Description**: Report, track, and resolve customer complaints with priority management.

**Workflow**:

**Reporting**:
1. Click "Issue" button on order card
2. Select issue types (multiple allowed):
   - 👎 Food Quality
   - 🍽️ Wrong Item
   - ⏰ Wait Time
   - 🙋 Service
   - Other
3. Enter detailed description (min 10 characters)
4. Select priority: Low | Medium | High
5. Add action taken (optional)
6. Submit complaint

**Viewing & Resolving**:
1. Navigate to Overview Tab
2. Scroll to Complaints section
3. Complaints grouped by priority (High → Medium → Low)
4. Click complaint to view details
5. Add resolution notes
6. Change status: Open → In Progress → Resolved → Closed

**Real-time Features**:
- ✅ Toast notification on new complaints
- ✅ Auto-refresh on updates
- ✅ Badge count on Overview tab

**Database Table**: `complaints`

**Key Fields**:
- `issue_types`: TEXT[] - Array of issue types (supports multiple)
- `description`: Detailed complaint text
- `priority`: 'low' | 'medium' | 'high'
- `status`: 'open' | 'in_progress' | 'resolved' | 'closed'
- `action_taken`: What was done to resolve
- `reported_by`: User who reported
- `resolved_by`: User who resolved
- `resolved_at`: Resolution timestamp

**Files**:
- Report Modal: `src/domains/ordering/components/modals/IssueReportModal.jsx`
- Complaints Panel: `src/domains/complaints/components/ComplaintsPanel.jsx`
- Details Modal: `src/domains/complaints/components/modals/ComplaintDetailsModal.jsx`
- Service: `src/shared/utils/api/complaintService.js`

---

### 6. ✅ Takeaway Order Management

**Access**: Orders Tab → "Create Takeaway Order" Button

**Description**: Create and manage takeaway orders with customer notification system.

**Workflow**:

**Creating Takeaway Order**:
1. Click "Create Takeaway Order" button
2. **Step 1**: Customer Details
   - Name (required)
   - Phone (required, validated)
   - Email (optional)
3. **Step 2**: Order Items
   - Select menu items
   - Add quantities
   - View real-time total
4. **Step 3**: Review & Confirm
   - Verify customer details
   - Review items and total
   - Add special instructions
   - Create order

**Managing Takeaway Orders**:
- Orders appear in "Takeaway" column (separate from dine-in)
- Status flow: Received → Preparing → Ready → Completed
- Click "Mark Ready" when order is prepared
- System tracks ready time and shows warning if >15 minutes

**Customer Notifications**:
- "Notify Customer" button appears when order is ready
- Opens modal with customer details pre-filled
- SMS/WhatsApp integration (if configured)
- Tracks notification timestamp

**Special Features**:
- ⚠️ Warning badge if order ready >15 minutes
- ⏱️ Ready time display
- 📱 Quick call customer from order card
- 🔔 Notification status tracking

**Database Fields**:
- `orders.order_type`: 'takeaway'
- `orders.customer_name`: Customer name
- `orders.customer_phone`: Phone number
- `orders.customer_email`: Email (optional)
- `orders.marked_ready_at`: When marked ready
- `orders.customer_notified_at`: When customer notified

**Files**:
- Create Modal: `src/domains/ordering/components/modals/CreateTakeawayOrderModal.jsx`
- Notification Modal: `src/domains/ordering/components/modals/TakeawayNotificationModal.jsx`

---

### 7. ✅ Cash Reconciliation

**Access**: Overview Tab → "Cash Reconciliation" Widget → "View Details"

**Description**: Daily cash counting with denomination calculator and discrepancy tracking.

**Workflow**:

**Daily Reconciliation**:
1. Navigate to Cash Reconciliation page
2. System loads today's cash breakdown:
   - Dine-in cash orders
   - Takeaway cash orders
   - Cash portion of split payments
3. Enter denominations in calculator:
   - ₹2000 × quantity
   - ₹500 × quantity
   - ₹200 × quantity
   - ₹100 × quantity
   - ₹50 × quantity
   - ₹20 × quantity
   - ₹10 × quantity
   - ₹5 × quantity
   - ₹2 × quantity
   - ₹1 × quantity
4. Calculator shows total counted
5. System compares: Expected vs Actual
6. If difference exists, enter reason
7. Submit reconciliation
8. Saved with timestamp and user

**Denomination Calculator**:
- Real-time calculation
- Quick clear buttons per denomination
- "Clear All" option
- Visual total display

**History View**:
- Last 7 days of reconciliations
- Shows expected, actual, difference for each day
- Color-coded: Green (match), Red (short), Blue (over)

**Database Table**: `cash_reconciliations`

**Key Fields**:
- `reconciliation_date`: Date of reconciliation
- `expected_cash`: From system records
- `actual_cash`: Physical count
- `difference`: actual - expected
- `dinein_cash`, `dinein_count`: Dine-in breakdown
- `takeaway_cash`, `takeaway_count`: Takeaway breakdown
- `split_cash`, `split_count`: Split payment breakdown
- `denominations`: JSONB with count per denomination
- `reason_for_difference`: If mismatch
- `submitted_by`: User who submitted

**Files**:
- Component: `src/domains/cash/components/CashReconciliationPage.jsx`
- Service: `src/shared/utils/api/supabaseClient.js` → cash reconciliation functions

**Migration**: `phase3_migrations/18_cash_reconciliations.sql`

---

### 8. ✅ Real-time Order Updates

**Access**: Automatic across all tabs

**Description**: Live order updates via Supabase real-time subscriptions.

**Features**:
- ✅ New order notifications (toast)
- ✅ Order status changes (auto-refresh)
- ✅ Payment status updates
- ✅ Kitchen queue changes
- ✅ Table occupancy updates

**Implementation**:
- Uses Supabase `postgres_changes` events
- Filtered by restaurant_id (multi-tenant safe)
- Subscriptions active only when tab is visible
- Auto-cleanup on component unmount

**Subscription Channels**:
1. **orders-changes**: All order updates
2. **tables-changes**: Table status updates
3. **kitchen-changes**: Kitchen queue updates
4. **complaints-changes**: New complaints

**Files**:
- Manager Dashboard: `src/pages/manager/ManagerDashboard.jsx`
- Service: `src/shared/utils/api/supabaseClient.js` → `subscribeToOrders()`

---

### 9. ✅ Kitchen Display System

**Access**: Kitchen Tab

**Description**: Dedicated view for kitchen staff to manage order preparation.

**Features**:
- Orders grouped by status: New | Preparing | Ready
- Large item cards with clear status badges
- Quick status update buttons
- Item-level status tracking
- Timer display for order age
- Special instructions prominently displayed

**Workflow**:
1. New orders appear in "New Orders" section
2. Kitchen accepts order → moves to "Preparing"
3. Items marked as prepared individually
4. All items ready → "Mark Ready" button appears
5. Order moves to "Ready" section
6. Waiter collects and marks "Served"

**Real-time Updates**:
- New orders auto-appear with sound (if enabled)
- Status changes reflect immediately
- Cancelled orders auto-remove

**Files**:
- Component: `src/domains/kitchen/components/KitchenTab.jsx`

---

### 10. ✅ Table Management

**Access**: Tables Tab

**Description**: Visual table layout with occupancy status and quick actions.

**Features**:
- Grid view of all tables
- Color-coded status:
  - 🟢 Available
  - 🟡 Occupied
  - 🔴 Reserved
- Occupancy statistics
- Active orders per table
- Quick view order details

**Actions**:
- View table's active orders
- Mark table as occupied/available
- Reserve tables
- Clear table (mark orders completed)

**Real-time Updates**:
- Table status updates automatically
- Order count updates live
- Occupancy % recalculates

**Files**:
- Component: `src/domains/tables/components/TablesTab.jsx`

---

### 11. ✅ Staff Management

**Access**: Staff Tab

**Description**: Manage restaurant staff members, roles, and activity.

**Features**:
- Staff list with photos and roles
- Status indicators (Active/Inactive)
- Performance metrics per staff
- Quick actions:
  - Send message
  - View activity log
  - Edit details
  - Toggle active status

**Metrics Displayed**:
- Orders handled today
- Average service time
- Customer ratings
- Current shift status

**Files**:
- Component: `src/domains/staff/components/StaffTab.jsx`
- Modals: `StaffMessageModal.jsx`, `StaffActivityModal.jsx`

---

### 12. ✅ Overview Dashboard

**Access**: Overview Tab (default tab)

**Description**: High-level metrics and quick access to key features.

**Stat Cards** (5 cards with trends):
1. **Revenue**: Today's total with % change from yesterday
2. **Orders**: Total orders with trend indicator
3. **Table Occupancy**: Occupied/Total tables ratio
4. **Pending Payments**: Count of unpaid orders
5. **Complaints**: Today's complaints with priority breakdown

**Quick Operations** (6 cards):
1. Menu Management → `/manager/menu`
2. Table Management → Tables tab
3. Orders → Orders tab
4. Payments → Filter to pending payments
5. QR Codes → `/manager/qr-codes`
6. Staff → Staff tab

**Recent Activity**:
- Last 10 orders with status
- Recent complaints
- Staff activity log

**Real-time Features**:
- Stat cards update automatically
- Activity log live updates
- Sparkline charts for trends

**Files**:
- Component: Overview section in `src/pages/manager/ManagerDashboard.jsx`

---

### 13. ✅ Order Filtering & Search

**Access**: Orders Tab → Filter Controls

**Description**: Advanced filtering and search for orders.

**Filter Options**:
- **Status**: All | Pending | Received | Preparing | Ready | Served | Completed | Cancelled
- **Payment Status**: All | Pending | Paid | Failed
- **Order Type**: All | Dine-in | Takeaway | Delivery
- **Date Range**: Today | Yesterday | Last 7 Days | Custom Range
- **Search**: Order number, customer name, table number

**Quick Filters**:
- Pending Payment (orange badge)
- Today's Orders
- My Orders (by current user)

**Results**:
- Orders displayed as cards
- Grouped by order type (Dine-in | Takeaway)
- Paginated (50 per page)
- Sortable by: Date | Total | Status

**Files**:
- Orders Tab in `src/pages/manager/ManagerDashboard.jsx`

---

### 14. ✅ Payment Status Management

**Access**: Orders Tab → Order Card → Payment Badge/Dropdown

**Description**: Track and update payment status with multiple methods.

**Payment Methods**:
- Cash
- Razorpay (Online)
- UPI
- Card
- Split (Cash + Online)

**Payment Statuses**:
- Pending (default)
- Paid
- Failed
- Refunded
- Partially Refunded

**Actions Available**:
- Mark as Paid (for cash)
- Process Online Payment (Razorpay)
- Split Payment
- Process Refund
- View Payment History

**Payment History**:
- Shows all payment records for order
- Timestamp for each payment
- Method used
- Amount
- Status

**Database Tables**:
- `orders`: payment_status, payment_method
- `order_payments`: Individual payment records

**Files**:
- Dropdown: `src/domains/ordering/components/PaymentActionsDropdown.jsx`
- Service: `src/shared/utils/api/supabaseClient.js`

---

### 15. ✅ Order Actions Dropdown

**Access**: Orders Tab → Order Card → 3-dot menu (⋮)

**Description**: Comprehensive action menu for all order operations.

**Available Actions** (contextual based on order status):
1. **View Details**: Full order information modal
2. **Edit Order**: Modify items (if not preparing)
3. **Print Receipt**: Generate PDF receipt
4. **Split Payment**: Process split payment
5. **Process Refund**: Issue full/partial refund
6. **Cancel Order**: Cancel with reason
7. **Mark as Paid**: Quick cash payment
8. **Send to Kitchen**: Resend order to kitchen
9. **Notify Customer**: Send notification (takeaway)

**Contextual Display**:
- Actions shown based on order status
- Disabled actions grayed out with tooltip
- Payment actions only if payment pending
- Refund only if paid
- Cancel only if not served

**Files**:
- Component: Dropdown in OrderCard.jsx
- Each action opens respective modal

---

## Known Limitations

1. **SMS Notifications**: Integration stubbed, requires Twilio/MSG91 setup
2. **Razorpay Refunds**: Backend endpoint needed for automatic refunds
3. **Float Management**: Cash reconciliation doesn't track opening float
4. **Multi-currency**: Currently INR only
5. **Offline Mode**: Requires internet connection

---

## Technical Stack

**Frontend**:
- React 18
- Vite
- Tailwind CSS
- React Router
- Lucide Icons

**Backend**:
- Supabase (Database + Auth + Real-time)
- PostgreSQL
- Row Level Security (RLS)

**Payment**:
- Razorpay Integration
- Manual cash tracking

---

## Database Schema Summary

**Core Tables**:
- `orders` - All order records (dine-in, takeaway, delivery)
- `order_payments` - Payment transaction records
- `complaints` - Customer complaints with multi-issue support
- `cash_reconciliations` - Daily cash reconciliation records
- `tables` - Restaurant table configuration
- `users` - Staff/manager accounts
- `menu_items` - Restaurant menu

**Key Relationships**:
- orders.restaurant_id → restaurants.id
- orders.table_id → tables.id
- complaints.order_id → orders.id
- order_payments.order_id → orders.id
- cash_reconciliations.restaurant_id → restaurants.id

---

## Migration Files

**Required Migrations** (in order):
1. `01_core_schema.sql` - Base tables
2. `17_split_payment_support.sql` - Split payments
3. `18_cash_reconciliations.sql` - Cash reconciliation
4. `19_fix_complaints_issue_types.sql` - Issue types array

**See**: `MIGRATIONS.md` for detailed migration instructions

---

## Feature Status Summary

| # | Feature | Status | Migration Required |
|---|---------|--------|-------------------|
| 1 | Split Payment | ✅ Complete | ✅ #17 |
| 2 | Discount System | ✅ Complete | ✅ Included in base |
| 3 | Order Cancellation | ✅ Complete | ✅ Included in base |
| 4 | Refund Processing | ✅ Complete | ✅ Included in base |
| 5 | Complaint Tracking | ✅ Complete | ✅ #19 |
| 6 | Takeaway Orders | ✅ Complete | ✅ Included in base |
| 7 | Cash Reconciliation | ✅ Complete | ✅ #18 |
| 8 | Real-time Updates | ✅ Complete | ❌ No migration |
| 9 | Kitchen Display | ✅ Complete | ❌ No migration |
| 10 | Table Management | ✅ Complete | ✅ Included in base |
| 11 | Staff Management | ✅ Complete | ✅ Included in base |
| 12 | Overview Dashboard | ✅ Complete | ❌ No migration |
| 13 | Order Filtering | ✅ Complete | ❌ No migration |
| 14 | Payment Status | ✅ Complete | ❌ No migration |
| 15 | Order Actions | ✅ Complete | ❌ No migration |

**Total**: 15/15 features complete ✅

---

## Removed Features (Available but Hidden)

The following tabs were implemented but removed from navigation:
- **Billing Tab**: Subscription management
- **Reports Tab**: Analytics and exports
- **Offers Tab**: Discount campaigns
- **Reservations Tab**: Table reservations

**Reason**: To focus on core restaurant operations (5 tabs)

**How to Enable**: Uncomment tab definitions in `ManagerDashboard.jsx` lines 1399-1410 and 2980-3010

---

## Support & Troubleshooting

**Common Issues**:

1. **Discount button not showing**: Check if order payment_status is 'paid'
2. **Split payment validation fails**: Ensure cash + online = order total
3. **Complaints not appearing**: Check real-time subscription is active
4. **Cash reconciliation missing**: Run migration #18

**Debug Mode**:
- Check browser console for errors
- Verify Supabase connection
- Check RLS policies for user's restaurant_id

---

**Document Version**: 1.0 Final  
**Last Updated**: November 22, 2025  
**Maintained By**: Praahis Development Team
