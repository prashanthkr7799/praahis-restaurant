import React, { useState, useEffect } from 'react';
import { Crown, Check, ChevronRight, Zap, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@shared/utils/api/supabaseClient';

// NEW PRICING MODEL: ₹75 per table per day - ONLY tables determine cost
const RATE_PER_TABLE_PER_DAY = 75;
// Breakdown: Core Platform ₹30 + Unlimited Staff ₹18 + Unlimited Menu ₹12 + Billing/POS ₹15 = ₹75
const PRICING_BREAKDOWN = {
  core: { label: 'Core Platform', amount: 30 },
  staff: { label: 'Unlimited Staff', amount: 18 },
  menu: { label: 'Unlimited Menu', amount: 12 },
  billing: { label: 'Billing & POS', amount: 15 }
};

const SubscriptionBox = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's restaurant
        const { data: userData } = await supabase
          .from('users')
          .select('restaurant_id')
          .eq('id', user.id)
          .single();

        if (!userData?.restaurant_id) return;

        // Get restaurant with subscription
        const { data: restData } = await supabase
          .from('restaurants')
          .select(`
            id,
            name,
            max_tables,
            is_active,
            subscriptions (
              id,
              status,
              plan_name,
              price,
              price_per_table,
              current_period_start,
              current_period_end,
              trial_ends_at
            )
          `)
          .eq('id', userData.restaurant_id)
          .single();

        if (restData) {
          setRestaurant(restData);
          const sub = Array.isArray(restData.subscriptions) 
            ? restData.subscriptions[0] 
            : restData.subscriptions;
          setSubscription(sub);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  // Calculate values
  const tables = restaurant?.max_tables || 0;
  const dailyCost = tables * RATE_PER_TABLE_PER_DAY;
  const monthlyCost = dailyCost * 30;
  const status = subscription?.status?.toLowerCase() || 'none';
  
  // Calculate days remaining
  const getExpiryInfo = () => {
    if (status === 'trial' && subscription?.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      const daysLeft = Math.max(0, Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)));
      return { date: trialEnd, daysLeft, label: 'Trial ends' };
    }
    if (subscription?.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end);
      const daysLeft = Math.max(0, Math.ceil((periodEnd - new Date()) / (1000 * 60 * 60 * 24)));
      return { date: periodEnd, daysLeft, label: 'Renews on' };
    }
    return null;
  };

  const expiryInfo = getExpiryInfo();

  // Status styling
  const getStatusStyle = () => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', label: 'Active' };
      case 'trial':
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', label: 'Trial' };
      case 'suspended':
      case 'expired':
        return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', label: 'Suspended' };
      default:
        return { bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', text: 'text-zinc-400', label: 'Inactive' };
    }
  };

  const statusStyle = getStatusStyle();

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-primary/20 animate-pulse">
        <div className="h-24 bg-zinc-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-primary/20 relative overflow-hidden group">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/20 shadow-lg shadow-amber-500/5">
                <Crown className="h-5 w-5 text-amber-400" />
              </div>
              <span className={`px-2 py-1 rounded-full ${statusStyle.bg} border ${statusStyle.border} text-[10px] font-bold ${statusStyle.text} uppercase tracking-wider`}>
                {statusStyle.label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {subscription?.plan_name || 'Standard Plan'}
            </h3>
            {expiryInfo && (
              <p className="text-sm text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {expiryInfo.label} {expiryInfo.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                <span className="text-primary font-medium">({expiryInfo.daysLeft} days)</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white font-mono-nums">₹{monthlyCost.toLocaleString()}</p>
            <p className="text-xs text-zinc-500">/ month</p>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="bg-zinc-800/50 rounded-xl p-3 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Tables</span>
            <span className="text-white font-medium">{tables}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Rate/table/day</span>
            <span className="text-white font-medium">₹{RATE_PER_TABLE_PER_DAY}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-zinc-700 pt-2">
            <span className="text-zinc-400">Daily Cost</span>
            <span className="text-primary font-bold">₹{dailyCost.toLocaleString()}</span>
          </div>
          {/* ₹75 per table breakdown */}
          <div className="pt-2 border-t border-zinc-700/50">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">₹75 includes:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              {Object.entries(PRICING_BREAKDOWN).map(([key, item]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-zinc-500">{item.label}</span>
                  <span className="text-zinc-400">₹{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <div className="p-1 rounded-full bg-green-500/10 border border-green-500/20">
              <Check className="h-3 w-3 text-green-500" />
            </div>
            <span>Up to {restaurant?.max_tables || '∞'} Tables</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <div className="p-1 rounded-full bg-green-500/10 border border-green-500/20">
              <Check className="h-3 w-3 text-green-500" />
            </div>
            <span>Unlimited Staff & Menu Items</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <div className="p-1 rounded-full bg-green-500/10 border border-green-500/20">
              <Check className="h-3 w-3 text-green-500" />
            </div>
            <span>Real-time Orders & Analytics</span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/manager/subscription')}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 group-hover:scale-[1.02] ${
            status === 'suspended' || status === 'expired'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-red-500/20'
              : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-black shadow-primary/20'
          }`}
        >
          {status === 'suspended' || status === 'expired' ? (
            <>
              <AlertTriangle className="h-4 w-4" />
              Pay Now to Reactivate
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 fill-black" />
              Manage Subscription
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionBox;
