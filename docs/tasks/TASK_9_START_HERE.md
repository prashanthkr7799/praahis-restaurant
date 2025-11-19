# ✅ Task 9: Customer Journey Testing - START HERE

**Status:** ⏳ In Progress  
**Priority:** 🔴 CRITICAL (Revenue Flow)  
**Estimated Time:** 45 minutes  
**Last Updated:** November 15, 2025

---

## 🎯 What You're Testing

The **complete customer ordering workflow** - the most important flow in your app:

```
1. Scan QR Code (Table Access)
     ↓
2. Browse Menu (Categories & Search)
     ↓
3. Add Items to Cart (Multiple items & quantities)
     ↓
4. Place Order (Create order in database)
     ↓
5. Payment (Razorpay integration)
     ↓
6. Track Order (Real-time status updates)
     ↓
7. Post-Meal (Order more or give feedback)
     ↓
8. Submit Feedback (Rating & comments)
     ↓
9. Thank You (Completion)
```

---

## ✅ Pre-Flight Checklist

### 1. Code Files Check
Run the verification script:
```bash
./scripts/verify-customer-journey.sh
```

**Results:**
- ✅ 17/18 checks passed
- ❌ `.env` file missing (need to create)

### 2. Create .env File

**If you don't have a `.env` file:**

```bash
# Copy from example
cp .env.example .env

# Then edit .env with your Supabase credentials
```

**Required variables in `.env`:**
```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Optional (for payment testing):**
```bash
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
```

### 3. Dev Server Check

✅ **Good news:** Dev server is already running on `http://localhost:5173`

If not running:
```bash
npm run dev
```

### 4. Database Check

You need test data. Run these SQL queries in **Supabase SQL Editor:**

```sql
-- 1. Check restaurants
SELECT id, name, slug FROM restaurants WHERE is_active = true LIMIT 5;

-- 2. Check tables
SELECT id, table_number, restaurant_id FROM tables LIMIT 10;

-- 3. Check menu items
SELECT id, name, category, price FROM menu_items WHERE is_available = true LIMIT 10;
```

**If any return 0 rows:** You need to seed your database first.

**To seed database:**
```bash
# Run seed scripts in Supabase SQL Editor
# Files in /database/ folder:
# - 01_schema.sql
# - 02_seed.sql
# - 12_seed_tenants.sql (creates test restaurants)
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Get Your Test URL

From the SQL query above, you got:
- **Restaurant slug:** (e.g., "test-restaurant")
- **Table ID:** (e.g., 1)

**Build your test URL:**
```
http://localhost:5173/table/[TABLE_ID]?restaurant=[SLUG]
```

**Example:**
```
http://localhost:5173/table/1?restaurant=test-restaurant
```

### Step 2: Open in Browser

1. Open Chrome (or your browser)
2. Open DevTools (Press F12)
3. Go to Console tab
4. Paste the URL and press Enter

### Step 3: Quick Smoke Test

1. ✅ Menu loads with items?
2. ✅ Click "Add" on an item → Button changes to quantity controls?
3. ✅ Click "Pay Now" → Redirects to payment page?
4. ✅ Payment page shows order summary?
5. ✅ No console errors?

**If all 5 pass → Proceed to full test**  
**If any fail → Check troubleshooting section**

---

## 📚 Full Test Procedure

**Read the comprehensive guide:**
```
📖 TASK_9_CUSTOMER_JOURNEY_TEST.md
```

This guide covers:
- 10 detailed test steps
- Expected results for each step
- Screenshots of what you should see
- SQL queries to verify database changes
- Troubleshooting for common issues

---

## 🔍 What to Check During Testing

### Console (Browser DevTools)

**Should see:**
- ✅ Minimal or no logs (we cleaned them up)
- ✅ No red errors

**Should NOT see:**
- ❌ "👤 Customer entered table"
- ❌ "Cart items:", "Prepared order data:"
- ❌ Multiple GoTrueClient warnings
- ❌ 401/403 errors (except harmless audit log warnings which are OK)

### Database Changes

**Monitor with SQL:**
```sql
-- Table status should change to 'occupied'
SELECT status FROM tables WHERE id = 1;

-- Session should be created
SELECT * FROM table_sessions 
WHERE table_id = 1 
ORDER BY created_at DESC 
LIMIT 1;

-- Order should be created after checkout
SELECT * FROM orders 
ORDER BY created_at DESC 
LIMIT 1;
```

See `TASK_9_SQL_VERIFICATION.md` for complete SQL scripts.

---

## 🎯 Success Criteria

### Critical (Must Pass):
- [ ] Table page loads without errors
- [ ] Menu displays items
- [ ] Can add items to cart
- [ ] Cart persists on refresh
- [ ] Order creation works
- [ ] Payment page displays

### Important (Should Pass):
- [ ] No console errors
- [ ] Real-time updates work
- [ ] Mobile responsive
- [ ] Feedback submission works

### Nice to Have:
- [ ] Fast performance (<2s load)
- [ ] Smooth animations
- [ ] Payment completes successfully

---

## 🐛 Common Issues

### Issue 1: "Restaurant not found"
**Fix:** Make sure URL has `?restaurant=SLUG` parameter

### Issue 2: Menu is empty
**Fix:** Run seed script to create menu items

### Issue 3: Cart doesn't save
**Fix:** Check localStorage is enabled in browser

### Issue 4: Payment fails
**Fix:** Configure Razorpay keys in `.env` or restaurant settings

### Issue 5: Real-time not working
**Fix:** Enable Realtime in Supabase dashboard for `orders` table

**Full troubleshooting guide in TASK_9_CUSTOMER_JOURNEY_TEST.md**

---

## 📊 Test Report

After testing, fill out this quick report:

```markdown
## Test Results - Customer Journey

**Date:** [Date]
**Tester:** [Your Name]
**Browser:** [Chrome/Safari/Firefox]
**Device:** [Desktop/Mobile]

### Quick Results:
- [ ] Table page works
- [ ] Menu displays
- [ ] Cart works
- [ ] Order creation works
- [ ] Payment page works
- [ ] Real-time updates work
- [ ] Feedback works

### Bugs Found:
1. [List any bugs]

### Performance Issues:
1. [List any slowness]

### Recommendations:
1. [List improvements]
```

---

## 📁 Related Files

**Test Documentation:**
- `TASK_9_CUSTOMER_JOURNEY_TEST.md` - Full test procedure (10 steps)
- `TASK_9_SQL_VERIFICATION.md` - SQL queries for verification
- `scripts/verify-customer-journey.sh` - Automated file checker

**Customer Flow Code:**
- `src/pages/customer/TablePage.jsx` - Main ordering page
- `src/pages/customer/PaymentPage.jsx` - Payment processing
- `src/pages/customer/OrderStatusPage.jsx` - Real-time tracking
- `src/pages/customer/PostMealOptions.jsx` - Post-meal flow
- `src/pages/customer/FeedbackPage.jsx` - Rating & feedback

**Components:**
- `src/domains/ordering/components/MenuItem.jsx` - Menu item card
- `src/domains/ordering/components/CartSummary.jsx` - Cart panel
- `src/domains/ordering/components/CategoryTabs.jsx` - Category navigation

---

## 🚦 Current Status

✅ **Ready to test:**
- All code files exist (no errors)
- Dev server running
- Routes configured correctly

⚠️ **Need to verify:**
- .env file has correct Supabase credentials
- Database has test data (restaurants, tables, menu items)
- Razorpay keys configured (optional for now)

---

## 🎬 Next Steps

1. **If you haven't yet:**
   - Create `.env` file with Supabase credentials
   - Verify database has test data

2. **Start testing:**
   - Follow the Quick Start above
   - If it works, do the full test in TASK_9_CUSTOMER_JOURNEY_TEST.md

3. **Document results:**
   - Note any bugs or issues
   - Take screenshots if needed
   - Fill out test report

4. **After completion:**
   - Mark Task 9 as complete
   - Move to Task 10 (Payment Integration Testing)

---

## 💡 Tips

- **Test on mobile:** Most customers will use mobile devices
- **Check console:** Keep DevTools open throughout testing
- **Take notes:** Document any weird behavior
- **Test multiple times:** Try different menu items, quantities
- **Monitor database:** Watch SQL queries to verify data changes

---

## 🆘 Need Help?

**Quick troubleshooting:**
1. Check the Common Issues section above
2. Read TASK_9_CUSTOMER_JOURNEY_TEST.md (detailed solutions)
3. Check browser console for specific error messages
4. Verify SQL queries return expected data

**Still stuck?**
- Check Supabase logs in dashboard
- Verify RLS policies allow anonymous access
- Try incognito mode to rule out cache issues

---

## ✅ When Done

After successful testing:

```bash
# Update progress
echo "Task 9 - Customer Journey Testing: ✅ COMPLETE"

# Move to next task
echo "Next: Task 10 - Payment Integration Testing"
```

---

**Ready? Let's test! 🚀**

**Start here:**
1. Create `.env` file if needed
2. Open: `http://localhost:5173/table/1?restaurant=YOUR-SLUG`
3. Follow Quick Start steps above
4. Report results

Good luck! 🎉
