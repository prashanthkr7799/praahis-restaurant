-- ============================================================================
-- 13_indexes.sql
-- Additional performance indexes & optimization (avoid duplicates of earlier ones)
-- ============================================================================

-- Restaurants
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON public.restaurants(is_active);
-- Unique slug index (case-insensitive) to accelerate lookups via ?restaurant=slug
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_slug_unique_ci ON public.restaurants (lower(slug));

-- Tables
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status) WHERE is_active;

-- Menu Items
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available) WHERE is_available;

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_feedback ON public.orders(feedback_submitted);

-- Payments (subscription)
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_restaurant ON public.payments(restaurant_id);

-- Order Payments (customer)
CREATE INDEX IF NOT EXISTS idx_order_payments_status ON public.order_payments(status);

-- Feedbacks
CREATE INDEX IF NOT EXISTS idx_feedbacks_order ON public.feedbacks(order_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created ON public.feedbacks(created_at DESC);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON public.subscriptions(next_billing_date);

-- Billing
CREATE INDEX IF NOT EXISTS idx_billing_status ON public.billing(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoice ON public.billing(invoice_number);

-- Platform Admins
CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON public.platform_admins(email);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Auth Activity Logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_created ON public.auth_activity_logs(created_at DESC);

-- System Logs
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON public.system_logs(created_at DESC);

-- Backups
CREATE INDEX IF NOT EXISTS idx_backups_created ON public.backups(started_at DESC);

-- Menu Item Ratings already covered; add compound for restaurant+item if needed
CREATE INDEX IF NOT EXISTS idx_item_ratings_restaurant_item ON public.menu_item_ratings(restaurant_id, menu_item_id);

-- END PERFORMANCE INDEXES
