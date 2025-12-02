import React from 'react';
import { Clock, CheckCircle, Utensils, ShoppingBag, Bell, Timer, Flame, ChefHat, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { formatTimestamp } from '@features/orders/utils/orderHelpers';

const WaiterOrderCard = ({ 
  order, 
  onMarkServed,
  variant = 'default' // 'kitchen' | 'ready' | 'served' | 'default'
}) => {
  const isTakeaway = order.order_type === 'takeaway';
  const isDelivery = order.order_type === 'delivery';
  
  // Calculate time elapsed since order was created or marked ready
  const getElapsedMinutes = () => {
    const referenceTime = order.status === 'ready' 
      ? (order.marked_ready_at || order.updated_at)
      : order.created_at;
    const start = new Date(referenceTime);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60));
  };

  const elapsedMinutes = getElapsedMinutes();
  const isUrgent = order.status === 'ready' && elapsedMinutes > 5;

  // Variant-based styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'kitchen':
        return {
          wrapper: 'bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/50',
          accent: 'bg-amber-500',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          badgeText: order.status === 'preparing' ? 'Cooking' : 'New',
          icon: order.status === 'preparing' ? <Flame className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />
        };
      case 'ready':
        return {
          wrapper: isUrgent 
            ? 'bg-slate-900/80 border-2 border-red-500/50 shadow-lg shadow-red-500/10'
            : 'bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-500/5',
          accent: isUrgent ? 'bg-red-500' : 'bg-emerald-500',
          badge: isUrgent 
            ? 'bg-red-500/10 text-red-400 border-red-500/30' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          badgeText: isUrgent ? 'Waiting!' : 'Ready',
          icon: isUrgent ? <Bell className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />
        };
      case 'served':
        return {
          wrapper: 'bg-slate-900/50 border border-slate-800 opacity-70 hover:opacity-100',
          accent: 'bg-blue-500',
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          badgeText: 'Served',
          icon: <CheckCircle className="w-3.5 h-3.5" />
        };
      default:
        return {
          wrapper: 'bg-slate-900/80 border border-slate-800',
          accent: 'bg-slate-500',
          badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          badgeText: order.status,
          icon: <Clock className="w-3.5 h-3.5" />
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${styles.wrapper}`}>
      {/* Top Accent Bar */}
      <div className={`h-1.5 ${styles.accent}`} />
      
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          {/* Order Number & Type */}
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">#{order.order_number}</h3>
            {isTakeaway ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                <ShoppingBag className="w-3.5 h-3.5" />
                Takeaway
              </span>
            ) : isDelivery ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <ShoppingBag className="w-3.5 h-3.5" />
                Delivery
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                <Utensils className="w-3.5 h-3.5" />
                Table {order.table_number || '—'}
              </span>
            )}
          </div>
          
          {/* Timer */}
          {(variant === 'ready' || variant === 'kitchen') && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              isUrgent ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800 border-slate-700'
            }`}>
              <Timer className={`w-4 h-4 ${isUrgent ? 'text-red-400' : 'text-slate-400'}`} />
              <span className={`font-mono font-bold text-sm ${isUrgent ? 'text-red-400' : 'text-slate-300'}`}>{elapsedMinutes}m</span>
            </div>
          )}
        </div>

        {/* Status Badge & Time */}
        <div className="mt-3 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${styles.badge}`}>
            {styles.icon}
            {styles.badgeText}
          </span>
          <p className="text-xs text-slate-500 font-medium">
            {formatTimestamp(order.created_at)}
          </p>
        </div>
      </div>

      {/* Items List */}
      <div className="px-4 pb-3">
        <div className="space-y-2">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 py-1.5 group">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-bold flex items-center justify-center">
                  {item.quantity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-100 font-medium leading-snug group-hover:text-white transition-colors">
                    {item.name}
                  </p>
                  {(item.special_instructions || item.notes) && (
                    <p className="text-xs text-amber-400/80 mt-0.5 flex items-center gap-1">
                      <span>📝</span> {item.special_instructions || item.notes}
                    </p>
                  )}
                </div>
                <span className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                  item.is_veg ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                }`} />
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic py-2">No items found</p>
          )}
        </div>
      </div>

      {/* Special Instructions */}
      {order.special_instructions && (
        <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80 leading-relaxed">{order.special_instructions}</p>
          </div>
        </div>
      )}

      {/* Action Button for Ready Orders */}
      {variant === 'ready' && onMarkServed && (
        <div className="p-4 pt-2">
          <button
            onClick={() => onMarkServed(order)}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              isUrgent 
                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/25'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/25'
            } active:scale-[0.98]`}
          >
            <CheckCircle className="w-4 h-4" />
            Mark as Served
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status Footer for Non-Ready Orders */}
      {variant === 'kitchen' && (
        <div className="px-4 py-3 bg-amber-500/5 border-t border-amber-500/10">
          <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-medium">
            <ChefHat className="w-4 h-4" />
            <span>Being prepared in kitchen</span>
          </div>
        </div>
      )}

      {variant === 'served' && (
        <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700/50">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Delivered to customer</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterOrderCard;
