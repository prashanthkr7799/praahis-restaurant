# 👥 Staff Domain

## Overview
The Staff domain manages employee operations for the Praahis platform, including staff management, role-based access control, activity logging, shift management, and performance tracking. It handles all staff-related functionality for waiters, chefs, managers, and administrators.

---

## 📂 Structure

```
src/domains/staff/
├── components/
│   └── StaffForm.jsx            # Staff CRUD form
├── utils/
│   ├── activityLogger.js        # Activity tracking
│   ├── permissions.js           # Role-based permissions
│   └── staffHelpers.js          # Staff utility functions
├── events.js                    # Domain events
└── index.js                     # Public API exports
```

---

## 🎯 Purpose

### Business Capabilities
- Staff member management (CRUD)
- Role assignment and permissions
- Activity and audit logging
- Shift scheduling and tracking
- Performance metrics
- Staff authentication and authorization
- Time tracking and attendance

### Technical Responsibilities
- Staff data validation
- Permission checking and enforcement
- Activity log persistence
- Role-based access control (RBAC)
- Staff session management
- Integration with auth system

---

## 🔌 Public API

### Components

#### `StaffForm`
```jsx
import { StaffForm } from '@domains/staff';

<StaffForm
  staff={{
    id: 'staff-123',
    name: 'John Doe',
    email: 'john@restaurant.com',
    phone: '+91-9876543210',
    role: 'waiter',
    restaurantId: 'restaurant-123'
  }}
  onSubmit={(data) => console.log('Saved:', data)}
  onCancel={() => console.log('Cancelled')}
  mode="edit" // 'create' | 'edit'
/>
```

**Props:**
- `staff` (object, optional): Existing staff data (for edit mode)
- `onSubmit` (function, required): Form submission handler
- `onCancel` (function, optional): Cancel handler
- `mode` (string, optional): 'create' or 'edit'
- `restaurantId` (string, required): Restaurant ID

**Features:**
- Form validation
- Role selection dropdown
- Email and phone validation
- Password management
- Access permissions configuration
- Photo upload

**Form Fields:**
- Name (required)
- Email (required, unique)
- Phone (optional)
- Role (required): waiter, chef, manager, admin
- Status (active/inactive)
- Permissions (checkboxes)
- Profile photo

---

### Utilities

#### `activityLogger.js`

```javascript
import {
  logActivity,
  getActivityHistory,
  getStaffActivity,
  exportActivityLog
} from '@domains/staff';
```

##### `logActivity(activity)`
Log a staff activity.

```javascript
await logActivity({
  staffId: 'staff-123',
  restaurantId: 'restaurant-123',
  action: 'order_updated',
  details: { orderId: 'order-456', status: 'preparing' },
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...'
});
```

**Parameters:**
- `activity` (object): Activity details
  - `staffId` (string, required)
  - `restaurantId` (string, required)
  - `action` (string, required)
  - `details` (object, optional)
  - `ipAddress` (string, optional)
  - `userAgent` (string, optional)

**Returns:** Promise<Activity>

---

##### `getActivityHistory(filters)`
Get activity history with filters.

```javascript
const activities = await getActivityHistory({
  restaurantId: 'restaurant-123',
  staffId: 'staff-123',
  startDate: '2025-11-01',
  endDate: '2025-11-30',
  actions: ['login', 'order_updated'],
  limit: 100
});
```

**Parameters:**
- `filters` (object): Filter criteria
  - `restaurantId` (string, required)
  - `staffId` (string, optional)
  - `startDate` (string, optional)
  - `endDate` (string, optional)
  - `actions` (array, optional)
  - `limit` (number, optional)

**Returns:** Promise<Activity[]>

---

##### `getStaffActivity(staffId, dateRange)`
Get activity summary for a staff member.

```javascript
const summary = await getStaffActivity('staff-123', {
  start: '2025-11-01',
  end: '2025-11-30'
});

// Returns: {
//   totalActions: 450,
//   loginCount: 30,
//   ordersHandled: 200,
//   averageResponseTime: '2m 30s',
//   mostCommonActions: [...]
// }
```

**Parameters:**
- `staffId` (string, required)
- `dateRange` (object, required)

**Returns:** Promise<ActivitySummary>

---

#### `permissions.js`

```javascript
import {
  hasPermission,
  checkPermissions,
  getRolePermissions,
  canAccessResource
} from '@domains/staff';
```

##### `hasPermission(userId, permission)`
Check if user has a specific permission.

```javascript
const canEditMenu = await hasPermission('user-123', 'menu:edit');

if (canEditMenu) {
  // Allow menu editing
}
```

**Parameters:**
- `userId` (string, required): User/staff ID
- `permission` (string, required): Permission to check

**Returns:** Promise<boolean>

**Common Permissions:**
- `menu:view`, `menu:edit`, `menu:delete`
- `orders:view`, `orders:edit`, `orders:cancel`
- `staff:view`, `staff:edit`, `staff:delete`
- `analytics:view`, `analytics:export`
- `settings:view`, `settings:edit`

---

##### `checkPermissions(userId, permissions)`
Check multiple permissions at once.

```javascript
const permissions = await checkPermissions('user-123', [
  'menu:edit',
  'orders:view',
  'analytics:view'
]);

// Returns: {
//   'menu:edit': true,
//   'orders:view': true,
//   'analytics:view': false
// }
```

**Parameters:**
- `userId` (string, required)
- `permissions` (array, required): List of permissions to check

**Returns:** Promise<Object> - Permission map

---

##### `getRolePermissions(role)`
Get all permissions for a role.

```javascript
const waiterPerms = getRolePermissions('waiter');
// Returns: ['orders:view', 'orders:edit', 'tables:view', ...]

const managerPerms = getRolePermissions('manager');
// Returns: ['menu:*', 'orders:*', 'staff:view', 'analytics:view', ...]
```

**Parameters:**
- `role` (string, required): 'waiter' | 'chef' | 'manager' | 'admin' | 'superadmin'

**Returns:** Array<string> - List of permissions

**Role Hierarchy:**
```
superadmin > owner > manager > chef/waiter
```

---

##### `canAccessResource(userId, resource, action)`
Check if user can perform action on resource.

```javascript
const canEdit = await canAccessResource(
  'user-123',
  { type: 'menu_item', id: 'item-456', restaurantId: 'restaurant-123' },
  'edit'
);
```

**Parameters:**
- `userId` (string, required)
- `resource` (object, required): Resource to check
- `action` (string, required): Action to perform

**Returns:** Promise<boolean>

---

## 🔔 Events

This domain emits the following events:

### `STAFF_CREATED`
```javascript
{
  type: 'STAFF_CREATED',
  payload: {
    staffId: 'staff-123',
    restaurantId: 'restaurant-123',
    name: 'John Doe',
    email: 'john@restaurant.com',
    role: 'waiter',
    createdBy: 'manager-456',
    timestamp: '2025-11-08T10:30:00Z'
  }
}
```

### `STAFF_UPDATED`
```javascript
{
  type: 'STAFF_UPDATED',
  payload: {
    staffId: 'staff-123',
    changes: { role: 'chef', status: 'active' },
    updatedBy: 'manager-456'
  }
}
```

### `STAFF_DELETED`
```javascript
{
  type: 'STAFF_DELETED',
  payload: {
    staffId: 'staff-123',
    deletedBy: 'manager-456',
    reason: 'resigned'
  }
}
```

### `STAFF_LOGIN`
```javascript
{
  type: 'STAFF_LOGIN',
  payload: {
    staffId: 'staff-123',
    restaurantId: 'restaurant-123',
    timestamp: '2025-11-08T10:00:00Z',
    ipAddress: '192.168.1.100'
  }
}
```

### `STAFF_LOGOUT`
```javascript
{
  type: 'STAFF_LOGOUT',
  payload: {
    staffId: 'staff-123',
    sessionDuration: '8h 45m'
  }
}
```

### `ACTIVITY_LOGGED`
```javascript
{
  type: 'ACTIVITY_LOGGED',
  payload: {
    activityId: 'activity-789',
    staffId: 'staff-123',
    action: 'order_updated',
    details: {...}
  }
}
```

---

## 📊 Database Schema

### `staff` table
```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  restaurant_id UUID REFERENCES restaurants(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL, -- 'waiter', 'chef', 'manager', 'admin'
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  permissions JSONB,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
```

### `activity_logs` table
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id),
  restaurant_id UUID REFERENCES restaurants(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_activity_logs_staff_id` on `staff_id`
- `idx_activity_logs_restaurant_id` on `restaurant_id`
- `idx_activity_logs_created_at` on `created_at`
- `idx_activity_logs_action` on `action`

---

## 🔗 Dependencies

### Internal Dependencies
```javascript
// Shared utilities
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatDateTime } from '@shared/utils/helpers/formatters';

// Shared components
import { Form } from '@shared/components/compounds/Form';
import { Input } from '@shared/components/primitives/Input';
import { Select } from '@shared/components/primitives/Select';

// Shared contexts
import { useAuth } from '@shared/contexts/AuthContext';
```

### External Dependencies
- `@supabase/supabase-js` - Database and auth
- `react` - Component framework
- `react-hook-form` - Form management
- `zod` - Validation

---

## 🎨 Usage Examples

### Example 1: Create Staff Member
```jsx
import { StaffForm } from '@domains/staff';
import { logActivity } from '@domains/staff';

function AddStaffPage() {
  const { user } = useAuth();

  const handleSubmit = async (formData) => {
    // Create staff member
    const { data: staff } = await supabase
      .from('staff')
      .insert({
        restaurant_id: user.restaurant_id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions
      })
      .select()
      .single();

    // Log activity
    await logActivity({
      staffId: user.id,
      restaurantId: user.restaurant_id,
      action: 'staff_created',
      details: { newStaffId: staff.id, role: staff.role }
    });

    toast.success('Staff member added successfully');
  };

  return (
    <StaffForm
      restaurantId={user.restaurant_id}
      onSubmit={handleSubmit}
      mode="create"
    />
  );
}
```

### Example 2: Permission Checking
```jsx
import { hasPermission, checkPermissions } from '@domains/staff';

function MenuManagementPage() {
  const { user } = useAuth();
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const hasAccess = await hasPermission(user.id, 'menu:edit');
      setCanEdit(hasAccess);
    }
    checkAccess();
  }, [user]);

  return (
    <div>
      <MenuList />
      {canEdit && <AddMenuItemButton />}
    </div>
  );
}
```

### Example 3: Activity Logging with Hook
```jsx
import { useEffect } from 'react';
import { logActivity } from '@domains/staff';
import { useAuth } from '@shared/contexts/AuthContext';

function useActivityLogger() {
  const { user } = useAuth();

  const log = useCallback(async (action, details) => {
    if (!user) return;

    await logActivity({
      staffId: user.id,
      restaurantId: user.restaurant_id,
      action,
      details,
      ipAddress: await getClientIP(),
      userAgent: navigator.userAgent
    });
  }, [user]);

  return { log };
}

// Usage
function OrderUpdateComponent() {
  const { log } = useActivityLogger();

  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    
    // Log the activity
    await log('order_status_changed', {
      orderId,
      newStatus,
      previousStatus: order.status
    });
  };
}
```

### Example 4: Role-Based UI
```jsx
import { getRolePermissions } from '@domains/staff';
import { useAuth } from '@shared/contexts/AuthContext';

function DashboardLayout() {
  const { user } = useAuth();
  const permissions = getRolePermissions(user.role);

  return (
    <nav>
      {permissions.includes('orders:view') && (
        <NavLink to="/orders">Orders</NavLink>
      )}
      {permissions.includes('menu:edit') && (
        <NavLink to="/menu">Menu Management</NavLink>
      )}
      {permissions.includes('analytics:view') && (
        <NavLink to="/analytics">Analytics</NavLink>
      )}
      {permissions.includes('staff:view') && (
        <NavLink to="/staff">Staff Management</NavLink>
      )}
    </nav>
  );
}
```

---

## 🧪 Testing

### Unit Tests
```javascript
describe('permissions', () => {
  it('should check permissions correctly', async () => {
    const hasAccess = await hasPermission('waiter-123', 'menu:edit');
    expect(hasAccess).toBe(false); // Waiters can't edit menu
  });

  it('should get role permissions', () => {
    const perms = getRolePermissions('manager');
    expect(perms).toContain('staff:view');
    expect(perms).toContain('analytics:view');
  });
});

describe('activityLogger', () => {
  it('should log activity', async () => {
    await logActivity({
      staffId: 'staff-123',
      restaurantId: 'restaurant-123',
      action: 'login'
    });

    const activities = await getActivityHistory({
      restaurantId: 'restaurant-123',
      staffId: 'staff-123'
    });

    expect(activities[0].action).toBe('login');
  });
});
```

### Integration Tests
```javascript
it('should enforce permissions in UI', async () => {
  // Login as waiter
  await loginAs('waiter');
  
  // Waiter should not see staff management
  const { queryByText } = render(<DashboardLayout />);
  expect(queryByText('Staff Management')).not.toBeInTheDocument();
  
  // Login as manager
  await loginAs('manager');
  
  // Manager should see staff management
  expect(queryByText('Staff Management')).toBeInTheDocument();
});
```

---

## 🔐 Security

### RLS Policies
- Staff can only view their own profile
- Managers can view/edit staff in their restaurant
- Activity logs are read-only for staff
- Superadmins have full access

### Security Best Practices
- All permissions checked server-side
- Activity logs are immutable
- Sensitive actions require re-authentication
- IP addresses and user agents logged
- Password changes logged

---

## 🚀 Performance

### Optimization Strategies
- **Caching:** Cache permissions for session duration
- **Indexing:** Database indexes on frequently queried fields
- **Batch operations:** Bulk permission checks
- **Lazy loading:** Load activity logs on demand

### Metrics
- Permission check: <50ms
- Activity log write: <100ms
- Staff list load: <500ms

---

## 🔄 Cross-Domain Integration

### Receives Events From:
- **Ordering Domain:** Order updates for activity logging
- **Billing Domain:** Payment actions for audit trail

### Sends Events To:
- **Analytics Domain:** Staff performance metrics
- **Notifications Domain:** Staff alerts and assignments

---

## 📝 Future Enhancements

- [ ] Shift scheduling and management
- [ ] Time tracking and attendance
- [ ] Performance reviews and ratings
- [ ] Commission and incentive tracking
- [ ] Staff training and certification
- [ ] Multi-location staff sharing
- [ ] Biometric authentication
- [ ] Staff mobile app

---

**Domain Owner:** Staff Team  
**Last Updated:** November 8, 2025  
**Version:** 1.0.0
