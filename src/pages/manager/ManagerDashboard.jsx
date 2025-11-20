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
  Clock,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency } from '@shared/utils/helpers/formatters';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import BillingWarningCard from '@domains/billing/components/BillingWarningCard';

const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
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
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

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
        lastWeekStaff: staff?.length || 0,
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

  const handleQuickUpdate = async (e, order) => {
    e.stopPropagation(); // Prevent row click navigation

    let nextStatus = '';
    switch (order.order_status) {
      case 'pending':
      case 'received':
        nextStatus = 'preparing';
        break;
      case 'preparing':
        nextStatus = 'ready';
        break;
      case 'ready':
        nextStatus = 'served';
        break;
      case 'served':
        nextStatus = 'completed';
        break;
      default:
        return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: nextStatus })
        .eq('id', order.id);

      if (error) throw error;

      toast.success(`Order #${order.order_number} updated to ${nextStatus}`);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
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

  // Component for quick action buttons
  // eslint-disable-next-line no-unused-vars
  const QuickAction = ({ icon: IconComponent, label, onClick, badge, color = "text-primary" }) => {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 min-w-[72px] p-2 rounded-2xl hover:bg-white/5 transition-all active:scale-95 group border border-transparent hover:border-white/5"
      >
        <div className={`p-3 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/20 transition-all relative shadow-lg ${color.replace('text-', 'shadow-')}/20`}>
          <IconComponent className={`h-5 w-5 md:h-6 md:w-6 ${color} drop-shadow-md`} />
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 md:h-5 md:w-5 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-black shadow-lg shadow-rose-500/50">
              {badge}
            </span>
          )}
        </div>
        <span className="text-[10px] md:text-xs font-medium text-zinc-400 group-hover:text-white transition-colors text-center whitespace-nowrap">
          {label}
        </span>
      </button>
    );
  };

  // Component for stat cards
  // eslint-disable-next-line no-unused-vars
  const StatCard = ({ title, value, subtext, icon: IconComponent, trend, color = "text-white" }) => (
    <div className="glass-panel p-4 md:p-6 rounded-2xl group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border border-white/10">
      <div className={`absolute -right-6 -top-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500`}>
        <IconComponent className={`h-24 w-24 md:h-32 md:w-32 ${color}`} />
      </div>

      <div className="flex items-center justify-between mb-3 md:mb-4 relative z-10">
        <p className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest">{title}</p>
        <div className={`p-1.5 md:p-2 rounded-lg bg-white/5 border border-white/5 ${color}`}>
          <IconComponent className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between relative z-10 gap-2 md:gap-0">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-white font-mono-nums tracking-tight drop-shadow-lg">{value}</h3>
          {subtext && <p className="text-[10px] md:text-xs text-zinc-400 mt-1 font-medium">{subtext}</p>}
        </div>
        {trend && (
          <div className={`self-start md:self-auto flex items-center gap-1 text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg backdrop-blur-md border border-white/5 ${trend.isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
            {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="font-mono-nums">{trend.trend}%</span>
          </div>
        )}
      </div>
    </div>
  );

  // Component for navigation cards
  // eslint-disable-next-line no-unused-vars
  const NavCard = ({ title, description, icon: IconComponent, onClick, color = "text-primary" }) => (
    <button
      onClick={onClick}
      className="glass-panel p-4 md:p-5 text-left group hover:border-primary/30 transition-all flex flex-col h-full rounded-2xl hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] border border-white/10"
    >
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className={`p-2.5 md:p-3 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors ${color}`}>
          <IconComponent className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="text-sm md:text-base font-bold text-white mb-1 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-[10px] md:text-xs text-zinc-400 line-clamp-2 font-medium">{description}</p>
    </button>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-8 md:pb-0 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pb-2">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight text-glow">
            Dashboard
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 md:mt-2 font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 md:gap-4 self-end md:self-auto">
          <button
            onClick={loadDashboardData}
            className="glass-button p-2 md:p-3 rounded-xl hover:rotate-180 transition-all duration-500"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          <button
            onClick={() => navigate('/manager/orders')}
            className="hidden md:flex items-center gap-2 px-6 py-3 glass-button-primary rounded-xl transition-all font-bold text-sm tracking-wide uppercase"
          >
            <Plus className="h-4 w-4" />
            New Order
          </button>
        </div>
      </div>

      {/* Mobile Quick Actions - Horizontal Scroll */}
      <div className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-2 min-w-max">
          <QuickAction icon={Plus} label="New Order" onClick={() => navigate('/manager/orders')} color="text-primary" />
          <QuickAction icon={LayoutGrid} label="Tables" onClick={() => navigate('/manager/tables')} color="text-accent" />
          <QuickAction icon={FileText} label="Reports" onClick={() => navigate('/manager/reports')} color="text-emerald-400" />
          <QuickAction icon={CreditCard} label="Billing" onClick={() => navigate('/manager/billing')} color="text-rose-400" />
          <QuickAction icon={Bell} label="Alerts" onClick={() => { }} badge={stats.activeOrders} color="text-amber-400" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          title="REVENUE"
          value={formatCurrency(stats.todayRevenue)}
          subtext="vs yesterday"
          icon={DollarSign}
          trend={revenueTrend}
          color="text-emerald-400"
        />
        <StatCard
          title="ORDERS"
          value={stats.todayOrders}
          subtext="vs yesterday"
          icon={ShoppingCart}
          trend={ordersTrend}
          color="text-primary"
        />
        <StatCard
          title="ACTIVE"
          value={stats.activeOrders}
          subtext="in progress"
          icon={Clock}
          trend={activeTrend}
          color="text-amber-400"
        />
        <StatCard
          title="STAFF"
          value={stats.totalStaff}
          subtext="active now"
          icon={Users}
          color="text-accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content Column (2/3) */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Operations Grid */}
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <UtensilsCrossed className="h-3.5 w-3.5 md:h-4 md:w-4" /> Operations
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              <NavCard
                title="Menu"
                description="Items & categories"
                icon={UtensilsCrossed}
                onClick={() => navigate('/manager/menu')}
                color="text-rose-400"
              />
              <NavCard
                title="Tables"
                description="Status & QR codes"
                icon={LayoutGrid}
                onClick={() => navigate('/manager/tables')}
                color="text-accent"
              />
              <NavCard
                title="Orders"
                description="Active & history"
                icon={ShoppingCart}
                onClick={() => navigate('/manager/orders')}
                color="text-primary"
              />
              <NavCard
                title="Payments"
                description="Transactions"
                icon={CreditCard}
                onClick={() => navigate('/manager/payments')}
                color="text-emerald-400"
              />
              <NavCard
                title="QR Codes"
                description="Generate codes"
                icon={QrCode}
                onClick={() => navigate('/manager/qr-codes')}
                color="text-amber-400"
              />
              <NavCard
                title="Staff"
                description="Team members"
                icon={Users}
                onClick={() => navigate('/manager/staff')}
                color="text-primary"
              />
            </div>
          </section>

          {/* Recent Orders List */}
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" /> Recent Orders
              </h2>
              <button
                onClick={() => navigate('/manager/orders')}
                className="text-[10px] md:text-xs text-primary hover:text-primary/80 font-bold uppercase tracking-wider transition-colors"
              >
                View All
              </button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
              {recentOrders.length === 0 ? (
                <div className="p-8 md:p-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl mb-4 border border-white/5 shadow-inner">
                    <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-zinc-600" />
                  </div>
                  <p className="text-xs md:text-sm text-zinc-400 font-medium">No orders yet today</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate('/manager/orders')}
                      className="p-4 md:p-5 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 md:gap-5">
                        <div className={`p-2 md:p-3 rounded-xl border shadow-lg ${order.order_status === 'preparing' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/10' :
                          order.order_status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-500/10' :
                            order.order_status === 'served' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-blue-500/10' :
                              order.order_status === 'completed' ? 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500 shadow-zinc-500/10' :
                                'bg-white/5 border-white/10 text-zinc-400'
                          }`}>
                          <ShoppingBagIcon status={order.order_status} />
                        </div>
                        <div>
                          <h4 className="text-sm md:text-base font-bold text-white font-mono-nums tracking-tight">#{order.order_number}</h4>
                          <p className="text-[10px] md:text-xs text-zinc-400 mt-0.5 md:mt-1 font-medium">
                            Table {order.tables?.table_number || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 md:gap-6">
                        <span className="text-sm md:text-base font-bold text-white font-mono-nums tracking-tight">
                          {formatCurrency(order.total)}
                        </span>

                        {/* Quick Update Button */}
                        {['pending', 'received', 'preparing', 'ready', 'served'].includes(order.order_status) && (
                          <button
                            onClick={(e) => handleQuickUpdate(e, order)}
                            className="glass-button px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-all md:opacity-0 md:group-hover:opacity-100"
                          >
                            {order.order_status === 'ready' ? 'Serve' :
                              order.order_status === 'served' ? 'Complete' :
                                'Update'}
                          </button>
                        )}

                        <div className="p-1.5 md:p-2 rounded-full bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                          <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Column (1/3) */}
        <div className="space-y-6 md:space-y-8">
          {/* Billing Status Card */}
          <BillingWarningCard restaurantId={restaurantId} />

          {/* Admin Section */}
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Settings className="h-3.5 w-3.5 md:h-4 md:w-4" /> Admin
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
              <NavCard
                title="Analytics"
                description="Performance insights"
                icon={BarChart3}
                onClick={() => navigate('/manager/analytics')}
                color="text-primary"
              />
              <NavCard
                title="Reports"
                description="Download summaries"
                icon={FileText}
                onClick={() => navigate('/manager/reports')}
                color="text-emerald-400"
              />
              <NavCard
                title="Settings"
                description="Configuration"
                icon={Settings}
                onClick={() => navigate('/manager/settings')}
                color="text-zinc-400"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const ShoppingBagIcon = ({ status }) => {
  if (status === 'preparing') return <Clock className="h-5 w-5" />;
  if (status === 'ready') return <Bell className="h-5 w-5" />;
  if (status === 'served') return <CheckCircle className="h-5 w-5" />;
  if (status === 'completed') return <CheckCircle className="h-5 w-5" />;
  return <ShoppingCart className="h-5 w-5" />;
};

export default ManagerDashboard;
