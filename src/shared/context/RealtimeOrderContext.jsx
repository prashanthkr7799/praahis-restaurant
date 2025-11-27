import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import { logger } from '@/shared/utils/helpers/logger';
import toast from 'react-hot-toast';

const RealtimeOrderContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useRealtimeOrders = () => {
  const context = useContext(RealtimeOrderContext);
  if (!context) {
    throw new Error('useRealtimeOrders must be used within a RealtimeOrderProvider');
  }
  return context;
};

export const RealtimeOrderProvider = ({ children }) => {
  const { restaurantId } = useRestaurant();
  
  // State
  const [orders, setOrders] = useState([]); // Today's active/recent orders
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    activeOrders: 0,
    totalStaff: 0,
    yesterdayRevenue: 0,
    yesterdayOrders: 0,
    yesterdayActiveOrders: 0,
    lastWeekStaff: 0,
    totalTables: 0,
    occupiedTables: 0,
    pendingPayments: 0,
    pendingPaymentsAmount: 0,
    todayComplaints: 0,
  });
  const [loading, setLoading] = useState(true);



  // Refresh functions exposed to consumers
  const refreshOrders = useCallback(async () => {
    if (!restaurantId) return;
    try {
      // Fetch today's orders for the "Active" view and recent list
      // IMPORTANT: Exclude pending_payment orders - they should only appear after payment is completed
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables!left(table_number)
        `)
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today.toISOString())
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
  }, [restaurantId]);

  const refreshTables = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select(`
          *,
          table_sessions!table_sessions_table_id_fkey(
            id,
            status,
            created_at
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('table_number');

      if (tablesError) throw tablesError;

      // Enrich with active session orders
      const tablesWithOrders = await Promise.all(
        (tablesData || []).map(async (table) => {
          const activeSessions = table.table_sessions?.filter(s => s.status === 'active') || [];
          
          if (activeSessions.length > 0) {
            const sessionId = activeSessions[0].id;
            const { data: sessionOrders } = await supabase
              .from('orders')
              .select('id, total, payment_status, order_status')
              .eq('session_id', sessionId);
            
            return {
              ...table,
              activeSessionId: sessionId,
              orders: sessionOrders || [],
              totalBill: sessionOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0,
              hasPendingPayments: sessionOrders?.some(o => o.payment_status === 'pending') || false,
            };
          }
          
          return {
            ...table,
            activeSessionId: null,
            orders: [],
            totalBill: 0,
            hasPendingPayments: false,
          };
        })
      );

      setTables(tablesWithOrders);
    } catch (error) {
      console.error('Error refreshing tables:', error);
    }
  }, [restaurantId]);

  const refreshKitchen = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('category')
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error refreshing menu:', error);
    }
  }, [restaurantId]);

  const refreshStaff = useCallback(async () => {
    if (!restaurantId) return;
    try {
      // Staff list
      const { data: staffData, error: staffError } = await supabase
        .rpc('list_staff_for_current_restaurant');

      if (staffError) throw staffError;

      // Enrich with metrics
      const staffWithMetrics = await Promise.all(
        (staffData || []).map(async (member) => {
          const { data: ordersCount } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('restaurant_id', restaurantId)
            .in('order_status', ['served', 'completed']);

          return {
            ...member,
            orders_served: ordersCount || 0,
          };
        })
      );
      setStaff(staffWithMetrics);

      // Feedbacks
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedbacks')
        .select(`
          *,
          orders(order_number, table_id, tables(table_number))
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (feedbackError) throw feedbackError;
      setFeedbacks(feedbackData || []);
    } catch (error) {
      console.error('Error refreshing staff:', error);
    }
  }, [restaurantId]);

  const refreshStats = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Fetch today's orders for stats
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total, payment_status, order_status')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      // Fetch yesterday's orders
      const { data: yesterdayOrders } = await supabase
        .from('orders')
        .select('total, payment_status, order_status')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      // Calculate
      const todayRevenue = todayOrders?.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const yesterdayRevenue = yesterdayOrders?.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      
      const activeOrders = todayOrders?.filter(o => ['received', 'preparing', 'ready'].includes(o.order_status)).length || 0;
      const yesterdayActiveOrders = yesterdayOrders?.filter(o => ['received', 'preparing', 'ready'].includes(o.order_status)).length || 0;

      // Pending payments (all time or recent)
      const { data: pendingData } = await supabase
        .from('orders')
        .select('total')
        .eq('restaurant_id', restaurantId)
        .eq('payment_status', 'pending');
      
      const pendingPayments = pendingData?.length || 0;
      const pendingPaymentsAmount = pendingData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      // Complaints
      const { count: complaintsCount } = await supabase
        .from('complaints')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today.toISOString());

      // Fetch table stats directly to avoid dependency on tables state
      const { data: tablesData } = await supabase
        .from('tables')
        .select('status')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);
      
      const totalTables = tablesData?.length || 0;
      const occupiedTables = tablesData?.filter(t => t.status === 'occupied').length || 0;

      // Fetch staff count directly
      const { count: totalStaff } = await supabase
        .from('users') // Assuming users table holds staff
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId);

      setStats(prev => ({
        ...prev,
        todayRevenue,
        todayOrders: todayOrders?.length || 0,
        activeOrders,
        yesterdayRevenue,
        yesterdayOrders: yesterdayOrders?.length || 0,
        yesterdayActiveOrders,
        pendingPayments,
        pendingPaymentsAmount,
        todayComplaints: complaintsCount || 0,
        totalTables,
        occupiedTables,
        totalStaff: totalStaff || 0
      }));

    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  }, [restaurantId]);

  // Real-time Subscriptions
  useEffect(() => {
    if (!restaurantId) return;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          refreshOrders(),
          refreshTables(),
          refreshKitchen(),
          refreshStaff(),
          refreshStats()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    logger.log('Setting up real-time subscription for restaurant:', restaurantId);

    const channel = supabase.channel(`manager-dashboard-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Only surface orders after payment completion
            if (payload.new.payment_status !== 'paid') return;
            toast.success(`New Order #${payload.new.order_number} received!`);
            setOrders(prev => [payload.new, ...prev]); // Optimistic add
            refreshStats();
          } else if (payload.eventType === 'UPDATE') {
            // If order just became paid, surface it
            if (payload.old?.payment_status !== 'paid' && payload.new.payment_status === 'paid') {
              toast.success(`New Order #${payload.new.order_number} received!`);
              setOrders(prev => [payload.new, ...prev]);
            } else if (payload.new.payment_status !== 'paid') {
              // Remove unpaid orders from active list
              setOrders(prev => prev.filter(o => o.id !== payload.new.id));
            } else {
              setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)); // Optimistic update
            }
            refreshStats();
          } else if (payload.eventType === 'DELETE') {
             setOrders(prev => prev.filter(o => o.id !== payload.old.id));
             refreshStats();
          }
          // We still fetch fresh data to ensure relations (like tables) are up to date
          refreshOrders(); 
          refreshTables();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          refreshTables();
          refreshStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          refreshKitchen();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          refreshStaff();
          refreshStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_sessions',
        },
        (payload) => {
          logger.log('Real-time Session Event (No Filter):', payload);
          refreshTables();
          refreshStats();
        }
      )
      .subscribe((status) => {
        logger.log('Real-time Subscription Status:', status);
      });

    return () => {
      logger.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [restaurantId, refreshOrders, refreshTables, refreshKitchen, refreshStaff, refreshStats]);

  // Polling Fallback (Safety Net)
  useEffect(() => {
    if (!restaurantId) return;

    logger.log('Starting polling fallback...');
    const intervalId = setInterval(() => {
      // Refresh critical data periodically to ensure consistency
      refreshTables();
      refreshStats();
      // Refresh orders less frequently if needed, but here we do it together for simplicity
      refreshOrders(); 
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [restaurantId, refreshTables, refreshStats, refreshOrders]);

  return (
    <RealtimeOrderContext.Provider value={{
      orders,
      tables,
      menuItems,
      staff,
      feedbacks,
      stats,
      loading,
      refreshOrders,
      refreshTables,
      refreshKitchen,
      refreshStaff,
      refreshStats
    }}>
      {children}
    </RealtimeOrderContext.Provider>
  );
};
