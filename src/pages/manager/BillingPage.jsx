import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { CreditCard, Download, Clock, CheckCircle, AlertCircle, XCircle, Calendar, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import logger from '@shared/utils/helpers/logger';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [currentBill, setCurrentBill] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Initialize: fetch user and their restaurant
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          throw new Error('User not authenticated');
        }
        setUser(authUser);

        // Get user's restaurant
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('restaurant_id')
          .eq('id', authUser.id)
          .single();

        if (userError) {
          console.error('Error fetching user restaurant:', userError);
          throw new Error('Could not load your restaurant');
        }

        if (!userData?.restaurant_id) {
          logger.log('User has no restaurant assigned');
          setLoading(false);
          return;
        }

        // Get restaurant details
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', userData.restaurant_id)
          .single();

        if (restaurantError) {
          throw restaurantError;
        }

        setCurrentRestaurant(restaurantData);
      } catch (error) {
        console.error('Error initializing billing page:', error);
        toast.error(error.message || 'Failed to load billing data');
      }
    };

    initializeData();
  }, []);

  const fetchBillingData = useCallback(async () => {
    if (!currentRestaurant?.id) return;

    try {
      setLoading(true);

      // Fetch subscription details
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }
      setSubscription(subData);

      // Fetch current month bill
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: billData, error: billError } = await supabase
        .from('billing')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .eq('billing_month', currentMonth)
        .eq('billing_year', currentYear)
        .maybeSingle();

      if (billError && billError.code !== 'PGRST116') {
        throw billError;
      }
      setCurrentBill(billData);

      // Fetch payment history
      const { data: historyData, error: historyError } = await supabase
        .from('billing')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('billing_year', { ascending: false })
        .order('billing_month', { ascending: false })
        .limit(12);

      if (historyError) throw historyError;
      setPaymentHistory(historyData || []);

    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  }, [currentRestaurant?.id]);

  useEffect(() => {
    fetchBillingData();
  }, [currentRestaurant?.id, fetchBillingData]);

  const handlePayNow = async () => {
    if (!currentBill) {
      toast.error('No bill found for current month');
      return;
    }

    if (currentBill.status === 'paid') {
      toast.error('This bill has already been paid');
      return;
    }

    try {
      setProcessingPayment(true);

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      await new Promise((resolve) => {
        script.onload = resolve;
      });

      // Call Edge Function to create Razorpay order
      const { data: authData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.session?.access_token}`
          },
          body: JSON.stringify({
            billingId: currentBill.id,
            restaurantId: currentRestaurant.id
          })
        }
      );

      const orderData = await response.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Initialize Razorpay checkout
      const options = {
        key: orderData.razorpayKey,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Praahis Platform',
        description: `Subscription Bill - ${getMonthName(currentBill.billing_month)} ${currentBill.billing_year}`,
        order_id: orderData.order.id,
        prefill: {
          name: currentRestaurant.name,
          email: user?.email || ''
        },
        theme: {
          color: '#EA580C'
        },
        handler: async function (response) {
          await handlePaymentSuccess(response, orderData.order.amount / 100);
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        handlePaymentFailure(response.error);
      });
      razorpay.open();

    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (response, amount) => {
    try {
      // Call Edge Function to verify payment
      const { data: authData } = await supabase.auth.getSession();
      const verifyResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-subscription-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.session?.access_token}`
          },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            billingId: currentBill.id,
            restaurantId: currentRestaurant.id,
            amount: amount
          })
        }
      );

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      toast.success('Payment successful! Your subscription has been extended.');
      
      // Refresh billing data
      await fetchBillingData();
      
      // Reload page to update restaurant status
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error(error.message || 'Payment verification failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    toast.error(`Payment failed: ${error.description || 'Unknown error'}`);
    setProcessingPayment(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Paid' },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Overdue' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Cancelled' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getSubscriptionStatusBadge = (status) => {
    const badges = {
      trial: { color: 'bg-blue-100 text-blue-800', text: 'Trial' },
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      grace: { color: 'bg-yellow-100 text-yellow-800', text: 'Grace Period' },
      suspended: { color: 'bg-red-100 text-red-800', text: 'Suspended' },
      expired: { color: 'bg-gray-100 text-gray-800', text: 'Expired' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' }
    };

    const badge = badges[status] || badges.active;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
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

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const subscriptionEndDate = subscription?.current_period_end || subscription?.end_date;
  const daysRemaining = getDaysRemaining(subscriptionEndDate);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Pay invoices here. To change plan, tables, or staff caps, use Subscription.</p>
        </div>
        <a
          href="/manager/subscription"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-colors"
        >
          Manage Subscription
        </a>
      </div>

      {/* Subscription Status Card */}
      {subscription && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Subscription Status</h2>
              <div className="flex items-center gap-3 mb-4">
                {getSubscriptionStatusBadge(subscription.status)}
                {daysRemaining !== null && daysRemaining > 0 && (
                  <span className="text-sm opacity-90">
                    {daysRemaining} days remaining
                  </span>
                )}
                {daysRemaining !== null && daysRemaining <= 0 && (
                  <span className="text-sm opacity-90 font-semibold">
                    Expired
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm opacity-90">
                <p>Plan: {subscription.plan_name || 'Per-Table Plan'}</p>
                <p>Valid until: {formatDate(subscriptionEndDate)}</p>
                {subscription.next_billing_date && (
                  <p>Next billing: {formatDate(subscription.next_billing_date)}</p>
                )}
              </div>
            </div>
            <Calendar className="w-12 h-12 opacity-50" />
          </div>
        </div>
      )}

      {/* Current Bill Card */}
      {currentBill ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Current Month Bill</h2>
              <p className="text-gray-600 mt-1">
                {getMonthName(currentBill.billing_month)} {currentBill.billing_year}
              </p>
            </div>
            {getStatusBadge(currentBill.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-4">Billing Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Number:</span>
                  <span className="font-medium">{currentBill.invoice_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing Period:</span>
                  <span className="font-medium">
                    {getMonthName(currentBill.billing_month)} {currentBill.billing_year}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium">{formatDate(currentBill.due_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Grace Period Ends:</span>
                  <span className="font-medium">{formatDate(currentBill.grace_end_date)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-4">Usage & Charges</h3>
              <div className="space-y-3">
                {currentBill.pricing_type === 'per_table' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number of Tables:</span>
                      <span className="font-medium">{currentBill.table_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate per Table/Day:</span>
                      <span className="font-medium">₹{currentBill.rate_per_table_per_day}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days in Month:</span>
                      <span className="font-medium">{currentBill.days_in_month}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Amount:</span>
                      <span className="font-medium">{formatCurrency(currentBill.base_amount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Custom Monthly Plan:</span>
                    <span className="font-medium">{formatCurrency(currentBill.custom_amount)}</span>
                  </div>
                )}
                {currentBill.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-{formatCurrency(currentBill.discount_amount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-2xl font-bold text-gray-900">Total Amount</span>
              <span className="text-3xl font-bold text-orange-600">
                {formatCurrency(currentBill.total_amount)}
              </span>
            </div>

            {currentBill.status !== 'paid' && (
              <button
                onClick={handlePayNow}
                disabled={processingPayment}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pay Now</span>
                  </>
                )}
              </button>
            )}

            {currentBill.status === 'paid' && currentBill.paid_at && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">
                  Paid on {formatDate(currentBill.paid_at)}
                </p>
                {currentBill.receipt_url && (
                  <a
                    href={currentBill.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-green-700 hover:text-green-800 font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download Receipt
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No bill generated for current month</p>
          {subscription?.status === 'trial' && (
            <p className="text-sm mt-2">You are currently on a free trial</p>
          )}
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h2>
        
        {paymentHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentHistory.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getMonthName(bill.billing_month)} {bill.billing_year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bill.invoice_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(bill.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(bill.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(bill.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bill.paid_at ? formatDate(bill.paid_at) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {bill.receipt_url && (
                        <a
                          href={bill.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Receipt
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No payment history found</p>
          </div>
        )}
      </div>
    </div>
  );
}
