import React from 'react';
import { Users, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatters';

/**
 * TableListItem Component
 * Displays table information in a list/row format
 * 
 * Props:
 * @param {Object} table - Table object with status, number, capacity, etc.
 * @param {Function} onClick - Handler when row is clicked
 */
const TableListItem = ({ table, onClick }) => {
  const isOccupied = table.status === 'occupied';
  const isReserved = table.status === 'reserved';
  const isCleaning = table.status === 'cleaning';
  
  // Ready to clear: occupied table with completed orders but pending payment
  const isReadyToClear = isOccupied && table.hasCompletedOrders && table.hasPendingPayments;

  // Determine color scheme based on status
  let statusColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  let statusDot = 'bg-emerald-500';
  let statusLabel = 'Available';

  if (isReadyToClear) {
    statusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    statusDot = 'bg-amber-500';
    statusLabel = 'Ready to Clear';
  } else if (isOccupied) {
    statusColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    statusDot = 'bg-rose-500';
    statusLabel = 'Occupied';
  } else if (isReserved) {
    statusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    statusDot = 'bg-amber-500';
    statusLabel = 'Reserved';
  } else if (isCleaning) {
    statusColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    statusDot = 'bg-blue-500';
    statusLabel = 'Cleaning';
  }

  // Calculate time occupied (in minutes)
  const timeOccupied = table.booked_at 
    ? Math.round((Date.now() - new Date(table.booked_at).getTime()) / 60000)
    : 0;

  return (
    <button
      onClick={() => onClick(table)}
      className="glass-panel rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-all flex items-center gap-4 w-full text-left group"
      aria-label={`Table ${table.table_number}, ${statusLabel}`}
    >
      {/* Table Number */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${statusColor} flex items-center justify-center font-bold text-xl font-mono-nums`}>
          {table.table_number}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${statusDot} animate-pulse`}></div>
          <span className="text-sm font-semibold text-white capitalize">
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {table.capacity || 4} seats
          </span>
          {isOccupied && timeOccupied > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeOccupied < 60 
                ? `${timeOccupied} min` 
                : `${Math.floor(timeOccupied / 60)}h ${timeOccupied % 60}m`
              }
            </span>
          )}
        </div>
      </div>

      {/* Order Info - Only when occupied */}
      {isOccupied && (
        <div className="flex items-center gap-4">
          {/* Order Count */}
          {table.orderCount > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold text-white font-mono-nums">
                {table.orderCount}
              </div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
                Orders
              </div>
            </div>
          )}

          {/* Total Bill */}
          {table.totalBill > 0 && (
            <div className="text-right min-w-[80px]">
              <div className="text-base font-bold text-white font-mono-nums">
                {formatCurrency(table.totalBill)}
              </div>
              {table.hasPendingPayments && (
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold mt-0.5">
                  <AlertCircle className="h-3 w-3" />
                  Pending
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Arrow indicator */}
      <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
        <AlertCircle className="h-4 w-4 rotate-90" />
      </div>
    </button>
  );
};

export default TableListItem;
