import React from 'react';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import { exportPaymentsToCSV } from '../utils/billingUtils';

/**
 * BILLING ACTIONS BAR COMPONENT
 * Top action bar with:
 * - Search bar
 * - Filters button
 * - Export CSV button
 * - Refresh button
 */

const BillingActionsBar = ({
  searchQuery,
  onSearchChange,
  onOpenFilters,
  onRefresh,
  payments,
  isRefreshing,
}) => {
  const handleExport = () => {
    if (!payments || payments.length === 0) {
      alert('No payments to export');
      return;
    }
    exportPaymentsToCSV(payments, 'billing-transactions');
  };

  return (
    <div className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 mb-6">
      <div className="flex flex-col sm:flex-row gap-3 py-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number, payment ID, table..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              w-full pl-11 pr-4 py-2.5
              bg-gray-800/50 border border-gray-700/50
              rounded-lg
              text-white placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
              transition-all
            "
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Filters Button */}
          <button
            onClick={onOpenFilters}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-gray-800/50 border border-gray-700/50
              rounded-lg
              text-gray-300 font-medium
              hover:bg-gray-700/50 hover:border-purple-500/50
              transition-all
              group
            "
          >
            <Filter className="w-5 h-5 group-hover:text-purple-400 transition-colors" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExport}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-gray-800/50 border border-gray-700/50
              rounded-lg
              text-gray-300 font-medium
              hover:bg-gray-700/50 hover:border-emerald-500/50
              transition-all
              group
            "
          >
            <Download className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-gray-800/50 border border-gray-700/50
              rounded-lg
              text-gray-300 font-medium
              hover:bg-gray-700/50 hover:border-blue-500/50
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              group
            "
          >
            <RefreshCw
              className={`
                w-5 h-5 group-hover:text-blue-400 transition-colors
                ${isRefreshing ? 'animate-spin' : ''}
              `}
            />
            <span className="hidden sm:inline">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingActionsBar;
