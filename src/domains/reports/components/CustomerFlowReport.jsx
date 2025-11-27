/**
 * ⚠️ CUSTOMER FLOW REPORT — PHASE 8 ANALYTICS
 * 
 * WARNING: Ensure reportsUtils import path is correct
 * Import path: '@domains/reports/utils/reportsUtils'
 */

import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  calculateCustomerFlow,
  formatDuration,
  formatPercentage,
  getDayName
} from '@domains/reports/utils/reportsUtils';

/**
 * Customer Flow Report Component
 */
export default function CustomerFlowReport({ tableSessions = [], orders = [] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate customer flow metrics
  const flowData = calculateCustomerFlow(tableSessions, orders);

  // Prepare hourly flow data for chart
  const hourlyFlowData = Object.entries(flowData.sessionsPerHour || {}).map(([hour, sessions]) => ({
    hour: parseInt(hour),
    hourLabel: formatHourLabel(parseInt(hour)),
    sessions: Array.isArray(sessions) ? sessions.length : 0
  }));

  // Prepare daily flow data for chart
  const dailyFlowData = Object.entries(flowData.sessionsPerDay || {}).map(([day, sessions]) => ({
    day: parseInt(day),
    dayName: getDayName(parseInt(day)),
    sessions: Array.isArray(sessions) ? sessions.length : 0
  }));

  // Prepare heatmap data (day x hour)
  const heatmapData = generateHeatmapData(tableSessions);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/20 rounded-lg">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Customer Flow Analysis</h2>
            <p className="text-white/70 text-sm">
              {flowData.totalSessions} sessions • Peak: {formatHourLabel(flowData.peakHour)}
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
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricBox
              title="Total Sessions"
              value={flowData.totalSessions}
            />
            <MetricBox
              title="Avg Duration"
              value={formatDuration(flowData.avgDuration)}
            />
            <MetricBox
              title="Peak Hour"
              value={formatHourLabel(flowData.peakHour)}
            />
            <MetricBox
              title="Returning Customers"
              value={formatPercentage(flowData.returningCustomersPercent)}
            />
          </div>

          {/* Busiest Times Badge */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="text-cyan-400 font-semibold">Busiest Patterns</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/70 text-sm mb-1">Busiest Day</div>
                <div className="text-2xl font-bold text-white">
                  {getDayName(flowData.busiestDay)}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/70 text-sm mb-1">Busiest Hour</div>
                <div className="text-2xl font-bold text-white">
                  {formatHourLabel(flowData.peakHour)}
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Flow Over Time (Hourly) */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Sessions by Hour</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={hourlyFlowData}>
                  <defs>
                    <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="hourLabel" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#flowGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sessions by Day of Week */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Sessions by Day</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyFlowData}>
                  <defs>
                    <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="dayName" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#dailyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4">Customer Flow Heatmap (Day × Hour)</h3>
            <div className="overflow-x-auto">
              <HeatmapGrid data={heatmapData} />
            </div>
          </div>

          {/* Summary Table */}
          <div className="bg-white/5 rounded-lg p-4 overflow-x-auto">
            <h3 className="text-white font-semibold mb-4">Daily Summary</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/70 font-medium py-3 px-4">Day</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Sessions</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Avg Duration</th>
                  <th className="text-left text-white/70 font-medium py-3 px-4">Peak Hour</th>
                </tr>
              </thead>
              <tbody>
                {dailyFlowData.map((day) => (
                  <tr key={day.day} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white font-medium">{day.dayName}</td>
                    <td className="py-3 px-4 text-right text-cyan-400 font-semibold">
                      {day.sessions}
                    </td>
                    <td className="py-3 px-4 text-right text-white/70">
                      {formatDuration(flowData.avgDuration)}
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      {formatHourLabel(flowData.peakHour)}
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
 * Metric Box Component
 */
function MetricBox({ title, value }) {
  return (
    <div className="bg-white/5 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-cyan-400" />
        <p className="text-white/70 text-sm">{title}</p>
      </div>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}

/**
 * Heatmap Grid Component
 */
function HeatmapGrid({ data }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Find max value for color scaling
  const maxValue = Math.max(...Object.values(data).flat());

  return (
    <div className="inline-block">
      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col mr-2">
          <div className="h-8" /> {/* Spacer for hour labels */}
          {days.map(day => (
            <div key={day} className="h-6 flex items-center justify-end text-white/70 text-xs pr-2">
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap cells */}
        <div>
          {/* Hour labels */}
          <div className="flex mb-1">
            {hours.map(hour => (
              <div key={hour} className="w-6 h-8 flex items-end justify-center text-white/50 text-xs">
                {hour % 3 === 0 ? hour : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          {days.map((day, dayIndex) => (
            <div key={day} className="flex gap-1 mb-1">
              {hours.map(hour => {
                const value = data[dayIndex]?.[hour] || 0;
                const intensity = maxValue > 0 ? value / maxValue : 0;
                const bgColor = getHeatmapColor(intensity);

                return (
                  <div
                    key={hour}
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: bgColor }}
                    title={`${day} ${hour}:00 - ${value} sessions`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Generate heatmap data structure
 */
function generateHeatmapData(sessions) {
  const data = {};
  
  // Initialize all cells with 0
  for (let day = 0; day < 7; day++) {
    data[day] = {};
    for (let hour = 0; hour < 24; hour++) {
      data[day][hour] = 0;
    }
  }

  // Count sessions by day and hour
  sessions.forEach(session => {
    const date = new Date(session.created_at);
    const day = date.getDay();
    const hour = date.getHours();
    data[day][hour]++;
  });

  return data;
}

/**
 * Get heatmap color based on intensity
 */
function getHeatmapColor(intensity) {
  if (intensity === 0) return 'rgba(255, 255, 255, 0.05)';
  
  const colors = [
    'rgba(6, 182, 212, 0.2)',  // Low
    'rgba(6, 182, 212, 0.4)',
    'rgba(6, 182, 212, 0.6)',
    'rgba(6, 182, 212, 0.8)',
    'rgba(6, 182, 212, 1)'     // High
  ];

  const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
  return colors[index];
}

/**
 * Format hour to readable label
 */
function formatHourLabel(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${period}`;
}
