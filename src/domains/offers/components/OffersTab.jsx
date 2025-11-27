import { useState, useEffect } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { 
  Gift, 
  Ticket, 
  Crown, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Calendar,
  Clock,
  Award,
  History
} from 'lucide-react';
import CreateOfferModal from './CreateOfferModal';
import CreateCouponModal from './CreateCouponModal';
import MembershipTiersManager from './MembershipTiersManager';
import RewardPointsManager from './RewardPointsManager';
import OfferAnalytics from './OfferAnalytics';
import OfferHistoryModal from './OfferHistoryModal';
import { isCouponExpired, isWithinSchedule } from '../utils/offersUtils';

export default function OffersTab() {
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedSections, setExpandedSections] = useState({
    activeOffers: true,
    scheduledOffers: false,
    expiredOffers: false,
    coupons: true,
    membership: false,
    rewards: false,
    analytics: false,
    history: false
  });

  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [showMembershipManager, setShowMembershipManager] = useState(false);
  const [showRewardsManager, setShowRewardsManager] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [editingOffer, setEditingOffer] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);

  useEffect(() => {
    fetchAllData();
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchOffers(),
        fetchCoupons(),
        fetchLoyaltyPoints()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOffers() {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching offers:', error);
      return;
    }

    setOffers(data || []);
  }

  async function fetchCoupons() {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      return;
    }

    setCoupons(data || []);
  }

  async function fetchLoyaltyPoints() {
    const { data, error } = await supabase
      .from('loyalty_points')
      .select('*, users(name, email)')
      .order('points_balance', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching loyalty points:', error);
      return;
    }

    setLoyaltyPoints(data || []);
  }

  function setupRealtimeSubscriptions() {
    // Subscribe to offers changes
    const offersSubscription = supabase
      .channel('offers_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'offers' },
        () => fetchOffers()
      )
      .subscribe();

    // Subscribe to coupons changes
    const couponsSubscription = supabase
      .channel('coupons_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'coupons' },
        () => fetchCoupons()
      )
      .subscribe();

    // Subscribe to loyalty points changes
    const loyaltySubscription = supabase
      .channel('loyalty_points_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'loyalty_points' },
        () => fetchLoyaltyPoints()
      )
      .subscribe();

    return () => {
      offersSubscription.unsubscribe();
      couponsSubscription.unsubscribe();
      loyaltySubscription.unsubscribe();
    };
  }

  function toggleSection(section) {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }

  function categorizeOffers() {
    const now = new Date();
    
    const active = offers.filter(offer => 
      offer.status === 'active' && 
      isWithinSchedule(offer.valid_from, offer.valid_until)
    );

    const scheduled = offers.filter(offer =>
      offer.status === 'active' && 
      new Date(offer.valid_from) > now
    );

    const expired = offers.filter(offer =>
      offer.status === 'inactive' || 
      (offer.valid_until && new Date(offer.valid_until) < now)
    );

    return { active, scheduled, expired };
  }

  function categorizeCoupons() {
    const active = coupons.filter(c => 
      c.status === 'active' && 
      !isCouponExpired(c)
    );

    const expired = coupons.filter(c => 
      c.status === 'inactive' || 
      isCouponExpired(c)
    );

    return { active, expired };
  }

  const { active: activeOffers, scheduled: scheduledOffers, expired: expiredOffers } = categorizeOffers();
  const { active: activeCoupons } = categorizeCoupons();

  async function handleDeleteOffer(offerId) {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId);

    if (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer');
    }
  }

  async function handleDeleteCoupon(couponId) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Offers & Rewards</h1>
        </div>
        <p className="text-emerald-50">Manage offers, coupons, membership tiers, and loyalty rewards</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setShowCreateOfferModal(true)}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all flex items-center gap-3"
        >
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold">Create Offer</span>
        </button>

        <button
          onClick={() => setShowCreateCouponModal(true)}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all flex items-center gap-3"
        >
          <div className="bg-blue-500 p-2 rounded-lg">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold">Create Coupon</span>
        </button>

        <button
          onClick={() => setShowMembershipManager(true)}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all flex items-center gap-3"
        >
          <div className="bg-purple-500 p-2 rounded-lg">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold">Manage Tiers</span>
        </button>

        <button
          onClick={() => setShowRewardsManager(true)}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all flex items-center gap-3"
        >
          <div className="bg-amber-500 p-2 rounded-lg">
            <Award className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold">Rewards Settings</span>
        </button>
      </div>

      {/* Active Offers Section */}
      <CollapsibleSection
        title="Active Offers"
        icon={Gift}
        count={activeOffers.length}
        expanded={expandedSections.activeOffers}
        onToggle={() => toggleSection('activeOffers')}
        color="emerald"
      >
        {activeOffers.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No active offers</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOffers.map(offer => (
              <OfferCard 
                key={offer.id} 
                offer={offer} 
                onEdit={() => {
                  setEditingOffer(offer);
                  setShowCreateOfferModal(true);
                }}
                onDelete={() => handleDeleteOffer(offer.id)}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Scheduled Offers Section */}
      <CollapsibleSection
        title="Scheduled Offers"
        icon={Calendar}
        count={scheduledOffers.length}
        expanded={expandedSections.scheduledOffers}
        onToggle={() => toggleSection('scheduledOffers')}
        color="blue"
      >
        {scheduledOffers.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No scheduled offers</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledOffers.map(offer => (
              <OfferCard 
                key={offer.id} 
                offer={offer} 
                onEdit={() => {
                  setEditingOffer(offer);
                  setShowCreateOfferModal(true);
                }}
                onDelete={() => handleDeleteOffer(offer.id)}
                scheduled
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Expired Offers Section */}
      <CollapsibleSection
        title="Expired Offers"
        icon={Clock}
        count={expiredOffers.length}
        expanded={expandedSections.expiredOffers}
        onToggle={() => toggleSection('expiredOffers')}
        color="gray"
      >
        {expiredOffers.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No expired offers</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiredOffers.map(offer => (
              <OfferCard 
                key={offer.id} 
                offer={offer} 
                onDelete={() => handleDeleteOffer(offer.id)}
                expired
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Active Coupons Section */}
      <CollapsibleSection
        title="Active Coupons"
        icon={Ticket}
        count={activeCoupons.length}
        expanded={expandedSections.coupons}
        onToggle={() => toggleSection('coupons')}
        color="blue"
      >
        {activeCoupons.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No active coupons</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCoupons.map(coupon => (
              <CouponCard 
                key={coupon.id} 
                coupon={coupon} 
                onEdit={() => {
                  setEditingCoupon(coupon);
                  setShowCreateCouponModal(true);
                }}
                onDelete={() => handleDeleteCoupon(coupon.id)}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Loyalty Leaderboard Section */}
      <CollapsibleSection
        title="Loyalty Points Leaderboard"
        icon={TrendingUp}
        count={loyaltyPoints.length}
        expanded={expandedSections.rewards}
        onToggle={() => toggleSection('rewards')}
        color="amber"
      >
        {loyaltyPoints.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No loyalty data</p>
        ) : (
          <div className="space-y-2">
            {loyaltyPoints.map((entry, index) => (
              <div 
                key={entry.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center justify-between hover:bg-white/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-orange-400' :
                    'text-gray-400'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{entry.users?.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-400">{entry.users?.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-500">{entry.points_balance}</div>
                  <div className="text-sm text-gray-400">points</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Analytics Section */}
      <CollapsibleSection
        title="Analytics & Insights"
        icon={TrendingUp}
        expanded={expandedSections.analytics}
        onToggle={() => toggleSection('analytics')}
        color="purple"
      >
        <button
          onClick={() => setShowAnalytics(true)}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
        >
          View Detailed Analytics
        </button>
      </CollapsibleSection>

      {/* History Section */}
      <CollapsibleSection
        title="Redemption History"
        icon={History}
        expanded={expandedSections.history}
        onToggle={() => toggleSection('history')}
        color="cyan"
      >
        <button
          onClick={() => setShowHistory(true)}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
        >
          View Full History
        </button>
      </CollapsibleSection>

      {/* Modals */}
      {showCreateOfferModal && (
        <CreateOfferModal
          offer={editingOffer}
          onClose={() => {
            setShowCreateOfferModal(false);
            setEditingOffer(null);
          }}
          onSuccess={() => {
            setShowCreateOfferModal(false);
            setEditingOffer(null);
            fetchOffers();
          }}
        />
      )}

      {showCreateCouponModal && (
        <CreateCouponModal
          coupon={editingCoupon}
          onClose={() => {
            setShowCreateCouponModal(false);
            setEditingCoupon(null);
          }}
          onSuccess={() => {
            setShowCreateCouponModal(false);
            setEditingCoupon(null);
            fetchCoupons();
          }}
        />
      )}

      {showMembershipManager && (
        <MembershipTiersManager
          onClose={() => setShowMembershipManager(false)}
        />
      )}

      {showRewardsManager && (
        <RewardPointsManager
          onClose={() => setShowRewardsManager(false)}
        />
      )}

      {showAnalytics && (
        <OfferAnalytics
          offers={offers}
          coupons={coupons}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {showHistory && (
        <OfferHistoryModal
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({ title, icon: Icon, count, expanded, onToggle, color, children }) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-teal-500',
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    amber: 'from-amber-500 to-orange-500',
    cyan: 'from-cyan-500 to-blue-500',
    gray: 'from-gray-500 to-gray-600'
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className={`bg-gradient-to-r ${colorClasses[color]} p-2 rounded-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold">{title}</h2>
          {count !== undefined && (
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
              {count}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {expanded && (
        <div className="p-4 border-t border-white/10">
          {children}
        </div>
      )}
    </div>
  );
}

// Offer Card Component
function OfferCard({ offer, onEdit, onDelete, scheduled, expired }) {
  const getOfferTypeLabel = (type) => {
    const labels = {
      percentage: 'Percentage Off',
      flat: 'Flat Discount',
      bogo: 'Buy One Get One',
      category: 'Category Offer',
      item: 'Item Offer'
    };
    return labels[type] || type;
  };

  return (
    <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 ${
      expired ? 'opacity-50' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{offer.offer_name || 'Unnamed Offer'}</h3>
          <p className="text-sm text-gray-400">{getOfferTypeLabel(offer.offer_type)}</p>
        </div>
        {scheduled && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Scheduled
          </span>
        )}
        {expired && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Expired
          </span>
        )}
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Discount:</span>
          <span className="font-semibold">
            {offer.discount_type === 'percentage' 
              ? `${offer.discount_value}%` 
              : `₹${offer.discount_value}`}
          </span>
        </div>
        {offer.min_order_amount && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Min Order:</span>
            <span className="font-semibold">₹{offer.min_order_amount}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Valid Until:</span>
          <span className="font-semibold">
            {new Date(offer.valid_until).toLocaleDateString()}
          </span>
        </div>
      </div>

      {!expired && (
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 rounded-lg transition-all"
            >
              Edit
            </button>
          )}
          <button
            onClick={onDelete}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded-lg transition-all"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// Coupon Card Component
function CouponCard({ coupon, onEdit, onDelete }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="bg-blue-500 text-white font-mono text-lg px-3 py-1 rounded-lg inline-block mb-2">
            {coupon.code}
          </div>
          <p className="text-sm text-gray-400">{coupon.description || 'No description'}</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Discount:</span>
          <span className="font-semibold">
            {coupon.discount_type === 'percentage' 
              ? `${coupon.discount_value}%` 
              : `₹${coupon.discount_value}`}
          </span>
        </div>
        {coupon.min_order_amount && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Min Order:</span>
            <span className="font-semibold">₹{coupon.min_order_amount}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Used:</span>
          <span className="font-semibold">
            {coupon.usage_count || 0} / {coupon.usage_limit || '∞'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Expires:</span>
          <span className="font-semibold">
            {new Date(coupon.valid_until).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 rounded-lg transition-all"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded-lg transition-all"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
