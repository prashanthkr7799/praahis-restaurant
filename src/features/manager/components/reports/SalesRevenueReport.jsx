/**
 * ⚠️ SALES & REVENUE REPORT — PHASE 8 ANALYTICS
 * 
 * WARNING: Ensure reportsUtils import path is correct
 * Import path: '@features/manager/services/reportsService'
 */

import React, { useState } from 'react';
import { DollarSign, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
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
  calculateRevenue,
  calculatePaymentMethodStats,
  calculateDatewiseBreakdown,
  formatCurrency
} from '@features/manager/services/reportsService';

const COLORS = {
  cash: '#10b981',
  online: '#3b82f6',
  split: '#f59e0b'
};

/**
 * Sales & Revenue Report Component
 */
export default function SalesRevenueReport({ orders = [], payments = [] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate metrics
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.status === 'completed' || o.status === 'paid').length;
  const totalRevenue = calculateRevenue(orders);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate payment method stats
  const paymentStats = calculatePaymentMethodStats(payments);

  // Calculate tax and discounts
  const totalTax = orders.reduce((sum, o) => sum + (parseFloat(o.tax_amount) || 0), 0);
  const totalDiscount = orders.reduce((sum, o) => sum + (parseFloat(o.discount_amount) || 0), 0);
  
  // Calculate total refunds from both payment records and orders
  const paymentsRefunds = payments.reduce((sum, p) => 
    sum + (parseFloat(p.refund_amount) || 0), 0);
  const ordersRefunds = orders.filter(o => o.payment_status === 'refunded' || o.payment_status === 'partially_refunded')
    .reduce((sum, o) => sum + (parseFloat(o.refund_amount) || 0), 0);
  const totalRefunds = Math.max(paymentsRefunds, ordersRefunds); // Use the higher value to avoid double counting

  // Generate chart data
  const dateWiseData = calculateDatewiseBreakdown(orders, payments);
  const revenueOverTimeData = dateWiseData.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: item.revenue,
    orders: item.orderCount
  }));

  // Payment method pie chart data
  const paymentMethodData = [
    { name: 'Cash', value: paymentStats.cash, color: COLORS.cash },
    { name: 'Online', value: paymentStats.online, color: COLORS.online },
    { name: 'Split', value: paymentStats.split, color: COLORS.split }
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 rounded-lg">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Sales & Revenue Report</h2>
            <p className="text-white/70 text-sm">
              {totalOrders} orders • {formatCurrency(totalRevenue)} revenue
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
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricBox title="Total Orders" value={totalOrders} />
            <MetricBox title="Paid Orders" value={paidOrders} />
            <MetricBox title="Avg Order Value" value={formatCurrency(avgOrderValue)} />
            <MetricBox title="Total Revenue" value={formatCurrency(totalRevenue)} />
            <MetricBox title="Tax Collected" value={formatCurrency(totalTax)} />
            <MetricBox title="Discounts Given" value={formatCurrency(totalDiscount)} />
            <MetricBox title="Refunds" value={formatCurrency(totalRefunds)} />
            <MetricBox
              title="Net Revenue"
              value={formatCurrency(totalRevenue - totalRefunds)}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Over Time */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Revenue Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueOverTimeData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
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
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Orders Over Time */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Orders Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Method Distribution */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Payment Method Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
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

            {/* Payment Method Breakdown */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Payment Breakdown</h3>
              <div className="space-y-3 pt-8">
                <PaymentMethodRow
                  label="Cash"
                  amount={paymentStats.cash}
                  color={COLORS.cash}
                  total={paymentStats.cash + paymentStats.online + paymentStats.split}
                />
                <PaymentMethodRow
                  label="Online"
                  amount={paymentStats.online}
                  color={COLORS.online}
                  total={paymentStats.cash + paymentStats.online + paymentStats.split}
                />
                <PaymentMethodRow
                  label="Split"
                  amount={paymentStats.split}
                  color={COLORS.split}
                  total={paymentStats.cash + paymentStats.online + paymentStats.split}
                />
              </div>
            </div>
          </div>

          {/* Date-wise Breakdown Table */}
          <div className="bg-white/5 rounded-lg p-4 overflow-x-auto">
            <h3 className="text-white font-semibold mb-4">Date-wise Breakdown</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/70 font-medium py-3 px-4">Date</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Orders</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Revenue</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Avg Order</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Discounts</th>
                  <th className="text-right text-white/70 font-medium py-3 px-4">Tax</th>
                </tr>
              </thead>
              <tbody>
                {dateWiseData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white">
                      {new Date(row.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 text-right text-white">{row.orderCount}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-white/70">
                      {formatCurrency(row.avgOrder)}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400">
                      {formatCurrency(row.discounts)}
                    </td>
                    <td className="py-3 px-4 text-right text-white/70">
                      {formatCurrency(row.tax)}
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
      <p className="text-white/70 text-sm mb-1">{title}</p>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}

/**
 * Payment Method Row Component
 */
function PaymentMethodRow({ label, amount, color, total }) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/70 text-sm">{label}</span>
        <span className="text-white font-semibold">{formatCurrency(amount)}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className="text-right mt-1">
        <span className="text-white/50 text-xs">{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
}

/**
 * Custom label renderer for pie chart
 */
function renderCustomLabel({ name, percent }) {
  return `${name} ${(percent * 100).toFixed(0)}%`;
}
