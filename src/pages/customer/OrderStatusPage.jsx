import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ChefHat, UtensilsCrossed, Home, Bell } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getOrder, subscribeToOrder } from '@shared/utils/api/supabaseClient';
import { formatCurrency, getOrderStatusText, getEstimatedTime } from '@domains/ordering/utils/orderHelpers';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import ErrorMessage from '@shared/components/feedback/ErrorMessage';

const OrderStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const lastStatusRef = useRef(null);

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

  // Redirect to post-meal options when order is served (or all items served)
  useEffect(() => {
    const items = Array.isArray(order?.items) ? order.items : (order ? JSON.parse(order.items || '[]') : []);
    const total = items.length;
    const servedCt = items.filter((it) => (it.item_status || order?.status) === 'served').length;
    const allServed = total > 0 && servedCt === total;
    if (order && (order.status === 'served' || allServed) && order.session_id) {
      // Wait 2 seconds to show the "served" status, then redirect
      const timer = setTimeout(() => {
        // Redirect to post-meal with sessionId instead of orderId
        navigate(`/post-meal/${order.session_id}/${order.table_number}`);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [order, navigate]);

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
            });
          }
          lastStatusRef.current = newStatus;
          setOrder({
            ...payload.new,
            status: newStatus,
          });
        }
      });

      // Also setup polling as fallback (every 10 seconds to reduce load)
      pollingInterval = setInterval(async () => {
        try {
          const updatedOrder = await getOrder(orderId);
          const prevStatus = lastStatusRef.current;
          const newStatus = updatedOrder.order_status || updatedOrder.status;
          if (prevStatus && newStatus !== prevStatus) {
            toast.success(`Order status updated: ${getOrderStatusText(newStatus)}`, {
              icon: '🔔',
              duration: 4000,
            });
          }
          lastStatusRef.current = newStatus;
          setOrder(updatedOrder);
        } catch (pollError) {
          console.error('❌ Polling error:', pollError);
          // Don't set error state on polling failures
        }
      }, 10000); // Poll every 10 seconds

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
      
      // Setup polling only
      pollingInterval = setInterval(async () => {
        try {
          const updatedOrder = await getOrder(orderId);
          const prevStatus = lastStatusRef.current;
          const newStatus = updatedOrder.order_status || updatedOrder.status;
          if (prevStatus && newStatus !== prevStatus) {
            toast.success(`Order status updated: ${getOrderStatusText(newStatus)}`, {
              icon: '🔔',
              duration: 4000,
            });
          }
          lastStatusRef.current = newStatus;
          setOrder(updatedOrder);
        } catch (pollError) {
          console.error('❌ Polling error:', pollError);
          // Don't set error state on polling failures
        }
      }, 10000); // Poll every 10 seconds

      return () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      };
    }
  }, [orderId, loadOrder]); // loadOrder is stable with useCallback

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground antialiased flex items-center justify-center">
        <LoadingSpinner text="Loading your order..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground antialiased flex items-center justify-center">
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
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Order Status</h1>
              <p className="text-base sm:text-2xl font-semibold tracking-tight text-foreground ml-1 sm:ml-4">Order #{order?.order_number || order?.id}</p>
              {status !== 'served' && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground ml-2">Auto-updating • Tracking your order in real-time</span>
                </div>
              )}
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-warning px-4 py-2 text-sm font-semibold text-background transition-colors hover:brightness-110"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:py-8">
        {/* Success banner after payment */}
        {order?.payment_status === 'paid' && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-success/20 bg-success-light px-4 py-3 text-sm">
            <CheckCircle className="h-5 w-5 text-success" />
            <span>Payment successful. Tracking your order below.</span>
          </div>
        )}

        {/* Two-column responsive grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Order Progress */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-minimal p-5"
          >
            <h2 className="mb-4 text-2xl font-semibold">Order Progress</h2>

            {/* Stepper */}
            {(() => {
              const s1Active = ['received', 'preparing', 'ready', 'served'].includes(status);
              const s2Active = ['preparing', 'ready', 'served'].includes(status);
              const s3Active = ['ready', 'served'].includes(status);
              const s4Active = ['served'].includes(status) || (servedCount === totalCount && totalCount > 0);
              const stepCls = (active) => (active ? 'bg-warning text-background' : 'border border-border text-muted');
              const lineCls = (active) => (active ? 'bg-warning' : 'bg-muted');
              return (
                <div className="relative mb-6 grid grid-cols-[auto_1fr] items-start gap-x-3">
                  {/* Step 1: Received */}
                  <div className={`col-start-1 row-start-1 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${stepCls(s1Active)}`}>
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="col-start-2 row-start-1">
                    <p className="text-sm font-medium">Received</p>
                  </div>
                  {/* Connector 1 */}
                  <div className={`col-start-1 row-start-2 ml-5 h-8 w-0.5 ${lineCls(s2Active)}`} />

                  {/* Step 2: Preparing */}
                  <div className={`col-start-1 row-start-3 flex h-10 w-10 items-center justify-center rounded-full ${stepCls(s2Active)}`}>
                    <ChefHat className="h-5 w-5" />
                  </div>
                  <div className="col-start-2 row-start-3">
                    <p className="text-sm font-medium">Preparing</p>
                  </div>
                  {/* Connector 2 */}
                  <div className={`col-start-1 row-start-4 ml-5 h-8 w-0.5 ${lineCls(s3Active)}`} />

                  {/* Step 3: Ready */}
                  <div className={`col-start-1 row-start-5 flex h-10 w-10 items-center justify-center rounded-full ${stepCls(s3Active)}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="col-start-2 row-start-5">
                    <p className="text-sm font-medium">Ready</p>
                  </div>
                  {/* Connector 3 */}
                  <div className={`col-start-1 row-start-6 ml-5 h-8 w-0.5 ${lineCls(s4Active)}`} />

                  {/* Step 4: Served */}
                  <div className={`col-start-1 row-start-7 flex h-10 w-10 items-center justify-center rounded-full ${stepCls(s4Active)}`}>
                    <UtensilsCrossed className="h-5 w-5" />
                  </div>
                  <div className="col-start-2 row-start-7">
                    <p className="text-sm font-medium">Served</p>
                  </div>
                </div>
              );
            })()}

            {/* Items grouped by status */}
            <div className="mt-2">
              {(() => {
                const buckets = {
                  preparing: [],
                  ready: [],
                  served: [],
                  waiting: [], // queued/received
                };
                orderItems.forEach((item) => {
                  const s = deriveItemStatus(item);
                  if (s === 'preparing') buckets.preparing.push(item);
                  else if (s === 'ready') buckets.ready.push(item);
                  else if (s === 'served') buckets.served.push(item);
                  else buckets.waiting.push(item);
                });

                const Section = ({ title, items, tone }) => {
                  if (!items.length) return null;
                  const toneMap = {
                    waiting: 'bg-muted text-muted-foreground',
                    preparing: 'bg-warning-light text-warning',
                    ready: 'bg-success-light text-success',
                    served: 'bg-muted text-foreground/90',
                  };
                  return (
                    <div className="mb-3">
                      <p className="mb-2 text-sm font-semibold text-foreground/80">{title} <span className="text-muted-foreground">({items.length})</span></p>
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div key={`${title}-${idx}`} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                            <span className="text-sm text-foreground truncate max-w-[65%] sm:max-w-[70%]">
                              {item.quantity}× {item.name}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] ${toneMap[tone]}`}>{title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                };

                return (
                  <div>
                    <Section title="Started preparing" items={buckets.preparing} tone="preparing" />
                    <Section title="Ready to serve" items={buckets.ready} tone="ready" />
                    <Section title="Waiting to start" items={buckets.waiting} tone="waiting" />
                    <Section title="Served" items={buckets.served} tone="served" />
                  </div>
                );
              })()}
            </div>

            {/* Estimated time */}
            {status !== 'served' && (
              <div className="mt-4 rounded-md bg-warning-light p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium">Estimated time</p>
                    <p className="text-base font-bold text-foreground">≈ {estimatedTime} minutes</p>
                  </div>
                </div>
              </div>
            )}
          </motion.section>

          {/* Right: Order details */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-minimal p-5"
          >
            <h2 className="mb-3 text-2xl font-semibold">Order Details</h2>

            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-foreground/80">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium">{item.name}</div>
                        {item.special_notes && (
                          <div className="text-xs text-muted">Note: {item.special_notes}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-foreground/90">{item.quantity}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border bg-muted/50">
                  <tr>
                    <td className="px-3 py-2 text-right" colSpan={2}>Tax (5%)</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(computedTax)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-right font-semibold" colSpan={2}>Total</td>
                    <td className="px-3 py-2 text-right text-[18px] font-extrabold text-warning">{formatCurrency(computedTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Table number box */}
            <div className="mt-4 rounded-md bg-muted p-3">
              <div className="text-sm text-muted">Table</div>
              <div className="text-2xl font-semibold">#{order?.table_number || order?.tables?.table_number || 'N/A'}</div>
            </div>
          </motion.section>
        </div>

        {/* Redirecting message when served */}
        {status === 'served' && (
          <div className="mt-6 rounded-md border border-success/20 bg-success-light px-3 py-2 text-center text-sm text-success">
            Food served. Redirecting to options…
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderStatusPage;
