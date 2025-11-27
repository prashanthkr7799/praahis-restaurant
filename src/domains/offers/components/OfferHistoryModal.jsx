import { useState, useEffect } from 'react';
import { X, History, Search, Calendar } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';

export default function OfferHistoryModal({ onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, coupon, membership, points

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          users(name, email),
          table_sessions(table_number)
        `)
        .or('coupon_applied.not.is.null,membership_discount.gt.0,points_redeemed.gt.0')
        .order('created_at', { ascending: false })
        .limit(100);

      if (orders) {
        setHistory(orders);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredHistory = history.filter(order => {
    // Filter by type
    if (filterType === 'coupon' && !order.coupon_applied) return false;
    if (filterType === 'membership' && (!order.membership_discount || order.membership_discount === 0)) return false;
    if (filterType === 'points' && (!order.points_redeemed || order.points_redeemed === 0)) return false;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.users?.name?.toLowerCase().includes(searchLower) ||
        order.users?.email?.toLowerCase().includes(searchLower) ||
        order.coupon_applied?.toLowerCase().includes(searchLower) ||
        order.order_number?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Redemption History</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-white/10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer, order, or coupon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="coupon">Coupons Only</option>
              <option value="membership">Membership Only</option>
              <option value="points">Points Only</option>
            </select>
          </div>

          {/* Summary */}
          <div className="flex gap-4 text-sm text-gray-400">
            <span>Total: {filteredHistory.length} orders</span>
            <span>•</span>
            <span>
              Total Discount: ₹
              {filteredHistory.reduce((sum, o) => sum + (o.discount_amount || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No redemption history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map(order => (
                <div
                  key={order.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                          {order.order_number || 'N/A'}
                        </span>
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="text-sm text-gray-300">
                        <div>Customer: {order.users?.name || 'Guest'}</div>
                        {order.table_sessions?.table_number && (
                          <div>Table: {order.table_sessions.table_number}</div>
                        )}
                      </div>
                    </div>

                    {/* Discount Details */}
                    <div className="flex-1">
                      <div className="space-y-2">
                        {order.coupon_applied && (
                          <div className="flex items-center justify-between bg-blue-500/20 rounded-lg px-3 py-2">
                            <span className="text-sm text-blue-300">Coupon: {order.coupon_applied}</span>
                            <span className="font-semibold text-blue-400">
                              -₹{(order.discount_amount || 0).toFixed(2)}
                            </span>
                          </div>
                        )}

                        {order.membership_discount && order.membership_discount > 0 && (
                          <div className="flex items-center justify-between bg-purple-500/20 rounded-lg px-3 py-2">
                            <span className="text-sm text-purple-300">
                              Membership ({order.membership_tier})
                            </span>
                            <span className="font-semibold text-purple-400">
                              -₹{order.membership_discount.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {order.points_redeemed && order.points_redeemed > 0 && (
                          <div className="flex items-center justify-between bg-amber-500/20 rounded-lg px-3 py-2">
                            <span className="text-sm text-amber-300">
                              Points: {order.points_redeemed}
                            </span>
                            <span className="font-semibold text-amber-400">
                              -₹{((order.points_redeemed || 0) * 0.1).toFixed(2)}
                            </span>
                          </div>
                        )}

                        {order.points_earned && order.points_earned > 0 && (
                          <div className="flex items-center justify-between bg-emerald-500/20 rounded-lg px-3 py-2">
                            <span className="text-sm text-emerald-300">Points Earned</span>
                            <span className="font-semibold text-emerald-400">
                              +{order.points_earned}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Amount */}
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">Final Amount</div>
                      <div className="text-2xl font-bold text-emerald-500">
                        ₹{(order.final_amount || 0).toFixed(2)}
                      </div>
                      {order.total_amount && order.total_amount !== order.final_amount && (
                        <div className="text-sm text-gray-400 line-through">
                          ₹{order.total_amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
