# 🔔 Notifications Domain

## Overview
The Notifications domain manages real-time user notifications, alerts, and in-app messaging across the Praahis platform. It provides a centralized system for delivering notifications to customers, waiters, chefs, managers, and superadmins.

---

## 📂 Structure

```
src/domains/notifications/
├── components/
│   └── NotificationBell.jsx    # Bell icon with notification count badge
├── utils/
│   ├── notifications.js         # Core notification utilities
│   ├── notificationStorage.js   # Local storage management
│   └── notificationHelpers.js   # Helper functions
├── events.js                    # Domain events
└── index.js                     # Public API exports
```

---

## 🎯 Purpose

### Business Capabilities
- Real-time notification delivery
- Notification badge management
- Notification history tracking
- User notification preferences
- Alert categorization and filtering

### Technical Responsibilities
- Subscribe to Supabase Realtime notifications
- Manage notification state
- Handle notification dismissal
- Provide notification UI components
- Integrate with other domains via events

---

## 🔌 Public API

### Components

#### `NotificationBell`
```jsx
import { NotificationBell } from '@domains/notifications';

// Usage
<NotificationBell />
```

**Props:**
- None (uses internal state)

**Features:**
- Shows unread notification count
- Opens notification panel on click
- Auto-updates with real-time notifications
- Responsive design

---

### Utilities

#### `notifications.js`

```javascript
import { 
  subscribeToNotifications,
  markAsRead,
  dismissNotification,
  getUnreadCount
} from '@domains/notifications';
```

**Functions:**

##### `subscribeToNotifications(userId, callback)`
Subscribe to real-time notifications for a user.

```javascript
const unsubscribe = subscribeToNotifications('user-123', (notification) => {
  console.log('New notification:', notification);
});

// Later: cleanup
unsubscribe();
```

**Parameters:**
- `userId` (string): User ID to subscribe to
- `callback` (function): Called when new notification arrives

**Returns:** Unsubscribe function

---

##### `markAsRead(notificationId)`
Mark a notification as read.

```javascript
await markAsRead('notification-456');
```

**Parameters:**
- `notificationId` (string): Notification ID

**Returns:** Promise<void>

---

##### `dismissNotification(notificationId)`
Dismiss/delete a notification.

```javascript
await dismissNotification('notification-456');
```

**Parameters:**
- `notificationId` (string): Notification ID

**Returns:** Promise<void>

---

##### `getUnreadCount(userId)`
Get count of unread notifications.

```javascript
const count = await getUnreadCount('user-123');
console.log(`${count} unread notifications`);
```

**Parameters:**
- `userId` (string): User ID

**Returns:** Promise<number>

---

## 🔔 Events

This domain emits the following events:

### `NOTIFICATION_RECEIVED`
```javascript
{
  type: 'NOTIFICATION_RECEIVED',
  payload: {
    id: 'notification-123',
    userId: 'user-456',
    title: 'Order Ready',
    message: 'Your order #42 is ready',
    type: 'order_update',
    createdAt: '2025-11-08T10:30:00Z'
  }
}
```

### `NOTIFICATION_READ`
```javascript
{
  type: 'NOTIFICATION_READ',
  payload: {
    notificationId: 'notification-123',
    userId: 'user-456'
  }
}
```

### `NOTIFICATION_DISMISSED`
```javascript
{
  type: 'NOTIFICATION_DISMISSED',
  payload: {
    notificationId: 'notification-123'
  }
}
```

---

## 📊 Database Schema

### `notifications` table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  restaurant_id UUID REFERENCES restaurants(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'order_update', 'payment', 'alert', 'info'
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  metadata JSONB
);
```

**Indexes:**
- `idx_notifications_user_id` on `user_id`
- `idx_notifications_restaurant_id` on `restaurant_id`
- `idx_notifications_created_at` on `created_at`

**RLS Policies:**
- Users can only see their own notifications
- Managers can see restaurant notifications
- Superadmins can see all notifications

---

## 🔗 Dependencies

### Internal Dependencies
```javascript
// Shared utilities
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatDateTime } from '@shared/utils/helpers/formatters';

// Shared components
import { Badge } from '@shared/components/primitives/Badge';
import { Modal } from '@shared/components/compounds/Modal';
```

### External Dependencies
- `@supabase/supabase-js` - Realtime subscriptions
- `react` - Component framework
- `lucide-react` - Bell icon

---

## 🎨 Usage Examples

### Example 1: Display Notification Bell
```jsx
import { NotificationBell } from '@domains/notifications';

function Header() {
  return (
    <header>
      <nav>
        <Logo />
        <NotificationBell />
        <UserMenu />
      </nav>
    </header>
  );
}
```

### Example 2: Subscribe to Notifications
```jsx
import { useEffect } from 'react';
import { subscribeToNotifications } from '@domains/notifications';
import { useAuth } from '@shared/contexts/AuthContext';

function NotificationProvider({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      // Show toast notification
      toast.success(notification.title, {
        description: notification.message
      });
    });

    return unsubscribe;
  }, [user]);

  return children;
}
```

### Example 3: Manual Notification Check
```jsx
import { getUnreadCount, markAsRead } from '@domains/notifications';

async function NotificationCenter() {
  const count = await getUnreadCount(userId);
  
  const handleMarkAllRead = async () => {
    const notifications = await fetchNotifications(userId);
    await Promise.all(
      notifications.map(n => markAsRead(n.id))
    );
  };

  return (
    <div>
      <h2>Notifications ({count})</h2>
      <button onClick={handleMarkAllRead}>Mark all read</button>
    </div>
  );
}
```

---

## 🧪 Testing

### Unit Tests
```javascript
// Test notification utilities
describe('notifications', () => {
  it('should subscribe to notifications', async () => {
    const callback = jest.fn();
    const unsubscribe = subscribeToNotifications('user-123', callback);
    
    // Simulate notification
    await triggerNotification('user-123');
    
    expect(callback).toHaveBeenCalled();
    unsubscribe();
  });

  it('should mark notification as read', async () => {
    await markAsRead('notification-123');
    const notification = await getNotification('notification-123');
    expect(notification.read).toBe(true);
  });
});
```

### Integration Tests
```javascript
// Test notification flow
it('should receive order notification when order placed', async () => {
  // Place order in ordering domain
  const order = await placeOrder(orderData);
  
  // Wait for notification
  await waitFor(() => {
    expect(getUnreadCount(userId)).resolves.toBe(1);
  });
  
  // Notification should contain order details
  const notifications = await fetchNotifications(userId);
  expect(notifications[0].message).toContain(order.id);
});
```

---

## 🔐 Security

### RLS Policies
- Users can only read their own notifications
- Notifications are scoped by restaurant_id for managers
- Superadmins have full access

### Data Privacy
- Notification content is sanitized
- PII is not stored in notification messages
- Sensitive data uses references (IDs) not actual values

---

## 🚀 Performance

### Optimization Strategies
- **Real-time subscriptions:** Use Supabase Realtime for instant delivery
- **Batching:** Group notifications to reduce database calls
- **Caching:** Cache unread count in local state
- **Lazy loading:** Load notification details on demand

### Metrics
- Notification delivery time: <500ms
- Unread count query: <100ms
- Real-time latency: <200ms

---

## 🔄 Cross-Domain Integration

### Receives Events From:
- **Ordering Domain:** Order status changes
- **Billing Domain:** Payment confirmations
- **Staff Domain:** Staff assignments

### Sends Events To:
- **Analytics Domain:** Notification metrics
- **Customer Pages:** Display notifications

### Example Integration:
```javascript
// Listen for order events
import { eventBus } from '@shared/utils/events/eventBus';
import { ORDER_EVENTS } from '@domains/ordering';

eventBus.on(ORDER_EVENTS.ORDER_STATUS_CHANGED, async ({ orderId, status }) => {
  // Create notification for customer
  await createNotification({
    userId: order.customerId,
    title: 'Order Update',
    message: `Your order #${orderId} is now ${status}`,
    type: 'order_update'
  });
});
```

---

## 📝 Future Enhancements

### Planned Features
- [ ] Push notifications (web push API)
- [ ] Email notification digest
- [ ] SMS notifications for critical alerts
- [ ] Notification preferences UI
- [ ] Notification categories and filters
- [ ] Notification scheduling
- [ ] Rich notification content (images, actions)

### Technical Improvements
- [ ] Add notification queue for reliability
- [ ] Implement retry mechanism
- [ ] Add notification analytics
- [ ] Support notification templates
- [ ] Add notification priority levels

---

## 🤝 Contributing

When adding features to this domain:

1. **Keep it focused:** Only notification-related logic
2. **Use events:** Communicate with other domains via event bus
3. **Document exports:** Update this README with new public APIs
4. **Add tests:** Unit tests for utilities, integration tests for flows
5. **Follow patterns:** Use existing code style and structure

---

## 📚 Related Documentation

- [Event System Guide](../../shared/utils/events/README.md)
- [Supabase Realtime Setup](../../../database/NOTIFICATIONS_README.md)
- [Testing Guide](../../../docs/testing/DOMAIN_TESTING.md)
- [Architecture Overview](../../../docs/ARCHITECTURE.md)

---

**Domain Owner:** Notifications Team  
**Last Updated:** November 8, 2025  
**Version:** 1.0.0
