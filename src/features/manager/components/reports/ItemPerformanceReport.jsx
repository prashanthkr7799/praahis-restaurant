/**
 * ⚠️ ITEM PERFORMANCE REPORT — PHASE 8 ANALYTICS
 * 
 * WARNING: Ensure reportsUtils import path is correct
 * Import path: '@features/manager/services/reportsService'
 */

import React, { useState } from 'react';
import { Star, TrendingUp, TrendingDown, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  calculateItemPerformance,
  getTopN,
  getBottomN,
  formatCurrency
} from '@features/manager/services/reportsService';

const BAR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

/**
 * Item Performance Report Component
 */
export default function ItemPerformanceReport({
  orders = [],
  orderItems = [],
  menuItems = []
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState('top'); // 'top' | 'worst'

  // Calculate item performance
  const itemData = calculateItemPerformance(orderItems, menuItems, orders);
  
  // Top and worst performing items
  const top10Items = getTopN(itemData, 'quantity', 10);
  const worst10Items = getBottomN(itemData, 'quantity', 10);
  
  // Most profitable items (by revenue)
  const mostProfitable = getTopN(itemData, 'revenue', 5);
  
  // Out of stock items
  const outOfStockItems = itemData.filter(item => !item.inStock);

  // Current view data
  const displayItems = viewMode === 'top' ? top10Items : worst10Items;

  // Prepare chart data
  const chartData = displayItems.map(item => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    quantity: item.quantity,
    revenue: item.revenue
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 rounded-lg">
            <Star className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Item Performance</h2>
            <p className="text-white/70 text-sm">
              {itemData.length} items • {outOfStockItems.length} out of stock
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
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('top')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'top'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Top Sellers
            </button>
            <button
              onClick={() => setViewMode('worst')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'worst'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <TrendingDown className="w-4 h-4 inline mr-2" />
              Slow Movers
            </button>
          </div>

          {/* Most Profitable Items Badge */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-amber-400" />
              <h3 className="text-amber-400 font-semibold">Most Profitable Items</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {mostProfitable.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white/5 rounded-lg p-3 text-center"
                >
                  <span className="text-lg font-bold text-amber-400">#{index + 1}</span>
                  <p className="text-white text-sm font-medium mt-1">{item.name}</p>
                  <p className="text-emerald-400 font-bold text-sm">
                    {formatCurrency(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Out of Stock Alert */}
          {outOfStockItems.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-red-400 font-semibold">
                  {outOfStockItems.length} Items Out of Stock
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {outOfStockItems.slice(0, 10).map(item => (
                  <span
                    key={item.id}
                    className="bg-white/5 px-3 py-1 rounded-full text-white/70 text-sm"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bar Chart - Quantity Sold */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4">
              {viewMode === 'top' ? 'Top 10 Best Sellers' : 'Bottom 10 Items'}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="quantity" radius={[0, 8, 8, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Items Table */}
          <div className="bg-white/5 rounded-lg p-4 overflow-x-auto">
            <h3 className="text-white font-semibold mb-4">
              {viewMode === 'top' ? 'Top Performing Items' : 'Items Needing Attention'}
            </h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/70 font-medium py-3 px-4">Rank</th>
                  <th className="text-left text-white/70 font-medium py-3 px-4">Item Name</th>
                  <th className="text-left text-white/70 font-medium py-3 px-4">Category</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Qty Sold</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Revenue</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Avg Price</th>
                  <th className="text-center text-white/70 font-medium py-3 px-4">Stock</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <span className={`text-xl font-bold ${
                        viewMode === 'top' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-white/70">{item.category}</td>
                    <td className="py-3 px-4 text-right text-blue-400 font-semibold">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-white/70">
                      {formatCurrency(item.avgPrice)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        item.inStock
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.inStock ? 'In Stock' : 'Out'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
