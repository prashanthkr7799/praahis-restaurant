import React from 'react';
import { X, Calendar, DollarSign, CreditCard, CheckCircle } from 'lucide-react';

/**
 * FILTERS DRAWER COMPONENT
 * Right-side sliding drawer with comprehensive filters:
 * - Date Range (Today, Yesterday, Last 7 Days, Last 30 Days, Custom)
 * - Payment Method (All, Cash, Online, Split)
 * - Status (All, Paid, Pending, Failed)
 * - Amount Range (Min/Max)
 */

const FiltersDrawer = ({ isOpen, onClose, filters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = React.useState(filters || {
    dateRange: 'all',
    customStartDate: '',
    customEndDate: '',
    paymentMethod: 'all',
    status: 'all',
    minAmount: '',
    maxAmount: '',
  });

  React.useEffect(() => {
    if (isOpen && filters) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      dateRange: 'all',
      customStartDate: '',
      customEndDate: '',
      paymentMethod: 'all',
      status: 'all',
      minAmount: '',
      maxAmount: '',
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-gray-900 border-l border-gray-700 z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Date Range Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Calendar className="w-4 h-4" />
              Date Range
            </label>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'custom', label: 'Custom Range' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="dateRange"
                    value={option.value}
                    checked={localFilters.dateRange === option.value}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, dateRange: e.target.value })
                    }
                    className="w-4 h-4 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-gray-300">{option.label}</span>
                </label>
              ))}

              {/* Custom Date Inputs */}
              {localFilters.dateRange === 'custom' && (
                <div className="pl-7 space-y-2 mt-2">
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={localFilters.customStartDate}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, customStartDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <input
                    type="date"
                    placeholder="End Date"
                    value={localFilters.customEndDate}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, customEndDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <CreditCard className="w-4 h-4" />
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'cash', label: 'Cash' },
                { value: 'online', label: 'Online' },
                { value: 'split', label: 'Split' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setLocalFilters({ ...localFilters, paymentMethod: option.value })
                  }
                  className={`
                    px-4 py-2.5 rounded-lg border font-medium transition-all
                    ${
                      localFilters.paymentMethod === option.value
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-purple-500/50'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <CheckCircle className="w-4 h-4" />
              Payment Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'paid', label: 'Paid' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setLocalFilters({ ...localFilters, status: option.value })
                  }
                  className={`
                    px-4 py-2.5 rounded-lg border font-medium transition-all
                    ${
                      localFilters.status === option.value
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-purple-500/50'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Range Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <DollarSign className="w-4 h-4" />
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min (₹)"
                value={localFilters.minAmount}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, minAmount: e.target.value })
                }
                className="px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <input
                type="number"
                placeholder="Max (₹)"
                value={localFilters.maxAmount}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, maxAmount: e.target.value })
                }
                className="px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-medium hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-emerald-600 rounded-lg text-white font-medium hover:from-purple-700 hover:to-emerald-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default FiltersDrawer;
