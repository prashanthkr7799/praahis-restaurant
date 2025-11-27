## Debugging the Table Loading Error

### Current Issue
You're seeing: `Error loading table data: Error: Table not found: undefined at restaurant taj`

This means `tableId` is `undefined` when TablePage loads.

### Where is this coming from?

The error shows the URL has `undefined` as the table ID. This can happen if:

1. **You're accessing a bad URL directly** like `/table/undefined`
2. **The redirect from `/menu/:restaurantId?table=1` failed**
3. **Browser cached an old bad redirect**

### Check These in Browser Console:

Look for these logs in the browser console:

**From LegacyCustomerMenuRedirect.jsx:**
- `🔄 Legacy redirect:` - Shows what data the redirect received
- `🔍 Looking up table by number:` - Shows table lookup
- `✅ Found table ID:` - Shows if table was found
- `➡️  Redirecting to:` - Shows final redirect URL
- `❌` - Shows any errors

**From TablePage.jsx:**
- `🔵 useEffect triggered - starting loadData()`
- `📍 Table ID from params:` - Shows what tableId was received
- `📍 Current URL:` - Shows the actual URL in browser

### Quick Fixes:

#### 1. Hard Refresh Browser
```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

#### 2. Check the Actual URL
Look at your browser address bar. What's the URL?

**Expected:**
- `/table/3c1c9811-4527-4232-bdc7-e2a7b5cb8212`

**Bad:**
- `/table/undefined`
- `/menu/...` (not redirecting)

#### 3. Test the Redirect Manually

Try accessing this URL format:
```
http://localhost:5173/menu/26c3e0ef-72ce-42e8-b5c9-1c6e0f52a233?table=1
```

You should see:
1. Loading spinner
2. Console logs from redirect component
3. Redirect to `/table/:tableId`

#### 4. If Redirect Isn't Working

The issue might be that the table doesn't exist in the database. Run this to check:

```bash
node -e "
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const restaurantId = '26c3e0ef-72ce-42e8-b5c9-1c6e0f52a233';
const { data } = await supabase.from('tables').select('id, table_number').eq('restaurant_id', restaurantId).eq('table_number', 1);
console.log('Table found:', data);
"
```

### What You Should See Now:

After the fixes, when you access a bad URL, you should see:
- `❌ Invalid table ID: undefined`
- User-friendly error message: "Invalid table ID. Please scan a valid QR code."

And in console:
- `📍 Table ID from params: undefined`
- `📍 Current URL: http://...`

This will help identify exactly where the problem is!

### Next Steps:

1. **Look at browser console** - Are there redirect logs?
2. **Check browser URL** - Is it `/table/undefined`?
3. **Try accessing** `/menu/:restaurantId?table=1` directly
4. **Report back** what you see in console and URL bar
