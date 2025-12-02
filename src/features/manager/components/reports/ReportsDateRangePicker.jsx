/**
 * ⚠️ REPORTS DATE RANGE PICKER — PHASE 8 ANALYTICS
 * 
 * WARNING: Ensure billingUtils import path is correct
 * Import path: '@features/billing/utils/billingHelpers'
 */

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { getDateRangeFilter } from '@features/billing/utils/billingHelpers';

const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'Last 7 Days' },
  { id: 'month', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' }
];

/**
 * Date Range Picker Component
 * Provides preset buttons and custom date selection
 */
export default function ReportsDateRangePicker({ dateRange, onDateRangeChange }) {
  const [selectedPreset, setSelectedPreset] = useState('today');
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  /**
   * Handle preset button click
   */
  const handlePresetClick = (preset) => {
    setSelectedPreset(preset);
    
    if (preset === 'custom') {
      setShowCustom(true);
      return;
    }

    setShowCustom(false);
    
    // Get date range using billing utils
    const range = getDateRangeFilter(preset);
    
    if (range && onDateRangeChange) {
      onDateRangeChange({
        preset,
        start: range.start,
        end: range.end
      });
    }
  };

  /**
   * Apply custom date range
   */
  const handleApplyCustomRange = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day

    if (start > end) {
      alert('Start date must be before end date');
      return;
    }

    if (onDateRangeChange) {
      onDateRangeChange({
        preset: 'custom',
        start,
        end
      });
    }
  };

  /**
   * Clear selection and reset to today
   */
  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setShowCustom(false);
    handlePresetClick('today');
  };

  /**
   * Format date for display
   */
  const formatDateDisplay = () => {
    if (!dateRange) return 'Select Date Range';

    if (dateRange.preset === 'custom' && dateRange.start && dateRange.end) {
      return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
    }

    const presetLabel = PRESETS.find(p => p.id === dateRange.preset)?.label;
    return presetLabel || 'Select Date Range';
  };

  /**
   * Format date to readable string
   */
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl sticky top-0 z-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Preset Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <span className="text-white/70 text-sm font-medium mr-2">Date Range:</span>
          
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedPreset === preset.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Right: Selected Range Display */}
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
            <span className="text-white font-medium text-sm">
              {formatDateDisplay()}
            </span>
          </div>
          
          {selectedPreset !== 'today' && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium text-sm transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {showCustom && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-white/70 text-sm font-medium mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-white/70 text-sm font-medium mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleApplyCustomRange}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
