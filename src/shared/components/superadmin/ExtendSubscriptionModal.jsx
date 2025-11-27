import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, Check, Loader, Plus, Minus } from 'lucide-react';
import { supabaseOwner } from '@/shared/utils/api/supabaseOwnerClient';
import { useToast } from '@/shared/components/superadmin/useToast';

/**
 * Extend Subscription Modal
 * Allows SuperAdmin to extend restaurant subscription/trial period
 */
const ExtendSubscriptionModal = ({ isOpen, onClose, restaurant, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [extensionType, setExtensionType] = useState('days'); // 'days', 'weeks', 'months'
  const [extensionValue, setExtensionValue] = useState(7);
  const [reason, setReason] = useState('');
  const [reactivate, setReactivate] = useState(true);

  const subscription = restaurant?.subscription || restaurant?.subscriptions?.[0];

  const getCurrentEndDate = () => {
    if (!subscription) return new Date();
    return new Date(subscription.current_period_end || subscription.end_date || subscription.trial_ends_at || new Date());
  };

  const calculateNewEndDate = () => {
    const currentEnd = getCurrentEndDate();
    const newEnd = new Date(currentEnd);
    
    switch (extensionType) {
      case 'days':
        newEnd.setDate(newEnd.getDate() + extensionValue);
        break;
      case 'weeks':
        newEnd.setDate(newEnd.getDate() + (extensionValue * 7));
        break;
      case 'months':
        newEnd.setMonth(newEnd.getMonth() + extensionValue);
        break;
      default:
        break;
    }
    
    return newEnd;
  };

  const presetExtensions = [
    { label: '3 Days', type: 'days', value: 3 },
    { label: '7 Days', type: 'days', value: 7 },
    { label: '14 Days', type: 'days', value: 14 },
    { label: '1 Month', type: 'months', value: 1 },
    { label: '3 Months', type: 'months', value: 3 },
  ];

  const handleExtend = async () => {
    if (!restaurant?.id) {
      toast.error('Restaurant not found');
      return;
    }

    try {
      setLoading(true);

      const newEndDate = calculateNewEndDate();

      // Update subscription
      if (subscription?.id) {
        const updateData = {
          current_period_end: newEndDate.toISOString(),
          end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString(),
        };

        // If trial, also update trial_ends_at
        if (subscription.status === 'trial' && subscription.trial_ends_at) {
          updateData.trial_ends_at = newEndDate.toISOString();
        }

        // ALWAYS reactivate subscription status when reactivate checkbox is checked
        // This is critical for staff to be able to login
        if (reactivate) {
          updateData.status = 'active';
        }

        const { error: subError } = await supabaseOwner
          .from('subscriptions')
          .update(updateData)
          .eq('id', subscription.id);

        if (subError) throw subError;
      } else {
        // Create new subscription if none exists
        const { error: createError } = await supabaseOwner
          .from('subscriptions')
          .insert([{
            restaurant_id: restaurant.id,
            status: 'active',
            plan_name: 'Extended Subscription',
            current_period_start: new Date().toISOString(),
            current_period_end: newEndDate.toISOString(),
            end_date: newEndDate.toISOString(),
            grace_period_days: 3,
          }]);

        if (createError) throw createError;
      }

      // ALWAYS reactivate restaurant when reactivate checkbox is checked
      // This is critical for staff to be able to login
      if (reactivate) {
        const { error: restaurantError } = await supabaseOwner
          .from('restaurants')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', restaurant.id);

        if (restaurantError) throw restaurantError;
      }

      // Log the extension action
      try {
        await supabaseOwner
          .from('audit_logs')
          .insert([{
            action: 'subscription_extended',
            entity_type: 'subscription',
            entity_id: subscription?.id || restaurant.id,
            details: {
              restaurant_id: restaurant.id,
              restaurant_name: restaurant.name,
              extension_type: extensionType,
              extension_value: extensionValue,
              old_end_date: getCurrentEndDate().toISOString(),
              new_end_date: newEndDate.toISOString(),
              reason: reason || 'No reason provided',
              reactivated: reactivate,
            },
          }]);
      } catch (logError) {
        console.error('Failed to log extension:', logError);
      }

      toast.success(`Subscription extended by ${extensionValue} ${extensionType}!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast.error(`Failed to extend: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentEndDate = getCurrentEndDate();
  const newEndDate = calculateNewEndDate();
  const isExpired = currentEndDate < new Date();
  const subscriptionStatus = subscription?.status || 'none';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-white/10">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-400" />
                Extend Subscription
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {restaurant?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Current Status */}
          <div className={`p-4 rounded-xl border ${
            isExpired 
              ? 'bg-red-500/10 border-red-500/30' 
              : subscriptionStatus === 'suspended'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {isExpired || subscriptionStatus === 'suspended' ? (
                <AlertCircle className="h-5 w-5 text-amber-400" />
              ) : (
                <Clock className="h-5 w-5 text-emerald-400" />
              )}
              <span className="text-white font-medium">Current Status</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Status</p>
                <p className={`font-medium ${
                  subscriptionStatus === 'active' ? 'text-emerald-400' :
                  subscriptionStatus === 'trial' ? 'text-blue-400' :
                  subscriptionStatus === 'suspended' ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">{isExpired ? 'Expired On' : 'Expires On'}</p>
                <p className={`font-medium ${isExpired ? 'text-red-400' : 'text-white'}`}>
                  {currentEndDate.toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Quick Extension
            </label>
            <div className="flex flex-wrap gap-2">
              {presetExtensions.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setExtensionType(preset.type);
                    setExtensionValue(preset.value);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    extensionType === preset.type && extensionValue === preset.value
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Extension */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Custom Extension
            </label>
            <div className="flex gap-3">
              <div className="flex items-center bg-slate-800/50 border border-white/10 rounded-xl">
                <button
                  type="button"
                  onClick={() => setExtensionValue(Math.max(1, extensionValue - 1))}
                  className="p-3 hover:bg-white/10 transition-colors rounded-l-xl"
                >
                  <Minus className="h-4 w-4 text-slate-400" />
                </button>
                <input
                  type="number"
                  value={extensionValue}
                  onChange={(e) => setExtensionValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center bg-transparent text-white font-semibold text-lg border-0 focus:ring-0"
                  min="1"
                />
                <button
                  type="button"
                  onClick={() => setExtensionValue(extensionValue + 1)}
                  className="p-3 hover:bg-white/10 transition-colors rounded-r-xl"
                >
                  <Plus className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              <select
                value={extensionType}
                onChange={(e) => setExtensionType(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>

          {/* New End Date Preview */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">New Expiry Date</p>
                <p className="text-2xl font-bold text-amber-400">
                  {newEndDate.toLocaleDateString('en-IN', { 
                    weekday: 'short',
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Extension</p>
                <p className="text-lg font-semibold text-white">
                  +{extensionValue} {extensionType}
                </p>
              </div>
            </div>
          </div>

          {/* Reactivate Option - CRITICAL for enabling login */}
          <div className={`p-4 rounded-xl border cursor-pointer transition-all ${
            reactivate 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/50'
          }`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reactivate}
                onChange={(e) => setReactivate(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-slate-700 text-emerald-500 focus:ring-emerald-500/50"
              />
              <div>
                <p className="text-white font-medium flex items-center gap-2">
                  Reactivate Restaurant & Enable Login
                  {reactivate && <Check className="h-4 w-4 text-emerald-400" />}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Sets subscription status to <span className="text-emerald-400 font-medium">Active</span> and 
                  enables restaurant access. Staff and managers will be able to login immediately.
                </p>
                {(!restaurant?.is_active || subscriptionStatus === 'suspended' || subscriptionStatus === 'expired' || subscriptionStatus === 'cancelled') && (
                  <p className="text-amber-400 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Restaurant is currently inactive/suspended - login is blocked
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Reason (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 resize-none"
              placeholder="E.g., Payment pending, requested extension, promotional offer..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExtend}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-medium shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Extend Subscription
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtendSubscriptionModal;
