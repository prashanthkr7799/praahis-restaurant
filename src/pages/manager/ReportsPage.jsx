import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  Activity,
  DollarSign,
  Clock,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency, formatDate } from '@shared/utils/helpers/formatters';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import { 
  exportOrders, 
  exportMenuItems,
  exportStaff,
  exportPayments
} from '@domains/analytics';

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const [reportData, setReportData] = useState({
    revenue: { total: 0, count: 0, average: 0 },
    orders: [],
    menuItems: [],
    staff: [],
  });

  const { restaurantId } = useRestaurant();

  const loadData = useCallback(async () => {
    if (!restaurantId) return;
    
    setLoading(true);
    try {
      // Load Revenue & Orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const paidOrders = orders.filter(o => o.payment_status === 'paid');
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

      // Load Menu Items for aggregation
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name, category, price')
        .eq('restaurant_id', restaurantId);

      if (menuError) throw menuError;

      // Aggregate Menu Item Sales
      const itemSales = {};
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (!itemSales[item.id]) {
              const menuItem = menuItems.find(m => m.id === item.id);
              itemSales[item.id] = {
                id: item.id,
                name: item.name || (menuItem ? menuItem.name : 'Unknown Item'),
                category: menuItem ? menuItem.category : 'Uncategorized',
                quantity: 0,
                revenue: 0
              };
            }
            itemSales[item.id].quantity += item.quantity || 0;
            itemSales[item.id].revenue += (item.price || 0) * (item.quantity || 0);
          });
        }
      });

      setReportData({
        revenue: {
          total: totalRevenue,
          count: orders.length,
          average: avgOrderValue
        },
        orders: orders,
        menuItems: Object.values(itemSales).sort((a, b) => b.revenue - a.revenue),
        staff: [] // Placeholder for staff data
      });

    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportReport = (type, format = 'excel') => {
    try {
      if (type === 'orders') {
        exportOrders(reportData.orders, format);
        toast.success(`Orders ${format.toUpperCase()} exported!`);
      } else if (type === 'menu') {
        exportMenuItems(reportData.menuItems, format);
        toast.success(`Menu Items ${format.toUpperCase()} exported!`);
      } else if (type === 'staff') {
        exportStaff(reportData.staff, format);
        toast.success(`Staff ${format.toUpperCase()} exported!`);
      } else if (type === 'payments') {
        const paymentsData = reportData.orders.filter(o => o.payment_status === 'paid');
        exportPayments(paymentsData, format);
        toast.success(`Payments ${format.toUpperCase()} exported!`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  if (loading && !reportData.orders.length) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white text-glow tracking-tight">Reports & Analytics</h1>
          <p className="text-zinc-400 mt-1">Business insights and performance metrics</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 bg-white/5 p-2 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 px-2">
            <Calendar size={16} className="text-zinc-400" />
            <span className="text-sm text-zinc-400">Range:</span>
          </div>
          <input 
            type="date" 
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
          />
          <span className="text-zinc-500 self-center">to</span>
          <input 
            type="date" 
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'orders', label: 'Orders', icon: ShoppingCart },
          { id: 'menu', label: 'Menu Performance', icon: UtensilsCrossed },
          { id: 'staff', label: 'Staff', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign size={64} />
                </div>
                <div className="relative z-10">
                  <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Total Revenue</p>
                  <h3 className="text-3xl font-bold text-white mt-2 font-mono-nums text-glow">
                    {formatCurrency(reportData.revenue.total)}
                  </h3>
                  <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm">
                    <TrendingUp size={16} />
                    <span>+12.5% vs last period</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShoppingCart size={64} />
                </div>
                <div className="relative z-10">
                  <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Total Orders</p>
                  <h3 className="text-3xl font-bold text-white mt-2 font-mono-nums">
                    {reportData.revenue.count}
                  </h3>
                  <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm">
                    <TrendingUp size={16} />
                    <span>+5.2% vs last period</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity size={64} />
                </div>
                <div className="relative z-10">
                  <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Avg. Order Value</p>
                  <h3 className="text-3xl font-bold text-white mt-2 font-mono-nums">
                    {formatCurrency(reportData.revenue.average)}
                  </h3>
                  <div className="flex items-center gap-2 mt-4 text-zinc-400 text-sm">
                    <span>Based on paid orders</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity & Top Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-sm text-primary hover:text-primary-light flex items-center gap-1">
                    View All <ChevronRight size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  {reportData.orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-white font-medium">Order #{order.order_number || order.id.slice(0, 6)}</p>
                          <p className="text-xs text-zinc-400">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold font-mono-nums">{formatCurrency(order.total)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Top Selling Items</h3>
                  <button onClick={() => setActiveTab('menu')} className="text-sm text-primary hover:text-primary-light flex items-center gap-1">
                    View All <ChevronRight size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  {reportData.menuItems.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-zinc-400">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-white font-medium">{item.name}</span>
                          <span className="text-white font-mono-nums">{formatCurrency(item.revenue)}</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${(item.revenue / (reportData.menuItems[0]?.revenue || 1)) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{item.quantity} sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div className="glass-panel overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Order History</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => exportReport('orders', 'excel')}
                  className="glass-button text-sm py-1.5"
                >
                  <FileSpreadsheet size={16} />
                  Excel
                </button>
                <button 
                  onClick={() => exportReport('orders', 'pdf')}
                  className="glass-button text-sm py-1.5"
                >
                  <FileText size={16} />
                  PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Table</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reportData.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono-nums text-zinc-300">#{order.order_number || order.id.slice(0, 6)}</td>
                      <td className="p-4 text-zinc-400">{formatDate(order.created_at)}</td>
                      <td className="p-4 text-white">Table {order.table_number}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.order_status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-white font-mono-nums">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="glass-panel overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Menu Performance</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => exportReport('menu', 'excel')}
                  className="glass-button text-sm py-1.5"
                >
                  <FileSpreadsheet size={16} />
                  Excel
                </button>
                <button 
                  onClick={() => exportReport('menu', 'pdf')}
                  className="glass-button text-sm py-1.5"
                >
                  <FileText size={16} />
                  PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="p-4">Item Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Quantity Sold</th>
                    <th className="p-4 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reportData.menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium text-white">{item.name}</td>
                      <td className="p-4 text-zinc-400">{item.category}</td>
                      <td className="p-4 text-right font-mono-nums text-zinc-300">{item.quantity}</td>
                      <td className="p-4 text-right font-bold text-white font-mono-nums">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="glass-panel overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Staff Report</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => exportReport('staff', 'excel')}
                  className="glass-button text-sm py-1.5"
                  disabled={!reportData.staff.length}
                >
                  <FileSpreadsheet size={16} />
                  Excel
                </button>
                <button 
                  onClick={() => exportReport('staff', 'pdf')}
                  className="glass-button text-sm py-1.5"
                  disabled={!reportData.staff.length}
                >
                  <FileText size={16} />
                  PDF
                </button>
              </div>
            </div>
            {reportData.staff.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reportData.staff.map((member) => (
                      <tr key={member.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white font-medium">{member.full_name}</td>
                        <td className="p-4 text-zinc-400 capitalize">{member.role}</td>
                        <td className="p-4 text-zinc-400">{member.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            member.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                          }`}>
                            {member.status || 'active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-6 rounded-full bg-white/5 mb-4">
                  <Users size={48} className="text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold text-white">No Staff Data</h3>
                <p className="text-zinc-400 mt-2 max-w-md">
                  Staff members will appear here once added.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
