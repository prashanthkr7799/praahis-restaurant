import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@config/supabase';
import { 
  Download, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Calculator,
  Building2,
  ChevronRight,
  Calendar,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  Receipt,
  AlertTriangle,
  X,
  Check,
  PieChart,
  BarChart3,
  FileText,
  Bell,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useBillingRealtime } from '@features/admin/hooks/useAdminRealtime';
import InvoiceModal from '@features/admin/components/modals/InvoiceModal';
import SendReminderModal from '@features/admin/components/modals/SendReminderModal';

// Constants for Subscription Pricing
const RATE_PER_TABLE_PER_DAY = 75; // ₹75/table/day
// Breakdown: Core Platform ₹30 + Unlimited Staff ₹18 + Unlimited Menu ₹12 + Billing/POS ₹15 = ₹75
const PRICING_BREAKDOWN = {
  core: { label: 'Core Platform', amount: 30 },
  staff: { label: 'Unlimited Staff', amount: 18 },
  menu: { label: 'Unlimited Menu', amount: 12 },
  billing: { label: 'Billing & POS', amount: 15 }
};

// Glass Card Component
const GlassCard = ({ children, className = '', onClick, hover = true }) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden
      bg-slate-800/50 backdrop-blur-xl
      border border-white/10 rounded-2xl
      ${hover ? 'hover:border-white/20 hover:bg-slate-800/60 transition-all duration-300' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

// Subscription Calculator Modal
const SubscriptionCalculator = ({ isOpen, onClose }) => {
  const [tableCount, setTableCount] = useState(10);
  const [billingCycle, setBillingCycle] = useState('monthly');
  
  const daysInMonth = 30;
  const dailyCost = tableCount * RATE_PER_TABLE_PER_DAY;
  const monthlyCost = dailyCost * daysInMonth;
  const yearlyCost = monthlyCost * 12;
  const yearlyDiscountedCost = yearlyCost * 0.9; // 10% discount for yearly
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/25">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Subscription Calculator</h2>
                <p className="text-sm text-gray-400">Calculate restaurant subscription costs</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Pricing Formula */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Praahis Pricing</span>
            </div>
            <div className="text-3xl font-bold text-white mb-3">
              ₹{RATE_PER_TABLE_PER_DAY} <span className="text-lg font-normal text-gray-400">per table / per day</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {Object.entries(PRICING_BREAKDOWN).map(([key, item]) => (
                <div key={key} className="p-2 rounded-lg bg-white/5 text-center">
                  <div className="text-gray-400">{item.label}</div>
                  <div className="text-white font-medium">₹{item.amount}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Table Count Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Number of Tables
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="100"
                value={tableCount}
                onChange={(e) => setTableCount(parseInt(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none bg-white/10 cursor-pointer accent-emerald-500"
              />
              <div className="w-20 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-center">
                <span className="text-xl font-bold text-white">{tableCount}</span>
              </div>
            </div>
          </div>
          
          {/* Billing Cycle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Billing Cycle
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'monthly', label: 'Monthly', desc: 'Pay every month' },
                { id: 'yearly', label: 'Yearly', desc: 'Save 10%', badge: 'Best Value' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setBillingCycle(option.id)}
                  className={`relative p-4 rounded-xl border transition-all ${
                    billingCycle === option.id
                      ? 'bg-emerald-500/20 border-emerald-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {option.badge && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold bg-emerald-500 text-white rounded-full">
                      {option.badge}
                    </span>
                  )}
                  <div className="text-left">
                    <div className={`font-semibold ${billingCycle === option.id ? 'text-emerald-400' : 'text-white'}`}>
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500">{option.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Cost Breakdown */}
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Daily Cost</span>
                <span className="text-white font-medium">₹{dailyCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Monthly Cost (30 days)</span>
                <span className="text-white font-medium">₹{monthlyCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-px bg-white/10" />
              {billingCycle === 'yearly' && (
                <div className="flex items-center justify-between text-gray-500">
                  <span>Yearly (without discount)</span>
                  <span className="line-through">₹{yearlyCost.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-semibold text-white">
                  {billingCycle === 'monthly' ? 'Monthly Total' : 'Yearly Total'}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-400">
                    ₹{(billingCycle === 'monthly' ? monthlyCost : yearlyDiscountedCost).toLocaleString('en-IN')}
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="text-sm text-emerald-500">You save ₹{(yearlyCost - yearlyDiscountedCost).toLocaleString('en-IN')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Formula Display */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
            <div className="text-xs text-gray-500 mb-2">Calculation Formula</div>
            <code className="text-sm text-cyan-400">
              {tableCount} tables × ₹{RATE_PER_TABLE_PER_DAY}/day × {billingCycle === 'monthly' ? '30 days' : '365 days'}
              {billingCycle === 'yearly' && ' × 0.90 (10% discount)'}
              {' = '}
              <span className="text-emerald-400 font-bold">
                ₹{(billingCycle === 'monthly' ? monthlyCost : yearlyDiscountedCost).toLocaleString('en-IN')}
              </span>
            </code>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-slate-900/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              ₹75/table/day includes unlimited staff & menu items
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function BillingManagementPage() {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  
  // Invoice and Reminder Modal States
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    paidThisMonth: 0,
    overdueCount: 0,
    activeSubscriptions: 0,
    totalTables: 0
  });

  // Define calculateStats FIRST, before fetchBillingData uses it
  const calculateStats = useCallback((billsData) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const totalRevenue = billsData
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + parseFloat(b.total_amount), 0);

    const pendingAmount = billsData
      .filter(b => b.status === 'pending' || b.status === 'overdue')
      .reduce((sum, b) => sum + parseFloat(b.total_amount), 0);

    const paidThisMonth = billsData
      .filter(b => b.status === 'paid' && b.billing_year === currentYear && b.billing_month === currentMonth)
      .reduce((sum, b) => sum + parseFloat(b.total_amount), 0);

    const overdueCount = billsData
      .filter(b => b.status === 'overdue')
      .length;

    setStats({
      totalRevenue,
      pendingAmount,
      paidThisMonth,
      overdueCount
    });
  }, []);

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all bills with restaurant details (simplified - no payments join)
      const { data: billsData, error: billsError } = await supabase
        .from('billing')
        .select(`
          id,
          restaurant_id,
          billing_month,
          billing_year,
          billing_period,
          table_count,
          rate_per_table_per_day,
          days_in_month,
          pricing_type,
          custom_amount,
          base_amount,
          total_amount,
          status,
          due_date,
          grace_period_days,
          grace_end_date,
          invoice_number,
          paid_at,
          created_at,
          updated_at,
          restaurants (
            id,
            name,
            slug,
            pricing_type,
            custom_monthly_amount
          )
        `)
        .order('billing_year', { ascending: false })
        .order('billing_month', { ascending: false });

      if (billsError) {
        console.error('Billing fetch error:', billsError);
        throw billsError;
      }

      setBills(billsData || []);
      calculateStats(billsData || []);

    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing data: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calculateStats]);

  // Realtime subscription for billing updates
  const { isConnected } = useBillingRealtime(fetchBillingData);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBillingData();
  };

  const filterBills = useCallback(() => {
    let filtered = [...bills];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.status === statusFilter);
    }

    // Filter by search term (restaurant name or invoice number)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bill => 
        bill.restaurants?.name?.toLowerCase().includes(term) ||
        bill.invoice_number?.toLowerCase().includes(term) ||
        bill.restaurants?.slug?.toLowerCase().includes(term)
      );
    }

    setFilteredBills(filtered);
  }, [bills, searchTerm, statusFilter]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  useEffect(() => {
    filterBills();
  }, [filterBills]);

  const handleMarkAsPaid = async (billingId) => {
    if (!window.confirm('Mark this bill as paid? This action cannot be undone.')) {
      return;
    }

    try {
      const amount = bills.find(b => b.id === billingId)?.total_amount;
      if (!amount) throw new Error('Bill not found');

      // Call the database function to process payment
      const { data, error } = await supabase.rpc('process_subscription_payment', {
        p_billing_id: billingId,
        p_amount: parseFloat(amount),
        p_payment_method: 'manual',
        p_transaction_id: `MANUAL_${Date.now()}`,
        p_payment_gateway_order_id: null,
        p_receipt_url: null
      });

      if (error) throw error;

      if (data && data.success) {
        toast.success('Bill marked as paid successfully');
        await fetchBillingData();
      } else {
        throw new Error(data?.error || 'Failed to process payment');
      }

    } catch (error) {
      console.error('Error marking bill as paid:', error);
      toast.error(error.message || 'Failed to mark bill as paid');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', text: 'Pending', icon: Clock },
      paid: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', text: 'Paid', icon: CheckCircle },
      overdue: { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', text: 'Overdue', icon: AlertTriangle },
      cancelled: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', text: 'Cancelled', icon: X }
    };

    const badge = badges[status] || badges.pending;
    const BadgeIcon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${badge.color}`}>
        <BadgeIcon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const exportToCSV = () => {
    const csvData = filteredBills.map(bill => ({
      'Restaurant': bill.restaurants?.name || '',
      'Invoice Number': bill.invoice_number || '',
      'Period': `${getMonthName(bill.billing_month)} ${bill.billing_year}`,
      'Amount': bill.total_amount,
      'Status': bill.status,
      'Due Date': formatDate(bill.due_date),
      'Paid Date': bill.paid_at ? formatDate(bill.paid_at) : '',
      'Pricing Type': bill.pricing_type,
      'Tables': bill.table_count || ''
    }));

    const headers = Object.keys(csvData[0]);
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 animate-pulse" />
            <div className="absolute inset-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 animate-ping opacity-25" />
          </div>
          <p className="text-gray-400">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Calculator Modal */}
      <SubscriptionCalculator isOpen={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">Billing & Subscriptions</h1>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              isConnected 
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-xs font-medium text-red-400">Offline</span>
                </>
              )}
            </div>
          </div>
          <p className="text-gray-400">
            Manage restaurant subscriptions at <span className="text-emerald-400 font-semibold">₹{RATE_PER_TABLE_PER_DAY}/table/day</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCalculatorOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all"
          >
            <Calculator className="w-4 h-4" />
            <span className="text-sm font-medium">Calculator</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl text-white font-medium shadow-lg shadow-emerald-500/25 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Pricing Banner */}
      <GlassCard className="p-5" hover={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/25">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Praahis Subscription Model</h3>
              <p className="text-gray-400">Simple, transparent per-table pricing</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">₹{RATE_PER_TABLE_PER_DAY}</div>
              <div className="text-xs text-gray-500">per table / day</div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">₹{RATE_PER_TABLE_PER_DAY * 30}</div>
              <div className="text-xs text-gray-500">per table / month</div>
            </div>
            <button
              onClick={() => setCalculatorOpen(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Calculate
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total Revenue', 
            value: formatCurrency(stats.totalRevenue), 
            icon: DollarSign, 
            color: 'emerald',
            trend: '+18%'
          },
          { 
            label: 'Pending Amount', 
            value: formatCurrency(stats.pendingAmount), 
            icon: Clock, 
            color: 'amber',
            subtitle: `${filteredBills.filter(b => b.status === 'pending').length} invoices`
          },
          { 
            label: 'Paid This Month', 
            value: formatCurrency(stats.paidThisMonth), 
            icon: CheckCircle, 
            color: 'cyan',
            subtitle: 'Current period'
          },
          { 
            label: 'Overdue Bills', 
            value: stats.overdueCount, 
            icon: AlertTriangle, 
            color: 'rose',
            subtitle: stats.overdueCount > 0 ? 'Requires attention' : 'All clear'
          },
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <GlassCard key={stat.label} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${
                  stat.color === 'emerald' ? 'from-emerald-500 to-cyan-500 shadow-emerald-500/20' :
                  stat.color === 'amber' ? 'from-amber-500 to-orange-500 shadow-amber-500/20' :
                  stat.color === 'cyan' ? 'from-cyan-500 to-blue-500 shadow-cyan-500/20' :
                  'from-rose-500 to-pink-500 shadow-rose-500/20'
                } shadow-lg`}>
                  <StatIcon className="w-5 h-5 text-white" />
                </div>
                {stat.trend && (
                  <div className="flex items-center gap-1 text-sm text-emerald-400">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="font-medium">{stat.trend}</span>
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
              {stat.subtitle && <div className="text-xs text-gray-500 mt-1">{stat.subtitle}</div>}
            </GlassCard>
          );
        })}
      </div>

      {/* Filters */}
      <GlassCard className="p-4" hover={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by restaurant name or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder-gray-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white appearance-none cursor-pointer transition-all"
            >
              <option value="all" className="bg-slate-800">All Status</option>
              <option value="pending" className="bg-slate-800">Pending</option>
              <option value="paid" className="bg-slate-800">Paid</option>
              <option value="overdue" className="bg-slate-800">Overdue</option>
              <option value="cancelled" className="bg-slate-800">Cancelled</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Bills Table */}
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Invoice #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Tables & Pricing
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {bill.restaurants?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {bill.restaurants?.slug || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden sm:table-cell">
                      <code className="px-2 py-1 bg-white/5 rounded text-xs">{bill.invoice_number || '-'}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-white">
                          {getMonthName(bill.billing_month)} {bill.billing_year}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      {bill.pricing_type === 'per_table' ? (
                        <div>
                          <div className="text-sm text-white flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                              {bill.table_count} tables
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ₹{bill.rate_per_table_per_day || RATE_PER_TABLE_PER_DAY}/table/day × {bill.days_in_month || 30} days
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                            Custom
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Fixed: {formatCurrency(bill.custom_amount || 0)}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-white">
                        {formatCurrency(bill.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(bill.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden md:table-cell">
                      <div>{formatDate(bill.due_date)}</div>
                      {bill.status === 'paid' && bill.paid_at && (
                        <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                          <Check className="w-3 h-3" />
                          Paid: {formatDate(bill.paid_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {bill.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(bill.id)}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Paid
                          </button>
                        )}
                        {/* View Invoice Button */}
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setInvoiceModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-cyan-400 transition-colors"
                          title="View Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {/* Send Reminder Button (only for pending/overdue) */}
                        {(bill.status === 'pending' || bill.status === 'overdue') && (
                          <button
                            onClick={() => {
                              setSelectedBill(bill);
                              setReminderModalOpen(true);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-amber-400 transition-colors"
                            title="Send Reminder"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                        )}
                        {bill.receipt_url && (
                          <a
                            href={bill.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                          >
                            <Receipt className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 rounded-2xl bg-white/5 mb-4">
                        <Receipt className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-400 font-medium">No billing records found</p>
                      <p className="text-sm text-gray-600 mt-1">Try adjusting your search or filter</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        {filteredBills.length > 0 && (
          <div className="px-6 py-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing <span className="text-white font-medium">{filteredBills.length}</span> of{' '}
                <span className="text-white font-medium">{bills.length}</span> records
              </div>
              <div className="text-sm text-gray-400">
                Total: <span className="text-emerald-400 font-bold">{formatCurrency(
                  filteredBills.reduce((sum, b) => sum + parseFloat(b.total_amount), 0)
                )}</span>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Invoice Modal */}
      {selectedBill && (
        <InvoiceModal
          isOpen={invoiceModalOpen}
          onClose={() => {
            setInvoiceModalOpen(false);
            setSelectedBill(null);
          }}
          bill={selectedBill}
          restaurant={selectedBill.restaurants}
          onMarkPaid={async () => {
            await handleMarkAsPaid(selectedBill.id);
            setInvoiceModalOpen(false);
            setSelectedBill(null);
          }}
        />
      )}

      {/* Send Reminder Modal */}
      {selectedBill && (
        <SendReminderModal
          isOpen={reminderModalOpen}
          onClose={() => {
            setReminderModalOpen(false);
            setSelectedBill(null);
          }}
          restaurant={selectedBill.restaurants}
          bill={selectedBill}
        />
      )}
    </div>
  );
}
