/**
 * OrdersManagement Component
 * View and manage all restaurant orders
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, Eye, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { supabase, fromRestaurant } from '@shared/utils/api/supabaseClient';
import { formatCurrency, formatDateTime } from '@shared/utils/helpers/formatters';
import { exportOrders } from '@domains/analytics/utils/exportHelpers';
import { logOrderStatusChanged } from '@domains/staff/utils/activityLogger';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import DataTable from '@shared/components/compounds/DataTable';
import Modal from '@shared/components/compounds/Modal';
import Badge from '@shared/components/primitives/Badge';
import toast from 'react-hot-toast';

const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // load orders on mount

  const applyFilters = useCallback(() => {
    let filtered = [...orders];

    // Search filter (order ID or table number)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchLower) ||
          order.table?.table_number.toString().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((order) => order.order_status === filters.status);
    }

    // Payment status filter
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter((order) => order.payment_status === filters.paymentStatus);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (order) => new Date(order.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (order) => new Date(order.created_at) <= endDate
      );
    }

    setFilteredOrders(filtered);
  }, [orders, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Helper: enrich orders.items JSONB with menu item details
  const enrichOrdersWithMenuItems = React.useCallback(async (ordersList) => {
    // Collect unique menu_item_ids
    const ids = Array.from(
      new Set(
        ordersList.flatMap((o) => (Array.isArray(o.items) ? o.items : [])).map((it) => it.menu_item_id)
      )
    ).filter(Boolean);

    if (ids.length === 0) return ordersList;

    // Fetch menu item details
    const { data: menuItems, error: miErr } = await supabase
      .from('menu_items')
      .select('id, name, image_url, category, price')
      .in('id', ids);
    if (miErr) {
      console.warn('Could not load menu item details:', miErr.message);
      return ordersList;
    }
    const miMap = Object.fromEntries((menuItems || []).map((m) => [m.id, m]));

    return ordersList.map((o) => ({
      ...o,
      items: (Array.isArray(o.items) ? o.items : []).map((it) => ({
        ...it,
        menu_item: miMap[it.menu_item_id] || null,
      })),
    }));
  }, []);

  const loadOrders = React.useCallback(async () => {
    try {
      const { data, error } = await fromRestaurant('orders')
        .select(`
          *,
          table:tables!orders_table_id_fkey(table_number, capacity)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich order items with menu item details (from JSONB items)
      const enriched = await enrichOrdersWithMenuItems(data || []);
      setOrders(enriched);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [enrichOrdersWithMenuItems]);

  // Run after loadOrders is initialized
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      paymentStatus: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  const handleViewOrder = async (order) => {
    // Load full order details if not already loaded
    if (!order.items || order.items.length === 0) {
      try {
        const { data, error } = await fromRestaurant('orders')
          .select(`
            *,
            table:tables!orders_table_id_fkey(table_number, capacity)
          `)
          .eq('id', order.id)
          .single();

        if (error) throw error;
        const [enriched] = await enrichOrdersWithMenuItems([data]);
        setSelectedOrder(enriched);
      } catch (error) {
        console.error('Error loading order details:', error);
        toast.error('Failed to load order details');
        return;
      }
    } else {
      setSelectedOrder(order);
    }
    setShowOrderModal(true);
  };

  

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      await logOrderStatusChanged(orderId, newStatus);

      toast.success('Order status updated');
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleExportCSV = () => {
    exportOrders(filteredOrders, 'csv');
    toast.success('Orders exported to CSV');
  };

  const handleExportPDF = () => {
    exportOrders(filteredOrders, 'pdf');
    toast.success('Orders exported to PDF');
  };

  const getStatusBadge = (status) => {
    const variants = {
      [ORDER_STATUS.PENDING]: 'warning',
      [ORDER_STATUS.PREPARING]: 'info',
      [ORDER_STATUS.READY]: 'primary',
      [ORDER_STATUS.SERVED]: 'success',
      [ORDER_STATUS.COMPLETED]: 'success',
      [ORDER_STATUS.CANCELLED]: 'danger',
    };
    return variants[status] || 'default';
  };

  const getPaymentBadge = (status) => {
    const variants = {
      [PAYMENT_STATUS.PENDING]: 'warning',
      [PAYMENT_STATUS.PAID]: 'success',
      [PAYMENT_STATUS.FAILED]: 'danger',
      [PAYMENT_STATUS.REFUNDED]: 'info',
    };
    return variants[status] || 'default';
  };

  const columns = [
    {
      header: 'ORDER ID',
      field: 'id',
      render: (row) => (
        <div className="font-mono text-sm text-gray-300">
          #{row.id.slice(0, 8)}
        </div>
      ),
    },
    {
      header: 'TABLE',
      field: 'table',
      render: (row) => (
        <div className="font-medium text-gray-200">
          Table {row.table?.table_number || '-'}
        </div>
      ),
    },
    {
      header: 'ITEMS',
      field: 'items',
      render: (row) => (
        <div className="text-sm text-gray-300">
          {row.items?.length || 0} items
        </div>
      ),
    },
    {
      header: 'TOTAL',
      field: 'total',
      render: (row) => (
        <div className="font-semibold text-white">
          {formatCurrency(row.total)}
        </div>
      ),
    },
    {
      header: 'STATUS',
      field: 'order_status',
      render: (row) => (
        <Badge variant={getStatusBadge(row.order_status)} size="sm">
          {row.order_status.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'PAYMENT',
      field: 'payment_status',
      render: (row) => (
        <Badge variant={getPaymentBadge(row.payment_status)} size="sm">
          <DollarSign className="h-3 w-3 mr-1" />
          {row.payment_status.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'TIME',
      field: 'created_at',
      render: (row) => (
        <div className="text-sm text-gray-300">
          {formatDateTime(row.created_at)}
        </div>
      ),
    },
    {
      header: 'ACTIONS',
      field: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewOrder(row)}
            className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner text="Loading orders..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage all restaurant orders</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Total Orders</div>
          <div className="text-2xl font-bold text-foreground">{orders.length}</div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {orders.filter((o) => o.order_status === ORDER_STATUS.PENDING).length}
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Preparing</div>
          <div className="text-2xl font-bold text-blue-600">
            {orders.filter((o) => o.order_status === ORDER_STATUS.PREPARING).length}
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {orders.filter((o) => o.order_status === ORDER_STATUS.COMPLETED).length}
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Total Revenue</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(orders.reduce((sum, o) => sum + (o.total || 0), 0))}
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
                placeholder="Order ID or Table"
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-transparent"
              />
            </div>
          </div>

          {/* Order Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Order Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-transparent"
            >
              <option value="all">All Status</option>
              <option value={ORDER_STATUS.PENDING}>Pending</option>
              <option value={ORDER_STATUS.PREPARING}>Preparing</option>
              <option value={ORDER_STATUS.READY}>Ready</option>
              <option value={ORDER_STATUS.SERVED}>Served</option>
              <option value={ORDER_STATUS.COMPLETED}>Completed</option>
              <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Payment Status
            </label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-transparent"
            >
              <option value="all">All Payments</option>
              <option value={PAYMENT_STATUS.PENDING}>Pending</option>
              <option value={PAYMENT_STATUS.PAID}>Paid</option>
              <option value={PAYMENT_STATUS.FAILED}>Failed</option>
              <option value={PAYMENT_STATUS.REFUNDED}>Refunded</option>
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
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-lg shadow-sm">
        <DataTable
          data={filteredOrders}
          columns={columns}
          emptyMessage="No orders found. Orders will appear here once customers place them."
        />
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }}
        title={`Order #${selectedOrder?.id.slice(0, 8)}`}
        size="lg"
      >
        {selectedOrder && (
          <OrderDetailsContent
            order={selectedOrder}
            onStatusUpdate={handleStatusUpdate}
            onClose={() => {
              setShowOrderModal(false);
              setSelectedOrder(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

// Order Details Component
const OrderDetailsContent = ({ order, onStatusUpdate, onClose }) => {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    await onStatusUpdate(order.id, newStatus);
    setUpdating(false);
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Order Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Table Number</div>
          <div className="font-medium">Table {order.table?.table_number || '-'}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Order Time</div>
          <div className="font-medium">{formatDateTime(order.created_at)}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Order Status</div>
          <Badge variant={order.order_status === 'completed' ? 'success' : 'warning'}>
            {order.order_status.toUpperCase()}
          </Badge>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Payment Status</div>
          <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
            {order.payment_status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Order Items</h3>
        <div className="space-y-2">
          {order.items?.map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              {item.menu_item?.image_url && (
                <img
                  src={item.menu_item.image_url}
                  alt={item.menu_item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <div className="font-medium">{item.menu_item?.name}</div>
                <div className="text-sm text-muted-foreground">
                  Quantity: {item.quantity} × {formatCurrency(item.price)}
                </div>
                {item.special_instructions && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Note: {item.special_instructions}
                  </div>
                )}
              </div>
              <div className="font-semibold">
                {formatCurrency(item.quantity * item.price)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="border-t pt-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(order.discount_amount)}</span>
            </div>
          )}
          {order.tax_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">{formatCurrency(order.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Status Update Actions */}
      {order.order_status !== 'completed' && order.order_status !== 'cancelled' && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">Update Status</h3>
          <div className="flex flex-wrap gap-2">
            {order.order_status === 'pending' && (
              <button
                onClick={() => handleStatusChange('preparing')}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Clock className="h-4 w-4" />
                Start Preparing
              </button>
            )}
            {order.order_status === 'preparing' && (
              <button
                onClick={() => handleStatusChange('ready')}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Ready
              </button>
            )}
            {order.order_status === 'ready' && (
              <button
                onClick={() => handleStatusChange('served')}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Served
              </button>
            )}
            {order.order_status === 'served' && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Complete Order
              </button>
            )}
            <button
              onClick={() => handleStatusChange('cancelled')}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Cancel Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
