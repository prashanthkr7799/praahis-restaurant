/**
 * ReportsPage Component
 * Generate and export business reports (revenue, orders, menu items, staff)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  Activity
} from 'lucide-react';
import { fromRestaurant, supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency, formatDate } from '@shared/utils/helpers/formatters';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const [reportData, setReportData] = useState({
    revenue: {
      total: 0,
      count: 0,
      average: 0,
    },
    orders: [],
    menuItems: [],
    staff: [],
  });

  // Define all data loading functions first
  const loadRevenueData = useCallback(async () => {
    try {
      const { data, error } = await fromRestaurant('orders')
        .select('total, payment_status, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to + 'T23:59:59');

      if (error) throw error;

      const total = (data || []).reduce((sum, order) => sum + (order.total || 0), 0);
      const count = data.length;
      const average = count > 0 ? total / count : 0;

      setReportData(prev => ({
        ...prev,
        revenue: { total, count, average },
      }));
    } catch (error) {
      console.error('Error loading revenue data:', error);
    }
  }, [dateRange]);

  const loadOrdersData = useCallback(async () => {
    try {
      const { data, error } = await fromRestaurant('orders')
        .select('id, order_number, table_number, total, order_status, payment_status, created_at')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReportData(prev => ({
        ...prev,
        orders: data || [],
      }));
    } catch (error) {
      console.error('Error loading orders data:', error);
    }
  }, [dateRange]);

  const loadMenuItemsData = useCallback(async () => {
    try {
      // Pull orders and menu items, then aggregate from orders.items JSON
      const [{ data: orders, error: ordersErr }, { data: menu, error: miErr }] = await Promise.all([
        fromRestaurant('orders')
          .select('items, created_at')
          .gte('created_at', dateRange.from)
          .lte('created_at', dateRange.to + 'T23:59:59'),
        fromRestaurant('menu_items')
          .select('id, name, category, price')
      ]);

      if (ordersErr) throw ordersErr;
      if (miErr) throw miErr;

      const menuMap = new Map((menu || []).map((m) => [m.id, m]));
      const itemMap = new Map(); // id -> { id, name, category, price, totalQuantity, totalRevenue }
      (orders || []).forEach((o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach((it) => {
          const m = menuMap.get(it.menu_item_id) || { id: it.menu_item_id, name: it.name || `Item ${it.menu_item_id}`, category: it.category || 'Unknown', price: 0 };
          const qty = it.quantity || 1;
          const prev = itemMap.get(m.id) || { id: m.id, name: m.name, category: m.category, price: m.price || 0, totalQuantity: 0, totalRevenue: 0 };
          prev.totalQuantity += qty;
          prev.totalRevenue += qty * (m.price || 0);
          itemMap.set(m.id, prev);
        });
      });

      const items = Array.from(itemMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);

      setReportData(prev => ({
        ...prev,
        menuItems: items,
      }));
    } catch (error) {
      console.error('Error loading menu items data:', error);
    }
  }, [dateRange]);

  const loadStaffData = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('list_staff_for_current_restaurant');

      if (error) throw error;

      setReportData(prev => ({
        ...prev,
        staff: data || [],
      }));
    } catch (error) {
      console.error('Error loading staff data:', error);
    }
  }, []);

  // Load all report data
  const loadReportData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRevenueData(),
        loadOrdersData(),
        loadMenuItemsData(),
        loadStaffData(),
      ]);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [loadRevenueData, loadOrdersData, loadMenuItemsData, loadStaffData]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleExportCSV = (type) => {
    try {
      let csvContent = '';
      let filename = '';

      switch (type) {
        case 'revenue':
          csvContent = generateRevenueCSV();
          filename = `revenue-report-${dateRange.from}-to-${dateRange.to}.csv`;
          break;
        case 'orders':
          csvContent = generateOrdersCSV();
          filename = `orders-report-${dateRange.from}-to-${dateRange.to}.csv`;
          break;
        case 'menu':
          csvContent = generateMenuCSV();
          filename = `menu-items-report-${dateRange.from}-to-${dateRange.to}.csv`;
          break;
        case 'staff':
          csvContent = generateStaffCSV();
          filename = `staff-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          return;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const generateRevenueCSV = () => {
    return `Revenue Report\nPeriod: ${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}\n\n` +
      `Metric,Value\n` +
      `Total Revenue,${reportData.revenue.total}\n` +
      `Total Orders,${reportData.revenue.count}\n` +
      `Average Order Value,${reportData.revenue.average.toFixed(2)}\n`;
  };

  const generateOrdersCSV = () => {
    let csv = `Order ID,Table,Amount,Status,Payment Status,Date\n`;
    reportData.orders.forEach(order => {
      csv += `${order.id.slice(0, 8)},`;
      csv += `Table ${order.table?.table_number || 'N/A'},`;
      csv += `${order.total},`;
      csv += `${order.order_status},`;
      csv += `${order.payment_status},`;
      csv += `${formatDate(order.created_at)}\n`;
    });
    return csv;
  };

  const generateMenuCSV = () => {
    let csv = `Item Name,Category,Price,Quantity Sold,Total Revenue\n`;
    reportData.menuItems.forEach(item => {
      csv += `"${item.name}",`;
      csv += `${item.category},`;
      csv += `${item.price},`;
      csv += `${item.totalQuantity},`;
      csv += `${item.totalRevenue.toFixed(2)}\n`;
    });
    return csv;
  };

  const generateStaffCSV = () => {
    let csv = `Name,Email,Role,Status\n`;
    reportData.staff.forEach(staff => {
      csv += `"${staff.full_name}",`;
      csv += `${staff.email},`;
      csv += `${staff.role},`;
      csv += `${staff.is_active ? 'Active' : 'Inactive'}\n`;
    });
    return csv;
  };

  const handleExportPDF = (_type) => {
    // This would integrate with jsPDF for PDF generation
    toast.info('PDF export coming soon! Use CSV export for now.');
  };

  if (loading) {
    return <LoadingSpinner text="Loading report data..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and export business reports</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-card rounded-lg shadow-sm p-4 mb-6 border border-border">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full px-3 py-2 border border-border bg-transparent text-foreground rounded-lg focus:ring-2 focus:ring-info focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-3 py-2 border border-border bg-transparent text-foreground rounded-lg focus:ring-2 focus:ring-info focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Report */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-success-light p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Revenue Report</h2>
                <p className="text-sm text-muted-foreground">Financial summary</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Revenue</span>
              <span className="text-xl font-bold text-success">
                {formatCurrency(reportData.revenue.total)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Orders</span>
              <span className="font-semibold text-foreground">{reportData.revenue.count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Avg Order Value</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(reportData.revenue.average)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExportCSV('revenue')}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExportPDF('revenue')}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Orders Report */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-info-light p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-info" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Orders Report</h2>
                <p className="text-sm text-muted-foreground">Order history details</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Orders</span>
              <span className="text-xl font-bold text-info">
                {reportData.orders.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Date Range</span>
              <span className="text-sm font-medium text-foreground">
                {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExportCSV('orders')}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExportPDF('orders')}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Menu Items Report */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary-tint p-3 rounded-lg">
                <UtensilsCrossed className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Menu Items Report</h2>
                <p className="text-sm text-muted-foreground">Sales by item</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Items</span>
              <span className="text-xl font-bold text-primary">
                {reportData.menuItems.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Top Seller</span>
              <span className="text-sm font-medium text-foreground">
                {reportData.menuItems[0]?.name || 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExportCSV('menu')}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExportPDF('menu')}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Staff Report */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-info-light p-3 rounded-lg">
                <Users className="h-6 w-6 text-info" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Staff Report</h2>
                <p className="text-sm text-muted-foreground">Team members list</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Staff</span>
              <span className="text-xl font-bold text-info">
                {reportData.staff.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Active Staff</span>
              <span className="font-semibold text-foreground">
                {reportData.staff.filter(s => s.is_active).length}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExportCSV('staff')}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExportPDF('staff')}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-primary-tint text-primary border border-primary rounded-lg shadow-lg p-6 mt-6">
        <h3 className="text-xl font-bold mb-4">Period Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm opacity-90">Revenue</div>
            <div className="text-2xl font-bold">{formatCurrency(reportData.revenue.total)}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Orders</div>
            <div className="text-2xl font-bold">{reportData.orders.length}</div>
          </div>
          <div>
            <div className="text-sm opacity-90">Items Sold</div>
            <div className="text-2xl font-bold">
              {reportData.menuItems.reduce((sum, item) => sum + item.totalQuantity, 0)}
            </div>
          </div>
          <div>
            <div className="text-sm opacity-90">Active Staff</div>
            <div className="text-2xl font-bold">
              {reportData.staff.filter(s => s.is_active).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
