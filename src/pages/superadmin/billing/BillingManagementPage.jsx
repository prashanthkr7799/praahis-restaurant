import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/utils/api/supabaseClient';
import { Download, Search, Filter, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingManagementPage() {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    paidThisMonth: 0,
    overdueCount: 0
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

      console.log('Fetched bills:', billsData);
      setBills(billsData || []);
      calculateStats(billsData || []);

    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

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
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      overdue: { color: 'bg-red-100 text-red-800', text: 'Overdue' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage restaurant subscriptions</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.pendingAmount)}
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.paidThisMonth)}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue Bills</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.overdueCount}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-red-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by restaurant name or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {bill.restaurants?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bill.restaurants?.slug || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bill.invoice_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getMonthName(bill.billing_month)} {bill.billing_year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {bill.pricing_type === 'per_table' 
                          ? `${bill.table_count} tables`
                          : 'Custom'
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {bill.pricing_type === 'per_table'
                          ? `₹${bill.rate_per_table_per_day}/table/day`
                          : formatCurrency(bill.custom_amount || 0)
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(bill.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(bill.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(bill.due_date)}</div>
                      {bill.status === 'paid' && bill.paid_at && (
                        <div className="text-xs text-green-600">
                          Paid: {formatDate(bill.paid_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {bill.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(bill.id)}
                            className="text-orange-600 hover:text-orange-700 font-medium"
                          >
                            Mark Paid
                          </button>
                        )}
                        {bill.receipt_url && (
                          <a
                            href={bill.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Receipt
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No billing records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
