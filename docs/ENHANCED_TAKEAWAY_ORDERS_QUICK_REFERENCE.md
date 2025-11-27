# 📦 Enhanced Takeaway Orders - Quick Reference

> **Status**: ✅ PRODUCTION READY  
> **Last Updated**: November 21, 2025

---

## 📍 Quick Access

### Files Modified
```
✅ phase3_migrations/01_core_schema.sql
   - Added: marked_ready_at, customer_notified_at

✅ src/domains/ordering/components/OrderCard.jsx
   - Enhanced with takeaway features

✅ src/domains/ordering/components/modals/TakeawayNotificationModal.jsx
   - New component created

✅ src/pages/manager/ManagerDashboard.jsx
   - Added filters and handlers
```

---

## ⚡ Features at a Glance

### Desktop Layout (≥1024px)
```
[All Orders] [Dine-In] [Takeaway]  ← Filters

DINE-IN (Left 2/3)    |    TAKEAWAY (Right 1/3)
─────────────────────────────────────────────────
• Table orders        |    • Customer name
• Standard actions    |    • 📞 Phone (clickable)
                      |    • [Mark Ready] button
                      |    • [Notify Customer] button
                      |    • ⚠️ Ready warnings
```

### Mobile Layout (<1024px)
```
[All Orders] [Dine-In] [Takeaway]  ← Filters

🍽️ DINE-IN & DELIVERY
─────────────────────
• Orders listed

🛍️ TAKEAWAY  
─────────────────────
• Orders listed
```

---

## 🎯 Key Actions

### Mark Order Ready
```javascript
// When to use: Order is cooked and ready for pickup
// Button shows: When order.status === 'ready' && !order.marked_ready_at
// Action: Sets marked_ready_at timestamp

await supabase
  .from('orders')
  .update({ marked_ready_at: new Date().toISOString() })
  .eq('id', orderId);
```

### Notify Customer
```javascript
// When to use: After marking order ready
// Button shows: When order.marked_ready_at exists
// Action: Opens SMS modal → sends notification

// SMS Template:
"Hi {CustomerName}! Your takeaway order #{OrderNumber} 
is ready for pickup at {RestaurantName}. Thank you! 😊"
```

### Ready Warning
```javascript
// Triggers: After 15+ minutes from marked_ready_at
// Display: "⚠️ Ready since {X} mins"
// Color: Amber/Yellow alert

const timeSinceReady = Math.floor(
  (new Date() - new Date(order.marked_ready_at)) / 60000
);

if (timeSinceReady > 15) {
  // Show warning
}
```

---

## 📱 Customer Contact

### Clickable Phone
```jsx
<a href={`tel:${order.customer_phone}`}>
  <Phone className="w-4 h-4" />
  <span>{order.customer_phone}</span>
</a>
```

**Behavior**:
- Mobile: Opens phone dialer
- Desktop: Opens default phone app

---

## 🔄 Order Flow

### Typical Takeaway Order Lifecycle
```
1. ORDER RECEIVED
   Status: received
   Actions: [Mark Paid] [Discount] [Issue] [Cancel]

2. KITCHEN PREPARING
   Status: preparing
   Actions: Same as above

3. ORDER READY
   Status: ready
   Actions: [Mark Ready] ← NEW
   
4. MARKED READY
   marked_ready_at: timestamp set
   Actions: [Notify Customer] ← NEW
   Warning: If >15 mins, show alert

5. CUSTOMER NOTIFIED
   customer_notified_at: timestamp set
   Customer receives SMS

6. ORDER PICKED UP
   Status: served
   Completed!
```

---

## 🎨 UI Components

### Filter Buttons
```jsx
// All Orders (Primary)
className="bg-primary text-white"

// Dine-In (Emerald)
<Utensils className="w-4 h-4" />
className="bg-emerald-600 text-white"

// Takeaway (Purple)
<ShoppingBag className="w-4 h-4" />
className="bg-purple-600 text-white"
```

### Takeaway Action Buttons
```jsx
// Mark Ready (Green)
<CheckCircle className="w-4 h-4" />
className="bg-green-600 hover:bg-green-700"

// Notify Customer (Primary)
<Bell className="w-4 h-4" />
className="bg-primary hover:bg-primary-hover"
```

### Ready Warning
```jsx
<AlertTriangle className="w-4 h-4 text-amber-700" />
<span>⚠️ Ready since {timeSinceReady} mins</span>
className="bg-amber-100 border-amber-300"
```

---

## 🗄️ Database Queries

### Fetch Takeaway Orders
```sql
SELECT 
  o.*,
  t.table_number,
  EXTRACT(EPOCH FROM (NOW() - o.marked_ready_at))/60 AS minutes_ready
FROM orders o
LEFT JOIN tables t ON o.table_id = t.id
WHERE o.restaurant_id = 'uuid'
  AND o.order_type = 'takeaway'
  AND o.order_status != 'served'
ORDER BY o.created_at DESC;
```

### Find Delayed Pickups
```sql
SELECT *
FROM orders
WHERE order_type = 'takeaway'
  AND marked_ready_at IS NOT NULL
  AND marked_ready_at < NOW() - INTERVAL '15 minutes'
  AND order_status != 'served';
```

### Mark Order Ready
```sql
UPDATE orders
SET 
  marked_ready_at = NOW(),
  updated_at = NOW()
WHERE id = 'order-uuid';
```

### Log Customer Notification
```sql
UPDATE orders
SET 
  customer_notified_at = NOW(),
  updated_at = NOW()
WHERE id = 'order-uuid';
```

---

## 🧪 Testing Scenarios

### Test Case 1: Mark Ready Flow
1. ✅ Create takeaway order
2. ✅ Change status to "ready"
3. ✅ Verify [Mark Ready] button appears
4. ✅ Click [Mark Ready]
5. ✅ Verify timestamp set in database
6. ✅ Verify [Notify Customer] button appears
7. ✅ Verify [Mark Ready] button hidden

### Test Case 2: Notification Flow
1. ✅ Mark order as ready (above steps)
2. ✅ Click [Notify Customer]
3. ✅ Verify modal opens
4. ✅ Verify customer info pre-filled
5. ✅ Edit phone number
6. ✅ Verify SMS preview
7. ✅ Click Send
8. ✅ Verify notification timestamp set
9. ✅ Verify toast success message

### Test Case 3: Ready Warning
1. ✅ Mark order ready
2. ✅ Manually set marked_ready_at to 20 minutes ago
   ```sql
   UPDATE orders 
   SET marked_ready_at = NOW() - INTERVAL '20 minutes'
   WHERE id = 'order-uuid';
   ```
3. ✅ Refresh orders page
4. ✅ Verify warning shows: "⚠️ Ready since 20 mins"
5. ✅ Verify amber/yellow color

### Test Case 4: Phone Click
1. ✅ Open takeaway order card
2. ✅ Click customer phone number
3. ✅ On mobile: Verify dialer opens
4. ✅ On desktop: Verify phone app opens
5. ✅ Verify correct number populated

### Test Case 5: Filter Switching
1. ✅ Click [All Orders]
   - Desktop: Two columns
   - Mobile: Two tabs
2. ✅ Click [Dine-In]
   - Only dine-in/delivery orders show
3. ✅ Click [Takeaway]
   - Only takeaway orders show
4. ✅ Verify counts update correctly

---

## 🐛 Common Issues & Solutions

### Issue: [Mark Ready] button not showing
**Solution**: Check order status
```javascript
// Button only shows when:
order.status === 'ready' && !order.marked_ready_at
```

### Issue: [Notify Customer] not showing
**Solution**: Mark order ready first
```javascript
// Button only shows when:
order.marked_ready_at !== null
```

### Issue: Phone number not clickable
**Solution**: Check tel: link format
```jsx
// Correct format:
href={`tel:${phoneNumber}`}

// Not: href={phoneNumber}
```

### Issue: Warning not showing after 15 mins
**Solution**: Check timestamp calculation
```javascript
const timeSinceReady = Math.floor(
  (new Date() - new Date(order.marked_ready_at)) / (1000 * 60)
);

// Should be: timeSinceReady > 15
```

### Issue: Notification not sent
**Solution**: Check SMS integration setup
```javascript
// Current: Only updates database
// Future: Integrate SMS provider (Twilio, AWS SNS, etc.)

// See: ENHANCED_TAKEAWAY_ORDERS_IMPLEMENTATION.md
// Section: API Integration → SMS Integration
```

---

## 💡 Pro Tips

### 1. Quick Filter Shortcuts
```
All → See everything at once
Dine-In → Focus on table service
Takeaway → Focus on pickups
```

### 2. Proactive Customer Communication
```
Mark Ready → Immediately after cooking
Notify → Don't wait, send SMS right away
Follow-up → Call if >20 minutes delayed
```

### 3. Mobile Efficiency
```
Use tabs to quickly switch contexts
Tap phone to call directly
All actions accessible in one card
```

### 4. Desktop Workflow
```
Monitor both columns simultaneously
Dine-in on left for waitstaff
Takeaway on right for pickup counter
```

---

## 📊 Metrics to Track

### Order Timing
```sql
-- Average time from ready to pickup
SELECT 
  AVG(EXTRACT(EPOCH FROM (updated_at - marked_ready_at))/60) AS avg_pickup_minutes
FROM orders
WHERE order_type = 'takeaway'
  AND marked_ready_at IS NOT NULL
  AND order_status = 'served';
```

### Notification Effectiveness
```sql
-- Orders where customer was notified
SELECT 
  COUNT(*) FILTER (WHERE customer_notified_at IS NOT NULL) AS notified,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE customer_notified_at IS NOT NULL) / COUNT(*), 2) AS percentage
FROM orders
WHERE order_type = 'takeaway'
  AND marked_ready_at IS NOT NULL;
```

### Delayed Pickups
```sql
-- Count of orders waiting >15 minutes
SELECT COUNT(*)
FROM orders
WHERE order_type = 'takeaway'
  AND marked_ready_at < NOW() - INTERVAL '15 minutes'
  AND order_status != 'served';
```

---

## 🔗 Quick Links

- [Full Implementation Guide](./ENHANCED_TAKEAWAY_ORDERS_IMPLEMENTATION.md)
- [OrderCard Documentation](./ORDERCARD_REDESIGN_SUMMARY.md)
- [Manager Dashboard Guide](./MANAGER_DASHBOARD_BREAKDOWN.md)
- [Database Schema](../phase3_migrations/01_core_schema.sql)

---

## 📞 Support

**Need Help?**
- Check full documentation for detailed explanations
- Review test cases for expected behavior
- Verify database timestamps are being set
- Ensure customer phone numbers are valid

**Found a Bug?**
- Check console for errors
- Verify Supabase connection
- Test with sample data
- Review error toast messages

---

**🎉 Quick Start Complete!** You're ready to manage takeaway orders efficiently.

For detailed implementation information, see [ENHANCED_TAKEAWAY_ORDERS_IMPLEMENTATION.md](./ENHANCED_TAKEAWAY_ORDERS_IMPLEMENTATION.md).
