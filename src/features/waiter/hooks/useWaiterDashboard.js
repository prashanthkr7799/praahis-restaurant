/**
 * useWaiterDashboard - Custom hook for waiter dashboard state management
 * Extracted from WaiterDashboardPage to improve maintainability
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, fromRestaurant } from '@config/supabase';
import toast from 'react-hot-toast';
import useRestaurant from '@shared/hooks/useRestaurant';
import notificationService from '@features/notifications/services/notificationService';
import { createInactivityManager } from '@features/auth/services/authService';

/**
 * Hook for managing waiter dashboard data and real-time subscriptions
 */
export function useWaiterDashboard() {
  const navigate = useNavigate();
  const { restaurantId, restaurantName, branding } = useRestaurant();

  // State
  const [user, setUser] = useState(null);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [searchText, setSearchText] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('waiter_sound_enabled');
    return stored !== null ? stored === 'true' : true;
  });

  const alertChannelsRef = useRef([]);

  // Toggle sound setting
  const toggleSound = useCallback(() => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('waiter_sound_enabled', String(newState));
  }, [soundEnabled]);

  // Check auth
  const checkAuth = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  }, []);

  // Fetch single order with items
  const fetchOrderWithItems = useCallback(async (orderId) => {
    const { data } = await supabase
      .from('orders')
      .select(`*, tables (table_number)`)
      .eq('id', orderId)
      .single();

    if (data) {
      return {
        ...data,
        status: data.order_status || data.status,
        table_number: data.tables?.table_number || data.table_number,
        items: Array.isArray(data.items)
          ? data.items
          : typeof data.items === 'string'
            ? JSON.parse(data.items || '[]')
            : [],
      };
    }
    return null;
  }, []);

  // Load data
  const loadData = useCallback(async ({ silent = false, showToast = false } = {}) => {
    try {
      if (!silent) setIsRefreshing(true);

      const { data: tablesData } = await fromRestaurant('tables')
        .select('*')
        .eq('is_active', true)
        .order('table_number');

      const since = new Date();
      since.setDate(since.getDate() - 1);

      const { data: ordersData } = await fromRestaurant('orders')
        .select(`*, tables (table_number)`)
        .gte('created_at', since.toISOString())
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (tablesData) setTables(tablesData);
      if (ordersData) {
        const transformed = ordersData.map((o) => ({
          ...o,
          status: o.order_status || o.status,
          table_number: o.tables?.table_number || o.table_number,
          items: Array.isArray(o.items)
            ? o.items
            : typeof o.items === 'string'
              ? JSON.parse(o.items || '[]')
              : [],
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
  }, []);

  // Mark order as served
  const handleMarkServed = useCallback(async (order) => {
    try {
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

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, status: 'served', order_status: 'served', items: nextItems }
            : o
        )
      );
    } catch (err) {
      console.error('Error marking served:', err);
      toast.error('Failed to mark served');
    }
  }, []);

  // Dismiss alert
  const handleDismissAlert = useCallback((alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  // Logout
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/login');
    toast.success('Logged out');
  }, [navigate]);

  // Get table status
  const getTableStatus = useCallback(
    (tableId) => {
      const table = tables.find((t) => t.id === tableId);
      if (table && table.status) return table.status;

      const tableOrders = orders.filter(
        (o) => o.table_id === tableId && o.status !== 'cancelled' && o.status !== 'served'
      );
      if (tableOrders.length === 0) return 'available';
      if (tableOrders.some((o) => o.status === 'ready')) return 'ready';
      return 'occupied';
    },
    [tables, orders]
  );

  // Calculate stats
  const stats = {
    ready: orders.filter((o) => o.status === 'ready').length,
    inService: orders.filter((o) => ['received', 'preparing'].includes(o.status)).length,
    myTables: tables.length,
    servedToday: orders.filter((o) => o.status === 'served').length,
  };

  // Filter orders based on search
  useEffect(() => {
    let filtered = [...orders].filter((o) => o.status !== 'cancelled');

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          String(o.order_number).toLowerCase().includes(q) ||
          String(o.table_number || '')
            .toLowerCase()
            .includes(q)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchText]);

  // Setup real-time subscriptions and inactivity manager
  useEffect(() => {
    notificationService.registerUserGestureUnlock();
    checkAuth();

    const init = async () => {
      setLoading(true);
      await loadData({ silent: true });
      setLoading(false);
    };
    init();

    // Inactivity timeout (30 min)
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

    // Orders subscription
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined,
        },
        async (payload) => {
          const evt = payload.eventType;
          const newRec = payload.new;
          const oldRec = payload.old;

          if (newRec && newRec.payment_status !== 'paid') return;

          if (evt === 'INSERT' && newRec) {
            const fullOrder = await fetchOrderWithItems(newRec.id);
            if (fullOrder) {
              setOrders((prev) => {
                const exists = prev.some((o) => o.id === fullOrder.id);
                if (!exists) {
                  notificationService.notifyWaiterNewOrder(
                    fullOrder.order_number,
                    fullOrder.table_number || 'N/A'
                  );
                  return [fullOrder, ...prev];
                }
                return prev;
              });
            }
          }
          if (evt === 'UPDATE' && newRec) {
            const fullOrder = await fetchOrderWithItems(newRec.id);
            if (fullOrder) {
              setOrders((prev) => {
                if (oldRec?.payment_status !== 'paid' && newRec.payment_status === 'paid') {
                  const exists = prev.some((o) => o.id === fullOrder.id);
                  if (!exists) {
                    notificationService.notifyWaiterNewOrder(
                      fullOrder.order_number,
                      fullOrder.table_number || 'N/A'
                    );
                    return [fullOrder, ...prev];
                  }
                }
                if (oldRec?.order_status !== 'ready' && newRec.order_status === 'ready') {
                  notificationService.notifyFoodReady(
                    fullOrder.order_number,
                    fullOrder.table_number || 'N/A'
                  );
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

    // Tables subscription
    const tablesSubscription = supabase
      .channel('tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined,
        },
        (payload) => {
          setTables((prev) => {
            const evt = payload.eventType;
            const newRec = payload.new;
            const oldRec = payload.old;
            if (evt === 'INSERT' && newRec) return [...prev, newRec];
            if (evt === 'UPDATE' && newRec)
              return prev.map((t) => (t.id === newRec.id ? newRec : t));
            if (evt === 'DELETE' && oldRec) return prev.filter((t) => t.id !== oldRec.id);
            return prev;
          });
        }
      )
      .subscribe();

    const autoRefreshInterval = setInterval(() => {
      loadData({ silent: true });
    }, 10000);

    // Copy ref.current to a variable for stable cleanup
    const alertChannels = alertChannelsRef.current;

    return () => {
      ordersSubscription.unsubscribe();
      tablesSubscription.unsubscribe();
      alertChannels.forEach((ch) => supabase.removeChannel(ch));
      clearInterval(autoRefreshInterval);
      inactivityManager.stop();
    };
  }, [restaurantId, checkAuth, loadData, fetchOrderWithItems, navigate]);

  return {
    // State
    user,
    tables,
    orders,
    loading,
    isRefreshing,
    alerts,
    activeTab,
    searchText,
    filteredOrders,
    soundEnabled,
    stats,
    restaurantId,
    restaurantName,
    branding,
    alertChannelsRef,

    // Setters
    setActiveTab,
    setSearchText,
    setAlerts,

    // Actions
    toggleSound,
    loadData,
    handleMarkServed,
    handleDismissAlert,
    handleLogout,
    getTableStatus,
  };
}

export default useWaiterDashboard;
