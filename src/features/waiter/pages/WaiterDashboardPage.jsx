import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, fromRestaurant } from '@config/supabase';
import toast from 'react-hot-toast';
import { 
  LogOut, RefreshCw, Bell, CheckCircle, Clock, Users, UtensilsCrossed, 
  X, Search, LayoutGrid, List, ChefHat, Sparkles, AlertTriangle,
  TrendingUp, Coffee, Flame, Volume2, VolumeX, CreditCard, MapPin, Zap, Store
} from 'lucide-react';
import useRestaurant from '@shared/hooks/useRestaurant';
import useRealtimeComplaints from '@features/orders/hooks/useOrders';
import notificationService from '@features/notifications/services/notificationService';
import WaiterOrderCard from '@features/waiter/components/WaiterOrderCard';
import { createInactivityManager } from '@features/auth/services/authService';

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const { restaurantId, restaurantName, branding } = useRestaurant();
  const [user, setUser] = useState(null);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'tables'
  const [searchText, setSearchText] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('waiter_sound_enabled');
    return stored !== null ? stored === 'true' : true;
  });
  const alertChannelsRef = useRef([]);

  // Persist sound setting
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('waiter_sound_enabled', String(newState));
  };

  // Real-time complaints hook (runs for notifications, not displayed in UI)
  const { complaints: _complaints } = useRealtimeComplaints(
    restaurantId,
    {
      showNotifications: true,
      notifyWaiter: true,
      waiterId: user?.id,
      autoRefresh: true,
      filter: { status: 'open' },
    }
  );

  useEffect(() => {
    notificationService.registerUserGestureUnlock();
    checkSimpleAuth();
    
    const init = async () => {
      setLoading(true);
      await loadData({ silent: true });
      setLoading(false);
    };
    init();

    // Setup inactivity timeout for shared devices (30 min timeout, 5 min warning)
    const inactivityManager = createInactivityManager({
      timeoutMinutes: 30,
      warningMinutes: 5,
      onWarning: (minutes) => {
        toast(`Session expires in ${minutes} minutes. Tap to stay logged in.`, {
          duration: 10000,
          icon: '⚠️',
          style: { background: '#f59e0b', color: '#fff' },
        });
      },
      onLogout: async () => {
        toast('Session expired due to inactivity', { icon: '🔒' });
        await supabase.auth.signOut();
        navigate('/login');
      },
    });
    inactivityManager.start();

    // Helper to fetch a single order with items (items are JSONB in orders.items)
    const fetchOrderWithItems = async (orderId) => {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          tables (table_number)
        `)
        .eq('id', orderId)
        .single();
      
      if (data) {
        return {
          ...data,
          status: data.order_status || data.status,
          table_number: data.tables?.table_number || data.table_number,
          items: Array.isArray(data.items) ? data.items : (typeof data.items === 'string' ? JSON.parse(data.items || '[]') : [])
        };
      }
      return null;
    };

    // Real-time subscriptions
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined },
        async (payload) => {
          const evt = payload.eventType;
          const newRec = payload.new;
          const oldRec = payload.old;
          
          // Skip any orders whose payment isn't completed yet
          if (newRec && newRec.payment_status !== 'paid') {
            return;
          }
          
          if (evt === 'INSERT' && newRec) {
            // Fetch full order with items
            const fullOrder = await fetchOrderWithItems(newRec.id);
            if (fullOrder) {
              setOrders((prev) => {
                const exists = prev.some((o) => o.id === fullOrder.id);
                if (!exists) {
                  notificationService.notifyWaiterNewOrder(fullOrder.order_number, fullOrder.table_number || 'N/A');
                  return [fullOrder, ...prev];
                }
                return prev;
              });
            }
          }
          if (evt === 'UPDATE' && newRec) {
            // Fetch full order with items
            const fullOrder = await fetchOrderWithItems(newRec.id);
            if (fullOrder) {
              setOrders((prev) => {
                // If order just became non-pending_payment, add it to the list
                    if (oldRec?.payment_status !== 'paid' && newRec.payment_status === 'paid') {
                  const exists = prev.some((o) => o.id === fullOrder.id);
                  if (!exists) {
                    notificationService.notifyWaiterNewOrder(fullOrder.order_number, fullOrder.table_number || 'N/A');
                    return [fullOrder, ...prev];
                  }
                }
                if (oldRec?.order_status !== 'ready' && newRec.order_status === 'ready') {
                  notificationService.notifyFoodReady(fullOrder.order_number, fullOrder.table_number || 'N/A');
                  toast.success(`Order #${fullOrder.order_number} is READY!`, { icon: '🔔' });
                }
                return prev.map((o) => (o.id === fullOrder.id ? fullOrder : o));
              });
            }
          }
          if (evt === 'DELETE' && oldRec) {
            setOrders((prev) => prev.filter((o) => o.id !== oldRec.id));
          }
        }
      )
      .subscribe();

    const tablesSubscription = supabase
      .channel('tables-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tables', filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined },
        (payload) => {
          setTables((prev) => {
            const evt = payload.eventType;
            const newRec = payload.new;
            const oldRec = payload.old;
            if (evt === 'INSERT' && newRec) return [...prev, newRec];
            if (evt === 'UPDATE' && newRec) return prev.map((t) => (t.id === newRec.id ? newRec : t));
            if (evt === 'DELETE' && oldRec) return prev.filter((t) => t.id !== oldRec.id);
            return prev;
          });
        }
      )
      .subscribe();

    const autoRefreshInterval = setInterval(() => {
      loadData({ silent: true });
    }, 10000);

    return () => {
      ordersSubscription.unsubscribe();
      tablesSubscription.unsubscribe();
      alertChannelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      clearInterval(autoRefreshInterval);
      inactivityManager.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Waiter Alerts Subscription
  useEffect(() => {
    if (!tables || tables.length === 0) return;

    const restaurantIds = Array.from(new Set(tables.map((t) => t.restaurant_id).filter(Boolean)));
    
    alertChannelsRef.current.forEach((ch) => supabase.removeChannel(ch));
    alertChannelsRef.current = [];

    const handleCallWaiter = (payload) => {
      const tableNumber = payload?.payload?.tableNumber || 'Unknown';
      const restaurantId = payload?.payload?.restaurantId || null;
      const newAlert = { 
        id: Date.now() + Math.random(), 
        tableNumber, 
        at: new Date().toISOString(), 
        restaurantId,
        type: 'Call Waiter'
      };
      
      setAlerts((prev) => [newAlert, ...prev].slice(0, 20));
      notificationService.playSound('urgent');
      toast((t) => (
        <div className="flex items-center gap-4 bg-[#1a1f2e] border border-red-500/20 p-1 rounded-lg shadow-xl">
          <div className="bg-red-500/10 p-3 rounded-full border border-red-500/20">
            <Bell className="w-6 h-6 text-red-500 animate-bounce" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">Table {tableNumber}</p>
            <p className="text-sm text-red-400 font-medium">Calling for service!</p>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="ml-2 p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ), { duration: 10000, position: 'top-center', style: { background: 'transparent', boxShadow: 'none' } });
    };

    const handleCashRequest = (payload) => {
      const tableNumber = payload?.payload?.tableNumber || 'Unknown';
      const amount = payload?.payload?.amount || 0;
      const restaurantId = payload?.payload?.restaurantId || null;
      
      const newAlert = { 
        id: Date.now() + Math.random(), 
        tableNumber, 
        at: new Date().toISOString(), 
        restaurantId,
        type: 'Cash Payment',
        amount
      };
      
      setAlerts((prev) => [newAlert, ...prev].slice(0, 20));
      notificationService.playSound('success'); // Different sound for money
      
      toast((t) => (
        <div className="flex items-center gap-4 bg-[#1a1f2e] border border-green-500/20 p-1 rounded-lg shadow-xl">
          <div className="bg-green-500/10 p-3 rounded-full border border-green-500/20">
            <span className="text-xl">💵</span>
          </div>
          <div>
            <p className="font-bold text-white text-lg">Table {tableNumber}</p>
            <p className="text-sm text-green-400 font-medium">Cash Payment: ₹{amount}</p>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="ml-2 p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ), { duration: 15000, position: 'top-center', style: { background: 'transparent', boxShadow: 'none' } });
    };

    if (restaurantIds.length === 0) {
      const ch = supabase.channel('waiter-alerts')
        .on('broadcast', { event: 'call_waiter' }, handleCallWaiter)
        .on('broadcast', { event: 'request_cash_payment' }, handleCashRequest)
        .subscribe();
      alertChannelsRef.current.push(ch);
    } else {
      restaurantIds.forEach((rid) => {
        const ch = supabase.channel(`waiter-alerts-${rid}`)
          .on('broadcast', { event: 'call_waiter' }, handleCallWaiter)
          .on('broadcast', { event: 'request_cash_payment' }, handleCashRequest)
          .subscribe();
        alertChannelsRef.current.push(ch);
      });
    }
  }, [tables]);

  // Listen for broadcasts
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase.channel(`broadcast:${restaurantId}`)
      .on('broadcast', { event: 'announcement' }, (payload) => {
        const { message, priority, from, roles } = payload.payload;
        
        // Filter by role if needed (though usually client checks this too)
        // Since we are in WaiterDashboard, we assume the user is a waiter.
        // If roles includes 'all' or 'waiter', show it.
        if (roles.includes('all') || roles.includes('waiter')) {
            toast((t) => (
              <div className="flex flex-col gap-2 min-w-[300px] relative">
                <button 
                  onClick={() => toast.dismiss(t.id)} 
                  className="absolute -top-1 -right-1 p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="font-bold flex items-center gap-2 text-white text-lg border-b border-white/10 pb-2 pr-6">
                  <span className="text-2xl">📢</span>
                  {from} says:
                </div>
                <div className="text-sm text-zinc-300 leading-relaxed">{message}</div>
                {priority === 'high' && (
                    <div className="text-xs text-red-400 font-bold uppercase mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      High Priority
                    </div>
                )}
              </div>
            ), {
              duration: priority === 'high' ? 8000 : 5000,
              style: {
                border: priority === 'high' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                background: '#1a1f2e',
                color: '#fff',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                padding: '16px',
                borderRadius: '12px'
              },
            });
            
            // Play sound for high priority
            if (priority === 'high') {
                notificationService.playSound('urgent');
            } else {
                notificationService.playSound('success');
            }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const checkSimpleAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadData = async ({ silent = false, showToast = false } = {}) => {
    try {
      if (!silent) setIsRefreshing(true);

      const { data: tablesData } = await fromRestaurant('tables').select('*').eq('is_active', true).order('table_number');
      
      const since = new Date();
      since.setDate(since.getDate() - 1); // Last 24 hours
      
      // Only show orders that are fully paid
      // Note: items are stored as JSONB in the orders.items field
      const { data: ordersData } = await fromRestaurant('orders')
        .select(`
          *,
          tables (table_number)
        `)
        .gte('created_at', since.toISOString())
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (tablesData) setTables(tablesData);
      if (ordersData) {
        // Transform orders to ensure status consistency and table_number availability
        // Items are stored as JSONB in the orders.items field
        const transformed = ordersData.map(o => ({
          ...o,
          status: o.order_status || o.status,
          table_number: o.tables?.table_number || o.table_number,
          items: Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? JSON.parse(o.items || '[]') : [])
        }));
        setOrders(transformed);
      }
      
      if (showToast) toast.success('Refreshed');
    } catch (error) {
      console.error('Error loading data:', error);
      if (showToast) toast.error('Failed to refresh');
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    toast.success('Logged out');
  };

  const handleMarkServed = async (order) => {
    try {
      // Build a single atomic update to avoid status "bounce" back to preparing
      const nowIso = new Date().toISOString();
      const nextItems = Array.isArray(order.items)
        ? order.items.map((it) => ({
            ...it,
            item_status: 'served',
            served_at: it.served_at || nowIso,
          }))
        : [];

      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'served',
          items: nextItems,
          updated_at: nowIso,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (error) throw error;

      toast.success(`Order #${order.order_number} marked as served!`);
      
      // Optimistic update
      setOrders(prev => prev.map(o => 
        o.id === order.id 
          ? { ...o, status: 'served', order_status: 'served', items: nextItems } 
          : o
      ));
    } catch (err) {
      console.error('Error marking served:', err);
      toast.error('Failed to mark served');
    }
  };

  const handleDismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getTableStatus = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table && table.status) return table.status;
    
    const tableOrders = orders.filter(o => o.table_id === tableId && o.status !== 'cancelled' && o.status !== 'served');
    if (tableOrders.length === 0) return 'available';
    if (tableOrders.some(o => o.status === 'ready')) return 'ready';
    return 'occupied';
  };

  // Filter logic
  useEffect(() => {
    let filtered = [...orders];

    // Remove cancelled
    filtered = filtered.filter(o => o.status !== 'cancelled');

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      filtered = filtered.filter((o) =>
        String(o.order_number).toLowerCase().includes(q) ||
        String(o.table_number || '').toLowerCase().includes(q)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchText]);

  // Stats
  const stats = {
    ready: orders.filter(o => o.status === 'ready').length,
    inService: orders.filter(o => ['received', 'preparing'].includes(o.status)).length,
    myTables: tables.length,
    servedToday: orders.filter(o => o.status === 'served').length
  };

  // Loading State - Redesigned
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30 animate-pulse">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-slate-950">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        </div>
        <p className="mt-6 text-slate-400 font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER - Clean, minimal with essential actions
      ═══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-slate-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left - Restaurant Branding */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {branding?.logo_url ? (
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center shadow-lg">
                    <img 
                      src={branding.logo_url} 
                      alt={restaurantName || 'Restaurant'} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                    <div className="hidden w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 items-center justify-center">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                )}
                {alerts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-slate-950 animate-bounce">
                    {alerts.length}
                  </span>
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-white truncate max-w-[200px]">
                  {restaurantName || 'Service Hub'}
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Waiter Dashboard
                </p>
              </div>
            </div>

            {/* Center - Quick Stats (desktop) */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400">{stats.ready} Ready</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">{stats.inService} Cooking</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-400">{stats.servedToday} Served</span>
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleSound}
                className={`p-2.5 rounded-xl transition-all ${soundEnabled ? 'bg-slate-800 text-white' : 'bg-slate-800/50 text-slate-500'}`}
                title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => loadData({ showToast: true })} 
                disabled={isRefreshing}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-white'}`} />
              </button>
              <button 
                onClick={handleLogout} 
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 pb-3">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'orders' 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
              Orders
              {stats.ready > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === 'orders' ? 'bg-white/20' : 'bg-emerald-500 text-white'
                }`}>
                  {stats.ready}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'tables' 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Tables
              {alerts.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === 'tables' ? 'bg-white/20' : 'bg-red-500 text-white'
                }`}>
                  {alerts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          ALERTS BANNER - Urgent notifications
      ═══════════════════════════════════════════════════════════════════════ */}
      {alerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-950/90 via-red-900/80 to-red-950/90 border-b border-red-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
              <div className="flex-shrink-0 flex items-center gap-2 pr-3 border-r border-red-500/30">
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-red-300 uppercase tracking-wider whitespace-nowrap">
                  {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
                </span>
              </div>
              
              {alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className="flex-shrink-0 flex items-center gap-3 bg-black/30 backdrop-blur-sm border border-red-500/30 px-4 py-2.5 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    {alert.type === 'Cash Payment' ? (
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Bell className="w-4 h-4 text-red-400 animate-pulse" />
                    )}
                    <div>
                      <span className="font-bold text-white text-sm">Table {alert.tableNumber}</span>
                      {alert.type === 'Cash Payment' && (
                        <span className="ml-2 text-emerald-400 text-xs font-medium">₹{alert.amount}</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDismissAlert(alert.id)}
                    className="ml-2 px-3 py-1 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* ═══════════════════════════════════════════════════════════════════
            ORDERS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Mobile Stats Cards */}
            <div className="grid grid-cols-4 gap-3 md:hidden">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                <Flame className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                <p className="text-lg font-bold text-white">{stats.ready}</p>
                <p className="text-[10px] text-slate-500 uppercase">Ready</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                <ChefHat className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                <p className="text-lg font-bold text-white">{stats.inService}</p>
                <p className="text-[10px] text-slate-500 uppercase">Cooking</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                <CheckCircle className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                <p className="text-lg font-bold text-white">{stats.servedToday}</p>
                <p className="text-[10px] text-slate-500 uppercase">Served</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
                <MapPin className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                <p className="text-lg font-bold text-white">{stats.myTables}</p>
                <p className="text-[10px] text-slate-500 uppercase">Tables</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search orders or tables..." 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-sm"
              />
              {searchText && (
                <button 
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Order Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* IN KITCHEN Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <ChefHat className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">In Kitchen</h3>
                      <p className="text-xs text-slate-500">Being prepared</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                    {filteredOrders.filter(o => ['received', 'preparing'].includes(o.status)).length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {filteredOrders.filter(o => ['received', 'preparing'].includes(o.status)).map(order => (
                    <WaiterOrderCard key={order.id} order={order} variant="kitchen" />
                  ))}
                  {filteredOrders.filter(o => ['received', 'preparing'].includes(o.status)).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800">
                      <Coffee className="w-10 h-10 text-slate-700 mb-3" />
                      <p className="text-sm text-slate-500 font-medium">Kitchen is clear</p>
                      <p className="text-xs text-slate-600 mt-1">New orders will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* READY Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Ready to Serve</h3>
                      <p className="text-xs text-slate-500">Pick up now</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    {filteredOrders.filter(o => o.status === 'ready').length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {filteredOrders.filter(o => o.status === 'ready').map(order => (
                    <WaiterOrderCard key={order.id} order={order} onMarkServed={handleMarkServed} variant="ready" />
                  ))}
                  {filteredOrders.filter(o => o.status === 'ready').length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800">
                      <Sparkles className="w-10 h-10 text-slate-700 mb-3" />
                      <p className="text-sm text-slate-500 font-medium">No orders ready</p>
                      <p className="text-xs text-slate-600 mt-1">Ready orders appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SERVED Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Served</h3>
                      <p className="text-xs text-slate-500">Completed today</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                    {filteredOrders.filter(o => o.status === 'served').length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {filteredOrders.filter(o => o.status === 'served').slice(0, 10).map(order => (
                    <WaiterOrderCard key={order.id} order={order} variant="served" />
                  ))}
                  {filteredOrders.filter(o => o.status === 'served').length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800">
                      <UtensilsCrossed className="w-10 h-10 text-slate-700 mb-3" />
                      <p className="text-sm text-slate-500 font-medium">No orders served yet</p>
                      <p className="text-xs text-slate-600 mt-1">Completed orders show here</p>
                    </div>
                  )}
                  {filteredOrders.filter(o => o.status === 'served').length > 10 && (
                    <p className="text-center text-xs text-slate-500 py-2">
                      +{filteredOrders.filter(o => o.status === 'served').length - 10} more served
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TABLES TAB
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'tables' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Table Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total</p>
                    <p className="text-3xl font-bold text-white mt-1">{tables.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Available</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-1">
                      {tables.filter(t => getTableStatus(t.id) === 'available').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Occupied</p>
                    <p className="text-3xl font-bold text-amber-400 mt-1">
                      {tables.filter(t => getTableStatus(t.id) === 'occupied').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Needs Attention</p>
                    <p className="text-3xl font-bold text-red-400 mt-1">{alerts.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {tables.map(table => {
                const status = getTableStatus(table.id);
                const hasAlert = alerts.some(a => String(a.tableNumber) === String(table.table_number));
                const currentStatus = hasAlert ? 'attention' : status;
                
                const statusConfig = {
                  available: {
                    bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
                    border: 'border-emerald-500/20 hover:border-emerald-500/40',
                    text: 'text-emerald-400',
                    icon: <CheckCircle className="w-4 h-4" />,
                    label: 'Available'
                  },
                  occupied: {
                    bg: 'bg-amber-500/5 hover:bg-amber-500/10',
                    border: 'border-amber-500/20 hover:border-amber-500/40',
                    text: 'text-amber-400',
                    icon: <Users className="w-4 h-4" />,
                    label: 'Occupied'
                  },
                  ready: {
                    bg: 'bg-blue-500/5 hover:bg-blue-500/10',
                    border: 'border-blue-500/20 hover:border-blue-500/40',
                    text: 'text-blue-400',
                    icon: <Flame className="w-4 h-4" />,
                    label: 'Food Ready'
                  },
                  attention: {
                    bg: 'bg-red-500/10 hover:bg-red-500/15',
                    border: 'border-red-500/40',
                    text: 'text-red-400',
                    icon: <Bell className="w-4 h-4 animate-pulse" />,
                    label: 'Needs You',
                    pulse: true
                  }
                };
                
                const config = statusConfig[currentStatus] || statusConfig.available;
                
                return (
                  <div 
                    key={table.id} 
                    className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center aspect-square group ${config.bg} ${config.border} ${config.pulse ? 'animate-pulse' : ''}`}
                  >
                    {hasAlert && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-slate-950 animate-bounce">
                        <Bell className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    <span className={`text-4xl font-black ${config.text}`}>
                      {table.table_number}
                    </span>
                    
                    <div className={`flex items-center gap-1.5 mt-3 text-[10px] font-bold uppercase tracking-widest ${config.text}`}>
                      {config.icon}
                      <span>{config.label}</span>
                    </div>
                    
                    {table.capacity && (
                      <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {table.capacity} seats
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            
            {tables.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <LayoutGrid className="w-16 h-16 text-slate-700 mb-4" />
                <p className="text-lg font-medium text-slate-400">No tables found</p>
                <p className="text-sm text-slate-500 mt-1">Tables will appear here once configured</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default WaiterDashboard;
