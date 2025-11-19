import React from 'react';
import { Clock, User, Tag } from 'lucide-react';
import { formatCurrency, formatTimestamp, getOrderStatusColor } from '@domains/ordering/utils/orderHelpers';

const OrderCard = ({ order, onUpdateItemStatus, onCancelOrder }) => {
  const statusColor = getOrderStatusColor(order.status);
  const statusBorder = {
    received: 'border-blue-400',
    preparing: 'border-yellow-400',
    ready: 'border-green-500',
    served: 'border-gray-300',
    cancelled: 'border-red-400',
  }[order.status] || 'border-gray-200';
  const deriveItemStatus = (item) => {
    if (item.item_status) return item.item_status;
    // Fallback to order status
    if (order.status === 'ready') return 'ready';
    if (order.status === 'preparing' || order.status === 'received') return 'preparing';
    if (order.status === 'served') return 'served';
    return 'queued';
  };
  const getNextItemStatus = (item) => {
    const s = deriveItemStatus(item);
    if (s === 'queued' || s === 'received') return 'preparing';
    if (s === 'preparing') return 'ready';
    return null; // chef doesn't mark served
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

  // Aggregate item status counts for quick glance chips
  const counts = (order.items || []).reduce((acc, it) => {
    const s = deriveItemStatus(it);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`card-minimal p-3 sm:p-4 border-l-4 ${statusBorder}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">#{order.order_number}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Table {order.tables?.table_number || order.table_number || order.table?.table_number || 'N/A'}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 sm:gap-2">
          <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${statusColor}`}>
            {order.status.toUpperCase()}
          </span>
          {/* Payment status badge */}
          <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border ${
            (order.payment_status || '').toLowerCase() === 'paid' 
              ? 'bg-green-100 text-green-800 border-green-300' 
              : 'bg-yellow-100 text-yellow-800 border-yellow-300'
          }`}>
            {(order.payment_status || 'pending').toUpperCase()}
          </span>
          <div className="flex items-center text-muted-foreground text-xs sm:text-sm tabular-nums">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            {formatTimestamp(order.created_at)}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-2.5 sm:space-y-3 mb-3 sm:mb-4">
        {order.items.map((item, index) => {
          const nextItemStatus = getNextItemStatus(item);
          return (
            <div key={index} className="flex justify-between items-start bg-muted p-2.5 sm:p-3 rounded-lg border border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground tabular-nums text-sm">{item.quantity}x</span>
                  <span className="text-foreground text-sm">{item.name}</span>
                  <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-success' : 'bg-red-500'}`} />
                  {itemStatusBadge(item)}
                </div>
                {(item.notes || item.special_notes) && (
                  <div className="flex items-start gap-1 mt-2 bg-warning-light border-l-2 border-warning pl-2 py-1 rounded">
                    <Tag className="w-4 h-4 mt-0.5 flex-shrink-0 text-warning" />
                    <span className="text-xs sm:text-sm text-warning font-medium">
                      Note: {item.notes || item.special_notes}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                <span className="font-semibold text-foreground tabular-nums text-sm">
                  {formatCurrency(item.price * item.quantity)}
                </span>
                {order.status !== 'cancelled' && nextItemStatus && onUpdateItemStatus && (
                  <button
                    onClick={() => onUpdateItemStatus(order.id, item.menu_item_id, nextItemStatus)}
                    className={`text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg font-medium transition-opacity ${
                      nextItemStatus === 'preparing'
                        ? 'bg-info text-background hover:opacity-90'
                        : 'bg-success text-background hover:opacity-90'
                    }`}
                  >
                    {nextItemStatus === 'preparing' ? 'Start' : 'Mark Ready'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Name (if provided) */}
      {order.customer_name && (
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <User className="w-4 h-4" />
          <span className="text-sm">Customer: {order.customer_name}</span>
        </div>
      )}

      {/* Special Instructions (Order-level notes) */}
      {order.special_instructions && (
        <div className="bg-warning-light border-l-4 border-warning p-3 mb-4 rounded">
          <div className="flex items-start gap-2">
            <Tag className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-warning">Special Instructions:</p>
              <p className="text-sm text-warning mt-1">{order.special_instructions}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick glance item counts */}
      <div className="flex flex-wrap gap-2 mb-3">
        {counts.preparing ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-yellow-100 text-yellow-800 border-yellow-300">{counts.preparing} preparing</span>
        ) : null}
        {counts.ready ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-green-100 text-green-800 border-green-300">{counts.ready} ready</span>
        ) : null}
        {counts.served ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-purple-100 text-purple-800 border-purple-300">{counts.served} served</span>
        ) : null}
      </div>

      {/* Total */}
      <div className="border-t border-border pt-3 sm:pt-4 mb-3 sm:mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Subtotal:</span>
          <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Tax (5%):</span>
          <span className="tabular-nums">{formatCurrency(order.tax_amount)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold text-foreground">
          <span>Total:</span>
          <span className="tabular-nums">{formatCurrency(order.total_amount)}</span>
        </div>
      </div>

      {/* Order-level actions */}
      {(order.status !== 'cancelled' && order.status !== 'served') && (order.payment_status || '').toLowerCase() !== 'paid' && onCancelOrder && (
        <div className="mb-2 sm:mb-3">
          <button
            onClick={onCancelOrder}
            className="w-full sm:w-auto text-sm px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Cancel Order
          </button>
        </div>
      )}

      {/* Served Status */}
      {order.status === 'served' && (
        <div className="w-full bg-success-light text-success py-3 rounded-lg font-semibold text-center border border-success">
          Order Completed ✓
        </div>
      )}
      {order.status === 'cancelled' && (
        <div className="w-full bg-red-100 text-red-700 py-3 rounded-lg font-semibold text-center border border-red-300">
          Order Cancelled ✕
        </div>
      )}
    </div>
  );
};

export default OrderCard;
