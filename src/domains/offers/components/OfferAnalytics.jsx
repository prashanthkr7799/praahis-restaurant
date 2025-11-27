import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function OfferAnalytics({ offers, onClose }) {
  const [analytics, setAnalytics] = useState({
    offerUsage: [],
    couponRedemption: [],
    revenueImpact: { totalRevenue: 0, totalDiscount: 0, netRevenue: 0 },
    membershipDistribution: [],
    pointsRedemption: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      await Promise.all([
        fetchOfferUsage(),
        fetchCouponRedemption(),
        fetchRevenueImpact(),
        fetchMembershipDistribution(),
        fetchPointsRedemption()
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOfferUsage() {
    const { data: orders } = await supabase
      .from('orders')
      .select('offer_applied, final_amount')
      .not('offer_applied', 'is', null);

    if (orders) {
      const usageMap = {};
      orders.forEach(order => {
        if (order.offer_applied) {
          usageMap[order.offer_applied] = (usageMap[order.offer_applied] || 0) + 1;
        }
      });

      const offerUsage = Object.entries(usageMap).map(([offerId, count]) => {
        const offer = offers.find(o => o.id === offerId);
        return {
          name: offer?.offer_name || 'Unknown',
          count
        };
      }).sort((a, b) => b.count - a.count).slice(0, 10);

      setAnalytics(prev => ({ ...prev, offerUsage }));
    }
  }

  async function fetchCouponRedemption() {
    const { data: orders } = await supabase
      .from('orders')
      .select('coupon_applied, discount_amount')
      .not('coupon_applied', 'is', null);

    if (orders) {
      const redemptionMap = {};
      orders.forEach(order => {
        if (order.coupon_applied) {
          if (!redemptionMap[order.coupon_applied]) {
            redemptionMap[order.coupon_applied] = { count: 0, totalDiscount: 0 };
          }
          redemptionMap[order.coupon_applied].count++;
          redemptionMap[order.coupon_applied].totalDiscount += order.discount_amount || 0;
        }
      });

      const couponRedemption = Object.entries(redemptionMap).map(([code, data]) => ({
        name: code,
        count: data.count,
        totalDiscount: data.totalDiscount
      })).sort((a, b) => b.count - a.count).slice(0, 10);

      setAnalytics(prev => ({ ...prev, couponRedemption }));
    }
  }

  async function fetchRevenueImpact() {
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, discount_amount, final_amount')
      .eq('payment_status', 'paid');

    if (orders) {
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalDiscount = orders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
      const netRevenue = orders.reduce((sum, o) => sum + (o.final_amount || 0), 0);

      setAnalytics(prev => ({
        ...prev,
        revenueImpact: { totalRevenue, totalDiscount, netRevenue }
      }));
    }
  }

  async function fetchMembershipDistribution() {
    const { data: users } = await supabase
      .from('users')
      .select('membership_tier');

    if (users) {
      const distribution = {
        silver: 0,
        gold: 0,
        platinum: 0,
        none: 0
      };

      users.forEach(user => {
        const tier = user.membership_tier?.toLowerCase();
        if (tier && distribution[tier] !== undefined) {
          distribution[tier]++;
        } else {
          distribution.none++;
        }
      });

      const membershipDistribution = Object.entries(distribution).map(([name, value]) => ({
        name: name === 'none' ? 'No Tier' : name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

      setAnalytics(prev => ({ ...prev, membershipDistribution }));
    }
  }

  async function fetchPointsRedemption() {
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, points_redeemed')
      .not('points_redeemed', 'is', null)
      .order('created_at', { ascending: true })
      .limit(30);

    if (orders) {
      const pointsRedemption = orders.map(order => ({
        date: new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        points: order.points_redeemed || 0
      }));

      setAnalytics(prev => ({ ...prev, pointsRedemption }));
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Offers & Rewards Analytics</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Revenue Impact Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Total Revenue</div>
              <div className="text-3xl font-bold text-emerald-500">
                ₹{analytics.revenueImpact.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                Total Discounts
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-red-500">
                -₹{analytics.revenueImpact.totalDiscount.toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Net Revenue</div>
              <div className="text-3xl font-bold text-blue-500">
                ₹{analytics.revenueImpact.netRevenue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Offer Usage */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Top 10 Offers by Usage</h3>
            {analytics.offerUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.offerUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-8">No offer usage data available</p>
            )}
          </div>

          {/* Coupon Redemption */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Top 10 Coupons Redeemed</h3>
            {analytics.couponRedemption.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.couponRedemption}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Redemptions" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="totalDiscount" fill="#f59e0b" name="Total Discount (₹)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-8">No coupon redemption data available</p>
            )}
          </div>

          {/* Membership Distribution */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Membership Tier Distribution</h3>
            {analytics.membershipDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.membershipDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.membershipDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-8">No membership data available</p>
            )}
          </div>

          {/* Points Redemption Trend */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Points Redemption Trend (Last 30 Orders)</h3>
            {analytics.pointsRedemption.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.pointsRedemption}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="points" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-8">No points redemption data available</p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
