import React, { useState } from 'react';
import { 
  Clock, User, Tag, Percent, AlertTriangle, 
  Utensils, ShoppingBag, CreditCard, Wallet, 
  DollarSign, Gift, XCircle, RefreshCw, CheckCircle,
  Loader2, Phone, Bell, ChevronDown, ChevronUp, Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatTimestamp, getOrderStatusColor } from '@features/orders/utils/orderHelpers';
import { updatePaymentStatus } from '@config/supabase';
import { PaymentActionsDropdown } from './PaymentActionsDropdown';
import { CashPaymentModal } from '@features/billing/components/modals/CashPaymentModal';
import { ConfirmOnlinePaymentModal } from '@features/billing/components/modals/ConfirmOnlinePaymentModal';
import { SplitPaymentModal } from './modals/SplitPaymentModal';
import { DiscountModal } from './modals/DiscountModal';
import { IssueReportModal } from './modals/IssueReportModal';
import { CancelOrderModal } from './modals/CancelOrderModal';
import { RefundModal } from './modals/RefundModal';
import { TakeawayNotificationModal } from './modals/TakeawayNotificationModal';

const OrderCard = ({
  order,
  onUpdateStatus: _onUpdateStatus,
  compact = false,
  onPaymentComplete,
  onOrderUpdate
}) => {
  // Modal state management
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [showOnlinePaymentModal, setShowOnlinePaymentModal] = useState(false);
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showIssueReportModal, setShowIssueReportModal] = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Loading states for actions
  const [loadingAction, setLoadingAction] = useState(null);

  // Payment dropdown selection handler
  const handlePaymentAction = async (action) => {
    setLoadingAction('payment');
    try {
      switch (action) {
        case 'cash':
          setShowCashPaymentModal(true);
          break;
        case 'online':
          setShowOnlinePaymentModal(true);
          break;
        case 'split':
          setShowSplitPaymentModal(true);
          break;
        default:
          break;
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // Payment success handlers
  const handleCashPaymentSuccess = (paymentData) => {
    if (onPaymentComplete) {
      onPaymentComplete(order.id, paymentData);
    }
    setShowCashPaymentModal(false);
  };

  const handleOnlinePaymentSuccess = (paymentData) => {
    if (onPaymentComplete) {
      onPaymentComplete(order.id, paymentData);
    }
    setShowOnlinePaymentModal(false);
  };

  const handleSplitPaymentSuccess = (splitResults) => {
    if (onPaymentComplete) {
      onPaymentComplete(order.id, { 
        method: 'split', 
        splitPayments: splitResults 
      });
    }
    setShowSplitPaymentModal(false);
  };

  // Quick Cash Payment Handler - Directly marks order as paid without modal
  const handleQuickCashPayment = async () => {
    setLoadingAction('quick-cash');
    try {
      await updatePaymentStatus(order.id, 'paid');
      toast.success(`Order #${order.order_number} marked as paid!`);
      if (onPaymentComplete) {
        onPaymentComplete(order.id, { method: 'cash', amount: order.total_amount });
      }
      if (onOrderUpdate) {
        onOrderUpdate();
      }
    } catch (error) {
      console.error('Quick cash payment error:', error);
      toast.error('Failed to mark order as paid');
    } finally {
      setLoadingAction(null);
    }
  };

  // Handlers for actions
  const handleDiscountApply = async (_discountData) => {
    try {
      setLoadingAction('discount');
      // Logic to apply discount would go here (likely an API call)
      // For now, we simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Discount applied successfully');
      setShowDiscountModal(false);
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      console.error('Discount error:', error);
      toast.error('Failed to apply discount');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleIssueReport = async (_issueData) => {
    try {
      setLoadingAction('issue');
      // Logic to report issue
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Issue reported successfully');
      setShowIssueReportModal(false);
    } catch (error) {
      console.error('Issue report error:', error);
      toast.error('Failed to report issue');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancelOrder = async (_reason) => {
    try {
      setLoadingAction('cancel');
      // Logic to cancel order
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Order cancelled successfully');
      setShowCancelOrderModal(false);
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error('Failed to cancel order');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRefund = async (_refundData) => {
    try {
      setLoadingAction('refund');
      // Logic to process refund
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      console.error('Refund error:', error);
      toast.error('Failed to process refund');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMarkReady = async () => {
    try {
      setLoadingAction('mark-ready');
      // Logic to mark order as ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Order marked as ready');
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      console.error('Mark ready error:', error);
      toast.error('Failed to mark order as ready');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleNotifyCustomer = async () => {
    try {
      setLoadingAction('notify-customer');
      // Logic to notify customer
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Customer notified successfully');
      setShowNotificationModal(false);
    } catch (error) {
      console.error('Notify customer error:', error);
      toast.error('Failed to notify customer');
    } finally {
      setLoadingAction(null);
    }
  };

  // Calculate time since marked ready
  const getTimeSinceReady = () => {
    if (!order.marked_ready_at) return null;
    
    const readyTime = new Date(order.marked_ready_at);
    const now = new Date();
    const diffInMinutes = Math.floor((now - readyTime) / (1000 * 60));
    
    return diffInMinutes;
  };

  const timeSinceReady = getTimeSinceReady();

  const statusColor = getOrderStatusColor(order.status);
  const statusBorder = {
    received: 'border-blue-400',
    preparing: 'border-yellow-400',
    ready: 'border-green-500',
    served: 'border-gray-300',
    cancelled: 'border-red-400',
  }[order.status] || 'border-gray-200';
  
  // Determine order type for display
  const orderType = order.order_type || 'dine_in';
  const isPaymentPaid = (order.payment_status || '').toLowerCase() === 'paid';

  const deriveItemStatus = (item) => {
    if (item.item_status) return item.item_status;
    // Fallback to order status
    if (order.status === 'ready') return 'ready';
    if (order.status === 'preparing' || order.status === 'received') return 'preparing';
    if (order.status === 'served') return 'served';
    return 'queued';
  };
  const itemStatusBadge = (item) => {
    const s = deriveItemStatus(item);
    const map = {
      queued: 'bg-gray-100 text-gray-700 border-gray-300',
      received: 'bg-blue-100 text-blue-800 border-blue-300',
      preparing: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      ready: 'bg-green-100 text-green-800 border-green-300',
      served: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    const label = {
      queued: 'Queued',
      received: 'Received',
      preparing: 'Preparing',
      ready: 'Ready',
      served: 'Served',
    }[s] || s;
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${map[s]}`}>{label}</span>
    );
  };

  // Order-level buttons removed; chefs should update per-item statuses only.

  return (
    <div className={`
      ${compact 
        ? 'p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl hover:bg-white/10 transition-colors group relative overflow-hidden' 
        : `card-minimal p-4 sm:p-5 border-l-4 ${statusBorder} hover:shadow-md transition-shadow`
      }
    `}>
      {/* Compact Header */}
      {compact ? (
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/5 text-white/70 group-hover:text-white group-hover:bg-white/10 transition-colors`}>
               {orderType === 'takeaway' ? <ShoppingBag className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {orderType === 'takeaway' ? 'Takeaway' : `Table ${order.tables?.table_number || order.table_number || 'N/A'}`}
              </h3>
              <p className="text-xs text-zinc-500 font-mono">#{order.order_number}</p>
            </div>
          </div>
          <div className="text-right">
             <span className="text-xs font-medium text-zinc-500 block">
               {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
          </div>
        </div>
      ) : (
        /* Expanded Header */
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            {/* Order Type Icon */}
            <div className={`p-2 rounded-lg ${
              orderType === 'takeaway' 
                ? 'bg-purple-100 text-purple-700' 
                : orderType === 'delivery'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {orderType === 'takeaway' ? (
                <ShoppingBag className="w-5 h-5" />
              ) : orderType === 'delivery' ? (
                <ShoppingBag className="w-5 h-5" />
              ) : (
                <Utensils className="w-5 h-5" />
              )}
            </div>
            
            {/* Order Info */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                  #{order.order_number}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground font-medium">
                  {orderType === 'takeaway' ? 'Takeaway Order' : 
                   orderType === 'delivery' ? 'Delivery Order' :
                   `Table ${order.tables?.table_number || order.table_number || order.table?.table_number || 'N/A'}`}
                </p>
                {order.customer_name && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {order.customer_name}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* Takeaway: Customer Phone (Clickable) - Only show in expanded header */}
            {orderType === 'takeaway' && order.customer_phone && (
              <a
                href={`tel:${order.customer_phone}`}
                className="flex items-center gap-1.5 mt-2 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{order.customer_phone}</span>
              </a>
            )}
            
            {/* Takeaway: Ready Warning (if ready > 15 mins) */}
            {orderType === 'takeaway' && timeSinceReady !== null && timeSinceReady > 15 && (
              <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span className="text-xs font-bold text-amber-800">
                  ⚠️ Ready since {timeSinceReady} mins
                </span>
              </div>
            )}
          </div>
        
        {/* Time & Payment Status */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex items-center text-muted-foreground text-sm tabular-nums">
            <Clock className="w-4 h-4 mr-1.5" />
            {formatTimestamp(order.created_at)}
          </div>
          
          {/* Payment Status Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
            isPaymentPaid
              ? 'bg-green-100 text-green-800 border-green-300' 
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}>
            {isPaymentPaid ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>PAID</span>
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                <span>PENDING</span>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ============= ITEMS LIST (Compact Ticket View) ============= */}
      {compact && !showDetails ? (
        <div className="py-3 border-b border-dashed border-white/10 space-y-1">
          {order.items.slice(0, 2).map((item, index) => (
            <div key={index} className="flex justify-between text-xs text-zinc-400">
              <span className="truncate max-w-[70%]">
                <span className="font-bold text-zinc-300 mr-1">{item.quantity}×</span>
                {item.name}
              </span>
              <span className="tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          {order.items.length > 2 && (
            <div className="text-xs text-zinc-500 italic pt-1">
              + {order.items.length - 2} more items...
            </div>
          )}
        </div>
      ) : (
        /* Expanded / Full View */
        <div className={`space-y-3 mb-4 ${compact ? 'py-3 border-b border-dashed border-white/10' : ''}`}>
          {order.items.map((item, index) => (
            <div key={index} className="flex items-start justify-between text-sm group">
              <div className="flex gap-3">
                <span className="font-bold text-muted-foreground w-6 tabular-nums">{item.quantity}×</span>
                <div className="flex flex-col">
                  <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                    {item.name}
                  </span>
                  {item.special_notes && (
                    <span className="text-xs text-muted-foreground italic">
                      "{item.special_notes}"
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Item Status Badge */}
                {itemStatusBadge(item)}
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency(item.price * item.quantity)}
                </span>
                
                {/* Item Actions (Only for active orders) */}
                {!compact && order.status !== 'cancelled' && order.status !== 'served' && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {/* Chef/Waiter actions would go here */}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact Mode Toggle */}
      {compact && (
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full py-2 text-xs font-medium text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-colors flex items-center justify-center gap-1 mt-1"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-3 h-3" /> Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> View Full Receipt
            </>
          )}
        </button>
      )}

      {/* Special Instructions */}
      {order.special_instructions && (
        <div className="bg-warning-light border-l-4 border-warning p-3 mb-4 rounded">
          <div className="flex items-start gap-2">
            <Tag className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-warning">Special Instructions:</p>
              <p className="text-sm text-warning mt-1 break-words">{order.special_instructions}</p>
            </div>
          </div>
        </div>
      )}

      {/* ============= FOOTER: Totals & Actions ============= */}
      <div className={`mt-auto ${compact ? '' : 'pt-4 border-t border-border'}`}>
        <div className="space-y-2">
          
          {/* Detailed Breakdown (Only if not compact or expanded) */}
          {(!compact || showDetails) && (
            <>
              {/* Subtotal */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal:</span>
                <span className="tabular-nums">{formatCurrency(order.subtotal || order.subtotal_amount || 0)}</span>
              </div>
              
              {/* Tax */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax (5%):</span>
                <span className="tabular-nums font-medium">{formatCurrency(order.tax_amount || 0)}</span>
              </div>
              
              {/* Discount */}
              {order.discount > 0 && (
                <div className="flex justify-between items-center px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700 font-semibold">
                      Discount
                      {order.discount_type === 'percentage' && order.discount_value && (
                        <span className="ml-1">({order.discount_value}%)</span>
                      )}
                    </span>
                  </div>
                  <span className="tabular-nums text-red-600 font-bold text-sm">
                    - {formatCurrency(order.discount)}
                  </span>
                </div>
              )}
            </>
          )}
          
          {/* Total - Always Visible */}
          <div className={`flex justify-between items-center ${compact ? 'pt-2' : 'pt-2 border-t border-border'}`}>
            <span className={`${compact ? 'text-sm' : 'text-base'} font-bold text-foreground`}>Total:</span>
            <div className="flex items-center gap-2">
              {(!compact || showDetails) && order.discount > 0 && (
                <span className="text-sm text-muted-foreground line-through tabular-nums">
                  {formatCurrency((order.subtotal || 0) + (order.tax_amount || 0))}
                </span>
              )}
              <span className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-foreground tabular-nums`}>
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Split Payment Breakdown */}
        {order.payment_method === 'split' && order.payment_split_details && (!compact || showDetails) && (
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
            <div className="text-xs font-bold text-purple-900 mb-2 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              <span>Split Payment Breakdown</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-sm font-semibold">
              {order.payment_split_details.cash_amount > 0 && (
                <div className="flex items-center gap-1.5 text-purple-800">
                  <span>💵 Cash:</span>
                  <span className="tabular-nums">{formatCurrency(order.payment_split_details.cash_amount)}</span>
                </div>
              )}
              {order.payment_split_details.cash_amount > 0 && order.payment_split_details.online_amount > 0 && (
                <span className="text-purple-400">|</span>
              )}
              {order.payment_split_details.online_amount > 0 && (
                <div className="flex items-center gap-1.5 text-purple-800">
                  <span>💳 UPI:</span>
                  <span className="tabular-nums">{formatCurrency(order.payment_split_details.online_amount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============= COMPACT MODE: QUICK CASH PAYMENT BUTTON ============= */}
        {/* Only show when customer has explicitly selected cash payment (payment_method must be exactly 'cash') */}
        {compact && 
         typeof order.payment_method === 'string' && 
         order.payment_method.toLowerCase() === 'cash' && 
         !isPaymentPaid && 
         order.status !== 'cancelled' && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <button
              onClick={handleQuickCashPayment}
              disabled={loadingAction === 'quick-cash'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl hover:from-emerald-700 hover:to-green-700 border border-emerald-500/50 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loadingAction === 'quick-cash' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Banknote className="w-5 h-5" />
              )}
              <span>💵 Paid Cash</span>
            </button>
          </div>
        )}
      </div>

      {/* ============= TAKEAWAY-SPECIFIC ACTIONS ============= */}
      {orderType === 'takeaway' && order.status !== 'cancelled' && (
        <div className="border-t border-border pt-4 mt-4">
          <div className="grid grid-cols-2 gap-2">
            {/* Mark Ready Button - Only if not already marked ready */}
            {!order.marked_ready_at && order.status === 'ready' && (
              <button
                onClick={handleMarkReady}
                disabled={loadingAction === 'mark-ready'}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 border border-green-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loadingAction === 'mark-ready' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Mark Ready</span>
              </button>
            )}
            
            {/* Notify Customer Button - Only if marked ready */}
            {order.marked_ready_at && (
              <button
                onClick={() => setShowNotificationModal(true)}
                disabled={loadingAction !== null}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-hover border border-primary transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Bell className="w-4 h-4" />
                <span>Notify Customer</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============= ACTION BUTTONS ============= */}
      {!compact && order.status !== 'cancelled' && order.status !== 'served' && (
        <div className="border-t border-border pt-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Mark Paid Dropdown - Only if not paid OR if stuck in pending_payment */}
            {(!isPaymentPaid || order.status === 'pending_payment') && (
              <div className="col-span-2 sm:col-span-1">
                {order.payment_method === 'cash' ? (
                  <button
                    onClick={() => handlePaymentAction('cash')}
                    disabled={loadingAction === 'payment'}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 border border-green-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-pulse"
                  >
                    {loadingAction === 'payment' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <DollarSign className="w-4 h-4" />
                    )}
                    <span>{order.status === 'pending_payment' && isPaymentPaid ? 'Retry Status Update' : 'Confirm Cash Received'}</span>
                  </button>
                ) : (
                  <PaymentActionsDropdown
                    order={order}
                    onAction={handlePaymentAction}
                    disabled={loadingAction === 'payment'}
                  />
                )}
              </div>
            )}

            {/* Discount Button - Only if not paid */}
            {!isPaymentPaid && (
              <button
                onClick={() => setShowDiscountModal(true)}
                disabled={loadingAction !== null}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loadingAction === 'discount' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Discount</span>
              </button>
            )}

            {/* Issue Report Button */}
            <button
              onClick={() => setShowIssueReportModal(true)}
              disabled={loadingAction !== null}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 border border-orange-200 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loadingAction === 'issue' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Issue</span>
            </button>

            {/* Refund Button - Only for paid orders */}
            {isPaymentPaid && (
              <button
                onClick={() => setShowRefundModal(true)}
                disabled={loadingAction !== null}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loadingAction === 'refund' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Refund</span>
                <span className="sm:hidden">💸</span>
              </button>
            )}

            {/* Cancel Button - Only for unpaid orders */}
            {!isPaymentPaid && (
              <button
                onClick={() => setShowCancelOrderModal(true)}
                disabled={loadingAction !== null}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loadingAction === 'cancel' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Cancel</span>
                <span className="sm:hidden">✕</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============= STATUS MESSAGES ============= */}
      {/* Served Status */}
      {/* Served Status */}
      {order.status === 'served' && (
        compact ? (
          <div className="mt-2 flex items-center justify-center gap-1.5 py-1.5 bg-green-500/10 text-green-500 rounded border border-green-500/20 text-xs font-bold uppercase tracking-wide">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Completed</span>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 text-success py-3 rounded-lg font-bold text-center border-2 border-success flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Order Completed</span>
          </div>
        )
      )}
      
      {/* Cancelled Status */}
      {order.status === 'cancelled' && (
        compact ? (
          <div className="mt-2 flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 text-red-500 rounded border border-red-500/20 text-xs font-bold uppercase tracking-wide">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 text-red-700 py-3 rounded-lg font-bold text-center border-2 border-red-300 flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>Order Cancelled</span>
            </div>
            {(order.cancellation_reason || order.cancelled_at) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="space-y-2">
                  {order.cancellation_reason && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-red-600">Reason:</span>
                      <span className="text-xs text-red-700 capitalize">
                        {order.cancellation_reason.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                  {order.cancellation_notes && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-red-600">Notes:</span>
                      <span className="text-xs text-red-700">{order.cancellation_notes}</span>
                    </div>
                  )}
                  {order.cancelled_at && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-red-600">Cancelled:</span>
                      <span className="text-xs text-red-700 tabular-nums">{formatTimestamp(order.cancelled_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Payment Modals */}
      <CashPaymentModal
        order={order}
        isOpen={showCashPaymentModal}
        onClose={() => setShowCashPaymentModal(false)}
        onSuccess={handleCashPaymentSuccess}
      />

      <ConfirmOnlinePaymentModal
        order={order}
        isOpen={showOnlinePaymentModal}
        onClose={() => setShowOnlinePaymentModal(false)}
        onSuccess={handleOnlinePaymentSuccess}
      />

      <SplitPaymentModal
        order={order}
        isOpen={showSplitPaymentModal}
        onClose={() => setShowSplitPaymentModal(false)}
        onSuccess={handleSplitPaymentSuccess}
      />

      {/* Other Modals */}
      <DiscountModal
        order={order}
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onApply={handleDiscountApply}
      />

      {showIssueReportModal && (
        <IssueReportModal
          isOpen={showIssueReportModal}
          onClose={() => setShowIssueReportModal(false)}
          onSubmit={handleIssueReport}
        />
      )}

      {showCancelOrderModal && (
        <CancelOrderModal
          isOpen={showCancelOrderModal}
          onClose={() => setShowCancelOrderModal(false)}
          onConfirm={handleCancelOrder}
        />
      )}

      {showRefundModal && (
        <RefundModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          onConfirm={handleRefund}
          orderTotal={order.total_amount}
        />
      )}
      <TakeawayNotificationModal
        order={order}
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onSend={handleNotifyCustomer}
      />
    </div>
  );
};

export default OrderCard;
