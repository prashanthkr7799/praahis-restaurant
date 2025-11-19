# Session-Based Ordering Implementation Guide

## Quick Start

### 1. Run Database Migration

Execute the SQL migration to create the session system:

```bash
# Using Supabase CLI
supabase db push database/22_table_sessions.sql

# Or manually in Supabase dashboard
# Copy contents of database/22_table_sessions.sql
# Paste into SQL Editor and run
```

This will:
- Create `table_sessions` table
- Add `session_id` columns to `orders` and `feedbacks`
- Set up helper functions and RLS policies
- Create unique constraint for one active session per table

### 2. Test the Flow

#### Customer Journey:
1. **Scan QR Code** → `/table/:id`
   - Session created automatically
   - Session ID stored in localStorage
   - Table marked as occupied

2. **Order Food** (can repeat multiple times)
   - Add items to cart
   - Checkout creates order with `session_id`
   - Payment completed
   - Track order status

3. **Food Served**
   - System redirects to `/post-meal/:sessionId/:tableNumber`
   - Choose "Order more" or "No, thanks"

4. **Submit Feedback** → `/feedback/:sessionId`
   - See ALL items from ALL orders in session
   - Rate overall experience
   - Rate individual items
   - Submit feedback

5. **Thank You** → `/thank-you`
   - Confirmation message
   - Auto-closes after 5 seconds
   - Session ended, table freed

## Key Features

### Session Persistence
- Session ID stored in localStorage (key: `mealmate_session_{tableId}`)
- Survives page refreshes
- Cleared after feedback submission

### Multiple Orders Per Session
```javascript
// First order
Customer orders: Burger, Fries
Session ID: abc-123

// Second order (same session)
Customer orders: Dessert, Coffee
Session ID: abc-123 (same)

// Feedback shows ALL items
Burger, Fries, Dessert, Coffee
```

### Automatic Table Freeing
When feedback is submitted:
1. Session status → `'completed'`
2. Session `ended_at` → current timestamp
3. Table status → `'available'`
4. Table `active_session_id` → `NULL`

## Troubleshooting

### Session Not Created
**Symptom:** Orders don't have `session_id`

**Check:**
```sql
-- Verify table_sessions table exists
SELECT * FROM table_sessions LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'table_sessions';
```

**Fix:** Re-run migration `22_table_sessions.sql`

### Feedback Page Shows No Items
**Symptom:** Empty order items list

**Check:**
```javascript
// Console logs in FeedbackPage.jsx
"Could not load session items for ratings:"
```

**Verify:**
```sql
-- Check if session has orders
SELECT o.id, o.session_id, o.items
FROM orders o
WHERE o.session_id = 'YOUR_SESSION_ID';
```

### Table Not Freed After Feedback
**Symptom:** Table still shows as occupied

**Check:**
```sql
-- Verify function exists
SELECT proname FROM pg_proc WHERE proname = 'end_table_session';

-- Test function manually
SELECT end_table_session('YOUR_SESSION_ID');
```

**Verify:**
```sql
-- Check table status
SELECT id, status, updated_at FROM tables WHERE id = 'YOUR_TABLE_ID';
```

### Multiple Active Sessions
**Symptom:** Error "violates unique constraint"

**This is expected!** Only one active session per table is allowed.

**Check:**
```sql
-- Find active sessions for table
SELECT * FROM table_sessions
WHERE table_id = 'YOUR_TABLE_ID' AND status = 'active';
```

**Fix:** End old session before creating new one:
```sql
SELECT end_table_session('OLD_SESSION_ID');
```

## Database Queries

### View Active Sessions
```sql
SELECT 
  ts.id,
  ts.table_id,
  t.table_number,
  ts.started_at,
  ts.status,
  COUNT(o.id) as order_count
FROM table_sessions ts
LEFT JOIN tables t ON t.id = ts.table_id
LEFT JOIN orders o ON o.session_id = ts.id
WHERE ts.status = 'active'
GROUP BY ts.id, ts.table_id, t.table_number, ts.started_at, ts.status;
```

### Session Details with Orders
```sql
SELECT 
  ts.id as session_id,
  ts.started_at,
  ts.ended_at,
  t.table_number,
  o.id as order_id,
  o.total_amount,
  o.items,
  o.created_at
FROM table_sessions ts
LEFT JOIN tables t ON t.id = ts.table_id
LEFT JOIN orders o ON o.session_id = ts.id
WHERE ts.id = 'YOUR_SESSION_ID'
ORDER BY o.created_at;
```

### Feedback for Session
```sql
SELECT 
  f.rating,
  f.comment,
  f.created_at,
  ts.started_at,
  ts.ended_at,
  DATE_PART('minute', ts.ended_at - ts.started_at) as session_duration_minutes
FROM feedbacks f
JOIN table_sessions ts ON ts.id = f.session_id
WHERE f.session_id = 'YOUR_SESSION_ID';
```

### Orphaned Sessions (No Feedback)
```sql
SELECT 
  ts.id,
  ts.table_id,
  t.table_number,
  ts.started_at,
  COUNT(o.id) as order_count
FROM table_sessions ts
LEFT JOIN tables t ON t.id = ts.table_id
LEFT JOIN orders o ON o.session_id = ts.id
LEFT JOIN feedbacks f ON f.session_id = ts.id
WHERE ts.status = 'active'
  AND ts.started_at < NOW() - INTERVAL '6 hours'
  AND f.id IS NULL
GROUP BY ts.id, ts.table_id, t.table_number, ts.started_at;
```

## Cleanup Tasks

### End Old Active Sessions
```sql
-- End sessions older than 6 hours with no feedback
UPDATE table_sessions
SET 
  status = 'cancelled',
  ended_at = NOW(),
  updated_at = NOW()
WHERE status = 'active'
  AND started_at < NOW() - INTERVAL '6 hours';

-- Free tables with cancelled sessions
UPDATE tables t
SET 
  status = 'available',
  updated_at = NOW()
WHERE id IN (
  SELECT table_id FROM table_sessions
  WHERE status = 'cancelled'
  AND ended_at > NOW() - INTERVAL '1 hour'
);
```

## Performance Tips

### Indexes Already Created
The migration creates these indexes automatically:
- `idx_table_sessions_table` (table_id, status, started_at)
- `idx_table_sessions_restaurant` (restaurant_id, status, started_at)
- `idx_orders_session` (session_id)
- `idx_feedbacks_session` (session_id)

### Monitor Query Performance
```sql
-- Check slow queries involving sessions
SELECT * FROM pg_stat_statements
WHERE query LIKE '%table_sessions%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Next Steps

1. **Run migration** (`22_table_sessions.sql`)
2. **Test customer flow** (QR scan → order → feedback → thank you)
3. **Verify table freeing** (check table status after feedback)
4. **Monitor session creation** (check for orphaned sessions)
5. **Set up cleanup job** (end old active sessions daily)

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs for RLS policy violations
3. Verify migration ran successfully
4. Check session and order data in database

## Architecture Diagram

```
QR Scan → TablePage
            ↓ creates
       table_sessions (active)
            ↓ has
       multiple orders (session_id)
            ↓ served
       PostMealOptions
            ↓ "no thanks"
       FeedbackPage (all session items)
            ↓ submit
       end_table_session() → table freed
            ↓
       ThankYouPage (auto-close)
```

## Success Criteria

✅ Session created on QR scan  
✅ Multiple orders share same session  
✅ Feedback shows all session items  
✅ Table freed after feedback  
✅ Thank you page displays  
✅ No duplicate active sessions per table  
✅ Session data persists correctly  

---

**Implementation Complete!** 🎉
