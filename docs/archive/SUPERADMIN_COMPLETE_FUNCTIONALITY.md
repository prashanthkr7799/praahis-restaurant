# Super Admin Dashboard - Complete Functionality Guide

## 🎯 Overview
The Super Admin Dashboard is the **platform owner's control center** for managing the entire Praahis restaurant management system. It provides complete oversight and control over all restaurants, subscriptions, managers, and platform settings.

---

## 🏗️ Architecture

### Navigation Structure
```
/superadmin
├── Dashboard (Overview)
├── Restaurants & Subscriptions
├── Managers
└── Settings
```

### Authentication
- **Login**: Uses special owner authentication via `supabaseOwner` client
- **Access Level**: Bypasses Row Level Security (RLS) for full data access
- **Protection**: `ProtectedOwnerRoute` wrapper ensures only authorized superadmins can access

### Layout Components
- **SuperAdminLayout**: Main container with header and content area
- **SuperAdminHeader**: Top navigation with logo, branding, and logout
- **No Sidebar**: Clean, minimal design with page-based navigation

---

## 📊 1. Dashboard (Home Page)

**Route**: `/superadmin` or `/superadmin/dashboard`

### Main KPI Cards (6 Primary Metrics)
1. **Total Restaurants**
   - Count of all restaurants in system
   - Color: Orange (Brand)
   - Icon: Building2

2. **Active Restaurants**
   - Restaurants with `is_active = true`
   - Color: Green (Success)
   - Icon: Activity

3. **Total Users**
   - All staff members across all restaurants
   - Color: Blue (Info)
   - Icon: Users

4. **Total Revenue**
   - Sum of all paid orders (₹ INR format)
   - Color: Green (Success)
   - Icon: DollarSign
   - Displays with Indian currency formatting

5. **Total Orders**
   - Count of all orders in system
   - Color: Orange (Warning)
   - Icon: ShoppingCart

6. **Active Subscriptions**
   - Count of active restaurant subscriptions
   - Color: Blue (Info)
   - Icon: CreditCard

### Secondary Metrics (3 Cards)
1. **Managers**
   - Count of users with 'manager' or 'admin' role
   - Shows "Across all restaurants"

2. **Pending Feedbacks**
   - Orders without feedback submitted
   - Calculation: Total Orders - Total Feedbacks

3. **Active Sessions**
   - Current active table sessions
   - Real-time dining sessions

### Features
- ✅ **Auto-refresh**: Real-time data updates
- ✅ **Loading states**: Skeleton loaders during data fetch
- ✅ **Parallel queries**: All stats fetched simultaneously for performance
- ✅ **Last updated timestamp**: Shows when data was last refreshed
- ✅ **Manual refresh button**: RefreshCw icon with loading animation

### Quick Actions
Three action buttons to navigate to main sections:
1. **Manage Restaurants** → `/superadmin/restaurants`
2. **Manage Managers** → `/superadmin/managers`
3. **System Settings** → `/superadmin/settings`

---

## 🏢 2. Restaurants & Subscriptions Page

**Route**: `/superadmin/restaurants`

### Overview
Unified view of all restaurants with their subscription information in a single, modern table interface.

### Features

#### Search & Filters
- **Search Bar**: Search by restaurant name or email
- **Refresh Button**: Manual data reload with icon animation
- **Real-time filtering**: Instant results as you type

#### Restaurant Table Columns
1. **Restaurant**
   - Name (large, bold)
   - Email (small, muted)

2. **Plan**
   - Badge showing subscription status
   - Colors: Trial (yellow), Active (green), Expired (gray)

3. **Status**
   - Active/Inactive badge
   - Green for active, red for inactive

4. **Expires**
   - Formatted expiry date (e.g., "Dec 15, 2025")
   - From `trial_ends_at` or `current_period_end`

5. **Days Left**
   - Countdown to expiration
   - Shows "Expired" for past dates
   - Shows "Today" for same-day expiration

6. **Actions** (Fixed width: 500px)
   - **View**: View full restaurant details (blue, 70px)
   - **Edit**: Edit restaurant information (gray, 70px)
   - **Extend** (Trial only): Extend trial period (green, 80px)
   - **Upgrade** (Trial only): Upgrade to paid plan (purple, 90px)
   - **Activate/Deactivate**: Toggle status (green/red, 110px)
   - **Delete**: Remove restaurant (red, 80px)

#### Action Buttons Functionality

**View Button** 🔍
- Opens restaurant detail page
- Shows all restaurant information across tabs

**Edit Button** ✏️
- Opens restaurant form in edit mode
- Pre-fills all existing data
- Can update: name, slug, subscription status, limits, active status

**Extend Button** ⏱️ (Trial Only)
- Currently shows toast: "Extend trial feature coming soon"
- Intended to add days to trial period

**Upgrade Button** ⬆️ (Trial Only)
- Currently shows toast: "Upgrade feature coming soon"
- Intended to upgrade from trial to paid plan

**Activate/Deactivate Button** 🔌
- Toggles `is_active` status in database
- Updates immediately with optimistic UI
- Changes button text and color based on state

**Delete Button** 🗑️
- Opens confirmation modal with warning
- Shows list of data that will be deleted:
  - Subscription records
  - Payment history
  - Staff members & users
  - Menu items & categories
  - Tables & sessions
  - Orders & ratings
- Requires explicit confirmation
- Permanent action - cannot be undone

#### Add Restaurant Button
- Top-right corner
- Opens restaurant creation form
- Creates new restaurant from scratch

### Database Integration
- Uses `supabaseOwner` for unrestricted access
- Fetches restaurants with subscription data via join
- Real-time updates after any modification

---

## 🔍 3. Restaurant Detail Page

**Route**: `/superadmin/restaurants/:restaurantId`

### Tab Navigation
7 tabs for complete restaurant information:

#### Tab 1: Overview
**4 Metric Cards:**
1. **Staff Members**
   - Total count
   - Active staff count

2. **Orders**
   - Total orders for this restaurant

3. **Active Tables**
   - Tables with active sessions
   - Filters tables by `active_session_id`

4. **Menu Items**
   - Total menu items count

#### Tab 2: Staff ⭐ **FIXED**
Shows all staff members including:
- **Waiters** 👨‍🍳
- **Chefs** 👨‍🍳
- **Managers** 👔
- **Admins** 🔧

**Display for each staff:**
- Full name (bold)
- Email address (small)
- Role badge (blue, capitalized)
- Phone number (if available) with 📞 icon
- Active/Inactive status badge

**Empty State:**
- Shows friendly message when no staff exists
- "Staff members (waiters, chefs, managers, admins) will appear here when added."

**Features:**
- Staff count in header
- Searchable/filterable list
- Role-based badges
- Contact information display

#### Tab 3: Orders
**Order Table:**
- Order number/ID
- Order status
- Total amount (₹ INR)
- Last 100 orders (most recent first)

#### Tab 4: Menu
**Grid View:**
- Menu item name
- Category
- 2-column responsive grid
- Shows all menu items

#### Tab 5: Tables
**Grid View:**
- Table number
- Current status
- 3-column responsive grid
- All restaurant tables

#### Tab 6: Logs
**Activity Log:**
- Action description
- Timestamp (formatted)
- Last 50 logs (most recent first)
- Shows system activities

#### Tab 7: Settings
**Restaurant Management:**
1. **Restaurant Status**
   - Shows current status (Active/Inactive)
   - Toggle button to activate/deactivate

2. **Manager Password**
   - Reset password option
   - For owner/manager accounts

### Page Header
- Restaurant name (large, bold)
- Active/Inactive badge
- **Edit Button**: Opens edit form

### Data Fetching
- All data fetched in parallel using `Promise.all()`
- Single loading state for better UX
- Uses `supabaseOwner` for full access

---

## ✏️ 4. Restaurant Form (Add/Edit)

**Routes**: 
- `/superadmin/restaurants/new` (Create)
- `/superadmin/restaurants/:restaurantId/edit` (Update)

### Form Fields

1. **Restaurant Name*** (required)
   - Text input
   - Main identifier
   - Auto-generates slug on change

2. **Slug*** (required)
   - URL-friendly identifier
   - Auto-generated from name
   - Can be manually edited
   - Example: "table9-restaurant"

3. **Subscription Status**
   - Dropdown select
   - Options: Trial, Active, Inactive, Cancelled, Expired
   - Default: Trial

4. **Max Users** (Limit)
   - Number input
   - Default: 10
   - Total staff members allowed

5. **Max Tables** (Limit)
   - Number input
   - Default: 20
   - Maximum tables allowed

6. **Max Menu Items** (Limit)
   - Number input
   - Default: 100
   - Maximum menu items allowed

7. **Is Active**
   - Checkbox
   - Default: true (checked)
   - Restaurant operational status

### Functionality

**Create Mode:**
- Empty form
- Generates slug automatically
- Inserts new record in database
- Navigates to restaurant detail page on success

**Edit Mode:**
- Pre-fills all fields with existing data
- Shows loading state while fetching
- Updates existing record
- Navigates back to restaurant detail page

**Validation:**
- Name required
- Slug required and unique
- Numeric limits validated
- Toast notifications for success/error

**Actions:**
- **Cancel**: Navigate back without saving
- **Save/Create**: Submit form and save to database

---

## 👥 5. Managers List Page

**Route**: `/superadmin/managers`

### Overview
Central management for all restaurant managers and admin users across the platform.

### Features

#### Search & Filters
1. **Search Bar**: Search by name, email
2. **Restaurant Filter**: Filter by specific restaurant
3. **Status Filter**: Active/Inactive
4. **Pagination**: 10 managers per page

#### Manager Table
**Columns:**
1. **Manager Info**
   - Name (bold)
   - Email
   - Phone (if available)

2. **Restaurant**
   - Restaurant name
   - Restaurant slug
   - Shows linked restaurant

3. **Role**
   - Badge: Manager/Admin

4. **Status**
   - Active/Inactive badge

5. **Created**
   - Registration date

6. **Actions**
   - View details (Eye icon)
   - Edit manager (Edit icon)
   - Reset password (Key icon)
   - Toggle status (Power icon)
   - Delete (Trash icon)

#### Add Manager Modal
Opens when clicking **"Add Manager"** button

**Form Fields:**
- Name*
- Email*
- Phone
- Password* (minimum 6 characters)
- Restaurant (dropdown)
- Role (Manager/Admin)
- Status (Active/Inactive checkbox)

**Process:**
1. Creates auth user in Supabase Auth
2. Creates user record in `users` table
3. Links to restaurant
4. Sets role and permissions

#### Edit Manager Modal
**Can Update:**
- Name
- Phone
- Restaurant assignment
- Role
- Active status

**Cannot Update:**
- Email (immutable)
- Password (separate reset action)

#### Manager Actions

**Reset Password** 🔑
- Sends password reset email
- Uses Supabase Auth reset flow

**Toggle Status** 🔌
- Activates/deactivates manager account
- Updates `is_active` field
- Prevents login when inactive

**Delete Manager** 🗑️
- Removes auth user
- Removes user record
- Shows confirmation dialog
- **Warning**: Cannot be undone

### Data Display
- Shows managers with role: 'manager' or 'admin'
- Includes restaurant relationship via join
- Real-time updates after modifications

---

## ⚙️ 6. System Settings Page

**Route**: `/superadmin/settings`

### Overview
Platform-wide configuration and settings management.

### Settings Categories

#### 1. Trial & Subscription Settings
- **trial_grace_period_days**: Grace period after trial expires (default: 0)
- **send_expiry_warnings**: Send expiration warnings (true/false)
- **warning_days_before_expiry**: Days before expiry to send warnings [7, 3, 1]
- **auto_deactivate_expired**: Auto-deactivate expired subscriptions (true/false)

#### 2. Default Limits
- **default_max_users**: Default user limit per restaurant (10)
- **default_max_tables**: Default table limit (20)
- **default_max_menu_items**: Default menu items limit (100)

#### 3. Plan Pricing
- **plan_trial_price**: Trial plan cost (₹0)
- **plan_basic_price**: Basic plan cost (₹999)
- **plan_pro_price**: Pro plan cost (₹2,999)
- **plan_enterprise_price**: Enterprise plan cost (₹9,999)

#### 4. Platform Settings
- **platform_name**: Platform branding name (Praahis)
- **support_email**: Support contact email
- **maintenance_mode**: Enable/disable maintenance mode (true/false)

### Features

**Setting Display:**
- Organized by category
- Input fields for each setting
- Helper text for descriptions
- Current values pre-filled

**Actions:**
- **Save Button**: Saves all changed settings
- **Reset Button**: Reverts to last saved values
- **Shows change indicator**: Highlights unsaved changes

**Save Process:**
1. Detects changed settings
2. Upserts each changed setting to `platform_settings` table
3. Auto-categorizes each setting
4. Shows success toast with count of saved settings
5. Updates original values to prevent re-saves

**Storage:**
- Settings stored in `platform_settings` table
- Key-value pairs with JSONB values
- Categorized for organization
- Can be encrypted for sensitive data

---

## 🗄️ Database Schema

### Core Tables Used

#### 1. `restaurants`
```sql
- id (UUID, PK)
- name (VARCHAR)
- slug (TEXT, unique)
- email (VARCHAR)
- phone (VARCHAR)
- is_active (BOOLEAN)
- subscription_status (VARCHAR)
- max_users (INTEGER)
- max_tables (INTEGER)
- max_menu_items (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. `subscriptions`
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK → restaurants)
- plan_name (VARCHAR) -- trial, basic, pro, enterprise
- status (VARCHAR) -- active, inactive, trial, cancelled, expired
- billing_cycle (VARCHAR) -- monthly, yearly
- price (DECIMAL)
- currency (VARCHAR) -- INR
- trial_ends_at (TIMESTAMP)
- current_period_start (TIMESTAMP)
- current_period_end (TIMESTAMP)
- cancelled_at (TIMESTAMP)
- metadata (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. `users` (Staff)
```sql
- id (UUID, PK)
- email (VARCHAR, unique)
- name / full_name (VARCHAR)
- phone (VARCHAR)
- role (VARCHAR) -- waiter, chef, manager, admin
- restaurant_id (UUID, FK → restaurants)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 4. `platform_settings`
```sql
- id (UUID, PK)
- key (VARCHAR, unique)
- value (JSONB)
- category (VARCHAR) -- subscription, pricing, limits, general
- is_encrypted (BOOLEAN)
- description (TEXT)
- updated_by (UUID, FK → auth.users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 5. Additional Tables Accessed
- `orders` - All restaurant orders
- `menu_items` - Menu items per restaurant
- `tables` - Restaurant tables
- `activity_logs` - System activity logs
- `feedbacks` - Customer feedback

---

## 🔐 Security & Permissions

### Authentication
- Uses `supabaseOwner` client (service role key)
- Bypasses Row Level Security (RLS) policies
- Full read/write access to all tables
- Protected by `ProtectedOwnerRoute` wrapper

### Access Control
- **Login required**: Must be authenticated as superadmin
- **Session management**: Uses separate owner session
- **Logout**: Clears owner session and redirects to login

### RLS Policies
Special policies in database for superadmin:
```sql
-- Only owners can manage platform settings
CREATE POLICY "Only owners can manage platform settings" ON platform_settings
  FOR ALL USING (auth.jwt() ->> 'is_owner' = 'true');

-- Superadmin can view all subscriptions
-- Managers can view their own restaurant's subscription
```

---

## 🎨 Design System

### Color Palette
- **Primary (Brand)**: Orange (#ea580c, #f97316)
- **Success**: Green (active status, revenue)
- **Warning**: Orange/Yellow (trials, warnings)
- **Info**: Blue (informational metrics)
- **Destructive**: Red (delete, deactivate, errors)
- **Muted**: Gray (secondary text, borders)

### Components Used
- **StatCard**: KPI metric cards with icons
- **QuickActionCard**: Action buttons with hover effects
- **Badge**: Status and role indicators
- **Modal**: Confirmation dialogs
- **LoadingSpinner**: Loading states
- **Toast**: Success/error notifications

### Responsive Design
- Mobile-first approach
- Grid layouts adapt to screen size
- Tables scroll horizontally on mobile
- Action buttons stack on small screens

### Dark Mode
- Full dark mode support
- Semantic color variables
- `dark:` Tailwind classes throughout

---

## 📈 Key Workflows

### 1. Onboard New Restaurant
1. Click "Add Restaurant" button
2. Fill in restaurant details
3. Set subscription plan and limits
4. Create restaurant
5. **Add manager** via Managers page
6. Manager can log in and start using system

### 2. Manage Subscriptions
1. View all restaurants in Restaurants page
2. Check expiry dates and days remaining
3. **Extend trial** for restaurants needing more time
4. **Upgrade** trial restaurants to paid plans
5. **Deactivate** expired/non-paying restaurants

### 3. Monitor Platform Health
1. Check Dashboard for KPIs
2. Review active vs inactive restaurants
3. Monitor revenue and order volume
4. Track pending feedbacks
5. Check active sessions

### 4. Manage Staff
1. Go to Managers page
2. Filter by restaurant
3. Add new managers with credentials
4. Edit manager details
5. Reset passwords when needed
6. Deactivate/delete inactive managers

### 5. Configure Platform
1. Go to System Settings
2. Update pricing for plans
3. Set default limits
4. Configure trial settings
5. Save changes

### 6. View Restaurant Details
1. Click "View" on any restaurant
2. See overview metrics
3. Check staff list (all roles)
4. Review orders and menu
5. View tables and activity logs

---

## 🚀 Performance Optimizations

1. **Parallel Data Fetching**
   - All dashboard stats fetched simultaneously
   - Restaurant details use Promise.all()
   - Reduces load time significantly

2. **Loading States**
   - Skeleton loaders for better UX
   - Prevents layout shift
   - Shows progress indicators

3. **Optimistic Updates**
   - UI updates before API confirmation
   - Rolls back on error
   - Faster perceived performance

4. **Database Indexes**
   - Indexed on restaurant_id
   - Indexed on status fields
   - Fast queries even with large datasets

---

## 🐛 Known Limitations & Future Enhancements

### Current Limitations
1. **Extend Trial**: UI present but functionality pending
2. **Upgrade Plan**: UI present but functionality pending
3. **Payment Integration**: Not yet implemented
4. **Bulk Actions**: Cannot act on multiple restaurants at once
5. **Export Data**: No CSV/Excel export functionality
6. **Email Notifications**: Manual only, no automated emails

### Planned Features
1. ✨ **Subscription Management**
   - Auto-renew subscriptions
   - Payment gateway integration (Razorpay)
   - Invoice generation
   - Payment history tracking

2. ✨ **Advanced Analytics**
   - Revenue charts and trends
   - Restaurant performance comparison
   - Subscription churn analysis
   - Usage metrics per restaurant

3. ✨ **Bulk Operations**
   - Bulk status updates
   - Bulk trial extensions
   - Bulk exports

4. ✨ **Communication**
   - Send announcements to all restaurants
   - Email notifications for expiring trials
   - Automated reminder emails

5. ✨ **Audit Trail**
   - Track all superadmin actions
   - View history of changes
   - Rollback capabilities

---

## 📝 Summary

The **Super Admin Dashboard** provides comprehensive control over the entire Praahis platform with:

✅ **Real-time monitoring** of all restaurants and subscriptions
✅ **Complete CRUD operations** for restaurants and managers
✅ **Staff management** with proper role tracking (waiters, chefs, managers, admins)
✅ **Subscription tracking** with trial management
✅ **Platform configuration** via system settings
✅ **Detailed restaurant insights** across 7 information tabs
✅ **Secure access** with owner-level authentication
✅ **Modern UI** with responsive design and dark mode

The system is production-ready for basic operations with room for future enhancements in payment processing, analytics, and automation.

---

**Last Updated**: November 7, 2025
**Version**: 1.0
**Author**: Super Admin Module Team
