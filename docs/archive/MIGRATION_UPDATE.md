# Migration Update Required

## Issue Found

The `menu_item_ratings` table has two issues:
1. Missing the `session_id` column
2. `order_id` has a NOT NULL constraint (prevents session-based ratings)

## Error Message
```
null value in column "order_id" of relation "menu_item_ratings" violates not-null constraint
```

## Root Cause

The old system required `order_id` for every rating. The new session-based system rates items across the entire dining session (multiple orders), so `order_id` should be optional.

## Solution

Re-run the updated migration file:

```bash
# Execute the updated migration in Supabase SQL Editor
database/22_table_sessions.sql
```

## What Was Fixed

The migration now includes:

```sql
-- Add session_id to menu_item_ratings table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_item_ratings' 
    AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.menu_item_ratings 
    ADD COLUMN session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL;
  END IF;
  
  -- Make order_id nullable since we now use session_id as primary reference
  -- This allows rating items across entire session, not just per order
  ALTER TABLE public.menu_item_ratings 
  ALTER COLUMN order_id DROP NOT NULL;
END $$;
```

## Schema Changes

### Before (Order-based)
```sql
CREATE TABLE menu_item_ratings (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,  -- ❌ Required
  menu_item_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  ...
);
```

### After (Session-based)
```sql
CREATE TABLE menu_item_ratings (
  id UUID PRIMARY KEY,
  order_id UUID,           -- ✅ Optional (for backward compatibility)
  session_id UUID,         -- ✅ New session reference
  menu_item_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  ...
);
```

## Benefits of Session-Based Ratings

**Old System (Order-based):**
- Customer orders Burger + Fries (Order 1) → rates both
- Customer orders Dessert (Order 2) → rates dessert
- **Problem:** Can't see overall dining experience ratings together

**New System (Session-based):**
- Customer's entire visit (Session 1):
  - Order 1: Burger + Fries
  - Order 2: Dessert + Coffee
- **Feedback shows ALL items** → customer rates entire experience
- **One rating per item per session** (not per order)

## After Running Migration

Item ratings will work correctly:

```javascript
// Inserted data
{
  session_id: "abc-123",    // ✅ Links to entire dining session
  order_id: null,           // ✅ Now nullable
  menu_item_id: "burger-1",
  rating: 5,
  restaurant_id: "rest-1"
}
```

## Verification

After running the migration, verify both changes:

### 1. Check session_id column exists
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'menu_item_ratings' 
AND column_name = 'session_id';

-- Should return:
-- session_id | uuid | YES
```

### 2. Check order_id is nullable
```sql
SELECT column_name, is_nullable
FROM information_schema.columns 
WHERE table_name = 'menu_item_ratings' 
AND column_name = 'order_id';

-- Should return:
-- order_id | YES (not NO)
```

### 3. Test insert without order_id
```sql
-- This should work after migration
INSERT INTO menu_item_ratings (session_id, menu_item_id, rating, restaurant_id)
VALUES (
  'test-session-id',
  'test-menu-item-id',
  5,
  'test-restaurant-id'
);
```

## Impact

### ✅ Works Without Migration
- Session creation
- Order placement  
- Feedback submission
- Table freeing
- Thank You page

### ⚠️ Needs Migration
- Individual item ratings (gracefully skipped until migration runs)

## Migration Safety

This migration is **100% safe** because:
- ✅ Uses `IF NOT EXISTS` to avoid duplicate columns
- ✅ Makes `order_id` nullable (doesn't remove data)
- ✅ Existing ratings remain intact
- ✅ Backward compatible with old code
- ✅ No data loss risk

## Next Step

**Run this in Supabase SQL Editor:**
```sql
-- Copy entire contents of: database/22_table_sessions.sql
-- Paste and execute
```

Then item ratings will work perfectly! 🎉
