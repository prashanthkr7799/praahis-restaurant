import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Building2,
  Users,
  ShoppingBag,
  Utensils,
  FileText,
  Settings as SettingsIcon,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertTriangle,
  UtensilsCrossed,
  CreditCard,
  Image,
  Tag,
  DollarSign,
  Eye,
  EyeOff,
  Search,
  Filter,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { supabaseOwner } from '@/shared/utils/api/supabaseOwnerClient';
import Button from '@/shared/components/superadmin/Button';
import Badge from '@/shared/components/superadmin/Badge';
import Card from '@/shared/components/superadmin/Card';
import { useToast } from '@/shared/components/superadmin/useToast';

/**
 * Professional Restaurant Detail Page with 6 Tabs
 * Page 2.1 from SuperAdmin Design Specifications
 */
const RestaurantDetailPageNew = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'tables', label: 'Tables', icon: Utensils },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const fetchRestaurant = React.useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Fetching restaurant with ID:', restaurantId);

      const { data, error } = await supabaseOwner
        .from('restaurants')
        .select(`
          *,
          subscriptions (
            id,
            plan_name,
            status,
            current_period_end,
            end_date,
            trial_ends_at,
            price,
            price_per_table
          )
        `)
        .eq('id', restaurantId)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No restaurant found with ID:', restaurantId);
        toast.error('Restaurant not found');
        navigate('/superadmin/restaurants');
        return;
      }

      console.log('Restaurant data:', data);

      // Handle subscription - could be array or object
      let subscription = data.subscriptions;
      if (Array.isArray(subscription)) {
        subscription = subscription.length > 0 ? subscription[0] : null;
      }


      setRestaurant({
        ...data,
        subscription,
      });
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      if (error.code === 'PGRST116') {
        toast.error('Restaurant not found');
        navigate('/superadmin/restaurants');
      } else if (error.message?.includes('JWT')) {
        toast.error('Session expired. Please login again.');
        navigate('/superadmin/login');
      } else {
        toast.error('Failed to load restaurant details: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }, [restaurantId, toast, navigate]);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant();
    }
  }, [restaurantId, fetchRestaurant]);

  // Real-time subscription for restaurant updates (limits, subscription changes)
  useEffect(() => {
    if (!restaurantId) return;

    const subscription = supabaseOwner
      .channel(`restaurant-${restaurantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'restaurants',
        filter: `id=eq.${restaurantId}`
      }, () => {
        fetchRestaurant();
        toast.success('Restaurant data updated');
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `restaurant_id=eq.${restaurantId}`
      }, () => {
        fetchRestaurant();
        toast.info('Subscription updated');
      })
      .subscribe();

    return () => {
      supabaseOwner.removeChannel(subscription);
    };
  }, [restaurantId, fetchRestaurant, toast]);

  const getStatusBadge = () => {
    if (!restaurant?.subscription) {
      return <Badge variant="inactive">No Subscription</Badge>;
    }

    const status = restaurant.subscription.status;

    if (status === 'active') {
      return <Badge variant="active" icon={CheckCircle}>Active</Badge>;
    }
    if (status === 'trial') {
      return <Badge variant="info">Trial</Badge>;
    }
    if (status === 'expired') {
      return <Badge variant="warning" icon={AlertTriangle}>Expired</Badge>;
    }
    if (status === 'cancelled') {
      return <Badge variant="danger">Cancelled</Badge>;
    }
    if (status === 'inactive') {
      return <Badge variant="inactive">Inactive</Badge>;
    }

    return <Badge variant="default">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Building2 className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-400">Restaurant not found</p>
        <Button
          variant="primary"
          onClick={() => navigate('/superadmin/restaurants')}
          className="mt-4"
        >
          Back to Restaurants
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/superadmin/restaurants')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex items-start gap-4">
            {/* Restaurant Logo */}
            <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-8 w-8 text-gray-400" />
              )}
            </div>

            {/* Restaurant Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {restaurant.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {getStatusBadge()}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {restaurant.id.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          icon={Edit}
          onClick={() => navigate(`/superadmin/restaurants/${restaurantId}/edit`)}
        >
          Edit Restaurant
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && <OverviewTab restaurant={restaurant} />}
        {activeTab === 'staff' && <StaffTab restaurantId={restaurantId} />}
        {activeTab === 'orders' && <OrdersTab restaurantId={restaurantId} />}
        {activeTab === 'menu' && <MenuTab restaurantId={restaurantId} />}
        {activeTab === 'tables' && <TablesTab restaurantId={restaurantId} />}
        {activeTab === 'payments' && <PaymentsTab restaurantId={restaurantId} />}
        {activeTab === 'logs' && <LogsTab restaurantId={restaurantId} />}
        {activeTab === 'settings' && <SettingsTab restaurant={restaurant} onUpdate={fetchRestaurant} />}
      </div>
    </div>
  );
};

// ============================================================================
// OVERVIEW TAB
// ============================================================================
const OverviewTab = ({ restaurant }) => {
  const subscription = restaurant.subscription;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Information */}
      <Card title="Basic Information">
        <div className="space-y-4">
          <InfoRow
            icon={Building2}
            label="Restaurant Name"
            value={restaurant.name}
          />
          <InfoRow
            icon={MapPin}
            label="Address"
            value={restaurant.address || 'Not provided'}
          />
          <InfoRow
            icon={Phone}
            label="Phone"
            value={restaurant.phone || 'Not provided'}
          />
          <InfoRow
            icon={Mail}
            label="Email"
            value={restaurant.email || 'Not provided'}
          />
          <InfoRow
            icon={Calendar}
            label="Created"
            value={new Date(restaurant.created_at).toLocaleDateString()}
          />
        </div>
      </Card>

      {/* Subscription Details */}
      <Card title="Subscription Details">
        {subscription ? (
          <div className="space-y-4">
            <InfoRow
              label="Plan"
              value={subscription.plan_name || 'Standard Plan'}
            />
            <InfoRow
              label="Status"
              value={subscription.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'N/A'}
            />
            <InfoRow
              label="Expires On"
              value={
                subscription.current_period_end 
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : subscription.end_date
                    ? new Date(subscription.end_date).toLocaleDateString()
                    : 'N/A'
              }
            />
            {subscription.trial_ends_at && (
              <InfoRow
                label="Trial Ends"
                value={new Date(subscription.trial_ends_at).toLocaleDateString()}
              />
            )}
            {subscription.price && (
              <InfoRow
                label="Price"
                value={`₹${subscription.price.toLocaleString()}/month`}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No subscription found
          </div>
        )}
      </Card>

      {/* Restaurant Limits */}
      <Card title="Restaurant Limits & Pricing">
        <div className="space-y-4">
          <InfoRow
            label="Max Tables"
            value={`${restaurant.max_tables || 20} (₹75/table/day)`}
          />
          <InfoRow
            label="Staff & Menu Items"
            value="Unlimited (included)"
          />
          <div className="border-t border-gray-700 pt-4 mt-4">
            <InfoRow
              label="Est. Monthly Cost"
              value={`₹${((restaurant.max_tables || 20) * 75 * 30).toLocaleString()}`}
            />
            <div className="mt-2 text-xs text-gray-500">
              <p className="mb-1">₹75/table/day includes:</p>
              <div className="grid grid-cols-2 gap-1">
                <span>• Core Platform: ₹30</span>
                <span>• Unlimited Staff: ₹18</span>
                <span>• Unlimited Menu: ₹12</span>
                <span>• Billing & POS: ₹15</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* System Info */}
      <Card title="System Information">
        <div className="space-y-4">
          <InfoRow
            label="Restaurant ID"
            value={restaurant.id}
            mono
          />
          <InfoRow
            label="Active Status"
            value={restaurant.is_active ? 'Active' : 'Inactive'}
          />
          <InfoRow
            label="Last Updated"
            value={new Date(restaurant.updated_at).toLocaleString()}
          />
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// STAFF TAB
// ============================================================================
const StaffTab = ({ restaurantId }) => {
  const [staff, setStaff] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchStaff = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseOwner
        .from('users')
        .select('id, name, full_name, email, phone, role, is_active, created_at')
        .eq('restaurant_id', restaurantId)
        .in('role', ['manager', 'admin', 'waiter', 'chef'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map data to ensure name exists (fallback to full_name)
      const mappedData = (data || []).map(user => ({
        ...user,
        name: user.name || user.full_name || 'Unknown'
      }));
      
      setStaff(mappedData);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, toast]);

  React.useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (staff.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No staff members found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            This restaurant doesn't have any staff members yet
          </p>
        </div>
      </Card>
    );
  }

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      waiter: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      chef: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${roleColors[role] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <Card title={`Staff Members (${staff.length})`}>
      <div className="space-y-3">
        {staff.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            {/* Avatar */}
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {(member.full_name || member.name || member.email || '?').charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {member.full_name || member.name || 'Unknown'}
                </p>
                {!member.is_active && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                {member.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </span>
                )}
                {member.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {member.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex-shrink-0">
              {getRoleBadge(member.role)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ============================================================================
// ORDERS TAB
// ============================================================================
const OrdersTab = ({ restaurantId: _restaurantId }) => {
  return (
    <Card>
      <div className="text-center py-12">
        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Orders history coming soon</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          View order statistics and history
        </p>
      </div>
    </Card>
  );
};

// ============================================================================
// TABLES TAB
// ============================================================================
const TablesTab = ({ restaurantId: _restaurantId }) => {
  return (
    <Card>
      <div className="text-center py-12">
        <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Tables management coming soon</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          View and manage restaurant tables
        </p>
      </div>
    </Card>
  );
};

// ============================================================================
// LOGS TAB
// ============================================================================
const LogsTab = ({ restaurantId: _restaurantId }) => {
  return (
    <Card>
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Activity logs coming soon</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          View audit trail and activity logs
        </p>
      </div>
    </Card>
  );
};

// ============================================================================
// SETTINGS TAB
// ============================================================================
const SettingsTab = ({ restaurant: _restaurant, onUpdate: _onUpdate }) => {
  return (
    <Card>
      <div className="text-center py-12">
        <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Settings management coming soon</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Configure restaurant settings and preferences
        </p>
      </div>
    </Card>
  );
};

// ============================================================================
// MENU TAB
// ============================================================================
const MenuTab = ({ restaurantId }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const { data: catData } = await supabaseOwner
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('display_order', { ascending: true });
        
        setCategories(catData || []);
        
        // Fetch menu items
        const { data: itemsData } = await supabaseOwner
          .from('menu_items')
          .select('*, categories(name)')
          .eq('restaurant_id', restaurantId)
          .order('name', { ascending: true });
        
        setMenuItems(itemsData || []);
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenu();
  }, [restaurantId]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <Card.Body>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </Card.Body>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Card.Body className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{menuItems.length}</p>
            <p className="text-sm text-gray-500">Total Items</p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="text-center py-4">
            <p className="text-2xl font-bold text-emerald-600">{menuItems.filter(i => i.is_available).length}</p>
            <p className="text-sm text-gray-500">Available</p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="text-center py-4">
            <p className="text-2xl font-bold text-amber-600">{categories.length}</p>
            <p className="text-sm text-gray-500">Categories</p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="text-center py-4">
            <p className="text-2xl font-bold text-purple-600">{menuItems.filter(i => i.is_veg).length}</p>
            <p className="text-sm text-gray-500">Veg Items</p>
          </Card.Body>
        </Card>
      </div>

      {/* Menu Items Grid */}
      <Card>
        <Card.Header>
          <Card.Title>Menu Items ({filteredItems.length})</Card.Title>
        </Card.Header>
        <Card.Body>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No menu items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {item.image_url && (
                    <div className="h-32 bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                      </div>
                      <span className={`shrink-0 w-4 h-4 rounded-full border-2 ${
                        item.is_veg ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500'
                      }`} />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-emerald-600">{formatCurrency(item.price)}</span>
                      <Badge variant={item.is_available ? 'success' : 'secondary'}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {item.categories?.name || 'Uncategorized'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

// ============================================================================
// PAYMENTS TAB
// ============================================================================
const PaymentsTab = ({ restaurantId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    transactionCount: 0
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabaseOwner
          .from('payments')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('payment_date', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        
        setPayments(data || []);
        
        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const totalRevenue = data?.reduce((sum, p) => sum + Number(p.total || 0), 0) || 0;
        const todayRevenue = data?.filter(p => new Date(p.payment_date) >= today)
          .reduce((sum, p) => sum + Number(p.total || 0), 0) || 0;
        const weekRevenue = data?.filter(p => new Date(p.payment_date) >= weekAgo)
          .reduce((sum, p) => sum + Number(p.total || 0), 0) || 0;
        
        setStats({
          totalRevenue,
          todayRevenue,
          weekRevenue,
          transactionCount: data?.length || 0
        });
        
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, [restaurantId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Card.Body className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Today</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.todayRevenue)}</p>
              </div>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">This Week</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.weekRevenue)}</p>
              </div>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Transactions</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.transactionCount}</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Payments</Card.Title>
        </Card.Header>
        <Card.Body className="p-0">
          {payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {payments.slice(0, 20).map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        #{payment.order_id?.slice(-6) || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{payment.payment_method || 'Online'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {payment.razorpay_payment_id || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 text-right">
                        {formatCurrency(payment.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================
const InfoRow = ({ icon: Icon, label, value, mono = false }) => {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
      </div>
      <span className={`text-sm text-gray-900 dark:text-gray-100 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
};

export default RestaurantDetailPageNew;
