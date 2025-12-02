import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  RefreshCw, 
  TrendingUp, 
  AlertCircle,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { supabase } from '@config/supabase';
import { formatCurrency, formatDateTime } from '@shared/utils/formatters';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useRestaurant } from '@shared/hooks/useRestaurant';

const PaymentsTrackingPage = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    method: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    refundedAmount: 0,
    successfulPayments: 0,
  });

  const { restaurantId } = useRestaurant();

  const calculateStats = useCallback((data) => {
    const totalRevenue = data
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + (p.total || 0), 0);

    const pendingAmount = data
      .filter(p => p.payment_status === 'pending')
      .reduce((sum, p) => sum + (p.total || 0), 0);

    const refundedAmount = data
      .filter(p => p.payment_status === 'refunded')
      .reduce((sum, p) => sum + (p.total || 0), 0);

    const successfulPayments = data.filter(p => p.payment_status === 'paid').length;

    setStats({
      totalRevenue,
      pendingAmount,
      refundedAmount,
      successfulPayments
    });
  }, []);

  const loadPayments = useCallback(async () => {
    if (!restaurantId) return;
    
    setLoading(true);
    try {
      // Fetch orders with payment info
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPayments(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, calculateStats]);

  const applyFilters = useCallback(() => {
    let filtered = [...payments];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        (p.order_number && p.order_number.toLowerCase().includes(searchLower)) ||
        (p.id && p.id.toLowerCase().includes(searchLower))
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.payment_status === filters.status);
    }

    if (filters.method !== 'all') {
      filtered = filtered.filter(p => p.payment_method === filters.method);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(p => new Date(p.created_at) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(p => new Date(p.created_at) <= new Date(filters.dateTo + 'T23:59:59'));
    }

    setFilteredPayments(filtered);
  }, [payments, filters]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  if (loading && !payments.length) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white text-glow tracking-tight">Payments</h1>
          <p className="text-zinc-400 mt-1">Track transactions and revenue</p>
        </div>
        <button className="glass-button-primary">
          <Download size={20} />
          <span>Export Report</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={48} />
          </div>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
          <h3 className="text-2xl font-bold text-white mt-2 font-mono-nums text-glow">
            {formatCurrency(stats.totalRevenue)}
          </h3>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={48} />
          </div>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Pending Amount</p>
          <h3 className="text-2xl font-bold text-amber-400 mt-2 font-mono-nums">
            {formatCurrency(stats.pendingAmount)}
          </h3>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <RefreshCw size={48} />
          </div>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Refunded</p>
          <h3 className="text-2xl font-bold text-rose-400 mt-2 font-mono-nums">
            {formatCurrency(stats.refundedAmount)}
          </h3>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle size={48} />
          </div>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Success Rate</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2 font-mono-nums">
            {payments.length > 0 ? Math.round((stats.successfulPayments / payments.length) * 100) : 0}%
          </h3>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Order ID..." 
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-primary/50 outline-none"
          />
        </div>
        
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary/50 outline-none"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select 
            value={filters.method}
            onChange={(e) => setFilters({...filters, method: e.target.value})}
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary/50 outline-none"
          >
            <option value="all">All Methods</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
          </select>

          <input 
            type="date" 
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary/50 outline-none"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-xs uppercase text-zinc-500">
              <tr>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        payment.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 
                        payment.payment_status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {payment.payment_status === 'paid' ? <ArrowDownLeft size={18} /> : <Clock size={18} />}
                      </div>
                      <div>
                        <p className="text-white font-medium font-mono-nums">#{payment.order_number || payment.id.slice(0, 8)}</p>
                        <p className="text-xs text-zinc-400">Order ID</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-300 text-sm">
                    {formatDateTime(payment.created_at)}
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-zinc-300 flex items-center gap-2">
                      <CreditCard size={14} />
                      {payment.payment_method || 'Unknown'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wide ${
                      payment.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      payment.payment_status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {payment.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-white font-mono-nums text-lg">
                    {formatCurrency(payment.total)}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleViewDetails(payment)}
                      className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPayments.length === 0 && (
          <div className="p-12 text-center text-zinc-500">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p>No transactions found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                <span className="text-zinc-400">Total Amount</span>
                <span className="text-2xl font-bold text-white font-mono-nums">{formatCurrency(selectedPayment.total)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl space-y-1">
                  <span className="text-xs text-zinc-500 uppercase">Status</span>
                  <p className={`font-medium capitalize ${
                    selectedPayment.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {selectedPayment.payment_status}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl space-y-1">
                  <span className="text-xs text-zinc-500 uppercase">Method</span>
                  <p className="font-medium text-white capitalize">
                    {selectedPayment.payment_method || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Order ID</span>
                  <span className="text-white font-mono-nums">{selectedPayment.order_number || selectedPayment.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Date</span>
                  <span className="text-white">{formatDateTime(selectedPayment.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Table</span>
                  <span className="text-white">Table {selectedPayment.table_number}</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="w-full glass-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsTrackingPage;
