/**
 * ⚠️ CATEGORY PERFORMANCE REPORT — PHASE 8 ANALYTICS
 * 
 * WARNING: Ensure reportsUtils import path is correct
 * Import path: '@features/manager/services/reportsService'
 */

import React, { useState } from 'react';
import { Package, TrendingUp, ChevronDown, ChevronUp, Award } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  calculateCategoryPerformance,
  sortDescending,
  formatCurrency
} from '@features/manager/services/reportsService';

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

/**
 * Category Performance Report Component
 */
export default function CategoryPerformanceReport({
  orders = [],
  orderItems = [],
  menuItems = []
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate category performance
  const categoryData = calculateCategoryPerformance(orderItems, menuItems, orders);
  const sortedByRevenue = sortDescending(categoryData, 'revenue');

  // Top and worst categories
  const top3Categories = sortedByRevenue.slice(0, 3);
  const worst3Categories = sortedByRevenue.slice(-3).reverse();

  // Prepare chart data
  const barChartData = sortedByRevenue.map(cat => ({
    name: cat.category,
    revenue: cat.revenue,
    quantity: cat.quantity
  }));

  const pieChartData = sortedByRevenue.map((cat, index) => ({
    name: cat.category,
    value: cat.revenue,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));

  const totalRevenue = categoryData.reduce((sum, cat) => sum + cat.revenue, 0);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <Package className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Category Performance</h2>
            <p className="text-white/70 text-sm">
              {categoryData.length} categories • {formatCurrency(totalRevenue)} total
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-6 h-6 text-white/70" />
        ) : (
          <ChevronDown className="w-6 h-6 text-white/70" />
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 pt-0 space-y-6">
          {/* Top & Worst Categories Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 3 */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-emerald-400" />
                <h3 className="text-emerald-400 font-semibold">Top 3 Categories</h3>
              </div>
              <div className="space-y-2">
                {top3Categories.map((cat, index) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-emerald-400">#{index + 1}</span>
                      <span className="text-white font-medium">{cat.category}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">
                      {formatCurrency(cat.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Worst 3 */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-red-400 rotate-180" />
                <h3 className="text-red-400 font-semibold">Needs Attention</h3>
              </div>
              <div className="space-y-2">
                {worst3Categories.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                  >
                    <span className="text-white font-medium">{cat.category}</span>
                    <span className="text-red-400 font-bold">
                      {formatCurrency(cat.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Horizontal Bar Chart - Revenue by Category */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Revenue by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart - Category Distribution */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Category Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Table */}
          <div className="bg-white/5 rounded-lg p-4 overflow-x-auto">
            <h3 className="text-white font-semibold mb-4">Detailed Category Breakdown</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/70 font-medium py-3 px-4">Category</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Qty Sold</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Revenue</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Avg Price</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedByRevenue.map((cat, index) => {
                  const percentage = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
                  
                  return (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="text-white font-medium">{cat.category}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-white">{cat.quantity}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                        {formatCurrency(cat.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-white/70">
                        {formatCurrency(cat.avgPrice)}
                      </td>
                      <td className="py-3 px-4 text-right text-purple-400">
                        {percentage.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Custom label renderer for pie chart
 */
function renderCustomLabel({ name, percent }) {
  if (percent < 0.05) return ''; // Don't show label for small slices
  return `${name} ${(percent * 100).toFixed(0)}%`;
}
