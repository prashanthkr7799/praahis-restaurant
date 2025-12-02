import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ChefHat, UtensilsCrossed, Bell, Receipt, MapPin, ShoppingBag } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getOrder, subscribeToOrder } from '@config/supabase';
import { formatCurrency, getOrderStatusText, getEstimatedTime } from '@features/orders/utils/orderHelpers';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import ErrorMessage from '@shared/components/feedback/ErrorMessage';

const OrderStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const lastStatusRef = useRef(null);
  const [servedCountdown, setServedCountdown] = useState(null); // 2-minute countdown in seconds

  // SECURITY: Check if this session is already completed
  useEffect(() => {
    if (sessionStorage.getItem('order_completed') === 'true') {
      navigate('/thank-you', { replace: true });
    }
  }, [navigate]);

  // Block backward navigation after payment is completed
  useEffect(() => {
    const paymentCompleted = sessionStorage.getItem('payment_completed') === 'true';
    
    if (paymentCompleted) {
      // Push multiple states to create a deep history buffer
      for (let i = 0; i < 10; i++) {
        window.history.pushState({ paymentComplete: true }, '', window.location.href);
      }
      
      const handlePopState = (_e) => {
        // Prevent going back - push state again
        window.history.pushState({ paymentComplete: true }, '', window.location.href);
        toast('You cannot go back after payment', { icon: '🔒', duration: 2000 });
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  // Load order function
  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const orderData = await getOrder(orderId);
      setOrder(orderData);
      // Track last seen status to avoid setState during render when notifying
      lastStatusRef.current = orderData.order_status || orderData.status;
    } catch (err) {
      console.error('Error loading order:', err);
      setError(err.message || 'Failed to load order. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Start 2-minute countdown when order is served, then redirect to post-meal options
  // Use a ref to track if countdown has already started to prevent resetting
  const countdownStartedRef = React.useRef(false);
  
  useEffect(() => {
    // If countdown already started, don't reset it
    if (countdownStartedRef.current) return;
    
    const items = Array.isArray(order?.items) ? order.items : (order ? JSON.parse(order.items || '[]') : []);
    const total = items.length;
    const servedCt = items.filter((it) => (it.item_status || order?.status) === 'served').length;
    const allServed = total > 0 && servedCt === total;
    
    if (order && (order.status === 'served' || allServed) && order.session_id) {
      // Start 2-minute (120 seconds) countdown - only once
      countdownStartedRef.current = true;
      setServedCountdown(120);
    }
  }, [order]);

  // Countdown timer effect - navigate when countdown reaches 0
  useEffect(() => {
    if (servedCountdown === null || servedCountdown < 0) return;
    
    if (servedCountdown === 0 && order?.session_id) {
      // Countdown finished - redirect to post-meal options
      navigate(`/post-meal/${order.session_id}/${order.table_number}`, { replace: true });
      return;
    }
    
    const timer = setTimeout(() => {
      setServedCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [servedCountdown, order, navigate]);

  // Load order and setup real-time subscription
  useEffect(() => {
    if (!orderId) {
      setError('Invalid order ID');
      setLoading(false);
      return;
    }

    loadOrder();

    let pollingInterval = null;
    let subscription = null;

    // Try to subscribe to real-time updates
    try {
      subscription = subscribeToOrder(orderId, (payload) => {
        if (payload.new) {
          // Compare previous status via ref to compute notifications outside setState
          const prevStatus = lastStatusRef.current;
          const newStatus = payload.new.order_status || payload.new.status;
          if (prevStatus && newStatus !== prevStatus) {
            toast.success(`Order status updated: ${getOrderStatusText(newStatus)}`, {
              icon: '🔔',
              duration: 4000,
              style: {
                background: '#1a1f2e',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            });
          }
          lastStatusRef.current = newStatus;
          setOrder({
            ...payload.new,
            status: newStatus,
          });
        }
      });

      // Also setup polling as fallback (every 5 seconds for better UX)
      pollingInterval = setInterval(async () => {
        try {
          const updatedOrder = await getOrder(orderId);
          const prevStatus = lastStatusRef.current;
          const newStatus = updatedOrder.order_status || updatedOrder.status;
          if (prevStatus && newStatus !== prevStatus) {
            toast.success(`Order status updated: ${getOrderStatusText(newStatus)}`, {
              icon: '🔔',
              duration: 4000,
              style: {
                background: '#1a1f2e',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            });
          }
          lastStatusRef.current = newStatus;
          setOrder(updatedOrder);
        } catch (pollError) {
          console.error('❌ Polling error:', pollError);
          // Don't set error state on polling failures
        }
      }, 5000); // Poll every 5 seconds

      return () => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      };
    } catch (subError) {
      console.error('⚠️ Realtime subscription failed, using polling only:', subError);
      
      // Setup polling only (5 seconds for responsive UX)
      pollingInterval = setInterval(async () => {
        try {
          const updatedOrder = await getOrder(orderId);
          const prevStatus = lastStatusRef.current;
          const newStatus = updatedOrder.order_status || updatedOrder.status;
          if (prevStatus && newStatus !== prevStatus) {
            toast.success(`Order status updated: ${getOrderStatusText(newStatus)}`, {
              icon: '🔔',
              duration: 4000,
              style: {
                background: '#1a1f2e',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            });
          }
          lastStatusRef.current = newStatus;
          setOrder(updatedOrder);
        } catch (pollError) {
          console.error('❌ Polling error:', pollError);
          // Don't set error state on polling failures
        }
      }, 5000); // Poll every 5 seconds

      return () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      };
    }
  }, [orderId, loadOrder]); // loadOrder is stable with useCallback

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <LoadingSpinner text="Loading your order..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <ErrorMessage error={error} onRetry={loadOrder} />
      </div>
    );
  }

  // Safely parse items
  let orderItems = [];
  try {
    orderItems = Array.isArray(order?.items) ? order.items : JSON.parse(order?.items || '[]');
  } catch {
    orderItems = [];
  }
  const totalCount = orderItems.length;
  const deriveItemStatus = (item) => item?.item_status || item?.status || order?.status || 'received';
  const servedCount = orderItems.filter((it) => deriveItemStatus(it) === 'served').length;
  const estimatedTime = getEstimatedTime(orderItems);

  const status = order?.order_status || order?.status;

  // Totals for order details (fallbacks if DB fields missing)
  const computedSubtotal = typeof order?.subtotal_amount === 'number'
    ? order.subtotal_amount
    : orderItems.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity || 0)), 0);
  const computedTax = typeof order?.tax_amount === 'number'
    ? order.tax_amount
    : Math.round(computedSubtotal * 0.05);
  const computedTotal = typeof order?.total_amount === 'number'
    ? order.total_amount
    : computedSubtotal + computedTax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-transparent backdrop-blur-2xl border-b border-white/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Order Status
                <span className="px-3 py-1 rounded-xl bg-white/5 text-sm font-mono text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/10">
                  #{order?.order_number || order?.id?.slice(0, 8)}
                </span>
              </h1>
              {status !== 'served' && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">Live Updates Enabled</span>
                </div>
              )}
            </div>
            
            {/* Table Badge */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 shadow-lg shadow-orange-500/10">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-400">
                Table {order?.table_number || order?.tables?.table_number || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        
        {/* Success banner after payment */}
        {order?.payment_status === 'paid' && (
          <Motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 flex items-center gap-4 shadow-xl shadow-emerald-900/20 backdrop-blur-sm"
          >
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-400">Payment Successful</h3>
              <p className="text-sm text-emerald-300/80">Your order has been confirmed and is being processed.</p>
            </div>
          </Motion.div>
        )}

        {/* Two-column responsive grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Left: Order Progress (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden relative"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                Track Order
              </h2>

              {/* Stepper */}
              <div className="relative pl-2">
                {[
                  { active: ['received', 'preparing', 'ready', 'served'].includes(status), icon: Receipt, label: 'Order Received', description: "We've received your order and sent it to the kitchen." },
                  { active: ['preparing', 'ready', 'served'].includes(status), icon: ChefHat, label: 'Preparing', description: "Our chefs are cooking your delicious meal." },
                  { active: ['ready', 'served'].includes(status), icon: Bell, label: 'Ready', description: "Your food is plated and ready to be served." },
                  { active: ['served'].includes(status) || (servedCount === totalCount && totalCount > 0), icon: UtensilsCrossed, label: 'Served', description: "Enjoy your meal! Bon appétit.", isLast: true }
                ].map((step, idx) => (
                  <div key={idx} className="relative flex gap-6 pb-12 last:pb-0">
                    {/* Line */}
                    {!step.isLast && (
                      <div className={`absolute left-[22px] top-12 bottom-0 w-0.5 ${step.active ? 'bg-gradient-to-b from-orange-500 to-slate-700' : 'bg-white/5'}`}></div>
                    )}
                    
                    {/* Icon Bubble */}
                    <div className={`relative z-10 flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      step.active 
                        ? 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-110' 
                        : 'bg-slate-800 border-white/10 text-zinc-600'
                    }`}>
                      <step.icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className={`pt-1 transition-all duration-500 ${step.active ? 'opacity-100 translate-x-0' : 'opacity-40'}`}>
                      <h3 className={`font-bold text-lg ${step.active ? 'text-white' : 'text-zinc-500'}`}>{step.label}</h3>
                      <p className="text-sm text-zinc-400 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Estimated time */}
              {status !== 'served' && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-orange-500/20 rounded-xl text-orange-400 ring-2 ring-orange-500/20">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Estimated Wait</p>
                        <p className="text-lg font-bold text-white">~{estimatedTime} mins</p>
                      </div>
                    </div>
                    <div className="h-10 w-[1px] bg-white/10"></div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Status</p>
                      <p className="text-lg font-bold text-orange-400 capitalize">{status}</p>
                    </div>
                  </div>
                </div>
              )}
            </Motion.section>
          </div>

          {/* Right: Order details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl overflow-hidden"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-zinc-400" />
                Order Details
              </h2>

              <div className="space-y-4">
                {/* Items List */}
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-start justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400 mt-0.5">
                          {item.quantity}x
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          {item.special_notes && (
                            <p className="text-xs text-orange-400/80 italic mt-1">"{item.special_notes}"</p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-zinc-300 tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Bill Summary */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                  <div className="flex justify-between text-sm text-zinc-400">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(computedSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-400">
                    <span>Tax (5%)</span>
                    <span className="tabular-nums">{formatCurrency(computedTax)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-base font-bold text-white">Total Amount</span>
                    <span className="text-xl font-bold text-orange-400 tabular-nums">{formatCurrency(computedTotal)}</span>
                  </div>
                </div>
              </div>
            </Motion.section>

            {/* Order More Card - Always available on Order Status */}
            <div className="bg-gradient-to-br from-amber-600/10 to-orange-600/10 border border-amber-500/20 rounded-2xl p-6 text-center backdrop-blur-sm">
              <p className="text-sm text-amber-200 mb-3">Want to add more items?</p>
              <button 
                onClick={() => {
                  const tableNum = order?.table_number || order?.tables?.table_number;
                  if (tableNum) {
                    navigate(`/table/${tableNum}`);
                  } else {
                    toast.error('Unable to navigate to menu');
                  }
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-white font-semibold transition-all border border-amber-500/20 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Order More
              </button>
            </div>
          </div>
        </div>

        {/* Countdown message when served */}
        {status === 'served' && servedCountdown !== null && servedCountdown > 0 && (
          <Motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-full shadow-2xl shadow-emerald-500/40 flex items-center gap-3 z-50 ring-2 ring-emerald-400/30"
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="font-bold">Enjoy your meal! Redirecting in {Math.floor(servedCountdown / 60)}:{String(servedCountdown % 60).padStart(2, '0')}</span>
          </Motion.div>
        )}
      </main>
    </div>
  );
};

export default OrderStatusPage;
