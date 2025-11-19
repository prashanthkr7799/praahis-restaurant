import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import { Search, Plus, Edit, Eye, Power, Clock, ArrowUpCircle, RefreshCw, Trash2 } from 'lucide-react';
import Badge from '@shared/components/primitives/Badge';
import toast from 'react-hot-toast';

/**
 * Modern Restaurant & Subscriptions Management
 * Follows design system with semantic colors and fixed-width action columns
 */
const RestaurantsSubscriptions = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, restaurant: null });
  const [deleting, setDeleting] = useState(false);

  // Fetch restaurants with subscriptions
  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseOwner
        .from('restaurants')
        .select(`
          *,
          subscription:subscriptions(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Get subscription plan badge variant
  const getPlanVariant = (status) => {
    if (!status) return { variant: 'outline', text: 'NO PLAN' };
    if (status === 'trial') return { variant: 'secondary', text: 'TRIAL' };
    if (status === 'active') return { variant: 'info', text: 'ACTIVE' };
    return { variant: 'outline', text: status.toUpperCase() };
  };

  // Get status badge variant
  const getStatusVariant = (isActive) => ({
    variant: isActive ? 'success' : 'destructive',
    text: isActive ? 'Active' : 'Inactive'
  });

  // Calculate days remaining
  const getDaysRemaining = (restaurant) => {
    if (!restaurant.subscription || restaurant.subscription.length === 0) return 'N/A';
    
    const sub = Array.isArray(restaurant.subscription) ? restaurant.subscription[0] : restaurant.subscription;
    const expiryDate = new Date(sub.trial_ends_at || sub.current_period_end);
    const now = new Date();
    const days = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `Expired ${Math.abs(days)}d ago`;
    if (days === 0) return 'Today';
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  // Get expiry date
  const getExpiryDate = (restaurant) => {
    if (!restaurant.subscription || restaurant.subscription.length === 0) return 'N/A';
    
    const sub = Array.isArray(restaurant.subscription) ? restaurant.subscription[0] : restaurant.subscription;
    const expiryDate = new Date(sub.trial_ends_at || sub.current_period_end);
    return expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter restaurants by search
  const filteredRestaurants = restaurants.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle active status
  const toggleStatus = async (restaurant) => {
    try {
      const { error } = await supabaseOwner
        .from('restaurants')
        .update({ is_active: !restaurant.is_active })
        .eq('id', restaurant.id);

      if (error) throw error;

      toast.success(`Restaurant ${!restaurant.is_active ? 'activated' : 'deactivated'}`);
      fetchRestaurants();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  // Delete restaurant
  const handleDelete = async () => {
    if (!deleteModal.restaurant) return;

    setDeleting(true);
    try {
      const { error } = await supabaseOwner
        .from('restaurants')
        .delete()
        .eq('id', deleteModal.restaurant.id);

      if (error) throw error;

      toast.success(`Restaurant "${deleteModal.restaurant.name}" deleted successfully`);
      setDeleteModal({ show: false, restaurant: null });
      fetchRestaurants();
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error(error.message || 'Failed to delete restaurant');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading restaurants...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 dark:text-foreground mb-1">
              Restaurants & Subscriptions
            </h1>
            <p className="text-sm text-gray-400 dark:text-muted-foreground">
              {filteredRestaurants.length} total
            </p>
          </div>
          <button
            onClick={() => navigate('/superadmin/restaurants/new')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Restaurant
          </button>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 dark:bg-card border border-gray-600 dark:border-border rounded-lg text-gray-100 dark:text-foreground placeholder:text-gray-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
        <button
          onClick={fetchRestaurants}
          className="p-2.5 bg-gray-900 dark:bg-card border border-gray-600 dark:border-border rounded-lg hover:bg-gray-800 dark:hover:bg-muted/30 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4 text-gray-300 dark:text-foreground" />
        </button>
      </div>

      {/* Restaurant Table */}
      <div className="bg-gray-900 dark:bg-card rounded-lg border border-gray-600 dark:border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600 dark:border-border bg-gray-800 dark:bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 dark:text-foreground uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 dark:text-foreground uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 dark:text-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 dark:text-foreground uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 dark:text-foreground uppercase tracking-wider">
                  Days Left
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 dark:text-foreground uppercase tracking-wider" style={{ minWidth: '500px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-border">
              {filteredRestaurants.map((restaurant) => {
                const planBadge = getPlanVariant(restaurant.subscription?.[0]?.status || restaurant.subscription_status);
                const statusBadge = getStatusVariant(restaurant.is_active);
                const isTrial = restaurant.subscription?.[0]?.status === 'trial' || restaurant.subscription_status === 'trial';

                return (
                  <tr key={restaurant.id} className="hover:bg-gray-800 dark:hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-100 dark:text-foreground">{restaurant.name}</div>
                        <div className="text-xs text-gray-400 dark:text-muted-foreground">
                          {restaurant.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={planBadge.variant} size="sm">
                        {planBadge.text}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={statusBadge.variant} size="sm">
                        {statusBadge.text}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-100 dark:text-foreground">
                      {getExpiryDate(restaurant)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-100 dark:text-foreground">
                      {getDaysRemaining(restaurant)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {/* View Button - Fixed 70px */}
                        <button
                          onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}`)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-info/10 text-info hover:bg-info/20 transition-colors border border-info/20"
                          style={{ width: '70px' }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>

                        {/* Edit Button - Fixed 70px */}
                        <button
                          onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}/edit`)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-muted/50 text-foreground hover:bg-muted transition-colors border border-border"
                          style={{ width: '70px' }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        {/* Conditional Trial Actions - 170px space */}
                        {isTrial ? (
                          <>
                            {/* Extend Button - 80px */}
                            <button
                              onClick={() => toast.success('Extend trial feature coming soon')}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-success/10 text-success hover:bg-success/20 transition-colors border border-success/20"
                              style={{ width: '80px' }}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Extend
                            </button>

                            {/* Upgrade Button - 90px */}
                            <button
                              onClick={() => toast.success('Upgrade feature coming soon')}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-upgrade/10 text-upgrade hover:bg-upgrade/20 transition-colors border border-upgrade/20"
                              style={{ width: '90px' }}
                            >
                              <ArrowUpCircle className="h-3.5 w-3.5" />
                              Upgrade
                            </button>
                          </>
                        ) : (
                          // Empty spacer to maintain alignment
                          <div style={{ width: '174px' }} />
                        )}

                        {/* Activate/Deactivate Button - Fixed 110px */}
                        <button
                          onClick={() => toggleStatus(restaurant)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            restaurant.is_active
                              ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20'
                              : 'bg-success/10 text-success hover:bg-success/20 border-success/20'
                          }`}
                          style={{ width: '110px' }}
                        >
                          <Power className="h-3.5 w-3.5" />
                          {restaurant.is_active ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Delete Button - Fixed 80px */}
                        <button
                          onClick={() => setDeleteModal({ show: true, restaurant })}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors border border-destructive/20"
                          style={{ width: '80px' }}
                          title="Delete restaurant"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.restaurant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 dark:bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-600 dark:border-border">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-100 dark:text-foreground mb-1">
                  Delete Restaurant
                </h3>
                <p className="text-sm text-gray-400 dark:text-muted-foreground">
                  Are you sure you want to delete <strong>"{deleteModal.restaurant.name}"</strong>?
                </p>
              </div>
            </div>

            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-destructive font-medium mb-2">⚠️ This action cannot be undone!</p>
              <p className="text-xs text-gray-300 dark:text-gray-300">
                All associated data will be permanently deleted:
              </p>
              <ul className="text-xs text-gray-400 dark:text-gray-400 mt-2 space-y-1 ml-4 list-disc">
                <li>Subscription records</li>
                <li>Payment history</li>
                <li>Staff members & users</li>
                <li>Menu items & categories</li>
                <li>Tables & sessions</li>
                <li>Orders & ratings</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, restaurant: null })}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-gray-800 dark:bg-muted text-gray-100 dark:text-foreground rounded-lg hover:bg-gray-200 dark:hover:bg-muted/80 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Restaurant
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantsSubscriptions;
