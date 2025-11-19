# Praahis Domain-Driven Architecture Migration Map

**Generated:** 2025-11-08
**Status:** Planning Phase

This document maps every file in the current flat structure to its target location in the new domain-driven architecture.

---

## 📊 MIGRATION STATISTICS

### Current Structure Analysis
- **Total Files:** 268 JS/JSX files
- **Pages:** 52 files
- **Components:** 47 files  
- **Utils/Lib:** 24 files
- **Hooks:** 6 files
- **Contexts:** 1 file

### Target Structure Summary
- **Domains:** 5 active (ordering, billing, staff, analytics, notifications)
- **Role-Based Pages:** 7 categories (customer, waiter, chef, manager, admin, superadmin, public, utility)
- **Shared Infrastructure:** Organized into primitives, compounds, feedback, marketing, layouts, guards, contexts, hooks, utils

---

## 🎯 DOMAIN: NOTIFICATIONS

### Components → domains/notifications/components/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/Components/admin/NotificationsBell.jsx` | `src/domains/notifications/components/NotificationBell.jsx` | ⏳ Pending |

### Utils → domains/notifications/utils/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/utils/notificationHelpers.js` | `src/domains/notifications/utils/notificationHelpers.js` | ⏳ Pending |
| `src/utils/notifications.js` | `src/domains/notifications/utils/notifications.js` | ⏳ Pending |
| `src/lib/notificationService.js` | `src/domains/notifications/utils/notificationService.js` | ⏳ Pending |

### Hooks → domains/notifications/hooks/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| N/A (Create New) | `src/domains/notifications/hooks/useNotifications.js` | 🆕 Create |
| N/A (Create New) | `src/domains/notifications/hooks/useNotificationRealtime.js` | 🆕 Create |

### Domain Files
| File | Purpose | Status |
|------|---------|--------|
| `src/domains/notifications/index.js` | Public exports | 🆕 Create |
| `src/domains/notifications/events.js` | Event definitions (NOTIFICATION_SENT, NOTIFICATION_READ) | 🆕 Create |

---

## 🎯 DOMAIN: ANALYTICS

### Components → domains/analytics/components/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/Components/admin/charts/OrdersChart.jsx` | `src/domains/analytics/components/OrdersChart.jsx` | ⏳ Pending |
| `src/Components/admin/charts/RevenueChart.jsx` | `src/domains/analytics/components/RevenueChart.jsx` | ⏳ Pending |
| `src/Components/admin/charts/PopularItemsChart.jsx` | `src/domains/analytics/components/PopularItemsChart.jsx` | ⏳ Pending |
| `src/Components/admin/charts/StatusChart.jsx` | `src/domains/analytics/components/StatusChart.jsx` | ⏳ Pending |
| `src/pages/superadmin/dashboard/RevenueOverview.jsx` | `src/domains/analytics/components/RevenueOverview.jsx` | ⏳ Pending |
| `src/pages/superadmin/dashboard/SubscriptionBreakdown.jsx` | `src/domains/analytics/components/SubscriptionBreakdown.jsx` | ⏳ Pending |
| `src/Components/admin/StatCard.jsx` | `src/domains/analytics/components/StatCard.jsx` | ⏳ Pending |

### Utils → domains/analytics/utils/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/utils/dataBackup.js` | `src/domains/analytics/utils/dataExport.js` | ⏳ Pending |
| `src/utils/exportHelpers.js` | `src/domains/analytics/utils/exportHelpers.js` | ⏳ Pending |

### Hooks → domains/analytics/hooks/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| N/A (Create New) | `src/domains/analytics/hooks/useAnalytics.js` | 🆕 Create |
| N/A (Create New) | `src/domains/analytics/hooks/useReports.js` | 🆕 Create |
| N/A (Create New) | `src/domains/analytics/hooks/useInsights.js` | 🆕 Create |

### Domain Files
| File | Purpose | Status |
|------|---------|--------|
| `src/domains/analytics/index.js` | Public exports | 🆕 Create |
| `src/domains/analytics/events.js` | Event definitions (REPORT_GENERATED, ANOMALY_DETECTED) | 🆕 Create |

---

## 🎯 DOMAIN: STAFF

### Components → domains/staff/components/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/Components/admin/StaffForm.jsx` | `src/domains/staff/components/StaffForm.jsx` | ⏳ Pending |

### Utils → domains/staff/utils/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/utils/permissions.js` | `src/domains/staff/utils/permissions.js` (also keep copy in shared) | ⏳ Pending |
| `src/utils/activityLogger.js` | `src/domains/staff/utils/activityLogger.js` | ⏳ Pending |

### Hooks → domains/staff/hooks/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| N/A (Create New) | `src/domains/staff/hooks/useStaff.js` | 🆕 Create |
| N/A (Create New) | `src/domains/staff/hooks/usePermissions.js` | 🆕 Create |

### Domain Files
| File | Purpose | Status |
|------|---------|--------|
| `src/domains/staff/index.js` | Public exports | 🆕 Create |
| `src/domains/staff/events.js` | Event definitions (STAFF_CLOCKED_IN, PERMISSION_CHANGED) | 🆕 Create |

---

## 🎯 DOMAIN: ORDERING

### Components → domains/ordering/components/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/Components/OrderCard.jsx` | `src/domains/ordering/components/OrderCard.jsx` | ⏳ Pending |
| `src/Components/MenuItem.jsx` | `src/domains/ordering/components/MenuItem.jsx` | ⏳ Pending |
| `src/Components/DishCard.jsx` | `src/domains/ordering/components/DishCard.jsx` | ⏳ Pending |
| `src/Components/CartSummary.jsx` | `src/domains/ordering/components/CartSummary.jsx` | ⏳ Pending |
| `src/Components/CategoryTabs.jsx` | `src/domains/ordering/components/CategoryTabs.jsx` | ⏳ Pending |
| `src/Components/admin/OrdersTable.jsx` | `src/domains/ordering/components/OrdersTable.jsx` | ⏳ Pending |
| `src/Components/admin/MenuItemForm.jsx` | `src/domains/ordering/components/MenuItemForm.jsx` | ⏳ Pending |
| `src/Components/CallWaiterButton.jsx` | `src/domains/ordering/components/CallWaiterButton.jsx` | ⏳ Pending |
| `src/Components/TableGridView.jsx` | `src/domains/ordering/components/TableGridView.jsx` | ⏳ Pending |

### Utils → domains/ordering/utils/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/lib/orderHelpers.js` | `src/domains/ordering/utils/orderHelpers.js` | ⏳ Pending |
| `src/utils/session.js` | `src/domains/ordering/utils/session.js` | ⏳ Pending |

### Hooks → domains/ordering/hooks/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/hooks/useRealtimeOrders.js` | `src/domains/ordering/hooks/useRealtimeOrders.js` | ⏳ Pending |
| N/A (Create New) | `src/domains/ordering/hooks/useOrders.js` | 🆕 Create |
| N/A (Create New) | `src/domains/ordering/hooks/useMenu.js` | 🆕 Create |
| N/A (Create New) | `src/domains/ordering/hooks/useSessions.js` | 🆕 Create |

### Domain Files
| File | Purpose | Status |
|------|---------|--------|
| `src/domains/ordering/index.js` | Public exports | 🆕 Create |
| `src/domains/ordering/events.js` | Event definitions (ORDER_CREATED, ORDER_UPDATED, ORDER_PAID) | 🆕 Create |

---

## 🎯 DOMAIN: BILLING

### Components → domains/billing/components/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/Components/SubscriptionBanners.jsx` | `src/domains/billing/components/SubscriptionBanner.jsx` | ⏳ Pending |
| `src/Components/SubscriptionExpiryBanner.jsx` | `src/domains/billing/components/SubscriptionExpiryBanner.jsx` | ⏳ Pending |
| `src/Components/SubscriptionExpiredScreen.jsx` | `src/domains/billing/components/SubscriptionExpiredScreen.jsx` | ⏳ Pending |
| `src/Components/admin/BillingWarningCard.jsx` | `src/domains/billing/components/BillingWarningCard.jsx` | ⏳ Pending |

### Utils → domains/billing/utils/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/lib/subscriptionPaymentHelper.js` | `src/domains/billing/utils/subscriptionPaymentHelper.js` | ⏳ Pending |
| `src/lib/razorpayHelper.js` | `src/domains/billing/utils/razorpayHelper.js` | ⏳ Pending |

### Hooks → domains/billing/hooks/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/hooks/useSubscriptionCheck.js` | `src/domains/billing/hooks/useSubscriptionCheck.js` | ⏳ Pending |
| `src/hooks/useSubscriptionGuard.js` | `src/domains/billing/hooks/useSubscriptionGuard.js` | ⏳ Pending |
| N/A (Create New) | `src/domains/billing/hooks/useBilling.js` | 🆕 Create |
| N/A (Create New) | `src/domains/billing/hooks/useInvoices.js` | 🆕 Create |
| N/A (Create New) | `src/domains/billing/hooks/useTrials.js` | 🆕 Create |

### Domain Files
| File | Purpose | Status |
|------|---------|--------|
| `src/domains/billing/index.js` | Public exports | 🆕 Create |
| `src/domains/billing/events.js` | Event definitions (INVOICE_GENERATED, PAYMENT_RECEIVED, TRIAL_EXPIRING) | 🆕 Create |

---

## 📱 PAGES: CUSTOMER

### Customer Journey Pages → pages/customer/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/pages/TablePage.jsx` | `src/pages/customer/TablePage.jsx` | ⏳ Pending |
| `src/pages/OrderStatusPage.jsx` | `src/pages/customer/OrderStatusPage.jsx` | ⏳ Pending |
| `src/pages/PaymentPage.jsx` | `src/pages/customer/PaymentPage.jsx` | ⏳ Pending |
| `src/pages/Payment.jsx` | DELETE (duplicate of PaymentPage) | 🗑️ Delete |
| `src/pages/FeedbackPage.jsx` | `src/pages/customer/FeedbackPage.jsx` | ⏳ Pending |
| `src/pages/PostMealOptions.jsx` | `src/pages/customer/PostMealOptions.jsx` | ⏳ Pending |
| `src/pages/ThankYouPage.jsx` | `src/pages/customer/ThankYouPage.jsx` | ⏳ Pending |

---

## 📱 PAGES: WAITER

### Waiter Operations Pages → pages/waiter/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/pages/waiter/WaiterDashboard.jsx` | `src/pages/waiter/WaiterDashboard.jsx` | ✅ Already in place |
| `src/pages/waiter/WaiterLogin.jsx` | `src/pages/waiter/WaiterLogin.jsx` | ✅ Already in place |
| `src/pages/waiter/SimpleWaiterDashboard.jsx` | DELETE or merge with WaiterDashboard | 🔄 Review |

---

## 📱 PAGES: CHEF

### Chef Operations Pages → pages/chef/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/pages/ChefDashboard.jsx` | `src/pages/chef/ChefDashboard.jsx` | ⏳ Pending |
| `src/pages/ChefLogin.jsx` | `src/pages/chef/ChefLogin.jsx` | ⏳ Pending |

---

## 📱 PAGES: MANAGER

### Manager Operations Pages → pages/manager/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/pages/admin/Dashboard.jsx` | `src/pages/manager/ManagerDashboard.jsx` | ⏳ Pending |
| `src/pages/manager/ManagerDashboard.jsx` | DELETE (duplicate) | 🗑️ Delete |
| `src/pages/admin/MenuManagement.jsx` | `src/pages/manager/MenuManagementPage.jsx` | ⏳ Pending |
| `src/pages/admin/StaffManagement.jsx` | `src/pages/manager/StaffManagementPage.jsx` | ⏳ Pending |
| `src/pages/admin/OrdersManagement.jsx` | `src/pages/manager/OrdersManagementPage.jsx` | ⏳ Pending |
| `src/pages/admin/PaymentsTracking.jsx` | `src/pages/manager/PaymentsTrackingPage.jsx` | ⏳ Pending |
| `src/pages/admin/OffersManagement.jsx` | `src/pages/manager/OffersManagementPage.jsx` | ⏳ Pending |
| `src/pages/admin/Analytics.jsx` | `src/pages/manager/AnalyticsPage.jsx` | ⏳ Pending |
| `src/pages/admin/ReportsPage.jsx` | `src/pages/manager/ReportsPage.jsx` | ⏳ Pending |
| `src/pages/admin/Settings.jsx` | `src/pages/manager/SettingsPage.jsx` | ⏳ Pending |
| `src/pages/admin/ActivityLogs.jsx` | `src/pages/manager/ActivityLogsPage.jsx` | ⏳ Pending |
| `src/pages/admin/QRCodesManagement.jsx` | `src/pages/manager/QRCodesManagementPage.jsx` | ⏳ Pending |
| `src/pages/admin/Links.jsx` | `src/pages/manager/LinksPage.jsx` | ⏳ Pending |
| `src/pages/admin/AdminLogin.jsx` | DELETE (using unified login) | 🗑️ Delete |

---

## 📱 PAGES: SUPERADMIN

### Superadmin Platform Pages → pages/superadmin/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/pages/superadmin/Dashboard.jsx` | `src/pages/superadmin/SuperAdminDashboard.jsx` | ⏳ Pending |
| `src/pages/superadmin/Restaurants.jsx` | DELETE (duplicate) | 🗑️ Delete |
| `src/pages/superadmin/RestaurantDetail.jsx` | `src/pages/superadmin/restaurants/RestaurantDetailPage.jsx` | ⏳ Pending |
| `src/pages/superadmin/restaurants/RestaurantsList.jsx` | DELETE (duplicate) | 🗑️ Delete |
| `src/pages/superadmin/restaurants/RestaurantsListEnhanced.jsx` | DELETE (duplicate) | 🗑️ Delete |
| `src/pages/superadmin/restaurants/RestaurantsSubscriptions.jsx` | `src/pages/superadmin/restaurants/RestaurantsListPage.jsx` | ⏳ Pending |
| `src/pages/superadmin/restaurants/RestaurantForm.jsx` | `src/pages/superadmin/restaurants/RestaurantFormPage.jsx` | ⏳ Pending |
| `src/pages/superadmin/subscriptions/SubscriptionsList.jsx` | `src/pages/superadmin/subscriptions/SubscriptionsListPage.jsx` | ⏳ Pending |
| `src/pages/superadmin/managers/ManagersList.jsx` | `src/pages/superadmin/managers/ManagersListPage.jsx` | ⏳ Pending |
| `src/pages/superadmin/settings/SystemSettings.jsx` | `src/pages/superadmin/settings/SystemSettingsPage.jsx` | ⏳ Pending |
| `src/pages/superadmin/Analytics.jsx` | `src/pages/superadmin/AnalyticsPage.jsx` | ⏳ Pending |
| `src/pages/superadmin/DataExport.jsx` | `src/pages/superadmin/DataExportPage.jsx` | ⏳ Pending |
| `src/pages/superadmin/AuditLogs.jsx` | `src/pages/superadmin/AuditLogsPage.jsx` | ⏳ Pending |
| `src/pages/superadmin/BackupManagement.jsx` | `src/pages/superadmin/BackupManagementPage.jsx` | ⏳ Pending |
| `src/pages/superadmin/MaintenanceMode.jsx` | `src/pages/superadmin/MaintenanceModePage.jsx` | ⏳ Pending |

---

## 📱 PAGES: PUBLIC (Marketing)

### Public Marketing Pages → pages/public/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| N/A (inline in App.jsx) | `src/pages/public/HomePage.jsx` | 🆕 Create |
| N/A | `src/pages/public/AboutPage.jsx` | 🆕 Create (optional) |
| N/A | `src/pages/public/PricingPage.jsx` | 🆕 Create (optional) |
| N/A | `src/pages/public/ContactPage.jsx` | 🆕 Create (optional) |

---

## 📱 PAGES: UTILITY

### Utility Pages → pages/utility/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/pages/QRGenerator.jsx` | `src/pages/utility/QRGeneratorPage.jsx` | ⏳ Pending |
| `src/pages/Login.jsx` | `src/pages/utility/UnifiedLoginPage.jsx` | ⏳ Pending |

---

## 🔧 SHARED: COMPONENTS

### Primitives → shared/components/primitives/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/Components/common/Badge.jsx` | `src/shared/components/primitives/Badge.jsx` | ⏳ Pending |
| `src/Components/common/StatusBadge.jsx` | `src/shared/components/primitives/StatusBadge.jsx` | ⏳ Pending |
| `src/Components/Tooltip.jsx` | `src/shared/components/primitives/Tooltip.jsx` | ⏳ Pending |

### Compounds → shared/components/compounds/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/Components/common/Modal.jsx` | `src/shared/components/compounds/Modal.jsx` | ⏳ Pending |
| `src/Components/common/ConfirmDialog.jsx` | `src/shared/components/compounds/ConfirmDialog.jsx` | ⏳ Pending |
| `src/Components/common/DataTable.jsx` | `src/shared/components/compounds/DataTable.jsx` | ⏳ Pending |
| `src/Components/common/DateRangePicker.jsx` | `src/shared/components/compounds/DateRangePicker.jsx` | ⏳ Pending |
| `src/Components/common/SearchBar.jsx` | `src/shared/components/compounds/SearchBar.jsx` | ⏳ Pending |
| `src/Components/admin/DashboardHeader.jsx` | `src/shared/components/compounds/DashboardHeader.jsx` | ⏳ Pending |
| `src/Components/admin/ManageCard.jsx` | `src/shared/components/compounds/ManageCard.jsx` | ⏳ Pending |
| `src/Components/admin/OfferForm.jsx` | `src/shared/components/compounds/OfferForm.jsx` | ⏳ Pending |
| `src/Components/admin/TableQRCard.jsx` | `src/shared/components/compounds/TableQRCard.jsx` | ⏳ Pending |
| `src/Components/admin/BulkQRDownload.jsx` | `src/shared/components/compounds/BulkQRDownload.jsx` | ⏳ Pending |

### Feedback → shared/components/feedback/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/Components/LoadingSpinner.jsx` | `src/shared/components/feedback/LoadingSpinner.jsx` | ⏳ Pending |
| `src/Components/LoadingSkeleton.jsx` | `src/shared/components/feedback/LoadingSkeleton.jsx` | ⏳ Pending |
| `src/Components/ErrorBoundary.jsx` | `src/shared/components/feedback/ErrorBoundary.jsx` | ⏳ Pending |
| `src/Components/ErrorMessage.jsx` | `src/shared/components/feedback/ErrorMessage.jsx` | ⏳ Pending |
| `src/Components/MaintenanceScreen.jsx` | `src/shared/components/feedback/MaintenanceScreen.jsx` | ⏳ Pending |

### Marketing → shared/components/marketing/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/Components/Navbar.jsx` | `src/shared/components/marketing/Navbar.jsx` | ⏳ Pending |
| `src/Components/Footer.jsx` | `src/shared/components/marketing/Footer.jsx` | ⏳ Pending |
| `src/Components/HeroSection.jsx` | `src/shared/components/marketing/HeroSection.jsx` | ⏳ Pending |
| `src/Components/About.jsx` | `src/shared/components/marketing/About.jsx` | ⏳ Pending |
| `src/Components/Mission.jsx` | `src/shared/components/marketing/Mission.jsx` | ⏳ Pending |
| `src/Components/Expertise.jsx` | `src/shared/components/marketing/Expertise.jsx` | ⏳ Pending |
| `src/Components/Review.jsx` | `src/shared/components/marketing/Review.jsx` | ⏳ Pending |
| `src/Components/ContactSection.jsx` | `src/shared/components/marketing/ContactSection.jsx` | ⏳ Pending |
| `src/Components/Dishes.jsx` | `src/shared/components/marketing/Dishes.jsx` | ⏳ Pending |
| `src/Components/DemoButton.jsx` | `src/shared/components/marketing/DemoButton.jsx` | ⏳ Pending |

---

## 🔧 SHARED: LAYOUTS

### Layouts → shared/layouts/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/Components/layouts/AdminLayout.jsx` | `src/shared/layouts/ManagerLayout.jsx` | ⏳ Pending |
| `src/Components/layouts/AdminHeader.jsx` | `src/shared/layouts/ManagerHeader.jsx` | ⏳ Pending |
| `src/Components/layouts/AdminSidebar.jsx` | `src/shared/layouts/ManagerSidebar.jsx` | ⏳ Pending |
| `src/Components/layouts/SuperAdminLayout.jsx` | `src/shared/layouts/SuperAdminLayout.jsx` | ⏳ Pending |
| `src/Components/layouts/SuperAdminHeader.jsx` | `src/shared/layouts/SuperAdminHeader.jsx` | ⏳ Pending |
| `src/Components/admin/ManagerUserMenu.jsx` | `src/shared/layouts/UserMenu.jsx` | ⏳ Pending |

---

## 🔧 SHARED: GUARDS

### Guards → shared/guards/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/Components/ProtectedRoute.jsx` | `src/shared/guards/ProtectedRoute.jsx` | ⏳ Pending |
| `src/Components/ProtectedOwnerRoute.jsx` | `src/shared/guards/ProtectedOwnerRoute.jsx` | ⏳ Pending |

---

## 🔧 SHARED: CONTEXTS

### Contexts → shared/contexts/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/context/RestaurantContext.jsx` | `src/shared/contexts/RestaurantContext.jsx` | ⏳ Pending |
| `src/lib/restaurantContextStore.js` | Merge into RestaurantContext | 🔄 Merge |

---

## 🔧 SHARED: HOOKS

### Hooks → shared/hooks/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/hooks/useRestaurant.js` | `src/shared/hooks/useRestaurant.js` | ⏳ Pending |
| `src/hooks/useTheme.js` | `src/shared/hooks/useTheme.js` | ⏳ Pending |
| `src/hooks/useSearch.js` | `src/shared/hooks/useSearch.js` | ⏳ Pending |
| `src/lib/localStorage.js` | `src/shared/hooks/useLocalStorage.js` (convert to hook) | 🔄 Refactor |

---

## 🔧 SHARED: UTILS

### API → shared/utils/api/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/lib/supabaseClient.js` | `src/shared/utils/api/supabaseClient.js` | ⏳ Pending |
| `src/lib/supabaseOwnerClient.js` | `src/shared/utils/api/supabaseOwnerClient.js` | ⏳ Pending |

### Auth → shared/utils/auth/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/utils/auth.js` | `src/shared/utils/auth/auth.js` | ⏳ Pending |
| `src/utils/authOwner.js` | `src/shared/utils/auth/authOwner.js` | ⏳ Pending |

### Permissions → shared/utils/permissions/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/utils/permissions.js` | `src/shared/utils/permissions/permissions.js` | ⏳ Pending |

### Helpers → shared/utils/helpers/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/utils/formatters.js` | `src/shared/utils/helpers/formatters.js` | ⏳ Pending |
| `src/utils/linkHelpers.js` | `src/shared/utils/helpers/linkHelpers.js` | ⏳ Pending |
| `src/utils/validation.js` | `src/shared/utils/helpers/validation.js` | ⏳ Pending |
| `src/utils/qrGenerator.js` | `src/shared/utils/helpers/qrGenerator.js` | ⏳ Pending |
| `src/utils/errorLogger.js` | `src/shared/utils/helpers/errorLogger.js` | ⏳ Pending |
| `src/utils/toast.jsx` | `src/shared/utils/helpers/toast.jsx` | ⏳ Pending |

### Constants → shared/utils/constants/
| Current Location | Target Location | Status |
|-----------------|-----------------|--------|
| `src/constants/index.jsx` | Split into multiple constant files | 🔄 Split |
| N/A | `src/shared/utils/constants/roles.js` | 🆕 Create |
| N/A | `src/shared/utils/constants/statuses.js` | 🆕 Create |
| N/A | `src/shared/utils/constants/config.js` | 🆕 Create |

---

## 🗑️ FILES TO DELETE (Duplicates)

| File | Reason |
|------|--------|
| `src/pages/Payment.jsx` | Duplicate of PaymentPage.jsx |
| `src/pages/manager/ManagerDashboard.jsx` | Duplicate, use admin/Dashboard.jsx |
| `src/pages/admin/AdminLogin.jsx` | Using unified login |
| `src/pages/superadmin/Restaurants.jsx` | Duplicate |
| `src/pages/superadmin/restaurants/RestaurantsList.jsx` | Duplicate |
| `src/pages/superadmin/restaurants/RestaurantsListEnhanced.jsx` | Duplicate |
| `src/pages/waiter/SimpleWaiterDashboard.jsx` | Review if needed, possibly merge |

---

## 🔄 FILES REQUIRING REVIEW

| File | Action Required |
|------|----------------|
| `src/lib/restaurantContextStore.js` | Merge into RestaurantContext.jsx |
| `src/lib/localStorage.js` | Convert to useLocalStorage hook |
| `src/constants/index.jsx` | Split into multiple domain-specific constant files |

---

## ✅ FILES ALREADY IN CORRECT LOCATION

| File | Location |
|------|----------|
| `src/pages/waiter/WaiterDashboard.jsx` | Already correct |
| `src/pages/waiter/WaiterLogin.jsx` | Already correct |

---

## 📦 NEW FILES TO CREATE

### Event System
- `src/shared/utils/events/eventBus.js` - Central event bus
- `src/shared/utils/events/eventTypes.js` - Event type definitions

### Domain Event Files
- `src/domains/notifications/events.js`
- `src/domains/analytics/events.js`
- `src/domains/staff/events.js`
- `src/domains/ordering/events.js`
- `src/domains/billing/events.js`

### Domain Index Files
- `src/domains/notifications/index.js`
- `src/domains/analytics/index.js`
- `src/domains/staff/index.js`
- `src/domains/ordering/index.js`
- `src/domains/billing/index.js`

### Domain Hooks (to be created)
- Analytics: useAnalytics, useReports, useInsights
- Staff: useStaff, usePermissions
- Ordering: useOrders, useMenu, useSessions
- Billing: useBilling, useInvoices, useTrials
- Notifications: useNotifications, useNotificationRealtime

### Public Pages
- `src/pages/public/HomePage.jsx` - Extract from App.jsx

---

## 📊 MIGRATION DEPENDENCY ORDER

To avoid breaking imports, files must be moved in this order:

1. **Phase 1: Create Infrastructure**
   - Create all domain folders
   - Create all shared folders
   - Create event system files
   - Create domain index.js and events.js

2. **Phase 2: Move Shared Utilities** (no dependencies)
   - shared/utils/api/
   - shared/utils/auth/
   - shared/utils/helpers/
   - shared/utils/constants/

3. **Phase 3: Move Shared Components** (depends on utils)
   - shared/components/primitives/
   - shared/components/feedback/

4. **Phase 4: Move Domains** (depends on shared)
   - domains/notifications/
   - domains/analytics/
   - domains/staff/
   - domains/ordering/
   - domains/billing/

5. **Phase 5: Move Complex Shared** (may depend on domains)
   - shared/components/compounds/
   - shared/components/marketing/
   - shared/layouts/
   - shared/guards/
   - shared/contexts/
   - shared/hooks/

6. **Phase 6: Move Pages** (depends on everything)
   - pages/customer/
   - pages/waiter/ (partial)
   - pages/chef/
   - pages/manager/
   - pages/superadmin/
   - pages/public/
   - pages/utility/

7. **Phase 7: Update App.jsx**
   - Update all route imports
   - Update lazy loading paths

8. **Phase 8: Cleanup**
   - Delete duplicate files
   - Remove empty directories
   - Verify all imports

---

## 🎯 IMPORT PATH STRATEGY

### Path Aliases (to add to vite.config.js)
```javascript
resolve: {
  alias: {
    '@': '/src',
    '@domains': '/src/domains',
    '@shared': '/src/shared',
    '@pages': '/src/pages',
  }
}
```

### Import Examples
```javascript
// Domains
import { OrderCard, useOrders } from '@domains/ordering';
import { NotificationBell } from '@domains/notifications';
import { RevenueChart } from '@domains/analytics';

// Shared
import { Button, Badge } from '@shared/components/primitives';
import { Modal, DataTable } from '@shared/components/compounds';
import { supabaseClient } from '@shared/utils/api';
import { ROLES } from '@shared/utils/constants';

// Pages
import TablePage from '@pages/customer/TablePage';
```

---

## 📈 SUCCESS METRICS

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Total Files | 268 | ~290 (incl. new) | ⏳ |
| Max Import Depth | 4+ levels | 2 levels | ⏳ |
| Duplicate Files | 7+ | 0 | ⏳ |
| Organized Domains | 0 | 5 | ⏳ |
| Role-Based Pages | Partial | 100% | ⏳ |
| Path Alias Usage | 0% | 100% | ⏳ |

---

**Next Step:** Begin Phase 1 - Create Infrastructure
