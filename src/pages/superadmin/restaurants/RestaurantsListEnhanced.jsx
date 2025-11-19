import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import { Search, Plus, Edit, Trash2, Eye, Power, Clock, ArrowUpCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Enhanced RestaurantsList Component with Subscription Management
 */
const RestaurantsListEnhanced = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Modal states
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [extendDays, setExtendDays] = useState(14);
  
  const itemsPerPage = 10;

  // Fetch restaurants with subscriptions
  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      let query = supabaseOwner
        .from('restaurants')
        .select(`
          *,
          subscription:subscriptions(*)
        `, { count: 'exact' });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      if (planFilter !== 'all') {
        query = query.eq('subscription_status', planFilter);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      setRestaurants(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, planFilter, currentPage]);

  // Get days remaining
  const getDaysRemaining = (subscription) => {
    if (!subscription || subscription.length === 0) return null;
    const sub = Array.isArray(subscription) ? subscription[0] : subscription;
    const expiryDate = new Date(sub.trial_ends_at || sub.current_period_end);
    const now = new Date();
    return Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  };

  // Extend trial (disabled)
  const handleExtendTrial = async () => {
    toast.error('Extend trial is not available in this build');
    setShowExtendModal(false);
  };

  // Upgrade subscription
  const handleUpgrade = async (planName) => {
    try {
      const planPrices = { basic: 999, pro: 2999, enterprise: 9999 };
      const subscription = Array.isArray(selectedRestaurant.subscription) 
        ? selectedRestaurant.subscription[0] 
        : selectedRestaurant.subscription;

      const { error } = await supabaseOwner
        .from('subscriptions')
        .update({
          plan_name: planName,
          status: 'active',
          price: planPrices[planName],
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trial_ends_at: null
        })
        .eq('id', subscription.id);

      if (error) throw error;

      toast.success(`Upgraded to ${planName.toUpperCase()}`);
      setShowUpgradeModal(false);
      fetchRestaurants();
    } catch (error) {
      console.error('Error upgrading:', error);
      toast.error('Failed to upgrade subscription');
    }
  };

  // Toggle status
  const toggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabaseOwner
        .from('restaurants')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Restaurant ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchRestaurants();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Delete restaurant
  const deleteRestaurant = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabaseOwner
        .from('restaurants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Restaurant deleted');
      fetchRestaurants();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete restaurant');
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurants & Subscriptions</h1>
          <p className="text-gray-400 mt-1">Manage all restaurants and their subscriptions ({totalCount} total)</p>
        </div>
        <button
          onClick={() => navigate('/superadmin/restaurants/new')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Add Restaurant
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Plans</option>
            <option value="trial">Trial</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <button
          onClick={fetchRestaurants}
          className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-100 border border-gray-600 rounded-lg"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-100 uppercase">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-100 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-100 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-100 uppercase">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-100 uppercase">Days Left</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-100 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {restaurants.map((restaurant) => {
                  const subscription = Array.isArray(restaurant.subscription) 
                    ? restaurant.subscription[0] 
                    : restaurant.subscription;
                  const daysRemaining = getDaysRemaining(restaurant.subscription);
                  const isExpiring = daysRemaining && daysRemaining <= 7 && daysRemaining > 0;
                  const isTrial = subscription?.plan_name === 'trial';

                  return (
                    <tr key={restaurant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{restaurant.name}</div>
                          <div className="text-sm text-gray-500">{restaurant.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isTrial ? 'bg-gray-800 text-gray-700' :
                          subscription?.plan_name === 'basic' ? 'bg-blue-100 text-blue-700' :
                          subscription?.plan_name === 'pro' ? 'bg-purple-100 text-purple-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {subscription?.plan_name?.toUpperCase() || 'NO PLAN'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          restaurant.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {restaurant.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {subscription ? new Date(subscription.trial_ends_at || subscription.current_period_end).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {daysRemaining !== null ? (
                          <span className={`text-sm font-medium ${isExpiring ? 'text-orange-600' : 'text-gray-600'}`}>
                            {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                            {isExpiring && ' ⚠️'}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}`)}
                            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/superadmin/restaurants/${restaurant.id}/edit`)}
                            className="px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 rounded-lg flex items-center gap-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          {isTrial && subscription && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRestaurant(restaurant);
                                  setShowExtendModal(true);
                                }}
                                className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1"
                                title="Extend Trial"
                              >
                                <Clock className="h-4 w-4" />
                                Extend
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRestaurant(restaurant);
                                  setShowUpgradeModal(true);
                                }}
                                className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg flex items-center gap-1"
                                title="Upgrade Plan"
                              >
                                <ArrowUpCircle className="h-4 w-4" />
                                Upgrade
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => toggleStatus(restaurant.id, restaurant.is_active)}
                            className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                              restaurant.is_active 
                                ? 'text-orange-600 hover:bg-orange-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            <Power className="h-4 w-4" />
                            {restaurant.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteRestaurant(restaurant.id, restaurant.name)}
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-800 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-800 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Extend Trial Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Extend Trial Period</h3>
            <p className="text-gray-400 mb-4">
              Extend trial for <strong>{selectedRestaurant?.name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Extend by (days)
              </label>
              <input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                min="1"
                max="90"
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExtendTrial}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
              >
                Extend Trial
              </button>
              <button
                onClick={() => setShowExtendModal(false)}
                className="flex-1 bg-gray-200 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Upgrade Subscription</h3>
            <p className="text-gray-400 mb-4">
              Upgrade <strong>{selectedRestaurant?.name}</strong> to a paid plan
            </p>
            <div className="space-y-3">
              <PlanOption 
                name="Basic" 
                price={999} 
                features={['10 users', '20 tables', '100 menu items']}
                onSelect={() => handleUpgrade('basic')}
              />
              <PlanOption 
                name="Pro" 
                price={2999} 
                features={['50 users', '100 tables', 'Unlimited menu items', 'Advanced analytics']}
                onSelect={() => handleUpgrade('pro')}
              />
              <PlanOption 
                name="Enterprise" 
                price={9999} 
                features={['Unlimited users', 'Unlimited tables', 'Custom integrations', '24/7 support']}
                onSelect={() => handleUpgrade('enterprise')}
              />
            </div>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="mt-4 w-full bg-gray-200 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PlanOption = ({ name, price, features, onSelect }) => (
  <div className="border-2 border-gray-700 rounded-lg p-4 hover:border-orange-500 transition">
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className="font-semibold text-lg">{name}</h4>
        <p className="text-2xl font-bold text-orange-600">₹{price}<span className="text-sm text-gray-500">/mo</span></p>
      </div>
      <button
        onClick={onSelect}
        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
      >
        Select
      </button>
    </div>
    <ul className="text-sm text-gray-400 space-y-1">
      {features.map((f, i) => <li key={i}>✓ {f}</li>)}
    </ul>
  </div>
);

export default RestaurantsListEnhanced;
