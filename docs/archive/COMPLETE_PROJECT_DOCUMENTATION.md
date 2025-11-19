# Praahis Restaurant Platform — Complete Technical Documentation

Last updated: 12 Nov 2025

## 1) Purpose and goals

Praahis is a multi-tenant restaurant platform that enables QR-based ordering, real-time kitchen tracking, table/session management, customer payments, and subscription-based tenant billing.

Primary goals:
- Customer: Scan table QR → browse menu → place order → pay (Razorpay) → track status → give feedback.
- Staff: Role-based dashboards for Waiter and Chef to manage orders efficiently and in real-time.
- Manager/Admin: Manage menu, tables, staff, orders, analytics, reports, QR codes, and payment settings.
- Super Admin (Owner): Operate the SaaS platform across restaurants, manage tenants, billing, subscriptions, audit and maintenance.
- Multi-tenancy and security: Supabase Auth + RLS enforce restaurant data isolation and per-tenant access control.

Architecture at a glance:
- Frontend: React 19 + Vite 6 + TailwindCSS + React Router 7, modular “domains” and shared component system.
- Backend: Supabase (Postgres, Auth, Storage, Realtime, Edge Functions); no custom Node/Express server is required.
- Payments: Razorpay per-restaurant credentials; Supabase Edge Function webhook; separate order payments vs platform billing.
- Realtime: Supabase Realtime channels for order updates.


## 2) Pages and modules (filenames and roles)

The UI is organized per audience under `src/pages/` plus shared components/guards/layouts under `src/shared/`. Below is an index of key pages/modules and their roles.

### Public/Customer pages (`src/pages/customer`)
- `TablePage.jsx` — Entry from QR scan: select items, create orders. Starts/uses table session.
- `PaymentPage.jsx` — Customer checkout via Razorpay; records in `order_payments` and updates `orders.payment_status`.
- `OrderStatusPage.jsx` — Track order status transitions (received → preparing → ready → served).
- `PostMealOptions.jsx` — Post-order actions, session completion path.
- `FeedbackPage.jsx` — Capture ratings/feedback linked to the table session and order.
- `ThankYouPage.jsx` — Completion/confirmation screen.

### Auth pages (`src/pages/auth`)
- `UnifiedLogin.jsx` — Dual-pane login page with two modes: SuperAdmin Login and Staff Login. The overlay toggles between panels; SuperAdmin uses the purple Admin panel (redirects to `/superadmin/dashboard`), while Staff (manager/chef/waiter) use the blue Staff panel (redirects to role-specific dashboards).

### Waiter (`src/pages/waiter`)
- `WaiterDashboard.jsx` — Create and manage orders for assigned restaurant/tables.
- `SimpleWaiterDashboard.jsx` — Minimal variant (used optionally).
- `WaiterLogin.jsx` — Legacy/login helper (routes now point to unified login).

### Chef (`src/pages/chef`)
- `ChefDashboard.jsx` — Update item/order statuses; real-time stream of kitchen queue.
- `ChefLogin.jsx` — Legacy/login helper (routes now point to unified login).

### Manager/Admin (`src/pages/manager`)
- `ManagerDashboard.jsx` / `ManagerDashboardNew.jsx` — KPIs, current orders, quick actions.
- `MenuManagementPage.jsx` — CRUD for menu items with categories/tags.
- `StaffManagementPage.jsx` — Manage staff accounts and roles.
- `OrdersManagementPage.jsx` — List/filter orders, inspect history.
- `PaymentsTrackingPage.jsx` — Track customer `order_payments` records.
- `OffersManagementPage.jsx` — Manage offers/discounts.
- `AnalyticsPage.jsx` — Restaurant-level analytics.
- `ReportsPage.jsx` — Exportable reports.
- `SettingsPage.jsx` — General settings.
- `PaymentSettingsPage.jsx` — Razorpay per-restaurant keys and gateway settings.
- `ActivityLogsPage.jsx` — Audit/activity logs view.
- `QRCodesManagementPage.jsx` — Generate/download table QR.
- `LinksPage.jsx` — Useful deep-links (e.g., shareable table links).

### Super Admin / Owner (`src/pages/superadmin`)
- `SuperAdminDashboard.jsx` — Legacy dashboard.
- `AnalyticsPage.jsx`, `AuditLogsPage.jsx`, `BackupManagement.jsx`, `MaintenanceModePage.jsx`, `DataExportPage.jsx` — Legacy pages.
- New professional dashboard (primary entry UI):
  - `dashboard/DashboardPage.jsx`
  - `restaurants/RestaurantsPage.jsx`, `restaurants/RestaurantDetailPage.jsx`, `RestaurantDetailPageNew.jsx`, `RestaurantForm.jsx`
  - `exports/DataExportPage.jsx`
  - `managers/ManagersList.jsx`
  - `settings/SystemSettings.jsx`

### Utility (`src/pages/utility`)
- `QRGeneratorPage.jsx` — Standalone QR generator.
- `UnifiedLoginPage.jsx` — Support for consolidated login.

### Shared layouts, guards, and components
- Layouts: `src/shared/layouts/ManagerLayout.jsx`, `ProfessionalSuperAdminLayout.jsx`, `SuperAdminLayout.jsx`.
- Guards: `src/shared/guards/ProtectedRoute.jsx`, `ProtectedOwnerRoute.jsx`.
- Components: `src/shared/components/{primitives,compounds,marketing,superadmin,feedback}`.
- Contexts/Hooks: `src/shared/contexts/RestaurantContext.jsx`, `src/shared/hooks/useRestaurant`.

### Domain modules (`src/domains`)
- `ordering/` — components (e.g., `MenuItem`, `OrdersTable`, `TableGridView`), hooks, utils.
- `billing/` — subscription/billing banners and logic; `SubscriptionExpiredScreen.jsx`, `SubscriptionBanner.jsx`.
- `analytics/`, `notifications/`, `staff/` — Feature-specific components/hooks/utils.

### Supabase clients and auth utils
- `src/shared/utils/api/supabaseClient.js` — Manager/staff client (storage key `sb-manager-session`).
- `src/shared/utils/api/supabaseOwnerClient.js` — Owner portal client (storage key `sb-owner-session`).
- `src/shared/utils/auth/auth.js` — Staff auth helpers (signIn/signOut/getCurrentUser).
- `src/shared/utils/auth/authOwner.js` — Owner auth helpers.
- Permission model: `src/shared/utils/permissions/permissions.js` (roles, permission sets, routing helpers).

### Supabase Edge Functions (`supabase/functions/*`)
- `payment-webhook/index.ts` — Razorpay/Stripe webhook, marks bills paid and logs to audit.
- `monthly-bill-generator/index.ts` — Generates tenant monthly bills.
- `daily-suspension-check/index.ts` — Auto-suspends overdue tenants.


## 3) End-to-end workflows and how pages connect

Login entry (common)
- Route: `/login` renders a dual-pane screen with SuperAdmin Login and Staff Login.
- SuperAdmin Login (purple panel) authenticates users with role `owner` or `superadmin` using the owner Supabase client and redirects to `/superadmin/dashboard`.
- Staff Login (blue panel) authenticates `manager`, `chef`, and `waiter` using the staff Supabase client and redirects to role-specific dashboards (`/manager/dashboard`, `/chef`, `/waiter`).

### A. Customer dining flow
1) QR scan → Table route
- Route: `/table/:id` → `TablePage.jsx`.
- Ensures/creates an active table session via RPC `get_or_create_table_session(table_id, restaurant_id)` and marks table occupied.
- Loads menu via `menu_items_with_ratings` (falls back to `menu_items`).

2) Create order
- `createOrder()` inserts into `orders` with `restaurant_id`, `table_id`, `session_id`, `items`, `subtotal`, `tax`, `total`, sets `order_status`=`pending_payment` or `received` depending on payment flow.
- Table is marked `occupied` and session is persisted.

3) Payment (customer)
- Route: `/payment/:orderId` → `PaymentPage.jsx`.
- Uses per-restaurant Razorpay keys (from `restaurants.payment_settings`) to open Razorpay checkout.
- On success: creates `order_payments` row, updates `orders.payment_status='paid'` and usually `order_status='received'`.

4) Live order tracking
- Route: `/order-status/:orderId` → `OrderStatusPage.jsx`.
- Subscribes to order updates via Supabase Realtime channel; reflects kitchen status changes.

5) Post-meal and feedback
- Route: `/post-meal/:sessionId/:tableNumber` and `/feedback/:sessionId`.
- `FeedbackPage.jsx` records rating/comments linked to `session_id` (and optionally `order_id`).
- Ending session uses RPC `end_table_session(session_id)` → marks table available.
- Redirect to `/thank-you`.

### B. Waiter flow
- Route: `/waiter` → `WaiterDashboard.jsx` via `ProtectedRoute` with roles `[waiter, manager, admin]`.
- Can create orders on behalf of tables, add/update items, and progress status.
- Backend: `orders` CRUD, `updateOrderItemStatus(orderId, menuItemId, nextStatus)` updates JSONB items and computes overall order status.

### C. Chef flow
- Route: `/chef` → `ChefDashboard.jsx` via `ProtectedRoute` with roles `[chef, manager, admin]`.
- Sees incoming orders except `pending_payment`. Updates items to `preparing/ready/served` and the overall `order_status`.
- Realtime feed keeps the UI synchronized.

### D. Manager/Admin flow
- Route: `/manager/*` under `ManagerLayout` via `ProtectedRoute` requiring role `manager`.
- Menu management: CRUD `menu_items`.
- Staff management: CRUD `users` records for restaurant.
- Orders: inspect/history on `orders`.
- Analytics/Reports: aggregate queries; exports via CSV/JSON/XLSX.
- QR codes: generate URLs to `/table/:id` per table.
- Payment settings: config Razorpay keys for their restaurant; toggles payment methods; ensures gateway routing.

### E. Super Admin/Owner (SaaS) flow
- Route: `/superadmin/*` under `ProfessionalSuperAdminLayout` via `ProtectedOwnerRoute`.
- Tenant management: create/update restaurants; view subscription overviews; audit logs; data export; backups; maintenance mode.
- Billing: monthly bills generated via edge function `monthly-bill-generator`; auto-suspension via `daily-suspension-check`.
- Webhook: `payment-webhook` marks tenant bill paid and reactivates suspended restaurants.


## 4) APIs, backend routes, and RPCs per workflow step

Note: The project uses Supabase JS client to call Postgres tables and RPCs. Key calls below:

### Customer/table session lifecycle
- RPC: `public.get_or_create_table_session(p_table_id UUID, p_restaurant_id UUID) → UUID`
- RPC: `public.end_table_session(p_session_id UUID) → BOOLEAN`
- Tables: `tables` (status/booked_at), `table_sessions` (active/completed)

### Ordering
- Create order: `supabase.from('orders').insert([...])`
- Fetch order: `supabase.from('orders').select(...).eq('id', orderId).single()`
- Update order: `supabase.from('orders').update({...}).eq('id', orderId)`
- Update one item in JSONB: helper `updateOrderItemStatus(orderId, menuItemId, nextStatus)` reads `orders.items`, mutates and writes back.
- Realtime subscription: `supabase.channel('orders-changes-chef-${restaurantId}')` with `postgres_changes` on `orders`.

### Customer payments (per order)
- Create payment record: `supabase.from('order_payments').insert([...])`
- Update order payment status: `supabase.from('orders').update({ payment_status: 'paid', order_status: 'received' })`
- Razorpay checkout uses restaurant’s keys from `restaurants.payment_settings` (see `PaymentSettingsPage.jsx` and `razorpayHelper.js`).

### Platform billing/subscriptions (tenants)
- Edge Function (HTTP): `POST /functions/v1/monthly-bill-generator` → calls `generate_monthly_bills()`
- Edge Function (HTTP): `POST /functions/v1/daily-suspension-check` → calls `suspend_overdue_restaurants()`
- Edge Function (HTTP): `POST /functions/v1/payment-webhook` → verifies gateway signature; calls `mark_bill_as_paid()`
- RPC: `generate_monthly_bills(billing_month, billing_year)` → inserts into `billing`
- RPC: `suspend_overdue_restaurants()` → sets `billing.status='overdue'` and deactivates restaurants
- RPC: `mark_bill_as_paid(p_billing_id UUID, p_payment_method text, p_txn_id text, p_verified_by uuid)` → inserts `payments`, sets `billing.status='paid'`, reactivates restaurant
- RPC: `get_restaurant_billing_summary(p_restaurant_id UUID)` → JSON summary
- Unified subscription model (alt path in `30_unified_subscription_system.sql`): `check_subscription_status`, `process_payment_and_reactivate`, etc.

### Auth and profile
- Supabase Auth (GoTrue): `auth.signInWithPassword`, `auth.getUser`, `auth.getSession`, `auth.signOut`.
- Profiles: `supabase.from('users').select('*').eq('id', user.id)` and updates.


## 5) Database schema: tables/views per feature

Core dining/order tables (see `database/01_schema.sql` + session extension `22_table_sessions.sql`):
- `restaurants` — Tenant entity; includes payment settings and is_active flag.
- `tables` — Physical tables; QR codes, status (`available/occupied/reserved/cleaning`).
- `menu_items` — Menu catalog with category, price, tags, availability.
- `orders` — Order header with `items` JSONB array, `payment_status`, `order_status`, and optional `session_id`.
- `order_payments` — Customer payment records (Razorpay) for orders; separate from platform billing.
- `feedbacks` — Customer feedback linked to `order_id` and `session_id`.
- `users` — Staff accounts with `role`, `restaurant_id`, `is_active`, etc.
- `table_sessions` — Session per seating; unique active per table; drives post-meal flow.

Platform billing/subscription tables (see `database/40_billing_payments_system.sql` and `30_unified_subscription_system.sql`):
- `billing` — Monthly bill per restaurant; amount = `table_count × rate_per_table_per_day × days_in_month`; due date and 3-day grace.
- `payments` — Platform-level payments for `billing` (not customer order payments).
- `subscriptions` — Unified subscription plan (alternative path), single-plan model with trial/grace/suspend.
- Views/utility: `subscription_overview` (owner dashboard), RPCs listed in §4.

Other notable tables (from migrations/SQL files):
- `audit_trail` — Centralized audit logs (edge functions and app actions).
- `auth_activity_logs` — Security/audit for route guard events.
- Optional `menu_items_with_ratings` view — Aggregated ratings (gracefully degraded if missing).


## 6) Frontend and backend logic summary

### Frontend (React/Vite/Tailwind)
- Routing: `src/App.jsx` wires public, staff, manager, and superadmin routes. Lazy-loaded pages reduce bundle size.
- Guards: `ProtectedRoute` enforces auth, role checks, and restaurant-context validation; `ProtectedOwnerRoute` for owner portal.
- State/context: `RestaurantProvider` persists active `restaurantId` and isolates data per tenant.
- Domains: Feature folders (`ordering`, `billing`, `analytics`, etc.) encapsulate components/hooks/utils.
- UI: Tailwind-based with component libraries (marketing site sections, superadmin UI with reusable Cards/Buttons/Toasts).
- Realtime: Subscriptions to `orders` for chef/waiter dashboards.

### Backend (Supabase)
- Auth: Supabase GoTrue; two clients for manager/staff vs owner to allow concurrent sessions.
- Data: Postgres with RLS policies to enforce tenant isolation and role-based access (e.g., managers see only their restaurant).
- RPC functions: Encapsulate complex operations (sessions, billing chores, subscription status, suspend/reactivate).
- Edge Functions (Deno): Scheduled jobs (monthly bill generation, daily suspension) and webhooks (payment confirmation).
- Storage/buckets: See `database/28_storage_buckets.sql` for bucket setup if used by assets.


## 7) Authentication, roles, and access control

Roles (see `src/shared/utils/permissions/permissions.js`):
- Owner (superadmin): Full cross-tenant access; owner portal under `/superadmin/*`.
- Admin/Manager: Full restaurant scope management; manager portal under `/manager/*`.
- Chef: Can view/update orders (kitchen statuses) for their restaurant.
- Waiter: Can create/view/update orders for their restaurant; limited management access.

Enforcement layers:
- Route guards: `ProtectedRoute` validates Supabase session, loads profile from `users`, checks `profile.role`, `is_active`, and ensures UI restaurant context matches `profile.restaurant_id` (prevents cross-tenant access). `ProtectedOwnerRoute` requires `is_owner` or role `owner`.
- RLS: SQL policies restrict table access (e.g., `billing`, `payments`, `order_payments`, `subscriptions`, `table_sessions`) to appropriate users or allow public insert/select where customer flows require it.
- Supabase Clients: Separate storage keys (`sb-manager-session` vs `sb-owner-session`) to isolate auth sessions.

Login UX and redirects:
- `/login` presents two panels in one screen:
  - SuperAdmin Login (purple panel) → authenticates users with `owner` or `superadmin` role using owner Supabase client and redirects to `/superadmin/dashboard`.
  - Staff Login (blue panel) → authenticates `manager`, `chef`, and `waiter` using staff Supabase client and redirects based on role (`/manager/dashboard`, `/chef`, `/waiter`).


## 8) Known bugs, limitations, and future improvements

Known/handled areas:
- Order vs Platform Payments separation: `order_payments` is used for customer checkout, while `payments` handles tenant billing. Code and migrations reflect this split.
- Optional views: `menu_items_with_ratings` may be absent in early deployments; client degrades to `menu_items`.
- Demo defaults: A `DEFAULT_RESTAURANT_ID` and context helper exist; ensure proper `restaurantId` selection in production.
- Time zones: Billing and cron rely on UTC; align expectations for due dates/grace in UI.
- Legacy routes: Old logins redirect to `/login` to unify entry.

Future improvements:
- Owner-side: Complete remaining superadmin pages (restaurant detail tabs, full audit views, backup scheduling UI, maintenance scheduling UI).
- Payments: Add webhook for order-level payments (currently provided for platform billing) and refund flows.
- Observability: Centralize client-side telemetry for guard denials and API errors.
- Performance: Add server-side pagination for large `orders`/`audit_trail` tables.
- Access UX: Self-service password reset and invitation flows; 2FA for owner/manager.


## 9) Setup and deployment

### Prerequisites
- Node.js 20+, npm
- Supabase project (URL + anon key)
- Razorpay account(s) per restaurant for live payments

### Environment variables
Create `.env.local` at project root with:
```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...your_anon_key...
```
Optional global fallback Razorpay (used only if a restaurant hasn’t configured keys):
```bash
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
VITE_RAZORPAY_KEY_SECRET=your_secret
```

### Install and run
```bash
npm install
npm run dev
```
App runs at http://localhost:5173

### Database initialization (Supabase SQL Editor)
Recommended order (core → sessions → RLS/policies → billing/subscriptions):
- `database/00_reset_database.sql` (optional for clean setup)
- `database/01_schema.sql`
- `database/02_seed.sql` (sample data)
- `database/22_table_sessions.sql`
- Rating/menu utilities: `database/06_item_ratings.sql`, `07_item_rating_summary.sql` (optional view)
- Multi-tenancy and RLS: `database/10_multitenancy.sql`, `11_rls_public_and_owner.sql`, `13_users_rls_self.sql`
- Superadmin schema/roles: `database/23_superadmin_schema.sql`
- Billing system: `database/40_billing_payments_system.sql`
- Order payments separation: `database/52_add_order_payments_table.sql`
- Per-restaurant Razorpay: `database/50_razorpay_per_restaurant.sql`

Run `database/08_verify.sql` and `diagnostic_check.sql` to validate setup. See `docs/TESTING_VALIDATION.md` and `docs/QUICK_TESTING_GUIDE.md` for quick checks.

### Supabase Edge Functions
Deploy functions and set secrets:
```bash
# From project root
supabase functions deploy monthly-bill-generator
supabase functions deploy daily-suspension-check
supabase functions deploy payment-webhook

# Required secrets
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```
Configure Razorpay webhook to:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook
```
Select events: `payment.captured`, `payment.failed`.

### Production build
```bash
npm run build
npm run preview   # optional local preview
```
Deploy the `dist/` folder to your static host (e.g., Netlify, Vercel, S3+CloudFront). Ensure environment variables are set at build/runtime.

### Role provisioning
- Create owner (superadmin) account and mark `users.is_owner=true` (or equivalent policy) for access to `/superadmin`.
- Create manager/chef/waiter users with `users.role` and `users.restaurant_id` populated.


## Appendices

### A. Key route map (high level)
- Public: `/`, `/table/:id`, `/payment/:orderId`, `/order-status/:orderId`, `/post-meal/:sessionId/:tableNumber`, `/feedback/:sessionId`, `/thank-you`
- Auth: `/login` (dual-pane: SuperAdmin Login + Staff Login) → redirects by role
- Waiter: `/waiter` (guarded)
- Chef: `/chef` (guarded)
- Manager: `/manager/*` (guarded)
- Owner: `/superadmin/*` (guarded; uses owner auth client)

### B. Minimal data contracts
- Order item (inside `orders.items` JSONB): `{ menu_item_id: UUID, name: string, qty: number, price: number, item_status?: 'queued'|'preparing'|'ready'|'served', ...timestamps }`
- Order: `{ id, restaurant_id, table_id, session_id?, items: OrderItem[], subtotal, tax, total, payment_status, order_status }`
- Table session: `{ id, table_id, restaurant_id, status: 'active'|'completed', started_at, ended_at? }`

### C. Error and edge cases
- Missing `restaurant_id` context for staff: Guard denies and logs to `auth_activity_logs`.
- RLS blocks: Inserts/updates may return empty rows; client logs and continues where safe (e.g., table status update failure doesn’t block order creation).
- Payment success + order update failure: fixed; ensure `restaurant_id` is included in payments and robust error handling.

---

This document summarizes the entire system spanning UI routes, backend functions, data models, auth/RBAC, and deployment. For role-specific screenshots and step-by-step operator guides, see the `docs/` folder (notably `SUPERADMIN_*`, `MULTI_TENANT_PAYMENTS.md`, and `QUICK_TESTING_GUIDE.md`).