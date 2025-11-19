/**
 * DateRangePicker Component
 * Component for selecting date ranges
 */

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { formatDateForInput } from '@shared/utils/helpers/formatters';

const DateRangePicker = ({ startDate, endDate, onChange, label = 'Date Range', idPrefix = 'date-range' }) => {
  const [localStartDate, setLocalStartDate] = useState(
    startDate ? formatDateForInput(startDate) : ''
  );
  const [localEndDate, setLocalEndDate] = useState(
    endDate ? formatDateForInput(endDate) : ''
  );

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setLocalStartDate(value);
    onChange({ startDate: value, endDate: localEndDate });
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setLocalEndDate(value);
    onChange({ startDate: localStartDate, endDate: value });
  };

  const handleQuickSelect = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const startStr = formatDateForInput(start);
    const endStr = formatDateForInput(end);

    setLocalStartDate(startStr);
    setLocalEndDate(endStr);
    onChange({ startDate: startStr, endDate: endStr });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700" htmlFor={`${idPrefix}-start`}>{label}</label>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleQuickSelect(7)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Last 7 Days
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(30)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Last 30 Days
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(90)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Last 90 Days
        </button>
      </div>

      {/* Date Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1" htmlFor={`${idPrefix}-start`}>Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="date"
              value={localStartDate}
              onChange={handleStartDateChange}
              id={`${idPrefix}-start`}
              name={`${idPrefix}-start`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1" htmlFor={`${idPrefix}-end`}>End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="date"
              value={localEndDate}
              onChange={handleEndDateChange}
              min={localStartDate}
              id={`${idPrefix}-end`}
              name={`${idPrefix}-end`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
