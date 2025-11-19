/**
 * Analytics Dashboard - Super Admin
 * Comprehensive analytics with charts and statistics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, DollarSign, Building2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    suspendedRestaurants: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    overdueRevenue: 0,
  });
  const [restaurantGrowth, setRestaurantGrowth] = useState([]);
  const [paymentActivity, setPaymentActivity] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [revenueByMonth, setRevenueByMonth] = useState([]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch restaurants
      const { data: restaurants } = await supabaseOwner
        .from('restaurants')
        .select('id, name, is_active, created_at');

      // Fetch billing data
      const { data: billing } = await supabaseOwner
        .from('billing')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch payments
      const { data: payments } = await supabaseOwner
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      // Calculate stats
      const totalRestaurants = restaurants?.length || 0;
      const activeRestaurants = restaurants?.filter(r => r.is_active).length || 0;
      const suspendedRestaurants = totalRestaurants - activeRestaurants;

      const totalRevenue = (billing?.filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0);
      const pendingRevenue = (billing?.filter(b => b.status === 'pending')
        .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0);
      const overdueRevenue = (billing?.filter(b => b.status === 'overdue')
        .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0);

      setStats({
        totalRestaurants,
        activeRestaurants,
        suspendedRestaurants,
        totalRevenue,
        pendingRevenue,
        overdueRevenue,
      });

      // Restaurant growth data (last 6 months)
      const growthData = generateGrowthData(restaurants);
      setRestaurantGrowth(growthData);

      // Payment activity (last 12 months)
      const activityData = generatePaymentActivity(billing, payments);
      setPaymentActivity(activityData);

      // Status distribution
      const distribution = [
        { name: 'Active', value: activeRestaurants, color: '#10b981' },
        { name: 'Suspended', value: suspendedRestaurants, color: '#ef4444' },
      ];
      setStatusDistribution(distribution);

      // Revenue by month
      const revenueData = generateRevenueByMonth(billing);
      setRevenueByMonth(revenueData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const generateGrowthData = (restaurants) => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const count = restaurants?.filter(r => {
        const createdDate = new Date(r.created_at);
        return createdDate <= date;
      }).length || 0;
      
      months.push({ month: monthName, count });
    }
    
    return months;
  };

  const generatePaymentActivity = (billing, _payments) => {
    const now = new Date();
    const months = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthBilling = billing?.filter(b => {
        const billingDate = new Date(b.billing_period);
        return billingDate.getMonth() === date.getMonth() && 
               billingDate.getFullYear() === date.getFullYear();
      }) || [];
      
      const billed = monthBilling.reduce((sum, b) => sum + Number(b.total_amount), 0);
      const paid = monthBilling.filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + Number(b.total_amount), 0);
      const pending = monthBilling.filter(b => b.status === 'pending')
        .reduce((sum, b) => sum + Number(b.total_amount), 0);
      
      months.push({ 
        month: monthName, 
        billed: billed / 1000, // Convert to thousands
        paid: paid / 1000,
        pending: pending / 1000
      });
    }
    
    return months;
  };

  const generateRevenueByMonth = (billing) => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthRevenue = billing?.filter(b => {
        const billingDate = new Date(b.billing_period);
        return billingDate.getMonth() === date.getMonth() && 
               billingDate.getFullYear() === date.getFullYear() &&
               b.status === 'paid';
      }).reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
      
      months.push({ month: monthName, revenue: monthRevenue / 1000 });
    }
    
    return months;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">Comprehensive insights and statistics</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Restaurants</p>
              <p className="text-3xl font-bold text-gray-100 mt-1">{stats.totalRestaurants}</p>
              <p className="text-xs text-green-600 mt-2">
                {stats.activeRestaurants} active, {stats.suspendedRestaurants} suspended
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-400 mt-2">Lifetime collected</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Revenue</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {formatCurrency(stats.pendingRevenue)}
              </p>
              <p className="text-xs text-red-600 mt-2">
                {formatCurrency(stats.overdueRevenue)} overdue
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Restaurant Growth Chart */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Restaurant Growth (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={restaurantGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                formatter={(value) => [`${value} restaurants`, 'Count']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total Restaurants"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Restaurant Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => 
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center space-x-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">
                Active: {stats.activeRestaurants}
              </span>
            </div>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-gray-600">
                Suspended: {stats.suspendedRestaurants}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Activity Chart */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Payment Activity (Last 12 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" label={{ value: '₹ (Thousands)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                formatter={(value) => [`₹${(value * 1000).toLocaleString('en-IN')}`, '']}
              />
              <Legend />
              <Bar dataKey="paid" fill="#10b981" name="Paid" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Month */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Revenue Trend (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" label={{ value: '₹ (Thousands)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                formatter={(value) => [`₹${(value * 1000).toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Revenue"
                dot={{ fill: '#10b981', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-gray-900 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Quick Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Active Restaurants</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeRestaurants}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(stats.pendingRevenue)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Overdue Amount</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.overdueRevenue)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
