import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Bell,
  ChevronDown,
  RefreshCw,
  Plus,
  Eye,
  Menu as MenuIcon,
  CreditCard,
  QrCode,
  BarChart3,
  ClipboardList,
  Brain,
} from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { getCurrentUser } from '@shared/utils/auth/auth';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const ManagerDashboardNew = () => {
  const navigate = useNavigate();
  const { restaurantId, restaurantName } = useRestaurant();
  const [loading, setLoading] = useState(true);
  const [notificationCount] = useState(3);
  const [restaurantData, setRestaurantData] = useState({
    name: restaurantName || 'Demo Restaurant',
    logo: null,
    manager: {
      name: 'Loading...',
      initials: 'LO',
    },
    metrics: {
      todayRevenue: 0,
      todayOrders: 0,
      activeOrders: 0,
      totalStaff: 0,
      revenueTrend: '+0%',
    },
    aiInsight: "Loading insights...",
    recentOrders: [],
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const loadUser = async () => {
    try {
      const { user, profile } = await getCurrentUser();
      if (user && profile) {
        const initials = profile.full_name 
          ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
          : 'MG';
        
        setRestaurantData(prev => ({
          ...prev,
          manager: {
            name: profile.full_name || 'Manager',
            initials: initials,
          },
        }));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
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

      // Fetch restaurant details
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('name, logo_url')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) throw restaurantError;

      // Fetch today's orders
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (ordersError) throw ordersError;

      // Calculate today's revenue
      const todayRevenue = todayOrders
        ?.filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      // Calculate yesterday's revenue for trend
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const { data: yesterdayOrders } = await supabase
        .from('orders')
        .select('total, payment_status')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      const yesterdayRevenue = yesterdayOrders
        ?.filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      const revenueTrend = yesterdayRevenue > 0 
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
        : todayRevenue > 0 ? '+100' : '0';

      // Active orders
      const { data: activeOrders, error: activeError } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .in('order_status', ['received', 'preparing', 'ready']);

      if (activeError) throw activeError;

      // Total staff
      const { data: staff, error: staffError } = await supabase
        .from('users')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Recent orders (last 5)
      // Note: payment_method is in order_payments table, not orders table (canonical schema)
      const { data: recent, error: recentError } = await supabase
        .from('orders')
        .select(`
          id, 
          table_number, 
          order_status, 
          total, 
          created_at,
          order_payments(payment_method)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Format recent orders
      const formattedOrders = recent?.map(order => ({
        id: order.id,
        table: `Table ${order.table_number}`,
        status: order.order_status || 'preparing',
        paymentMethod: order.order_payments?.[0]?.payment_method || 'cash',
        total: order.total || 0,
        time: new Date(order.created_at).toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      })) || [];

      // Generate AI insight
      const weeklyRevenue = todayRevenue * 7; // Simplified for demo
      const peakHours = "7-9 PM"; // Could be calculated from order data
      const aiInsight = weeklyRevenue > 0
        ? `Your restaurant made ₹${weeklyRevenue.toLocaleString()} this week${revenueTrend !== '0' ? `, which is ${Math.abs(parseFloat(revenueTrend))}% ${parseFloat(revenueTrend) > 0 ? 'higher' : 'lower'} than last week` : ''}. Peak hours are between ${peakHours}. ${activeOrders?.length > 5 ? 'Consider adding more staff during dinner rush.' : ''}`
        : "Start taking orders to see insights and trends for your restaurant.";

      setRestaurantData(prev => ({
        ...prev,
        name: restaurant?.name || prev.name,
        logo: restaurant?.logo_url || null,
        metrics: {
          todayRevenue: todayRevenue,
          todayOrders: todayOrders?.length || 0,
          activeOrders: activeOrders?.length || 0,
          totalStaff: staff?.length || 0,
          revenueTrend: revenueTrend !== '0' ? `${parseFloat(revenueTrend) > 0 ? '+' : ''}${revenueTrend}%` : '+0%',
        },
        aiInsight: aiInsight,
        recentOrders: formattedOrders,
      }));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    toast.promise(
      loadDashboardData(),
      {
        loading: 'Refreshing...',
        success: 'Dashboard updated!',
        error: 'Failed to refresh',
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1728] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-[#0F1728] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">No Restaurant Selected</h2>
          <p className="text-gray-400">Please select a restaurant to continue</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({ icon, title, value, subtitle, color, trend }) => {
    const Icon = icon;
    return (
      <div
        className={`bg-[#1A2332] rounded-lg p-6 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-${color}-500/20 cursor-pointer`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 rounded-lg bg-${color}-500/10`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
          {trend && (
            <span className="text-sm text-green-400 font-medium">{trend}</span>
          )}
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-sm text-gray-400">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    );
  };

  const ManageCard = ({ icon, title, description, onClick, color = 'blue' }) => {
    const Icon = icon;
    return (
      <button
        onClick={onClick}
        className="bg-[#1A2332] rounded-lg p-6 text-left transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 group"
      >
        <div className={`p-3 rounded-lg bg-${color}-500/10 w-fit mb-4 group-hover:bg-${color}-500/20 transition-colors`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </button>
    );
  };

  const QuickActionButton = ({ icon, label, onClick, variant = 'primary' }) => {
    const Icon = icon;
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-[#1A2332] hover:bg-[#242F42] text-gray-300',
    };

    return (
      <button
        onClick={onClick}
        className={`${variants[variant]} px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ease-in-out hover:scale-105 font-medium text-sm`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    );
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      preparing: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Preparing' },
      ready: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Ready' },
      served: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Served' },
      paid: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Paid' },
    };

    const config = statusConfig[status] || statusConfig.preparing;

    return (
      <span className={`${config.bg} ${config.text} px-2 py-1 rounded text-xs font-medium`}>
        {config.label}
      </span>
    );
  };

  const PaymentBadge = ({ method }) => {
    const methodConfig = {
      cash: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Cash' },
      card: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Card' },
      upi: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'UPI' },
    };

    const config = methodConfig[method] || methodConfig.cash;

    return (
      <span className={`${config.bg} ${config.text} px-2 py-1 rounded text-xs font-medium`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0F1728]">
      {/* Top Navigation Bar */}
      <nav className="bg-[#1A2332] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Restaurant Logo & Name */}
            <div className="flex items-center gap-3">
              {restaurantData.logo ? (
                <img
                  src={restaurantData.logo}
                  alt={restaurantData.name}
                  className="w-10 h-10 rounded-full border-2 border-blue-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-500">
                  <span className="text-white font-bold text-sm">
                    {restaurantData.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <h1 className="text-white font-semibold text-lg">{restaurantData.name}</h1>
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              </div>
            </div>

            {/* Right: Notifications & Profile */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#242F42]">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Profile Dropdown */}
              <button className="flex items-center gap-2 p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-[#242F42]">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {restaurantData.manager.initials}
                  </span>
                </div>
                <span className="text-sm font-medium">{restaurantData.manager.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
            <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#1A2332]"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          <QuickActionButton
            icon={Plus}
            label="New Order"
            onClick={() => navigate('/manager/orders/new')}
            variant="primary"
          />
          <QuickActionButton
            icon={Plus}
            label="Add Staff"
            onClick={() => navigate('/manager/staff/add')}
            variant="secondary"
          />
          <QuickActionButton
            icon={Plus}
            label="Add Menu Item"
            onClick={() => navigate('/manager/menu/add')}
            variant="secondary"
          />
          <QuickActionButton
            icon={Eye}
            label="View Analytics"
            onClick={() => navigate('/manager/analytics')}
            variant="secondary"
          />
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={TrendingUp}
            title="Today's Revenue"
            value={`₹${restaurantData.metrics.todayRevenue.toLocaleString()}`}
            color="green"
            trend={restaurantData.metrics.revenueTrend}
          />
          <MetricCard
            icon={ShoppingCart}
            title="Today's Orders"
            value={restaurantData.metrics.todayOrders}
            color="blue"
            subtitle={`${restaurantData.metrics.activeOrders} active`}
          />
          <MetricCard
            icon={Package}
            title="Active Orders"
            value={restaurantData.metrics.activeOrders}
            color="orange"
          />
          <MetricCard
            icon={Users}
            title="Total Staff"
            value={restaurantData.metrics.totalStaff}
            color="red"
          />
        </div>

        {/* AI Smart Insight */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Insight</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                {restaurantData.aiInsight}
              </p>
            </div>
          </div>
        </div>

        {/* Manage Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Manage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ManageCard
              icon={MenuIcon}
              title="Menu"
              description="Manage your menu items, categories, and pricing"
              onClick={() => navigate('/manager/menu')}
              color="blue"
            />
            {/* Offers disabled */}
            <ManageCard
              icon={CreditCard}
              title="Orders & Payments"
              description="View and manage orders and payment transactions"
              onClick={() => navigate('/manager/orders')}
              color="purple"
            />
            <ManageCard
              icon={Users}
              title="Staff"
              description="Manage staff members, roles, and permissions"
              onClick={() => navigate('/manager/staff')}
              color="red"
            />
            <ManageCard
              icon={QrCode}
              title="QR Codes"
              description="Generate and manage table QR codes"
              onClick={() => navigate('/manager/qr-codes')}
              color="yellow"
            />
            <ManageCard
              icon={BarChart3}
              title="Analytics"
              description="View detailed reports and insights"
              onClick={() => navigate('/manager/analytics')}
              color="blue"
            />
            <ManageCard
              icon={ClipboardList}
              title="Activity Logs"
              description="Track all restaurant activities and changes"
              onClick={() => navigate('/manager/activity-logs')}
              color="gray"
            />
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Recent Orders</h3>
            <button
              onClick={() => navigate('/manager/orders')}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              View All →
            </button>
          </div>

          <div className="bg-[#1A2332] rounded-lg overflow-hidden">
            {restaurantData.recentOrders.length > 0 ? (
              <table className="w-full">
                <thead className="bg-[#0F1728]">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                      Order #
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                      Table
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                      Payment
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                      Total
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {restaurantData.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#242F42] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {order.table}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentBadge method={order.paymentMethod} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        ₹{order.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {order.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No orders yet today</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboardNew;
