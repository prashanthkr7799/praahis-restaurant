# 🚀 Praahis Refactoring Execution Plan

## ✅ Phase 1: Analysis (COMPLETED)

### Completed Actions:
1. ✅ Created REFACTORING_ANALYSIS.md with comprehensive findings
2. ✅ Identified 252+ JSX files with potential console logs
3. ✅ Identified duplicate layouts and components
4. ✅ Documented legacy name references
5. ✅ Created removal scripts for automation

### Deliverables:
- `/REFACTORING_ANALYSIS.md` - Detailed analysis report
- `/scripts/remove-console-logs.js` - Automated cleanup script

---

## 🎯 Phase 2: Critical Cleanup (IN PROGRESS)

### Step 2.1: Remove Debug Console Logs (High Priority)

**Target**: Remove/wrap 100+ console.log/debug/warn statements

**Method**: Manual cleanup of critical files first

**Critical Files** (Customer Journey - Highest Impact):
- [x] `/src/pages/customer/TablePage.jsx` - Started (2/10 logs removed)
- [ ] `/src/pages/customer/PaymentPage.jsx` - 10+ logs
- [ ] `/src/pages/customer/FeedbackPage.jsx` - 8+ logs  
- [ ] `/src/pages/customer/OrderStatusPage.jsx` - Need to check

**Critical Files** (Staff Workflows):
- [ ] `/src/pages/waiter/WaiterLogin.jsx` - 7+ logs
- [ ] `/src/pages/waiter/SimpleWaiterDashboard.jsx` - 5+ logs
- [ ] `/src/pages/chef/ChefDashboard.jsx` - Need to check
- [ ] `/src/pages/manager/ManagerDashboard.jsx` - console.warn statements

**Critical Files** (SuperAdmin):
- [ ] `/src/pages/superadmin/restaurants/RestaurantsPage.jsx` - 10+ debug logs

**Timeline**: 2-3 hours
**Status**: 🟡 In Progress (5% complete)

---

### Step 2.2: Remove Duplicate Components

**Priority Order**:

1. **SuperAdmin Layout** (CRITICAL - affects all superadmin pages)
   - [ ] Verify `/src/shared/layouts/ProfessionalSuperAdminLayout.jsx` works
   - [ ] Update all imports in App.jsx
   - [ ] Remove `/src/shared/layouts/SuperAdminLayout.jsx`
   - [ ] Remove `/src/shared/layouts/SuperAdminHeader.jsx` if unused

2. **SuperAdmin Dashboards**
   - [ ] Confirm `/src/pages/superadmin/dashboard/DashboardPage.jsx` is primary
   - [ ] Remove `/src/pages/superadmin/SuperAdminDashboard.jsx`
   - [ ] Remove `/src/pages/superadmin/Dashboard.jsx`

3. **SuperAdmin Restaurant Pages**
   - [ ] Keep `/src/pages/superadmin/restaurants/RestaurantsPage.jsx`
   - [ ] Remove `/src/pages/superadmin/restaurants/RestaurantsSubscriptions.jsx`
   - [ ] Keep `/src/pages/superadmin/restaurants/RestaurantDetailPageNew.jsx`
   - [ ] Remove `/src/pages/superadmin/restaurants/RestaurantDetailPage.jsx`

4. **SuperAdmin Export Pages**
   - [ ] Keep `/src/pages/superadmin/exports/DataExportPage.jsx`
   - [ ] Remove `/src/pages/superadmin/DataExportPage.jsx`

5. **Manager Dashboards**
   - [ ] Determine which is primary: ManagerDashboard.jsx or ManagerDashboardNew.jsx
   - [ ] Remove the unused one

6. **Waiter Dashboards**
   - [ ] Determine which is primary: WaiterDashboard.jsx or SimpleWaiterDashboard.jsx
   - [ ] Remove the unused one

**Timeline**: 2-3 hours
**Status**: ⏳ Not Started

---

### Step 2.3: Update App.jsx Routes

**Actions**:
- [ ] Remove all `/superadmin/old/*` routes
- [ ] Verify all navigation links point to new routes
- [ ] Test all route transitions
- [ ] Remove unused lazy imports

**Files to Update**:
- `/src/App.jsx` - Main routing file
- Any component with navigate() calls to old routes

**Timeline**: 1 hour
**Status**: ⏳ Not Started

---

### Step 2.4: Clean Up Legacy References

**Search and Replace Tasks**:
- [ ] Search "Restaura" → Replace with "Praahis" (30+ files)
- [ ] Search "Tabun" → Replace with "Praahis"
- [ ] Search "mealmate_restaurant_ctx" → Consider renaming to "praahis_restaurant_ctx"
- [ ] Review all localStorage keys for consistency

**Timeline**: 1 hour
**Status**: ⏳ Not Started

---

### Step 2.5: Remove Commented Code

**Actions**:
- [ ] Search for large blocks of commented code (10+ lines)
- [ ] Review and remove if no longer needed
- [ ] Remove TODO comments for completed tasks

**Timeline**: 1-2 hours
**Status**: ⏳ Not Started

---

## 🔐 Phase 3: Authentication & Security

### Step 3.1: Implement Password Reset Flow

**New Files to Create**:
1. [ ] `/src/pages/auth/ForgotPassword.jsx`
   - Email input form
   - Call `supabase.auth.resetPasswordForEmail()`
   - Success message + redirect to login

2. [ ] `/src/pages/auth/ResetPassword.jsx`
   - New password input (with confirmation)
   - Call `supabase.auth.updateUser()`
   - Success message + redirect to login

**Routes to Add** (in App.jsx):
```jsx
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
```

**Links to Add**:
- UnifiedLogin.jsx: Add "Forgot Password?" link
- All login pages: Add "Forgot Password?" link

**Timeline**: 3-4 hours
**Status**: ⏳ Not Started

---

### Step 3.2: Validate Session Management

**Testing Tasks**:
- [ ] Test staff login (manager/chef/waiter)
- [ ] Test owner login (superadmin)
- [ ] Test both sessions simultaneously in different browser tabs
- [ ] Verify localStorage keys don't conflict:
  - `sb-manager-session` for staff
  - `sb-owner-session` for owners
- [ ] Test logout from one doesn't affect the other

**Timeline**: 2 hours
**Status**: ⏳ Not Started

---

### Step 3.3: Test RLS Policies

**Testing Script**: Create `/scripts/test-rls-policies.sql`

**Test Cases**:
1. [ ] Manager from Restaurant A cannot see Restaurant B's data
2. [ ] Chef cannot see other restaurants' orders
3. [ ] Waiter cannot see other restaurants' tables
4. [ ] SuperAdmin can see all data
5. [ ] Customer cannot see any restricted data

**Timeline**: 2-3 hours
**Status**: ⏳ Not Started

---

## 🐛 Phase 4: Bug Fixes & Workflow Testing

### Step 4.1: Test Customer Journey End-to-End

**Test Flow**:
1. [ ] Scan QR code → Lands on /table/:slug/:tableId
2. [ ] Browse menu → Items load correctly
3. [ ] Add to cart → Cart updates
4. [ ] Place order → Order created in database
5. [ ] Payment page → Razorpay modal opens
6. [ ] Pay → Order status updates to "paid"
7. [ ] Track order → Real-time updates work
8. [ ] Feedback → Submit feedback successfully
9. [ ] Thank you → Session ends, table freed

**Timeline**: 3-4 hours
**Status**: ⏳ Not Started

---

### Step 4.2: Test Payment Integration

**Test Cases**:
1. [ ] Restaurant with custom Razorpay keys → Uses restaurant keys
2. [ ] Restaurant without keys → Uses platform fallback keys
3. [ ] Payment success → Creates order_payments record
4. [ ] Payment failure → Shows error, order stays pending_payment
5. [ ] Webhook receives event → Marks payment as confirmed

**Timeline**: 2-3 hours
**Status**: ⏳ Not Started

---

### Step 4.3: Test Real-time Features

**Components to Test**:
1. [ ] Chef Dashboard → New orders appear instantly
2. [ ] Chef Dashboard → Order status updates reflect
3. [ ] Customer Order Tracking → Status updates appear
4. [ ] Waiter Dashboard → Table status updates
5. [ ] Manager Dashboard → Live metrics update

**Memory Leak Check**:
- [ ] Verify Realtime subscriptions are unsubscribed on component unmount
- [ ] Check for growing memory usage over time

**Timeline**: 2-3 hours
**Status**: ⏳ Not Started

---

### Step 4.4: Test Staff Dashboards

**Chef Dashboard**:
- [ ] Orders appear in correct order
- [ ] Can update order status
- [ ] Can update item-level status
- [ ] Only sees their restaurant's orders
- [ ] Realtime updates work

**Waiter Dashboard**:
- [ ] Table grid shows correct statuses
- [ ] Can create manual orders
- [ ] Can mark orders as served
- [ ] Only sees their restaurant's tables

**Manager Dashboard**:
- [ ] All KPIs display correctly
- [ ] Menu CRUD works
- [ ] Image upload works
- [ ] Staff management works
- [ ] Cannot add other managers
- [ ] Order history loads
- [ ] Payment tracking shows data
- [ ] Analytics charts render
- [ ] QR code generation works
- [ ] Razorpay settings save

**Timeline**: 4-5 hours
**Status**: ⏳ Not Started

---

### Step 4.5: Test SuperAdmin Portal

**Restaurant Management**:
- [ ] Can view all restaurants
- [ ] Can add new restaurant
- [ ] Can edit restaurant
- [ ] Can suspend/activate restaurant
- [ ] Manager assignment works

**Billing System**:
- [ ] Monthly bills generate correctly
- [ ] Bill calculation: tables × ₹100 × days
- [ ] Can mark bill as paid
- [ ] Overdue bills trigger suspension
- [ ] Payment triggers reactivation

**Audit Logs**:
- [ ] All actions are logged
- [ ] Can filter by date/user/action
- [ ] Logs show correct details

**Analytics**:
- [ ] Platform-wide metrics correct
- [ ] Data export works (CSV/JSON/XLSX)
- [ ] Date range filtering works

**Timeline**: 4-5 hours
**Status**: ⏳ Not Started

---

## ⚡ Phase 5: Performance Optimization

### Step 5.1: Add React.memo to Components

**Components to Optimize**:
- [ ] `/src/domains/ordering/components/OrderCard.jsx`
- [ ] `/src/domains/ordering/components/MenuItem.jsx`
- [ ] `/src/domains/ordering/components/DishCard.jsx`
- [ ] `/src/domains/ordering/components/TableGridView.jsx`
- [ ] `/src/domains/ordering/components/CartSummary.jsx`

**Timeline**: 2-3 hours
**Status**: ⏳ Not Started

---

### Step 5.2: Optimize Database Queries

**Create Migration File**: `/database/80_performance_indexes.sql`

**Indexes to Add**:
```sql
-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Payments
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_status ON order_payments(payment_status);

-- Table Sessions
CREATE INDEX IF NOT EXISTS idx_table_sessions_table_id ON table_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_table_sessions_status ON table_sessions(session_status);

-- Menu Items
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
```

**Timeline**: 1-2 hours
**Status**: ⏳ Not Started

---

### Step 5.3: Optimize Images

**Actions**:
- [ ] Add lazy loading to all images
- [ ] Implement progressive image loading
- [ ] Consider converting to WebP format
- [ ] Add blur placeholder for menu item images

**Files to Update**:
- All components rendering menu item images
- Restaurant logo images
- Marketing page images

**Timeline**: 2-3 hours
**Status**: ⏳ Not Started

---

### Step 5.4: Code Splitting & Bundle Optimization

**Actions**:
- [ ] Run `npm install --save-dev vite-bundle-visualizer`
- [ ] Add to vite.config.js
- [ ] Analyze bundle size
- [ ] Identify large dependencies
- [ ] Lazy load heavy components

**Timeline**: 2-3 hours
**Status**: ⏳ Not Started

---

## 🎨 Phase 6: UI/UX Polish

### Step 6.1: Consistency Audit

**Actions**:
- [ ] Standardize button styles across all pages
- [ ] Ensure consistent spacing (use Tailwind scale)
- [ ] Standardize form validation styles
- [ ] Ensure consistent loading states
- [ ] Standardize error message display

**Timeline**: 3-4 hours
**Status**: ⏳ Not Started

---

### Step 6.2: Accessibility Improvements

**Actions**:
- [ ] Add ARIA labels to all interactive elements
- [ ] Test keyboard navigation
- [ ] Ensure sufficient color contrast
- [ ] Add focus indicators
- [ ] Add alt text to all images

**Timeline**: 3-4 hours
**Status**: ⏳ Not Started

---

### Step 6.3: Mobile Responsiveness

**Pages to Test**:
- [ ] Customer pages (most critical - customers use mobile)
- [ ] Waiter dashboard (tablets common)
- [ ] Chef dashboard (tablets/mobile)
- [ ] Manager dashboard (desktop primary, but should work on tablet)
- [ ] SuperAdmin (desktop only)

**Timeline**: 3-4 hours
**Status**: ⏳ Not Started

---

## 🧪 Phase 7: Comprehensive Testing

### Step 7.1: Role-Based Testing

**Test Each Role**:
- [ ] SuperAdmin - All workflows
- [ ] Manager - All workflows
- [ ] Chef - All workflows
- [ ] Waiter - All workflows
- [ ] Customer - Complete journey

**Timeline**: 6-8 hours
**Status**: ⏳ Not Started

---

### Step 7.2: Cross-Browser Testing

**Browsers to Test**:
- [ ] Chrome (primary)
- [ ] Safari (iOS customers)
- [ ] Firefox
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

**Timeline**: 2-3 hours
**Status**: ⏳ Not Started

---

### Step 7.3: Load Testing

**Scenarios**:
- [ ] 10 concurrent customers ordering
- [ ] Chef dashboard with 50+ active orders
- [ ] Manager dashboard with 1000+ orders in history
- [ ] SuperAdmin dashboard with 100+ restaurants

**Timeline**: 2-3 hours
**Status**: ⏳ Not Started

---

## 📚 Phase 8: Documentation

### Step 8.1: Code Documentation

**Actions**:
- [ ] Add JSDoc comments to all utility functions
- [ ] Document complex algorithms
- [ ] Add README files to domain folders
- [ ] Update main README.md

**Timeline**: 3-4 hours
**Status**: ⏳ Not Started

---

### Step 8.2: User Documentation

**Create Guides**:
- [ ] SuperAdmin User Guide
- [ ] Manager User Guide
- [ ] Chef User Guide
- [ ] Waiter User Guide
- [ ] Customer Journey Guide

**Timeline**: 4-5 hours
**Status**: ⏳ Not Started

---

## 📊 Progress Tracking

### Overall Progress: 5%

| Phase | Status | Progress | Est. Hours | Priority |
|-------|--------|----------|-----------|----------|
| 1. Analysis | ✅ Complete | 100% | 2h | High |
| 2. Cleanup | 🟡 In Progress | 5% | 8-12h | High |
| 3. Authentication | ⏳ Not Started | 0% | 7-9h | High |
| 4. Bug Fixes | ⏳ Not Started | 0% | 17-22h | High |
| 5. Performance | ⏳ Not Started | 0% | 7-11h | Medium |
| 6. UI/UX | ⏳ Not Started | 0% | 9-12h | Medium |
| 7. Testing | ⏳ Not Started | 0% | 10-14h | High |
| 8. Documentation | ⏳ Not Started | 0% | 7-9h | Low |

**Total Estimated Time**: 67-91 hours (approximately 2-3 weeks of focused work)

---

## 🎯 Recommended Execution Order

### Week 1: Critical Cleanup & Authentication
1. Day 1-2: Phase 2 (Cleanup) - Remove console logs, duplicates
2. Day 3: Phase 2 (Cleanup) - Update routes, legacy references
3. Day 4-5: Phase 3 (Authentication) - Password reset, session validation

### Week 2: Bug Fixes & Testing
1. Day 1-2: Phase 4.1-4.3 (Customer Journey, Payment, Realtime)
2. Day 3: Phase 4.4 (Staff Dashboards)
3. Day 4: Phase 4.5 (SuperAdmin Portal)
4. Day 5: Phase 7.1 (Role-Based Testing)

### Week 3: Performance & Polish
1. Day 1-2: Phase 5 (Performance Optimization)
2. Day 3-4: Phase 6 (UI/UX Polish)
3. Day 5: Phase 7.2-7.3 (Cross-Browser & Load Testing)

### Week 4: Documentation & Final Testing
1. Day 1-2: Phase 8 (Documentation)
2. Day 3-5: Final comprehensive testing and bug fixes

---

## 📝 Notes

- This plan can be executed in parallel by multiple developers
- Each step has clear deliverables and can be tested independently
- Priority should be given to customer-facing features first
- Security and authentication fixes are critical and should not be skipped

---

**Last Updated**: November 15, 2025  
**Next Review**: After Phase 2 completion
