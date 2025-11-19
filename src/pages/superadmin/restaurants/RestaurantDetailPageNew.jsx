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
    { id: 'tables', label: 'Tables', icon: Utensils },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const fetchRestaurant = React.useCallback(async () => {
    try {
      setLoading(true);

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
            price_per_table,
            billing_cycle
          )
        `)
        .eq('id', restaurantId)
        .single();

      if (error) throw error;

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
      toast.error('Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, toast]);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant();
    }
  }, [restaurantId, fetchRestaurant]);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant();
    }
  }, [restaurantId, fetchRestaurant]);

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
        {activeTab === 'tables' && <TablesTab restaurantId={restaurantId} />}
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
      <Card title="Restaurant Limits">
        <div className="space-y-4">
          <InfoRow
            label="Max Tables"
            value={restaurant.max_tables || '20'}
          />
          <InfoRow
            label="Max Menu Items"
            value={restaurant.max_menu_items || '100'}
          />
          <InfoRow
            label="Max Users"
            value={restaurant.max_users || '10'}
          />
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
              {member.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {member.name}
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
