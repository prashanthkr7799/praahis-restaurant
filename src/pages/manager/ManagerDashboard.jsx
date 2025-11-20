/**
 * Manager Dashboard - Deep Space Glass Redesign
 * Premium dark-mode dashboard with glassmorphism, neon accents, and mobile-first responsiveness
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
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency } from '@shared/utils/helpers/formatters';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import StatCard from './components/StatCard';
import NavCard from './components/NavCard';
import BillingWarningCard from '@domains/billing/components/BillingWarningCard';

const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (ordersError) throw ordersError;

      const { data: yesterdayOrders, error: yesterdayOrdersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      if (yesterdayOrdersError) throw yesterdayOrdersError;

      const todayRevenue = todayOrders
        ?.filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      const yesterdayRevenue = yesterdayOrders
        ?.filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total || 0), 0) || 0;

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

      const { data: staff, error: staffError } = await supabase
        .from('users')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      if (staffError) throw staffError;

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleQuickUpdate = async (order) => {
    try {
      const statusFlow = {
        'received': 'preparing',
        'preparing': 'ready',
        'ready': 'served',
        'served': 'completed'
      };

      const newStatus = statusFlow[order.order_status];
      if (!newStatus) {
        toast.error('Order cannot be updated further');
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      toast.success(`Order updated to ${newStatus}`);
      loadDashboardData();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const getQuickUpdateLabel = (status) => {
    const labels = {
      'received': 'Start Prep',
      'preparing': 'Mark Ready',
      'ready': 'Serve',
      'served': 'Complete'
    };
    return labels[status] || 'Update';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'received':
        return <Clock className="text-amber-400" size={20} />;
      case 'preparing':
        return <RefreshCw className="text-sky-400" size={20} />;
      case 'ready':
        return <Bell className="text-emerald-400" size={20} />;
      case 'served':
        return <CheckCircle className="text-emerald-400" size={20} />;
      default:
        return <AlertCircle className="text-zinc-400" size={20} />;
    }
  };

  const calculateTrend = (current, previous) => {
    if (previous === 0) return { trend: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      trend: Math.abs(change).toFixed(1) + '%',
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
    <div className="min-h-screen p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white text-glow tracking-tight">Dashboard</h1>
            <div className="flex items-center gap-2 mt-2 text-zinc-400 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="glass-button"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button 
              onClick={() => navigate('/manager/orders')}
              className="glass-button-primary"
            >
              <Plus size={18} />
              <span>New Order</span>
            </button>
          </div>
        </div>

        {/* Mobile Quick Actions (Mobile Only) */}
        <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-3 min-w-max">
            <button
              onClick={() => navigate('/manager/orders')}
              className="glass-panel px-4 py-3 flex flex-col items-center gap-2 min-w-[80px] hover:bg-white/10 transition-all"
            >
              <Plus size={20} className="text-primary" />
              <span className="text-xs text-zinc-300">New Order</span>
            </button>
            <button
              onClick={() => navigate('/manager/tables')}
              className="glass-panel px-4 py-3 flex flex-col items-center gap-2 min-w-[80px] hover:bg-white/10 transition-all"
            >
              <LayoutGrid size={20} className="text-sky-400" />
              <span className="text-xs text-zinc-300">Tables</span>
            </button>
            <button
              onClick={() => navigate('/manager/reports')}
              className="glass-panel px-4 py-3 flex flex-col items-center gap-2 min-w-[80px] hover:bg-white/10 transition-all"
            >
              <BarChart3 size={20} className="text-emerald-400" />
              <span className="text-xs text-zinc-300">Reports</span>
            </button>
            <button
              onClick={() => navigate('/manager/billing')}
              className="glass-panel px-4 py-3 flex flex-col items-center gap-2 min-w-[80px] hover:bg-white/10 transition-all"
            >
              <CreditCard size={20} className="text-amber-400" />
              <span className="text-xs text-zinc-300">Billing</span>
            </button>
            <button
              onClick={handleRefresh}
              className="glass-panel px-4 py-3 flex flex-col items-center gap-2 min-w-[80px] hover:bg-white/10 transition-all"
            >
              <RefreshCw size={20} className={`text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs text-zinc-300">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: 3-column on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2 columns on desktop) */}
        <div className="lg:col-span-2 space-y-8">
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={DollarSign}
              label="Today's Revenue"
              value={formatCurrency(stats.todayRevenue)}
              change={revenueTrend.trend}
              changeType={revenueTrend.isPositive ? 'up' : 'down'}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/10"
            />
            <StatCard
              icon={ShoppingCart}
              label="Orders"
              value={stats.todayOrders}
              change={ordersTrend.trend}
              changeType={ordersTrend.isPositive ? 'up' : 'down'}
              iconColor="text-sky-400"
              iconBg="bg-sky-500/10"
            />
            <StatCard
              icon={Clock}
              label="Active"
              value={stats.activeOrders}
              change={activeTrend.trend}
              changeType={activeTrend.isPositive ? 'up' : 'down'}
              iconColor="text-amber-400"
              iconBg="bg-amber-500/10"
            />
            <StatCard
              icon={Users}
              label="Staff"
              value={stats.totalStaff}
              iconColor="text-primary"
              iconBg="bg-primary/10"
            />
          </div>

          {/* Operations Grid */}
          <div>
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Operations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <NavCard
                icon={UtensilsCrossed}
                title="Menu"
                description="Items & categories"
                onClick={() => navigate('/manager/menu')}
                iconColor="text-rose-400"
                iconBg="bg-rose-500/10"
              />
              <NavCard
                icon={LayoutGrid}
                title="Tables"
                description="Status & QR codes"
                onClick={() => navigate('/manager/tables')}
                iconColor="text-sky-400"
                iconBg="bg-sky-500/10"
              />
              <NavCard
                icon={ShoppingCart}
                title="Orders"
                description="Active & history"
                onClick={() => navigate('/manager/orders')}
                iconColor="text-emerald-400"
                iconBg="bg-emerald-500/10"
              />
              <NavCard
                icon={CreditCard}
                title="Payments"
                description="Transactions"
                onClick={() => navigate('/manager/payments')}
                iconColor="text-amber-400"
                iconBg="bg-amber-500/10"
              />
              <NavCard
                icon={QrCode}
                title="QR Codes"
                description="Generate codes"
                onClick={() => navigate('/manager/qr-codes')}
                iconColor="text-primary"
                iconBg="bg-primary/10"
              />
              <NavCard
                icon={Users}
                title="Staff"
                description="Team members"
                onClick={() => navigate('/manager/staff')}
                iconColor="text-cyan-400"
                iconBg="bg-cyan-500/10"
              />
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recent Orders</h2>
              <button
                onClick={() => navigate('/manager/orders')}
                className="text-sm text-primary hover:text-primary-light flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="glass-panel p-6 space-y-3">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-20" />
                  <p>No recent orders</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-xl ${
                        order.order_status === 'received' ? 'bg-amber-500/10' :
                        order.order_status === 'preparing' ? 'bg-sky-500/10' :
                        order.order_status === 'ready' ? 'bg-emerald-500/10' :
                        'bg-white/5'
                      }`}>
                        {getStatusIcon(order.order_status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono-nums font-bold text-white">
                          #{order.order_number || order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-zinc-400">
                          Table {order.tables?.table_number || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-nums font-bold text-white text-lg">
                        {formatCurrency(order.total)}
                      </span>
                      {order.order_status !== 'completed' && order.order_status !== 'cancelled' && (
                        <button
                          onClick={() => handleQuickUpdate(order)}
                          className="glass-button-primary text-sm py-1.5 px-3 opacity-0 md:group-hover:opacity-100 md:opacity-100 transition-opacity"
                        >
                          {getQuickUpdateLabel(order.order_status)}
                        </button>
                      )}
                      <ChevronRight className="text-zinc-600 group-hover:text-zinc-400 transition-colors" size={20} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar (1 column on desktop) */}
        <div className="space-y-6">
          {/* Billing Card */}
          <BillingWarningCard />

          {/* Admin Links */}
          <div>
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Admin</h2>
            <div className="space-y-3">
              <NavCard
                icon={BarChart3}
                title="Analytics"
                description="Performance insights"
                onClick={() => navigate('/manager/analytics')}
                iconColor="text-primary"
                iconBg="bg-primary/10"
              />
              <NavCard
                icon={FileText}
                title="Reports"
                description="Business reports"
                onClick={() => navigate('/manager/reports')}
                iconColor="text-emerald-400"
                iconBg="bg-emerald-500/10"
              />
              <NavCard
                icon={Settings}
                title="Settings"
                description="Configuration"
                onClick={() => navigate('/manager/settings')}
                iconColor="text-zinc-400"
                iconBg="bg-zinc-500/10"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
