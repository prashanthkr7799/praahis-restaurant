import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CreditCard, ArrowLeft, CheckCircle, AlertCircle, Plus, Minus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getOrder, updatePaymentStatus, createPayment, updateOrder } from '@shared/utils/api/supabaseClient';
import { getTestCardDetails, initializeRazorpayPayment } from '@/domains/billing/utils/razorpayHelper';
import { formatCurrency, calculateSubtotal, calculateTax, calculateTotal } from '@domains/ordering/utils/orderHelpers';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import ErrorMessage from '@shared/components/feedback/ErrorMessage';

// Framer Motion component for animations
const MotionDiv = motion.div;

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
            } else if (
              (import.meta.env.MODE === 'development' || import.meta.env.VITE_PAYMENT_DEV_BYPASS === 'true')
            ) {
              // Developer bypass: simulate success to keep demo flow unblocked
              console.warn('Dev bypass enabled: simulating successful payment.');
              const fake = {
                razorpay_payment_id: `pay_${order.id}_${Date.now()}`,
                razorpay_order_id: `order_${order.id}_${Date.now()}`,
                razorpay_signature: 'dev_bypass_signature'
              };
              handlePaymentSuccess(fake, fake.razorpay_order_id);
              return;
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
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="large" text="Loading order..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ErrorMessage error={error} onRetry={loadOrder} />
      </div>
    );
  }

  const testCards = getTestCardDetails();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
  {/* Global Toaster is provided in App.jsx; avoid per-page Toaster to prevent duplicates */}

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Link
            to={`/table/${order.table_id}`}
            className="rounded-full p-2 text-muted-foreground hover:text-white transition-colors"
            aria-label="Back to table"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Payment</h1>
            <p className="text-sm text-muted-foreground">Order #{order.order_number}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="rounded-xl bg-card p-6 shadow-lg border border-border"
        >
          {/* Order Summary */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Order Summary</h2>
              <p className="text-sm text-muted-foreground">Edit items before payment</p>
            </div>
            <div className="space-y-2">
              {orderItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 py-4 border-b border-border last:border-b-0">
                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    {item.special_notes && (
                      <p className="text-xs text-muted-foreground truncate">Note: {item.special_notes}</p>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <button
                        onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                        className="h-8 w-8 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                        className="h-8 w-8 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <span className="w-20 text-right font-semibold tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="rounded-md p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {orderItems.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">Your order is empty</p>
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
            <div className="h-px bg-border mb-4" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatCurrency(isEditing ? calculateUpdatedTotals().subtotal : order.subtotal_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (5%)</span>
                <span className="font-semibold">{formatCurrency(isEditing ? calculateUpdatedTotals().tax : order.tax_amount)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-orange-400">{formatCurrency(isEditing ? calculateUpdatedTotals().total : order.total_amount)}</span>
              </div>
            </div>
          </div>
          
          {/* Save Changes Button */}
          {isEditing && orderItems.length > 0 && (
            <button
              onClick={handleSaveChanges}
              disabled={processing}
              className="w-full mb-4 h-12 rounded-lg bg-muted hover:bg-white/10 text-foreground font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Saving...' : 'Save Changes'}
            </button>
          )}

          {/* Table info */}
          <div className="mb-6">
            <label htmlFor="table-number" className="block text-sm font-medium mb-2">Table Number</label>
            <input
              id="table-number"
              value={order.tables?.table_number ? `#${order.tables.table_number}` : 'N/A'}
              readOnly
              className="w-full rounded-md bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/70"
            />
          </div>

          {/* Payment button */}
          <button
            onClick={handlePayment}
            disabled={processing || isEditing || orderItems.length === 0}
            className="w-full h-14 rounded-xl bg-orange-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:bg-orange-500/90 focus:outline-none focus:ring-2 focus:ring-orange-500/70 disabled:opacity-50 disabled:pointer-events-none"
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
                <CheckCircle className="h-5 w-5" />
                Complete Order (Test Payment)
              </span>
            )}
          </button>
          
          {isEditing && (
            <p className="mt-2 text-center text-sm text-orange-600">
              Please save your changes before proceeding to payment
            </p>
          )}

          {/* Test mode info */}
          <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-400" />
              <div className="text-sm text-green-300">
                <p className="font-semibold">✅ Demo Mode - Auto Payment</p>
                <p className="mt-1">
                  Click the button above to automatically complete payment and proceed to order tracking.
                </p>
                <button
                  onClick={() => setShowTestCards(!showTestCards)}
                  className="mt-2 underline hover:opacity-90"
                >
                  {showTestCards ? 'Hide' : 'Show'} test card details
                </button>
              </div>
            </div>

            {/* Test card details */}
            {showTestCards && (
              <div className="mt-4 space-y-3 border-t border-green-500/20 pt-4">
                {testCards.cards.map((card, index) => (
                  <div key={index} className="rounded-lg bg-card border border-border p-3">
                    <p className="font-semibold">{card.name}</p>
                    <p className="mt-1 font-mono text-sm">{card.number}</p>
                    <p className="text-xs text-muted-foreground">
                      CVV: {card.cvv} | Expiry: {card.expiry}
                    </p>
                    <p className="mt-1 text-xs text-green-300/90">{card.description}</p>
                  </div>
                ))}
                <div className="rounded-lg bg-card border border-border p-3">
                  <p className="font-semibold">UPI Test ID</p>
                  <p className="mt-1 font-mono text-sm">{testCards.upi.id}</p>
                  <p className="mt-1 text-xs text-green-300/90">{testCards.upi.description}</p>
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
