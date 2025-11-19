import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';

const Restaurants = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [transactionId, setTransactionId] = useState('');
  
  // Bulk operations state
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch restaurants
      const { data: restaurants } = await supabaseOwner
        .from('restaurants')
        .select('id, name, slug, is_active, created_at')
        .order('name');

      // Fetch managers
      const { data: managers } = await supabaseOwner
        .from('users')
        .select('id, full_name, email, restaurant_id, role')
        .eq('role', 'manager');

      // Fetch latest billing info
      const { data: billing } = await supabaseOwner
        .from('billing')
        .select('*')
        .order('billing_period', { ascending: false });

      // Create manager map
      const mgrByRest = new Map();
      (managers || []).forEach(m => {
        const list = mgrByRest.get(m.restaurant_id) || [];
        list.push(m);
        mgrByRest.set(m.restaurant_id, list);
      });

      // Create billing map (latest bill per restaurant)
      const billByRest = new Map();
      (billing || []).forEach(b => {
        if (!billByRest.has(b.restaurant_id)) {
          billByRest.set(b.restaurant_id, b);
        }
      });

      // Enrich restaurants with managers and billing
      const enriched = (restaurants || []).map(r => ({
        ...r,
        managers: mgrByRest.get(r.id) || [],
        latestBill: billByRest.get(r.id) || null,
      }));

      setRows(enriched);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = (bill) => {
    setSelectedBilling(bill);
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedBilling) return;

    setProcessing(true);
    try {
      // Call the mark_bill_as_paid function
      const { error } = await supabaseOwner.rpc('mark_bill_as_paid', {
        p_billing_id: selectedBilling.id,
        p_payment_method: paymentMethod,
        p_transaction_id: transactionId || null,
        p_verified_by: null
      });

      if (error) throw error;

      alert(`✅ Payment marked successfully! Restaurant reactivated.`);
      setShowPaymentModal(false);
      setSelectedBilling(null);
      setTransactionId('');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error marking payment:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Bulk operations functions
  const toggleSelectAll = () => {
    if (selectedRestaurants.length === rows.length) {
      setSelectedRestaurants([]);
    } else {
      setSelectedRestaurants(rows.map(r => r.id));
    }
  };

  const toggleSelectRestaurant = (restaurantId) => {
    setSelectedRestaurants(prev => {
      if (prev.includes(restaurantId)) {
        return prev.filter(id => id !== restaurantId);
      } else {
        return [...prev, restaurantId];
      }
    });
  };

  const handleBulkAction = (action) => {
    if (selectedRestaurants.length === 0) {
      alert('⚠️ Please select at least one restaurant');
      return;
    }
    setBulkAction(action);
    setShowBulkConfirm(true);
  };

  const executeBulkAction = async () => {
    setProcessing(true);
    try {
      let successCount = 0;

      if (bulkAction === 'activate') {
        // Activate selected restaurants
        const { error } = await supabaseOwner
          .from('restaurants')
          .update({ is_active: true })
          .in('id', selectedRestaurants);
        
        if (error) throw error;
        successCount = selectedRestaurants.length;
        alert(`✅ ${successCount} restaurant(s) activated successfully!`);
      } 
      else if (bulkAction === 'suspend') {
        // Suspend selected restaurants
        const { error } = await supabaseOwner
          .from('restaurants')
          .update({ is_active: false })
          .in('id', selectedRestaurants);
        
        if (error) throw error;
        successCount = selectedRestaurants.length;
        alert(`⚠️ ${successCount} restaurant(s) suspended successfully!`);
      } 
      else if (bulkAction === 'delete') {
        // Delete selected restaurants (cascade will handle related records)
        const { error } = await supabaseOwner
          .from('restaurants')
          .delete()
          .in('id', selectedRestaurants);
        
        if (error) throw error;
        successCount = selectedRestaurants.length;
        alert(`🗑️ ${successCount} restaurant(s) deleted successfully!`);
      }

      // Reset and refresh
      setSelectedRestaurants([]);
      setShowBulkConfirm(false);
      setBulkAction(null);
      fetchData();
    } catch (error) {
      console.error('Error executing bulk action:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getBillingStatusBadge = (bill) => {
    if (!bill) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-600">No Bills</span>;
    }

    switch (bill.status) {
      case 'paid':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Paid</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'overdue':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Overdue</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-gray-600">{bill.status}</span>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Restaurants & Billing</h2>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedRestaurants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedRestaurants.length} restaurant(s) selected
            </span>
            <button
              onClick={() => setSelectedRestaurants([])}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear selection
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              ✓ Activate
            </button>
            <button
              onClick={() => handleBulkAction('suspend')}
              className="px-3 py-1.5 text-sm text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
            >
              ⏸ Suspend
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-gray-900 rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRestaurants.length === rows.length && rows.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Restaurant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Manager(s)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Billing Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount Due</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-200">
              {rows.map(r => (
                <tr 
                  key={r.id}
                  className={r.latestBill?.status === 'overdue' ? 'bg-red-50' : ''}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRestaurants.includes(r.id)}
                      onChange={() => toggleSelectRestaurant(r.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {r.managers.map(m => m.full_name || m.email).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.is_active ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">✓ Active</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">✗ Suspended</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getBillingStatusBadge(r.latestBill)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {r.latestBill ? formatCurrency(r.latestBill.total_amount) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {r.latestBill ? formatDate(r.latestBill.due_date) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <Link 
                      to={`/superadmin/restaurants/${r.id}`} 
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                    {r.latestBill && r.latestBill.status !== 'paid' && (
                      <button
                        onClick={() => handleMarkAsPaid(r.latestBill)}
                        className="text-green-600 hover:underline font-medium"
                      >
                        💳 Mark as Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No restaurants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-100 mb-4">Mark Payment as Received</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <div className="text-sm text-gray-600">Restaurant</div>
                <div className="text-base font-medium text-gray-900">
                  {rows.find(r => r.id === selectedBilling.restaurant_id)?.name}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Amount</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(selectedBilling.total_amount)}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Billing Period</div>
                <div className="text-base text-gray-900">
                  {formatDate(selectedBilling.billing_period)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Manual/Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="stripe">Stripe</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction reference"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBilling(null);
                  setTransactionId('');
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 text-sm text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                disabled={processing}
                className="flex-1 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : '✓ Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Confirmation Modal */}
      {showBulkConfirm && bulkAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-100 mb-4">
              {bulkAction === 'activate' && '✓ Activate Restaurants'}
              {bulkAction === 'suspend' && '⏸ Suspend Restaurants'}
              {bulkAction === 'delete' && '🗑️ Delete Restaurants'}
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="text-sm text-gray-600">
                {bulkAction === 'activate' && (
                  <>You are about to <span className="font-semibold text-green-600">activate</span> the following restaurants:</>
                )}
                {bulkAction === 'suspend' && (
                  <>You are about to <span className="font-semibold text-yellow-600">suspend</span> the following restaurants:</>
                )}
                {bulkAction === 'delete' && (
                  <>
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                      <span className="font-semibold text-red-600">⚠️ Warning:</span> This action cannot be undone! 
                      All data including menus, items, orders, and staff will be permanently deleted.
                    </div>
                    You are about to <span className="font-semibold text-red-600">permanently delete</span> the following restaurants:
                  </>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto bg-gray-800 rounded-lg p-3 border border-gray-200">
                <ul className="space-y-1">
                  {selectedRestaurants.map(id => {
                    const restaurant = rows.find(r => r.id === id);
                    return (
                      <li key={id} className="text-sm text-gray-900">
                        • {restaurant?.name} <span className="text-gray-500">({restaurant?.slug})</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="text-sm font-medium text-gray-700">
                Total: {selectedRestaurants.length} restaurant(s)
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBulkConfirm(false);
                  setBulkAction(null);
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 text-sm text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAction}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${
                  bulkAction === 'activate' ? 'bg-green-600 hover:bg-green-700' :
                  bulkAction === 'suspend' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Restaurants;
