import React, { useState, useEffect } from 'react';
import { X, Users, Clock, DollarSign, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency } from '@shared/utils/helpers/formatters';
import toast from 'react-hot-toast';
import ConfirmationModal from '@domains/tables/components/ConfirmationModal';

const TableDetailsModal = ({ 
  isOpen, 
  onClose, 
  table, 
  onMarkAvailable, 
  onCallWaiter,
  restaurantId
}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
  });
  const [showConfirmMarkAvailable, setShowConfirmMarkAvailable] = useState(false);
  const [showConfirmCallWaiter, setShowConfirmCallWaiter] = useState(false);

  useEffect(() => {
    if (isOpen && table?.activeSessionId) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, table]);

  const loadOrders = async () => {
    if (!table?.activeSessionId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            id,
            name,
            quantity,
            price,
            item_status,
            is_veg
          )
        `)
        .eq('session_id', table.activeSessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);

      // Calculate totals
      const subtotal = data?.reduce((sum, order) => sum + (order.subtotal || 0), 0) || 0;
      const tax = data?.reduce((sum, order) => sum + (order.tax || 0), 0) || 0;
      const total = data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      setTotals({ subtotal, tax, total });
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const hasPendingPayments = orders.some(order => order.payment_status === 'pending');

  /**
   * Handler to mark table as available
   * Opens confirmation dialog first to prevent accidental clicks
   */
  const handleMarkAvailable = () => {
    if (hasPendingPayments) {
      toast.error('Cannot mark table as available with pending payments');
      return;
    }
    setShowConfirmMarkAvailable(true);
  };

  /**
   * Confirmed action to mark table available
   */
  const confirmMarkAvailable = () => {
    onMarkAvailable(table.id);
    setShowConfirmMarkAvailable(false);
  };

  /**
   * Handler to call waiter
   * Opens confirmation dialog and sends notification via notification service
   */
  const handleCallWaiter = () => {
    setShowConfirmCallWaiter(true);
  };

  /**
   * Confirmed action to call waiter
   * Creates a notification in the database for all waiters
   */
  const confirmCallWaiter = async () => {
    try {
      // Create notification for waiters
      const { error } = await supabase
        .from('notifications')
        .insert({
          restaurant_id: restaurantId,
          type: 'waiter_call',
          title: `Table ${table.table_number} needs assistance`,
          message: `Customer at Table ${table.table_number} has requested waiter service`,
          priority: 'high',
          metadata: {
            table_id: table.id,
            table_number: table.table_number,
            source: 'manager_dashboard'
          }
        });

      if (error) throw error;

      toast.success(`Waiter called for Table ${table.table_number}`);
      
      // Also call the parent handler if provided
      if (onCallWaiter) {
        onCallWaiter(table.table_number);
      }
    } catch (error) {
      console.error('Error calling waiter:', error);
      toast.error('Failed to call waiter');
    }
    
    setShowConfirmCallWaiter(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Table {table?.table_number}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Status: <span className="capitalize">{table?.status}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Table Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Users className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Capacity
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {table?.capacity || 4}
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Duration
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {table?.booked_at
                  ? Math.round((Date.now() - new Date(table.booked_at)) / 60000) + ' min'
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Orders</h3>

            {loading && (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="glass-panel p-4 rounded-xl border border-white/10 animate-pulse"
                  >
                    <div className="h-4 bg-white/10 rounded w-32 mb-3"></div>
                    <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
                    <div className="h-3 bg-white/10 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            )}

            {!loading && orders.length === 0 && (
              <div className="glass-panel p-8 rounded-xl border border-white/10 text-center">
                <AlertCircle className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No orders for this table</p>
              </div>
            )}

            {!loading && orders.length > 0 && (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="glass-panel p-4 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Order #{order.order_number}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                            order.order_status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : order.order_status === 'preparing'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-primary/20 text-primary'
                          }`}
                        >
                          {order.order_status}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.order_items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-white">
                              {item.quantity}x {item.name}
                            </span>
                            {item.is_veg && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                                VEG
                              </span>
                            )}
                          </div>
                          <span className="text-zinc-400">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Total</span>
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bill Summary */}
          {orders.length > 0 && (
            <div className="glass-panel p-6 rounded-xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Bill Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="text-white">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Tax</span>
                  <span className="text-white">{formatCurrency(totals.tax)}</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-base font-bold text-white">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>

              {hasPendingPayments && (
                <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">
                      Pending Payments
                    </p>
                    <p className="text-xs text-amber-300/80 mt-1">
                      Some orders have pending payments. Complete payments before marking table as available.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={handleCallWaiter}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-white transition-colors"
          >
            <Bell className="h-4 w-4" />
            Call Waiter
          </button>
          <button
            onClick={handleMarkAvailable}
            disabled={hasPendingPayments || table?.status === 'available'}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white transition-colors ${
              hasPendingPayments || table?.status === 'available'
                ? 'bg-zinc-700 cursor-not-allowed opacity-50'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            Mark Available
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showConfirmMarkAvailable}
        onClose={() => setShowConfirmMarkAvailable(false)}
        onConfirm={confirmMarkAvailable}
        title="Mark Table Available"
        message={`Are you sure you want to mark Table ${table?.table_number} as available? This will end the current session.`}
        confirmText="Mark Available"
        variant="success"
      />

      <ConfirmationModal
        isOpen={showConfirmCallWaiter}
        onClose={() => setShowConfirmCallWaiter(false)}
        onConfirm={confirmCallWaiter}
        title="Call Waiter"
        message={`Send notification to waiters for Table ${table?.table_number}?`}
        confirmText="Call Waiter"
        variant="success"
      />
    </div>
  );
};

export default TableDetailsModal;
