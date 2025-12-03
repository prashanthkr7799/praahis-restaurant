import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@config/queryClient';

// Shared Infrastructure Imports
import ErrorBoundary from '@shared/components/feedback/ErrorBoundary';
import ManagerLayout from '@shared/layouts/ManagerLayout';
import ProtectedRoute from '@shared/guards/ProtectedRoute';
import ProtectedOwnerRoute from '@shared/guards/ProtectedOwnerRoute';
import { ROLES } from '@shared/utils/permissions';

// SaaS Landing Page Components
import SaaSNavbar from '@features/landing/components/SaaSNavbar';
import SaaSHero from '@features/landing/components/SaaSHero';
import FeaturesGrid from '@features/landing/components/FeaturesGrid';
import HowItWorks from '@features/landing/components/HowItWorks';
import Benefits from '@features/landing/components/Benefits';
import Testimonials from '@features/landing/components/Testimonials';
import Pricing from '@features/landing/components/Pricing';
import ContactCTA from '@features/landing/components/ContactCTA';
import SaaSFooter from '@features/landing/components/SaaSFooter';

// Customer Pages
const TablePage = lazy(() => import('@features/customer/pages/MenuPage'));
const LegacyCustomerMenuRedirect = lazy(
  () => import('@features/customer/pages/LegacyCustomerMenuRedirect')
);
const PaymentPage = lazy(() => import('@features/customer/pages/PaymentPage'));
const PaymentCallbackPage = lazy(() => import('@features/customer/pages/PaymentCallbackPage'));
const OrderStatusPage = lazy(() => import('@features/customer/pages/OrderStatusPage'));
const PostMealOptions = lazy(() => import('@features/customer/pages/PostMealOptionsPage'));
const FeedbackPage = lazy(() => import('@features/customer/pages/FeedbackPage'));
const ThankYouPage = lazy(() => import('@features/customer/pages/ThankYouPage'));

// Chef Pages
const ChefDashboard = lazy(() => import('@features/chef/pages/KitchenDisplayPage'));

// Utility Pages
const QRGenerator = lazy(() => import('@features/manager/pages/QRGeneratorPage'));

// Authentication Pages
const StaffLogin = lazy(() => import('@features/auth/pages/StaffLoginPage'));
const SuperAdminLogin = lazy(() => import('@features/auth/pages/AdminLoginPage'));
const ForgotPassword = lazy(() => import('@features/auth/pages/ForgotPasswordPage'));
const ResetPassword = lazy(() => import('@features/auth/pages/ResetPasswordPage'));

// Manager Pages
const Dashboard = lazy(() => import('@features/manager/pages/DashboardPage'));
// Menu, Tables, Staff, Orders, QR Codes - All integrated in Dashboard tabs (no separate pages needed)
const PaymentsTracking = lazy(() => import('@features/manager/pages/PaymentTrackingPage'));
const Analytics = lazy(() => import('@features/manager/pages/AnalyticsPage'));
const ReportsPage = lazy(() => import('@features/manager/pages/ReportsPage'));
const Settings = lazy(() => import('@features/manager/pages/SettingsPage'));
const PaymentSettings = lazy(() => import('@features/manager/pages/PaymentSettingsPage'));
const ActivityLogs = lazy(() => import('@features/manager/pages/ActivityLogsPage'));
const SubscriptionPage = lazy(() => import('@features/manager/pages/SubscriptionPage'));

// Waiter Pages
const WaiterDashboard = lazy(() => import('@features/waiter/pages/WaiterDashboardPage'));

// Admin (Superadmin) Pages
const ProfessionalSuperAdminLayout = lazy(() => import('@shared/layouts/AdminLayout'));
const SuperAdminDashboardNew = lazy(() => import('@features/admin/pages/DashboardPage'));
const RestaurantsPageNew = lazy(() => import('@features/admin/pages/RestaurantsPage'));
const RestaurantForm = lazy(() => import('@features/admin/components/restaurants/RestaurantForm'));
const RestaurantDetailPageNew = lazy(() => import('@features/admin/pages/RestaurantDetailPage'));
const ManagersList = lazy(() => import('@features/admin/pages/ManagersPage'));
// SystemSettings disabled (platform_settings table not in schema)
const SuperAdminAnalytics = lazy(() => import('@features/admin/pages/AnalyticsPage'));
const DataExportPageNew = lazy(() => import('@features/admin/pages/ExportsPage'));
const SuperAdminAuditLogs = lazy(() => import('@features/admin/pages/AuditLogsPage'));
const SuperAdminBackupManagement = lazy(() => import('@features/admin/pages/BackupManagementPage'));
// MaintenanceMode page disabled (RPCs not available)
const BillingManagementPage = lazy(() => import('@features/admin/pages/BillingPage'));
const NotificationsPage = lazy(() => import('@features/admin/pages/NotificationsPage'));

// Demo Page
const SafeDemoPage = lazy(() => import('@features/demo/pages/SafeDemoPage'));

const HomePage = () => {
  return (
    <main className="min-h-screen bg-[#0a0e1a] text-neutral-200 antialiased">
      <SaaSNavbar />
      <SaaSHero />
      <FeaturesGrid />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <Pricing />
      <ContactCTA />
      <SaaSFooter />
    </main>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-gray-200 border-t-gray-700" />
            </div>
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/safe-demo" element={<SafeDemoPage />} />
            <Route path="/table/:id" element={<TablePage />} />
            {/* Legacy QR route pattern support - multiple formats */}
            <Route
              path="/customer/menu/:restaurantId/:tableId"
              element={<LegacyCustomerMenuRedirect />}
            />
            <Route path="/menu/:restaurantId" element={<LegacyCustomerMenuRedirect />} />
            <Route path="/payment/:orderId" element={<PaymentPage />} />
            <Route path="/payment-callback" element={<PaymentCallbackPage />} />
            <Route path="/order-status/:orderId" element={<OrderStatusPage />} />

            {/* Session-based routes */}
            <Route path="/post-meal/:sessionId/:tableNumber" element={<PostMealOptions />} />
            <Route path="/order-served/:sessionId/:tableNumber" element={<PostMealOptions />} />
            <Route path="/feedback/:sessionId" element={<FeedbackPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />

            {/* Chef Routes */}
            <Route
              path="/chef/dashboard"
              element={
                <ProtectedRoute requiredRoles={[ROLES.CHEF, ROLES.MANAGER, ROLES.ADMIN]}>
                  <ChefDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef"
              element={
                <ProtectedRoute requiredRoles={[ROLES.CHEF, ROLES.MANAGER, ROLES.ADMIN]}>
                  <ChefDashboard />
                </ProtectedRoute>
              }
            />

            {/* Waiter Routes */}
            <Route
              path="/waiter/dashboard"
              element={
                <ProtectedRoute requiredRoles={[ROLES.WAITER, ROLES.MANAGER, ROLES.ADMIN]}>
                  <WaiterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/waiter/simple"
              element={
                <ProtectedRoute requiredRoles={[ROLES.WAITER, ROLES.MANAGER, ROLES.ADMIN]}>
                  <WaiterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/waiter"
              element={
                <ProtectedRoute requiredRoles={[ROLES.WAITER, ROLES.MANAGER, ROLES.ADMIN]}>
                  <WaiterDashboard />
                </ProtectedRoute>
              }
            />

            {/* ============================================ */}
            {/* SEPARATED LOGIN SYSTEM - Two Entry Points  */}
            {/* ============================================ */}

            {/* Staff Login - Restaurant staff only (Manager/Chef/Waiter) */}
            <Route path="/login" element={<StaffLogin />} />

            {/* SuperAdmin Login - Platform administrators only */}
            <Route path="/superadmin-login" element={<SuperAdminLogin />} />

            {/* Password Reset - Works for both staff and admin */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Legacy login redirects - maintain backward compatibility */}
            <Route path="/superadmin/login" element={<Navigate to="/superadmin-login" replace />} />
            <Route path="/chef/login" element={<Navigate to="/login" replace />} />
            <Route path="/waiter/login" element={<Navigate to="/login" replace />} />
            <Route path="/manager/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />

            {/* Legacy admin routes redirect to manager */}
            <Route path="/admin/*" element={<Navigate to="/manager/dashboard" replace />} />

            {/* Super Admin (Owner) Routes - Professional Dashboard */}
            <Route
              path="/superadmin"
              element={
                <ProtectedOwnerRoute>
                  <ProfessionalSuperAdminLayout />
                </ProtectedOwnerRoute>
              }
            >
              <Route index element={<SuperAdminDashboardNew />} />
              <Route path="dashboard" element={<SuperAdminDashboardNew />} />
              <Route path="restaurants" element={<RestaurantsPageNew />} />

              {/* Static routes MUST come before dynamic :restaurantId route */}
              <Route path="restaurants/add" element={<RestaurantsPageNew />} />
              <Route path="restaurants/new" element={<RestaurantsPageNew />} />

              {/* Dynamic routes come after static ones */}
              <Route path="restaurants/:restaurantId" element={<RestaurantDetailPageNew />} />
              <Route path="restaurants/:restaurantId/edit" element={<RestaurantForm />} />

              <Route path="export" element={<DataExportPageNew />} />
              <Route path="audit" element={<SuperAdminAuditLogs />} />

              {/* Other pages */}
              <Route path="managers" element={<ManagersList />} />
              <Route path="analytics" element={<SuperAdminAnalytics />} />
              <Route path="billing" element={<BillingManagementPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
              <Route path="backups" element={<SuperAdminBackupManagement />} />
              {/* maintenance/settings routes removed - backend not present */}
            </Route>

            {/* Manager Portal Routes */}
            <Route
              path="/manager"
              element={
                <ProtectedRoute requiredRoles={[ROLES.MANAGER]}>
                  <ManagerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              {/* Menu, Tables, Staff, Orders, QR Codes - All integrated in Dashboard tabs */}
              <Route path="payments" element={<PaymentsTracking />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="reports" element={<ReportsPage />} />
              {/* Combine Billing into Subscription: redirect billing to subscription */}
              <Route path="billing" element={<Navigate to="/manager/subscription" replace />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="logs" element={<ActivityLogs />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/payment" element={<PaymentSettings />} />
              <Route path="qr-generator" element={<QRGenerator />} />

              {/* Fallback route */}
              <Route
                path="*"
                element={
                  <div className="p-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
                    <p className="text-gray-600">This page is under construction</p>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
