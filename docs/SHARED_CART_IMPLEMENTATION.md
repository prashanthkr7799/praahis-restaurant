# Shared Cart & Feedback Status Implementation Guide

## Overview
This document outlines the changes needed to implement:
1. **Shared cart system** - All devices at same table share ONE cart via Supabase real-time
2. **Feedback status** - Orders show "Completed" in manager dashboard after feedback submitted

---

## ✅ COMPLETED: Database Schema Updates

### 1. Table Sessions Schema (phase3_migrations/08_table_sessions_and_auth.sql)
**DONE**: Added `cart_items JSONB DEFAULT '[]'` column to `table_sessions` table
- All devices at same table share this cart
- Real-time updates propagate automatically

### 2. Supabase Client Functions (src/shared/utils/api/supabaseClient.js)
**DONE**: Added shared cart functions:
```javascript
- getSharedCart(sessionId) // Fetch cart from table_sessions
- updateSharedCart(sessionId, cartItems) // Update cart, triggers real-time
- clearSharedCart(sessionId) // Clear after order creation
- subscribeToSharedCart(sessionId, callback) // Real-time sync
```

---

## 🔧 TODO: Frontend Cart Refactoring

### Phase 1: Update TablePage.jsx

**Current Flow (localStorage)**:
```javascript
1. Load: const savedCart = getCart(tableId)
2. Add: saveCart(tableId, newCart)
3. Update: saveCart(tableId, newCart)
4. Remove: saveCart(tableId, newCart)
5. Clear: clearCart(tableId)
```

**New Flow (Supabase shared cart)**:
```javascript
1. Load: 
   - Get/create sessionId via getOrCreateActiveSessionId(tableId)
   - const sharedCart = await getSharedCart(sessionId)
   - Subscribe to real-time updates: subscribeToSharedCart(sessionId, callback)

2. Add item:
   - Update local state immediately (optimistic)
   - await updateSharedCart(sessionId, newCart)
   - Real-time propagates to all devices

3. Update quantity:
   - Update local state
   - await updateSharedCart(sessionId, newCart)

4. Remove item:
   - Update local state
   - await updateSharedCart(sessionId, newCart)

5. Create order:
   - Proceed with order creation
   - await clearSharedCart(sessionId)
   - Navigate to payment
```

**Key Changes in TablePage.jsx**:

```javascript
// 1. Add session state
const [sessionId, setSessionId] = useState(null);

// 2. Initialize session and load shared cart
useEffect(() => {
  const initSession = async () => {
    try {
      const sid = await getOrCreateActiveSessionId(tableId);
      setSessionId(sid);
      
      // Load shared cart
      const sharedCart = await getSharedCart(sid);
      setCartItems(sharedCart);
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeToSharedCart(sid, (updatedCart) => {
        console.log('🔄 Cart synced from another device');
        setCartItems(updatedCart);
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to initialize session:', err);
    }
  };
  
  if (tableId) initSession();
}, [tableId]);

// 3. Replace all saveCart/clearCart calls with Supabase functions
const handleAddToCart = async (item) => {
  const newCart = [...cartItems, item];
  setCartItems(newCart); // Optimistic update
  
  try {
    await updateSharedCart(sessionId, newCart);
    toast.success('Added to cart');
  } catch (err) {
    console.error('Failed to sync cart:', err);
    setCartItems(cartItems); // Rollback on error
  }
};

const handleUpdateQuantity = async (index, newQuantity) => {
  const newCart = cartItems.map((item, i) => 
    i === index ? { ...item, quantity: newQuantity } : item
  );
  setCartItems(newCart);
  
  try {
    await updateSharedCart(sessionId, newCart);
  } catch (err) {
    console.error('Failed to sync cart:', err);
  }
};

const handleRemoveItem = async (index) => {
  const newCart = cartItems.filter((_, i) => i !== index);
  setCartItems(newCart);
  
  try {
    await updateSharedCart(sessionId, newCart);
  } catch (err) {
    console.error('Failed to sync cart:', err);
  }
};

const handleCheckout = async () => {
  // ... existing order creation logic ...
  
  // After successful order creation:
  await clearSharedCart(sessionId);
  navigate(`/payment/${orderId}`);
};
```

---

## 🎯 TODO: Manager Dashboard Feedback Status

### Update ManagerDashboard.jsx Recent Orders

**Current**: Orders show status from `order_status` column

**Required**: Show "Completed" when `feedback_submitted = true`

**Implementation**:

```javascript
// In ManagerDashboard.jsx recent orders section
const getDisplayStatus = (order) => {
  if (order.feedback_submitted) {
    return {
      label: 'Completed',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    };
  }
  
  // Existing status logic
  switch (order.order_status?.toLowerCase()) {
    case 'pending': return { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
    case 'preparing': return { label: 'Preparing', color: 'text-blue-400', bgColor: 'bg-blue-500/10' };
    case 'ready': return { label: 'Ready', color: 'text-orange-400', bgColor: 'bg-orange-500/10' };
    case 'served': return { label: 'Served', color: 'text-purple-400', bgColor: 'bg-purple-500/10' };
    default: return { label: order.order_status || 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-500/10' };
  }
};

// Render status badge
<span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}>
  {status.label}
</span>
```

**Database Note**: `feedback_submitted` column already exists in orders table (added in 01_core_schema.sql). When FeedbackPage.jsx updates feedback:

```javascript
// In FeedbackPage.jsx (already exists)
await supabase
  .from('orders')
  .update({
    feedback_submitted: true,
    feedback_submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .in('id', orderIds)
  .eq('restaurant_id', session.restaurant_id);
```

---

## 📋 Migration Steps

### 1. Run Database Migration
```bash
node run-migration-postgres.mjs
```
This will:
- Add `cart_items JSONB` column to `table_sessions`
- Update indexes and RLS policies

### 2. Update Frontend Files
- [ ] `src/pages/customer/TablePage.jsx` - Replace localStorage cart with shared cart
- [ ] `src/pages/manager/ManagerDashboard.jsx` - Add feedback status display logic
- [ ] Test multi-device cart sync
- [ ] Test feedback status display

### 3. Testing Checklist
- [ ] Scan QR on Device A, add items
- [ ] Scan same QR on Device B, verify items appear
- [ ] Add item on Device B, verify updates on Device A
- [ ] Create order, verify cart clears on both devices
- [ ] Submit feedback, verify status shows "Completed" in manager dashboard

---

## 🚨 Important Notes

1. **No localStorage fallback** - Cart is 100% in Supabase
2. **Network required** - Cart won't work offline (acceptable for restaurant use case)
3. **Session timeout** - Inactive carts auto-clear after 5 minutes (existing behavior)
4. **Order creation** - Still creates ONE order per checkout (no duplicates)
5. **Real-time delay** - Supabase real-time has ~100-300ms latency (acceptable)

---

## 🔍 Verification Queries

```sql
-- Check cart_items column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'table_sessions' AND column_name = 'cart_items';

-- View active sessions with carts
SELECT id, table_id, cart_items, last_activity_at 
FROM table_sessions 
WHERE status = 'active' AND jsonb_array_length(cart_items) > 0;

-- View orders with feedback
SELECT id, order_number, order_status, feedback_submitted, feedback_submitted_at 
FROM orders 
WHERE feedback_submitted = true 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🎨 UI Enhancements (Optional)

### Cart Sync Indicator
```jsx
{isSyncing && (
  <span className="text-xs text-muted-foreground flex items-center gap-1">
    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
    Syncing...
  </span>
)}
```

### Device Counter
```jsx
<span className="text-xs text-muted-foreground">
  {deviceCount} {deviceCount === 1 ? 'device' : 'devices'} viewing
</span>
```

---

## Summary

- ✅ Database schema updated (cart_items column added)
- ✅ Supabase client functions added
- 🔧 Frontend refactoring required (TablePage.jsx)
- 🔧 Manager dashboard status display required
- 📝 Testing required before production deployment

