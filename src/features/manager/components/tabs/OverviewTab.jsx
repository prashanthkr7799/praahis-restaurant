import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Utensils,
  CreditCard,
  AlertCircle,
  LayoutGrid,
  ChefHat,
  Users,
  FileText,
  Clock,
  ChevronRight,
  ShoppingBag,
  Activity,
} from 'lucide-react';
import { useRealtimeOrders } from '@shared/contexts/RealtimeOrderContext';
import EnhancedStatCard from '../StatCard';
import QuickAction from '../QuickAction';
import SubscriptionBox from '../SubscriptionBox';
import { formatCurrency } from '@shared/utils/formatters';
import OrderCard from '@features/orders/components/OrderCard';

const OverviewTab = ({ onTabChange }) => {
  const navigate = useNavigate();
  const { stats, orders, loading } = useRealtimeOrders();

  // Helper to calculate trend
  const calculateTrend = (current, previous) => {
    if (previous === 0) return { trend: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      trend: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
  };

  const revenueTrend = calculateTrend(stats.todayRevenue, stats.yesterdayRevenue);
  const ordersTrend = calculateTrend(stats.todayOrders, stats.yesterdayOrders);

  // Filter orders - exclude pending_payment (orders not yet paid should not appear)
  const liveOrders = orders.filter((o) =>
    ['received', 'preparing', 'ready'].includes(o.order_status)
  );

  const recentHistory = orders
    .filter((o) => !['received', 'preparing', 'ready'].includes(o.order_status))
    .slice(0, 6);

  const ShoppingBagIcon = () => {
    return <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />;
  };

  return (
    <div
      className="space-y-6 md:space-y-8 animate-fade-in"
      data-testid="dashboard-overview"
      aria-live="polite"
    >
      {/* Mobile Quick Actions - Horizontal Scroll */}
      <div className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-2 min-w-max" role="navigation" aria-label="Quick actions">
          <QuickAction
            data-testid="orders-nav"
            icon={ShoppingCart}
            label="Orders"
            onClick={() => onTabChange('orders')}
            color="text-primary"
          />
          <QuickAction
            data-testid="tables-nav"
            icon={LayoutGrid}
            label="Tables"
            onClick={() => onTabChange('tables')}
            color="text-accent"
          />
          <QuickAction
            icon={ChefHat}
            label="Kitchen"
            onClick={() => onTabChange('kitchen')}
            color="text-emerald-400"
          />
          <QuickAction
            data-testid="staff-nav"
            icon={Users}
            label="Staff"
            onClick={() => onTabChange('staff')}
            color="text-blue-400"
          />
          <QuickAction
            icon={FileText}
            label="Reports"
            onClick={() => navigate('/manager/reports')}
            color="text-purple-400"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6"
        data-testid="stats-grid"
        aria-label="Dashboard statistics"
      >
        <EnhancedStatCard
          title="REVENUE"
          value={formatCurrency(stats.todayRevenue)}
          subtext="vs yesterday"
          icon={DollarSign}
          trend={revenueTrend}
          color="text-emerald-400"
          onClick={() => navigate('/manager/payments')}
          loading={loading}
        />
        <EnhancedStatCard
          title="ORDERS"
          value={stats.todayOrders}
          subtext="vs yesterday"
          icon={ShoppingCart}
          trend={ordersTrend}
          color="text-primary"
          onClick={() => onTabChange('orders')}
          loading={loading}
        />
        <EnhancedStatCard
          title="TABLE OCCUPANCY"
          value={`${stats.occupiedTables}/${stats.totalTables}`}
          subtext={`${stats.totalTables > 0 ? Math.round((stats.occupiedTables / stats.totalTables) * 100) : 0}% occupied`}
          icon={Utensils}
          color="text-accent"
          onClick={() => onTabChange('tables')}
          loading={loading}
        />
        <EnhancedStatCard
          title="PENDING PAYMENTS"
          value={stats.pendingPayments}
          subtext={formatCurrency(stats.pendingPaymentsAmount)}
          icon={CreditCard}
          color="text-amber-400"
          onClick={() => navigate('/manager/payments')}
          loading={loading}
        />
        <EnhancedStatCard
          title="COMPLAINTS"
          value={stats.todayComplaints}
          subtext="reported today"
          icon={AlertCircle}
          color="text-red-400"
          onClick={() => onTabChange('staff')}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Live Orders (7 cols) */}
        <div
          className="xl:col-span-7 space-y-6"
          data-testid="orders-summary"
          data-today-orders={liveOrders.length}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500 animate-pulse" />
              Live Orders (<span data-testid="today-orders">{liveOrders.length}</span>)
            </h2>
            <button
              onClick={() => onTabChange('orders')}
              data-testid="orders-nav"
              className="text-xs text-primary hover:text-primary/80 font-bold uppercase tracking-wider transition-colors"
              aria-label="Manage all orders"
            >
              Manage All
            </button>
          </div>

          <div className="space-y-4" aria-live="polite">
            {liveOrders.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-2xl border border-white/10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl mb-4 border border-white/5 shadow-inner">
                  <Utensils className="h-8 w-8 text-zinc-600" />
                </div>
                <p className="text-zinc-400 font-medium">No active orders right now</p>
                <p className="text-xs text-zinc-500 mt-1">New orders will appear here instantly</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={{
                      ...order,
                      items: order.items || [],
                      status: order.order_status,
                      table_number: order.tables?.table_number || order.table_number,
                      subtotal: order.subtotal,
                      tax_amount: order.tax_amount,
                      total_amount: order.total,
                    }}
                    compact={true} // Use compact mode for overview
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity & Quick Actions (5 cols) */}
        <div className="xl:col-span-5 space-y-8">
          {/* Subscription Box */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-widest">
                Subscription
              </h2>
            </div>
            <SubscriptionBox />
          </section>

          {/* Recent Orders List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" /> Recent Activity
              </h2>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
              {recentHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs md:text-sm text-zinc-400 font-medium">No recent history</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentHistory.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => onTabChange('orders')}
                      className="p-4 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg border shadow-lg ${
                            order.order_status === 'completed'
                              ? 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
                              : 'bg-white/5 border-white/10 text-zinc-400'
                          }`}
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white font-mono-nums">
                            #{order.order_number}
                          </h4>
                          <p className="text-[10px] text-zinc-500">
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white font-mono-nums block">
                          {formatCurrency(order.total)}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide ${
                            order.order_status === 'completed' ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {order.order_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
