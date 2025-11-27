import { useState, useEffect } from 'react';
import { X, Ticket, Crown, Award, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import {
  getEligibleCouponsForOrder,
  validateMembershipDiscount,
  computeFinalAmount,
  getBestDiscount,
  pointsToRupees
} from '../utils/offersUtils';

export default function ApplyDiscountDrawer({ order, customer, onClose, onApply }) {
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoSelectBest, setAutoSelectBest] = useState(true);

  const membershipDiscount = validateMembershipDiscount(customer);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoSelectBest && coupons.length > 0) {
      selectBestDiscount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupons, autoSelectBest, pointsToRedeem]);

  async function fetchData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchCoupons(),
        fetchCustomerPoints()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCoupons() {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('status', 'active');

    if (data) {
      const eligible = getEligibleCouponsForOrder(data, order, customer);
      setCoupons(eligible);
    }
  }

  async function fetchCustomerPoints() {
    if (!customer?.id) return;

    const { data } = await supabase
      .from('loyalty_points')
      .select('points_balance')
      .eq('user_id', customer.id)
      .single();

    if (data) {
      setCustomerPoints(data.points_balance || 0);
    }
  }

  function selectBestDiscount() {
    const options = [];

    // No discount option
    options.push(computeFinalAmount(order, null, null, 0));

    // Each coupon alone
    coupons.forEach(coupon => {
      options.push(computeFinalAmount(order, coupon, membershipDiscount, 0));
    });

    // Each coupon + membership
    if (membershipDiscount.valid) {
      coupons.forEach(coupon => {
        options.push(computeFinalAmount(order, coupon, membershipDiscount, 0));
      });
    }

    // Each coupon + points
    if (pointsToRedeem > 0) {
      coupons.forEach(coupon => {
        options.push(computeFinalAmount(order, coupon, membershipDiscount, pointsToRedeem));
      });
    }

    const best = getBestDiscount(options);
    if (best?.appliedCoupon) {
      setSelectedCoupon(best.appliedCoupon);
    }
  }

  function handleCouponSelect(coupon) {
    setSelectedCoupon(prev => prev?.id === coupon.id ? null : coupon);
    setAutoSelectBest(false);
  }

  function handlePointsChange(value) {
    const points = parseInt(value) || 0;
    const maxPoints = Math.min(customerPoints, Math.floor(order.total_amount / 0.1));
    setPointsToRedeem(Math.min(points, maxPoints));
  }

  function handleApply() {
    const result = computeFinalAmount(
      order,
      selectedCoupon,
      membershipDiscount,
      pointsToRedeem
    );

    onApply({
      appliedCoupon: selectedCoupon,
      appliedMembership: membershipDiscount.valid ? membershipDiscount : null,
      pointsRedeemed: pointsToRedeem,
      discountAmount: result.totalDiscount,
      finalPayable: result.finalAmount,
      breakdown: {
        subtotal: result.subtotal,
        couponDiscount: result.couponDiscount,
        membershipDiscount: result.membershipDiscount,
        pointsDiscount: result.pointsDiscount
      }
    });
  }

  const previewResult = computeFinalAmount(
    order,
    selectedCoupon,
    membershipDiscount,
    pointsToRedeem
  );

  const maxRedeemablePoints = Math.min(
    customerPoints,
    Math.floor(order.total_amount / 0.1)
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center md:justify-center z-50">
      <div className="bg-gray-900 rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Apply Discounts</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Auto-select Best Discount Toggle */}
          <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-blue-300">Auto-select Best Discount</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSelectBest}
                onChange={(e) => setAutoSelectBest(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Available Coupons */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold">Available Coupons ({coupons.length})</h3>
            </div>

            {coupons.length === 0 ? (
              <div className="bg-white/10 border border-white/20 rounded-xl p-8 text-center">
                <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400">No coupons available for this order</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coupons.map(coupon => {
                  const isSelected = selectedCoupon?.id === coupon.id;
                  const discount = computeFinalAmount(order, coupon, null, 0);

                  return (
                    <button
                      key={coupon.id}
                      onClick={() => handleCouponSelect(coupon)}
                      className={`w-full text-left bg-white/10 border-2 rounded-xl p-4 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-mono text-lg font-bold text-blue-400 mb-1">
                            {coupon.code}
                          </div>
                          <p className="text-sm text-gray-300 mb-2">
                            {coupon.description || 'No description'}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {coupon.min_order_amount && (
                              <span className="bg-white/10 px-2 py-1 rounded">
                                Min: ₹{coupon.min_order_amount}
                              </span>
                            )}
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                              Valid until {new Date(coupon.valid_until).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-400">
                            -₹{discount.couponDiscount.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-400">You save</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Membership Discount */}
          {membershipDiscount.valid && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold">Membership Benefit</h3>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-purple-300 uppercase mb-1">
                      {membershipDiscount.tier} Member
                    </div>
                    <p className="text-sm text-gray-300">
                      {membershipDiscount.discountPercent}% discount on all orders
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-400">
                      -{membershipDiscount.discountPercent}%
                    </div>
                    <div className="text-xs text-gray-400">Auto-applied</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loyalty Points */}
          {customer && customerPoints > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold">Redeem Loyalty Points</h3>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Available Points</span>
                  <span className="text-2xl font-bold text-amber-400">{customerPoints}</span>
                </div>

                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max={maxRedeemablePoints}
                    value={pointsToRedeem}
                    onChange={(e) => handlePointsChange(e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />

                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      value={pointsToRedeem}
                      onChange={(e) => handlePointsChange(e.target.value)}
                      max={maxRedeemablePoints}
                      min="0"
                      className="w-24 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="text-right">
                      <div className="text-lg font-bold text-amber-400">
                        = ₹{pointsToRupees(pointsToRedeem).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">Discount value</div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    1 point = ₹0.10 • Max redeemable: {maxRedeemablePoints} points
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning if no discounts */}
          {coupons.length === 0 && !membershipDiscount.valid && customerPoints === 0 && (
            <div className="bg-amber-500/20 border border-amber-500 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300 mb-1">No Discounts Available</p>
                <p className="text-sm text-amber-200">
                  There are no applicable discounts for this order at the moment.
                </p>
              </div>
            </div>
          )}

          {/* Price Preview */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Price Breakdown</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-gray-300">
                <span>Subtotal</span>
                <span className="font-semibold">₹{previewResult.subtotal.toFixed(2)}</span>
              </div>

              {previewResult.couponDiscount > 0 && (
                <div className="flex items-center justify-between text-blue-400">
                  <span className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    Coupon Discount
                  </span>
                  <span className="font-semibold">-₹{previewResult.couponDiscount.toFixed(2)}</span>
                </div>
              )}

              {previewResult.membershipDiscount > 0 && (
                <div className="flex items-center justify-between text-purple-400">
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Membership Discount
                  </span>
                  <span className="font-semibold">-₹{previewResult.membershipDiscount.toFixed(2)}</span>
                </div>
              )}

              {previewResult.pointsDiscount > 0 && (
                <div className="flex items-center justify-between text-amber-400">
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Points Discount
                  </span>
                  <span className="font-semibold">-₹{previewResult.pointsDiscount.toFixed(2)}</span>
                </div>
              )}

              {previewResult.totalDiscount > 0 && (
                <div className="pt-3 border-t border-white/20">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="font-bold">Total Savings</span>
                    <span className="font-bold text-xl">₹{previewResult.totalDiscount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-white/20">
                <div className="flex items-center justify-between text-white">
                  <span className="font-bold text-lg">Final Amount</span>
                  <span className="font-bold text-3xl text-emerald-400">
                    ₹{previewResult.finalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-4 px-6 rounded-xl transition-all"
            >
              Apply Discount
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
