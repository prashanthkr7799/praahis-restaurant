# Staff View Fix - Restaurant Details Page

## Issue
When clicking the "View" button in the Superadmin's Restaurants & Subscriptions page, the staff members (waiters, chefs, managers, admins) were not being displayed properly.

## Root Cause
The `RestaurantDetail.jsx` file was using the wrong Supabase client:
- **Before**: Used `supabase` (regular client with RLS restrictions)
- **After**: Using `supabaseOwner` (admin client with elevated permissions)

This caused the staff data to be blocked by Row Level Security (RLS) policies, preventing the superadmin from viewing all staff members.

## Changes Made

### 1. **Fixed Supabase Client Import** (`RestaurantDetail.jsx`)
```jsx
// Before
import { supabase } from '../../lib/supabaseClient';

// After
import { supabaseOwner } from '../../lib/supabaseOwnerClient';
```

### 2. **Updated All Database Queries**
Changed all `supabase` references to `supabaseOwner` in the data fetching logic:
- Restaurant details
- Staff members (users table)
- Orders
- Menu items
- Tables
- Activity logs

### 3. **Enhanced Staff Display**
Improved the Staff tab to show:
- **Empty state message** when no staff members exist
- **Staff count** in the header
- **Enhanced staff details**:
  - Full name and email
  - Role badge (waiter, chef, manager, admin)
  - Phone number (if available)
  - Active/Inactive status
- **Better visual hierarchy** with improved styling

### 4. **Added Staff Count to Overview**
Added a new "Staff Members" card in the Overview tab showing:
- Total staff count
- Number of active staff members

## Staff Roles Supported
The system now properly displays all staff types:
- ✅ **Waiters** - Front-of-house staff
- ✅ **Chefs** - Kitchen staff
- ✅ **Managers** - Restaurant managers
- ✅ **Admins** - Administrative staff

## Database Schema
Staff data is stored in the `users` table with:
- `restaurant_id` - Links staff to their restaurant
- `role` - VARCHAR field storing: 'waiter', 'chef', 'admin', 'manager'
- `full_name` - Staff member's name
- `email` - Login email
- `phone` - Contact number (optional)
- `is_active` - Active/Inactive status

## Testing Steps
1. Navigate to **Superadmin → Restaurants & Subscriptions**
2. Click the **"View"** button on any restaurant
3. Click the **"Staff"** tab
4. Verify that all staff members are displayed with their roles

## Notes
- The fix ensures superadmin has proper access to view all restaurant data
- The `supabaseOwner` client bypasses RLS policies for administrative access
- Staff members are filtered by `restaurant_id` to show only relevant staff
- Empty state handling provides better UX when no staff exists

## Files Modified
- `/src/pages/superadmin/RestaurantDetail.jsx`

## Status
✅ **FIXED** - Staff members (waiters, chefs, managers, admins) are now properly displayed in the restaurant view page.
