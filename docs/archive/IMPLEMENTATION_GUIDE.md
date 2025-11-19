# Praahis Super Admin - Complete Implementation Guide

## 🚀 Production-Ready Feature Implementation

**Version**: 2.0  
**Date**: November 7, 2025  
**Status**: Phase 1 Complete - Database Schemas ✅

---

## 📋 Table of Contents

1. [Payment & Billing System](#1-payment--billing-system)
2. [Audit Trail System](#2-audit-trail-system)
3. [Backup & Restore](#3-backup--restore-system)
4. [Role-Based Access Control](#4-role-based-access-control)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Database Migration Guide](#database-migration-guide)
7. [API & Functions Reference](#api--functions-reference)

---

## 1. Payment & Billing System

### 💰 Pricing Model
**₹100 per table per day**

Monthly billing calculation:
```
monthly_amount = table_count × 100 × days_in_month
```

### Database Tables

#### `billing`
Tracks monthly bills for each restaurant.

**Key Fields:**
- `restaurant_id` - Restaurant being billed
- `table_count` - Number of tables at bill generation
- `rate_per_table_per_day` - ₹100 (configurable)
- `days_in_month` - 28-31 days
- `base_amount` - Calculated: table_count × rate × days
- `total_amount` - Final amount (with tax/discount)
- `status` - pending, paid, overdue, cancelled
- `due_date` - Payment due date (1st of next month)
- `grace_period_days` - 3 days default
- `grace_end_date` - Last day before suspension

**Indexes:**
- Restaurant ID
- Status
- Due date
- Grace end date

#### `payments`
Logs all payment transactions.

**Key Fields:**
- `billing_id` - Related bill
- `amount` - Payment amount
- `payment_method` - manual, razorpay, stripe, upi, cash, etc.
- `payment_status` - pending, completed, failed, refunded
- `transaction_id` - External transaction reference
- `verified_by` - Super admin who verified

### Core Functions

#### 1. Generate Monthly Bills
```sql
SELECT * FROM generate_monthly_bills(11, 2025);
-- Generates bills for November 2025
```

**What it does:**
- Runs on 1st of each month
- Counts active tables per restaurant
- Calculates bill amount
- Sets due date (1st of next month)
- Sets grace end date (due date + 3 days)

#### 2. Auto-Suspend Overdue Restaurants
```sql
SELECT * FROM suspend_overdue_restaurants();
```

**What it does:**
- Finds bills past grace period
- Updates bill status to 'overdue'
- Sets `suspended_at` timestamp
- Deactivates restaurant (`is_active = false`)
- Returns list of suspended restaurants

#### 3. Mark Bill as Paid
```sql
SELECT mark_bill_as_paid(
    '<billing_id>'::UUID,
    'manual',
    'TXN12345',
    '<admin_user_id>'::UUID
);
```

**What it does:**
- Creates payment record
- Updates bill status to 'paid'
- Sets `paid_at` and `reactivated_at`
- **Automatically reactivates restaurant**
- Returns success status

#### 4. Get Billing Summary
```sql
SELECT get_restaurant_billing_summary('<restaurant_id>'::UUID);
```

**Returns:**
- Current bill details
- Total paid amount
- Total pending amount
- Overdue flag

### Automation Requirements

#### Daily Cron Job (Supabase Edge Function)
```typescript
// Run every day at 2:00 AM
const checkAndSuspend = async () => {
  const { data, error } = await supabase
    .rpc('suspend_overdue_restaurants');
  
  if (error) console.error('Suspension failed:', error);
  else console.log('Suspended restaurants:', data);
};
```

#### Monthly Bill Generation (1st of month)
```typescript
// Run on 1st day of each month at 1:00 AM
const generateBills = async () => {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  
  const { data, error } = await supabase
    .rpc('generate_monthly_bills', { 
      p_billing_month: month, 
      p_billing_year: year 
    });
  
  console.log('Bills generated:', data);
};
```

### UI Components Needed

#### Super Admin - Restaurants Page
**Add columns:**
- **Billing Status** - Badge: Paid (green), Pending (orange), Overdue (red)
- **Next Bill Date** - Format: "Dec 1, 2025"
- **Amount Due** - Format: "₹3,000"
- **Grace Days Left** - Format: "2 days" or "Expired"

**Add actions:**
- **Mark as Paid** button (for pending/overdue bills)
  - Opens modal with payment method dropdown
  - Transaction ID input field
  - Amount confirmation
  - Saves payment and reactivates

#### Restaurant Manager Dashboard
**Add Billing Status Card:**
```jsx
{billing.status === 'overdue' ? (
  <div className="bg-red-50 border-red-200 p-4 rounded-lg">
    <h3 className="text-red-800 font-bold">Account Suspended</h3>
    <p>Your account has been suspended due to non-payment.</p>
    <p>Amount Due: ₹{billing.total_amount}</p>
    <p>Please contact admin to restore access.</p>
  </div>
) : (
  <div className="bg-white p-4 rounded-lg">
    <h3>Billing Status</h3>
    <p>Next Payment: {billing.due_date}</p>
    <p>Amount: ₹{billing.total_amount}</p>
    <p>Status: {billing.status}</p>
  </div>
)}
```

### Implementation Steps

1. ✅ Run migration: `40_billing_payments_system.sql`
2. ⏳ Create Supabase Edge Functions:
   - `daily-suspension-check`
   - `monthly-bill-generation`
3. ⏳ Update Super Admin UI:
   - Add billing columns to restaurants table
   - Implement "Mark as Paid" modal
   - Add payment verification form
4. ⏳ Update Manager Dashboard:
   - Add billing status card
   - Show suspension warning
   - Block access when suspended
5. ⏳ Setup cron jobs in Supabase

---

## 2. Audit Trail System

### Database Table: `audit_trail`

**Comprehensive logging of all system actions.**

**Key Fields:**
- `actor_id` - Who performed the action
- `actor_email` - User email
- `actor_role` - superadmin, manager, etc.
- `action` - created, updated, deleted, suspended, payment_made, etc.
- `entity_type` - restaurant, user, billing, payment, etc.
- `entity_id` - ID of affected entity
- `old_values` - Previous state (JSONB)
- `new_values` - New state (JSONB)
- `changed_fields` - Array of changed field names
- `ip_address` - Request IP
- `user_agent` - Browser/client
- `description` - Human-readable description
- `severity` - info, warning, error, critical

### Automatic Logging

**Triggers are active on:**
- ✅ `restaurants` - Creates, updates, deletes
- ✅ `billing` - Status changes, suspensions
- ✅ `payments` - Payment records
- ✅ `users` - User management
- ✅ `platform_settings` - Configuration changes

### Manual Logging Function

```sql
SELECT log_audit_trail(
    'updated',                    -- action
    'restaurant',                 -- entity_type
    '<restaurant_id>'::UUID,     -- entity_id
    'The Golden Fork',           -- entity_name
    '{"is_active": false}'::jsonb, -- old_values
    '{"is_active": true}'::jsonb,  -- new_values
    'Restaurant reactivated',     -- description
    'info'                        -- severity
);
```

### Query Functions

#### Get Recent Logs
```sql
SELECT * FROM get_recent_audit_logs(100);
-- Returns last 100 audit entries
```

#### Get Entity History
```sql
SELECT * FROM get_entity_audit_history(
    'restaurant', 
    '<restaurant_id>'::UUID
);
-- Returns complete history for a restaurant
```

### UI Components Needed

#### Audit Logs Page (`/superadmin/audit-logs`)

**Filters:**
- Date range picker
- Entity type dropdown (restaurant, user, billing, etc.)
- Action type dropdown (created, updated, deleted, etc.)
- Severity filter (info, warning, error, critical)
- Search by actor email

**Table columns:**
- Timestamp
- Actor (email + role badge)
- Action (badge with color coding)
- Entity Type
- Entity Name
- Description
- View Details button

**Details Modal:**
- Full change diff (old vs new values)
- Changed fields highlighted
- IP address and user agent
- Full metadata JSON

### Implementation Steps

1. ✅ Run migration: `41_audit_trail_system.sql`
2. ⏳ Create Audit Logs page component
3. ⏳ Implement filters and pagination
4. ⏳ Add details modal with JSON diff viewer
5. ⏳ Add audit log viewer to restaurant detail pages

---

## 3. Backup & Restore System

### Database Tables

#### `backups`
**Tracks all backup operations.**

**Key Fields:**
- `backup_type` - full, incremental, restaurant, manual
- `backup_name` - Unique identifier
- `restaurant_id` - For restaurant-specific backups
- `file_path` - Storage location
- `storage_location` - supabase_storage, s3, local
- `file_size` - Bytes
- `status` - in_progress, completed, failed, deleted
- `tables_backed_up` - Array of table names
- `row_count` - Total rows backed up
- `initiated_by` - Admin who started backup
- `retention_days` - Auto-delete after N days (default 30)
- `expires_at` - Auto-calculated deletion date
- `can_restore` - Boolean flag

#### `backup_schedules`
**Automated backup scheduling.**

**Key Fields:**
- `name` - Schedule name
- `backup_type` - full, incremental, restaurant
- `frequency` - hourly, daily, weekly, monthly
- `schedule_time` - e.g., '02:00:00'
- `schedule_day` - Day of week/month
- `retention_days` - Keep backups for N days
- `is_active` - Enable/disable schedule
- `last_run` - Last execution timestamp
- `next_run` - Calculated next run time

### Core Functions

#### Create Backup Record
```sql
SELECT create_backup_record(
    'full',                    -- backup_type
    'daily_backup_2025_11_07', -- backup_name
    NULL,                      -- restaurant_id (NULL for full)
    '<admin_id>'::UUID        -- initiated_by
);
-- Returns backup_id
```

#### Mark Backup Complete
```sql
SELECT complete_backup(
    '<backup_id>'::UUID,
    '/backups/2025/11/daily_backup.sql.gz',
    1048576,  -- file_size in bytes
    ARRAY['restaurants', 'users', 'billing'],
    10000     -- row_count
);
```

### Backup Strategy

#### Daily Automated Backups
**Schedule:** Every day at 2:00 AM  
**Type:** Full database backup  
**Retention:** 30 days  
**Storage:** Supabase Storage or S3  

#### Weekly Full Backups
**Schedule:** Sunday at 1:00 AM  
**Type:** Full with compression  
**Retention:** 90 days  
**Storage:** Long-term storage (S3)

#### On-Demand Backups
- Manual trigger from Super Admin
- Before major updates
- Before bulk operations
- Restaurant-specific backups

### Restore Process

1. Select backup from history
2. Confirm restore operation (warning modal)
3. Create pre-restore backup automatically
4. Execute restore script
5. Validate data integrity
6. Log restore in audit trail

### UI Components Needed

#### Backups Section (`/superadmin/settings/backups`)

**Backup Management Tab:**
- **Create Backup** button
  - Backup type selector
  - Restaurant selector (optional)
  - Compression toggle
  - Encryption toggle
- **Backup History** table
  - Name, Type, Size, Status, Date
  - Download button
  - Restore button
  - Delete button

**Scheduled Backups Tab:**
- List of backup schedules
- Add new schedule button
- Edit schedule
- Enable/disable toggle
- Delete schedule

**Storage Stats:**
- Total backup size
- Number of backups
- Storage usage chart
- Old backups cleanup button

### Implementation Steps

1. ✅ Run migration: `42_backups_and_roles.sql`
2. ⏳ Create Supabase Edge Function for backup generation
3. ⏳ Setup Supabase Storage bucket for backups
4. ⏳ Create Backups UI page
5. ⏳ Implement backup scheduling system
6. ⏳ Add restore functionality with validation

---

## 4. Role-Based Access Control

### Admin Roles

#### `superadmin` 🔴
**Full System Access**
- All CRUD operations
- System settings
- Backups & restore
- Audit logs
- Payment management
- User & role management

#### `subadmin` 🟡
**Limited Access**
- ✅ View restaurants (read-only)
- ✅ View/edit managers
- ✅ View billing (cannot modify)
- ✅ View audit logs
- ❌ Cannot access system settings
- ❌ Cannot create/delete restaurants
- ❌ Cannot access backups

#### `support` 🟢
**Read-Only Access**
- ✅ View all restaurants
- ✅ View all managers
- ✅ View billing status
- ✅ View audit logs
- ❌ Cannot modify anything
- ❌ Cannot access sensitive data

### Database Table: `platform_admins`

**Fields:**
- `user_id` - References auth.users
- `email` - Admin email
- `full_name` - Display name
- `role` - ENUM: superadmin, subadmin, support
- `permissions` - JSONB with granular permissions
- `is_active` - Enable/disable admin
- `two_factor_enabled` - 2FA toggle
- `last_login` - Login tracking
- `login_count` - Usage statistics

### Permission Check Function

```sql
SELECT check_admin_permission(
    '<user_id>'::UUID,
    'restaurants',  -- module
    'delete'        -- action
);
-- Returns true/false
```

### UI Implementation

#### Login Flow Enhancement
```typescript
// After successful login
const { data: adminProfile } = await supabase
  .from('platform_admins')
  .select('*')
  .eq('user_id', user.id)
  .single();

if (adminProfile) {
  localStorage.setItem('admin_role', adminProfile.role);
  localStorage.setItem('admin_permissions', JSON.stringify(adminProfile.permissions));
}
```

#### Permission-Based UI Rendering
```jsx
const canDelete = checkPermission('restaurants', 'delete');
const canAccessSettings = adminRole === 'superadmin';

{canDelete && (
  <button onClick={handleDelete}>Delete</button>
)}

{canAccessSettings && (
  <Link to="/superadmin/settings">Settings</Link>
)}
```

#### Route Protection
```jsx
<ProtectedRoute 
  roles={['superadmin']} 
  redirectTo="/superadmin/dashboard"
>
  <SystemSettings />
</ProtectedRoute>
```

### Implementation Steps

1. ✅ Run migration: `42_backups_and_roles.sql`
2. ⏳ Create Admin Management page
3. ⏳ Add role assignment UI
4. ⏳ Implement permission checking middleware
5. ⏳ Update all routes with role-based protection
6. ⏳ Add 2FA setup flow (optional)

---

## Implementation Roadmap

### Phase 1: Database Foundation ✅ COMPLETE
- [x] Billing & Payments tables
- [x] Audit Trail system
- [x] Backup system tables
- [x] Role-based access tables
- [x] All functions and triggers

### Phase 2: Backend Automation ⏳ IN PROGRESS
- [ ] Create Supabase Edge Functions
  - [ ] `daily-suspension-check`
  - [ ] `monthly-bill-generation`
  - [ ] `backup-automation`
- [ ] Setup cron schedules
- [ ] Configure Supabase Storage
- [ ] Test all automated workflows

### Phase 3: Super Admin UI 🔜 NEXT
- [ ] Billing Management UI
  - [ ] Add billing columns to restaurants table
  - [ ] Mark as Paid modal
  - [ ] Payment history view
- [ ] Audit Logs Page
  - [ ] Filters and search
  - [ ] Details modal with diff viewer
- [ ] Backups Page
  - [ ] Manual backup trigger
  - [ ] Backup history table
  - [ ] Restore functionality
- [ ] Admin Management
  - [ ] Create/edit admins
  - [ ] Role assignment
  - [ ] Permission management

### Phase 4: Manager Dashboard Updates 🔜
- [ ] Add billing status card
- [ ] Show suspension warning
- [ ] Block access when suspended
- [ ] Payment instructions display

### Phase 5: Analytics & Reporting 🔜
- [ ] Restaurant growth chart
- [ ] Payment activity chart
- [ ] Active vs Suspended pie chart
- [ ] Revenue trends

### Phase 6: Advanced Features 🔜
- [ ] Bulk operations
- [ ] Data export (CSV/Excel)
- [ ] Maintenance mode
- [ ] Global search
- [ ] UI/UX improvements

---

## Database Migration Guide

### Step 1: Backup Current Database
```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup_before_migration.sql
```

### Step 2: Run Migrations in Order
```bash
# Run each migration file
psql $DATABASE_URL -f database/40_billing_payments_system.sql
psql $DATABASE_URL -f database/41_audit_trail_system.sql
psql $DATABASE_URL -f database/42_backups_and_roles.sql
```

### Step 3: Verify Tables Created
```sql
-- Check if all tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('billing', 'payments', 'audit_trail', 'backups', 'backup_schedules', 'platform_admins');
```

### Step 4: Test Functions
```sql
-- Test bill generation (dry run)
SELECT * FROM generate_monthly_bills();

-- Test audit logging
SELECT * FROM get_recent_audit_logs(10);

-- Test permission check
SELECT check_admin_permission(
    (SELECT id FROM auth.users LIMIT 1),
    'restaurants',
    'read'
);
```

### Step 5: Create First Superadmin
```sql
-- Replace with actual user ID
INSERT INTO platform_admins (user_id, email, full_name, role)
VALUES (
    '<your_user_id>'::UUID,
    'admin@praahis.com',
    'Super Administrator',
    'superadmin'
);
```

---

## API & Functions Reference

### Billing Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `generate_monthly_bills` | `p_billing_month INT`, `p_billing_year INT` | `TABLE(restaurant_id, restaurant_name, table_count, amount, status)` | Generate monthly bills for all active restaurants |
| `suspend_overdue_restaurants` | None | `TABLE(restaurant_id, restaurant_name, billing_id, amount_due, days_overdue, action)` | Auto-suspend restaurants past grace period |
| `mark_bill_as_paid` | `p_billing_id UUID`, `p_payment_method VARCHAR`, `p_transaction_id VARCHAR`, `p_verified_by UUID` | `JSONB` | Mark bill as paid and reactivate restaurant |
| `get_restaurant_billing_summary` | `p_restaurant_id UUID` | `JSONB` | Get comprehensive billing summary |
| `calculate_billing_amount` | `p_table_count INT`, `p_rate_per_table DECIMAL`, `p_days_in_month INT` | `DECIMAL` | Calculate bill amount |

### Audit Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `log_audit_trail` | `p_action VARCHAR`, `p_entity_type VARCHAR`, `p_entity_id UUID`, `p_entity_name TEXT`, `p_old_values JSONB`, `p_new_values JSONB`, `p_description TEXT`, `p_severity VARCHAR`, `p_metadata JSONB` | `UUID` | Log an audit trail entry |
| `get_recent_audit_logs` | `p_limit INT`, `p_entity_type VARCHAR`, `p_action VARCHAR` | `TABLE(id, action, entity_type, entity_name, actor_email, description, created_at)` | Get recent audit logs with filters |
| `get_entity_audit_history` | `p_entity_type VARCHAR`, `p_entity_id UUID` | `TABLE(id, action, actor_email, description, old_values, new_values, changed_fields, created_at)` | Get complete audit history for entity |

### Backup Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `create_backup_record` | `p_backup_type VARCHAR`, `p_backup_name TEXT`, `p_restaurant_id UUID`, `p_initiated_by UUID` | `UUID` | Create new backup tracking record |
| `complete_backup` | `p_backup_id UUID`, `p_file_path TEXT`, `p_file_size BIGINT`, `p_tables_backed_up TEXT[]`, `p_row_count BIGINT` | `BOOLEAN` | Mark backup as completed |

### Permission Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `check_admin_permission` | `p_user_id UUID`, `p_module TEXT`, `p_action TEXT` | `BOOLEAN` | Check if admin has specific permission |
| `get_admin_dashboard_stats` | `p_admin_id UUID` | `JSONB` | Get dashboard stats based on role |

---

## Next Steps

1. **Deploy Database Migrations** to production/staging
2. **Create Supabase Edge Functions** for automation
3. **Build React Components** for new UI features
4. **Test Billing Flow** end-to-end
5. **Setup Monitoring** for automated jobs
6. **Document API** for frontend integration

---

**Created**: November 7, 2025  
**Last Updated**: November 7, 2025  
**Version**: 2.0  
**Status**: Database schemas complete, automation pending
