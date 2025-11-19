# 🔧 Menu Items Not Showing - Troubleshooting Guide

**Issue:** Menu items added in Manager dashboard not appearing on customer ordering page  
**Date:** November 16, 2025

---

## Quick Diagnostics Checklist

Run through these checks to identify the issue:

### 1. ✅ Verify Menu Items in Database

**Run this SQL query in Supabase SQL Editor:**

```sql
-- Check if menu items exist for your restaurant
SELECT 
  id, 
  name, 
  category, 
  price, 
  is_available,
  restaurant_id
FROM menu_items
WHERE restaurant_id = 'YOUR_RESTAURANT_ID'  -- Replace with your restaurant ID
ORDER BY category, name;
```

**Expected Result:** You should see your menu items listed  
**If empty:** Menu items weren't saved properly

---

### 2. ✅ Check Menu Item Status

**Problem:** Menu items might be marked as unavailable

**Fix in Manager Dashboard:**
1. Go to Manager → Menu Management
2. Find your menu items
3. Make sure the toggle/checkbox for "Available" is **ON** (green)
4. Save changes

**SQL Fix (if needed):**
```sql
-- Make all menu items available for your restaurant
UPDATE menu_items
SET is_available = true
WHERE restaurant_id = 'YOUR_RESTAURANT_ID';
```

---

### 3. ✅ Verify Restaurant ID Context

**Problem:** Customer page might be loading wrong restaurant ID

**Check in Browser Console (F12):**
Look for any errors mentioning:
- "restaurant_id is null"
- "Cannot read restaurant context"
- 404 errors on menu_items query

**Debug in TablePage:**
Add this temporary console log to see what's being loaded:

```javascript
// In src/pages/customer/TablePage.jsx, around line 69
console.log('🍽️ Loading menu for restaurant:', tableData?.restaurant_id);
console.log('📋 Menu items loaded:', menuData);
```

---

### 4. ✅ Check QR Code URL Format

**Problem:** QR code might not include restaurant context

**Correct QR Code URL format:**
```
https://yourdomain.com/table?restaurant={restaurantId}&table={tableId}&t={tableNumber}
```

**OR (if using slug):**
```
https://yourdomain.com/table?restaurant={restaurantSlug}&table={tableId}
```

**Check your QR code:**
1. Scan the QR code
2. Look at the URL in the browser
3. Verify it includes `restaurant=` parameter

---

### 5. ✅ Browser Cache Issue

**Problem:** Old cached data showing

**Solution:**
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**OR:**
- Chrome: Ctrl+Shift+Delete → Clear cache
- Clear Supabase cached data in localStorage

---

### 6. ✅ Check Network Tab

**Open Browser DevTools → Network tab:**

1. Reload the ordering page
2. Look for request to `/rest/v1/menu_items`
3. Check the response:
   - **200 OK + empty array []**: Menu items query works but no items match filters
   - **200 OK + data**: Items exist but might not be rendering
   - **404 Not Found**: Table doesn't exist or wrong endpoint
   - **400 Bad Request**: Query syntax error

---

### 7. ✅ Verify RLS Policies

**Problem:** Row Level Security might be blocking access

**Check RLS for menu_items:**

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'menu_items';

-- If rowsecurity = true, check policies
SELECT * FROM pg_policies 
WHERE tablename = 'menu_items';
```

**Fix: Ensure public can read menu items**

```sql
-- Allow public (unauthenticated) users to read available menu items
CREATE POLICY IF NOT EXISTS "Public can view available menu items"
ON menu_items FOR SELECT
TO public
USING (is_available = true);
```

---

### 8. ✅ Check for JavaScript Errors

**Open Browser Console (F12):**

Look for red errors like:
- `Cannot read property 'map' of undefined`
- `menu_items is not iterable`
- `getMenuItems is not a function`

**Common fixes:**
- Menu state not initialized properly
- API call failing silently
- Data mapping error

---

## 🔍 Common Issues & Solutions

### Issue 1: Menu Items Show in Manager but Not Customer Page

**Cause:** Different restaurant contexts

**Solution:**
```javascript
// Verify both pages use same restaurant ID
// In Manager: restaurantId from auth.user
// In Customer: restaurantId from QR code URL or table lookup
```

### Issue 2: "is_available" Column Not Found

**Cause:** Using old schema

**Fix:**
```sql
-- Check column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'menu_items';

-- Add if missing
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
```

### Issue 3: Menu Items Query Returns Empty

**Debug Query:**
```sql
-- Check with minimal filters
SELECT COUNT(*) FROM menu_items WHERE restaurant_id = 'YOUR_ID';

-- Check without is_available filter
SELECT * FROM menu_items WHERE restaurant_id = 'YOUR_ID';

-- Check all menu items (to see if any exist)
SELECT * FROM menu_items LIMIT 10;
```

---

## 🛠️ Step-by-Step Fix

### Option 1: Quick Test with Sample Data

```sql
-- Insert a test menu item
INSERT INTO menu_items (
  restaurant_id,
  name,
  description,
  category,
  price,
  is_available
) VALUES (
  'YOUR_RESTAURANT_ID',  -- Use your actual restaurant ID
  'Test Pizza',
  'Delicious test pizza',
  'Main Course',
  12.99,
  true
);
```

Then refresh the customer ordering page and see if it appears.

### Option 2: Check Frontend State

Add debug logs to TablePage.jsx:

```javascript
useEffect(() => {
  const loadData = async () => {
    console.log('1️⃣ Starting load...');
    const tableData = await getTable(tableId);
    console.log('2️⃣ Table data:', tableData);
    
    const menuData = await getMenuItems(tableData?.restaurant_id);
    console.log('3️⃣ Menu data:', menuData);
    console.log('4️⃣ Menu count:', menuData?.length);
    
    setMenuItems(menuData || []);
  };
  loadData();
}, []);
```

---

## 📊 What to Share for Further Help

If the issue persists, provide:

1. **SQL Query Result:**
   ```sql
   SELECT COUNT(*) as total, 
          COUNT(*) FILTER (WHERE is_available = true) as available
   FROM menu_items 
   WHERE restaurant_id = 'YOUR_ID';
   ```

2. **Browser Console Logs:**
   - Screenshot of any errors
   - Network tab showing menu_items request/response

3. **QR Code URL:**
   - What URL does your QR code scan to?

4. **Restaurant ID:**
   - What's the actual restaurant UUID you're testing with?

---

## ✅ Verification Steps

After fixing:

1. ✅ Menu items show in Manager → Menu Management
2. ✅ Items are marked as "Available" (green toggle)
3. ✅ Scan QR code → Menu loads on ordering page
4. ✅ All categories visible
5. ✅ Can add items to cart
6. ✅ Prices display correctly

---

## 🚨 Emergency Fix

If nothing else works, try this:

1. **Disable RLS temporarily (TESTING ONLY):**
   ```sql
   ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
   ```

2. **Reload page** - if menu items appear, it's an RLS policy issue

3. **Re-enable RLS:**
   ```sql
   ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
   ```

4. **Fix the RLS policy** to allow public read access

---

**Last Updated:** November 16, 2025  
**Status:** Active troubleshooting document
