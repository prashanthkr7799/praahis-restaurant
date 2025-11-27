import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/shared/utils/api/supabaseClient';
import { logger } from '@/shared/utils/helpers/logger';
import toast from 'react-hot-toast';

// Components
import OverviewCards from './OverviewCards';
import RevenueCharts from './RevenueCharts';
import BillingActionsBar from './BillingActionsBar';
import TransactionsTable from './TransactionsTable';
import InvoiceModal from './modals/InvoiceModal';
import FiltersDrawer from './FiltersDrawer';

// Utils
import {
  calculateRevenueStats,
  filterByDate,
  filterByAmount,
  filterByMethod,
  filterByStatus,
} from '../utils/billingUtils';

/**
 * BILLING TAB COMPONENT
 * Main component for the billing & revenue dashboard
 * 
 * Features:
 * - Revenue overview cards
 * - Revenue analytics charts
 * - Transaction search & filtering
 * - Invoice viewing & printing
 * - CSV export
 * - Real-time updates
 */

const BillingTab = ({ restaurantId, restaurant }) => {
  // State management
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dateRange: 'all',
    customStartDate: '',
    customEndDate: '',
    paymentMethod: 'all',
    status: 'all',
    minAmount: '',
    maxAmount: '',
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Invoice modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  /**
   * Load all payments for the restaurant
   */
  const loadPayments = React.useCallback(async () => {
    try {
      setLoading(true);

      // Fetch payments with order details
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders(*)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Flatten the data structure for easier access
      const processedPayments = (paymentsData || []).map((payment) => ({
        ...payment,
        order_number: payment.order?.order_number || null,
        table_number: payment.order?.table_number || null,
      }));

      setPayments(processedPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  /**
   * Refresh payments
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPayments();
    setIsRefreshing(false);
    toast.success('Payments refreshed');
  };

  /**
   * Apply all filters to payments
   */
  const filteredPayments = useMemo(() => {
    let result = [...payments];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((payment) => {
        return (
          payment.id?.toLowerCase().includes(query) ||
          payment.order_number?.toString().toLowerCase().includes(query) ||
          payment.table_number?.toString().toLowerCase().includes(query) ||
          payment.payment_method?.toLowerCase().includes(query)
        );
      });
    }

    // Apply date filter
    if (filters.dateRange !== 'all') {
      if (filters.dateRange === 'custom') {
        if (filters.customStartDate && filters.customEndDate) {
          const start = new Date(filters.customStartDate);
          const end = new Date(filters.customEndDate);
          end.setHours(23, 59, 59, 999);
          result = filterByDate(result, { start, end });
        }
      } else {
        result = filterByDate(result, filters.dateRange);
      }
    }

    // Apply payment method filter
    if (filters.paymentMethod !== 'all') {
      result = filterByMethod(result, filters.paymentMethod);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = filterByStatus(result, filters.status);
    }

    // Apply amount filter
    if (filters.minAmount || filters.maxAmount) {
      const min = filters.minAmount ? parseFloat(filters.minAmount) : null;
      const max = filters.maxAmount ? parseFloat(filters.maxAmount) : null;
      result = filterByAmount(result, min, max);
    }

    return result;
  }, [payments, searchQuery, filters]);

  /**
   * Calculate revenue statistics
   */
  const revenueStats = useMemo(() => {
    return calculateRevenueStats(payments);
  }, [payments]);

  /**
   * Handle overview card click - apply quick filter
   */
  const handleCardClick = (cardId) => {
    const filterMap = {
      today: 'today',
      week: 'week',
      month: 'month',
      pending: 'pending',
    };

    if (cardId === 'pending') {
      setFilters({
        ...filters,
        status: 'pending',
        dateRange: 'all',
      });
      toast.success('Showing pending payments');
    } else if (filterMap[cardId]) {
      setFilters({
        ...filters,
        dateRange: filterMap[cardId],
        status: 'all',
      });
      toast.success(`Showing ${cardId}'s revenue`);
    }
  };

  /**
   * Open invoice modal
   */
  const handleViewInvoice = (payment) => {
    setSelectedPayment(payment);
    setIsInvoiceModalOpen(true);
  };

  /**
   * Close invoice modal
   */
  const handleCloseInvoice = () => {
    setIsInvoiceModalOpen(false);
    setSelectedPayment(null);
  };

  /**
   * Apply filters from drawer
   */
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    toast.success('Filters applied');
  };

  /**
   * Setup real-time subscriptions
   */
  useEffect(() => {
    if (!restaurantId) return;

    // Initial load
    loadPayments();

    // Subscribe to payments changes
    const paymentsChannel = supabase
      .channel(`payments-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          logger.log('Payment change detected:', payload);
          loadPayments();
        }
      )
      .subscribe();

    // Subscribe to orders changes (affects payment display)
    const ordersChannel = supabase
      .channel(`orders-billing-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          logger.log('Order change detected:', payload);
          // Only reload if payment-related fields changed
          if (payload.eventType === 'UPDATE') {
            loadPayments();
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [restaurantId, loadPayments]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            💰 Billing & Revenue
          </h1>
          <p className="text-gray-400">
            Track payments, view transactions, and analyze revenue
          </p>
        </div>

        {/* Overview Cards */}
        <OverviewCards
          revenueStats={revenueStats}
          loading={loading}
          onCardClick={handleCardClick}
        />

        {/* Revenue Charts */}
        <RevenueCharts
          payments={payments}
          loading={loading}
        />

        {/* Actions Bar */}
        <BillingActionsBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenFilters={() => setIsFiltersOpen(true)}
          onRefresh={handleRefresh}
          payments={filteredPayments}
          isRefreshing={isRefreshing}
        />

        {/* Transactions Table */}
        <TransactionsTable
          payments={filteredPayments}
          loading={loading}
          onViewInvoice={handleViewInvoice}
        />

        {/* Filters Drawer */}
        <FiltersDrawer
          isOpen={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          filters={filters}
          onApplyFilters={handleApplyFilters}
        />

        {/* Invoice Modal */}
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={handleCloseInvoice}
          payment={selectedPayment}
          restaurant={restaurant}
        />
      </div>
    </div>
  );
};

export default BillingTab;
