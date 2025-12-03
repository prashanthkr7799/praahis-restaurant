import React from 'react';
import { Users, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatters';

/**
 * TableCard Component
 * Displays a table's current status with visual indicators
 *
 * Status Colors:
 * - Green (emerald): Available/Free table
 * - Red (rose): Occupied table
 * - Yellow (amber): Ready to clear (orders completed but not paid/cleared)
 *
 * Props:
 * @param {Object} table - Table object with status, number, capacity, etc.
 * @param {Function} onClick - Handler when card is clicked
 */
const TableCard = ({ table, onClick }) => {
  // Determine table status and styling
  const isOccupied = table.status === 'occupied';
  const isReserved = table.status === 'reserved';
  const isCleaning = table.status === 'cleaning';

  // Ready to clear: occupied table with completed orders but pending payment
  const isReadyToClear = isOccupied && table.hasCompletedOrders && table.hasPendingPayments;

  // Determine color scheme based on status
  let statusColor = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'; // Available (green)
  let statusIcon = '✓';
  let statusLabel = 'Available';

  if (isReadyToClear) {
    // Ready to clear (yellow/amber)
    statusColor = 'bg-amber-500/20 border-amber-500/30 text-amber-400';
    statusIcon = '⚠';
    statusLabel = 'Ready to Clear';
  } else if (isOccupied) {
    // Occupied (red)
    statusColor = 'bg-rose-500/20 border-rose-500/30 text-rose-400';
    statusIcon = '●';
    statusLabel = 'Occupied';
  } else if (isReserved) {
    // Reserved (amber)
    statusColor = 'bg-amber-500/20 border-amber-500/30 text-amber-400';
    statusIcon = '◉';
    statusLabel = 'Reserved';
  } else if (isCleaning) {
    // Cleaning (blue)
    statusColor = 'bg-blue-500/20 border-blue-500/30 text-blue-400';
    statusIcon = '◐';
    statusLabel = 'Cleaning';
  }

  // Calculate time occupied (in minutes)
  const timeOccupied = table.booked_at
    ? Math.round((Date.now() - new Date(table.booked_at).getTime()) / 60000)
    : 0;

  return (
    <button
      data-testid="table-card"
      onClick={() => onClick(table)}
      className={`glass-panel rounded-2xl p-4 border transition-all hover:scale-105 active:scale-95 ${statusColor} text-left w-full min-h-[44px]`}
      aria-label={`Table ${table.table_number}, ${statusLabel}`}
    >
      {/* Header: Label and Status Icon */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wide opacity-70">Table</span>
        <span className="text-lg" aria-hidden="true">
          {statusIcon}
        </span>
      </div>

      {/* Table Number */}
      <div className="text-3xl font-bold mb-2 font-mono-nums">{table.table_number}</div>

      {/* Status Label */}
      <div className="text-xs opacity-80 capitalize mb-3">{statusLabel}</div>

      {/* Order Count & Time - Only show when occupied */}
      {isOccupied && (
        <div className="space-y-2 mb-3 pt-2 border-t border-current/20">
          {/* Order Count */}
          {table.orderCount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle className="h-3 w-3" />
              <span className="opacity-80">
                {table.orderCount} {table.orderCount === 1 ? 'order' : 'orders'}
              </span>
            </div>
          )}

          {/* Time Occupied */}
          {timeOccupied > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3" />
              <span className="opacity-80">
                {timeOccupied < 60
                  ? `${timeOccupied} min`
                  : `${Math.floor(timeOccupied / 60)}h ${timeOccupied % 60}m`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Total Bill - Show when occupied and bill exists */}
      {isOccupied && table.totalBill > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-current/20">
          <div className="flex items-center gap-1 text-xs opacity-70">
            <DollarSign className="h-3 w-3" />
            <span>Bill</span>
          </div>
          <div className="text-sm font-bold">{formatCurrency(table.totalBill)}</div>
        </div>
      )}

      {/* Bill Pending Indicator */}
      {isOccupied && table.hasPendingPayments && (
        <div className="mt-2 px-2 py-1 bg-current/10 rounded-lg flex items-center gap-1.5 text-[10px] font-semibold">
          <AlertCircle className="h-3 w-3" />
          <span>Payment Pending</span>
        </div>
      )}

      {/* Capacity - Always show */}
      {table.capacity && (
        <div className="flex items-center gap-1 text-xs opacity-60 mt-2">
          <Users className="h-3 w-3" />
          <span>Seats {table.capacity}</span>
        </div>
      )}
    </button>
  );
};

export default TableCard;
