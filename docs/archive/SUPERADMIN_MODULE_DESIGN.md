# Super Admin (Platform Owner) Module - Complete Design Specification

**Praahis Restaurant Management System**  
**Version:** 1.0  
**Date:** November 6, 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Design](#database-design)
4. [Folder Structure](#folder-structure)
5. [Component Architecture](#component-architecture)
6. [Page Specifications](#page-specifications)
7. [UI/UX Design](#uiux-design)
8. [Security & Access Control](#security--access-control)
9. [API Integration](#api-integration)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

### Purpose
The Super Admin module enables the platform owner to manage multi-tenant restaurant operations, monitor system-wide analytics, configure global settings, and handle subscriptions and billing.

### Key Features
- **Multi-tenant Management**: CRUD operations for restaurants
- **User Management**: Manage managers, staff across all restaurants
- **System Analytics**: Platform-wide KPIs, revenue, and usage metrics
- **Subscription & Billing**: Manage restaurant subscriptions, payment tracking
- **System Settings**: Configure API keys, payment gateways, global offers
- **Activity Monitoring**: Audit logs, system health, real-time monitoring
- **Data Management**: Backups, exports, tenant reports

### Technology Stack
- **Frontend**: React, React Router, Tailwind CSS, Framer Motion
- **Charts**: Recharts
- **Backend**: Supabase (PostgreSQL + RLS)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

---

## System Architecture

### Access Control Flow

```
Login (is_owner check) → Super Admin Portal
                            ↓
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
        Dashboard    Restaurants      System Settings
            ↓               ↓               ↓
      Analytics      Managers      Activity Logs
            ↓               ↓               ↓
     Subscriptions   Staff      Backups & Reports
```

### Authentication & Authorization

1. **Owner Detection**: `users.is_owner = true` OR `users.role = 'owner'`
2. **RLS Bypass**: Uses `is_owner()` function to bypass restaurant-scoped RLS
3. **Session Management**: Separate from restaurant admin sessions
4. **Route Protection**: `ProtectedOwnerRoute` wrapper component

---

## Database Design

### New Tables Required

#### 1. **subscriptions**
Tracks restaurant subscription plans and billing

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,                    -- 'basic', 'pro', 'enterprise'
    status VARCHAR(50) DEFAULT 'active',                -- 'active', 'inactive', 'trial', 'cancelled'
    billing_cycle VARCHAR(20) DEFAULT 'monthly',        -- 'monthly', 'yearly'
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE subscriptions IS 'Restaurant subscription plans and billing';
CREATE INDEX idx_subscriptions_restaurant ON subscriptions(restaurant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### 2. **platform_settings**
Global platform configuration

```sql
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    category VARCHAR(100),                              -- 'payment', 'email', 'storage', 'api'
    is_encrypted BOOLEAN DEFAULT false,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE platform_settings IS 'Platform-wide configuration settings';
CREATE INDEX idx_platform_settings_category ON platform_settings(category);
```

#### 3. **system_logs**
Platform-wide system events and errors

```sql
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL,                         -- 'info', 'warning', 'error', 'critical'
    source VARCHAR(100),                                -- 'api', 'database', 'payment', 'auth'
    message TEXT NOT NULL,
    details JSONB,
    restaurant_id UUID REFERENCES restaurants(id),      -- Optional: if log is restaurant-specific
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE system_logs IS 'System-wide logging and monitoring';
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_restaurant ON system_logs(restaurant_id);
```

#### 4. **audit_trail**
Enhanced audit logging for super admin actions

```sql
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,                       -- 'restaurant_created', 'subscription_updated', etc.
    entity_type VARCHAR(50),                            -- 'restaurant', 'subscription', 'settings'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE audit_trail IS 'Audit trail for super admin actions';
CREATE INDEX idx_audit_trail_actor ON audit_trail(actor_id);
CREATE INDEX idx_audit_trail_created ON audit_trail(created_at DESC);
CREATE INDEX idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
```

#### 5. **backups**
Track database backup operations

```sql
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type VARCHAR(50) NOT NULL,                   -- 'full', 'incremental', 'restaurant'
    restaurant_id UUID REFERENCES restaurants(id),      -- NULL for full backups
    file_path TEXT,
    file_size BIGINT,                                   -- Size in bytes
    status VARCHAR(50) DEFAULT 'in_progress',           -- 'in_progress', 'completed', 'failed'
    initiated_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE backups IS 'Database backup tracking';
CREATE INDEX idx_backups_created ON backups(created_at DESC);
CREATE INDEX idx_backups_restaurant ON backups(restaurant_id);
```

### Enhanced Existing Tables

#### Extend **restaurants** table

```sql
-- Add super admin specific fields
ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
    ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS max_tables INTEGER DEFAULT 20,
    ADD COLUMN IF NOT EXISTS max_menu_items INTEGER DEFAULT 100,
    ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',              -- Feature flags
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';              -- Additional data
```

### RLS Policies for New Tables

```sql
-- Super admin can access everything via is_owner() bypass
-- These policies ensure security for regular users

-- Subscriptions: Read-only for restaurant managers
CREATE POLICY "Managers can view own subscription" ON subscriptions
    FOR SELECT USING (restaurant_id IN (
        SELECT restaurant_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Owners have full access to subscriptions" ON subscriptions
    USING (public.is_owner());

-- Platform Settings: Owner-only access
CREATE POLICY "Only owners can manage platform settings" ON platform_settings
    USING (public.is_owner());

-- System Logs: Owner-only access
CREATE POLICY "Only owners can view system logs" ON system_logs
    FOR SELECT USING (public.is_owner());

-- Audit Trail: Owner-only access
CREATE POLICY "Only owners can view audit trail" ON audit_trail
    FOR SELECT USING (public.is_owner());

-- Backups: Owner-only access
CREATE POLICY "Only owners can manage backups" ON backups
    USING (public.is_owner());
```

---

## Folder Structure

```
src/
├── pages/
│   └── superadmin/
│       ├── Dashboard.jsx                    # Platform overview & KPIs
│       ├── Restaurants.jsx                  # Restaurant list & CRUD (enhanced)
│       ├── RestaurantDetail.jsx             # Single restaurant deep dive (enhanced)
│       ├── Managers.jsx                     # All managers across restaurants
│       ├── ManagerDetail.jsx                # Individual manager profile
│       ├── Staff.jsx                        # All staff across restaurants
│       ├── Subscriptions.jsx                # Subscription management
│       ├── SubscriptionDetail.jsx           # Individual subscription details
│       ├── SystemSettings.jsx               # Platform configuration
│       ├── ActivityLogs.jsx                 # Audit trail & activity
│       ├── SystemLogs.jsx                   # System errors & monitoring
│       ├── Backups.jsx                      # Backup management
│       ├── Reports.jsx                      # Platform-wide reports
│       └── Analytics.jsx                    # Advanced analytics
│
├── Components/
│   └── superadmin/
│       ├── layouts/
│       │   ├── SuperAdminLayout.jsx         # Main layout wrapper (exists)
│       │   └── SuperAdminHeader.jsx         # Top navigation (exists)
│       │
│       ├── dashboard/
│       │   ├── PlatformKPIs.jsx             # Key metrics cards
│       │   ├── RevenueOverview.jsx          # Revenue chart
│       │   ├── RestaurantActivity.jsx       # Recent restaurant activity
│       │   ├── SubscriptionBreakdown.jsx    # Subscription pie chart
│       │   └── QuickActions.jsx             # Quick action buttons
│       │
│       ├── restaurants/
│       │   ├── RestaurantCard.jsx           # Restaurant grid item
│       │   ├── RestaurantTable.jsx          # Restaurant table view
│       │   ├── RestaurantForm.jsx           # Create/Edit form
│       │   ├── RestaurantStats.jsx          # Individual stats
│       │   └── FeatureToggles.jsx           # Feature flag management
│       │
│       ├── users/
│       │   ├── ManagerCard.jsx              # Manager profile card
│       │   ├── ManagerTable.jsx             # Manager list table
│       │   ├── StaffTable.jsx               # Staff list table
│       │   └── UserQuickView.jsx            # User details modal
│       │
│       ├── subscriptions/
│       │   ├── SubscriptionCard.jsx         # Subscription overview card
│       │   ├── PlanSelector.jsx             # Plan selection UI
│       │   ├── BillingHistory.jsx           # Payment history
│       │   └── UsageMetrics.jsx             # Resource usage gauges
│       │
│       ├── settings/
│       │   ├── SettingGroup.jsx             # Settings category group
│       │   ├── PaymentGatewayConfig.jsx     # Razorpay settings
│       │   ├── EmailConfig.jsx              # Email service settings
│       │   ├── StorageConfig.jsx            # Supabase storage settings
│       │   └── APIKeyManager.jsx            # API key management
│       │
│       ├── analytics/
│       │   ├── RevenueTrendChart.jsx        # Line chart
│       │   ├── RestaurantComparison.jsx     # Bar chart
│       │   ├── OrdersHeatmap.jsx            # Time-based heatmap
│       │   └── TopPerformers.jsx            # Top restaurants list
│       │
│       ├── logs/
│       │   ├── ActivityLogTable.jsx         # Audit trail table
│       │   ├── SystemLogTable.jsx           # System logs table
│       │   ├── LogFilter.jsx                # Filter controls
│       │   └── LogDetail.jsx                # Log details modal
│       │
│       └── common/
│           ├── StatCard.jsx                 # Reusable stat card
│           ├── TrendIndicator.jsx           # Up/down trend arrow
│           ├── DateRangePicker.jsx          # Date range selector
│           ├── ExportButton.jsx             # Export to CSV/PDF
│           ├── ConfirmDialog.jsx            # Confirmation modal
│           └── EmptyState.jsx               # Empty state UI
│
├── hooks/
│   └── superadmin/
│       ├── usePlatformStats.js              # Platform-wide statistics
│       ├── useRestaurants.js                # Restaurant data management
│       ├── useSubscriptions.js              # Subscription logic
│       └── useSystemLogs.js                 # Logs fetching
│
├── lib/
│   ├── supabaseOwnerClient.js               # Owner-specific client (exists)
│   └── superAdminHelpers.js                 # Utility functions
│
└── utils/
    └── superadmin/
        ├── exportHelpers.js                 # CSV/PDF export
        ├── dateHelpers.js                   # Date formatting
        └── validators.js                    # Form validation
```

---

## Component Architecture

### Component Hierarchy

```
App
└── Routes
    └── /superadmin/*
        └── ProtectedOwnerRoute
            └── SuperAdminLayout
                ├── SuperAdminHeader
                └── Outlet (Page Content)
                    ├── Dashboard
                    ├── Restaurants
                    ├── Managers
                    ├── Subscriptions
                    ├── SystemSettings
                    ├── ActivityLogs
                    ├── Backups
                    └── Reports
```

---

## Page Specifications

### 1. Dashboard (`/superadmin/dashboard`)

**Purpose**: High-level platform overview with key metrics

**Components**:
- `PlatformKPIs` - 6 stat cards (Restaurants, Users, Revenue, Orders, Active Sessions, Subscriptions)
- `RevenueOverview` - Line chart showing last 30 days revenue
- `RestaurantActivity` - Recent restaurant additions/updates
- `SubscriptionBreakdown` - Pie chart of subscription plans
- `QuickActions` - Buttons for common tasks

**State Management**:
```javascript
const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalUsers: 0,
    totalManagers: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    activeSessions: 0,
    activeSubscriptions: 0
});
const [revenueData, setRevenueData] = useState([]);
const [recentActivity, setRecentActivity] = useState([]);
const [subscriptionBreakdown, setSubscriptionBreakdown] = useState([]);
const [loading, setLoading] = useState(true);
```

**Data Fetching**:
```javascript
// Aggregate queries using is_owner() bypass
const { count: restaurantCount } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

const { data: revenue } = await supabase
    .from('orders')
    .select('total, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', thirtyDaysAgo);
```

**UI Layout** (Desktop):
```
┌────────────────────────────────────────────────────────┐
│  Platform KPIs (6 cards in 3x2 grid)                  │
├────────────────────────────────────────────────────────┤
│  Revenue Chart (Left 2/3)  │ Subscription Pie (1/3)   │
├────────────────────────────────────────────────────────┤
│  Recent Activity Table                                 │
└────────────────────────────────────────────────────────┘
```

---

### 2. Restaurants (`/superadmin/restaurants`)

**Purpose**: Manage all restaurants on the platform

**Features**:
- Grid/Table view toggle
- Search & filter (status, subscription plan)
- Bulk actions (activate/deactivate)
- Create new restaurant
- Export to CSV

**State**:
```javascript
const [restaurants, setRestaurants] = useState([]);
const [filteredRestaurants, setFilteredRestaurants] = useState([]);
const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
const [searchQuery, setSearchQuery] = useState('');
const [filters, setFilters] = useState({
    status: 'all',
    plan: 'all',
    createdAfter: null
});
const [selectedRestaurants, setSelectedRestaurants] = useState([]);
const [showCreateModal, setShowCreateModal] = useState(false);
```

**Columns** (Table View):
| Column | Description | Actions |
|--------|-------------|---------|
| Name | Restaurant name + logo | Clickable → Detail |
| Slug | URL slug | - |
| Status | Active/Inactive badge | Toggle |
| Subscription | Plan name + expiry | Click → Subscription |
| Managers | Count + names | Click → List |
| Revenue (30d) | Monthly revenue | - |
| Created | Date | Sort |
| Actions | View, Edit, Deactivate | Dropdown |

**Grid View Card**:
```
┌─────────────────────────┐
│ 🏠 Logo                 │
│ Restaurant Name         │
│ ───────────────────     │
│ Status: ● Active        │
│ Plan: Pro               │
│ Revenue: ₹45,670        │
│ Managers: 2             │
│ ───────────────────     │
│ [View] [Edit] [...]     │
└─────────────────────────┘
```

---

### 3. RestaurantDetail (`/superadmin/restaurants/:id`)

**Purpose**: Deep dive into a single restaurant

**Sections**:
1. **Overview** - Basic info, stats, quick actions
2. **Subscription** - Current plan, billing, usage limits
3. **Managers & Staff** - User management
4. **Analytics** - Restaurant-specific metrics
5. **Menu Items** - View/manage menu
6. **Orders** - Recent orders
7. **Activity Log** - Restaurant-specific logs

**Tabs**:
```
[ Overview ] [ Subscription ] [ Users ] [ Analytics ] [ Menu ] [ Orders ] [ Logs ]
```

**State**:
```javascript
const [restaurant, setRestaurant] = useState(null);
const [activeTab, setActiveTab] = useState('overview');
const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeUsers: 0,
    averageRating: 0
});
const [subscription, setSubscription] = useState(null);
const [managers, setManagers] = useState([]);
```

---

### 4. Managers (`/superadmin/managers`)

**Purpose**: View and manage all restaurant managers

**Features**:
- Search by name/email
- Filter by restaurant
- View manager performance metrics
- Assign/reassign restaurants

**Columns**:
| Column | Data |
|--------|------|
| Manager | Name + avatar |
| Email | Contact email |
| Restaurant(s) | Assigned restaurants |
| Status | Active/Inactive |
| Last Active | Timestamp |
| Performance | Orders managed, avg rating |
| Actions | View, Edit, Messages |

**Manager Card** (Grid):
```
┌─────────────────────────┐
│ 👤 Manager Name         │
│ email@example.com       │
│ ───────────────────     │
│ 🏢 Restaurant A         │
│ Status: ● Active        │
│ Last active: 2h ago     │
│ ───────────────────     │
│ Orders: 245             │
│ Rating: ⭐ 4.7         │
│ ───────────────────     │
│ [View Details] [...]    │
└─────────────────────────┘
```

---

### 5. Subscriptions (`/superadmin/subscriptions`)

**Purpose**: Manage restaurant subscription plans and billing

**Plans**:
```javascript
const SUBSCRIPTION_PLANS = {
    trial: {
        name: 'Trial',
        price: 0,
        duration: 14, // days
        features: ['5 users', '10 tables', '50 menu items']
    },
    basic: {
        name: 'Basic',
        price: 999,
        features: ['10 users', '20 tables', '100 menu items']
    },
    pro: {
        name: 'Pro',
        price: 2999,
        features: ['50 users', 'Unlimited tables', 'Unlimited menu items', 'Analytics']
    },
    enterprise: {
        name: 'Enterprise',
        price: 9999,
        features: ['Unlimited everything', 'Custom features', 'Priority support']
    }
};
```

**Features**:
- View all subscriptions
- Filter by status/plan
- Manual plan upgrades/downgrades
- Billing history
- Revenue tracking

**Table Columns**:
| Restaurant | Plan | Status | Billing Cycle | Amount | Next Billing | Actions |
|------------|------|--------|---------------|--------|--------------|---------|
| Rest A | Pro | Active | Monthly | ₹2,999 | Dec 1, 2025 | Manage |

---

### 6. SystemSettings (`/superadmin/settings`)

**Purpose**: Configure platform-wide settings

**Categories**:

#### Payment Gateway
```javascript
{
    razorpay_key_id: '',
    razorpay_key_secret: '',
    webhook_secret: '',
    test_mode: true
}
```

#### Email Service
```javascript
{
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: 'noreply@praahis.com'
}
```

#### Storage
```javascript
{
    supabase_url: '',
    supabase_anon_key: '',
    storage_bucket: 'restaurant-assets',
    max_file_size: 5242880 // 5MB
}
```

#### API Configuration
```javascript
{
    rate_limit: 100, // requests per minute
    enable_cors: true,
    allowed_origins: ['https://praahis.com']
}
```

**UI Structure**:
```
Settings
├── Payment Gateway
│   ├── Razorpay Configuration
│   └── Test Mode Toggle
├── Email Service
│   ├── SMTP Settings
│   └── Email Templates
├── Storage
│   ├── Supabase Config
│   └── Upload Limits
├── Platform
│   ├── Default Currency
│   ├── Default Tax Rate
│   └── Date/Time Format
└── Security
    ├── Session Timeout
    ├── Password Policy
    └── 2FA Settings
```

---

### 7. ActivityLogs (`/superadmin/activity-logs`)

**Purpose**: Audit trail of super admin actions

**Features**:
- Filter by action type, entity, date range
- Search by user or entity ID
- Export logs
- Real-time updates

**Log Entry Structure**:
```javascript
{
    id: 'uuid',
    actor: { name: 'Owner Name', email: 'owner@praahis.com' },
    action: 'restaurant_created',
    entity: { type: 'restaurant', id: 'uuid', name: 'New Restaurant' },
    changes: {
        old: null,
        new: { name: 'New Restaurant', status: 'active' }
    },
    timestamp: '2025-11-06T10:30:00Z',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
}
```

**Table View**:
| Timestamp | User | Action | Entity | Changes | IP |
|-----------|------|--------|--------|---------|-----|
| 2h ago | Owner | Created Restaurant | Rest A | [View] | 192.168.1.1 |

---

### 8. SystemLogs (`/superadmin/system-logs`)

**Purpose**: Monitor system errors and warnings

**Log Levels**:
- 🔴 Critical
- 🟠 Error
- 🟡 Warning
- 🔵 Info

**Filters**:
- Level
- Source (API, Database, Payment, Auth)
- Date range
- Restaurant (optional)

**Table**:
| Time | Level | Source | Message | Restaurant | Details |
|------|-------|--------|---------|------------|---------|
| 10:23 AM | Error | Payment | Razorpay timeout | Rest A | [View] |

---

### 9. Backups (`/superadmin/backups`)

**Purpose**: Manage database backups

**Features**:
- Schedule automatic backups
- Manual backup creation
- Restore from backup
- Download backup files

**Backup Types**:
1. **Full Platform** - All restaurants
2. **Single Restaurant** - Specific tenant
3. **Incremental** - Changes since last backup

**Table**:
| Date | Type | Restaurant | Size | Status | Actions |
|------|------|------------|------|--------|---------|
| Nov 6 | Full | All | 240 MB | Completed | Download, Restore |
| Nov 5 | Restaurant | Rest A | 12 MB | Completed | Download |

---

### 10. Reports (`/superadmin/reports`)

**Purpose**: Generate platform-wide reports

**Report Types**:
1. **Revenue Report** - Earnings by restaurant, plan, period
2. **User Activity** - Login stats, active users
3. **Order Analytics** - Order volumes, trends
4. **Subscription Report** - Active subs, churn rate, MRR
5. **Performance Report** - System uptime, response times

**UI**:
```
Report Generator
├── Select Report Type: [Dropdown]
├── Date Range: [Start] to [End]
├── Filters:
│   └── Restaurant: [Multi-select]
├── Format: ○ PDF  ○ CSV  ○ Excel
└── [Generate Report]

Recent Reports
├── Revenue Report - Nov 2025.pdf
├── Subscription Report - Q4 2025.xlsx
└── User Activity - Oct 2025.csv
```

---

## UI/UX Design

### Design System

#### Color Palette (Dark Theme)
```javascript
// Based on existing design tokens
const colors = {
    background: 'hsl(222, 47%, 11%)',        // Deep slate
    foreground: 'hsl(210, 40%, 98%)',        // High contrast white
    card: 'hsl(217, 33%, 17%)',              // Elevated surface
    border: 'hsl(217, 33%, 23%)',            // Subtle borders
    primary: 'hsl(14, 100%, 63%)',           // Coral/Orange
    success: 'hsl(142, 76%, 36%)',           // Green
    warning: 'hsl(38, 92%, 50%)',            // Yellow/Orange
    info: 'hsl(217, 91%, 60%)',              // Blue
    destructive: 'hsl(0, 84%, 60%)',         // Red
};
```

#### Typography
```css
/* Headings */
h1: font-size: 2.25rem; /* 36px */ font-weight: 700;
h2: font-size: 1.875rem; /* 30px */ font-weight: 600;
h3: font-size: 1.5rem; /* 24px */ font-weight: 600;
h4: font-size: 1.25rem; /* 20px */ font-weight: 600;

/* Body */
body: font-family: 'Inter', sans-serif; font-size: 1rem; /* 16px */
small: font-size: 0.875rem; /* 14px */
```

#### Spacing Scale
```javascript
const spacing = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
};
```

### Component Specifications

#### StatCard Component

**Props**:
```typescript
interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    tint?: 'success' | 'warning' | 'info' | 'brand';
    change?: number;  // Percentage change
    loading?: boolean;
}
```

**Desktop (min-width: 768px)**:
```jsx
<div className="card-minimal p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
        <div className="flex-1">
            <p className="text-sm text-muted mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change && (
                <p className={`text-sm mt-2 ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                </p>
            )}
        </div>
        <div className={`p-3 rounded-lg bg-${tint}-light text-${tint}`}>
            <Icon className="h-8 w-8" />
        </div>
    </div>
</div>
```

**Mobile (max-width: 767px)**:
```jsx
<div className="card-minimal p-4">
    <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${tint}-light text-${tint}`}>
            <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-muted truncate">{title}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
    </div>
</div>
```

---

#### RestaurantCard Component

**Props**:
```typescript
interface RestaurantCardProps {
    restaurant: {
        id: string;
        name: string;
        slug: string;
        logo_url?: string;
        is_active: boolean;
        subscription?: {
            plan_name: string;
            status: string;
        };
        stats?: {
            monthlyRevenue: number;
            managerCount: number;
        };
    };
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onToggleStatus: (id: string, status: boolean) => void;
}
```

**Desktop**:
```jsx
<div className="card p-6 hover:shadow-xl transition-all group">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
            {logo_url ? (
                <img src={logo_url} alt={name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
                <div className="w-12 h-12 rounded-lg bg-primary-tint flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                </div>
            )}
            <div>
                <h3 className="font-semibold text-foreground">{name}</h3>
                <p className="text-sm text-muted">/{slug}</p>
            </div>
        </div>
        <StatusBadge active={is_active} />
    </div>
    
    {/* Stats */}
    <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
            <p className="text-xs text-muted">Revenue (30d)</p>
            <p className="text-lg font-semibold text-foreground">
                {formatCurrency(monthlyRevenue)}
            </p>
        </div>
        <div>
            <p className="text-xs text-muted">Managers</p>
            <p className="text-lg font-semibold text-foreground">{managerCount}</p>
        </div>
    </div>
    
    {/* Subscription */}
    <div className="mb-4 p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan:</span>
            <Badge variant={getSubscriptionVariant(subscription.status)}>
                {subscription.plan_name}
            </Badge>
        </div>
    </div>
    
    {/* Actions */}
    <div className="flex gap-2">
        <button onClick={() => onView(id)} className="btn-secondary flex-1">
            View Details
        </button>
        <button onClick={() => onEdit(id)} className="btn-ghost">
            <Edit className="h-4 w-4" />
        </button>
        <button onClick={() => onToggleStatus(id, !is_active)} className="btn-ghost">
            <MoreVertical className="h-4 w-4" />
        </button>
    </div>
</div>
```

**Mobile**:
```jsx
<div className="card p-4 active:bg-muted transition-colors" onClick={() => onView(id)}>
    <div className="flex items-center gap-3 mb-3">
        {logo_url ? (
            <img src={logo_url} alt={name} className="w-10 h-10 rounded-lg" />
        ) : (
            <div className="w-10 h-10 rounded-lg bg-primary-tint flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            <p className="text-xs text-muted truncate">/{slug}</p>
        </div>
        <StatusBadge active={is_active} />
    </div>
    
    <div className="flex items-center justify-between text-sm">
        <div>
            <span className="text-muted">Revenue: </span>
            <span className="font-semibold">{formatCurrency(monthlyRevenue)}</span>
        </div>
        <Badge variant="outline">{subscription.plan_name}</Badge>
    </div>
    
    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
</div>
```

---

#### Dashboard Page Wireframe

**Desktop (1440px+)**:
```
┌────────────────────────────────────────────────────────────────────┐
│  SuperAdminHeader                                                  │
├────────────────────────────────────────────────────────────────────┤
│  Dashboard                                              [Export ▾] │
│  ──────────────────────────────────────────────────────────────    │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │🏢 Restau  │  │👥 Users  │  │💰 Revenue│  │📦 Orders │          │
│  │  rants   │  │   245    │  │ ₹2.4M    │  │  1,234   │          │
│  │   42     │  │  ↑ 12%   │  │  ↑ 23%   │  │  ↑ 8%    │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                                                     │
│  ┌──────────┐  ┌──────────┐                                       │
│  │⚡ Active │  │📋 Subscr │                                       │
│  │  Session │  │  iptions │                                       │
│  │   89     │  │   38     │                                       │
│  └──────────┘  └──────────┘                                       │
│                                                                     │
│  ┌────────────────────────────────────┐  ┌────────────────────┐  │
│  │ Revenue Overview (Last 30 Days)    │  │ Subscriptions      │  │
│  │ ─────────────────────────────────  │  │ ───────────────    │  │
│  │         📈 Line Chart              │  │   🥧 Pie Chart    │  │
│  │      (Recharts Component)          │  │   Basic: 15       │  │
│  │                                     │  │   Pro: 20         │  │
│  │                                     │  │   Enterprise: 3   │  │
│  └────────────────────────────────────┘  └────────────────────┘  │
│                                                                     │
│  Recent Activity                                                   │
│  ────────────────────────────────────────────────────────────      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Time     │ User      │ Action           │ Entity             │ │
│  │──────────│───────────│──────────────────│────────────────────│ │
│  │ 2h ago   │ Owner     │ Created Rest     │ New Restaurant     │ │
│  │ 5h ago   │ Manager A │ Updated Menu     │ Rest A             │ │
│  │ 1d ago   │ Owner     │ Upgraded Plan    │ Rest B → Pro       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

**Mobile (375px - 768px)**:
```
┌────────────────────────────┐
│  SuperAdminHeader          │
├────────────────────────────┤
│  Dashboard        [≡]      │
│  ───────────────           │
│                             │
│  ┌────────────────────────┐│
│  │🏢 42                   ││
│  │Restaurants   ↑ 5%     ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │👥 245                  ││
│  │Users         ↑ 12%    ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │💰 ₹2.4M                ││
│  │Revenue       ↑ 23%    ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │📦 1,234                ││
│  │Orders        ↑ 8%     ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │⚡ 89                   ││
│  │Active Sessions         ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │📋 38                   ││
│  │Subscriptions           ││
│  └────────────────────────┘│
│                             │
│  Revenue Overview           │
│  ────────────────           │
│  ┌────────────────────────┐│
│  │   📈 Chart (scrollable)││
│  └────────────────────────┘│
│                             │
│  Recent Activity            │
│  ────────────────           │
│  ┌────────────────────────┐│
│  │ 2h ago                 ││
│  │ Created Restaurant     ││
│  │ New Restaurant         ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │ 5h ago                 ││
│  │ Updated Menu           ││
│  │ Rest A                 ││
│  └────────────────────────┘│
│                             │
└────────────────────────────┘
```

---

#### Restaurants Page Wireframe

**Desktop with Grid View**:
```
┌────────────────────────────────────────────────────────────────────┐
│  Restaurants                                 [+ New] [Grid] [Table]│
│  ────────────────────────────────────────────────────────────       │
│                                                                     │
│  [🔍 Search restaurants...]  [Status ▾]  [Plan ▾]  [Export]       │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ 🏢 Rest A    │  │ 🏢 Rest B    │  │ 🏢 Rest C    │            │
│  │ /rest-a      │  │ /rest-b      │  │ /rest-c      │            │
│  │ ● Active     │  │ ● Active     │  │ ○ Inactive   │            │
│  │              │  │              │  │              │            │
│  │ Revenue:     │  │ Revenue:     │  │ Revenue:     │            │
│  │ ₹45,670      │  │ ₹32,100      │  │ ₹0           │            │
│  │              │  │              │  │              │            │
│  │ Managers: 2  │  │ Managers: 1  │  │ Managers: 0  │            │
│  │ Plan: Pro    │  │ Plan: Basic  │  │ Plan: Trial  │            │
│  │              │  │              │  │              │            │
│  │[View] [Edit] │  │[View] [Edit] │  │[View] [Edit] │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ ...          │  │ ...          │  │ ...          │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
│  Showing 1-12 of 42                          [← 1 2 3 4 →]        │
└────────────────────────────────────────────────────────────────────┘
```

**Desktop with Table View**:
```
┌────────────────────────────────────────────────────────────────────────────┐
│  Restaurants                                      [+ New] [Grid] [●Table]  │
│  ─────────────────────────────────────────────────────────────────         │
│                                                                             │
│  [🔍 Search...]  [Status ▾]  [Plan ▾]  [☑ Bulk Actions ▾]  [Export]      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ ☑ │ Restaurant  │ Slug    │ Status  │ Plan  │ Revenue │ Mgrs │ ...  │ │
│  │───│─────────────│─────────│─────────│───────│─────────│──────│──────│ │
│  │ ☐ │ 🏢 Rest A   │ /rest-a │ ●Active │ Pro   │ ₹45,670 │  2   │ ⋮    │ │
│  │ ☐ │ 🏢 Rest B   │ /rest-b │ ●Active │ Basic │ ₹32,100 │  1   │ ⋮    │ │
│  │ ☐ │ 🏢 Rest C   │ /rest-c │ Inactive│ Trial │ ₹0      │  0   │ ⋮    │ │
│  │ ☐ │ 🏢 Rest D   │ /rest-d │ ●Active │ Pro   │ ₹67,890 │  3   │ ⋮    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Showing 1-10 of 42                                    [← 1 2 3 4 5 →]    │
└────────────────────────────────────────────────────────────────────────────┘
```

**Mobile**:
```
┌────────────────────────────┐
│  Restaurants      [+] [≡]  │
│  ────────────               │
│                             │
│  [🔍 Search...]            │
│  [Filters ▾]               │
│                             │
│  ┌────────────────────────┐│
│  │ 🏢 Restaurant A        ││
│  │ /rest-a        ● Active││
│  │ ──────────────────────││
│  │ Revenue: ₹45,670      ││
│  │ Plan: Pro             ││
│  │                    → ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │ 🏢 Restaurant B        ││
│  │ /rest-b        ● Active││
│  │ ──────────────────────││
│  │ Revenue: ₹32,100      ││
│  │ Plan: Basic           ││
│  │                    → ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │ 🏢 Restaurant C        ││
│  │ /rest-c       Inactive ││
│  │ ──────────────────────││
│  │ Revenue: ₹0           ││
│  │ Plan: Trial           ││
│  │                    → ││
│  └────────────────────────┘│
│                             │
│  [Load More]                │
└────────────────────────────┘
```

---

## Security & Access Control

### RLS Bypass for Owner

The `is_owner()` function in the database allows super admin to bypass RLS:

```sql
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND (
      COALESCE(u.is_owner, FALSE) = TRUE OR lower(u.role) = 'owner'
    )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Protected Routes

```javascript
// App.jsx
<Route path="/superadmin/*" element={
    <ProtectedOwnerRoute>
        <SuperAdminLayout />
    </ProtectedOwnerRoute>
}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<SuperAdminDashboard />} />
    <Route path="restaurants" element={<Restaurants />} />
    <Route path="restaurants/:id" element={<RestaurantDetail />} />
    <Route path="managers" element={<Managers />} />
    <Route path="subscriptions" element={<Subscriptions />} />
    <Route path="settings" element={<SystemSettings />} />
    <Route path="activity-logs" element={<ActivityLogs />} />
    <Route path="system-logs" element={<SystemLogs />} />
    <Route path="backups" element={<Backups />} />
    <Route path="reports" element={<Reports />} />
</Route>
```

### Audit Logging

All super admin actions should be logged:

```javascript
// superAdminHelpers.js
export const logSuperAdminAction = async (action, entityType, entityId, changes = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('audit_trail').insert({
        actor_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: changes.old || null,
        new_values: changes.new || null,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
    });
};

// Usage
await logSuperAdminAction(
    'restaurant_created',
    'restaurant',
    newRestaurant.id,
    { new: newRestaurant }
);
```

---

## API Integration

### Supabase Client Configuration

```javascript
// lib/supabaseOwnerClient.js (already exists)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseOwner = createClient(supabaseUrl, supabaseAnonKey);

// Helper to ensure owner access
export const ensureOwnerAccess = async () => {
    const { data: { user } } = await supabaseOwner.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data: profile } = await supabaseOwner
        .from('users')
        .select('is_owner, role')
        .eq('id', user.id)
        .single();
    
    const isOwner = profile?.is_owner || profile?.role === 'owner';
    if (!isOwner) throw new Error('Unauthorized: Owner access required');
    
    return { user, profile };
};
```

### Custom Hooks

```javascript
// hooks/superadmin/usePlatformStats.js
import { useState, useEffect } from 'react';
import { supabaseOwner } from '../../lib/supabaseOwnerClient';

export const usePlatformStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        fetchStats();
    }, []);
    
    const fetchStats = async () => {
        try {
            setLoading(true);
            
            // Parallel queries for performance
            const [restaurants, users, orders, subscriptions] = await Promise.all([
                supabaseOwner.from('restaurants').select('*', { count: 'exact', head: true }),
                supabaseOwner.from('users').select('*', { count: 'exact', head: true }),
                supabaseOwner.from('orders').select('total, created_at').eq('payment_status', 'paid'),
                supabaseOwner.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')
            ]);
            
            // Calculate metrics
            const totalRestaurants = restaurants.count || 0;
            const totalUsers = users.count || 0;
            const totalRevenue = (orders.data || []).reduce((sum, o) => sum + (o.total || 0), 0);
            const activeSubscriptions = subscriptions.count || 0;
            
            setStats({
                totalRestaurants,
                totalUsers,
                totalRevenue,
                totalOrders: orders.data?.length || 0,
                activeSubscriptions
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return { stats, loading, error, refetch: fetchStats };
};
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create database migrations (new tables + RLS policies)
- [ ] Set up folder structure
- [ ] Create base components (StatCard, DataTable, etc.)
- [ ] Implement Dashboard page with KPIs
- [ ] Test owner authentication flow

### Phase 2: Restaurant Management (Week 2)
- [ ] Build Restaurants list page (grid + table views)
- [ ] Implement RestaurantDetail page
- [ ] Create restaurant CRUD operations
- [ ] Add search and filtering
- [ ] Implement bulk actions

### Phase 3: User Management (Week 3)
- [ ] Build Managers page
- [ ] Create Staff overview page
- [ ] Implement user assignment to restaurants
- [ ] Add user performance metrics
- [ ] Create user quick view modal

### Phase 4: Subscriptions & Billing (Week 4)
- [ ] Design subscription plans
- [ ] Build Subscriptions page
- [ ] Implement plan upgrades/downgrades
- [ ] Create billing history
- [ ] Add usage metrics gauges

### Phase 5: System Configuration (Week 5)
- [ ] Build SystemSettings page
- [ ] Implement payment gateway config
- [ ] Add email service settings
- [ ] Create storage configuration
- [ ] Implement API key management

### Phase 6: Monitoring & Logs (Week 6)
- [ ] Build ActivityLogs page
- [ ] Create SystemLogs page
- [ ] Implement log filtering
- [ ] Add real-time log updates
- [ ] Create log export functionality

### Phase 7: Analytics & Reports (Week 7)
- [ ] Build Analytics dashboard
- [ ] Implement revenue trend charts
- [ ] Create restaurant comparison views
- [ ] Build Reports generator
- [ ] Add PDF/CSV export

### Phase 8: Advanced Features (Week 8)
- [ ] Implement Backups management
- [ ] Add backup scheduling
- [ ] Create restore functionality
- [ ] Build data export tools
- [ ] Implement tenant reports

### Phase 9: Polish & Testing (Week 9)
- [ ] Mobile responsiveness testing
- [ ] Dark/Light theme consistency
- [ ] Loading states and animations
- [ ] Error handling
- [ ] Accessibility improvements

### Phase 10: Deployment (Week 10)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Production deployment
- [ ] Monitoring setup

---

## Appendix

### Key Dependencies
```json
{
    "dependencies": {
        "react": "^19.0.0",
        "react-router-dom": "^7.9.3",
        "@supabase/supabase-js": "^2.74.0",
        "recharts": "^3.2.1",
        "lucide-react": "^0.545.0",
        "framer-motion": "^12.5.0",
        "react-hot-toast": "^2.6.0",
        "jspdf": "^3.0.3",
        "papaparse": "^5.5.3"
    }
}
```

### Environment Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=your-razorpay-key
```

### Accessibility Considerations
- Semantic HTML (main, header, nav, section)
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly
- Color contrast compliance (WCAG AA)

### Performance Optimizations
- React.lazy for code splitting
- Memoization (useMemo, useCallback)
- Virtual scrolling for large lists
- Image optimization
- Debounced search inputs
- Pagination/infinite scroll

---

**End of Design Document**

For implementation details and code examples, refer to individual component files in the `/src/pages/superadmin/` and `/src/Components/superadmin/` directories.
