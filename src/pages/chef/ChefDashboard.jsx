import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, LogOut, RefreshCw, Bell, Filter, Search, Clock, CheckCircle, UtensilsCrossed } from 'lucide-react';
import { supabase, subscribeToOrders, updateOrderItemStatus, updateOrderStatus, getRestaurant } from '@shared/utils/api/supabaseClient';
import { clearChefAuth } from '@/shared/utils/helpers/localStorage';
import notificationService from '@/domains/notifications/utils/notificationService';
import OrderCard from '@domains/ordering/components/OrderCard';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import ErrorMessage from '@shared/components/feedback/ErrorMessage';
import toast from 'react-hot-toast';

const ChefDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('active'); // 'all', 'active', 'received', 'preparing', 'ready'
  const [searchText, setSearchText] = useState('');
  const [compact, setCompact] = useState(false);
  // Default to compact on small screens
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        setCompact(true);
      }
    } catch (_err) {
      void _err; // ignore
    }
  }, []);
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'paid' | 'pending'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const subscriptionRef = useRef(null);
  const lastOrderIdsRef = useRef(new Set());

  // Auth is handled by ProtectedRoute wrapper, no need for additional check
  // Old auth check removed - using Supabase auth via ProtectedRoute

  // Set up user-gesture based audio unlock for notification sounds
  useEffect(() => {
    notificationService.registerUserGestureUnlock();
  }, []);

  // Removed manual AudioContext usage; notificationService handles audio safely.

  // Load restaurant on mount
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const restaurantData = await getRestaurant();
        if (!restaurantData) throw new Error('Restaurant not found');
        setRestaurant(restaurantData);
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        setError(`Failed to load restaurant data: ${err.message}`);
        setIsLoading(false);
      }
    };
    fetchRestaurant();
  }, []);

  // Subscribe to orders and setup polling
  useEffect(() => {
    if (!restaurant) return;

    let pollingInterval = null;

    const setupSubscription = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to subscribe to all orders for this restaurant
        try {
          const unsubscribe = await subscribeToOrders(
            restaurant.id,
            (newOrders) => {
              // Compute notifications BEFORE updating state to avoid setState during render
              const prevIdSet = lastOrderIdsRef.current;
              const currentIdSet = new Set(newOrders.map((o) => o.id));
              // Detect any new order IDs
              for (const order of newOrders) {
                if (!prevIdSet.has(order.id) && order.status === 'received') {
                  notificationService.notifyNewOrder(
                    order.order_number,
                    order.table_number || 'N/A'
                  );
                  toast.success(`New order received: #${order.order_number}`, {
                    icon: '🔔',
                    duration: 5000,
                  });
                }
              }
              lastOrderIdsRef.current = currentIdSet;
              setOrders(newOrders);
              setIsLoading(false);
            },
            (err) => {
              console.error('Subscription error (using polling instead):', err);
              // Don't show error - polling will handle updates
              setIsLoading(false);
            }
          );

          subscriptionRef.current = unsubscribe;
        } catch (subError) {
          console.error('⚠️ Realtime subscription failed, using polling only:', subError);
          setIsLoading(false);
          // Continue with polling even if subscription fails
        }

        // Setup polling as fallback (every 3 seconds)
        // This ensures updates even if Realtime is not enabled
        pollingInterval = setInterval(async () => {
          try {
            const { data: polledOrders, error: pollError } = await supabase
              .from('orders')
              .select(`
                *,
                tables (
                  table_number,
                  table_name
                )
              `)
              .eq('restaurant_id', restaurant.id)
              .neq('order_status', 'pending_payment') // Exclude orders waiting for payment
              .order('created_at', { ascending: false });

            if (pollError) {
              console.error('Polling error:', pollError);
              return;
            }

            if (polledOrders) {
              // Transform orders
              const transformedOrders = polledOrders.map(order => ({
                ...order,
                status: order.order_status,
                total_amount: order.total,
                subtotal_amount: order.subtotal,
                tax_amount: order.tax,
              }));
              // Compute notifications BEFORE updating state
              const prevIdSet = lastOrderIdsRef.current;
              const currentIdSet = new Set(transformedOrders.map((o) => o.id));
              for (const order of transformedOrders) {
                if (!prevIdSet.has(order.id) && order.status === 'received') {
                  notificationService.notifyNewOrder(
                    order.order_number,
                    order.table_number || 'N/A'
                  );
                  toast.success(`New order received: #${order.order_number}`, {
                    icon: '🔔',
                    duration: 3000,
                  });
                }
              }
              lastOrderIdsRef.current = currentIdSet;
              setOrders(transformedOrders);
            }
          } catch (pollError) {
            console.error('Polling exception:', pollError);
          }
        }, 3000); // Poll every 3 seconds
        
      } catch (err) {
        console.error('Error setting up orders:', err);
        setError('Failed to load orders');
        setIsLoading(false);
      }
    };

    setupSubscription();

    // Cleanup subscription and polling on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [restaurant]);

  // Filter orders based on active filter and search
  useEffect(() => {
    let filtered = [...orders];

    if (activeFilter === 'active') {
      filtered = filtered.filter((order) => order.status !== 'served');
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === activeFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      if (paymentFilter === 'paid') {
        filtered = filtered.filter((o) => (o.payment_status || '').toLowerCase() === 'paid');
      } else if (paymentFilter === 'pending') {
        filtered = filtered.filter((o) => (o.payment_status || '').toLowerCase() !== 'paid');
      }
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      filtered = filtered.filter((o) =>
        String(o.order_number).toLowerCase().includes(q) ||
        String(o.tables?.table_number || o.table_number || '').toLowerCase().includes(q)
      );
    }

    // Sort by created_at (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setFilteredOrders(filtered);
  }, [orders, activeFilter, paymentFilter, searchText]);

  // Order-level status update is disabled in Chef; use per-item updates instead.

  // Handle per-item status update
  const handleUpdateItemStatus = async (orderId, menuItemId, nextStatus) => {
    try {
      const updated = await updateOrderItemStatus(orderId, menuItemId, nextStatus);
      toast.success(`Item marked ${nextStatus}`);
      // Replace the order with returned row (contains possibly updated order_status)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? {
        ...updated,
        status: updated.order_status,
        total_amount: updated.total,
        subtotal_amount: updated.subtotal,
        tax_amount: updated.tax,
      } : o)));
    } catch (err) {
      console.error('Failed to update item status:', err);
      toast.error(err.message || 'Failed to update item');
    }
  };

  // Handle order cancellation (only allowed when payment is not completed)
  const handleCancelOrder = async (order) => {
    try {
      if ((order.payment_status || '').toLowerCase() === 'paid') {
        toast.error('Cannot cancel a paid order');
        return;
      }
      if (order.status === 'served' || order.status === 'cancelled') {
        toast.error('Order cannot be cancelled');
        return;
      }
      const updated = await updateOrderStatus(order.id, 'cancelled');
      setOrders((prev) => prev.map((o) => (o.id === order.id ? {
        ...updated,
        status: updated.order_status,
        total_amount: updated.total,
        subtotal_amount: updated.subtotal,
        tax_amount: updated.tax,
      } : o)));
      toast.success(`Order #${order.order_number} cancelled`);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      toast.error(err.message || 'Failed to cancel order');
    }
  };

  // Handle logout
  const handleLogout = () => {
    clearChefAuth();
    navigate('/chef/login');
    toast.success('Logged out successfully');
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!restaurant) return;
    
    try {
      setIsRefreshing(true);
      
      const { data: refreshedOrders } = await supabase
        .from('orders')
        .select(`
          *,
          tables (
            table_number,
            table_name
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (refreshedOrders) {
        // Transform orders
        const transformedOrders = refreshedOrders.map(order => ({
          ...order,
          status: order.order_status,
          total_amount: order.total,
          subtotal_amount: order.subtotal,
          tax_amount: order.tax,
        }));
        
        setOrders(transformedOrders);
        toast.success('Orders refreshed');
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
      toast.error('Failed to refresh orders');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter options
  const filterOptions = [
    { value: 'active', label: 'Active Orders', count: orders.filter((o) => o.status !== 'served').length },
    { value: 'all', label: 'All Orders', count: orders.length },
    { value: 'ready', label: 'Ready for Service', count: orders.filter((o) => o.status === 'ready').length },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background antialiased flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background antialiased flex items-center justify-center p-4">
        <ErrorMessage error={error} onRetry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background antialiased relative">

      {/* Header - Sticky with blur backdrop */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-card/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning-light">
                <ChefHat className="w-6 h-6 text-warning" />
              </div>
              <div>
                <img src="/logo.svg" alt="Restaurant logo" className="h-7 sm:h-8 w-auto object-contain mb-0.5" />
                <h1 className="text-base sm:text-2xl font-semibold tracking-tight text-foreground ml-6 sm:ml-8">Chef Dashboard</h1>
                <div className="flex items-center ml-7 gap-2 mt-0.5 sm:mt-1">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground ml-2">Auto-updating every 3s</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 px-4 hover:bg-muted rounded-lg transition-colors flex items-center justify-center"
                title="Refresh orders"
              >
                <RefreshCw className={`w-5 h-5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 h-9 px-4 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg transition-colors flex-1 sm:flex-initial text-sm font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Top stats - compact chips on mobile, full cards on larger screens */}
        <div className="sm:hidden mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] px-2 py-1 rounded-full border bg-info-light text-info border-info/30">
              Received {orders.filter(o => o.status === 'received').length}
            </span>
            <span className="text-[11px] px-2 py-1 rounded-full border bg-warning-light text-warning border-warning/30">
              Preparing {orders.filter(o => o.status === 'preparing').length}
            </span>
            <span className="text-[11px] px-2 py-1 rounded-full border bg-success-light text-success border-success/30">
              Ready {orders.filter(o => o.status === 'ready').length}
            </span>
            <span className="text-[11px] px-2 py-1 rounded-full border bg-muted text-muted-foreground border-border">
              Active {orders.filter(o => o.status !== 'served').length}
            </span>
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 sm:mb-8">
          <div className="card-minimal p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-info-light">
                <Bell className="w-5 h-5 text-info" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Received</p>
            <p className="text-3xl font-semibold tabular-nums text-info">{orders.filter(o => o.status === 'received').length}</p>
          </div>
          <div className="card-minimal p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-warning-light">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Preparing</p>
            <p className="text-3xl font-semibold tabular-nums text-warning">{orders.filter(o => o.status === 'preparing').length}</p>
          </div>
          <div className="card-minimal p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-success-light">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Ready</p>
            <p className="text-3xl font-semibold tabular-nums text-success">{orders.filter(o => o.status === 'ready').length}</p>
          </div>
          <div className="card-minimal p-5 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-muted">
                <UtensilsCrossed className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Active</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{orders.filter(o => o.status !== 'served').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6 card-minimal p-4 sm:p-6 sticky top-16 sm:top-20 z-30">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">Filter Orders</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search order # or table"
                  className="w-full h-9 rounded-lg bg-muted border border-border pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-info"
                />
              </div>
              {/* Payment filter */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground w-full sm:w-auto">
                <span className="whitespace-nowrap">Payment:</span>
                <div className="flex rounded-lg overflow-hidden border border-border w-full sm:w-auto">
                  <button
                    className={`px-2.5 py-1 h-8 ${paymentFilter === 'all' ? 'bg-warning text-background' : 'bg-muted text-muted-foreground hover:text-foreground'} flex-1 sm:flex-initial`}
                    onClick={() => setPaymentFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`px-2.5 py-1 h-8 border-l border-border ${paymentFilter === 'pending' ? 'bg-warning text-background' : 'bg-muted text-muted-foreground hover:text-foreground'} flex-1 sm:flex-initial`}
                    onClick={() => setPaymentFilter('pending')}
                  >
                    Pending
                  </button>
                  <button
                    className={`px-2.5 py-1 h-8 border-l border-border ${paymentFilter === 'paid' ? 'bg-warning text-background' : 'bg-muted text-muted-foreground hover:text-foreground'} flex-1 sm:flex-initial`}
                    onClick={() => setPaymentFilter('paid')}
                  >
                    Paid
                  </button>
                </div>
              </div>
              {/* Compact toggle */}
              <label className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} className="rounded" />
                Compact
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === option.value
                    ? 'bg-warning text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {option.label} <span className="tabular-nums">({option.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders by status */}
        {filteredOrders.length === 0 ? (
          <div className="card-minimal p-10 sm:p-16 text-center">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold tracking-tight text-foreground mb-2">No Orders Found</h3>
            <p className="text-base text-muted-foreground">
              {activeFilter === 'active'
                ? 'All orders have been served!'
                : `No ${activeFilter === 'all' ? '' : activeFilter} orders at the moment.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {['received', 'preparing', 'ready', 'served'].map((statusKey) => {
              const sectionOrders = filteredOrders.filter((o) => o.status === statusKey);
              if (sectionOrders.length === 0) return null;
              const headings = { received: 'Received', preparing: 'Preparing', ready: 'Ready', served: 'Served' };
              const dotConfig = {
                received: 'bg-info',
                preparing: 'bg-warning',
                ready: 'bg-success',
                served: 'bg-muted-foreground'
              };
              return (
                <section key={statusKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-2 w-2 rounded-full ${dotConfig[statusKey]}`} />
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {headings[statusKey]} <span className="text-muted-foreground tabular-nums">({sectionOrders.length})</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {sectionOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateItemStatus={handleUpdateItemStatus}
                        onCancelOrder={() => handleCancelOrder(order)}
                        compact={compact}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Live Indicator */}
      <div className="fixed bottom-4 right-4 card-minimal px-4 py-2 flex items-center gap-2 animate-scale-in">
        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
        <span className="text-sm font-medium text-foreground">Live</span>
      </div>
    </div>
  );
};

export default ChefDashboard;
