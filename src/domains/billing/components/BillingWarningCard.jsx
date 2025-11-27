import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { Link } from 'react-router-dom';

const BillingWarningCard = ({ restaurantId }) => {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBillingInfo = useCallback(async () => {
    try {
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('billing')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('billing_period', { ascending: false })
        .limit(1);

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST301') {
          console.warn('Billing table not accessible:', error.message);
          setLoading(false);
          return;
        }
        throw error;
      }

      setBilling(data && data.length > 0 ? data[0] : null);
    } catch (err) {
      console.error('Error fetching billing:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      fetchBillingInfo();
    }
  }, [restaurantId, fetchBillingInfo]);

  if (loading) return null;

  // Mock data if no billing record found (for demo purposes)
  const planName = billing?.plan_name || 'Pro Plan';
  const daysLeft = billing ? Math.ceil((new Date(billing.grace_end_date) - new Date()) / (1000 * 60 * 60 * 24)) : 14;

  return (
    <div className="glass-panel p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <CreditCard size={80} className="text-white" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
            <CreditCard size={20} />
          </div>
          <span className="text-sm font-bold text-white tracking-wide uppercase">Subscription</span>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-1">{planName}</h3>
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
            <CheckCircle size={12} />
            Active
          </span>
          <span className="text-xs text-zinc-400">{daysLeft > 0 ? `${daysLeft} days remaining` : 'Overdue'}</span>
        </div>
        
        <Link to="/manager/billing" className="glass-button w-full justify-between group-hover:bg-white/10 group-hover:border-white/20">
          <span className="text-sm">Manage Plan</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default BillingWarningCard;
