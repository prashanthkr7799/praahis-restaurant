# 🍽️ Ordering Domain

## Overview
The Ordering domain is the heart of the Praahis platform, managing the complete customer ordering experience from menu browsing to order placement, tracking, and fulfillment. It handles menu management, cart operations, order processing, and real-time order status updates.

---

## 📂 Structure

```
src/domains/ordering/
├── components/
│   ├── CallWaiterButton.jsx     # Request waiter assistance
│   ├── CartSummary.jsx          # Shopping cart display
│   ├── CategoryTabs.jsx         # Menu category navigation
│   ├── DishCard.jsx             # Menu item display card
│   ├── MenuItem.jsx             # Detailed menu item
│   ├── MenuItemForm.jsx         # Menu item CRUD form
│   ├── OrderCard.jsx            # Order display card
│   ├── OrdersTable.jsx          # Orders data table
│   └── TableGridView.jsx        # Table layout view
├── hooks/
│   └── useRealtimeOrders.js     # Real-time order subscriptions
├── utils/
│   └── orderHelpers.js          # Order utility functions
├── events.js                    # Domain events
└── index.js                     # Public API exports
```

---

## 🎯 Purpose

### Business Capabilities
- Menu browsing and search
- Cart management (add, update, remove items)
- Order placement and checkout
- Real-time order tracking
- Order status management (kitchen workflow)
- Table session management
- Special requests and customizations

### Technical Responsibilities
- Menu data fetching and caching
- Cart state management
- Order validation and submission
- Real-time order synchronization
- Order status transitions
- Integration with billing domain

---

## 🔌 Public API

### Components

#### `MenuItem`
```jsx
import { MenuItem } from '@domains/ordering';

<MenuItem
  item={{
    id: 'item-123',
    name: 'Butter Chicken',
    price: 350,
    category: 'main-course',
    image: '/images/butter-chicken.jpg',
    description: 'Creamy tomato-based curry',
    isVeg: false,
    isAvailable: true
  }}
  onAddToCart={(item, quantity) => console.log('Added:', item)}
  showAddButton={true}
/>
```

**Props:**
- `item` (object, required): Menu item data
- `onAddToCart` (function, optional): Add to cart handler
- `showAddButton` (boolean, optional): Show/hide add button
- `disabled` (boolean, optional): Disable interactions

**Features:**
- Responsive card layout
- Veg/non-veg indicator
- Availability badge
- Image lazy loading
- Quantity selector
- Customization options

---

#### `CartSummary`
```jsx
import { CartSummary } from '@domains/ordering';

<CartSummary
  items={cartItems}
  onUpdateQuantity={(itemId, quantity) => {}}
  onRemoveItem={(itemId) => {}}
  onCheckout={() => {}}
  subtotal={1200}
  tax={120}
  total={1320}
/>
```

**Props:**
- `items` (array, required): Cart items
- `onUpdateQuantity` (function, required): Update item quantity
- `onRemoveItem` (function, required): Remove item from cart
- `onCheckout` (function, required): Proceed to checkout
- `subtotal` (number, required): Subtotal amount
- `tax` (number, optional): Tax amount
- `total` (number, required): Total amount

**Features:**
- Item list with quantities
- Inline quantity editing
- Remove item functionality
- Price breakdown (subtotal, tax, total)
- Checkout button
- Empty cart state

---

#### `OrderCard`
```jsx
import { OrderCard } from '@domains/ordering';

<OrderCard
  order={{
    id: 'order-123',
    orderNumber: 42,
    status: 'preparing',
    items: [...],
    totalAmount: 1320,
    createdAt: '2025-11-08T10:30:00Z',
    table: 'T-5'
  }}
  onStatusChange={(orderId, newStatus) => {}}
  showActions={true}
/>
```

**Props:**
- `order` (object, required): Order data
- `onStatusChange` (function, optional): Status change handler
- `showActions` (boolean, optional): Show action buttons
- `variant` (string, optional): 'customer' | 'chef' | 'manager'

**Features:**
- Order details display
- Status badge with color coding
- Item list with quantities
- Status change buttons (for staff)
- Time elapsed indicator
- Print order functionality

---

#### `OrdersTable`
```jsx
import { OrdersTable } from '@domains/ordering';

<OrdersTable
  orders={orders}
  onViewDetails={(order) => {}}
  onStatusChange={(orderId, status) => {}}
  filters={{
    status: ['pending', 'preparing'],
    dateRange: { start: '2025-11-01', end: '2025-11-30' }
  }}
/>
```

**Props:**
- `orders` (array, required): Orders to display
- `onViewDetails` (function, optional): View details handler
- `onStatusChange` (function, optional): Status change handler
- `filters` (object, optional): Active filters
- `sortable` (boolean, optional): Enable column sorting

**Features:**
- Sortable columns
- Status filters
- Search functionality
- Pagination
- Bulk actions
- Export to CSV

---

### Hooks

#### `useRealtimeOrders`
```jsx
import { useRealtimeOrders } from '@domains/ordering';

function KitchenDisplay() {
  const { orders, loading, error } = useRealtimeOrders({
    restaurantId: 'restaurant-123',
    status: ['pending', 'preparing'],
    autoRefresh: true
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <OrdersList orders={orders} />;
}
```

**Parameters:**
- `restaurantId` (string, required): Restaurant ID
- `status` (array, optional): Filter by status
- `autoRefresh` (boolean, optional): Enable real-time updates
- `limit` (number, optional): Max orders to fetch

**Returns:**
```javascript
{
  orders: [],        // Real-time order list
  loading: false,    // Loading state
  error: null,       // Error object
  refetch: fn        // Manual refetch function
}
```

---

### Utilities

#### `orderHelpers.js`

```javascript
import {
  calculateOrderTotal,
  validateOrder,
  formatOrderNumber,
  getNextStatus,
  canTransitionToStatus
} from '@domains/ordering';
```

##### `calculateOrderTotal(items, taxRate, discounts)`
Calculate order total with tax and discounts.

```javascript
const total = calculateOrderTotal(
  cartItems,
  0.05, // 5% tax
  { type: 'percentage', value: 10 } // 10% discount
);
// Returns: { subtotal: 1000, tax: 45, discount: 100, total: 945 }
```

**Parameters:**
- `items` (array): Order items with prices
- `taxRate` (number, optional): Tax rate (0.05 = 5%)
- `discounts` (object, optional): Discount configuration

**Returns:** Order total breakdown object

---

##### `validateOrder(order)`
Validate order before submission.

```javascript
const validation = validateOrder({
  items: cartItems,
  tableId: 'table-5',
  restaurantId: 'restaurant-123'
});

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

**Parameters:**
- `order` (object): Order to validate

**Returns:**
```javascript
{
  valid: true,
  errors: []
}
```

---

##### `getNextStatus(currentStatus, userRole)`
Get next valid order status based on current status and user role.

```javascript
const nextStatus = getNextStatus('pending', 'chef');
// Returns: 'preparing'

const availableStatuses = getNextStatus('preparing', 'chef');
// Returns: ['ready', 'cancelled']
```

**Parameters:**
- `currentStatus` (string): Current order status
- `userRole` (string): User role making the change

**Returns:** String or array of next valid statuses

---

##### `canTransitionToStatus(fromStatus, toStatus, userRole)`
Check if status transition is allowed.

```javascript
const canChange = canTransitionToStatus('pending', 'completed', 'customer');
// Returns: false (customers can't mark as completed)

const canCancel = canTransitionToStatus('pending', 'cancelled', 'customer');
// Returns: true (customers can cancel pending orders)
```

**Parameters:**
- `fromStatus` (string): Current status
- `toStatus` (string): Target status
- `userRole` (string): User role

**Returns:** Boolean

---

## 🔔 Events

This domain emits the following events:

### `ORDER_PLACED`
```javascript
{
  type: 'ORDER_PLACED',
  payload: {
    orderId: 'order-123',
    orderNumber: 42,
    restaurantId: 'restaurant-123',
    customerId: 'user-456',
    tableId: 'table-5',
    items: [...],
    totalAmount: 1320,
    timestamp: '2025-11-08T10:30:00Z'
  }
}
```

### `ORDER_STATUS_CHANGED`
```javascript
{
  type: 'ORDER_STATUS_CHANGED',
  payload: {
    orderId: 'order-123',
    oldStatus: 'pending',
    newStatus: 'preparing',
    changedBy: 'chef-789',
    timestamp: '2025-11-08T10:35:00Z'
  }
}
```

### `ORDER_COMPLETED`
```javascript
{
  type: 'ORDER_COMPLETED',
  payload: {
    orderId: 'order-123',
    totalAmount: 1320,
    completedAt: '2025-11-08T11:00:00Z'
  }
}
```

### `ORDER_CANCELLED`
```javascript
{
  type: 'ORDER_CANCELLED',
  payload: {
    orderId: 'order-123',
    reason: 'customer_request',
    cancelledBy: 'user-456'
  }
}
```

### `ITEM_ADDED_TO_CART`
```javascript
{
  type: 'ITEM_ADDED_TO_CART',
  payload: {
    itemId: 'item-123',
    quantity: 2,
    customizations: {...}
  }
}
```

---

## 📊 Database Schema

### `orders` table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  table_id UUID REFERENCES tables(id),
  customer_id UUID REFERENCES auth.users(id),
  order_number INTEGER,
  status TEXT NOT NULL, -- 'pending', 'preparing', 'ready', 'completed', 'cancelled'
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  special_instructions TEXT,
  payment_status TEXT, -- 'pending', 'completed', 'failed'
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);
```

### `order_items` table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  customizations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `menu_items` table
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_veg BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 Dependencies

### Internal Dependencies
```javascript
// Shared utilities
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency, formatDateTime } from '@shared/utils/helpers/formatters';

// Shared components
import { Button } from '@shared/components/primitives/Button';
import { Badge } from '@shared/components/primitives/Badge';
import { Modal } from '@shared/components/compounds/Modal';

// Shared hooks
import { useRestaurant } from '@shared/contexts/RestaurantContext';
```

### External Dependencies
- `@supabase/supabase-js` - Real-time subscriptions
- `react` - Component framework
- `lucide-react` - Icons
- `date-fns` - Date formatting

---

## 🎨 Usage Examples

### Example 1: Customer Menu Page
```jsx
import { MenuItem, CartSummary } from '@domains/ordering';
import { useState } from 'react';

function MenuPage() {
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const handleAddToCart = (item, quantity) => {
    setCart(prev => [...prev, { ...item, quantity }]);
  };

  return (
    <div>
      <div className="menu-grid">
        {menuItems.map(item => (
          <MenuItem
            key={item.id}
            item={item}
            onAddToCart={handleAddToCart}
            showAddButton={true}
          />
        ))}
      </div>

      <CartSummary
        items={cart}
        onUpdateQuantity={(id, qty) => {/* update */}}
        onRemoveItem={(id) => {/* remove */}}
        onCheckout={() => {/* checkout */}}
        total={calculateTotal(cart)}
      />
    </div>
  );
}
```

### Example 2: Chef Kitchen Display
```jsx
import { useRealtimeOrders, OrderCard } from '@domains/ordering';
import { updateOrderStatus } from '@domains/ordering';

function KitchenDisplay() {
  const { orders, loading } = useRealtimeOrders({
    restaurantId: restaurantId,
    status: ['pending', 'preparing'],
    autoRefresh: true
  });

  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    // Real-time hook will auto-update
  };

  return (
    <div className="kitchen-grid">
      {orders.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          onStatusChange={handleStatusChange}
          variant="chef"
        />
      ))}
    </div>
  );
}
```

### Example 3: Order Placement
```jsx
import { calculateOrderTotal, validateOrder } from '@domains/ordering';
import { supabase } from '@shared/utils/api/supabaseClient';

async function placeOrder(cart, tableId, restaurantId) {
  // Calculate total
  const totals = calculateOrderTotal(cart, 0.05);

  // Validate order
  const validation = validateOrder({
    items: cart,
    tableId,
    restaurantId
  });

  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  // Create order
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      status: 'pending',
      total_amount: totals.total,
      tax_amount: totals.tax
    })
    .select()
    .single();

  // Create order items
  const orderItems = cart.map(item => ({
    order_id: order.id,
    item_id: item.id,
    quantity: item.quantity,
    unit_price: item.price,
    subtotal: item.price * item.quantity
  }));

  await supabase.from('order_items').insert(orderItems);

  return order;
}
```

---

## 🧪 Testing

### Unit Tests
```javascript
describe('orderHelpers', () => {
  it('should calculate order total correctly', () => {
    const items = [
      { price: 100, quantity: 2 }, // 200
      { price: 150, quantity: 1 }  // 150
    ];

    const result = calculateOrderTotal(items, 0.05);
    
    expect(result.subtotal).toBe(350);
    expect(result.tax).toBe(17.5);
    expect(result.total).toBe(367.5);
  });

  it('should validate order correctly', () => {
    const invalidOrder = { items: [], tableId: null };
    const validation = validateOrder(invalidOrder);
    
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Order must have at least one item');
  });
});
```

### Integration Tests
```javascript
it('should place order and update real-time display', async () => {
  // Place order as customer
  const order = await placeOrder(cart, tableId, restaurantId);
  
  // Verify order appears in kitchen display
  const { orders } = useRealtimeOrders({ restaurantId, status: ['pending'] });
  
  await waitFor(() => {
    expect(orders).toContainEqual(expect.objectContaining({
      id: order.id,
      status: 'pending'
    }));
  });
});
```

---

## 🚀 Performance

### Optimization Strategies
- **Real-time subscriptions:** Use Supabase Realtime for instant updates
- **Optimistic updates:** Update UI immediately, sync with backend
- **Image lazy loading:** Load menu item images on demand
- **Pagination:** Load menu items in chunks
- **Caching:** Cache menu data for 5 minutes

### Metrics
- Menu load time: <1s for 100 items
- Order placement: <500ms
- Real-time update latency: <200ms
- Cart operations: <50ms

---

## 🔄 Cross-Domain Integration

### Receives Events From:
- **Billing Domain:** Payment completion
- **Notifications Domain:** User preferences

### Sends Events To:
- **Notifications Domain:** Order updates
- **Analytics Domain:** Order metrics
- **Billing Domain:** Payment initiation

---

## 📝 Future Enhancements

- [ ] Order scheduling (pre-orders)
- [ ] Menu recommendations (AI-based)
- [ ] Combo meals and bundles
- [ ] Split bill functionality
- [ ] Kitchen printer integration
- [ ] Voice ordering
- [ ] QR code menu ordering

---

**Domain Owner:** Ordering Team  
**Last Updated:** November 8, 2025  
**Version:** 1.0.0
