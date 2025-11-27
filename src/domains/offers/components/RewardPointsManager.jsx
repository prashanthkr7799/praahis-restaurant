import { useState, useEffect } from 'react';
import { X, Award, Save } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';

export default function RewardPointsManager({ onClose }) {
  const [config, setConfig] = useState({
    points_per_rupee: 0.1, // 1 point per ₹10
    min_redeemable_points: 100,
    points_value: 0.1, // 1 point = ₹0.10
    points_expiry_days: 365,
    enabled: true
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'reward_points_config')
      .single();

    if (data?.value) {
      try {
        const savedConfig = JSON.parse(data.value);
        setConfig(savedConfig);
      } catch (e) {
        console.error('Error parsing config:', e);
      }
    }
  }

  function handleChange(field, value) {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'reward_points_config',
          value: JSON.stringify(config)
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save reward points configuration');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Reward Points Settings</h2>
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
              <p className="text-emerald-400 font-semibold">Settings saved successfully!</p>
            </div>
          )}

          {/* Enable/Disable */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Reward Points System</h3>
                <p className="text-sm text-gray-400">Enable or disable the entire rewards program</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleChange('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Points Earning */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Points Earning</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Points per Rupee Spent
                </label>
                <input
                  type="number"
                  value={config.points_per_rupee}
                  onChange={(e) => handleChange('points_per_rupee', parseFloat(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  step="0.01"
                  min="0"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Example: {config.points_per_rupee} points per rupee = {Math.floor(1 / config.points_per_rupee)} points for ₹{Math.ceil(1 / config.points_per_rupee)} spent
                </p>
              </div>
            </div>
          </div>

          {/* Points Redemption */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Points Redemption</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Points Required for Redemption
                </label>
                <input
                  type="number"
                  value={config.min_redeemable_points}
                  onChange={(e) => handleChange('min_redeemable_points', parseInt(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  min="0"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Customers must have at least {config.min_redeemable_points} points to redeem
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Point Value (₹ per point)
                </label>
                <input
                  type="number"
                  value={config.points_value}
                  onChange={(e) => handleChange('points_value', parseFloat(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  step="0.01"
                  min="0"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Example: {config.points_value} rupees per point = {config.min_redeemable_points} points = ₹{(config.min_redeemable_points * config.points_value).toFixed(2)} discount
                </p>
              </div>
            </div>
          </div>

          {/* Points Expiry */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Points Expiry</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Points Expiry Period (days)
              </label>
              <input
                type="number"
                value={config.points_expiry_days}
                onChange={(e) => handleChange('points_expiry_days', parseInt(e.target.value))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                min="0"
              />
              <p className="text-sm text-gray-400 mt-2">
                Points will expire after {config.points_expiry_days} days ({Math.floor(config.points_expiry_days / 30)} months)
              </p>
            </div>
          </div>

          {/* Example Calculation */}
          <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-6">
            <h4 className="font-bold mb-3 text-blue-300">Example Calculation</h4>
            <div className="space-y-2 text-sm text-blue-200">
              <p>• Order of ₹1,000 = <strong>{(1000 * config.points_per_rupee).toFixed(0)} points earned</strong></p>
              <p>• {config.min_redeemable_points} points = <strong>₹{(config.min_redeemable_points * config.points_value).toFixed(2)} discount</strong></p>
              <p>• Points expire after <strong>{config.points_expiry_days} days</strong></p>
            </div>
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
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading}
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
