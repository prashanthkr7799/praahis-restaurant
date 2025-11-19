import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
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
} from 'chart.js';
import { supabaseOwner } from '@/shared/utils/api/supabaseOwnerClient';
import MetricCard from '@/shared/components/superadmin/MetricCard';
import Card from '@/shared/components/superadmin/Card';
import Alert from '@/shared/components/superadmin/Alert';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SuperAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalUsers: 0,
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

      // Fetch restaurant statistics
      const { data: restaurants, error: restaurantsError } = await supabaseOwner
        .from('restaurants')
        .select('*, subscriptions(status, end_date)');

      if (restaurantsError) throw restaurantsError;

      // Calculate statistics
      const totalRestaurants = restaurants?.length || 0;
      const activeRestaurants =
        restaurants?.filter((r) => r.subscriptions?.[0]?.status === 'active')
          .length || 0;

      // Fetch user statistics
      const { count: totalUsers } = await supabaseOwner
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: totalManagers } = await supabaseOwner
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'manager');

      // Fetch active subscriptions
      const { count: activeSubscriptions } = await supabaseOwner
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Calculate alerts
      const gracePeriodAlerts = restaurants?.filter((r) => {
        const expiresAt = new Date(r.subscriptions?.[0]?.end_date);
        const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 && daysLeft <= 5;
      }).length || 0;

      const overdueAlerts = restaurants?.filter((r) => {
        const expiresAt = new Date(r.subscriptions?.[0]?.end_date);
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
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalManagers: totalManagers || 0,
        restaurantsTrend: 12, // Mock data - calculate from historical data
        usersTrend: 18, // Mock data
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

      // Mock revenue data - replace with actual data
      setRevenueData({
        currentMRR: 5850000,
        growth: 18,
        projectedNext: 6903000,
        chartData: [
          { month: 'Jun', value: 4950000 },
          { month: 'Jul', value: 5100000 },
          { month: 'Aug', value: 5300000 },
          { month: 'Sep', value: 5500000 },
          { month: 'Oct', value: 5700000 },
          { month: 'Nov', value: 5850000 },
        ],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

    fetchDashboardData();
  }, [navigate]);

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

  // Chart configuration
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: (context) => `₹${(context.parsed.y / 100000).toFixed(2)}L`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
          callback: (value) => `₹${(value / 100000).toFixed(0)}L`,
        },
      },
    },
  };

  const chartData = {
    labels: revenueData.chartData.map((d) => d.month),
    datasets: [
      {
        label: 'MRR',
        data: revenueData.chartData.map((d) => d.value),
        borderColor: '#3B82F6',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Welcome to Praahis SuperAdmin Dashboard
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Restaurants"
          value={stats.totalRestaurants}
          icon={Building2}
          trend={stats.restaurantsTrend}
          trendLabel="this month"
          loading={loading}
          onClick={() => navigate('/superadmin/restaurants')}
        />
        <MetricCard
          title="Active Restaurants"
          value={stats.activeRestaurants}
          icon={CheckCircle}
          loading={loading}
          onClick={() => navigate('/superadmin/restaurants?filter=active')}
        />
        <MetricCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend={stats.usersTrend}
          trendLabel="this month"
          loading={loading}
        />
        <MetricCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={CreditCard}
          loading={loading}
          onClick={() => navigate('/superadmin/billing')}
        />
        <MetricCard
          title="Total Managers"
          value={stats.totalManagers}
          icon={UserCheck}
          loading={loading}
          onClick={() => navigate('/superadmin/managers')}
        />
      </div>

      {/* Revenue Overview */}
      <Card>
        <Card.Header>
          <div>
            <Card.Title>Revenue Overview</Card.Title>
            <Card.Description>
              Monthly Recurring Revenue (MRR) trends
            </Card.Description>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Current MRR
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ₹{(revenueData.currentMRR / 100000).toFixed(2)}L
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Growth
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                +{revenueData.growth}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Projected Next Month
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ₹{(revenueData.projectedNext / 100000).toFixed(2)}L
              </p>
            </div>
          </div>
          <div className="h-64">
            <Line options={chartOptions} data={chartData} />
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts & Actions */}
        <Card>
          <Card.Header>
            <Card.Title>Alerts & Actions</Card.Title>
          </Card.Header>
          <Card.Body className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All systems operational
                </p>
              </div>
            ) : (
              alerts.map((alert, index) => (
                <Alert
                  key={index}
                  variant={alert.variant}
                  onAction={alert.action}
                  actionLabel="View"
                >
                  {alert.message}
                </Alert>
              ))
            )}
          </Card.Body>
        </Card>

        {/* Recent Activity */}
        <Card>
          <Card.Header>
            <Card.Title>Recent Activity</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No recent activity
                  </p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-gray-100">
                        {activity.message}
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
