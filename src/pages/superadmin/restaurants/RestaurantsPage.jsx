import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Pause,
  Play,
  Trash2,
  Download,
  Filter,
  CheckCircle,
  AlertTriangle,
  StopCircle,
  Building2,
  RefreshCw,
  Wifi,
  WifiOff,
  MapPin,
  Clock,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  LayoutGrid,
  List,
  Calendar,
  Activity,
  Users,
  CalendarPlus,
} from 'lucide-react';
import { supabaseOwner } from '@/shared/utils/api/supabaseOwnerClient';
import { ConfirmDialog } from '@/shared/components/superadmin/Modal';
import { useToast } from '@/shared/components/superadmin/useToast';
import RestaurantFormModal from '@/shared/components/superadmin/RestaurantFormModal';
import ExtendSubscriptionModal from '@/shared/components/superadmin/ExtendSubscriptionModal';
import { useRestaurantsRealtime } from '@/shared/hooks/useSuperadminRealtime';

// Constants
const RATE_PER_TABLE_PER_DAY = 75;

// Glass Card Component
const GlassCard = ({ children, className = '', onClick, hover = true }) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden
      bg-slate-800/50 backdrop-blur-xl
      border border-white/10 rounded-2xl
      ${hover ? 'hover:border-white/20 hover:bg-slate-800/60 transition-all duration-300' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

const RestaurantsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('filter') || 'all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, restaurant: null });
  const [deactivateDialog, setDeactivateDialog] = useState({ isOpen: false, restaurant: null });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedRestaurantForExtend, setSelectedRestaurantForExtend] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    trial: 0,
    expired: 0,
    totalTables: 0,
    monthlyRevenue: 0
  });

  const fetchRestaurants = React.useCallback(async () => {
    try {
      setLoading(true);

      // Left join to include restaurants without subscriptions
      // Support both old (current_period_end) and new (end_date) schema
      const { data, error } = await supabaseOwner
        .from('restaurants')
        .select(`
          *,
          subscriptions (
            id,
            status,
            current_period_end,
            end_date,
            trial_ends_at,
            plan_name,
            price,
            price_per_table
          )
        `)
        .order(sortBy, { ascending: true });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      // Process data - handle both array and object responses from Supabase
      let processedData = (data || []).map(restaurant => {
        // Supabase might return single object or array based on relationship
        let subscription = restaurant.subscriptions;
        
        // If it's an array, take the first item
        if (Array.isArray(subscription)) {
          subscription = subscription.length > 0 ? subscription[0] : null;
        }
        
        return {
          ...restaurant,
          subscription,
          subscriptionStatus: subscription?.status || 'none',
        };
      });

      // Calculate stats before filtering
      const activeCount = processedData.filter(r => r.subscriptionStatus === 'active').length;
      const trialCount = processedData.filter(r => r.subscriptionStatus === 'trial').length;
      const expiredCount = processedData.filter(r => ['expired', 'inactive', 'cancelled'].includes(r.subscriptionStatus)).length;
      const totalTables = processedData.reduce((sum, r) => sum + (r.max_tables || 0), 0);
      const monthlyRevenue = totalTables * RATE_PER_TABLE_PER_DAY * 30;

      setStats({
        total: processedData.length,
        active: activeCount,
        trial: trialCount,
        expired: expiredCount,
        totalTables,
        monthlyRevenue
      });

      // Apply status filter
      if (statusFilter !== 'all') {
        processedData = processedData.filter(r => r.subscriptionStatus === statusFilter);
      }

      setRestaurants(processedData);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error(`Failed to fetch restaurants: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, sortBy, toast]);

  // Realtime subscription for restaurants updates
  const { isConnected } = useRestaurantsRealtime(fetchRestaurants);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRestaurants();
  };

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleDelete = async () => {
    try {
      const { error } = await supabaseOwner
        .from('restaurants')
        .delete()
        .eq('id', deleteDialog.restaurant.id);

      if (error) throw error;

      toast.success(`Restaurant "${deleteDialog.restaurant.name}" deleted successfully`);
      setDeleteDialog({ isOpen: false, restaurant: null });
      fetchRestaurants();
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error('Failed to delete restaurant');
    }
  };

  const handleDeactivate = async () => {
    try {
      const restaurantId = deactivateDialog.restaurant.id;
      
      // Update subscription status to suspended
      const { error: subError } = await supabaseOwner
        .from('subscriptions')
        .update({ status: 'suspended' })
        .eq('restaurant_id', restaurantId);

      if (subError) {
        console.error('Error updating subscription:', subError);
      }

      // CRITICAL: Also set restaurant.is_active = false to block staff login
      const { error: restError } = await supabaseOwner
        .from('restaurants')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', restaurantId);

      if (restError) throw restError;

      toast.success(`Restaurant "${deactivateDialog.restaurant.name}" deactivated - Staff login blocked`);
      setDeactivateDialog({ isOpen: false, restaurant: null });
      fetchRestaurants();
    } catch (error) {
      console.error('Error deactivating restaurant:', error);
      toast.error('Failed to deactivate restaurant');
    }
  };

  // Reactivate restaurant (play button)
  const handleReactivate = async (restaurant) => {
    try {
      // Update subscription status to active
      const { error: subError } = await supabaseOwner
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('restaurant_id', restaurant.id);

      if (subError) {
        console.error('Error updating subscription:', subError);
      }

      // Set restaurant.is_active = true to allow staff login
      const { error: restError } = await supabaseOwner
        .from('restaurants')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', restaurant.id);

      if (restError) throw restError;

      toast.success(`Restaurant "${restaurant.name}" reactivated - Staff login enabled`);
      fetchRestaurants();
    } catch (error) {
      console.error('Error reactivating restaurant:', error);
      toast.error('Failed to reactivate restaurant');
    }
  };

  const getStatusBadge = (restaurant) => {
    const subscription = restaurant.subscription;
    
    if (!subscription) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-md border border-gray-500/20">
          <StopCircle className="w-3 h-3" />
          No Sub
        </span>
      );
    }

    const status = subscription.status?.toLowerCase() || 'unknown';
    
    // Check expiry if we have a valid date (support both schemas)
    let daysLeft = 0;
    const expiryDate = subscription.current_period_end || subscription.end_date;
    if (expiryDate) {
      const expiresAt = new Date(expiryDate);
      if (!isNaN(expiresAt.getTime())) {
        daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
      }
    }

    const badges = {
      cancelled: { color: 'bg-rose-500/20 text-rose-400 border-rose-500/20', icon: StopCircle, text: 'Cancelled' },
      expired: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/20', icon: AlertTriangle, text: 'Expired' },
      trial: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/20', icon: Clock, text: 'Trial' },
      active: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20', icon: CheckCircle, text: 'Active' },
      inactive: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/20', icon: StopCircle, text: 'Inactive' },
      suspended: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/20', icon: AlertTriangle, text: 'Suspended' },
      grace: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/20', icon: Clock, text: 'Grace' },
    };

    // Handle expired based on date
    if (expiryDate && daysLeft < 0 && status !== 'cancelled') {
      const badge = badges.expired;
      const BadgeIcon = badge.icon;
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border ${badge.color}`}>
          <BadgeIcon className="w-3 h-3" />
          {Math.abs(daysLeft)}d ago
        </span>
      );
    }

    const badge = badges[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/20', icon: Activity, text: status };
    const BadgeIcon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border ${badge.color}`}>
        <BadgeIcon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getExpiryText = (restaurant) => {
    const subscription = restaurant.subscription;
    
    if (!subscription) {
      return { text: 'No sub', color: 'text-gray-500' };
    }

    // Support both old (current_period_end) and new (end_date) schema
    const expiryDate = subscription.current_period_end || subscription.end_date;
    
    // Check if expiry date exists and is valid
    if (!expiryDate) {
      return { text: 'N/A', color: 'text-gray-500' };
    }

    // Use the expiry date from the actual schema
    const expiresAt = new Date(expiryDate);
    
    // Check if date is valid
    if (isNaN(expiresAt.getTime())) {
      return { text: 'Invalid', color: 'text-gray-500' };
    }

    const now = new Date();
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    // Subscription expired
    if (daysLeft < 0) {
      return { 
        text: `${Math.abs(daysLeft)}d ago`, 
        color: 'text-rose-400 font-semibold' 
      };
    }

    // Critical - expires in ≤ 3 days
    if (daysLeft <= 3) {
      return { 
        text: `${daysLeft}d left`, 
        color: 'text-rose-400 font-semibold' 
      };
    }

    // Warning - expires in 4-7 days
    if (daysLeft <= 7) {
      return { 
        text: `${daysLeft}d left`, 
        color: 'text-amber-400 font-semibold' 
      };
    }

    // Caution - expires in 8-15 days
    if (daysLeft <= 15) {
      return { 
        text: `${daysLeft}d left`, 
        color: 'text-amber-400' 
      };
    }

    // Safe - more than 15 days
    return { 
      text: `${daysLeft}d left`, 
      color: 'text-emerald-400' 
    };
  };

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">Restaurants</h1>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              isConnected 
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-xs font-medium text-red-400">Offline</span>
                </>
              )}
            </div>
          </div>
          <p className="text-gray-400">
            Manage {stats.total} restaurants • {stats.totalTables} tables • {formatCurrency(stats.monthlyRevenue)}/month
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl text-white font-medium shadow-lg shadow-emerald-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Add Restaurant</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Restaurants', value: stats.total, icon: Building2, color: 'emerald' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'cyan', badge: `${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}%` },
          { label: 'Trial Period', value: stats.trial, icon: Clock, color: 'blue' },
          { label: 'Needs Attention', value: stats.expired, icon: AlertTriangle, color: 'amber' },
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <GlassCard key={stat.label} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${
                  stat.color === 'emerald' ? 'from-emerald-500/20 to-cyan-500/20' :
                  stat.color === 'cyan' ? 'from-cyan-500/20 to-blue-500/20' :
                  stat.color === 'blue' ? 'from-blue-500/20 to-indigo-500/20' :
                  'from-amber-500/20 to-orange-500/20'
                }`}>
                  <StatIcon className={`w-5 h-5 ${
                    stat.color === 'emerald' ? 'text-emerald-400' :
                    stat.color === 'cyan' ? 'text-cyan-400' :
                    stat.color === 'blue' ? 'text-blue-400' :
                    'text-amber-400'
                  }`} />
                </div>
                {stat.badge && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                    {stat.badge}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </GlassCard>
          );
        })}
      </div>

      {/* Filters */}
      <GlassCard className="p-4" hover={false}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none cursor-pointer transition-all"
              >
                <option value="all" className="bg-slate-800">All Status</option>
                <option value="active" className="bg-slate-800">Active</option>
                <option value="trial" className="bg-slate-800">Trial</option>
                <option value="expired" className="bg-slate-800">Expired</option>
                <option value="inactive" className="bg-slate-800">Inactive</option>
                <option value="cancelled" className="bg-slate-800">Cancelled</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none cursor-pointer transition-all"
            >
              <option value="name" className="bg-slate-800">Sort by Name</option>
              <option value="created_at" className="bg-slate-800">Sort by Date</option>
              <option value="location" className="bg-slate-800">Sort by Location</option>
            </select>

            <button
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Restaurants Grid/Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <GlassCard key={i} className="p-5" hover={false}>
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-white/10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-white/5 rounded-lg" />
                  <div className="h-16 bg-white/5 rounded-lg" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <GlassCard className="p-12 text-center" hover={false}>
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-2xl bg-white/5 mb-4">
              <Building2 className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-white font-medium mb-1">No restaurants found</p>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Add your first restaurant to get started'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Restaurant
            </button>
          </div>
        </GlassCard>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRestaurants.map((restaurant) => {
            const expiry = getExpiryText(restaurant);
            return (
              <GlassCard
                key={restaurant.id}
                className="p-5 group"
                onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}`)}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center overflow-hidden border border-white/10">
                    {restaurant.logo_url ? (
                      <img src={restaurant.logo_url} alt={restaurant.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-emerald-400">{restaurant.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">{restaurant.name}</h3>
                      {getStatusBadge(restaurant)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{restaurant.location || 'No location'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
                    <div className="text-lg font-bold text-white">{restaurant.max_tables || 0}</div>
                    <div className="text-xs text-gray-500">Tables</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
                    <div className={`text-sm font-bold ${expiry.color}`}>{expiry.text}</div>
                    <div className="text-xs text-gray-500">Expires</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
                    <div className="text-lg font-bold text-emerald-400">
                      ₹{((restaurant.max_tables || 0) * RATE_PER_TABLE_PER_DAY * 30 / 1000).toFixed(1)}k
                    </div>
                    <div className="text-xs text-gray-500">/month</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {restaurant.subscription?.plan_name && (
                      <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-md">
                        {restaurant.subscription.plan_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}`)}
                      className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}/edit`)}
                      className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {/* Play/Pause button based on restaurant active status */}
                    {restaurant.is_active === false || restaurant.subscriptionStatus === 'suspended' || restaurant.subscriptionStatus === 'expired' ? (
                      <button
                        onClick={() => handleReactivate(restaurant)}
                        className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Reactivate"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeactivateDialog({ isOpen: true, restaurant })}
                        className="p-2 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        title="Suspend"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    {/* Extend Subscription button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRestaurantForExtend(restaurant);
                        setShowExtendModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      title="Extend Subscription"
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteDialog({ isOpen: true, restaurant })}
                      className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tables</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRestaurants.map((restaurant) => {
                  const expiry = getExpiryText(restaurant);
                  return (
                    <tr key={restaurant.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
                            {restaurant.logo_url ? (
                              <img src={restaurant.logo_url} alt="" className="h-full w-full object-cover rounded-lg" />
                            ) : (
                              <span className="font-bold text-emerald-400">{restaurant.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{restaurant.name}</p>
                            {restaurant.subscription?.plan_name && (
                              <p className="text-xs text-purple-400">{restaurant.subscription.plan_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {restaurant.location || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(restaurant)}</td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">{restaurant.max_tables || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${expiry.color.replace('dark:', '')}`}>
                          {expiry.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}`)}
                            className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}/edit`)}
                            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {/* Play/Pause button based on restaurant active status */}
                          {restaurant.is_active === false || restaurant.subscriptionStatus === 'suspended' || restaurant.subscriptionStatus === 'expired' ? (
                            <button
                              onClick={() => handleReactivate(restaurant)}
                              className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Reactivate"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeactivateDialog({ isOpen: true, restaurant })}
                              className="p-2 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Suspend"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          )}
                          {/* Extend Subscription button */}
                          <button
                            onClick={() => {
                              setSelectedRestaurantForExtend(restaurant);
                              setShowExtendModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Extend Subscription"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ isOpen: true, restaurant })}
                            className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing <span className="text-white font-medium">{filteredRestaurants.length}</span> restaurants
              </div>
              <div className="text-sm text-gray-400">
                Total Tables: <span className="text-emerald-400 font-bold">{stats.totalTables}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, restaurant: null })}
        onConfirm={handleDelete}
        title="Delete Restaurant"
        message={`Are you sure you want to delete "${deleteDialog.restaurant?.name}"?`}
        consequences="This will permanently remove all data including orders, staff, and billing history. This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        requireInput={true}
        requiredValue={deleteDialog.restaurant?.name || ''}
      />

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deactivateDialog.isOpen}
        onClose={() => setDeactivateDialog({ isOpen: false, restaurant: null })}
        onConfirm={handleDeactivate}
        title="Deactivate Restaurant"
        message={`Are you sure you want to deactivate "${deactivateDialog.restaurant?.name}"?`}
        consequences="The restaurant will be suspended and staff won't be able to access the system."
        confirmText="Yes, Deactivate"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Add Restaurant Modal */}
      <RestaurantFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchRestaurants();
          setShowAddModal(false);
        }}
      />

      {/* Extend Subscription Modal */}
      <ExtendSubscriptionModal
        isOpen={showExtendModal}
        onClose={() => {
          setShowExtendModal(false);
          setSelectedRestaurantForExtend(null);
        }}
        restaurant={selectedRestaurantForExtend}
        onSuccess={() => {
          fetchRestaurants();
          setShowExtendModal(false);
          setSelectedRestaurantForExtend(null);
        }}
      />
    </div>
  );
};

export default RestaurantsPage;
