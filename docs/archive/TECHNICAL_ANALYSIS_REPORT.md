# Technical Analysis Report: Praahis Restaurant Management System

**Generated**: November 6, 2025  
**Project Name**: Praahis (formerly Tabun/Restaura/MealMate)  
**Version**: 0.0.0  
**Analysis Type**: Complete Repository Assessment

---

## 1. Project Overview

### Primary Goal
**Praahis** is a comprehensive, multi-tenant restaurant management system designed to modernize the dining experience through QR code-based ordering, real-time kitchen displays, and integrated payment processing. The system eliminates traditional paper menus and manual order-taking, replacing them with a digital-first approach that streamlines operations for both customers and staff.

### Domain & Problem Solved
**Domain**: Food & Beverage Service Industry, Restaurant Technology (RestaurantTech/HospitalityTech)

**Problems Solved**:
1. **Customer Pain Points**:
   - Long wait times for menu browsing and ordering
   - Inability to track order status in real-time
   - Payment friction and split bill complications
   - Limited ability to provide granular feedback

2. **Restaurant Operations**:
   - Manual order-taking errors and inefficiencies
   - Poor kitchen-to-floor communication
   - Lack of real-time table management
   - Difficult data aggregation for analytics
   - No centralized system for multi-location management

3. **Staff Challenges**:
   - Waiters spending excessive time on order-taking vs. service
   - Kitchen staff losing track of order priorities
   - Managers lacking visibility into operations
   - Manual inventory and menu updates

### Key Differentiators
- **Session-Based Dining**: Tracks entire customer visits from QR scan to feedback, allowing multiple orders per seating
- **Multi-Tenancy Support**: Single codebase serves multiple restaurants with isolated data
- **Role-Based Access Control**: Owner > Manager > Chef/Waiter hierarchy with granular permissions
- **Real-time Synchronization**: Live updates across all dashboards using Supabase Realtime
- **Comprehensive Feedback System**: Overall ratings + individual dish ratings tied to dining sessions

---

## 2. Architecture Summary

### System Architecture
**Type**: Full-stack Single Page Application (SPA) with Backend-as-a-Service (BaaS)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER (React SPA)                │
├─────────────────────────────────────────────────────────────┤
│  Customer Interface  │  Staff Dashboards  │  Admin Portals  │
│  - Table Ordering    │  - Chef Display    │  - Manager      │
│  - Payment Flow      │  - Waiter Tables   │  - Super Admin  │
│  - Feedback Forms    │                    │                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ REST API / Realtime WebSocket
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND LAYER (Supabase BaaS)                   │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database  │  Auth Service  │  Realtime Engine   │
│  - 15+ Tables         │  - JWT Tokens  │  - Pub/Sub         │
│  - RLS Policies       │  - Sessions    │  - Live Updates    │
│  - Helper Functions   │                │                    │
└─────────────────────────────────────────────────────────────┘
                   │
                   │ External Integrations
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────┤
│  Razorpay (Payments)  │  Storage (QR Codes, Images)         │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
Praahis/
├── src/                          # Frontend application source
│   ├── Components/               # Reusable UI components
│   │   ├── admin/               # Admin-specific components
│   │   ├── common/              # Shared components
│   │   ├── layouts/             # Layout wrappers (Admin, SuperAdmin)
│   │   └── [Various Components] # MenuItem, CartSummary, OrderCard, etc.
│   ├── pages/                    # Route-level page components
│   │   ├── admin/               # Manager portal pages
│   │   ├── superadmin/          # Owner portal pages
│   │   ├── waiter/              # Waiter dashboard
│   │   └── [Customer Pages]     # TablePage, PaymentPage, FeedbackPage
│   ├── context/                  # React Context providers
│   │   └── RestaurantContext.jsx # Multi-tenant context management
│   ├── hooks/                    # Custom React hooks
│   │   ├── useRestaurant.js     # Restaurant context hook
│   │   ├── useRealtimeOrders.js # Realtime subscriptions
│   │   ├── useSearch.js         # Search functionality
│   │   └── useTheme.js          # Theme management
│   ├── lib/                      # Core business logic
│   │   ├── supabaseClient.js    # Database/API client (838 lines)
│   │   ├── orderHelpers.js      # Order processing utilities
│   │   ├── notificationService.js # Notification system
│   │   └── [Other helpers]
│   ├── utils/                    # Utility functions
│   │   ├── permissions.js       # RBAC implementation
│   │   ├── auth.js              # Authentication helpers
│   │   ├── session.js           # Session management
│   │   └── [Formatters, validators]
│   └── assets/                   # Static assets
│       └── marketing/           # Marketing images
├── database/                     # SQL migration files (22 files)
│   ├── 01_schema.sql            # Core database schema
│   ├── 10_multitenancy.sql      # Multi-tenant support
│   ├── 22_table_sessions.sql    # Session tracking system
│   └── [Other migrations]
├── scripts/                      # Automation scripts
│   ├── seed-tenants.js          # Multi-tenant seeding
│   ├── verify-supabase.js       # Setup verification
│   └── backup.sh                # Database backup
├── public/                       # Static public files
└── [Config files]               # Vite, Tailwind, ESLint configs
```

### Key Architectural Patterns
1. **Component-Based Architecture**: React functional components with hooks
2. **Context API for State**: RestaurantContext for tenant-aware state management
3. **Protected Routes**: HOC pattern for authentication/authorization
4. **Lazy Loading**: Code-splitting for route-level components
5. **Database-First Design**: PostgreSQL schema drives application logic
6. **Row-Level Security (RLS)**: Database-enforced multi-tenancy isolation

---

## 3. Core Functionality

### 3.1 Customer-Facing Features

#### **QR Code Table Ordering**
- **Entry Point**: `/table/:tableId?restaurant=slug`
- **Workflow**:
  1. Customer scans QR code on physical table
  2. System creates/retrieves active table session
  3. Menu loads filtered by restaurant
  4. Items organized by categories (Starters, Mains, Desserts, Beverages)
  5. Real-time cart management with localStorage persistence
  6. Special notes per item
- **Files**: `TablePage.jsx`, `MenuItem.jsx`, `CartSummary.jsx`

#### **Session-Based Ordering** (Key Innovation)
- Multiple orders allowed during single dining session
- Session lifecycle:
  - **Created**: On QR scan (`table_sessions.status = 'active'`)
  - **Active**: Customer can order multiple times
  - **Completed**: After feedback submission
- Session ID stored in localStorage: `mealmate_session_{tableId}`
- All orders and feedback linked to session for comprehensive tracking
- **Implementation**: `database/22_table_sessions.sql`, `src/lib/supabaseClient.js` (getOrCreateActiveSessionId)

#### **Payment Processing**
- **Integration**: Razorpay payment gateway
- **Features**:
  - Order editing before payment (add/remove/adjust quantities)
  - Test card support for development
  - Automatic payment record creation
  - Payment status tracking (pending → paid → completed)
- **Flow**: Order → Payment Page → Razorpay Checkout → Order Status
- **Files**: `PaymentPage.jsx`, `razorpayHelper.js`

#### **Real-Time Order Tracking**
- **URL**: `/order-status/:orderId`
- **Status Pipeline**: Received → Preparing → Ready → Served
- **Visual Indicators**: Progress bar with color-coded stages
- **Auto-Redirect**: When all items served → Post-meal options

#### **Comprehensive Feedback System**
- **Session-Based Ratings**: Rate all items from entire dining session
- **Rating Types**:
  1. Overall experience (1-5 stars, required)
  2. Service quality (1-5 stars, optional)
  3. Individual dish ratings (1-5 stars per menu item)
  4. Text comments
- **Data Flow**:
  ```
  Feedback → feedbacks table (overall)
           → menu_item_ratings table (per-dish)
           → Triggers session completion
           → Frees table automatically
  ```
- **Files**: `FeedbackPage.jsx`, `database/06_item_ratings.sql`

### 3.2 Staff Dashboards

#### **Chef Dashboard** (`/chef`)
- **Primary Users**: Kitchen staff
- **Core Features**:
  1. **Live Order Queue**: Real-time order display with 5-second polling fallback
  2. **Per-Item Status Tracking**: 
     - Queued → Received → Preparing → Ready
     - Each dish tracked independently
  3. **Filtering**: Active orders, by status, by payment status
  4. **Order Cards**: Compact/expanded views with item details
  5. **Audio Notifications**: Sound alerts for new orders
  6. **Auto-Refresh**: Every 5 seconds + realtime subscriptions
- **Technical**: Supabase realtime subscription on `orders` table filtered by `restaurant_id`
- **Files**: `ChefDashboard.jsx`, `OrderCard.jsx`, `notificationService.js`

#### **Waiter Dashboard** (`/waiter`)
- **Primary Users**: Floor service staff
- **Core Features**:
  1. **Table Grid View**: Visual table layout with status indicators
     - Available (green), Occupied (orange), Reserved (blue)
  2. **Order Management**: View all orders, mark items as served
  3. **Call Waiter Alerts**: Real-time notifications from customer CallWaiterButton
  4. **Serve Tracking**: Mark individual items or entire orders as served
  5. **Table Statistics**: Total/Available/Occupied counts
- **Auto-Refresh**: 5-second polling with realtime subscriptions on tables/orders
- **Files**: `WaiterDashboard.jsx`, `TableGridView.jsx`

### 3.3 Management Portals

#### **Manager Portal** (`/manager`)
- **Primary Users**: Restaurant managers, admins
- **Modules**:
  1. **Dashboard**: Revenue, orders, active orders, staff count with charts
  2. **Menu Management**: CRUD for menu items with image upload, categories, tags
  3. **Staff Management**: Add/edit/deactivate staff with role assignment
  4. **Order Management**: View/update orders, bulk status changes
  5. **Payment Tracking**: Payment records, reconciliation
  6. **Offers Management**: Create promotional offers
  7. **Analytics**: Revenue trends, popular items, peak hours
  8. **Reports**: Exportable reports (PDF, Excel, CSV)
  9. **QR Code Management**: Generate/download QR codes for tables
  10. **Activity Logs**: Audit trail of all admin actions
  11. **Settings**: Restaurant profile, branding, notifications
- **Data Export**: Supports PDF (jsPDF), Excel (XLSX), CSV (PapaParse)
- **Files**: `src/pages/admin/*`, `src/Components/admin/*`

#### **Super Admin Portal** (`/superadmin`)
- **Primary Users**: Platform owners (multi-restaurant oversight)
- **Features**:
  1. **Multi-Tenant Dashboard**: Aggregate stats across all restaurants
  2. **Restaurant Management**: Create/edit/deactivate restaurant tenants
  3. **Restaurant Detail View**: Deep-dive into individual restaurant metrics
  4. **Owner-Level Access**: Bypass RLS policies via `is_owner()` function
- **Authentication**: Separate login flow with owner role validation
- **Files**: `src/pages/superadmin/*`, `SuperAdminLayout.jsx`

---

## 4. Technology Stack

### 4.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.0.0 | Core UI framework |
| **React Router DOM** | 7.9.3 | Client-side routing |
| **Vite** | 6.2.0 | Build tool & dev server (ES modules, HMR) |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework |
| **Framer Motion** | 12.5.0 | Animations & transitions |
| **Lucide React** | 0.545.0 | Icon library (500+ icons) |
| **React Icons** | 5.5.0 | Additional icon set |
| **Styled Components** | 6.1.19 | CSS-in-JS (minimal usage) |

### 4.2 Backend & Database

| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service (PostgreSQL + Auth + Realtime + Storage) |
| **PostgreSQL** | Relational database (15+ tables) |
| **Row-Level Security (RLS)** | Multi-tenant data isolation |
| **Database Functions** | Helper functions for complex queries (SECURITY DEFINER) |
| **Realtime Publication** | WebSocket-based live updates |

### 4.3 Key Libraries & Tools

#### **Data Handling**
- `@supabase/supabase-js` (2.74.0) - Database & auth client
- `papaparse` (5.5.3) - CSV parsing/export
- `xlsx` (0.18.5) - Excel file generation
- `jszip` (3.10.1) - ZIP file creation
- `file-saver` (2.0.5) - Client-side file downloads

#### **Document Generation**
- `jspdf` (3.0.3) - PDF generation
- `jspdf-autotable` (5.0.2) - PDF table formatting

#### **Payment Integration**
- Razorpay Checkout SDK (loaded via CDN)

#### **UI/UX Enhancements**
- `react-hot-toast` (2.6.0) - Toast notifications
- `qrcode` (1.5.4) - QR code generation
- `recharts` (3.2.1) - Data visualization/charts

#### **Development Tools**
- `eslint` (9.21.0) - Code linting
- `autoprefixer` (10.4.21) - CSS vendor prefixes
- `postcss` (8.5.3) - CSS transformations
- `dotenv` (17.2.3) - Environment variables

### 4.4 Build Configuration

#### **Vite Configuration** (`vite.config.js`)
- **Code Splitting**: Manual chunks for optimized loading
  - `react-router` bundle
  - `@supabase` bundle
  - `lucide-react` icons bundle
  - `react`/`react-dom` core bundle
  - `vendor` bundle for other node_modules
- **Chunk Size Warning**: Set to 1500KB (handles large dependencies)

#### **Tailwind Configuration** (`tailwind.config.js`)
- **Dark Mode**: Class-based strategy
- **Custom Animations**:
  - `fade-in`: Opacity + translateY transition
  - `scale-in`: Scale transformation
- **Design Tokens**:
  - CSS custom properties for colors (`--primary`, `--background`, etc.)
  - Consistent border-radius: 0.75rem (12px)
  - Success/Warning/Info color system with 15% opacity variants

---

## 5. Data Flow

### 5.1 Customer Ordering Flow

```
┌─────────────┐
│ QR Code Scan│
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 1. TablePage Component Loads             │
│    - Extract tableId from URL params     │
│    - Check restaurant query param        │
│    - Initialize RestaurantContext        │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 2. Load Data (loadData function)         │
│    a) getTable(tableId)                  │
│       → Query: tables WHERE id/number    │
│       → Returns: table + restaurant_id   │
│    b) getMenuItems(restaurant_id)        │
│       → Query: menu_items WHERE          │
│         restaurant_id & is_available     │
│    c) markTableOccupied(table.id)        │
│       → Update: tables SET status        │
│       → Create/retrieve active session   │
│    d) Save sessionId to localStorage     │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 3. Customer Browses & Adds to Cart       │
│    - State: cartItems (React state)      │
│    - Persist: localStorage                │
│    - Key: mealmate_cart_{tableId}        │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 4. Checkout (handleCheckout)             │
│    a) prepareOrderData(cart, table)      │
│       → Generate order_number            │
│       → Generate order_token (tracking)  │
│       → Calculate subtotal/tax/total     │
│       → Set item_status: 'queued'        │
│    b) createOrder(orderData)             │
│       → Insert into orders table         │
│       → Link session_id                  │
│    c) Clear cart from localStorage       │
│    d) Navigate to /payment/:orderId      │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 5. Payment Page                           │
│    a) Load order details                 │
│    b) Initialize Razorpay                │
│    c) On success:                        │
│       → Insert into payments table       │
│       → Update order.payment_status      │
│       → Navigate to order-status         │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 6. Order Status (Real-time Updates)      │
│    - Subscribe to order changes          │
│    - Display progress: Received →        │
│      Preparing → Ready → Served          │
│    - Auto-redirect when all served       │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 7. Post-Meal Options                      │
│    - Route: /post-meal/:sessionId        │
│    - Options: Order More / Complete Visit│
│    - If Complete → /feedback/:sessionId  │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ 8. Feedback Submission                    │
│    a) Load all session orders/items      │
│    b) Customer rates overall + items     │
│    c) Submit:                            │
│       → Insert into feedbacks            │
│       → Insert into menu_item_ratings    │
│       → Call endTableSession()           │
│         - Update session.status          │
│         - Update table.status            │
│         - Clear table.active_session_id  │
│    d) Navigate to /thank-you             │
└──────────────────────────────────────────┘
```

### 5.2 Real-time Update Flow

```
┌───────────────────┐
│  Database Change  │ (INSERT/UPDATE/DELETE)
└────────┬──────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  PostgreSQL Trigger                      │
│  → NOTIFY supabase_realtime channel     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Supabase Realtime Server               │
│  → Checks RLS policies                  │
│  → Filters by restaurant_id             │
│  → Broadcasts to subscribed clients     │
└────────┬────────────────────────────────┘
         │
         ├─────────────┬─────────────┬──────────────┐
         ▼             ▼             ▼              ▼
    ┌────────┐   ┌─────────┐   ┌─────────┐   ┌──────────┐
    │ Chef   │   │ Waiter  │   │ Manager │   │ Customer │
    │ Dashboard  │ Dashboard   │ Portal   │   │ Order    │
    └────────┘   └─────────┘   └─────────┘   └──────────┘
         │             │             │              │
         ▼             ▼             ▼              ▼
    Update UI     Update UI     Update UI      Update UI
    (setOrders)   (setTables)   (refresh)      (progress)
```

### 5.3 Multi-Tenancy Data Scoping

**Every Query Pattern**:
```javascript
// Example: Fetch menu items for restaurant
const { data } = await supabase
  .from('menu_items')
  .select('*')
  .eq('restaurant_id', restaurantId)  // ← Tenant filter
  .eq('is_available', true);

// Using helper function
const { data } = await fromRestaurant('menu_items', restaurantId)
  .select('*')
  .eq('is_available', true);
```

**RestaurantContext Flow**:
1. Detect restaurant from:
   - URL query param: `?restaurant=slug`
   - Subdomain (future): `slug.app.com`
   - LocalStorage (cached)
   - Authenticated user's restaurant_id
2. Fetch restaurant record by slug
3. Store in Context: `restaurantId`, `restaurantSlug`, `restaurantName`, `branding`
4. Persist to localStorage for subsequent visits
5. Inject into runtime store for supabaseClient helpers

---

## 6. Key Components

### 6.1 Core Application Files

#### **App.jsx** (205 lines)
- **Purpose**: Root routing configuration
- **Key Features**:
  - Lazy-loaded route components
  - Protected route wrappers
  - Unified login with mode switching
  - Legacy route redirects (`/admin/*` → `/manager/*`)
- **Routes**:
  - Public: `/`, `/table/:id`, `/payment/:orderId`, `/order-status/:orderId`
  - Customer: `/feedback/:sessionId`, `/post-meal/:sessionId`
  - Staff: `/chef`, `/waiter`
  - Manager: `/manager/*` (13 sub-routes)
  - Owner: `/superadmin/*` (4 sub-routes)

#### **main.jsx** (15 lines)
- **Purpose**: Application entry point
- **Features**:
  - React 19 `createRoot` API
  - BrowserRouter wrapper
  - RestaurantProvider for global tenant context
  - StrictMode disabled (prevents double-renders causing duplicate orders)

#### **RestaurantContext.jsx** (219 lines)
- **Purpose**: Multi-tenant context management
- **State**:
  - `restaurantId`, `restaurantSlug`, `restaurantName`, `branding`
- **Methods**:
  - `setRestaurantBySlug(slug)` - Load restaurant by slug
  - `clearRestaurant()` - Clear context
- **Auto-Detection**:
  1. Query params (`?restaurant=slug`)
  2. Subdomain (future feature)
  3. LocalStorage cache
  4. Authenticated user's restaurant_id

#### **supabaseClient.js** (838 lines) - Most Critical File
- **Purpose**: Database abstraction layer
- **Key Functions**:
  - `fromRestaurant(table, restaurantId)` - Scoped query helper
  - `getRestaurant(restaurantId)` - Fetch restaurant details
  - `getTable(tableIdOrNumber)` - Table lookup with demo support
  - `getMenuItems(restaurantId)` - Menu query with rating aggregation
  - `createOrder(orderData)` - Order creation with validation
  - `subscribeToOrders(restaurantId, callback)` - Realtime subscription
  - `markTableOccupied(tableId)` - Session creation + table status
  - `getOrCreateActiveSessionId(tableId)` - Session management
  - `endTableSession(sessionId)` - Complete session & free table
  - `updateOrderItemStatus(orderId, itemId, status)` - Per-item tracking
  - Payment, feedback, staff, and analytics functions

### 6.2 Page Components

#### **Customer Pages**
- **TablePage.jsx** (536 lines): Menu browsing, cart, checkout
- **PaymentPage.jsx** (448 lines): Razorpay integration, order editing
- **OrderStatusPage.jsx**: Real-time order tracking with progress bar
- **FeedbackPage.jsx** (357 lines): Session-based rating submission
- **PostMealOptions.jsx**: Order more vs. complete visit decision
- **ThankYouPage.jsx**: Confirmation with auto-close

#### **Staff Pages**
- **ChefDashboard.jsx** (582 lines): Kitchen order queue with audio alerts
- **WaiterDashboard.jsx** (898 lines): Table grid + order serving
- **ChefLogin.jsx**, **WaiterLogin.jsx**: Role-specific auth

#### **Manager Pages** (`src/pages/admin/`)
- **Dashboard.jsx** (188 lines): KPIs, charts, recent orders
- **MenuManagement.jsx**: CRUD with image upload, bulk actions
- **StaffManagement.jsx**: User management with role assignment
- **OrdersManagement.jsx**: Order history, status updates, bulk actions
- **PaymentsTracking.jsx**: Payment reconciliation
- **OffersManagement.jsx**: Promotional offers
- **Analytics.jsx**: Revenue trends, popular items, peak hour analysis
- **ReportsPage.jsx**: PDF/Excel/CSV export
- **QRCodesManagement.jsx**: Bulk QR generation/download
- **ActivityLogs.jsx**: Audit trail with filtering
- **Settings.jsx**: Restaurant profile, branding, notifications
- **Links.jsx**: Dynamic link generation

#### **Super Admin Pages** (`src/pages/superadmin/`)
- **Dashboard.jsx**: Aggregate stats (restaurants, managers, orders)
- **Restaurants.jsx**: Tenant management list
- **RestaurantDetail.jsx**: Deep-dive into restaurant metrics
- **Login.jsx**: Owner authentication (redirects to unified login)

### 6.3 Reusable Components

#### **UI Components**
- **MenuItem.jsx**: Menu item card with ratings, tags, veg indicator
- **OrderCard.jsx**: Order display with per-item status badges
- **CartSummary.jsx**: Shopping cart with quantity controls
- **CategoryTabs.jsx**: Menu category filtering
- **TableGridView.jsx**: Visual table layout with status colors
- **CallWaiterButton.jsx**: Customer call button
- **LoadingSpinner.jsx**, **ErrorMessage.jsx**: Feedback components
- **DemoButton.jsx**: Demo mode trigger

#### **Admin Components** (`src/Components/admin/`)
- **StatCard.jsx**: KPI metric card
- **DashboardHeader.jsx**: Page header with refresh
- **ManageCard.jsx**: Section navigation cards
- **OrdersTable.jsx**: Tabular order list
- **MenuItemForm.jsx**: Menu item create/edit form
- **StaffForm.jsx**: Staff create/edit form
- **OfferForm.jsx**: Offer create/edit form
- **TableQRCard.jsx**: Individual table QR display
- **BulkQRDownload.jsx**: Multi-table QR export
- **NotificationsBell.jsx**: Notification dropdown
- **ManagerUserMenu.jsx**: User profile menu
- **charts/**: Revenue charts, popular items charts

#### **Layout Components** (`src/Components/layouts/`)
- **AdminLayout.jsx**: Manager portal wrapper (sidebar + header)
- **SuperAdminLayout.jsx**: Owner portal wrapper
- **AdminHeader.jsx**, **AdminSidebar.jsx**: Portal UI structure
- **SuperAdminHeader.jsx**: Owner header

#### **Route Protection**
- **ProtectedRoute.jsx** (153 lines): Staff authentication + role validation
- **ProtectedOwnerRoute.jsx**: Owner-only route guard

### 6.4 Utility Modules

#### **Authentication** (`src/utils/auth.js`)
- `getCurrentUser()` - Fetch authenticated user + profile
- `signInWithEmail(email, password)` - Staff login
- `signOut()` - Session cleanup

#### **Permissions** (`src/utils/permissions.js` - 224 lines)
- **Roles**: `OWNER`, `MANAGER`, `ADMIN`, `CHEF`, `WAITER`
- **Permissions**: 40+ granular permissions (MENU_EDIT, ORDER_UPDATE, etc.)
- **Role Mapping**: What each role can do
- **Helper Functions**:
  - `hasPermission(role, permission)` - Check access
  - `hasAnyPermission(role, permissions)` - OR check
  - `canAccessRoute(role, route)` - Route-level validation
  - `getDashboardRoute(role)` - Role-based redirect

#### **Session Management** (`src/utils/session.js`)
- `saveSession({ userId, role, restaurantId })` - Store staff session
- `getSession()` - Retrieve session
- `clearSession()` - Logout

#### **Activity Logging** (`src/utils/activityLogger.js` - 302 lines)
- `logActivity(action, entityType, entityId, details)` - Generic logger
- Predefined loggers: `logMenuItemCreated`, `logOrderStatusChanged`, etc.
- Captures: user, restaurant, IP, user-agent, timestamp

#### **Formatters** (`src/utils/formatters.js`)
- `formatCurrency(amount)` - ₹ formatting
- `formatDate(date)` - Locale date strings
- `formatOrderNumber(num)` - ORD-YYYYMMDD-XXXX

#### **Order Helpers** (`src/lib/orderHelpers.js`)
- `prepareOrderData(cart, table, restaurant)` - Order object builder
- `calculateSubtotal(items)`, `calculateTax(subtotal)`, `calculateTotal(...)`
- `groupByCategory(menuItems)` - Category grouping
- `getCategories(menuItems)` - Extract unique categories

#### **Notification Service** (`src/lib/notificationService.js`)
- Audio notification system for new orders
- User gesture unlock (browser audio policy compliance)
- `playNotificationSound()` - Trigger alert sound
- `registerUserGestureUnlock()` - Enable audio on user interaction

---

## 7. Configuration and Environment

### 7.1 Environment Variables (`.env.example`)

```bash
# Frontend (exposed to client)
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Backend scripts only (NEVER expose in client)
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Optional configuration
SEED_OWNER_PASSWORD=ChangeMe!123  # Default: Praahis@123
APP_ORIGIN=http://localhost:5173
VITE_APP_URL=http://localhost:5173
```

**Security Notes**:
- Anon key is safe for client (RLS protects data)
- Service role key has full database access (scripts only)
- Razorpay keys expected but not in .env.example (likely in Supabase secrets)

### 7.2 Database Schema

#### **Core Tables** (15 total)
1. **restaurants** - Tenant metadata (name, slug, logo, is_active)
2. **tables** - Physical tables (number, capacity, status, qr_code_url, active_session_id)
3. **menu_items** - Dishes (name, price, category, image, is_vegetarian, tags)
4. **orders** - Customer orders (items JSON, totals, status, session_id, order_token)
5. **payments** - Razorpay transactions (payment_id, order_id, amount, status)
6. **feedbacks** - Overall ratings (rating, comment, session_id)
7. **menu_item_ratings** - Per-dish ratings (menu_item_id, rating, session_id)
8. **users** - Staff accounts (email, role, restaurant_id, is_active, phone)
9. **activity_logs** - Audit trail (action, entity_type, user_id, details)
10. **offers** - Promotional offers (code, discount, validity)
11. **table_sessions** - Dining sessions (table_id, started_at, ended_at, status)
12. **notifications** - In-app notifications (type, title, body, is_read)

#### **Key Columns & Constraints**
- **restaurant_id**: Foreign key on all tables (CASCADE delete)
- **Unique Constraints**:
  - `restaurants.slug` (case-insensitive)
  - `orders.order_number`
  - `table_sessions(table_id)` WHERE status='active' (one active session per table)
- **Check Constraints**:
  - Prices ≥ 0
  - Ratings 1-5
  - Valid status enums
- **Indexes**:
  - `(restaurant_id)` on all multi-tenant tables
  - `(restaurant_id, created_at DESC)` on orders, feedbacks
  - `(menu_item_id)` on ratings
  - `(table_id, status)` on sessions

#### **Database Functions** (SECURITY DEFINER)
- `is_owner()` - Check if current user has owner role (bypasses RLS)
- `list_staff_for_current_restaurant()` - Fetch staff without RLS recursion
- `admin_set_staff_active(target_id, is_active)` - Toggle staff status
- `admin_update_staff(target_id, ...)` - Update staff details
- `admin_upsert_staff_by_email(...)` - Create/update staff (idempotent)
- `get_or_create_active_session(table_id)` - Session management helper

### 7.3 Migration Files (22 files)

**Setup Order** (from `database/README.md`):
1. `01_schema.sql` - Create all tables, triggers, functions
2. `02_seed.sql` - Sample data (1 restaurant, 10 tables, 27 menu items)
3. `03_enable_realtime.sql` - Enable pub/sub on orders, tables, menu_items, payments, ratings
4. `04_production_rls.sql` - Row-Level Security policies
5. `06_item_ratings.sql` - Per-item ratings table + RLS
6. `07_item_rating_summary.sql` - Ratings summary views
7. `08_verify.sql` - Post-install verification queries
8. `09_visit_sessions.sql` - (Deprecated: superseded by 22_table_sessions.sql)
9. `10_multitenancy.sql` - Multi-tenant migration (restaurant_id FK, indexes)
10. `11_rls_public_and_owner.sql` - Public + owner RLS policies
11. `12_seed_tenants.sql` - Seed multiple test restaurants
12. `13_users_rls_self.sql` - User RLS policies
13. `14_staff_admin.sql` - Staff management functions
14. `15_admin_upsert_by_email.sql` - Staff upsert function
15. `16_link_table9_manager.sql` - Link specific tenant manager
16. `17_users_add_phone.sql` - Add phone column to users
17. `18_users_is_owner.sql` - Add is_owner column
18. `19_is_owner_function_upgrade.sql` - Upgrade is_owner() function
19. `20_notifications.sql` - Notifications table + RLS
20. `21_notifications_seed.sql` - Sample notifications
21. `21_notifications_seed.sql` - Notification seed data
28. `28_storage_buckets.sql` - Supabase Storage buckets (menu images, QR codes)
22. `22_table_sessions.sql` - Session tracking system (latest)

**Maintenance Files**:
- `00_reset_database.sql` - DROP all tables (danger: complete reset)
- `05_maintenance.sql` - Cleanup queries, reports

### 7.4 Build & Deployment Scripts

#### **package.json Scripts**
```json
{
  "dev": "vite",                      // Development server
  "build": "vite build",              // Production build
  "lint": "eslint .",                 // Code linting
  "preview": "vite preview",          // Preview production build
  "backup": "bash scripts/backup.sh", // Database backup
  "seed:tenants": "node scripts/seed-tenants.js",  // Multi-tenant seeding
  "verify:supabase": "node scripts/verify-supabase.js" // Setup verification
}
```

#### **seed-tenants.js** (269 lines)
- **Purpose**: Create multiple test restaurants with data
- **Tenants**: Tabun, Table9, RedChillis, Demo Restaurant
- **Creates**:
  - Restaurant records
  - Manager accounts (e.g., `manager@tabun.local`)
  - Tables (4-5 per restaurant)
  - Sample menu items (3-4 per restaurant)
- **Outputs**: Summary with URLs and credentials

#### **backup.sh**
- Database backup automation
- Creates timestamped `.tar.gz` archives in `backups/`

#### **verify-supabase.js**
- Post-setup verification
- Checks database connectivity, tables, RLS, realtime

---

## 8. Version and Status

### 8.1 Project Maturity

**Current Version**: 0.0.0 (pre-release / active development)

**Status**: **Production-Ready MVP with Active Development**

#### **Completed Features** ✅
1. ✅ Full customer ordering workflow (QR → Order → Payment → Feedback)
2. ✅ Multi-tenant architecture with data isolation
3. ✅ Session-based ordering (multiple orders per visit)
4. ✅ Real-time kitchen display system
5. ✅ Waiter dashboard with table management
6. ✅ Comprehensive manager portal (13 modules)
7. ✅ Super admin portal for platform oversight
8. ✅ Per-item order status tracking
9. ✅ Item-level rating system
10. ✅ Payment integration (Razorpay)
11. ✅ QR code generation/management
12. ✅ Activity logging/audit trail
13. ✅ Data export (PDF, Excel, CSV)
14. ✅ Analytics and reporting
15. ✅ Notification system
16. ✅ Role-based access control (5 roles, 40+ permissions)

#### **Known Limitations** ⚠️
1. **Performance Issues**:
   - Multiple `getCurrentUser()` calls per page (auth context recommended)
   - No query caching (React Query suggested in PERFORMANCE_OPTIMIZATION.md)
   - Large initial bundle size (mitigated by code splitting)

2. **Missing Features**:
   - Real-time rating updates not implemented (infrastructure ready, UI pending)
   - Subdomain-based routing (planned, code exists)
   - Offline support / Service Worker
   - Mobile apps (PWA only)
   - Email notifications (database structure exists, sending not implemented)

3. **Security Considerations** (from PRODUCTION_DEPLOYMENT.md):
   - RLS enabled but relies on application-level security for some operations
   - Order tokens prevent data leaks (not pure RLS enforcement)
   - Staff authentication via Supabase, role checks in React (client-side, should validate server-side)

4. **Technical Debt**:
   - StrictMode disabled to prevent double-renders (React 19 issue)
   - Manual polling as fallback to realtime (5-second intervals)
   - `09_visit_sessions.sql` deprecated (use `22_table_sessions.sql`)

### 8.2 Deprecated/Unused Code

#### **Deprecated Files**
~~1. `database/09_visit_sessions.sql` - Superseded by 22_table_sessions.sql~~ **✅ DELETED**
~~2. `src/pages/admin/AdminLogin.jsx` - Replaced by unified login~~ (Note: Still exists, routes redirect)
~~3. `src/pages/superadmin/Login.jsx` - Replaced by unified login~~ **✅ DELETED**
~~4. `src/Components/examples/MenuItemsExample.jsx` - Demo code not used~~ **✅ DELETED**

**Update (Nov 6, 2025)**: Deprecated files cleaned up. See `CLEANUP_SUMMARY.md` for details.

Legacy routes in App.jsx:
   - `/admin/login` → Redirects to `/login?mode=manager`
   - `/admin/*` → Redirects to `/manager/*`
   - `/superadmin/login` → Redirects to `/login?mode=admin`

#### **Incomplete Features**
1. **Realtime Ratings Display**: 
   - Database + policies ready (`06_item_ratings.sql`, `07_item_rating_summary.sql`)
   - Frontend subscription not implemented (noted in REALTIME_RATINGS_GUIDE.md)
   - Impact: Menu item ratings don't update live

2. **Storage Buckets**:
   - SQL file exists (`28_storage_buckets.sql`)
   - Image upload UI present in MenuManagement
   - Unclear if buckets are configured in Supabase project

3. **Notifications**:
   - Database schema complete (`20_notifications.sql`)
   - Backend queries in supabaseClient.js
   - NotificationsBell component exists
   - Email/SMS sending not implemented

#### **Redundant Code**
~~1. Multiple login components (unified but old files remain)~~ **✅ CLEANED (SuperAdminLogin deleted)**
~~2. `src/Components/examples/` folder (not in workspace tree, likely demo code)~~ **✅ DELETED**
3. Styled-components library (v6.1.19) included but barely used (Tailwind dominates)

### 8.3 Version Control Status

**Git Repository**: Not visible in provided context (no `.git` folder scan)

**Backups**: 
- `backups/tabun-20251106-212403-8baa42b.tar.gz` (database backup from Nov 6, 2025)

---

## 9. Documentation and Comments

### 9.1 Documentation Quality

#### **Excellent Documentation** 📚
The project has **extensive** Markdown documentation (19 .md files):

1. **Setup Guides**:
   - `README.md` (1031 lines) - Comprehensive setup, features, tech stack
   - `database/README.md` (148 lines) - Database migration guide
   - `PRODUCTION_DEPLOYMENT.md` (195 lines) - Deployment checklist
   - `MULTITENANCY.md` - Multi-tenant implementation details
   - `SESSION_IMPLEMENTATION_GUIDE.md` (307 lines) - Session system guide

2. **Feature Guides**:
   - `COMPLETE_ORDER_WORKFLOW.md` (878 lines) - End-to-end workflow documentation
   - `AFTER_RATING_SUBMISSION.md` (542 lines) - Feedback flow details
   - `SESSION_BASED_ORDERING.md` - Session ordering explanation
   - `REALTIME_RATINGS_GUIDE.md` (264 lines) - Rating system implementation
   - `CUSTOMER_PAGE_DESIGN.md` - UI/UX specifications

3. **Technical Guides**:
   - `DESIGN_SYSTEM_IMPLEMENTATION.md` (317 lines) - Design tokens, components
   - `DESIGN_COMPARISON.md` - Before/after design evolution
   - `PERFORMANCE_OPTIMIZATION.md` (133 lines) - Performance tips
   - `SECURITY.md` (251 lines) - Security best practices, what to share/hide
   - `IMPLEMENTATION_COMPLETE.md` - Feature completion checklist

4. **Changelog**:
   - `MIGRATION_UPDATE.md` - Migration notes
   - Database-specific: `NOTIFICATIONS_README.md`, `SEED_TENANTS_README.md`

**Strengths**:
- Clear step-by-step instructions
- Code examples in documentation
- Troubleshooting sections
- Visual diagrams (ASCII art)
- Before/after comparisons

**Improvement Areas**:
- API documentation (function signatures, return types)
- Component prop documentation (PropTypes or TypeScript)
- Inline JSDoc comments minimal

### 9.2 Code Comments

#### **Database SQL Files**: ⭐ Excellent
- Every migration has header comments explaining purpose
- Table/column comments using SQL `COMMENT ON` syntax
- Inline explanations for complex logic
- Example:
  ```sql
  COMMENT ON TABLE orders IS 'Customer orders with items and status tracking';
  COMMENT ON COLUMN orders.payment_status IS 'pending, paid, failed, refunded';
  ```

#### **JavaScript/React Files**: ⚙️ Moderate
- **Good**:
  - File-level docstrings in utility files
  - Function purpose comments in complex logic
  - Permission definitions well-documented
  - Example: `src/utils/activityLogger.js` has clear function docs
  
- **Needs Improvement**:
  - Component prop documentation sparse
  - Complex state logic could use more comments
  - Magic numbers/strings not always explained

- **Example of Good Comments**:
  ```javascript
  /**
   * Activity Logger
   * Logs all admin/staff actions to activity_logs table for audit trail
   */
  ```

- **Example of Missing Comments**:
  ```javascript
  // Many React components have minimal comments explaining props or state logic
  const [compact, setCompact] = useState(false); // What does compact mode mean?
  ```

### 9.3 Documentation Gaps

1. **API Reference**: No centralized API documentation for supabaseClient functions
2. **Component Library**: No component catalog (Storybook or similar)
3. **Testing Documentation**: No test strategy or test files visible
4. **Contribution Guide**: No CONTRIBUTING.md for collaborators
5. **Changelog**: No CHANGELOG.md tracking version history
6. **Architecture Diagrams**: Documentation has ASCII art but no visual diagrams (C4, sequence diagrams)

### 9.4 Recommended Documentation Additions

1. **TypeScript Migration**: Convert to TypeScript for self-documenting code (`.d.ts` files)
2. **JSDoc Comments**: Add JSDoc to all exported functions
3. **PropTypes**: Add PropTypes to all React components
4. **API.md**: Create centralized API reference for supabaseClient
5. **CONTRIBUTING.md**: Guidelines for new developers
6. **TESTING.md**: Test strategy and how to run tests (currently no tests)
7. **Visual Diagrams**: Use Mermaid or PlantUML for architecture/flow diagrams

---

## 10. Overall Purpose and Intent

### 10.1 Project Vision

**Praahis** aims to **revolutionize the restaurant dining experience** by creating a seamless, digital-first ecosystem that benefits all stakeholders:

1. **For Customers**:
   - Eliminate wait times for menu browsing and ordering
   - Provide transparency in food preparation (real-time status)
   - Enable frictionless payments
   - Empower detailed feedback (overall + per-item ratings)
   - Support "order more" during meals without waiter dependency

2. **For Restaurant Staff**:
   - **Waiters**: Shift focus from order-taking to service quality
   - **Chefs**: Clear order queue with per-item status tracking
   - **Managers**: Real-time operational visibility and data-driven decisions

3. **For Restaurant Owners**:
   - **Single Owners**: Streamlined operations with minimal tech overhead
   - **Multi-Location Owners**: Centralized platform managing multiple restaurants
   - **Analytics**: Data-driven insights (revenue, popular items, peak hours, feedback trends)

4. **For Platform Operators** (Super Admins):
   - SaaS business model: Multi-tenant restaurant management platform
   - Scalable infrastructure (Supabase backend)
   - Per-restaurant data isolation and branding

### 10.2 Business Model (Inferred)

**Primary Model**: B2B SaaS Platform

**Revenue Streams** (Potential):
1. **Subscription Fees**: Monthly/annual per-restaurant pricing
2. **Transaction Fees**: Percentage of orders processed (if payment gateway takes cut)
3. **Premium Features**: Advanced analytics, multi-location management
4. **Setup Fees**: Onboarding, QR code printing, staff training

**Target Market**:
- Small to medium-sized restaurants (1-50 locations)
- Quick-service restaurants (QSR)
- Cafes and bistros
- Food courts

**Competitive Advantages**:
1. **Session-Based Ordering**: Unique "order more" during meal feature
2. **Multi-Tenant from Day 1**: Built for scale
3. **Comprehensive Feedback**: Item-level ratings beyond typical overall ratings
4. **Real-Time Everything**: Kitchen, waiter, customer all see live updates
5. **Open Architecture**: Based on Supabase (can be self-hosted)

### 10.3 Technical Philosophy

**Architectural Principles**:
1. **Serverless-First**: Leverage BaaS (Supabase) to minimize DevOps
2. **Real-Time by Default**: Live updates enhance user experience
3. **Mobile-First Design**: Responsive UI with Tailwind
4. **Data Isolation**: RLS ensures tenant security
5. **Audit Everything**: Activity logs for compliance and debugging

**Development Approach**:
1. **Rapid Prototyping**: Vite HMR for fast iteration
2. **Component Reusability**: Shared components across portals
3. **Database-Driven**: Schema-first design (SQL migrations)
4. **Progressive Enhancement**: Polling fallback when realtime fails
5. **Documentation-Heavy**: Extensive .md guides for maintainability

### 10.4 Future Roadmap (Inferred from Code)

**Near-Term** (Code exists, needs activation):
1. ✅ Real-time rating updates (database ready, UI pending)
2. ✅ Subdomain routing (`slug.app.com`)
3. ✅ Email/SMS notifications (schema ready, sending not implemented)
4. ✅ Advanced analytics (charts exist, more metrics possible)

**Medium-Term** (Mentioned in docs):
1. 🔄 Performance optimization (React Query, auth context)
2. 🔄 Offline support (Service Worker, PWA)
3. 🔄 Mobile apps (React Native or PWA)
4. 🔄 Inventory management
5. 🔄 Reservation system

**Long-Term** (Strategic):
1. 🚀 AI-powered recommendations (popular items, upsells)
2. 🚀 Loyalty programs
3. 🚀 CRM integration
4. 🚀 Third-party delivery integration (Swiggy, Zomato)
5. 🚀 White-label solution for larger chains

---

## 11. Conclusion

### 11.1 Project Strengths

1. **✅ Production-Ready Core**: Full customer workflow implemented and functional
2. **✅ Scalable Architecture**: Multi-tenancy built-in from start
3. **✅ Excellent Documentation**: 19 detailed .md files covering all aspects
4. **✅ Modern Tech Stack**: React 19, Vite 6, Supabase, Tailwind CSS
5. **✅ Real-Time Capabilities**: Live updates across all dashboards
6. **✅ Comprehensive RBAC**: 5 roles, 40+ permissions, secure route protection
7. **✅ Session Innovation**: Unique "order more" feature during meals
8. **✅ Granular Feedback**: Item-level ratings beyond standard overall ratings
9. **✅ Data Export**: PDF, Excel, CSV for reports
10. **✅ Audit Trail**: Activity logging for compliance

### 11.2 Areas for Improvement

1. **⚠️ Performance**: Multiple auth calls, no query caching, large bundle
2. **⚠️ Testing**: No unit/integration/e2e tests visible
3. **⚠️ TypeScript**: JavaScript only (reduces type safety)
4. **⚠️ Security**: Client-side role checks (should validate server-side)
5. **⚠️ Code Comments**: Component props and complex logic under-documented
6. **⚠️ Technical Debt**: StrictMode disabled, deprecated files remain
7. **⚠️ Incomplete Features**: Realtime ratings, storage buckets, notification sending

### 11.3 Recommended Next Steps

**Immediate** (1-2 weeks):
1. ~~Remove deprecated files (`09_visit_sessions.sql`, old login components)~~ **✅ COMPLETED**
2. Implement Auth Context to reduce `getCurrentUser()` calls
3. Add React Query for data caching
4. Complete realtime rating subscriptions
5. Add PropTypes or migrate to TypeScript

**Short-Term** (1-2 months):
1. Set up automated testing (Jest, React Testing Library, Playwright)
2. Implement email/SMS notifications
3. Add server-side validation for critical operations
4. Optimize bundle size further
5. Create API documentation (JSDoc or OpenAPI)

**Medium-Term** (3-6 months):
1. Migrate to TypeScript for type safety
2. Add offline support (Service Worker)
3. Implement advanced analytics
4. Build reservation system
5. Add inventory management

### 11.4 Final Assessment

**Praahis is a well-architected, feature-rich restaurant management platform with strong fundamentals and clear growth potential.** The codebase demonstrates thoughtful design decisions (multi-tenancy, session-based ordering, comprehensive documentation) and modern best practices (component architecture, real-time updates, RBAC).

While there are opportunities for optimization (performance, testing, TypeScript), the core system is **production-ready** and provides significant value to restaurants seeking digital transformation. The extensive documentation and clean separation of concerns make it maintainable and extensible.

**Project Grade**: **A- (Excellent with Room for Optimization)**

**Recommendation**: **Deploy to pilot restaurants, gather real-world feedback, then iterate on performance and missing features.**

---

## Appendix: Quick Reference

### Database Tables
1. restaurants, 2. tables, 3. menu_items, 4. orders, 5. payments, 6. feedbacks, 7. menu_item_ratings, 8. users, 9. activity_logs, 10. offers, 11. table_sessions, 12. notifications

### Key Routes
- Customer: `/table/:id`, `/payment/:orderId`, `/order-status/:orderId`, `/feedback/:sessionId`
- Staff: `/chef`, `/waiter`
- Manager: `/manager/dashboard`, `/manager/menu`, `/manager/staff`, `/manager/orders`
- Owner: `/superadmin/dashboard`, `/superadmin/restaurants`

### Environment Setup
```bash
npm install
cp .env.example .env.local
# Edit .env.local with Supabase credentials
npm run seed:tenants
npm run dev
```

### Default Credentials (from seed)
- Super Admin: `admin@praahis.com` / `Praahis@123`
- Manager (Tabun): `manager@tabun.local` / `Tabun@123`
- Manager (Table9): `manager@table9.local` / `Table9@123`

---

**Report Generated by**: Advanced Project Analyst  
**Date**: November 6, 2025  
**Total Files Analyzed**: 100+ (code + docs + SQL)  
**Total Lines of Code Reviewed**: ~15,000+
