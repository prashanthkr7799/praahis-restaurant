import React from 'react';
import { Clock, AlertTriangle, CheckCircle, Utensils, ShoppingBag, Flame } from 'lucide-react';
import { formatTimestamp } from '@domains/ordering/utils/orderHelpers';

const ChefOrderCard = ({ 
  order, 
  onAccept, 
  onMarkReady
}) => {
  const isTakeaway = order.order_type === 'takeaway';
  const isDelivery = order.order_type === 'delivery';
  
  // Calculate time elapsed
  const getElapsedMinutes = (startTime) => {
    if (!startTime) return 0;
    const start = new Date(startTime);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60));
  };

  const waitingTime = getElapsedMinutes(order.created_at);
  const preparingTime = getElapsedMinutes(order.created_at); // Use created_at since started_at doesn't exist at order level
  const readyTime = getElapsedMinutes(order.updated_at); // Use updated_at since marked_ready_at may not exist

  // Determine card style based on status
  const getStatusStyle = () => {
    switch (order.status) {
      case 'received':
        return {
          border: 'border-l-4 border-l-red-500',
          bg: 'bg-card',
          headerBg: 'bg-red-50',
          headerText: 'text-red-700',
          timerColor: waitingTime > 10 ? 'text-red-600 font-bold' : 'text-muted-foreground'
        };
      case 'preparing':
        return {
          border: 'border-l-4 border-l-yellow-500',
          bg: 'bg-card',
          headerBg: 'bg-yellow-50',
          headerText: 'text-yellow-700',
          timerColor: preparingTime > 20 ? 'text-red-600 font-bold' : 'text-yellow-600'
        };
      case 'ready':
        return {
          border: 'border-l-4 border-l-green-500',
          bg: 'bg-card',
          headerBg: 'bg-green-50',
          headerText: 'text-green-700',
          timerColor: 'text-green-600'
        };
      default:
        return {
          border: 'border-l-4 border-l-gray-300',
          bg: 'bg-card',
          headerBg: 'bg-gray-50',
          headerText: 'text-gray-700',
          timerColor: 'text-gray-500'
        };
    }
  };

  const styles = getStatusStyle();
  const isDelayed = (order.status === 'preparing' && preparingTime > 20) || (order.status === 'received' && waitingTime > 10);

  return (
    <div className={`rounded-lg shadow-sm border border-border overflow-hidden ${styles.border} ${styles.bg} transition-all hover:shadow-md`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b border-border/50 flex justify-between items-start ${styles.headerBg}`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">#{order.order_number}</h3>
            {isDelayed && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
            {order.is_priority && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold uppercase rounded flex items-center gap-1">
                <Flame className="w-3 h-3" /> Rush
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 mt-1">
            {isTakeaway || isDelivery ? (
              <>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isTakeaway ? 'text-purple-700 bg-purple-100' : 'text-blue-700 bg-blue-100'}`}>
                    <ShoppingBag className="w-3 h-3" /> {isTakeaway ? 'TAKEAWAY' : 'DELIVERY'}
                  </span>
                  {order.customer_name && (
                    <span className="text-sm font-medium text-foreground">• {order.customer_name}</span>
                  )}
                </div>
                {order.customer_phone && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 ml-1">
                    📞 {order.customer_phone}
                  </div>
                )}
              </>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-full w-fit">
                <Utensils className="w-3 h-3" /> Table {order.table_number || 'N/A'}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`flex flex-col items-end gap-0.5 text-xs ${styles.timerColor}`}>
            <div className="flex items-center gap-1 font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono text-sm">
                {order.status === 'received' && `Waiting: ${waitingTime}m`}
                {order.status === 'preparing' && `Preparing: ${preparingTime}m`}
                {order.status === 'ready' && `Ready: ${readyTime}m`}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {formatTimestamp(order.created_at)}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-4 space-y-3">
        {order.items && order.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 text-sm">
            <div className="font-bold text-foreground min-w-[24px]">{item.quantity}×</div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <span className="text-foreground font-medium">{item.name}</span>
                <span className={`w-2 h-2 rounded-full mt-1.5 ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`} title={item.is_veg ? 'Veg' : 'Non-veg'} />
              </div>
              {(item.notes || item.special_notes) && (
                <div className="mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block">
                  Note: {item.notes || item.special_notes}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Special Instructions */}
        {order.special_instructions && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-amber-800">
              <span className="font-bold block mb-0.5">Kitchen Note:</span>
              {order.special_instructions}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 bg-muted/30 border-t border-border">
        {order.status === 'received' && (
          <button
            onClick={() => onAccept(order)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Utensils className="w-4 h-4" />
            Accept & Start
          </button>
        )}
        {order.status === 'preparing' && (
          <button
            onClick={() => onMarkReady(order)}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Mark Ready
          </button>
        )}
        {order.status === 'ready' && (
          <div className="w-full py-2 text-center text-sm font-medium text-green-600 bg-green-50 rounded-lg border border-green-100">
            Waiting for Waiter
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefOrderCard;
