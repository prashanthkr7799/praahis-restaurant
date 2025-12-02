import React from 'react';
import { Users, AlertCircle, CheckCircle, Clock } from 'lucide-react';

/**
 * TableGridView Component
 * Visual floor plan of restaurant tables with status indicators
 */
const TableGridView = ({ tables, onTableClick }) => {
  const getStatusColor = (table) => {
    if (!table.is_occupied) return 'bg-green-100 border-green-400 text-green-800';
    if (table.needs_attention) return 'bg-red-100 border-red-400 text-red-800';
    return 'bg-yellow-100 border-yellow-400 text-yellow-800';
  };

  const getStatusIcon = (table) => {
    if (!table.is_occupied) return <CheckCircle className="w-5 h-5" />;
    if (table.needs_attention) return <AlertCircle className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  const getStatusText = (table) => {
    if (!table.is_occupied) return 'Available';
    if (table.needs_attention) return 'Needs Help';
    return 'Occupied';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {tables?.map((table) => (
        <button
          key={table.id}
          onClick={() => onTableClick(table)}
          className={`
            ${getStatusColor(table)}
            border-2 rounded-lg p-6 
            transition-all duration-200 
            hover:shadow-lg hover:scale-105 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            flex flex-col items-center justify-center gap-3
            min-h-[160px]
          `}
        >
          {/* Table Icon */}
          <div className="text-2xl">
            <Users className="w-8 h-8" />
          </div>

          {/* Table Number */}
          <div className="text-2xl font-bold">
            Table {table.table_number}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            {getStatusIcon(table)}
            <span className="font-medium">{getStatusText(table)}</span>
          </div>

          {/* Order Info */}
          {table.current_order && (
            <div className="text-xs mt-1 px-2 py-1 bg-white/50 rounded">
              Order #{table.current_order.id.slice(0, 8)}
            </div>
          )}

          {/* Seating Capacity */}
          <div className="text-xs opacity-75">
            Seats: {table.seating_capacity || 4}
          </div>
        </button>
      ))}
    </div>
  );
};

export default TableGridView;
