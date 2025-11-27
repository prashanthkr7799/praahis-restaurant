import { useState, useEffect } from 'react';
import { X, Crown, Save } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';

const DEFAULT_TIERS = [
  { name: 'silver', threshold: 5000, discount: 5, color: 'from-gray-400 to-gray-500' },
  { name: 'gold', threshold: 20000, discount: 10, color: 'from-yellow-400 to-yellow-600' },
  { name: 'platinum', threshold: 50000, discount: 15, color: 'from-purple-400 to-purple-600' }
];

export default function MembershipTiersManager({ onClose }) {
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customerStats, setCustomerStats] = useState({
    silver: 0,
    gold: 0,
    platinum: 0,
    none: 0
  });

  useEffect(() => {
    fetchCustomerStats();
    loadTiersConfig();
  }, []);

  async function fetchCustomerStats() {
    // Count customers by tier
    const { data: users } = await supabase
      .from('users')
      .select('membership_tier');

    if (users) {
      const stats = {
        silver: 0,
        gold: 0,
        platinum: 0,
        none: 0
      };

      users.forEach(user => {
        const tier = user.membership_tier?.toLowerCase();
        if (tier && Object.prototype.hasOwnProperty.call(stats, tier)) {
          stats[tier]++;
        } else {
          stats.none++;
        }
      });

      setCustomerStats(stats);
    }
  }

  async function loadTiersConfig() {
    // Try to load from settings table
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'membership_tiers')
      .single();

    if (data?.value) {
      try {
        const savedTiers = JSON.parse(data.value);
        setTiers(savedTiers);
      } catch (e) {
        console.error('Error parsing tiers config:', e);
      }
    }
  }

  function handleTierChange(index, field, value) {
    setTiers(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'name' ? value : parseFloat(value) || 0
      };
      return updated;
    });
  }

  async function handleSave() {
    setLoading(true);
    try {
      // Save to settings table
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert({
          key: 'membership_tiers',
          value: JSON.stringify(tiers)
        });

      if (settingsError) throw settingsError;

      // Auto-upgrade customers based on their total spending
      await upgradeCustomers();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving tiers:', error);
      alert('Failed to save membership tiers');
    } finally {
      setLoading(false);
    }
  }

  async function upgradeCustomers() {
    // Get all users with their total spending
    const { data: users } = await supabase
      .from('users')
      .select('id, email');

    if (!users) return;

    for (const user of users) {
      // Calculate total spending
      const { data: orders } = await supabase
        .from('orders')
        .select('final_amount')
        .eq('customer_id', user.id)
        .eq('payment_status', 'paid');

      if (!orders) continue;

      const totalSpending = orders.reduce((sum, order) => sum + (order.final_amount || 0), 0);

      // Determine tier
      let newTier = null;
      for (let i = tiers.length - 1; i >= 0; i--) {
        if (totalSpending >= tiers[i].threshold) {
          newTier = tiers[i].name;
          break;
        }
      }

      // Update user tier if needed
      if (newTier) {
        await supabase
          .from('users')
          .update({ membership_tier: newTier })
          .eq('id', user.id);
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Membership Tiers Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-emerald-500/20 border border-emerald-500 rounded-xl p-4">
              <p className="text-emerald-400 font-semibold">Membership tiers saved successfully!</p>
            </div>
          )}

          {/* Customer Distribution */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Current Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-300">{customerStats.none}</div>
                <div className="text-sm text-gray-400">No Tier</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400">{customerStats.silver}</div>
                <div className="text-sm text-gray-400">Silver</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{customerStats.gold}</div>
                <div className="text-sm text-gray-400">Gold</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{customerStats.platinum}</div>
                <div className="text-sm text-gray-400">Platinum</div>
              </div>
            </div>
          </div>

          {/* Tier Configuration */}
          <div className="space-y-4">
            {tiers.map((tier, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6"
              >
                <div className={`bg-gradient-to-r ${tier.color} text-white font-bold text-lg px-4 py-2 rounded-lg mb-4 inline-block uppercase`}>
                  {tier.name}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tier Name</label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Spending Threshold (₹)
                    </label>
                    <input
                      type="number"
                      value={tier.threshold}
                      onChange={(e) => handleTierChange(index, 'threshold', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={tier.discount}
                      onChange={(e) => handleTierChange(index, 'discount', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-400">
                  Customers who spend ₹{tier.threshold.toLocaleString()} or more will be upgraded to {tier.name} tier and receive {tier.discount}% discount on all orders.
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-4">
            <p className="text-blue-300 text-sm">
              <strong>Note:</strong> When you save these settings, all customers will be automatically upgraded based on their lifetime spending. Membership discounts are applied after coupon discounts.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading}
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save & Upgrade Customers'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
