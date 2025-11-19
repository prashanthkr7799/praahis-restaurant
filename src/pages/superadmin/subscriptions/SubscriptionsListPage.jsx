import { useState, useEffect } from 'react';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  DollarSign,
  Filter,
  Search,
  Edit,
  Eye,
  ArrowUpCircle
} from 'lucide-react';

const SubscriptionsList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDays, setExtendDays] = useState(14);

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    expiringCount: 0,
    mrr: 0
  });

  useEffect(() => {
    fetchSubscriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions, searchTerm, statusFilter, planFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabaseOwner
        .from('subscriptions')
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
            slug,
            is_active,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubscriptions(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (subs) => {
    const active = subs.filter(s => s.status === 'active').length;
    const trials = subs.filter(s => s.plan_name === 'trial' && s.status === 'active').length;
    
    const expiring = subs.filter(s => {
      const expiryDate = new Date(s.trial_ends_at || s.current_period_end);
      const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      return daysRemaining > 0 && daysRemaining <= 7 && s.status === 'active';
    }).length;

    const revenue = subs
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);

    const mrr = subs
      .filter(s => s.status === 'active' && s.plan_name !== 'trial')
      .reduce((sum, s) => {
        if (s.billing_cycle === 'monthly') return sum + (parseFloat(s.price) || 0);
        if (s.billing_cycle === 'yearly') return sum + ((parseFloat(s.price) || 0) / 12);
        return sum;
      }, 0);

    setStats({
      totalRevenue: revenue,
      activeSubscriptions: active,
      trialSubscriptions: trials,
      expiringCount: expiring,
      mrr: mrr
    });
  };

  const applyFilters = () => {
    let filtered = [...subscriptions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.restaurant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // Plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter(sub => sub.plan_name === planFilter);
    }

    setFilteredSubscriptions(filtered);
  };

  const getDaysRemaining = (subscription) => {
    const expiryDate = new Date(subscription.trial_ends_at || subscription.current_period_end);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' },
      trial: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Trial' },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Expired' },
      cancelled: { color: 'bg-gray-800 text-gray-800', icon: XCircle, label: 'Cancelled' },
      suspended: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Suspended' }
    };

    const badge = badges[status] || badges.cancelled;
    const Icon = badge.icon;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getPlanBadge = (planName) => {
    const colors = {
      trial: 'bg-gray-800 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      pro: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-indigo-100 text-indigo-700'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[planName] || colors.trial}`}>
        {planName?.toUpperCase()}
      </span>
    );
  };

  const handleExtendTrial = async () => {
    if (!selectedSubscription) return;
    // Disabled due to missing backend RPC in this build
    toast.error('Extend trial is not available in this build');
    setShowExtendModal(false);
  };

  const handleUpgradeSubscription = async (newPlan) => {
    if (!selectedSubscription) return;

    try {
      const planPrices = {
        basic: 999,
        pro: 2999,
        enterprise: 9999
      };

      const { error } = await supabaseOwner
        .from('subscriptions')
        .update({
          plan_name: newPlan,
          status: 'active',
          price: planPrices[newPlan],
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trial_ends_at: null
        })
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      toast.success(`Subscription upgraded to ${newPlan.toUpperCase()}`);
      setShowUpgradeModal(false);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Failed to upgrade subscription');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Subscriptions Management</h1>
        <p className="text-gray-600">Monitor and manage all restaurant subscriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total MRR"
          value={formatCurrency(stats.mrr)}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Active"
          value={stats.activeSubscriptions}
          icon={CheckCircle}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Trials"
          value={stats.trialSubscriptions}
          icon={Clock}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringCount}
          icon={AlertTriangle}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={TrendingUp}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-700 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by restaurant name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Plans</option>
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchSubscriptions}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Days Left
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-200">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((subscription) => {
                  const daysRemaining = getDaysRemaining(subscription);
                  const isExpiring = daysRemaining <= 7 && daysRemaining > 0;

                  return (
                    <tr key={subscription.id} className="hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.restaurant?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.restaurant?.email || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPlanBadge(subscription.plan_name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(subscription.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(subscription.price || 0)}
                        {subscription.billing_cycle && (
                          <span className="text-gray-500">/{subscription.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(subscription.trial_ends_at || subscription.current_period_end)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {daysRemaining > 0 ? (
                          <span className={`text-sm font-medium ${isExpiring ? 'text-orange-600' : 'text-gray-600'}`}>
                            {daysRemaining} days
                            {isExpiring && <span className="ml-1">⚠️</span>}
                          </span>
                        ) : (
                          <span className="text-sm text-red-600 font-medium">Expired</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {subscription.plan_name === 'trial' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedSubscription(subscription);
                                  setShowExtendModal(true);
                                }}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Extend Trial"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSubscription(subscription);
                                  setShowUpgradeModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-900 p-1"
                                title="Upgrade Plan"
                              >
                                <ArrowUpCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
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

      {/* Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <Modal
          title="Subscription Details"
          onClose={() => setShowDetailsModal(false)}
        >
          <div className="space-y-4">
            <DetailRow label="Restaurant" value={selectedSubscription.restaurant?.name} />
            <DetailRow label="Email" value={selectedSubscription.restaurant?.email} />
            <DetailRow label="Phone" value={selectedSubscription.restaurant?.phone} />
            <DetailRow label="Plan" value={selectedSubscription.plan_name?.toUpperCase()} />
            <DetailRow label="Status" value={selectedSubscription.status} />
            <DetailRow label="Price" value={formatCurrency(selectedSubscription.price || 0)} />
            <DetailRow label="Billing Cycle" value={selectedSubscription.billing_cycle} />
            <DetailRow label="Started" value={formatDate(selectedSubscription.created_at)} />
            <DetailRow label="Current Period Start" value={formatDate(selectedSubscription.current_period_start)} />
            <DetailRow label="Current Period End" value={formatDate(selectedSubscription.current_period_end)} />
            {selectedSubscription.trial_ends_at && (
              <DetailRow label="Trial Ends" value={formatDate(selectedSubscription.trial_ends_at)} />
            )}
            <DetailRow label="Days Remaining" value={`${getDaysRemaining(selectedSubscription)} days`} />
            <DetailRow label="Max Users" value={selectedSubscription.max_users} />
            <DetailRow label="Max Tables" value={selectedSubscription.max_tables} />
            <DetailRow label="Max Menu Items" value={selectedSubscription.max_menu_items} />
          </div>
        </Modal>
      )}

      {/* Extend Trial Modal */}
      {showExtendModal && selectedSubscription && (
        <Modal
          title="Extend Trial Period"
          onClose={() => setShowExtendModal(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Extend the trial period for <strong>{selectedSubscription.restaurant?.name}</strong>
            </p>
            <div>
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
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                New expiry date: <strong>
                  {new Date(Date.now() + extendDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}
                </strong>
              </p>
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
        </Modal>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedSubscription && (
        <Modal
          title="Upgrade Subscription"
          onClose={() => setShowUpgradeModal(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Upgrade <strong>{selectedSubscription.restaurant?.name}</strong> to a paid plan
            </p>
            <div className="grid grid-cols-1 gap-4">
              <PlanCard
                name="Basic"
                price={999}
                features={['Up to 10 users', 'Up to 20 tables', 'Up to 100 menu items', 'Basic analytics']}
                onSelect={() => handleUpgradeSubscription('basic')}
              />
              <PlanCard
                name="Pro"
                price={2999}
                features={['Up to 50 users', 'Up to 100 tables', 'Unlimited menu items', 'Advanced analytics', 'Priority support']}
                onSelect={() => handleUpgradeSubscription('pro')}
              />
              <PlanCard
                name="Enterprise"
                price={9999}
                features={['Unlimited users', 'Unlimited tables', 'Unlimited menu items', 'Custom analytics', '24/7 support', 'Custom integrations']}
                onSelect={() => handleUpgradeSubscription('enterprise')}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon, color, bgColor }) => {
  const Icon = icon;
  return (
    <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-400 transition-colors"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-sm text-gray-900">{value || 'N/A'}</span>
  </div>
);

const PlanCard = ({ name, price, features, onSelect }) => (
  <div className="border-2 border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-colors">
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="text-lg font-semibold text-gray-900">{name}</h4>
        <p className="text-2xl font-bold text-orange-600">₹{price}<span className="text-sm text-gray-500">/month</span></p>
      </div>
      <button
        onClick={onSelect}
        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm"
      >
        Select
      </button>
    </div>
    <ul className="space-y-2">
      {features.map((feature, idx) => (
        <li key={idx} className="text-sm text-gray-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

export default SubscriptionsList;
