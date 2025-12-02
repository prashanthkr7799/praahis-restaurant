/**
 * ⚠️ PEAK HOURS REPORT — PHASE 8 ANALYTICS
 * 
 * WARNING: Ensure reportsUtils import path is correct
 * Import path: '@features/manager/services/reportsService'
 */

import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { calculatePeakHours, formatCurrency, formatDuration } from '@features/manager/services/reportsService';

/**
 * Peak Hours Report Component
 */
export default function PeakHoursReport({ orders = [] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate peak hours data
  const hourlyData = calculatePeakHours(orders);

  // Find peak hour
  const peakHour = hourlyData.reduce(
    (max, hour) => (hour.orderCount > max.orderCount ? hour : max),
    hourlyData[0] || { hour: 0, orderCount: 0 }
  );

  // Find revenue peak hour
  const revenuePeakHour = hourlyData.reduce(
    (max, hour) => (hour.revenue > max.revenue ? hour : max),
    hourlyData[0] || { hour: 0, revenue: 0 }
  );

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Peak Hours Analysis</h2>
            <p className="text-white/70 text-sm">
              Peak: {peakHour.hourLabel} • {peakHour.orderCount} orders
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
          {/* Peak Hours Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Busiest Hour (Orders) */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <h3 className="text-blue-400 font-semibold">Busiest Hour (Orders)</h3>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{peakHour.hourLabel}</div>
              <div className="text-white/70">
                {peakHour.orderCount} orders • {formatCurrency(peakHour.revenue)}
              </div>
            </div>

            {/* Peak Revenue Hour */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-emerald-400 font-semibold">Peak Revenue Hour</h3>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{revenuePeakHour.hourLabel}</div>
              <div className="text-white/70">
                {formatCurrency(revenuePeakHour.revenue)} • {revenuePeakHour.orderCount} orders
              </div>
            </div>
          </div>

          {/* Combined Chart - Orders & Revenue per Hour */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4">Orders & Revenue by Hour</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hourLabel" stroke="rgba(255,255,255,0.5)" />
                <YAxis
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.5)"
                  label={{ value: 'Orders', angle: -90, position: 'insideLeft', fill: '#fff' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="rgba(255,255,255,0.5)"
                  label={{ value: 'Revenue', angle: 90, position: 'insideRight', fill: '#fff' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => {
                    if (name === 'revenue') return formatCurrency(value);
                    return value;
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="orderCount"
                  fill="#3b82f6"
                  name="Orders"
                  radius={[8, 8, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Breakdown Table */}
          <div className="bg-white/5 rounded-lg p-4 overflow-x-auto">
            <h3 className="text-white font-semibold mb-4">Hourly Breakdown</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/70 font-medium py-3 px-4">Hour</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Orders</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Revenue</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Avg Order</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Avg Prep Time</th>
                  <th className="text-left text-white/70 font-medium py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {hourlyData.map((hourData) => {
                  const isPeak = hourData.hour === peakHour.hour;
                  
                  return (
                    <tr
                      key={hourData.hour}
                      className={`border-b border-white/5 hover:bg-white/5 ${
                        isPeak ? 'bg-blue-500/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${isPeak ? 'text-blue-400' : 'text-white'}`}>
                          {hourData.hourLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-white">{hourData.orderCount}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                        {formatCurrency(hourData.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-white/70">
                        {formatCurrency(hourData.avgRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-purple-400">
                        {formatDuration(hourData.avgPrepTime)}
                      </td>
                      <td className="py-3 px-4">
                        {isPeak && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">
                            PEAK
                          </span>
                        )}
                        {hourData.orderCount === 0 && (
                          <span className="px-2 py-1 bg-white/10 text-white/50 rounded-full text-xs">
                            Quiet
                          </span>
                        )}
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
