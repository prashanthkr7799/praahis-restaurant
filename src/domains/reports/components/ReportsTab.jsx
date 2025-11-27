/**
 * ⚠️ REPORTS TAB — PHASE 8 ANALYTICS
 * 
 * MAIN ORCHESTRATOR COMPONENT
 * 
 * WARNING: Ensure all imports match exact file names
 * - ReportsDateRangePicker.jsx
 * - ReportsOverview.jsx
 * - SalesRevenueReport.jsx
 * - CategoryPerformanceReport.jsx
 * - ItemPerformanceReport.jsx
 * - PeakHoursReport.jsx
 * - StaffPerformanceReport.jsx
 * - CustomerFlowReport.jsx
 * - ReportsExportBar.jsx
 * - reportsUtils.js
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { BarChart3, Loader2 } from 'lucide-react';
import ReportsDateRangePicker from '@domains/reports/components/ReportsDateRangePicker';
import ReportsOverview from '@domains/reports/components/ReportsOverview';
import SalesRevenueReport from '@domains/reports/components/SalesRevenueReport';
import CategoryPerformanceReport from '@domains/reports/components/CategoryPerformanceReport';
import ItemPerformanceReport from '@domains/reports/components/ItemPerformanceReport';
import PeakHoursReport from '@domains/reports/components/PeakHoursReport';
import StaffPerformanceReport from '@domains/reports/components/StaffPerformanceReport';
import CustomerFlowReport from '@domains/reports/components/CustomerFlowReport';
import ReportsExportBar from '@domains/reports/components/ReportsExportBar';
import {
  filterOrdersByDateRange,
  filterItemsByDateRange,
  filterPaymentsByDateRange,
  filterSessionsByDateRange,
  calculateDatewiseBreakdown,
  calculateCategoryPerformance,
  calculateItemPerformance,
  calculatePeakHours,
  calculateStaffPerformance
} from '@domains/reports/utils/reportsUtils';

/**
 * Main Reports Tab Component
 * Orchestrates all report components with data loading and real-time updates
 */
export default function ReportsTab() {
  // State
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);

  // Raw data from database
  const [allOrders, setAllOrders] = useState([]);
  const [allOrderItems, setAllOrderItems] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allTableSessions, setAllTableSessions] = useState([]);
  const [allFeedbacks, setAllFeedbacks] = useState([]);

  // Filtered data based on date range
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredOrderItems, setFilteredOrderItems] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [previousOrders, setPreviousOrders] = useState([]);

  /**
   * Load all reports data from Supabase
   */
  const loadAllReportsData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        ordersRes,
        orderItemsRes,
        paymentsRes,
        menuItemsRes,
        usersRes,
        sessionsRes,
        feedbacksRes
      ] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('order_items').select('*'),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('menu_items').select('*'),
        supabase.from('users').select('*'),
        supabase.from('table_sessions').select('*').order('created_at', { ascending: false }),
        supabase.from('feedbacks').select('*').order('created_at', { ascending: false })
      ]);

      // Set raw data
      setAllOrders(ordersRes.data || []);
      setAllOrderItems(orderItemsRes.data || []);
      setAllPayments(paymentsRes.data || []);
      setAllMenuItems(menuItemsRes.data || []);
      setAllUsers(usersRes.data || []);
      setAllTableSessions(sessionsRes.data || []);
      setAllFeedbacks(feedbacksRes.data || []);

    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Apply date range filter to all data
   */
  const applyDateRangeFilter = useCallback(() => {
    if (!dateRange) return;

    const { start, end } = dateRange;

    // Filter current period data
    const orders = filterOrdersByDateRange(allOrders, start, end);
    const orderItems = filterItemsByDateRange(allOrderItems, allOrders, start, end);
    const payments = filterPaymentsByDateRange(allPayments, start, end);
    const sessions = filterSessionsByDateRange(allTableSessions, start, end);

    setFilteredOrders(orders);
    setFilteredOrderItems(orderItems);
    setFilteredPayments(payments);
    setFilteredSessions(sessions);

    // Calculate previous period for trend comparison
    const duration = end - start;
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(start);
    const prevOrders = filterOrdersByDateRange(allOrders, prevStart, prevEnd);
    setPreviousOrders(prevOrders);

  }, [dateRange, allOrders, allOrderItems, allPayments, allTableSessions]);

  /**
   * Handle date range change
   */
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  /**
   * Compute all reports data for export
   */
  const computeAllReportsData = useCallback(() => {
    return {
      sales: calculateDatewiseBreakdown(filteredOrders, filteredPayments),
      categories: calculateCategoryPerformance(filteredOrderItems, allMenuItems, filteredOrders),
      items: calculateItemPerformance(filteredOrderItems, allMenuItems, filteredOrders),
      peakHours: calculatePeakHours(filteredOrders),
      staff: calculateStaffPerformance(filteredOrders, filteredOrderItems, allUsers, allFeedbacks),
      customerFlow: filteredSessions
    };
  }, [filteredOrders, filteredOrderItems, filteredPayments, filteredSessions, allMenuItems, allUsers, allFeedbacks]);

  /**
   * Set up real-time subscriptions
   */
  useEffect(() => {
    // Subscribe to orders changes
    const ordersSubscription = supabase
      .channel('reports-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadAllReportsData();
      })
      .subscribe();

    // Subscribe to payments changes
    const paymentsSubscription = supabase
      .channel('reports-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadAllReportsData();
      })
      .subscribe();

    // Subscribe to order_items changes
    const orderItemsSubscription = supabase
      .channel('reports-order-items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        loadAllReportsData();
      })
      .subscribe();

    // Subscribe to table_sessions changes
    const sessionsSubscription = supabase
      .channel('reports-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, () => {
        loadAllReportsData();
      })
      .subscribe();

    // Subscribe to feedbacks changes
    const feedbacksSubscription = supabase
      .channel('reports-feedbacks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, () => {
        loadAllReportsData();
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      ordersSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
      orderItemsSubscription.unsubscribe();
      sessionsSubscription.unsubscribe();
      feedbacksSubscription.unsubscribe();
    };
  }, [loadAllReportsData]);

  /**
   * Initial data load
   */
  useEffect(() => {
    loadAllReportsData();
  }, [loadAllReportsData]);

  /**
   * Apply filter when date range or data changes
   */
  useEffect(() => {
    if (dateRange) {
      applyDateRangeFilter();
    }
  }, [dateRange, applyDateRangeFilter]);

  /**
   * Loading state
   */
  if (loading && allOrders.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-500/20 rounded-lg">
          <BarChart3 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-white/70">
            Comprehensive insights and performance metrics
          </p>
        </div>
      </div>

      {/* Date Range Picker */}
      <ReportsDateRangePicker
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
      />

      {/* Show message if no date range selected */}
      {!dateRange && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 text-center">
          <p className="text-amber-400 font-semibold">
            Please select a date range to view reports
          </p>
        </div>
      )}

      {/* Reports Content */}
      {dateRange && (
        <>
          {/* Overview Cards */}
          <ReportsOverview
            orders={filteredOrders}
            previousOrders={previousOrders}
          />

          {/* Sales & Revenue Report */}
          <SalesRevenueReport
            orders={filteredOrders}
            payments={filteredPayments}
          />

          {/* Category Performance Report */}
          <CategoryPerformanceReport
            orders={filteredOrders}
            orderItems={filteredOrderItems}
            menuItems={allMenuItems}
          />

          {/* Item Performance Report */}
          <ItemPerformanceReport
            orders={filteredOrders}
            orderItems={filteredOrderItems}
            menuItems={allMenuItems}
          />

          {/* Peak Hours Report */}
          <PeakHoursReport
            orders={filteredOrders}
          />

          {/* Staff Performance Report */}
          <StaffPerformanceReport
            orders={filteredOrders}
            orderItems={filteredOrderItems}
            users={allUsers}
            feedbacks={allFeedbacks}
          />

          {/* Customer Flow Report */}
          <CustomerFlowReport
            tableSessions={filteredSessions}
            orders={filteredOrders}
          />

          {/* Export Bar */}
          <ReportsExportBar
            allReportsData={computeAllReportsData()}
            onRefresh={loadAllReportsData}
            isLoading={loading}
          />
        </>
      )}
    </div>
  );
}
