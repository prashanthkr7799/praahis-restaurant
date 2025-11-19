/**
 * PaymentsTracking Component
 * Monitor and manage payment transactions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  RefreshCw, 
  TrendingUp, 
  AlertCircle,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { supabase, fromRestaurant } from '@shared/utils/api/supabaseClient';
import { formatCurrency, formatDateTime } from '@shared/utils/helpers/formatters';
import { exportPayments } from '@domains/analytics/utils/exportHelpers';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import DataTable from '@shared/components/compounds/DataTable';
import Modal from '@shared/components/compounds/Modal';
import Badge from '@shared/components/primitives/Badge';
import toast from 'react-hot-toast';

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  ONLINE: 'online',
};

const PaymentsTracking = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    method: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    refundedAmount: 0,
    successfulPayments: 0,
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...payments];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (payment) =>
          payment.id.toLowerCase().includes(searchLower) ||
          payment.razorpay_order_id?.toLowerCase().includes(searchLower) ||
          payment.razorpay_payment_id?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((payment) => payment.payment_status === filters.status);
    }

    // Payment method filter
    if (filters.method !== 'all') {
      filtered = filtered.filter((payment) => payment.payment_method === filters.method);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (payment) => new Date(payment.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (payment) => new Date(payment.created_at) <= endDate
      );
    }

    setFilteredPayments(filtered);
  }, [payments, filters]);

  const calculateStats = useCallback(() => {
    const totalRevenue = payments
      .filter((p) => p.payment_status === PAYMENT_STATUS.PAID)
      .reduce((sum, p) => sum + (p.total || 0), 0);

    const pendingAmount = payments
      .filter((p) => p.payment_status === PAYMENT_STATUS.PENDING)
      .reduce((sum, p) => sum + (p.total || 0), 0);

    const refundedAmount = payments
      .filter((p) => p.payment_status === PAYMENT_STATUS.REFUNDED)
      .reduce((sum, p) => sum + (p.total || 0), 0);

    const successfulPayments = payments.filter(
      (p) => p.payment_status === PAYMENT_STATUS.PAID
    ).length;

    setStats({
      totalRevenue,
      pendingAmount,
      refundedAmount,
      successfulPayments,
    });
  }, [payments]);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [applyFilters, calculateStats]);

  const loadPayments = async () => {
    try {
      // Note: payment_method is in order_payments table, not orders (canonical schema)
      const { data, error } = await fromRestaurant('orders')
        .select(`
          *,
          table:tables!orders_table_id_fkey(table_number),
          order_payments(
            id,
            payment_method,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            status,
            amount,
            currency,
            payment_details,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Flatten order_payments data into order object for easier access
      const flattenedData = data?.map(order => ({
        ...order,
        payment_method: order.order_payments?.[0]?.payment_method || 'cash',
        payment_amount: order.order_payments?.[0]?.amount || order.total,
        payment_details: order.order_payments?.[0]?.payment_details || {},
        payment_id: order.order_payments?.[0]?.id,
      })) || [];
      
      setPayments(flattenedData);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      method: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleRefundClick = (payment) => {
    setSelectedPayment(payment);
    setShowRefundModal(true);
  };

  const handleProcessRefund = async (reason) => {
    if (!selectedPayment) return;

    try {
      // In a real application, this would call Razorpay refund API
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: PAYMENT_STATUS.REFUNDED,
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      toast.success('Refund processed successfully');
      loadPayments();
      setShowRefundModal(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    }
  };

  const handleExportCSV = () => {
    if (typeof exportPayments === 'function') {
      exportPayments(filteredPayments, 'csv');
      toast.success('Payments exported to CSV');
    } else {
      toast.error('Export function not available');
    }
  };

  const handleExportPDF = () => {
    if (typeof exportPayments === 'function') {
      exportPayments(filteredPayments, 'pdf');
      toast.success('Payments exported to PDF');
    } else {
      toast.error('Export function not available');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      [PAYMENT_STATUS.PENDING]: 'warning',
      [PAYMENT_STATUS.PAID]: 'success',
      [PAYMENT_STATUS.FAILED]: 'danger',
      [PAYMENT_STATUS.REFUNDED]: 'info',
    };
    return variants[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      [PAYMENT_STATUS.PENDING]: Clock,
      [PAYMENT_STATUS.PAID]: CheckCircle,
      [PAYMENT_STATUS.FAILED]: XCircle,
      [PAYMENT_STATUS.REFUNDED]: RefreshCw,
    };
    return icons[status] || AlertCircle;
  };

  const columns = [
    {
      header: 'Transaction ID',
      field: 'id',
      render: (row) => (
        <div>
          <div className="font-mono text-sm">#{row.id.slice(0, 8)}</div>
          {row.razorpay_payment_id && (
            <div className="text-xs text-muted-foreground mt-1">
              RZP: {row.razorpay_payment_id.slice(0, 12)}...
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Table',
      field: 'table',
      render: (row) => (
        <div className="font-medium">
          Table {row.table?.table_number || '-'}
        </div>
      ),
    },
    {
      header: 'Amount',
      field: 'total',
      render: (row) => (
        <div className="font-semibold text-gray-900">
          {formatCurrency(row.total)}
        </div>
      ),
    },
    {
      header: 'Method',
      field: 'payment_method',
      render: (row) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{row.payment_method || 'Not Set'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      field: 'payment_status',
      render: (row) => {
        const StatusIcon = getStatusIcon(row.payment_status);
        return (
          <Badge variant={getStatusBadge(row.payment_status)} size="sm">
            <StatusIcon className="h-3 w-3 mr-1" />
            {row.payment_status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      header: 'Date & Time',
      field: 'created_at',
      render: (row) => (
        <div className="text-sm text-muted-foreground">
          {formatDateTime(row.created_at)}
        </div>
      ),
    },
    {
      header: 'Actions',
      field: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDetails(row)}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            Details
          </button>
          {row.payment_status === PAYMENT_STATUS.PAID && (
            <button
              onClick={() => handleRefundClick(row)}
              className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded transition-colors"
            >
              Refund
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner text="Loading payments..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor transactions and manage refunds</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue)}
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Successful Payments</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.successfulPayments}
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Pending Amount</div>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats.pendingAmount)}
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Refunded Amount</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.refundedAmount)}
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <RefreshCw className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-primary hover:opacity-90"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Transaction ID..."
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-transparent"
              />
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Payment Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-transparent"
            >
              <option value="all">All Status</option>
              <option value={PAYMENT_STATUS.PENDING}>Pending</option>
              <option value={PAYMENT_STATUS.PAID}>Paid</option>
              <option value={PAYMENT_STATUS.FAILED}>Failed</option>
              <option value={PAYMENT_STATUS.REFUNDED}>Refunded</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Payment Method
            </label>
            <select
              value={filters.method}
              onChange={(e) => handleFilterChange('method', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-transparent"
            >
              <option value="all">All Methods</option>
              <option value={PAYMENT_METHODS.CASH}>Cash</option>
              <option value={PAYMENT_METHODS.CARD}>Card</option>
              <option value={PAYMENT_METHODS.UPI}>UPI</option>
              <option value={PAYMENT_METHODS.ONLINE}>Online</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-transparent"
            />
          </div>
        </div>

        <div className="mt-3 text-sm text-muted-foreground">
          Showing {filteredPayments.length} of {payments.length} transactions
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-card rounded-lg shadow-sm">
        <DataTable
          data={filteredPayments}
          columns={columns}
          emptyMessage="No payment transactions found."
        />
      </div>

      {/* Payment Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPayment(null);
        }}
        title="Payment Details"
        size="md"
      >
        {selectedPayment && <PaymentDetailsContent payment={selectedPayment} />}
      </Modal>

      {/* Refund Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setSelectedPayment(null);
        }}
        title="Process Refund"
        size="sm"
      >
        {selectedPayment && (
          <RefundForm
            payment={selectedPayment}
            onSubmit={handleProcessRefund}
            onCancel={() => {
              setShowRefundModal(false);
              setSelectedPayment(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

// Payment Details Component
const PaymentDetailsContent = ({ payment }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Transaction ID</div>
          <div className="font-mono text-sm">#{payment.id.slice(0, 12)}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Table</div>
          <div className="font-medium">Table {payment.table?.table_number || '-'}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Amount</div>
          <div className="font-semibold text-lg">{formatCurrency(payment.total)}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Payment Method</div>
          <div className="capitalize">{payment.payment_method || 'Not Set'}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Status</div>
          <Badge variant={payment.payment_status === 'paid' ? 'success' : 'warning'}>
            {payment.payment_status.toUpperCase()}
          </Badge>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Date</div>
          <div>{formatDateTime(payment.created_at)}</div>
        </div>
      </div>

      {payment.razorpay_order_id && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Razorpay Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono">{payment.razorpay_order_id}</span>
            </div>
            {payment.razorpay_payment_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment ID:</span>
                <span className="font-mono">{payment.razorpay_payment_id}</span>
              </div>
            )}
            {payment.razorpay_signature && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signature:</span>
                <span className="font-mono text-xs">{payment.razorpay_signature.slice(0, 20)}...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {payment.refund_reason && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Refund Information</h3>
          <div className="text-sm">
            <div className="text-muted-foreground mb-1">Reason:</div>
            <div className="bg-muted p-3 rounded">{payment.refund_reason}</div>
            {payment.refunded_at && (
              <div className="mt-2 text-muted-foreground">
                Refunded on: {formatDateTime(payment.refunded_at)}
              </div>
            )}
          </div>
        </div>
      )}

      {payment.items && payment.items.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Order Items</h3>
          <div className="space-y-2">
            {payment.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.menu_item?.name} × {item.quantity}</span>
                <span className="font-medium">
                  {formatCurrency(item.quantity * (item.menu_item?.price || 0))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Refund Form Component
const RefundForm = ({ payment, onSubmit, onCancel }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide a reason for refund');
      return;
    }

    setLoading(true);
    await onSubmit(reason);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Confirm Refund</p>
            <p>
              You are about to process a refund of {formatCurrency(payment.total)} 
              for transaction #{payment.id.slice(0, 8)}.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Reason for Refund <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-transparent"
          placeholder="Please provide a detailed reason for the refund..."
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Process Refund'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-muted text-foreground px-4 py-2 rounded-lg hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PaymentsTracking;
