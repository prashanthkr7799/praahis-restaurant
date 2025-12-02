import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, CheckCircle, AlertCircle, Plus, Minus, Trash2 } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getOrder, updatePaymentStatus, createPayment, updateOrder, supabase } from '@config/supabase';
import { getTestCardDetails, initializeRazorpayPayment } from '@features/billing/utils/razorpayHelper';
import { formatCurrency, calculateSubtotal, calculateTax, calculateTotal } from '@features/orders/utils/orderHelpers';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import ErrorMessage from '@shared/components/feedback/ErrorMessage';

// Framer Motion component for animations
const MotionDiv = Motion.div;

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showTestCards, setShowTestCards] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // SECURITY: Check if this session is already completed
  useEffect(() => {
    if (sessionStorage.getItem('order_completed') === 'true') {
      navigate('/thank-you', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    loadOrder();
    return () => {
      // Ensure any lingering toasts are dismissed when leaving payment page
      try { toast.dismiss(); } catch { /* cleanup */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Handle going back - cancel the pending order so it doesn't appear in dashboards
  const handleGoBack = useCallback(async () => {
    if (!order) {
      navigate(-1);
      return;
    }
    
    try {
      // Delete the pending_payment order since customer is going back to modify
      if (order.order_status === 'pending_payment' && order.payment_status !== 'paid') {
        await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);
      }
      
      // Navigate back to the table page
      navigate(`/table/${order.table_id}`, { replace: true });
    } catch (err) {
      console.error('Error cancelling order:', err);
      // Still navigate back even if deletion fails
      navigate(`/table/${order.table_id}`, { replace: true });
    }
  }, [order, navigate]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const orderData = await getOrder(orderId);
      setOrder(orderData);
      
      // Initialize editable order items
      const items = Array.isArray(orderData.items) ? orderData.items : JSON.parse(orderData.items || '[]');
      setOrderItems(items);

      // If already paid, redirect to order status
      if (orderData.payment_status === 'paid') {
        navigate(`/order-status/${orderId}`, { replace: true });
      }
    } catch (err) {
      console.error('Error loading order:', err);
      setError(err.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription + Polling to auto-redirect when payment is confirmed
  useEffect(() => {
    if (!orderId) return;

    // 1. Real-time Subscription
    const channel = supabase
      .channel(`payment-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new.payment_status === 'paid') {
            toast.success('Payment Confirmed! Redirecting...');
            setTimeout(() => {
              navigate(`/order-status/${orderId}`, { replace: true });
            }, 1000);
          }
        }
      )
      .subscribe();

    // 2. Polling Fallback (every 3 seconds)
    const pollInterval = setInterval(async () => {
      try {
        const { data, error: _error } = await supabase
          .from('orders')
          .select('payment_status')
          .eq('id', orderId)
          .single();
        
        if (data && data.payment_status === 'paid') {
          toast.success('Payment Confirmed! Redirecting...');
          clearInterval(pollInterval);
          navigate(`/order-status/${orderId}`, { replace: true });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [orderId, navigate]);

  const handlePayment = async () => {
    try {
      setProcessing(true);

      // Validate restaurant ID exists
      if (!order.restaurant_id) {
        throw new Error('Restaurant ID is missing from order. Please refresh and try again.');
      }

      // Initialize Razorpay payment with restaurant-specific credentials
      // NOTE: For test mode, we use direct payment (no pre-created order_id)
      // Production should create order via Edge Function before this step
      const totalValue = isEditing ? calculateUpdatedTotals().total : (typeof order.total_amount === 'number' ? order.total_amount : Number(order.total || 0));
      await initializeRazorpayPayment(
        {
          orderId: order.id,
          orderNumber: order.order_number || order.id.substring(0, 8),
          total: totalValue,
          restaurantId: order.restaurant_id, // CRITICAL: Restaurant-specific payment keys
          tableNumber: order.tables?.table_number || 'N/A',
          restaurantName: order.restaurants?.name || 'Restaurant',
          customerName: order.customer_name || '',
          customerEmail: order.customer_email || '',
          customerPhone: order.customer_phone || '',
        },
        {
          onSuccess: async (response) => {
            // Razorpay returns razorpay_order_id in response for direct payments
            await handlePaymentSuccess(response, response.razorpay_order_id);
          },
          onFailure: (error) => {
            console.error('Payment failed:', error);
            if (error?.reason === 'international_transaction_not_allowed') {
              setShowTestCards(true);
              toast.error('Use an Indian test method: Visa 4111 1111 1111 1111, MasterCard 5104 0600 0000 0008, or UPI success@razorpay');
            } else {
              toast.error(error.description || error.message || 'Payment failed. Please try again.');
            }
            setProcessing(false);
          },
          onDismiss: () => {
            toast.info('Payment cancelled');
            setProcessing(false);
          },
        }
      );
    } catch (err) {
      console.error('Error processing payment:', err);
      
      // Show user-friendly error messages
      if (err.message?.includes('Restaurant ID')) {
        toast.error('Configuration error. Please contact restaurant staff.');
      } else if (err.message?.includes('Payment gateway is not enabled')) {
        toast.error('Online payments are not available. Please pay at the counter.');
      } else if (err.message?.includes('failed to load')) {
        toast.error('Payment gateway not loaded. Check your internet connection.');
      } else {
        toast.error('Failed to process payment. Please try again.');
      }
      
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (razorpayResponse, razorpayOrderId) => {
    try {
      // Validate we have restaurant_id
      if (!order.restaurant_id) {
        console.error('Missing restaurant_id in order:', order);
        // Try to get it from the order again
        const freshOrder = await getOrder(order.id);
        if (!freshOrder.restaurant_id) {
          throw new Error('Order is missing restaurant_id. Please contact support with order ID: ' + order.id);
        }
        order.restaurant_id = freshOrder.restaurant_id;
      }
      
      // Create payment record with restaurant_id
      await createPayment({
        order_id: order.id,
        restaurant_id: order.restaurant_id,
        razorpay_order_id: razorpayOrderId || razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        amount: order.total_amount,
        currency: 'INR',
        status: 'captured',
        payment_method: 'razorpay',
        payment_details: {
          completed_at: new Date().toISOString()
        }
      });

      // Update order payment status to paid
      await updatePaymentStatus(order.id, 'paid');

      toast.success('✅ Payment successful!');

      // Mark payment complete - block backward navigation
      sessionStorage.setItem('payment_completed', 'true');
      sessionStorage.setItem('paid_order_id', order.id);

      // Replace browser history to prevent going back to menu/cart
      // Push multiple states to create a deep history buffer
      for (let i = 0; i < 10; i++) {
        window.history.pushState({ paymentComplete: true }, '', window.location.href);
      }

      // Navigate to order status page (replace history to prevent back to payment)
      setTimeout(() => {
        navigate(`/order-status/${order.id}`, { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Error in payment flow:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        stack: err.stack
      });
      
      // Show more specific error message
      if (err.message?.includes('restaurant_id')) {
        toast.error('Order configuration error. Please contact support with order ID: ' + order.id);
      } else if (err.code === '23502') {
        toast.error('Database constraint error. Missing required field. Please contact support.');
      } else if (err.code === '42501') {
        toast.error('Permission denied. Please contact support.');
      } else {
        toast.error('Payment processed but failed to update order. Please contact support with order ID: ' + order.id);
      }
    }
  };

  // Handle quantity update
  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(index);
      return;
    }
    
    const updatedItems = [...orderItems];
    updatedItems[index].quantity = newQuantity;
    setOrderItems(updatedItems);
    setIsEditing(true);
    toast.success('Item quantity updated');
  };

  // Handle item removal
  const handleRemoveItem = (index) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
    setIsEditing(true);
    toast.success('Item removed from order');
  };

  // Calculate updated totals
  const calculateUpdatedTotals = () => {
    const subtotal = calculateSubtotal(orderItems);
    const tax = calculateTax(subtotal);
    const total = calculateTotal(subtotal, tax);
    return { subtotal, tax, total };
  };

  // Save updated order
  const handleSaveChanges = async () => {
    try {
      if (orderItems.length === 0) {
        toast.error('Cannot save an empty order');
        return;
      }

      setProcessing(true);
      const { subtotal, tax, total } = calculateUpdatedTotals();

      // Update order in database
      await updateOrder(order.id, {
        items: orderItems,
        subtotal_amount: subtotal,
        tax_amount: tax,
        total_amount: total,
      });

      // Update local order state
      setOrder({
        ...order,
        items: orderItems,
        subtotal_amount: subtotal,
        tax_amount: tax,
        total_amount: total,
      });

      setIsEditing(false);
      toast.success('Order updated successfully');
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Failed to update order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <LoadingSpinner size="large" text="Loading order..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <ErrorMessage error={error} onRetry={loadOrder} />
      </div>
    );
  }

  const testCards = getTestCardDetails();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white antialiased">
  {/* Global Toaster is provided in App.jsx; avoid per-page Toaster to prevent duplicates */}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-transparent backdrop-blur-2xl border-b border-white/5">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <button
            onClick={handleGoBack}
            className="rounded-full p-2.5 bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Back to table"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Payment</h1>
            <p className="text-sm text-zinc-400">Order <span className="text-orange-400 font-mono">#{order.order_number}</span></p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="rounded-2xl bg-slate-800/50 backdrop-blur-xl p-6 shadow-xl border border-white/10"
        >
          {/* Order Summary */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Order Summary</h2>
              <p className="text-sm text-zinc-400">Edit items before payment</p>
            </div>
            <div className="space-y-2">
              {orderItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 py-4 border-b border-white/10 last:border-b-0">
                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{item.name}</p>
                    {item.special_notes && (
                      <p className="text-xs text-zinc-400 truncate">Note: {item.special_notes}</p>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                      <button
                        onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                        className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold tabular-nums text-white">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                        className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <span className="w-20 text-right font-semibold tabular-nums text-white">{formatCurrency(item.price * item.quantity)}</span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {orderItems.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-zinc-400">Your order is empty</p>
                  <Link 
                    to={`/table/${order.table_id}`}
                    className="mt-2 inline-block text-orange-400 hover:text-orange-300"
                  >
                    ← Back to menu
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="mb-6">
            <div className="h-px bg-white/10 mb-4" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span className="font-semibold text-white">{formatCurrency(isEditing ? calculateUpdatedTotals().subtotal : order.subtotal_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Tax (5%)</span>
                <span className="font-semibold text-white">{formatCurrency(isEditing ? calculateUpdatedTotals().tax : order.tax_amount)}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-orange-400">{formatCurrency(isEditing ? calculateUpdatedTotals().total : order.total_amount)}</span>
              </div>
            </div>
          </div>
          
          {/* Save Changes Button */}
          {isEditing && orderItems.length > 0 && (
            <button
              onClick={handleSaveChanges}
              disabled={processing}
              className="w-full mb-4 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Saving...' : 'Save Changes'}
            </button>
          )}

          {/* Table info */}
          <div className="mb-6">
            <label htmlFor="table-number" className="block text-sm font-medium text-zinc-400 mb-2">Table Number</label>
            <input
              id="table-number"
              value={order.tables?.table_number ? `#${order.tables.table_number}` : 'N/A'}
              readOnly
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
            />
          </div>

          {/* Payment button */}
          <button
            onClick={handlePayment}
            disabled={processing || isEditing || orderItems.length === 0}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all hover:from-orange-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:pointer-events-none"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="small" compact text="" />
                Processing Payment...
              </span>
            ) : isEditing ? (
              <span className="flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Save Changes First
              </span>
            ) : orderItems.length === 0 ? (
              <span className="flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Order is Empty
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pay Online
              </span>
            )}
          </button>

          {/* Pay via Cash Button */}
          {!isEditing && orderItems.length > 0 && (
            <button
              onClick={async () => {
                try {
                  setProcessing(true);
                  
                  // Update order to reflect cash payment request AND change status to 'received'
                  // so the order appears in dashboards for processing
                  await updateOrder(order.id, { 
                    payment_method: 'cash',
                    order_status: 'received'  // This makes the order visible in dashboards
                  });

                  const channelName = order.restaurant_id ? `waiter-alerts-${order.restaurant_id}` : 'waiter-alerts';
                  const channel = supabase.channel(channelName);
                  
                  await new Promise((resolve) => {
                    channel.subscribe((status) => {
                      if (status === 'SUBSCRIBED') {
                        channel.send({
                          type: 'broadcast',
                          event: 'request_cash_payment',
                          payload: {
                            tableNumber: order.tables?.table_number || 'Unknown',
                            orderNumber: order.order_number,
                            amount: order.total_amount,
                            at: new Date().toISOString(),
                            restaurantId: order.restaurant_id,
                          },
                        });
                        resolve();
                      }
                    });
                  });

                  // Cleanup channel after a short delay
                  setTimeout(() => supabase.removeChannel(channel), 2000);

                  // Update local order state to reflect the status change
                  setOrder(prev => ({ ...prev, order_status: 'received', payment_method: 'cash' }));

                  toast.success(
                    <div className="flex flex-col">
                      <span className="font-bold">Waiter Notified! 🔔</span>
                      <span className="text-sm">Please wait for the waiter to collect cash payment.</span>
                    </div>,
                    { duration: 5000 }
                  );

                  // Customer stays on this page until waiter confirms cash payment
                  // The page will auto-redirect when payment_status becomes 'paid'
                } catch (err) {
                  console.error('Failed to notify waiter:', err);
                  toast.error('Failed to notify waiter. Please call them manually.');
                } finally {
                  setProcessing(false);
                }
              }}
              disabled={processing}
              className="w-full mt-3 h-14 rounded-xl bg-white/5 border-2 border-orange-500/50 text-orange-400 font-bold shadow-lg hover:bg-orange-500/10 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:pointer-events-none"
            >
               💵 Pay via Cash
            </button>
          )}
          
          {isEditing && (
            <p className="mt-2 text-center text-sm text-orange-400">
              Please save your changes before proceeding to payment
            </p>
          )}

          {/* Test mode info */}
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div className="text-sm text-emerald-300">
                <p className="font-semibold">✅ Demo Mode - Auto Payment</p>
                <p className="mt-1 text-emerald-400/80">
                  Click the button above to automatically complete payment and proceed to order tracking.
                </p>
                <button
                  onClick={() => setShowTestCards(!showTestCards)}
                  className="mt-2 underline hover:opacity-90 text-emerald-400"
                >
                  {showTestCards ? 'Hide' : 'Show'} test card details
                </button>
              </div>
            </div>

            {/* Test card details */}
            {showTestCards && (
              <div className="mt-4 space-y-3 border-t border-emerald-500/20 pt-4">
                {testCards.cards.map((card, index) => (
                  <div key={index} className="rounded-xl bg-slate-800/50 border border-white/10 p-3">
                    <p className="font-semibold text-white">{card.name}</p>
                    <p className="mt-1 font-mono text-sm text-zinc-300">{card.number}</p>
                    <p className="text-xs text-zinc-400">
                      CVV: {card.cvv} | Expiry: {card.expiry}
                    </p>
                    <p className="mt-1 text-xs text-emerald-400/80">{card.description}</p>
                  </div>
                ))}
                <div className="rounded-xl bg-slate-800/50 border border-white/10 p-3">
                  <p className="font-semibold text-white">UPI Test ID</p>
                  <p className="mt-1 font-mono text-sm text-zinc-300">{testCards.upi.id}</p>
                  <p className="mt-1 text-xs text-emerald-400/80">{testCards.upi.description}</p>
                </div>
              </div>
            )}
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default PaymentPage;
