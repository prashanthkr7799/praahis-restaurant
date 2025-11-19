# Session-Based Table Management System

## Overview

This document describes the implementation of a session-based table management system that tracks customer dining visits from QR code scan to feedback submission.

## Key Changes

### 1. Database Schema (`database/22_table_sessions.sql`)

**New Table: `table_sessions`**
- Tracks customer dining sessions from start to finish
- Fields: `id`, `table_id`, `restaurant_id`, `started_at`, `ended_at`, `status`
- Status values: `'active'`, `'completed'`, `'cancelled'`
- Unique constraint: Only one active session per table

**Modified Tables:**
- `orders`: Added `session_id` column (foreign key to table_sessions)
- `feedbacks`: Added `session_id` column (foreign key to table_sessions)
- `menu_item_ratings`: Added `session_id` column, made `order_id` nullable (session-based ratings)

**Helper Functions:**
- `get_or_create_table_session(p_table_id, p_restaurant_id)`: Creates or retrieves active session
- `end_table_session(p_session_id)`: Ends session and frees table automatically

**Security:**
- RLS policies allow public read/create
- Only authenticated users can update/delete
- Automatic table freeing when session ends

### 2. Backend Updates (`src/lib/supabaseClient.js`)

**Updated Functions:**
- `getOrCreateActiveSessionId()`: Now uses `table_sessions` table instead of `active_session_id` column
- `markTableOccupied()`: Creates session when customer scans QR code
- `createOrder()`: Automatically attaches `session_id` to orders

**New Functions:**
- `getSessionWithOrders(sessionId)`: Fetches session with all associated orders
- `endTableSession(sessionId)`: Ends session and frees table using database function

**Removed:**
- `generateUUID()` function (no longer needed, database handles session creation)

### 3. LocalStorage Management (`src/lib/localStorage.js`)

**New Session Functions:**
- `saveSession(tableId, sessionId)`: Persists session ID in localStorage
- `getSession(tableId)`: Retrieves session ID for table
- `clearSession(tableId)`: Removes session from localStorage

### 4. Customer Flow Updates

#### TablePage (`src/pages/TablePage.jsx`)
**Changes:**
- Imports session management functions
- Creates/fetches active session on mount
- Stores `session_id` in state and localStorage
- All orders automatically include `session_id`

**Session Lifecycle:**
```javascript
// On page load
const sessionId = await getOrCreateActiveSessionId(tableId);
saveSession(tableId, sessionId);
setSessionId(sessionId);
```

#### FeedbackPage (`src/pages/FeedbackPage.jsx`)
**Major Refactor:**
- Route changed from `/feedback/:orderId` to `/feedback/:sessionId`
- Uses `getSessionWithOrders()` to fetch all session orders
- Aggregates items across multiple orders in the session
- Saves feedback with `session_id` instead of `order_id`
- Calls `endTableSession()` to end session and free table
- Redirects to `/thank-you` instead of homepage

**Submit Flow:**
```javascript
// Save feedback with session
await supabase.from('feedbacks').insert([{
  session_id: sessionId,
  rating, comment, restaurant_id
}]);

// Mark all session orders as feedback submitted
await supabase.from('orders')
  .update({ feedback_submitted: true })
  .in('id', orderIds);

// End session (frees table automatically)
await endTableSession(sessionId);

// Redirect to Thank You page
navigate('/thank-you');
```

#### PostMealOptions (`src/pages/PostMealOptions.jsx`)
**Changes:**
- Route parameter changed from `orderId` to `sessionId`
- "No, thanks" button redirects to `/feedback/:sessionId`
- "Order more" returns to table page

#### OrderStatusPage (`src/pages/OrderStatusPage.jsx`)
**Changes:**
- When order is served, redirects to `/post-meal/:sessionId/:tableNumber`
- Uses `order.session_id` instead of `orderId`

### 5. New Components

#### ThankYouPage (`src/pages/ThankYouPage.jsx`)
**Features:**
- Clean, centered "Thank You" message
- Gradient background with decorative elements
- Auto-closes after 5 seconds using `window.close()`
- No navigation buttons (terminal page)
- Responsive design with animations

**Purpose:**
- Provides closure to dining experience
- Prevents accidental navigation back to feedback
- Works in kiosk/iframe mode with auto-close

### 6. Routing Updates (`src/App.jsx`)

**New Routes:**
```jsx
<Route path="/thank-you" element={<ThankYouPage />} />
```

**Updated Routes:**
```jsx
// Changed from orderId to sessionId
<Route path="/post-meal/:sessionId/:tableNumber" element={<PostMealOptions />} />
<Route path="/order-served/:sessionId/:tableNumber" element={<PostMealOptions />} />
<Route path="/feedback/:sessionId" element={<FeedbackPage />} />
```

## Session Lifecycle

### 1. **Session Start** (QR Scan)
- Customer scans QR code → lands on `/table/:id`
- `TablePage` calls `markTableOccupied(tableId)`
- System creates new session in `table_sessions` table
- Session ID stored in localStorage
- Table status → `'occupied'`

### 2. **During Session** (Multiple Orders)
- Customer browses menu, adds items to cart
- On checkout, `createOrder()` automatically attaches `session_id`
- Customer can place multiple orders (all linked to same session)
- Each order includes same `session_id`

### 3. **Post-Meal** (Order Served)
- When order status → `'served'`
- System redirects to `/post-meal/:sessionId/:tableNumber`
- Customer chooses:
  - "Order more" → returns to menu (same session continues)
  - "No, thanks" → proceeds to feedback

### 4. **Feedback** (Session End)
- Customer lands on `/feedback/:sessionId`
- System fetches ALL orders from the session
- Aggregates items across all orders
- Customer rates overall experience + individual items
- On submit:
  - Feedback saved with `session_id`
  - All session orders marked as `feedback_submitted`
  - `end_table_session()` called (session status → `'completed'`)
  - Table status → `'available'`
  - Redirect to `/thank-you`

### 5. **Thank You Page** (Terminal)
- Displays gratitude message
- Auto-closes after 5 seconds
- No navigation options
- Session complete ✅

## Benefits

### 1. **Accurate Visit Tracking**
- One feedback per dining visit (not per order)
- Handles multiple orders in single session
- No duplicate feedbacks

### 2. **Better Data Aggregation**
- All orders grouped by session
- Feedback applies to entire visit
- Item ratings across all orders

### 3. **Improved UX**
- Customer sees all items they ordered
- Natural flow from QR scan to departure
- Clear session boundaries

### 4. **Table Management**
- Automatic table freeing after feedback
- Prevents orphaned sessions
- One active session per table constraint

### 5. **Analytics Ready**
- Session duration tracking
- Multi-order visit patterns
- Accurate visit-level metrics

## Migration Notes

### Database Migration
Run `database/22_table_sessions.sql` to:
1. Create `table_sessions` table
2. Add `session_id` to `orders` and `feedbacks`
3. Create helper functions
4. Set up RLS policies

### Backward Compatibility
- Old `active_session_id` column in `tables` is no longer used
- Can be removed in future cleanup migration
- System now uses proper `table_sessions` table

### Testing Checklist
- [ ] QR scan creates new session
- [ ] Session ID persists in localStorage
- [ ] Multiple orders share same session_id
- [ ] Feedback page shows all session items
- [ ] Feedback submission ends session
- [ ] Table automatically freed after feedback
- [ ] Thank You page displays and auto-closes
- [ ] Only one active session per table enforced

## Files Modified

**Database:**
- `database/22_table_sessions.sql` (new)

**Backend:**
- `src/lib/supabaseClient.js`
- `src/lib/localStorage.js`

**Components:**
- `src/pages/TablePage.jsx`
- `src/pages/FeedbackPage.jsx`
- `src/pages/PostMealOptions.jsx`
- `src/pages/OrderStatusPage.jsx`
- `src/pages/ThankYouPage.jsx` (new)
- `src/App.jsx`

## Summary

The session-based system provides a complete dining visit lifecycle from QR scan to feedback, with proper session management, automatic table freeing, and improved customer experience. The system is now ready for deployment after running the database migration.
