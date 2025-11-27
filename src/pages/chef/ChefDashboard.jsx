import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  LogOut,
  Flame,
  UtensilsCrossed,
  Timer,
  Search,
  X,
  Volume2,
  VolumeX,
  Store,
  ShoppingBag,
  Utensils,
  Sparkles,
  TrendingUp,
  Filter,
  Zap,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { signOut } from '@shared/utils/auth/auth';
import notificationService from '@/domains/notifications/utils/notificationService';

const ChefDashboard = () => {
  const { restaurantId, restaurantName, branding } = useRestaurant();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'dine-in' | 'takeaway' | 'delayed'
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('chef_sound_enabled');
    return stored !== null ? stored === 'true' : true;
  });

  // Persist sound setting
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('chef_sound_enabled', String(newState));
  };

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // Note: items are stored as JSONB in orders.items field, not in order_items table
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (table_number)
        `)
        .eq('restaurant_id', restaurantId)
        .in('order_status', ['received', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform items from JSONB string/array to proper array
      const transformed = (data || []).map(o => ({
        ...o,
        items: Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? JSON.parse(o.items || '[]') : [])
      }));

      setOrders(transformed);
    } catch (error) {
      console.error('Error loading KDS data:', error);
      if (!silent) toast.error('Failed to load orders');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [restaurantId]);

  const subscribeToOrders = useCallback(() => {
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
              style: {
                background: '#10b981',
                color: '#fff',
              },
            });
            loadData(true); // Silent reload
          } else if (payload.eventType === 'UPDATE') {
            loadData(true); // Silent reload
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, loadData, soundEnabled]);

  // Update time every minute for elapsed calculations
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (restaurantId) {
      loadData();
      const unsubscribe = subscribeToOrders();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [restaurantId, loadData, subscribeToOrders]);



  // Listen for broadcasts
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase.channel(`broadcast:${restaurantId}`)
      .on('broadcast', { event: 'announcement' }, (payload) => {
        const { message, priority, from, roles } = payload.payload;
        
        if (roles.includes('all') || roles.includes('chef')) {
            if (soundEnabled) {
              notificationService.playSound(priority === 'high' ? 'urgent' : 'success');
            }
            toast((t) => (
              <div className="flex flex-col gap-2 min-w-[280px] relative">
                <button 
                  onClick={() => toast.dismiss(t.id)} 
                  className="absolute -top-1 -right-1 p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="font-bold flex items-center gap-2 text-white text-base border-b border-white/10 pb-2 pr-6">
                  <span className="text-xl">📢</span>
                  {from} says:
                </div>
                <div className="text-sm text-slate-300 leading-relaxed">{message}</div>
                {priority === 'high' && (
                    <div className="text-xs text-red-400 font-bold uppercase mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      High Priority
                    </div>
                )}
              </div>
            ), {
              duration: priority === 'high' ? 10000 : 6000,
              style: {
                border: priority === 'high' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                background: '#1e293b',
                color: '#fff',
                padding: '16px',
                borderRadius: '12px',
              },
            });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, soundEnabled]);

  // Polling Fallback for KDS
  useEffect(() => {
    if (!restaurantId) return;
    const interval = setInterval(() => {
      loadData(true); // Silent refresh
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [restaurantId, loadData]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Order marked as ${newStatus}`);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getElapsedTime = (dateString) => {
    const diff = Math.floor((currentTime - new Date(dateString)) / 60000);
    return diff;
  };

  const getTimerColor = (minutes) => {
    if (minutes < 10) return 'text-emerald-400';
    if (minutes < 20) return 'text-amber-400';
    return 'text-red-400';
  };

  const getTimerBg = (minutes) => {
    if (minutes < 10) return 'bg-emerald-500/10 border-emerald-500/20';
    if (minutes < 20) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20 animate-pulse';
  };

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(true);
    setIsRefreshing(false);
    toast.success('Refreshed');
  };

  // Filter orders based on search and type
  const getFilteredOrders = (statusOrders) => {
    let filtered = [...statusOrders];
    
    // Search filter
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(o => 
        String(o.order_number).toLowerCase().includes(q) ||
        String(o.tables?.table_number || '').toLowerCase().includes(q) ||
        o.items?.some(item => item.name?.toLowerCase().includes(q))
      );
    }
    
    // Type filter
    if (filterType === 'dine-in') {
      filtered = filtered.filter(o => o.order_type !== 'takeaway');
    } else if (filterType === 'takeaway') {
      filtered = filtered.filter(o => o.order_type === 'takeaway');
    } else if (filterType === 'delayed') {
      filtered = filtered.filter(o => {
        const elapsed = getElapsedTime(o.created_at);
        return elapsed > 15;
      });
    }
    
    return filtered;
  };

  // Ticket Card Component - Clean Rectangular Design
  const TicketCard = ({ order }) => {
    const elapsed = getElapsedTime(order.created_at);
    const isUrgent = elapsed > 15;
    const isTakeaway = order.order_type === 'takeaway';
    
    const variantStyles = {
      received: {
        accent: 'bg-amber-500',
        border: isUrgent ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 'border-amber-500/30 hover:border-amber-500/50',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        badgeText: 'New'
      },
      preparing: {
        accent: 'bg-blue-500',
        border: 'border-blue-500/30 hover:border-blue-500/50',
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        badgeText: 'Cooking'
      },
      ready: {
        accent: 'bg-emerald-500',
        border: 'border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-500/10',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        badgeText: 'Ready'
      }
    };
    
    const style = variantStyles[order.order_status] || variantStyles.received;
    
    return (
      <div className={`rounded-2xl overflow-hidden bg-slate-900/80 border ${style.border} transition-all duration-300 hover:scale-[1.01]`}>
        {/* Top Accent Bar */}
        <div className={`h-1.5 ${style.accent}`} />
        
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            {/* Order Number & Type */}
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-white">#{order.order_number}</h3>
              {isTakeaway ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Takeaway
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                  <Utensils className="w-3.5 h-3.5" />
                  Table {order.tables?.table_number || '?'}
                </span>
              )}
            </div>
            
            {/* Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${getTimerBg(elapsed)}`}>
              <Timer className={`w-4 h-4 ${getTimerColor(elapsed)}`} />
              <span className={`font-mono font-bold text-sm ${getTimerColor(elapsed)}`}>{elapsed}m</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${style.badge}`}>
              {order.order_status === 'preparing' && <Flame className="w-3.5 h-3.5" />}
              {order.order_status === 'received' && <Clock className="w-3.5 h-3.5" />}
              {order.order_status === 'ready' && <CheckCircle className="w-3.5 h-3.5" />}
              {style.badgeText}
            </span>
          </div>
        </div>
        
        {/* Items List */}
        <div className="px-4 pb-3">
          <div className="space-y-2">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 py-1.5 group">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-bold flex items-center justify-center">
                    {item.quantity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-100 font-medium leading-snug group-hover:text-white transition-colors">
                      {item.name}
                    </p>
                    {(item.special_instructions || item.notes) && (
                      <p className="text-xs text-amber-400/80 mt-0.5 flex items-center gap-1">
                        <span>📝</span> {item.special_instructions || item.notes}
                      </p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                    item.is_veg ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                  }`} />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No items found</p>
            )}
          </div>
        </div>
        
        {/* Special Instructions */}
        {order.special_instructions && (
          <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-red-500/5 border border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-200/80 leading-relaxed">{order.special_instructions}</p>
            </div>
          </div>
        )}
        
        {/* Action Button */}
        <div className="p-4 pt-2">
          {order.order_status === 'received' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'preparing')}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Flame className="w-4 h-4" />
              Start Cooking
            </button>
          )}
          {order.order_status === 'preparing' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'ready')}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Ready
            </button>
          )}
          {order.order_status === 'ready' && (
            <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Ready for Pickup
            </div>
          )}
        </div>
      </div>
    );
  };

  // Get filtered orders for each column
  const receivedOrders = getFilteredOrders(orders.filter(o => o.order_status === 'received'));
  const preparingOrders = getFilteredOrders(orders.filter(o => o.order_status === 'preparing'));
  const readyOrders = getFilteredOrders(orders.filter(o => o.order_status === 'ready'));

  // Stats
  const stats = {
    received: orders.filter(o => o.order_status === 'received').length,
    preparing: orders.filter(o => o.order_status === 'preparing').length,
    ready: orders.filter(o => o.order_status === 'ready').length,
    delayed: orders.filter(o => getElapsedTime(o.created_at) > 15).length,
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl shadow-orange-500/30 animate-pulse">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-slate-950">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        </div>
        <p className="mt-6 text-slate-400 font-medium animate-pulse">Loading kitchen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER
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
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <ChefHat className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-white truncate max-w-[200px]">
                  {restaurantName || 'Kitchen Display'}
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Chef Dashboard
                </p>
              </div>
            </div>

            {/* Center - Quick Stats (desktop) */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">{stats.received} New</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Flame className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">{stats.preparing} Cooking</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">{stats.ready} Ready</span>
              </div>
              {stats.delayed > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-semibold text-red-400">{stats.delayed} Delayed</span>
                </div>
              )}
            </div>

            {/* Right - Time & Actions */}
            <div className="flex items-center gap-2">
              {/* Current Time (desktop) */}
              <div className="hidden md:block text-right mr-2">
                <div className="text-lg font-bold text-white font-mono">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
              
              <button 
                onClick={toggleSound}
                className={`p-2.5 rounded-xl transition-all ${soundEnabled ? 'bg-slate-800 text-white' : 'bg-slate-800/50 text-slate-500'}`}
                title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleRefresh}
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
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          FILTERS & SEARCH
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search order #, table, or item..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-sm"
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
          
          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All', icon: Filter },
              { id: 'dine-in', label: 'Dine-In', icon: Utensils },
              { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
              { id: 'delayed', label: 'Delayed', icon: AlertCircle, alert: stats.delayed > 0 },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  filterType === filter.id 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' 
                    : filter.alert 
                      ? 'text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20'
                      : 'text-slate-400 bg-slate-800 hover:text-white hover:bg-slate-700'
                }`}
              >
                <filter.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{filter.label}</span>
                {filter.id === 'delayed' && stats.delayed > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white">
                    {stats.delayed}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 lg:hidden">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-2.5 text-center">
            <Zap className="w-4 h-4 mx-auto text-amber-400 mb-1" />
            <p className="text-lg font-bold text-white">{stats.received}</p>
            <p className="text-[9px] text-slate-500 uppercase">New</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-2.5 text-center">
            <Flame className="w-4 h-4 mx-auto text-blue-400 mb-1" />
            <p className="text-lg font-bold text-white">{stats.preparing}</p>
            <p className="text-[9px] text-slate-500 uppercase">Cooking</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-2.5 text-center">
            <CheckCircle className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
            <p className="text-lg font-bold text-white">{stats.ready}</p>
            <p className="text-[9px] text-slate-500 uppercase">Ready</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-2.5 text-center">
            <Clock className="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p className="text-lg font-bold text-white">{orders.length}</p>
            <p className="text-[9px] text-slate-500 uppercase">Total</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          KANBAN BOARD
      ═══════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* NEW ORDERS Column */}
          <div className="flex flex-col bg-slate-900/30 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">New Orders</h3>
                  <p className="text-xs text-slate-500">Waiting to start</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                {receivedOrders.length}
              </span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-thin scrollbar-thumb-slate-700">
              {receivedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                    <UtensilsCrossed className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">No new orders</p>
                  <p className="text-xs text-slate-600 mt-1">Orders will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedOrders.map(order => <TicketCard key={order.id} order={order} />)}
                </div>
              )}
            </div>
          </div>

          {/* PREPARING Column */}
          <div className="flex flex-col bg-slate-900/30 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Preparing</h3>
                  <p className="text-xs text-slate-500">Being cooked</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                {preparingOrders.length}
              </span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-thin scrollbar-thumb-slate-700">
              {preparingOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                    <ChefHat className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Kitchen is clear</p>
                  <p className="text-xs text-slate-600 mt-1">Start cooking orders!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {preparingOrders.map(order => <TicketCard key={order.id} order={order} />)}
                </div>
              )}
            </div>
          </div>

          {/* READY Column */}
          <div className="flex flex-col bg-slate-900/30 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Ready</h3>
                  <p className="text-xs text-slate-500">For pickup</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                {readyOrders.length}
              </span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-thin scrollbar-thumb-slate-700">
              {readyOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">No orders ready</p>
                  <p className="text-xs text-slate-600 mt-1">Ready orders appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {readyOrders.map(order => <TicketCard key={order.id} order={order} />)}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ChefDashboard;
