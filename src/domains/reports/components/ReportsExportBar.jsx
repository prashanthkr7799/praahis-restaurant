/**
 * ⚠️ REPORTS EXPORT BAR — PHASE 8 ANALYTICS
 * 
 * WARNING: Ensure reportsUtils import path is correct
 * Import path: '@domains/reports/utils/reportsUtils'
 */

import React, { useState } from 'react';
import { Download, FileText, Printer, RefreshCw, ChevronDown } from 'lucide-react';
import { exportToCSV } from '@domains/reports/utils/reportsUtils';

/**
 * Reports Export Bar Component
 * Provides export functionality for CSV and PDF
 */
export default function ReportsExportBar({
  allReportsData,
  onRefresh,
  isLoading = false
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  /**
   * Export all reports to CSV
   */
  const handleExportAllCSV = () => {
    if (!allReportsData) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `reports-all-${timestamp}.csv`;

    // Combine all report data into one CSV
    const combinedData = [];

    // Add sales data
    if (allReportsData.sales && allReportsData.sales.length > 0) {
      combinedData.push({ section: 'SALES & REVENUE REPORT' });
      allReportsData.sales.forEach(row => combinedData.push(row));
      combinedData.push({}); // Empty row separator
    }

    // Add category data
    if (allReportsData.categories && allReportsData.categories.length > 0) {
      combinedData.push({ section: 'CATEGORY PERFORMANCE' });
      allReportsData.categories.forEach(row => combinedData.push(row));
      combinedData.push({});
    }

    // Add item data
    if (allReportsData.items && allReportsData.items.length > 0) {
      combinedData.push({ section: 'ITEM PERFORMANCE' });
      allReportsData.items.forEach(row => combinedData.push(row));
      combinedData.push({});
    }

    // Add peak hours data
    if (allReportsData.peakHours && allReportsData.peakHours.length > 0) {
      combinedData.push({ section: 'PEAK HOURS ANALYSIS' });
      allReportsData.peakHours.forEach(row => combinedData.push(row));
      combinedData.push({});
    }

    // Add staff data
    if (allReportsData.staff && allReportsData.staff.length > 0) {
      combinedData.push({ section: 'STAFF PERFORMANCE' });
      allReportsData.staff.forEach(row => combinedData.push(row));
      combinedData.push({});
    }

    if (combinedData.length > 0) {
      exportToCSV(combinedData, filename);
    }

    setShowExportMenu(false);
  };

  /**
   * Export individual section to CSV
   */
  const handleExportSection = (section) => {
    if (!allReportsData || !allReportsData[section]) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `report-${section}-${timestamp}.csv`;

    exportToCSV(allReportsData[section], filename);
    setShowExportMenu(false);
  };

  /**
   * Export to PDF (using browser print)
   */
  const handleExportPDF = () => {
    window.print();
    setShowExportMenu(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-xl sticky bottom-0 z-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Title */}
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-white/70" />
          <span className="text-white font-semibold">Export Reports</span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Export All CSV */}
          <button
            onClick={handleExportAllCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/50"
          >
            <Printer className="w-4 h-4" />
            Print PDF
          </button>

          {/* Individual Section Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/50"
            >
              <Download className="w-4 h-4" />
              Export Section
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-white/20 rounded-lg shadow-xl overflow-hidden z-20">
                <div className="py-1">
                  <button
                    onClick={() => handleExportSection('sales')}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-all"
                  >
                    Sales & Revenue
                  </button>
                  <button
                    onClick={() => handleExportSection('categories')}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-all"
                  >
                    Category Performance
                  </button>
                  <button
                    onClick={() => handleExportSection('items')}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-all"
                  >
                    Item Performance
                  </button>
                  <button
                    onClick={() => handleExportSection('peakHours')}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-all"
                  >
                    Peak Hours
                  </button>
                  <button
                    onClick={() => handleExportSection('staff')}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-all"
                  >
                    Staff Performance
                  </button>
                  <button
                    onClick={() => handleExportSection('customerFlow')}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-all"
                  >
                    Customer Flow
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
