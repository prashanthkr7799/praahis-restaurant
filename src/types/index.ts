/**
 * TypeScript Type Definitions for Praahis Restaurant SaaS
 * Core domain types for the application
 */

// ========================================
// User & Authentication Types
// ========================================

export type UserRole = 'customer' | 'waiter' | 'chef' | 'manager' | 'admin' | 'owner';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  restaurant_id?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

// ========================================
// Restaurant & Multi-Tenancy Types
// ========================================

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency: string;
  timezone: string;
  is_active: boolean;
  settings: RestaurantSettings;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSettings {
  theme_color?: string;
  enable_takeaway?: boolean;
  enable_delivery?: boolean;
  enable_reservations?: boolean;
  tax_rate?: number;
  service_charge?: number;
}

export interface RestaurantContext {
  restaurantId: string | null;
  restaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
}

// ========================================
// Menu & Category Types
// ========================================

export interface Category {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  restaurant_id: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  category?: Category;
  image_url?: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  is_available: boolean;
  is_bestseller: boolean;
  preparation_time?: number; // minutes
  allergens?: string[];
  restaurant_id: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// Table & Session Types
// ========================================

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface Table {
  id: string;
  table_number: number;
  capacity: number;
  status: TableStatus;
  qr_code_url?: string;
  section?: string;
  is_active: boolean;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
}

export interface TableSession {
  id: string;
  table_id: string;
  started_at: string;
  ended_at?: string;
  guest_count?: number;
  status: 'active' | 'completed' | 'abandoned';
  restaurant_id: string;
}

// ========================================
// Cart & Order Types
// ========================================

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
  addedAt: string;
}

export interface Cart {
  items: CartItem[];
  tableId?: string;
  sessionId?: string;
  subtotal: number;
  tax: number;
  total: number;
}

export type OrderStatus =
  | 'pending_payment'
  | 'received'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item?: MenuItem;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface Order {
  id: string;
  order_number: string;
  table_id?: string;
  table?: Table;
  session_id?: string;
  customer_name?: string;
  customer_phone?: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  status: OrderStatus;
  payment_status: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  total: number;
  notes?: string;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// Payment Types
// ========================================

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'razorpay';

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  metadata?: Record<string, unknown>;
  restaurant_id: string;
  created_at: string;
}

export interface RazorpayConfig {
  key_id: string;
  key_secret?: string;
  webhook_secret?: string;
}

// ========================================
// Feedback & Review Types
// ========================================

export interface Feedback {
  id: string;
  order_id?: string;
  session_id?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  food_rating?: number;
  service_rating?: number;
  ambience_rating?: number;
  would_recommend: boolean;
  restaurant_id: string;
  created_at: string;
}

// ========================================
// Subscription & Billing Types
// ========================================

export type SubscriptionPlan = 'trial' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'grace_period';
export type BillingCycle = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  restaurant_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  grace_period_end?: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// Notification Types
// ========================================

export type NotificationType =
  | 'order_received'
  | 'order_ready'
  | 'order_served'
  | 'payment_received'
  | 'table_request'
  | 'low_stock'
  | 'subscription_expiring'
  | 'system';

export interface Notification {
  id: string;
  user_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  restaurant_id?: string;
  created_at: string;
}

// ========================================
// Analytics Types
// ========================================

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeOrders: number;
  occupiedTables: number;
  averageOrderValue: number;
  popularItems: MenuItem[];
  revenueByHour: { hour: number; revenue: number }[];
}

export interface SalesReport {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topItems: { item: MenuItem; count: number; revenue: number }[];
  paymentMethods: { method: PaymentMethod; count: number; amount: number }[];
}

// ========================================
// Activity Log Types
// ========================================

export interface ActivityLog {
  id: string;
  user_id: string;
  user?: User;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  restaurant_id?: string;
  created_at: string;
}

// ========================================
// API Response Types
// ========================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  count?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ========================================
// Form & Validation Types
// ========================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string | undefined>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ========================================
// Realtime Types
// ========================================

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T> {
  eventType: RealtimeEvent;
  new: T;
  old: T | null;
  table: string;
}

export interface RealtimeSubscription {
  channel: string;
  table: string;
  filter?: string;
  callback: (payload: RealtimePayload<unknown>) => void;
}
