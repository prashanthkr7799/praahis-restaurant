/**
 * KitchenTicketCard - Order ticket card for kitchen display
 */
import React from 'react';
import {
  Clock,
  ChefHat,
  CheckCircle,
  Timer,
  ShoppingBag,
  Utensils,
  ArrowRight,
  Flame,
} from 'lucide-react';

export function KitchenTicketCard({
  order,
  onUpdateStatus,
  getElapsedTime,
  getTimerColor,
  getTimerBg,
}) {
  const elapsed = getElapsedTime(order.created_at);
  const isUrgent = elapsed > 15;
  const isTakeaway = order.order_type === 'takeaway';

  const variantStyles = {
    received: {
      accent: 'bg-amber-500',
      border: isUrgent
        ? 'border-red-500/50 shadow-lg shadow-red-500/10'
        : 'border-amber-500/30 hover:border-amber-500/50',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      badgeText: 'New',
    },
    preparing: {
      accent: 'bg-blue-500',
      border: 'border-blue-500/30 hover:border-blue-500/50',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      badgeText: 'Cooking',
    },
    ready: {
      accent: 'bg-emerald-500',
      border: 'border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-500/10',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      badgeText: 'Ready',
    },
  };

  const style = variantStyles[order.order_status] || variantStyles.received;

  return (
    <div
      className={`bg-slate-900 rounded-xl border ${style.border} overflow-hidden transition-all duration-200`}
    >
      {/* Top Accent Bar */}
      <div className={`h-1.5 ${style.accent}`} />

      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold text-white">#{order.order_number}</span>
              {isTakeaway && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/30 flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  Takeaway
                </span>
              )}
            </div>
            {!isTakeaway && order.tables?.table_number && (
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <Utensils className="w-3.5 h-3.5" />
                Table {order.tables.table_number}
              </div>
            )}
          </div>

          {/* Timer */}
          <div className={`px-3 py-1.5 rounded-lg border ${getTimerBg(elapsed)}`}>
            <div className={`flex items-center gap-1.5 ${getTimerColor(elapsed)}`}>
              <Timer className="w-4 h-4" />
              <span className="font-bold text-sm">{elapsed}m</span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2 mb-4">
          {(order.items || []).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                  {item.quantity}
                </span>
                <span className="text-white font-medium text-sm">{item.name}</span>
              </div>
              {item.special_instructions && (
                <span className="text-xs text-amber-400 italic max-w-[120px] truncate">
                  {item.special_instructions}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Special Notes */}
        {order.notes && (
          <div className="mb-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400">📝 {order.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {order.order_status === 'received' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors"
            >
              <ChefHat className="w-4 h-4" />
              Start Cooking
            </button>
          )}

          {order.order_status === 'preparing' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'ready')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Ready
            </button>
          )}

          {order.order_status === 'ready' && (
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-500/20 text-emerald-400 font-medium text-sm border border-emerald-500/30">
              <CheckCircle className="w-4 h-4" />
              Waiting for Pickup
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KitchenTicketCard;
