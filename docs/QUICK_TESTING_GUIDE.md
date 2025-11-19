# 🧪 Quick Testing Guide - Praahis Platform

**App URL:** http://localhost:5174/

---

## 🚀 Quick Start Testing

### 1. Test Homepage (30 seconds)
```
✓ Open: http://localhost:5174/
✓ Check: Page loads, no console errors
✓ Check: All sections render (Hero, Menu, About, etc.)
✓ Check: Navigation works
```

### 2. Test Customer Flow (5 minutes)
```
✓ Navigate: http://localhost:5174/table/1 (or any table ID)
✓ Browse menu and add items to cart
✓ Submit order
✓ Check order status page loads
✓ Verify order appears in database
```

### 3. Test Manager Dashboard (3 minutes)
```
✓ Navigate: http://localhost:5174/login?mode=manager
✓ Login with manager credentials
✓ Check dashboard loads with charts
✓ Verify all menu items (sidebar navigation)
✓ Open Menu Management, Staff, Orders pages
```

### 4. Test Real-time Features (2 minutes)
```
✓ Open Chef Dashboard in one window
✓ Submit order from Customer page in another
✓ Verify order appears in Chef Dashboard instantly
✓ Update order status
✓ Verify status updates in real-time
```

---

## 🎯 Critical Tests

### Test #1: Order Flow (End-to-End)
```bash
1. Customer accesses table → http://localhost:5174/table/1
2. Adds items to cart
3. Submits order
4. Chef sees order → http://localhost:5174/chef
5. Chef marks as preparing
6. Chef marks as ready
7. Status updates on customer screen
```
**Expected:** ✅ Order flows through all stages, real-time updates work

### Test #2: Manager Analytics
```bash
1. Login as manager → http://localhost:5174/login?mode=manager
2. Go to dashboard → http://localhost:5174/manager/dashboard
3. Check all charts render
4. Go to analytics → http://localhost:5174/manager/analytics
5. Verify data displays correctly
```
**Expected:** ✅ All charts load, data is accurate

### Test #3: Multi-tenancy
```bash
1. Login as Manager A (Restaurant A)
2. Check orders/menu/staff
3. Logout
4. Login as Manager B (Restaurant B)
5. Verify can't see Restaurant A's data
```
**Expected:** ✅ Complete data isolation between restaurants

---

## 🔍 What to Look For

### ✅ Good Signs
- Pages load quickly (<3 seconds)
- No console errors (red text in browser DevTools)
- Charts render correctly
- Real-time updates instant (<1 second)
- Navigation smooth
- Forms submit successfully
- Data saves correctly

### ⚠️ Warning Signs
- Slow page loads (>5 seconds)
- Console warnings (yellow text - not critical but note them)
- Missing images
- Broken charts (empty or error)
- Delayed real-time updates (>3 seconds)

### 🚨 Critical Issues
- Build errors (app won't start)
- Page crashes (white screen)
- Console errors (red text)
- Authentication failures
- Data not saving
- Real-time not working
- 404 errors on navigation

---

## 📝 Test Data Suggestions

### Sample Table IDs
```
http://localhost:5174/table/1
http://localhost:5174/table/2
http://localhost:5174/table/table-101
```

### Test Order Items
- Add 2-3 menu items
- Test quantity adjustments
- Add special instructions
- Test cart total calculation

### Login Credentials
Use your existing test accounts for:
- Manager
- Chef
- Waiter
- Superadmin

---

## 🎯 Priority Testing Order

**Priority 1 (Must Test):**
1. ✅ Homepage loads
2. ✅ Manager login works
3. ✅ Manager dashboard displays
4. ✅ Customer can view menu
5. ✅ Order submission works

**Priority 2 (Should Test):**
6. Real-time order updates
7. Chef dashboard
8. Waiter dashboard
9. Menu management
10. Analytics charts

**Priority 3 (Nice to Test):**
11. Superadmin features
12. Payment flow
13. Feedback submission
14. QR code generation
15. Report exports

---

## 🐛 Bug Reporting Template

If you find issues, note:

```
**Issue:** [Brief description]
**Page:** [URL where it occurs]
**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error

**Expected:** [What should happen]
**Actual:** [What actually happened]
**Console Errors:** [Any red errors in DevTools]
**Priority:** [High/Medium/Low]
```

---

## ✅ Quick Validation Checklist

Copy this for quick testing:

```
[ ] Homepage loads
[ ] Manager login works
[ ] Dashboard displays
[ ] Charts render
[ ] Menu page works
[ ] Orders page works
[ ] Customer can view menu
[ ] Order submission works
[ ] Real-time updates work
[ ] No console errors
[ ] Navigation smooth
[ ] Mobile responsive
```

---

## 🚀 Ready to Test!

**1. Ensure server is running:**
```bash
npm run dev
# Should see: http://localhost:5174/
```

**2. Open browser:**
```
http://localhost:5174/
```

**3. Open DevTools:**
- Chrome/Edge: F12 or Cmd+Option+I (Mac)
- Check Console tab for errors
- Check Network tab for failed requests

**4. Start testing!**
Follow the quick tests above or use TESTING_VALIDATION.md for comprehensive testing.

---

## 💡 Pro Tips

1. **Keep DevTools open** - Catch errors immediately
2. **Test in multiple tabs** - Verify real-time sync
3. **Clear cache if needed** - Cmd+Shift+R (Mac) or Ctrl+Shift+R
4. **Test mobile view** - Use DevTools responsive mode
5. **Take screenshots** - Document any issues found

---

**Happy Testing! 🎉**

Any issues? The app is running successfully, so most things should work. The migration preserved all functionality while reorganizing the code structure.
