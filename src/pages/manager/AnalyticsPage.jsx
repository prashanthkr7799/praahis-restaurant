/**
 * Analytics Component
 * Dashboard analytics with interactive charts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import { fromRestaurant } from '@shared/utils/api/supabaseClient';
import { formatCurrency } from '@shared/utils/helpers/formatters';
import { CardSkeleton, ChartSkeleton } from '@shared/components/feedback/LoadingSkeleton';
import RevenueChart from '@domains/analytics/components/RevenueChart';
import OrdersChart from '@domains/analytics/components/OrdersChart';
import StatusChart from '@domains/analytics/components/StatusChart';
import PopularItemsChart from '@domains/analytics/components/PopularItemsChart';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // days
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0,
  });

  const [revenueData, setRevenueData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [popularItemsData, setPopularItemsData] = useState([]);

  

  // Memoize loaders so effects can depend on them safely
  const loadStats = useCallback(async () => {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      const { data: revenueData, error } = await fromRestaurant('orders')
        .select('total')
        .eq('payment_status', 'paid')
        .gte('created_at', daysAgo.toISOString());

      if (error) throw error;

      const totalRevenue = revenueData.reduce((sum, order) => sum + (order.total || 0), 0);

      const { count: totalOrders, error: ordersError } = await fromRestaurant('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', daysAgo.toISOString());

      if (ordersError) throw ordersError;

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const { data: customersData, error: customersError } = await fromRestaurant('orders')
        .select('table_id')
        .gte('created_at', daysAgo.toISOString());

      if (customersError) throw customersError;

      const uniqueTables = new Set(customersData.map(o => o.table_id)).size;

      setStats({
        totalRevenue,
        totalOrders: totalOrders || 0,
        averageOrderValue,
        totalCustomers: uniqueTables,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [dateRange]);

  const loadRevenueData = useCallback(async () => {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      const { data: revenueData, error } = await fromRestaurant('orders')
        .select('created_at, total, payment_status')
        .eq('payment_status', 'paid')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const revenueByDate = {};
      revenueData.forEach((order) => {
        const date = new Date(order.created_at).toLocaleDateString();
        if (!revenueByDate[date]) {
          revenueByDate[date] = 0;
        }
        revenueByDate[date] += order.total || 0;
      });

      const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({
        date,
        revenue,
      }));

      setRevenueData(chartData);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    }
  }, [dateRange]);

  const loadOrdersData = useCallback(async () => {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      // Fetch recent orders with embedded items JSON and menu items to map categories
      const [{ data: orders, error: ordersError }, { data: menuItems, error: miErr }] = await Promise.all([
        fromRestaurant('orders')
          .select('id, items, created_at')
          .gte('created_at', daysAgo.toISOString()),
        fromRestaurant('menu_items')
          .select('id, category')
      ]);

      if (ordersError) throw ordersError;
      if (miErr) throw miErr;

      const menuMap = new Map((menuItems || []).map((m) => [m.id, m.category]));

      const categoryCount = {};
      (orders || []).forEach((order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        items.forEach((it) => {
          const cat = it.category || menuMap.get(it.menu_item_id) || 'Unknown';
          categoryCount[cat] = (categoryCount[cat] || 0) + (it.quantity || 1);
        });
      });

      const chartData = Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count,
      }));

      setOrdersData(chartData);
    } catch (error) {
      console.error('Error loading orders data:', error);
    }
  }, [dateRange]);

  const loadStatusData = useCallback(async () => {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      const { data, error } = await fromRestaurant('orders')
        .select('order_status')
        .gte('created_at', daysAgo.toISOString());

      if (error) throw error;

      const statusCount = {};
      data.forEach((order) => {
        const status = order.order_status;
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      const statusColors = {
        pending: '#f59e0b',
        preparing: '#3b82f6',
        ready: '#10b981',
        served: '#8b5cf6',
        completed: '#06b6d4',
        cancelled: '#ef4444',
      };

      const chartData = Object.entries(statusCount).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        fill: statusColors[status] || '#6b7280',
      }));

      setStatusData(chartData);
    } catch (error) {
      console.error('Error loading status data:', error);
    }
  }, [dateRange]);

  const loadPopularItems = useCallback(async () => {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      // Compute popular items from orders.items JSON, joining menu_items for names
      const [{ data: orders, error: ordersError }, { data: menuItems, error: miErr }] = await Promise.all([
        fromRestaurant('orders')
          .select('items, created_at')
          .gte('created_at', daysAgo.toISOString()),
        fromRestaurant('menu_items')
          .select('id, name')
      ]);

      if (ordersError) throw ordersError;
      if (miErr) throw miErr;

      const nameMap = new Map((menuItems || []).map((m) => [m.id, m.name]));
      const itemQuantities = {};
      (orders || []).forEach((order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        items.forEach((it) => {
          const key = it.name || nameMap.get(it.menu_item_id) || `Item ${it.menu_item_id}`;
          const qty = it.quantity || 1;
          itemQuantities[key] = (itemQuantities[key] || 0) + qty;
        });
      });

      const sortedItems = Object.entries(itemQuantities)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      setPopularItemsData(sortedItems);
    } catch (error) {
      console.error('Error loading popular items:', error);
    }
  }, [dateRange]);

  const memoLoadAnalytics = useCallback(async () => {
    try {
      await Promise.all([
        loadStats(),
        loadRevenueData(),
        loadOrdersData(),
        loadStatusData(),
        loadPopularItems(),
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadStats, loadRevenueData, loadOrdersData, loadStatusData, loadPopularItems]);

  useEffect(() => {
    memoLoadAnalytics();
  }, [memoLoadAnalytics]);

  const handleRefresh = () => {
    setRefreshing(true);
    memoLoadAnalytics();
  };

  const handleExport = () => {
    toast.success('Export feature coming soon!');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-56 bg-white/10 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-72 bg-white/5 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-white/10 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
        <CardSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
      const [dateRange, setDateRange] = useState('30'); // days
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Track your restaurant's performance</p>
        </div>
        <div className="flex gap-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span>From paid orders</span>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Total Orders</div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.totalOrders}</div>
          <div className="text-sm text-muted-foreground mt-1">
            Last {dateRange} days
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Avg Order Value</div>
            <div className="bg-purple-100 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(stats.averageOrderValue)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Per order
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Customers</div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.totalCustomers}</div>
          <div className="text-sm text-muted-foreground mt-1">
            Unique tables
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Revenue Trend</h2>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <RevenueChart data={revenueData} />
        </div>

        {/* Orders by Category */}
        <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Orders by Category</h2>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </div>
          <OrdersChart data={ordersData} />
        </div>

        {/* Order Status Distribution */}
        <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Order Status</h2>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <StatusChart data={statusData} />
        </div>

        {/* Popular Items */}
        <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Popular Items</h2>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <PopularItemsChart data={popularItemsData} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
