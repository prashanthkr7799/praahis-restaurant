/**
 * useKitchenDisplay - Custom hook for kitchen display state management
 * Extracted from KitchenDisplayPage for better maintainability
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@config/supabase';
import { useRestaurant } from '@shared/hooks/useRestaurant';
import toast from 'react-hot-toast';
import { signOut } from '@features/auth/services/authService';
import notificationService from '@features/notifications/services/notificationService';

/**
 * Hook for managing kitchen display data and real-time subscriptions
 */
export function useKitchenDisplay() {
  const { restaurantId, restaurantName, branding } = useRestaurant();
  const navigate = useNavigate();

  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('chef_sound_enabled');
    return stored !== null ? stored === 'true' : true;
  });

  // Toggle sound
  const toggleSound = useCallback(() => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('chef_sound_enabled', String(newState));
  }, [soundEnabled]);

  // Load orders data
  const loadData = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);

        const { data, error } = await supabase
          .from('orders')
          .select(`*, tables (table_number)`)
          .eq('restaurant_id', restaurantId)
          .in('order_status', ['received', 'preparing', 'ready'])
          .order('created_at', { ascending: true });

        if (error) throw error;

        const transformed = (data || []).map((o) => ({
          ...o,
          items: Array.isArray(o.items)
            ? o.items
            : typeof o.items === 'string'
              ? JSON.parse(o.items || '[]')
              : [],
        }));

        setOrders(transformed);
      } catch (error) {
        console.error('Error loading KDS data:', error);
        if (!silent) toast.error('Failed to load orders');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [restaurantId]
  );

  // Update order status
  const updateOrderStatus = useCallback(
    async (orderId, newStatus) => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            order_status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (error) throw error;

        toast.success(`Order marked as ${newStatus}`);
        loadData(true);
      } catch (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status');
      }
    },
    [loadData]
  );

  // Handle logout
  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [navigate]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData(true);
    setIsRefreshing(false);
    toast.success('Refreshed');
  }, [loadData]);

  // Calculate elapsed time
  const getElapsedTime = useCallback(
    (dateString) => {
      const diff = Math.floor((currentTime - new Date(dateString)) / 60000);
      return diff;
    },
    [currentTime]
  );

  // Get timer color based on elapsed time
  const getTimerColor = useCallback((minutes) => {
    if (minutes < 10) return 'text-emerald-400';
    if (minutes < 20) return 'text-amber-400';
    return 'text-red-400';
  }, []);

  // Get timer background based on elapsed time
  const getTimerBg = useCallback((minutes) => {
    if (minutes < 10) return 'bg-emerald-500/10 border-emerald-500/20';
    if (minutes < 20) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20 animate-pulse';
  }, []);

  // Filter orders based on search and type
  const getFilteredOrders = useCallback(
    (statusOrders) => {
      let filtered = [...statusOrders];

      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            String(o.order_number).toLowerCase().includes(q) ||
            String(o.tables?.table_number || '')
              .toLowerCase()
              .includes(q) ||
            o.items?.some((item) => item.name?.toLowerCase().includes(q))
        );
      }

      if (filterType === 'dine-in') {
        filtered = filtered.filter((o) => o.order_type !== 'takeaway');
      } else if (filterType === 'takeaway') {
        filtered = filtered.filter((o) => o.order_type === 'takeaway');
      } else if (filterType === 'delayed') {
        filtered = filtered.filter((o) => {
          const elapsed = getElapsedTime(o.created_at);
          return elapsed > 15;
        });
      }

      return filtered;
    },
    [searchText, filterType, getElapsedTime]
  );

  // Calculate stats
  const stats = {
    received: orders.filter((o) => o.order_status === 'received').length,
    preparing: orders.filter((o) => o.order_status === 'preparing').length,
    ready: orders.filter((o) => o.order_status === 'ready').length,
    total: orders.length,
    delayed: orders.filter((o) => getElapsedTime(o.created_at) > 15).length,
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Initial load and subscription
  useEffect(() => {
    if (!restaurantId) return;

    loadData();

    // Real-time subscription
    const channel = supabase
      .channel('chef-dashboard-kds')
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
            if (soundEnabled) {
              notificationService.playSound('success');
            }
            toast.success(`New Order #${payload.new.order_number}!`, {
              icon: '🔔',
              duration: 5000,
              style: { background: '#10b981', color: '#fff' },
            });
            loadData(true);
          } else if (payload.eventType === 'UPDATE') {
            loadData(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, loadData, soundEnabled]);

  // Polling fallback
  useEffect(() => {
    if (!restaurantId) return;
    const interval = setInterval(() => loadData(true), 5000);
    return () => clearInterval(interval);
  }, [restaurantId, loadData]);

  return {
    // State
    orders,
    loading,
    isRefreshing,
    currentTime,
    searchText,
    filterType,
    soundEnabled,
    stats,
    restaurantId,
    restaurantName,
    branding,

    // Setters
    setSearchText,
    setFilterType,

    // Actions
    toggleSound,
    loadData,
    updateOrderStatus,
    handleLogout,
    handleRefresh,
    getElapsedTime,
    getTimerColor,
    getTimerBg,
    getFilteredOrders,
  };
}

export default useKitchenDisplay;
