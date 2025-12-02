import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  UserCheck,
  TrendingUp,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Clock,
  ChevronRight,
  BarChart3,
  PieChart,
  DollarSign,
  Bell,
  Calendar,
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { supabaseOwner } from '@shared/services/api/ownerApi';
import { useDashboardRealtime } from '@features/admin/hooks/useAdminRealtime';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// Glass Card Component
const GlassCard = ({ children, className = '', onClick, hover = true }) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden
      bg-slate-800/50 backdrop-blur-xl
      border border-white/10 rounded-2xl
      ${hover ? 'hover:border-white/20 hover:bg-slate-800/60 transition-all duration-300' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

// Animated Metric Card
const AnimatedMetricCard = ({ title, value, icon: IconComponent, trend, trendLabel, loading, onClick, color = 'emerald', subtitle }) => {
  const colorClasses = {
    emerald: 'from-emerald-500 to-cyan-500 shadow-emerald-500/20',
    blue: 'from-blue-500 to-indigo-500 shadow-blue-500/20',
    purple: 'from-purple-500 to-pink-500 shadow-purple-500/20',
    amber: 'from-amber-500 to-orange-500 shadow-amber-500/20',
    rose: 'from-rose-500 to-pink-500 shadow-rose-500/20',
  };

  return (
    <GlassCard onClick={onClick} className="p-5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 bg-white/10 rounded animate-pulse w-24" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-32" />
        </div>
      ) : (
        <>
          <div className="text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </div>
          <div className="text-sm text-gray-400">{title}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
          {trendLabel && <div className="text-xs text-gray-500">{trendLabel}</div>}
        </>
      )}
      
      {onClick && (
        <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      )}
    </GlassCard>
  );
};

// Live Activity Feed
const ActivityFeed = ({ activities, loading }) => (
  <div className="space-y-3">
    {loading ? (
      Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      ))
    ) : activities.length === 0 ? (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No recent activity</p>
      </div>
    ) : (
      activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className={`p-2 rounded-lg ${
            activity.type === 'payment' ? 'bg-emerald-500/20 text-emerald-400' :
            activity.type === 'restaurant' ? 'bg-blue-500/20 text-blue-400' :
            activity.type === 'subscription' ? 'bg-purple-500/20 text-purple-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {activity.type === 'payment' ? <DollarSign className="w-4 h-4" /> :
             activity.type === 'restaurant' ? <Building2 className="w-4 h-4" /> :
             activity.type === 'subscription' ? <CreditCard className="w-4 h-4" /> :
             <Activity className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{activity.message}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {activity.timestamp}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))
    )}
  </div>
);

// Alert Card Component
const AlertCard = ({ alerts }) => (
  <div className="space-y-3">
    {alerts.length === 0 ? (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="text-white font-medium">All Systems Operational</p>
        <p className="text-gray-500 text-sm mt-1">No issues detected</p>
      </div>
    ) : (
      alerts.map((alert, i) => (
        <div
          key={i}
          onClick={alert.action}
          className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
            alert.variant === 'warning' ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20' :
            alert.variant === 'danger' ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20' :
            'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              alert.variant === 'warning' ? 'bg-amber-500/20' :
              alert.variant === 'danger' ? 'bg-rose-500/20' :
              'bg-emerald-500/20'
            }`}>
              <Bell className={`w-4 h-4 ${
                alert.variant === 'warning' ? 'text-amber-400' :
                alert.variant === 'danger' ? 'text-rose-400' :
                'text-emerald-400'
              }`} />
            </div>
            <p className={`text-sm flex-1 ${
              alert.variant === 'warning' ? 'text-amber-200' :
              alert.variant === 'danger' ? 'text-rose-200' :
              'text-emerald-200'
            }`}>{alert.message}</p>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      ))
    )}
  </div>
);

const SuperAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalStaff: 0,
    activeSubscriptions: 0,
    totalManagers: 0,
    restaurantsTrend: 0,
    usersTrend: 0,
  });

  const [alerts, setAlerts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [revenueData, setRevenueData] = useState({
    currentMRR: 0,
    growth: 0,
    projectedNext: 0,
    chartData: [],
  });

  // Ref for realtime callback to avoid stale closure
  const fetchDashboardDataRef = React.useRef(null);

  // Realtime subscription for live updates
  const { isConnected } = useDashboardRealtime({
    onUpdate: useCallback(() => {
      // Trigger refresh on relevant events - using ref to avoid stale closure
      fetchDashboardDataRef.current?.(true);
    }, []),
    enabled: true,
  });

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);

      // Fetch restaurant statistics
      const { data: restaurants, error: restaurantsError } = await supabaseOwner
        .from('restaurants')
        .select('*, subscriptions(status, end_date, current_period_end, trial_ends_at)');

      if (restaurantsError) throw restaurantsError;

      // Calculate statistics
      const totalRestaurants = restaurants?.length || 0;
      const activeRestaurants =
        restaurants?.filter((r) => r.subscriptions?.[0]?.status === 'active')
          .length || 0;

      // Fetch user statistics
      // Get managers count
      const { count: totalManagers } = await supabaseOwner
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'manager');

      // Get staff count (waiters, chefs, etc. - excluding managers and owners)
      const { count: totalStaff } = await supabaseOwner
        .from('users')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'manager')
        .neq('is_owner', true);

      // Fetch active subscriptions
      const { count: activeSubscriptions } = await supabaseOwner
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Calculate alerts
      // Helper to get the relevant end date based on subscription status
      const getSubscriptionEndDate = (sub) => {
        if (!sub) return null;
        // For trial subscriptions, use trial_ends_at
        if (sub.status === 'trial' && sub.trial_ends_at) {
          return sub.trial_ends_at;
        }
        // Otherwise use end_date or current_period_end
        return sub.end_date || sub.current_period_end;
      };

      const gracePeriodAlerts = restaurants?.filter((r) => {
        const sub = r.subscriptions?.[0];
        const endDate = getSubscriptionEndDate(sub);
        if (!endDate) return false; // No end date = not in grace period
        const expiresAt = new Date(endDate);
        if (isNaN(expiresAt.getTime())) return false; // Invalid date
        const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 && daysLeft <= 5;
      }).length || 0;

      const overdueAlerts = restaurants?.filter((r) => {
        const sub = r.subscriptions?.[0];
        const endDate = getSubscriptionEndDate(sub);
        if (!endDate) return false; // No end date = not overdue
        const expiresAt = new Date(endDate);
        if (isNaN(expiresAt.getTime())) return false; // Invalid date
        const daysOverdue = Math.ceil((new Date() - expiresAt) / (1000 * 60 * 60 * 24));
        return daysOverdue >= 5;
      }).length || 0;

      // Get today's payments
      const today = new Date().toISOString().split('T')[0];
      const { count: todayPayments } = await supabaseOwner
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      setStats({
        totalRestaurants,
        activeRestaurants,
        totalStaff: totalStaff || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalManagers: totalManagers || 0,
        restaurantsTrend: 0, // TODO: Calculate from historical data when available
        usersTrend: 0, // TODO: Calculate from historical data when available
      });

      setAlerts([
        ...(gracePeriodAlerts > 0
          ? [
              {
                variant: 'warning',
                message: `${gracePeriodAlerts} restaurants approaching grace period end`,
                action: () => navigate('/superadmin/restaurants?filter=grace'),
              },
            ]
          : []),
        ...(overdueAlerts > 0
          ? [
              {
                variant: 'danger',
                message: `${overdueAlerts} subscriptions overdue by 5+ days`,
                action: () => navigate('/superadmin/restaurants?filter=overdue'),
              },
            ]
          : []),
        ...(todayPayments > 0
          ? [
              {
                variant: 'success',
                message: `${todayPayments} payments received today`,
                action: () => navigate('/superadmin/payments'),
              },
            ]
          : []),
      ]);

      // Fetch recent activity (from audit_trail - canonical table)
      const { data: logs, error: logsError } = await supabaseOwner
        .from('audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      // Only set activity if audit_trail table exists
      if (!logsError) {
        setRecentActivity(
          logs?.map((log) => ({
            id: log.id,
            message: formatActivityMessage(log),
            timestamp: formatTimestamp(log.created_at),
          })) || []
        );
      } else {
        // Table doesn't exist yet - show empty activity
        setRecentActivity([]);
      }

      // Fetch real revenue data from payments table
      try {
        // Get last 6 months of payment data
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data: allPayments } = await supabaseOwner
          .from('payments')
          .select('amount, created_at')
          .gte('created_at', sixMonthsAgo.toISOString())
          .eq('status', 'completed')
          .order('created_at', { ascending: true });

        // Group payments by month
        const monthlyRevenue = {};
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = d.toLocaleString('en-US', { month: 'short' });
          months.push(key);
          monthlyRevenue[key] = 0;
        }

        allPayments?.forEach(payment => {
          const month = new Date(payment.created_at).toLocaleString('en-US', { month: 'short' });
          if (monthlyRevenue[month] !== undefined) {
            monthlyRevenue[month] += payment.amount || 0;
          }
        });

        const chartData = months.map(month => ({
          month,
          value: monthlyRevenue[month]
        }));

        // Calculate current month revenue
        const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
        const currentMRR = monthlyRevenue[currentMonth] || 0;
        
        // Calculate previous month for growth comparison
        const prevMonthDate = new Date();
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const prevMonth = prevMonthDate.toLocaleString('en-US', { month: 'short' });
        const prevMRR = monthlyRevenue[prevMonth] || 0;
        
        const growth = prevMRR > 0 ? Math.round(((currentMRR - prevMRR) / prevMRR) * 100) : 0;
        const projectedNext = currentMRR > 0 ? Math.round(currentMRR * (1 + growth / 100)) : 0;

        setRevenueData({
          currentMRR,
          growth,
          projectedNext,
          chartData,
        });
      } catch (revenueError) {
        console.error('Error fetching revenue data:', revenueError);
        // Set empty revenue data on error
        setRevenueData({
          currentMRR: 0,
          growth: 0,
          projectedNext: 0,
          chartData: [],
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  // Keep ref updated for realtime callback
  React.useEffect(() => {
    fetchDashboardDataRef.current = fetchDashboardData;
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchDashboardData();
  };

  const formatActivityMessage = (log) => {
    const actions = {
      create_restaurant: 'New restaurant added',
      payment_received: 'Payment received',
      subscription_renewed: 'Subscription renewed',
      restaurant_suspended: 'Restaurant suspended',
    };
    return `${actions[log.action] || log.action}: ${log.details || ''}`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  // Chart configuration - Futuristic Style
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 16,
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context) => `  ₹${(context.parsed.y / 100000).toFixed(2)} Lakhs`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          callback: (value) => `₹${(value / 100000).toFixed(0)}L`,
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const chartData = {
    labels: revenueData.chartData.map((d) => d.month),
    datasets: [
      {
        label: 'MRR',
        data: revenueData.chartData.map((d) => d.value),
        borderColor: '#10B981',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
          gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.1)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#10B981',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        borderWidth: 3,
      },
    ],
  };

  // Subscription distribution chart - using real data
  const trialCount = 0; // TODO: Calculate from subscriptions with status='trial'
  const graceCount = 0; // TODO: Calculate from subscriptions in grace period
  const expiredCount = Math.max(0, stats.totalRestaurants - stats.activeRestaurants);
  
  const subscriptionChartData = {
    labels: ['Active', 'Trial', 'Grace', 'Expired'],
    datasets: [{
      data: [stats.activeRestaurants, trialCount, graceCount, expiredCount],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgba(16, 185, 129, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(251, 191, 36, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 2,
      spacing: 4,
      borderRadius: 4,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500">Offline</span>
                </>
              )}
            </div>
          </div>
          <p className="text-gray-400">
            Welcome back! Here's what's happening with your restaurants.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button
            onClick={() => navigate('/superadmin/restaurants')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl text-white font-medium shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Add Restaurant</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <AnimatedMetricCard
          title="Total Restaurants"
          value={stats.totalRestaurants}
          icon={Building2}
          trend={stats.restaurantsTrend}
          trendLabel="vs last month"
          loading={loading}
          onClick={() => navigate('/superadmin/restaurants')}
          color="blue"
        />
        <AnimatedMetricCard
          title="Active Subscriptions"
          value={stats.activeRestaurants}
          icon={CheckCircle}
          subtitle={`${Math.round((stats.activeRestaurants / Math.max(stats.totalRestaurants, 1)) * 100)}% of total`}
          loading={loading}
          onClick={() => navigate('/superadmin/restaurants?filter=active')}
          color="emerald"
        />
        <AnimatedMetricCard
          title="Staff Users"
          value={stats.totalStaff}
          icon={Users}
          subtitle="Waiters, Chefs, etc."
          loading={loading}
          color="purple"
        />
        <AnimatedMetricCard
          title="Managers"
          value={stats.totalManagers}
          icon={UserCheck}
          loading={loading}
          onClick={() => navigate('/superadmin/managers')}
          color="amber"
        />
        <AnimatedMetricCard
          title="Today's Revenue"
          value={`₹${(revenueData.currentMRR / 30 / 100000).toFixed(1)}L`}
          icon={CreditCard}
          loading={loading}
          onClick={() => navigate('/superadmin/billing')}
          color="rose"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart - Takes 2 columns */}
        <GlassCard className="xl:col-span-2 p-6" hover={false}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Revenue Overview
              </h3>
              <p className="text-sm text-gray-500 mt-1">Monthly Recurring Revenue trends</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  ₹{(revenueData.currentMRR / 100000).toFixed(2)}L
                </p>
                <p className="text-xs text-gray-500">Current MRR</p>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+{revenueData.growth}%</span>
              </div>
            </div>
          </div>
          
          {/* Revenue Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-sm text-gray-400 mb-1">Projected Next</p>
              <p className="text-xl font-bold text-white">₹{(revenueData.projectedNext / 100000).toFixed(2)}L</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-sm text-gray-400 mb-1">Avg Per Restaurant</p>
              <p className="text-xl font-bold text-white">
                ₹{stats.totalRestaurants > 0 ? ((revenueData.currentMRR / stats.totalRestaurants) / 1000).toFixed(1) : 0}K
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-sm text-gray-400 mb-1">Annual Run Rate</p>
              <p className="text-xl font-bold text-white">₹{(revenueData.currentMRR * 12 / 10000000).toFixed(2)}Cr</p>
            </div>
          </div>
          
          <div className="h-72">
            <Line options={chartOptions} data={chartData} />
          </div>
        </GlassCard>

        {/* Subscription Distribution */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Subscription Status
              </h3>
              <p className="text-sm text-gray-500 mt-1">Restaurant distribution</p>
            </div>
          </div>
          
          <div className="h-48 mb-6">
            <Doughnut data={subscriptionChartData} options={doughnutOptions} />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Active', value: stats.activeRestaurants, color: 'bg-emerald-500' },
              { label: 'Trial', value: trialCount, color: 'bg-blue-500' },
              { label: 'Grace', value: graceCount, color: 'bg-amber-500' },
              { label: 'Expired', value: expiredCount, color: 'bg-rose-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm text-gray-400">{item.label}</span>
                <span className="text-sm font-medium text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts & Actions */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Alerts & Actions
            </h3>
            {alerts.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                {alerts.length} active
              </span>
            )}
          </div>
          <AlertCard alerts={alerts} />
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Recent Activity
            </h3>
            <button className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <ActivityFeed activities={recentActivity} loading={loading} />
        </GlassCard>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
