import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, updateOrderItemStatus, fromRestaurant } from '@shared/utils/api/supabaseClient';
import toast from 'react-hot-toast';
import { LogOut, RefreshCw, Bell, CheckCircle, Clock, Users, UtensilsCrossed, X, Filter, Search } from 'lucide-react';
import useRestaurant from '@shared/hooks/useRestaurant';
import notificationService from '@/domains/notifications/utils/notificationService';

/**
 * Waiter Dashboard - Main dashboard for waiters
 * Manages tables, orders, and mark as served functionality
 */
const WaiterDashboard = () => {
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();
  const [user, setUser] = useState(null);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  // New UI controls
  const [activeFilter, setActiveFilter] = useState('active'); // 'all' | 'active' | 'received' | 'preparing' | 'ready' | 'served'
  const [searchText, setSearchText] = useState('');
  const [compact, setCompact] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const alertChannelsRef = useRef([]);

  // Helpers for per-item status (fallback to order status when missing)
  const deriveItemStatus = (order, item) => {
    if (item.item_status) return item.item_status;
    const s = order.order_status || order.status;
    if (s === 'ready') return 'ready';
    if (s === 'served') return 'served';
    if (s === 'preparing' || s === 'received') return 'preparing';
    return 'queued';
  };
  const itemStatusBadge = (order, item) => {
    const s = deriveItemStatus(order, item);
    const map = {
      queued: 'bg-gray-800 text-gray-300 border-gray-300',
      received: 'bg-blue-100 text-blue-800 border-blue-300',
      preparing: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      ready: 'bg-green-100 text-green-800 border-green-300',
      served: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    const label = {
      queued: 'Queued',
      received: 'Received',
      preparing: 'Preparing',
      ready: 'Ready',
      served: 'Served',
    }[s] || s;
    return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${map[s]}`}>{label}</span>;
  };

  useEffect(() => {
    // Ensure audio can play after a user gesture
    notificationService.registerUserGestureUnlock();

    checkSimpleAuth();
    // Initial blocking load
    const init = async () => {
      setLoading(true);
      await loadData({ silent: true });
      setLoading(false);
    };
    init();
    // Default to compact cards on small screens for a cleaner mobile UI
    try {
      const isSmall = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
      if (isSmall) setCompact(true);
    } catch { /* no-op */ }
    
  // Setup real-time subscriptions for automatic refresh
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          ...(restaurantId ? { filter: `restaurant_id=eq.${restaurantId}` } : {}),
        },
        (payload) => {
          // Patch-in-place without refetch
          setOrders((prev) => {
            const evt = payload.eventType;
            const newRec = payload.new;
            const oldRec = payload.old;
            if (evt === 'INSERT' && newRec) {
              const exists = prev.some((o) => o.id === newRec.id);
              // Sound + notification for new order
              try {
                notificationService.notifyWaiterNewOrder(newRec.order_number, newRec.table_number || 'N/A');
              } catch { /* noop */ }
              return exists
                ? prev.map((o) => (o.id === newRec.id ? newRec : o))
                : [newRec, ...prev];
            }
            if (evt === 'UPDATE' && newRec) {
              // Sound when order becomes ready
              try {
                if (oldRec?.order_status !== 'ready' && newRec.order_status === 'ready') {
                  notificationService.notifyFoodReady(newRec.order_number, newRec.table_number || 'N/A');
                }
              } catch { /* noop */ }
              return prev.map((o) => (o.id === newRec.id ? newRec : o));
            }
            if (evt === 'DELETE' && oldRec) {
              return prev.filter((o) => o.id !== oldRec.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    const tablesSubscription = supabase
      .channel('tables-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          ...(restaurantId ? { filter: `restaurant_id=eq.${restaurantId}` } : {}),
        },
        (payload) => {
          // Patch-in-place without refetch
          setTables((prev) => {
            const evt = payload.eventType;
            const newRec = payload.new;
            const oldRec = payload.old;
            if (evt === 'INSERT' && newRec) {
              const exists = prev.some((t) => t.id === newRec.id);
              return exists
                ? prev.map((t) => (t.id === newRec.id ? newRec : t))
                : [...prev, newRec];
            }
            if (evt === 'UPDATE' && newRec) {
              return prev.map((t) => (t.id === newRec.id ? newRec : t));
            }
            if (evt === 'DELETE' && oldRec) {
              return prev.filter((t) => t.id !== oldRec.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    // Waiter call alerts via Realtime broadcast
    // Alerts channel will be configured after tables load using restaurant-scoped channels

    // Backup auto-refresh every 5 seconds (silent), in case a realtime event is missed
    const autoRefreshInterval = setInterval(() => {
      loadData({ silent: true });
    }, 5000);

          {/* Stats - Mobile chips + Desktop cards */}
    return () => {
            {/* Mobile compact chips */}
            <div className="sm:hidden grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tables</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{tables.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-success-light rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-success">Available</p>
                  <p className="text-sm font-semibold text-success tabular-nums">{tables.filter(t => getTableStatus(t.id) === 'available').length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-warning-light rounded-lg px-3 py-2">
                <Clock className="w-4 h-4 text-warning" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-warning">Occupied</p>
                  <p className="text-sm font-semibold text-warning tabular-nums">{tables.filter(t => getTableStatus(t.id) === 'occupied').length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-info-light rounded-lg px-3 py-2">
                <Bell className="w-4 h-4 text-info" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-info">Orders Ready</p>
                  <p className="text-sm font-semibold text-info tabular-nums">{orders.filter(o => (o.order_status || o.status) === 'ready').length}</p>
                </div>
              </div>
            </div>

      ordersSubscription.unsubscribe();
      tablesSubscription.unsubscribe();
      // cleanup any alert channels
      alertChannelsRef.current.forEach((ch) => {
        try { supabase.removeChannel(ch); } catch { /* ignore cleanup errors */ }
      });
      alertChannelsRef.current = [];
      clearInterval(autoRefreshInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Configure waiter alert subscriptions scoped by restaurant once tables are loaded
  useEffect(() => {
    if (!tables || tables.length === 0) return;

    // Determine unique restaurant IDs from tables
    const restaurantIds = Array.from(new Set(
      tables.map((t) => t.restaurant_id).filter(Boolean)
    ));

    // Remove existing channels before creating new ones
    alertChannelsRef.current.forEach((ch) => {
      try { supabase.removeChannel(ch); } catch { /* ignore cleanup errors */ }
    });
    alertChannelsRef.current = [];

    if (restaurantIds.length === 0) {
      // Fallback: subscribe to generic channel if restaurant IDs not available
      const ch = supabase
        .channel('waiter-alerts')
        .on('broadcast', { event: 'call_waiter' }, (payload) => {
          const tableNumber = payload?.payload?.tableNumber || 'Unknown';
          const restaurantId = payload?.payload?.restaurantId || null;
          setAlerts((prev) => [
            { id: Date.now() + Math.random(), tableNumber, at: new Date().toISOString(), restaurantId },
            ...prev,
          ].slice(0, 20));
          setShowAlerts(true);
          try { playBeep(); } catch { /* ignore audio errors */ }
        })
        .subscribe();
      alertChannelsRef.current.push(ch);
    } else {
      // Subscribe to each restaurant-specific alerts channel
      restaurantIds.forEach((rid) => {
        const ch = supabase
          .channel(`waiter-alerts-${rid}`)
          .on('broadcast', { event: 'call_waiter' }, (payload) => {
            const tableNumber = payload?.payload?.tableNumber || 'Unknown';
            const restaurantId = payload?.payload?.restaurantId || rid;
            setAlerts((prev) => [
              { id: Date.now() + Math.random(), tableNumber, at: new Date().toISOString(), restaurantId },
              ...prev,
            ].slice(0, 20));
            setShowAlerts(true);
            try { playBeep(); } catch { /* ignore audio errors */ }
          })
          .subscribe();
        alertChannelsRef.current.push(ch);
      });
    }

    return () => {
      // do not cleanup here; main effect cleanup handles it on unmount
    };
  }, [tables]);

  // Auth is handled by ProtectedRoute wrapper - no manual check needed
  // User is already authenticated if this component renders
  const checkSimpleAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadData = async ({ silent = false, showToast = false } = {}) => {
    try {
      if (silent) setIsRefreshing(true);


      // Load tables scoped to the active restaurant (defensive against mis-scoped RLS)
      const { data: tablesData, error: tablesError } = await fromRestaurant('tables')
        .select('*')
        .eq('is_active', true)
        .order('table_number');

      if (tablesError) {
        console.error('❌ Tables error:', tablesError);
        throw tablesError;
      }
      

      // Load recent orders (last 7 days) so older ready orders still show up
      const since = new Date();
      since.setDate(since.getDate() - 7);

      const { data: ordersData, error: ordersError } = await fromRestaurant('orders')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Orders error:', ordersError);
        throw ordersError;
      }
      

      setTables(tablesData || []);
      setOrders(ordersData || []);
      
      if (showToast) {
        toast.success('Data refreshed!', { duration: 2000 });
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error(`Failed to load data: ${error.message || 'Unknown error'}`);
      
      // Set empty arrays so UI doesn't break
      setTables([]);
      setOrders([]);
    } finally {
      if (silent) setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Play notification sound via centralized service
  const playBeep = () => {
    try { notificationService.playSound('urgent'); } catch { /* ignore */ }
  };

  // Serve all items in an order (bulk action when all items are ready)
  const handleServeAll = async (orderObj) => {
    try {
      if (orderObj.payment_status !== 'paid') {
        toast.error('Payment not completed');
        return;
      }
      const items = orderObj.items || [];
      const notReady = items.filter((it) => deriveItemStatus(orderObj, it) !== 'ready');
      if (notReady.length > 0) {
        toast.error('All items must be ready to serve all');
        return;
      }
      let updatedOrder = orderObj;
      for (const it of items) {
        updatedOrder = await updateOrderItemStatus(orderObj.id, it.menu_item_id, 'served');
      }
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      toast.success('All items served');
    } catch (e) {
      console.error('Serve all failed', e);
      toast.error(e.message || 'Failed to serve all items');
    }
  };

  // Mark a single item as served (only if order is paid and item is ready)
  const handleServeItem = async (orderObj, menuItemId) => {
    try {
      if (orderObj.payment_status !== 'paid') {
        toast.error('Payment not completed');
        return;
      }
      const item = (orderObj.items || []).find((it) => it.menu_item_id === menuItemId);
      if (!item) {
        toast.error('Item not found');
        return;
      }
      const status = deriveItemStatus(orderObj, item);
      if (status !== 'ready') {
        toast.error('Item is not ready yet');
        return;
      }
      const updated = await updateOrderItemStatus(orderObj.id, menuItemId, 'served');
      toast.success('Item marked as served');
      // Replace with updated order (may be auto-promoted to served)
      setOrders((prev) => prev.map((o) => (o.id === orderObj.id ? updated : o)));
    } catch (e) {
      console.error('Serve item failed', e);
      toast.error(e.message || 'Failed to serve item');
    }
  };

  const getTableStatus = (tableId) => {
    // Get the table data to check its actual status from database
    const table = tables.find(t => t.id === tableId);
    
    // ALWAYS log what we're checking
    
    // PRIORITY 1: ALWAYS use database status if column exists (even if it's 'available')
    // This is the source of truth!
    if (table && typeof table.status !== 'undefined' && table.status !== null) {
      return table.status;
    }
    
    
    // PRIORITY 2: Fallback - determine status from orders (only if no DB status)
    const tableOrders = orders.filter(
      o => o.table_id === tableId && 
      o.order_status !== 'cancelled' &&
      // Only consider table available if order is served AND feedback is submitted
      !(o.order_status === 'served' && o.feedback_submitted === true)
    );
    
    if (tableOrders.length === 0) {
      return 'available';
    }
    
    if (tableOrders.some(o => o.order_status === 'ready')) {
      return 'ready';
    }
    
    if (tableOrders.some(o => o.order_status === 'served')) {
      return 'occupied';
    }
    
    return 'occupied';
  };

  // Derive filtered orders for waiter list
  useEffect(() => {
    let filtered = [...orders];

    if (activeFilter === 'active') {
      // Active = Orders that are fully ready OR have at least one item ready (resilient to slow order_status promotion)
      filtered = filtered.filter((o) => {
        const s = (o.order_status || o.status);
        if (s === 'ready') return true;
        const items = Array.isArray(o.items) ? o.items : [];
        return items.some((it) => {
          const itemStatus = it.item_status || s;
          return itemStatus === 'ready';
        });
      });
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter((o) => (o.order_status || o.status) === activeFilter);
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      filtered = filtered.filter((o) =>
        String(o.order_number || '').toLowerCase().includes(q) ||
        String(o.table_number || '').toLowerCase().includes(q)
      );
    }

    // Newest first
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setFilteredOrders(filtered);
  }, [orders, activeFilter, searchText]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background antialiased">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info mx-auto"></div>
          <p className="mt-4 text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background antialiased">
      {/* Header - Sticky with blur backdrop */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-card/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <img src="/logo.svg" alt="Restaurant logo" className="h-7 sm:h-8 w-auto object-contain mb-0.5" />
              <h1 className="text-base sm:text-2xl font-semibold tracking-tight text-foreground ml-7 sm:ml-8">Waiter Dashboard</h1>
              <p className="text-xs text-muted-foreground ml-7 sm:ml-8">Welcome, {user?.email}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowAlerts((v) => !v)}
                className="relative flex items-center justify-center gap-2 h-9 px-4 bg-warning text-background rounded-lg hover:opacity-90 transition-opacity flex-1 sm:flex-initial text-sm font-medium"
                title="Toggle calls panel"
              >
                <Bell className="w-4 h-4" />
                <span>Calls</span>
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full grid place-items-center font-semibold">
                    {Math.min(alerts.length, 9)}
                  </span>
                )}
              </button>
              <button
                onClick={() => loadData({ silent: true, showToast: true })}
                className="flex items-center justify-center gap-2 h-9 px-4 bg-info text-background rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                disabled={loading || isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 h-9 px-4 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats - table/ready metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Mobile chips */}
        <div className="sm:hidden grid grid-cols-2 gap-2 mb-4">
          {/* Total Tables */}
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Tables</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">{tables.length}</p>
            </div>
          </div>
          {/* Available */}
          <div className="flex items-center gap-2 bg-success-light rounded-lg px-3 py-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-success">Available</p>
              <p className="text-sm font-semibold text-success tabular-nums">{tables.filter(t => getTableStatus(t.id) === 'available').length}</p>
            </div>
          </div>
          {/* Occupied */}
          <div className="flex items-center gap-2 bg-warning-light rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-warning" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-warning">Occupied</p>
              <p className="text-sm font-semibold text-warning tabular-nums">{tables.filter(t => getTableStatus(t.id) === 'occupied').length}</p>
            </div>
          </div>
          {/* Orders Ready */}
          <div className="flex items-center gap-2 bg-info-light rounded-lg px-3 py-2">
            <Bell className="w-4 h-4 text-info" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-info">Orders Ready</p>
              <p className="text-sm font-semibold text-info tabular-nums">{orders.filter(o => (o.order_status || o.status) === 'ready').length}</p>
            </div>
          </div>
        </div>

        {/* Desktop cards */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 sm:mb-8">
          {/* Total Tables */}
          <div className="card-minimal p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-muted">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Tables</p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{tables.length}</p>
          </div>
          
          {/* Available */}
          <div className="card-minimal p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-success-light">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-success mb-1">Available</p>
            <p className="text-3xl font-semibold tabular-nums text-success">
              {tables.filter(t => getTableStatus(t.id) === 'available').length}
            </p>
          </div>
          
          {/* Occupied */}
          <div className="card-minimal p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-warning-light">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-warning mb-1">Occupied</p>
            <p className="text-3xl font-semibold tabular-nums text-warning">
              {tables.filter(t => getTableStatus(t.id) === 'occupied').length}
            </p>
          </div>
          
          {/* Orders Ready */}
          <div className="card-minimal p-5 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-info-light">
                <Bell className="w-5 h-5 text-info" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-info mb-1">Orders Ready</p>
            <p className="text-3xl font-semibold tabular-nums text-info">
              {orders.filter(o => (o.order_status || o.status) === 'ready').length}
            </p>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="card-minimal p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground mb-4">Tables Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
            {tables.map((table) => {
              const status = getTableStatus(table.id);
              const statusConfig = {
                available: {
                  bg: 'bg-success-light',
                  border: 'border-success',
                  text: 'text-success',
                  shadow: 'hover:shadow-success/20',
                  icon: <CheckCircle className="w-6 h-6" />
                },
                occupied: {
                  bg: 'bg-warning-light',
                  border: 'border-warning',
                  text: 'text-warning',
                  shadow: 'hover:shadow-warning/20',
                  icon: <Users className="w-6 h-6" />
                },
                ready: {
                  bg: 'bg-info-light',
                  border: 'border-info',
                  text: 'text-info',
                  shadow: 'hover:shadow-info/20',
                  icon: <Bell className="w-6 h-6" />
                }
              };
              const config = statusConfig[status] || statusConfig.available;
              
              return (
                <div
                  key={table.id}
                  className={`${config.bg} border-2 ${config.border} rounded-lg p-4 sm:p-5 text-center cursor-pointer transition-all hover:-translate-y-1 ${config.shadow} shadow-md`}
                >
                  <div className={`flex justify-center mb-2 ${config.text}`}>
                    {config.icon}
                  </div>
                  <p className={`font-semibold text-base sm:text-lg ${config.text}`}>{table.table_number}</p>
                  <p className="text-xs capitalize mt-2 text-muted-foreground">{status}</p>
                  {table.capacity && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{table.capacity}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Orders Section */}
        <div className="card-minimal p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">Orders</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search order # or table"
                  className="w-full h-8 sm:h-9 rounded-lg bg-muted border border-border pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-info"
                />
              </div>
              <label className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} className="rounded" />
                Compact cards
              </label>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Compute active count as orders that are fully ready OR have at least one item ready */}
            {[
              { value: 'active', label: 'Active', count: orders.filter((o) => {
                const s = (o.order_status || o.status);
                if (s === 'ready') return true;
                const items = Array.isArray(o.items) ? o.items : [];
                return items.some((it) => (it.item_status || s) === 'ready');
              }).length },
              { value: 'all', label: 'All', count: orders.length },
              { value: 'ready', label: 'Ready', count: orders.filter((o) => (o.order_status || o.status) === 'ready').length },
              { value: 'served', label: 'Served', count: orders.filter((o) => (o.order_status || o.status) === 'served').length },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActiveFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeFilter === opt.value 
                    ? 'bg-warning text-background' 
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label} <span className="tabular-nums">({opt.count})</span>
              </button>
            ))}
          </div>
          {/* Orders grouped by status */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border p-8 sm:p-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base text-muted-foreground">No matching orders</p>
            </div>
          ) : (
            <div className="space-y-6">
              {['ready', 'preparing', 'received', 'served'].map((statusKey) => {
                const sectionOrders = filteredOrders.filter((o) => (o.order_status || o.status) === statusKey);
                if (sectionOrders.length === 0) return null;
                const headingMap = { ready: 'Ready for Service', preparing: 'Preparing', received: 'Received', served: 'Served' };
                const dotConfig = {
                  ready: 'bg-info',
                  preparing: 'bg-warning',
                  received: 'bg-success',
                  served: 'bg-muted-foreground'
                };
                return (
                  <section key={statusKey}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`h-2 w-2 rounded-full ${dotConfig[statusKey]}`} />
                      <h3 className="text-base font-semibold tracking-tight text-foreground">
                        {headingMap[statusKey]} <span className="text-muted-foreground tabular-nums">({sectionOrders.length})</span>
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {sectionOrders.map((order) => (
                        <div key={order.id} className={`card-minimal ${compact ? 'p-3' : 'p-4'}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className={`font-semibold ${compact ? 'text-sm' : 'text-base'} text-foreground`}>{order.order_number}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">Table: {order.table_number}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${compact ? 'text-base' : 'text-lg'} tabular-nums text-foreground`}>₹{order.total}</p>
                              <div className="flex items-center gap-1 justify-end mt-1">
                                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${
                                  (order.order_status || order.status) === 'ready' ? 'bg-info-light text-info' :
                                  (order.order_status || order.status) === 'preparing' ? 'bg-warning-light text-warning' :
                                  (order.order_status || order.status) === 'served' ? 'bg-success-light text-success' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {order.order_status || order.status}
                                </span>
                                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${
                                  order.payment_status === 'paid' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
                                }`}>
                                  {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                              </div>
                              {order.feedback_submitted && (
                                <p className="text-xs text-success mt-1">✓ Feedback</p>
                              )}
                            </div>
                          </div>

                          {/* Items list with per-item Serve action */}
                          <div className={`mt-3 pt-3 border-t border-border ${compact ? 'space-y-2' : 'space-y-2'}`}>
                            {(order.items || []).map((it, idx) => {
                              const status = deriveItemStatus(order, it);
                              const canServe = order.payment_status === 'paid' && status === 'ready';
                              return (
                                <div key={idx} className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                                      <span className="tabular-nums">{it.quantity}x</span> {it.name}
                                    </span>
                                    {itemStatusBadge(order, it)}
                                  </div>
                                  <div>
                                    <button
                                      disabled={!canServe}
                                      onClick={() => handleServeItem(order, it.menu_item_id)}
                                      className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap font-medium transition-colors ${
                                        canServe 
                                          ? 'bg-success text-background hover:opacity-90' 
                                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                                      }`}
                                    >
                                      <UtensilsCrossed className="w-3 h-3" /> Serve
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Order-level Serve All Items when all items are ready and payment is paid */}
                          {order.payment_status === 'paid' && (order.items || []).every((it) => deriveItemStatus(order, it) === 'ready') && (
                            <div className="mt-3">
                              <button
                                onClick={() => handleServeAll(order)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-success hover:opacity-90 text-background rounded-lg text-sm font-medium transition-opacity w-full"
                              >
                                <UtensilsCrossed className="w-4 h-4" />
                                Serve All Items
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Right-side Calls Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-card border-l border-border shadow-xl transform transition-transform duration-300 z-50 ${showAlerts ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-warning-light">
              <Bell className="w-5 h-5 text-warning" />
            </div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">Waiter Calls</h3>
          </div>
          <button 
            onClick={() => setShowAlerts(false)} 
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-61px)]">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No calls yet.</p>
            </div>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className="card-minimal p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base text-foreground truncate">Table {a.tableNumber}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{new Date(a.at).toLocaleTimeString()}</p>
                </div>
                <button
                  className="text-xs px-3 py-1.5 rounded-lg bg-success text-background hover:opacity-90 whitespace-nowrap flex-shrink-0 font-medium transition-opacity"
                  onClick={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))}
                >
                  Acknowledge
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterDashboard;
