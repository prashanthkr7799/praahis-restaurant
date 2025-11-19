import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Pause,
  Trash2,
  Download,
  Filter,
  CheckCircle,
  AlertTriangle,
  StopCircle,
  Building2,
} from 'lucide-react';
import { supabaseOwner } from '@/shared/utils/api/supabaseOwnerClient';
import Button from '@/shared/components/superadmin/Button';
import Badge from '@/shared/components/superadmin/Badge';
import { ConfirmDialog } from '@/shared/components/superadmin/Modal';
import { useToast } from '@/shared/components/superadmin/useToast';
import RestaurantFormModal from '@/shared/components/superadmin/RestaurantFormModal';

const RestaurantsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('filter') || 'all');
  const [sortBy, setSortBy] = useState('name');
  
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, restaurant: null });
  const [deactivateDialog, setDeactivateDialog] = useState({ isOpen: false, restaurant: null });
  const [showAddModal, setShowAddModal] = useState(false);

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
    }
  }, [statusFilter, sortBy, toast]);

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
      const { error } = await supabaseOwner
        .from('subscriptions')
        .update({ status: 'suspended' })
        .eq('restaurant_id', deactivateDialog.restaurant.id);

      if (error) throw error;

      toast.success(`Restaurant "${deactivateDialog.restaurant.name}" deactivated`);
      setDeactivateDialog({ isOpen: false, restaurant: null });
      fetchRestaurants();
    } catch (error) {
      console.error('Error deactivating restaurant:', error);
      toast.error('Failed to deactivate restaurant');
    }
  };

  const getStatusBadge = (restaurant) => {
    const subscription = restaurant.subscription;
    
    if (!subscription) {
      return <Badge variant="inactive">No Subscription</Badge>;
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

    // Handle different status values from the database
    if (status === 'cancelled') {
      return (
        <Badge variant="danger" icon={StopCircle}>
          Cancelled
        </Badge>
      );
    }

    if (status === 'expired' || (expiryDate && daysLeft < 0)) {
      const daysOverdue = Math.abs(daysLeft);
      return (
        <Badge variant="warning" icon={AlertTriangle}>
          Expired {daysOverdue > 0 ? `(${daysOverdue}d ago)` : ''}
        </Badge>
      );
    }

    if (status === 'trial') {
      return (
        <Badge variant="info" icon={CheckCircle}>
          Trial
        </Badge>
      );
    }

    if (status === 'active') {
      return (
        <Badge variant="success" icon={CheckCircle}>
          Active
        </Badge>
      );
    }

    if (status === 'inactive') {
      return (
        <Badge variant="inactive">
          Inactive
        </Badge>
      );
    }

    if (status === 'suspended') {
      return (
        <Badge variant="warning" icon={AlertTriangle}>
          Suspended
        </Badge>
      );
    }

    if (status === 'grace') {
      return (
        <Badge variant="warning" icon={AlertTriangle}>
          Grace Period
        </Badge>
      );
    }

    // Fallback for unknown statuses
    return <Badge variant="default">{status || 'Unknown'}</Badge>;
  };

  const getExpiryText = (restaurant) => {
    const subscription = restaurant.subscription;
    
    if (!subscription) {
      return { text: 'No subscription', color: 'text-gray-500 dark:text-gray-400' };
    }

    // Support both old (current_period_end) and new (end_date) schema
    const expiryDate = subscription.current_period_end || subscription.end_date;
    
    // Check if expiry date exists and is valid
    if (!expiryDate) {
      return { text: 'No expiry set', color: 'text-gray-500 dark:text-gray-400' };
    }

    // Use the expiry date from the actual schema
    const expiresAt = new Date(expiryDate);
    
    // Check if date is valid
    if (isNaN(expiresAt.getTime())) {
      console.error('Invalid date for restaurant:', restaurant.name, expiryDate);
      return { text: 'Invalid date', color: 'text-gray-500 dark:text-gray-400' };
    }

    const now = new Date();
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    // Subscription expired
    if (daysLeft < 0) {
      return { 
        text: `${Math.abs(daysLeft)}d overdue`, 
        color: 'text-red-600 dark:text-red-400 font-semibold' 
      };
    }

    // Critical - expires in ≤ 3 days
    if (daysLeft <= 3) {
      return { 
        text: `${daysLeft}d left`, 
        color: 'text-red-600 dark:text-red-400 font-semibold' 
      };
    }

    // Warning - expires in 4-7 days
    if (daysLeft <= 7) {
      return { 
        text: `${daysLeft}d left`, 
        color: 'text-amber-600 dark:text-amber-400 font-semibold' 
      };
    }

    // Caution - expires in 8-15 days
    if (daysLeft <= 15) {
      return { 
        text: `${daysLeft}d left`, 
        color: 'text-amber-600 dark:text-amber-400' 
      };
    }

    // Safe - more than 15 days
    return { 
      text: `${daysLeft}d left`, 
      color: 'text-green-600 dark:text-green-400' 
    };
  };

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Restaurants ({filteredRestaurants.length})
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage all restaurants in the platform
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setShowAddModal(true)}
        >
          Add Restaurant
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name">Sort by Name</option>
            <option value="created_at">Sort by Date</option>
            <option value="location">Sort by Location</option>
          </select>

          {/* Export */}
          <Button variant="outline" icon={Download} size="md">
            Export
          </Button>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expires In
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="animate-pulse flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Building2 className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No restaurants found
                      </p>
                      <Button
                        variant="primary"
                        icon={Plus}
                        size="sm"
                        className="mt-4"
                        onClick={() => navigate('/superadmin/restaurants/add')}
                      >
                        Add First Restaurant
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map((restaurant) => {
                  const expiry = getExpiryText(restaurant);
                  return (
                    <tr
                      key={restaurant.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {restaurant.logo_url ? (
                              <img
                                src={restaurant.logo_url}
                                alt={restaurant.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
                                {restaurant.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {restaurant.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>{restaurant.max_tables || 0} tables</span>
                              {restaurant.subscription?.plan_name && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {restaurant.subscription.plan_name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {restaurant.location || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(restaurant)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${expiry.color}`}>
                          {expiry.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}`)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}/edit`)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeactivateDialog({ isOpen: true, restaurant })}
                            className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                            title="Deactivate"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ isOpen: true, restaurant })}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
};

export default RestaurantsPage;
