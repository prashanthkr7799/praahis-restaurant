/**
 * Manager Dashboard - Complete Redesign
 * Modern dashboard with organized sections, quick actions, and enhanced UX
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown,
  ShoppingCart, 
  Users, 
  DollarSign, 
  RefreshCw, 
  UtensilsCrossed, 
  CreditCard, 
  QrCode, 
  BarChart3, 
  Settings, 
  FileText,
  Plus,
  LayoutGrid,
  Bell,
  ChevronRight,
  Clock
} from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency } from '@shared/utils/helpers/formatters';
import { getCurrentUser } from '@shared/utils/auth/auth';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import DashboardHeader from '@shared/components/compounds/DashboardHeader';
import BillingWarningCard from '@domains/billing/components/BillingWarningCard';

const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    activeOrders: 0,
    totalStaff: 0,
    yesterdayRevenue: 0,
    yesterdayOrders: 0,
    yesterdayActiveOrders: 0,
    lastWeekStaff: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    loadUser();
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const loadUser = async () => {
    const { user, profile } = await getCurrentUser();
    setCurrentUser({ ...user, ...profile });
  };

  const loadDashboardData = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get yesterday's date range
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Fetch today's orders
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (ordersError) throw ordersError;

      // Fetch yesterday's orders
      const { data: yesterdayOrders, error: yesterdayOrdersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      if (yesterdayOrdersError) throw yesterdayOrdersError;

      // Calculate revenues
      const todayRevenue = todayOrders
        ?.filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      const yesterdayRevenue = yesterdayOrders
        ?.filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      // Active orders (today and yesterday)
      const { data: activeOrdersToday, error: activeTodayError } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .in('order_status', ['received', 'preparing', 'ready'])
        .gte('created_at', today.toISOString());

      if (activeTodayError) throw activeTodayError;

      const { data: activeOrdersYesterday, error: activeYesterdayError } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .in('order_status', ['received', 'preparing', 'ready'])
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      if (activeYesterdayError) throw activeYesterdayError;

      // Total staff
      const { data: staff, error: staffError } = await supabase
        .from('users')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Recent orders
      const { data: recent, error: recentError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          order_status,
          payment_status,
          total,
          created_at,
          table_id,
          tables (table_number)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(6);

      if (recentError) throw recentError;

      setStats({
        todayRevenue,
        todayOrders: todayOrders?.length || 0,
        activeOrders: activeOrdersToday?.length || 0,
        totalStaff: staff?.length || 0,
        yesterdayRevenue,
        yesterdayOrders: yesterdayOrders?.length || 0,
        yesterdayActiveOrders: activeOrdersYesterday?.length || 0,
        lastWeekStaff: staff?.length || 0, // In real app, fetch last week's count
      });

      setRecentOrders(recent || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (current, previous) => {
    if (previous === 0) return { trend: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      trend: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const revenueTrend = calculateTrend(stats.todayRevenue, stats.yesterdayRevenue);
  const ordersTrend = calculateTrend(stats.todayOrders, stats.yesterdayOrders);
  const activeTrend = calculateTrend(stats.activeOrders, stats.yesterdayActiveOrders);

  return (
    <div className="space-y-6" aria-labelledby="dashboard-title">
      {/* Page header */}
      <DashboardHeader user={currentUser} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 id="dashboard-title" className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Quick Actions Bar - Professional Design */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/manager/orders')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-smooth font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">New Order</span>
        </button>
        <button
          onClick={() => navigate('/manager/tables')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-smooth hover:scale-[1.02] hover:border-primary/30"
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="hidden sm:inline">Active Tables</span>
        </button>
        <button
          onClick={() => navigate('/manager/reports')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-smooth hover:scale-[1.02] hover:border-primary/30"
        >
          <FileText className="h-5 w-5" />
          <span className="hidden sm:inline">Today's Report</span>
        </button>
        <button
          onClick={() => navigate('/manager/billing')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-smooth hover:scale-[1.02] hover:border-primary/30"
        >
          <CreditCard className="h-5 w-5" />
          <span className="hidden sm:inline">Billing</span>
        </button>
        <button className="inline-flex items-center gap-2 px-5 py-3 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-smooth relative hover:scale-[1.02] hover:border-primary/30">
          <Bell className="h-5 w-5" />
          <span className="hidden sm:inline">Notifications</span>
          {stats.activeOrders > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold ring-4 ring-background animate-pulse">
              {stats.activeOrders}
            </span>
          )}
        </button>
      </div>

      {/* KPI Cards with Trends - Professional Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Revenue - Emerald */}
        <div className="group relative bg-card rounded-xl p-6 border border-border card-lift overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-50" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-success/10 rounded-xl ring-1 ring-success/20">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              {revenueTrend.isPositive ? (
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  <span>{revenueTrend.trend}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-destructive text-sm font-medium">
                  <TrendingDown className="h-4 w-4" />
                  <span>{revenueTrend.trend}%</span>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">{formatCurrency(stats.todayRevenue)}</p>
              <p className="text-xs text-muted-foreground">vs yesterday</p>
            </div>
          </div>
        </div>

        {/* Today's Orders - Coral */}
        <div className="group relative bg-card rounded-xl p-6 border border-border card-lift overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              {ordersTrend.isPositive ? (
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  <span>{ordersTrend.trend}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-destructive text-sm font-medium">
                  <TrendingDown className="h-4 w-4" />
                  <span>{ordersTrend.trend}%</span>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Today's Orders</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">{stats.todayOrders}</p>
              <p className="text-xs text-muted-foreground">vs yesterday</p>
            </div>
          </div>
        </div>

        {/* Active Orders - Amber */}
        <div className="group relative bg-card rounded-xl p-6 border border-border card-lift overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-50" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-warning/10 rounded-xl ring-1 ring-warning/20">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              {activeTrend.isPositive ? (
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  <span>{activeTrend.trend}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-destructive text-sm font-medium">
                  <TrendingDown className="h-4 w-4" />
                  <span>{activeTrend.trend}%</span>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">{stats.activeOrders}</p>
              <p className="text-xs text-muted-foreground">vs yesterday</p>
            </div>
          </div>
        </div>

        {/* Total Staff - Info Blue */}
        <div className="group relative bg-card rounded-xl p-6 border border-border card-lift overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent opacity-50" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-info/10 rounded-xl ring-1 ring-info/20">
                <Users className="h-6 w-6 text-info" />
              </div>
              <div className="text-sm text-muted-foreground">
                —
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">{stats.totalStaff}</p>
              <p className="text-xs text-muted-foreground">active members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Warning Card */}
      <BillingWarningCard restaurantId={restaurantId} />

      {/* SECTION 1: Daily Operations */}
      <section aria-label="Daily Operations">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">Daily Operations</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage day-to-day restaurant activities</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Menu */}
          <button
            onClick={() => navigate('/manager/menu')}
            className="group relative bg-card border border-border rounded-xl p-6 card-lift text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20 group-hover:bg-primary/20 group-hover:ring-primary/40 transition-smooth">
                  <UtensilsCrossed className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5">Menu</h3>
              <p className="text-sm text-muted-foreground">Manage items and categories</p>
            </div>
          </button>

          {/* Tables */}
          <button
            onClick={() => navigate('/manager/tables')}
            className="group relative bg-card border border-border rounded-xl p-6 card-lift text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-success/10 rounded-xl ring-1 ring-success/20 group-hover:bg-success/20 group-hover:ring-success/40 transition-smooth">
                  <LayoutGrid className="h-6 w-6 text-success" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-smooth" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5">Tables</h3>
              <p className="text-sm text-muted-foreground">Manage table status and sessions</p>
            </div>
          </button>

          {/* Orders */}
          <button
            onClick={() => navigate('/manager/orders')}
            className="group relative bg-card border border-border rounded-xl p-6 card-lift text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-info/10 rounded-xl ring-1 ring-info/20 group-hover:bg-info/20 group-hover:ring-info/40 transition-smooth">
                  <ShoppingCart className="h-6 w-6 text-info" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-info group-hover:translate-x-1 transition-smooth" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5">Orders</h3>
              <p className="text-sm text-muted-foreground">View and manage orders</p>
            </div>
          </button>

          {/* Payments */}
          <button
            onClick={() => navigate('/manager/payments')}
            className="group relative bg-card border border-border rounded-xl p-6 card-lift text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-success/10 rounded-xl ring-1 ring-success/20 group-hover:bg-success/20 group-hover:ring-success/40 transition-smooth">
                  <CreditCard className="h-6 w-6 text-success" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-smooth" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5">Payments</h3>
              <p className="text-sm text-muted-foreground">Transactions and status</p>
            </div>
          </button>

          {/* Offers disabled */}

          {/* QR Codes */}
          <button
            onClick={() => navigate('/manager/qr-codes')}
            className="group relative bg-card border border-border rounded-xl p-6 card-lift text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20 group-hover:bg-primary/20 group-hover:ring-primary/40 transition-smooth">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5">QR Codes</h3>
              <p className="text-sm text-muted-foreground">Manage table QR codes</p>
            </div>
          </button>
        </div>
      </section>

      {/* SECTION 2: Insights & Admin */}
      <section aria-label="Insights & Admin">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">Insights & Admin</h2>
          <p className="text-sm text-muted-foreground mt-1">Analytics, reports, and team management</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Analytics */}
          <button
            onClick={() => navigate('/manager/analytics')}
            className="group relative bg-card border border-border rounded-xl p-6 card-lift text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-info/10 rounded-xl ring-1 ring-info/20 group-hover:bg-info/20 group-hover:ring-info/40 transition-smooth">
                  <BarChart3 className="h-6 w-6 text-info" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-info group-hover:translate-x-1 transition-smooth" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5">Analytics</h3>
              <p className="text-sm text-muted-foreground">Sales and performance insights</p>
            </div>
          </button>

          {/* Reports */}
          <button
            onClick={() => navigate('/manager/reports')}
            className="group relative bg-card border border-border rounded-xl p-6 card-lift text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-success/10 rounded-xl ring-1 ring-success/20 group-hover:bg-success/20 group-hover:ring-success/40 transition-smooth">
                  <FileText className="h-6 w-6 text-success" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-success group-hover:translate-x-1 transition-smooth" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5">Reports</h3>
              <p className="text-sm text-muted-foreground">Download daily/weekly summaries</p>
            </div>
          </button>

          {/* Staff */}
          <button
            onClick={() => navigate('/manager/staff')}
            className="group relative bg-card border border-border rounded-xl p-6 card-lift text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20 group-hover:bg-primary/20 group-hover:ring-primary/40 transition-smooth">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5">Staff</h3>
              <p className="text-sm text-muted-foreground">Invite and manage team members</p>
            </div>
          </button>
        </div>
      </section>

      {/* SECTION 3: Configuration */}
      <section aria-label="Configuration">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">Restaurant settings and preferences</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Settings */}
          <button
            onClick={() => navigate('/manager/settings')}
            className="group relative bg-card border border-border rounded-xl p-6 card-lift text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted/30 rounded-xl ring-1 ring-border group-hover:bg-muted/50 group-hover:ring-muted transition-smooth">
                  <Settings className="h-6 w-6 text-foreground" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5">Settings</h3>
              <p className="text-sm text-muted-foreground">Restaurant profile and configuration</p>
            </div>
          </button>
        </div>
      </section>

      {/* Recent Orders Section */}
      <section aria-label="Recent Orders">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Recent Orders</h2>
            <p className="text-sm text-muted-foreground mt-1">Latest customer orders</p>
          </div>
          <button
            onClick={() => navigate('/manager/orders')}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-muted/30 rounded-full mb-6">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No orders yet today</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Orders will appear here as customers place them. Start by creating a manual order for walk-in customers.</p>
            <button
              onClick={() => navigate('/manager/orders')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-smooth font-semibold shadow-lg shadow-primary/20"
            >
              <Plus className="h-5 w-5" />
              Create Manual Order
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="group relative bg-card border border-border rounded-xl p-6 card-lift cursor-pointer overflow-hidden"
                onClick={() => navigate(`/manager/orders`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">Order #{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        Table {order.tables?.table_number || 'N/A'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth" />
                  </div>

                  <div className="flex items-center gap-3 mb-5">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold capitalize transition-smooth ${
                      order.order_status === 'preparing' ? 'badge-preparing' :
                      order.order_status === 'ready' ? 'badge-ready' :
                      order.order_status === 'received' ? 'badge-available' :
                      'badge-completed'
                    }`}>
                      {order.order_status || 'Pending'}
                    </span>
                    <span className="text-xl font-bold text-primary tabular-nums">
                      {formatCurrency(order.total || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/manager/orders`);
                        }}
                        className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-muted transition-smooth"
                      >
                        View
                      </button>
                      {order.order_status !== 'served' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle update
                          }}
                          className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth shadow-sm shadow-primary/20"
                        >
                          Update
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ManagerDashboard;
