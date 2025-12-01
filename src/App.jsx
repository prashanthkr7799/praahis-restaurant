import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Shared Infrastructure Imports (NEW PATHS)
import ErrorBoundary from '@/shared/components/feedback/ErrorBoundary'
import ManagerLayout from '@/shared/layouts/ManagerLayout'
import ProtectedRoute from '@/shared/guards/ProtectedRoute'
import ProtectedOwnerRoute from '@/shared/guards/ProtectedOwnerRoute'
import { ROLES } from '@/shared/utils/permissions/permissions'

// SaaS Landing Page Components (NEW)
import SaaSNavbar from '@/shared/components/landing/SaaSNavbar'
import SaaSHero from '@/shared/components/landing/SaaSHero'
import FeaturesGrid from '@/shared/components/landing/FeaturesGrid'
import HowItWorks from '@/shared/components/landing/HowItWorks'
import Benefits from '@/shared/components/landing/Benefits'
import Testimonials from '@/shared/components/landing/Testimonials'
import Pricing from '@/shared/components/landing/Pricing'
import ContactCTA from '@/shared/components/landing/ContactCTA'
import SaaSFooter from '@/shared/components/landing/SaaSFooter'

// Customer Pages (NEW PATHS)
const TablePage = lazy(() => import('@/pages/customer/TablePage'))
const LegacyCustomerMenuRedirect = lazy(() => import('@/pages/customer/LegacyCustomerMenuRedirect'))
const PaymentPage = lazy(() => import('@/pages/customer/PaymentPage'))
const PaymentCallbackPage = lazy(() => import('@/pages/customer/PaymentCallbackPage'))
const OrderStatusPage = lazy(() => import('@/pages/customer/OrderStatusPage'))
const PostMealOptions = lazy(() => import('@/pages/customer/PostMealOptions'))
const FeedbackPage = lazy(() => import('@/pages/customer/FeedbackPage'))
const ThankYouPage = lazy(() => import('@/pages/customer/ThankYouPage'))

// Chef Pages (NEW PATHS)
const ChefDashboard = lazy(() => import('@/pages/chef/ChefDashboard'))

// Utility Pages (NEW PATHS)
const QRGenerator = lazy(() => import('@/pages/utility/QRGeneratorPage'))

// Authentication Pages (SEPARATED LOGIN SYSTEM)
const StaffLogin = lazy(() => import('@/pages/auth/StaffLogin'))
const SuperAdminLogin = lazy(() => import('@/pages/auth/SuperAdminLogin'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))

// Manager Pages (NEW PATHS)
const Dashboard = lazy(() => import('@/pages/manager/ManagerDashboard'))
// Menu, Tables, Staff, Orders, QR Codes - All integrated in Dashboard tabs (no separate pages needed)
const PaymentsTracking = lazy(() => import('@/pages/manager/PaymentsTrackingPage'))
const Analytics = lazy(() => import('@/pages/manager/AnalyticsPage'))
const ReportsPage = lazy(() => import('@/pages/manager/ReportsPage'))
const Settings = lazy(() => import('@/pages/manager/SettingsPage'))
const PaymentSettings = lazy(() => import('@/pages/manager/PaymentSettingsPage'))
const ActivityLogs = lazy(() => import('@/pages/manager/ActivityLogsPage'))
const SubscriptionPage = lazy(() => import('@/pages/manager/SubscriptionPage'))

// Waiter Pages (NEW PATHS)
const WaiterDashboard = lazy(() => import('@/pages/waiter/WaiterDashboard'))

// Superadmin Pages (NEW PATHS)
const ProfessionalSuperAdminLayout = lazy(() => import('@/shared/layouts/ProfessionalSuperAdminLayout'))
const SuperAdminDashboardNew = lazy(() => import('@/pages/superadmin/dashboard/DashboardPage'))
const RestaurantsPageNew = lazy(() => import('@/pages/superadmin/restaurants/RestaurantsPage'))
const RestaurantForm = lazy(() => import('@/pages/superadmin/restaurants/RestaurantForm'))
const RestaurantDetailPageNew = lazy(() => import('@/pages/superadmin/restaurants/RestaurantDetailPageNew'))
const ManagersList = lazy(() => import('@/pages/superadmin/managers/ManagersList'))
// SystemSettings disabled (platform_settings table not in schema)
const SuperAdminAnalytics = lazy(() => import('@/pages/superadmin/AnalyticsPage'))
const DataExportPageNew = lazy(() => import('@/pages/superadmin/exports/DataExportPage'))
const SuperAdminAuditLogs = lazy(() => import('@/pages/superadmin/AuditLogsPage'))
const SuperAdminBackupManagement = lazy(() => import('@/pages/superadmin/BackupManagement'))
// MaintenanceMode page disabled (RPCs not available)
const BillingManagementPage = lazy(() => import('@/pages/superadmin/billing/BillingManagementPage'))
const NotificationsPage = lazy(() => import('@/pages/superadmin/notifications/NotificationsPage'))

// Demo Page (NEW)
const SafeDemoPage = lazy(() => import('@/pages/SafeDemoPage'))

const HomePage = () => {
  return (
    <main className='min-h-screen bg-[#0a0e1a] text-neutral-200 antialiased'>
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
  )
}

const App = () => {
  
  return (
    <>
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 rounded-full border-4 border-gray-200 border-t-gray-700" /></div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/safe-demo" element={<SafeDemoPage />} />
            <Route path="/table/:id" element={<TablePage />} />
            {/* Legacy QR route pattern support - multiple formats */}
            <Route path="/customer/menu/:restaurantId/:tableId" element={<LegacyCustomerMenuRedirect />} />
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
            <Route path="/superadmin" element={
              <ProtectedOwnerRoute>
                <ProfessionalSuperAdminLayout />
              </ProtectedOwnerRoute>
            }>
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
            <Route path="/manager" element={
              <ProtectedRoute requiredRoles={[ROLES.MANAGER]}>
                <ManagerLayout />
              </ProtectedRoute>
            }>
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
              <Route path="*" element={
                <div className="p-6 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
                  <p className="text-gray-600">This page is under construction</p>
                </div>
              } />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

export default App