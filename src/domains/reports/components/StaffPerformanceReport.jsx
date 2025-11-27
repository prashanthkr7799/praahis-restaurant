/**
 * ⚠️ STAFF PERFORMANCE REPORT — PHASE 8 ANALYTICS
 * 
 * WARNING: Ensure reportsUtils import path is correct
 * Import path: '@domains/reports/utils/reportsUtils'
 */

import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp, Award, Star } from 'lucide-react';
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
  calculateStaffPerformance,
  sortDescending,
  formatCurrency,
  formatDuration
} from '@domains/reports/utils/reportsUtils';

const STAFF_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

/**
 * Staff Performance Report Component
 */
export default function StaffPerformanceReport({
  orders = [],
  orderItems = [],
  users = [],
  feedbacks = []
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate staff performance
  const staffData = calculateStaffPerformance(orders, orderItems, users, feedbacks);
  const sortedByOrders = sortDescending(staffData, 'ordersServed');
  const sortedByRevenue = sortDescending(staffData, 'revenue');

  // Top performer
  const topPerformer = sortedByOrders[0];

  // Prepare chart data
  const barChartData = sortedByOrders.slice(0, 10).map(staff => ({
    name: staff.name.split(' ')[0], // First name only
    orders: staff.ordersServed,
    revenue: staff.revenue
  }));

  const pieChartData = sortedByRevenue.slice(0, 5).map((staff, index) => ({
    name: staff.name,
    value: staff.revenue,
    color: STAFF_COLORS[index % STAFF_COLORS.length]
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Staff Performance</h2>
            <p className="text-white/70 text-sm">
              {staffData.length} staff members tracked
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
          {/* Top Performer Badge */}
          {topPerformer && (
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-amber-500/30 rounded-full">
                    <Award className="w-8 h-8 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-amber-400 font-semibold text-sm mb-1">
                      🏆 Top Performer
                    </h3>
                    <div className="text-2xl font-bold text-white mb-1">{topPerformer.name}</div>
                    <div className="text-white/70 text-sm">
                      {topPerformer.role?.toUpperCase() || 'STAFF'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-400">
                    {topPerformer.ordersServed}
                  </div>
                  <div className="text-white/70 text-sm">Orders Served</div>
                  <div className="text-emerald-400 font-semibold mt-1">
                    {formatCurrency(topPerformer.revenue)}
                  </div>
                  {topPerformer.avgRating > 0 && (
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-amber-400 font-semibold">
                        {topPerformer.avgRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart - Orders Served */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Orders Served by Staff</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="orders" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart - Revenue Contribution */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Revenue Contribution</h3>
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

          {/* Staff Performance Table */}
          <div className="bg-white/5 rounded-lg p-4 overflow-x-auto">
            <h3 className="text-white font-semibold mb-4">Detailed Staff Breakdown</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/70 font-medium py-3 px-4">Rank</th>
                  <th className="text-left text-white/70 font-medium py-3 px-4">Staff Name</th>
                  <th className="text-left text-white/70 font-medium py-3 px-4">Role</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Orders</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Revenue</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Avg Time</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Rating</th>
                </tr>
              </thead>
              <tbody>
                {sortedByOrders.map((staff, index) => (
                  <tr
                    key={staff.id}
                    className={`border-b border-white/5 hover:bg-white/5 ${
                      index === 0 ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className={`text-xl font-bold ${
                        index === 0 ? 'text-amber-400' : 'text-white/50'
                      }`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{staff.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold uppercase">
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-blue-400 font-semibold">
                      {staff.ordersServed}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                      {formatCurrency(staff.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-white/70">
                      {formatDuration(staff.avgCompletionTime)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {staff.avgRating > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-amber-400 font-semibold">
                            {staff.avgRating.toFixed(1)}
                          </span>
                          <span className="text-white/50 text-xs">
                            ({staff.feedbackCount})
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/30 text-sm">No ratings</span>
                      )}
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

/**
 * Custom label renderer for pie chart
 */
function renderCustomLabel({ name, percent }) {
  if (percent < 0.05) return '';
  return `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`;
}
