/**
 * SubscriptionPage - Complete redesign with modern UI
 * Features: Overview, Management, and History sections
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@config/supabase';
import { 
  CreditCard, AlertTriangle, CheckCircle, Clock, Calendar,
  Building2, RefreshCw, Shield, Zap, ArrowRight, Edit3,
  Plus, Minus, LayoutGrid, Save, X, TrendingUp, Info, Users,
  Receipt, Download, ChevronRight, Sparkles, Crown, Star,
  FileText, IndianRupee, ArrowUpRight, ArrowDownRight, History,
  Settings, Package, Utensils, ChefHat
} from 'lucide-react';
import toast from 'react-hot-toast';

const RATE_PER_TABLE_PER_DAY = 75;
const PRICING_BREAKDOWN = {
  core: { label: 'Core Platform', amount: 30, icon: Package },
  staff: { label: 'Unlimited Staff', amount: 18, icon: Users },
  menu: { label: 'Unlimited Menu', amount: 12, icon: Utensils },
  billing: { label: 'Billing & POS', amount: 15, icon: CreditCard }
};

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [pendingBill, setPendingBill] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editedLimits, setEditedLimits] = useState({ max_tables: 0, max_users: 0 });
  const [currentCounts, setCurrentCounts] = useState({ tables: 0, users: 0, menu_items: 0 });
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { toast.error('Please log in again'); navigate('/login'); return; }

      const { data: userData } = await supabase.from('users').select('restaurant_id').eq('id', user.id).single();
      if (!userData?.restaurant_id) { toast.error('No restaurant assigned'); return; }

      const { data: restData, error: restError } = await supabase
        .from('restaurants')
        .select('id, name, max_tables, max_users, max_menu_items, is_active, subscriptions (id, status, plan_name, price, price_per_table, current_period_start, current_period_end, trial_ends_at)')
        .eq('id', userData.restaurant_id)
        .single();

      if (restError) throw restError;
      setRestaurant(restData);
      setEditedLimits({ max_tables: restData.max_tables || 10, max_users: restData.max_users || 5 });
      
      const sub = Array.isArray(restData.subscriptions) ? restData.subscriptions[0] : restData.subscriptions;
      setSubscription(sub);

      const [tablesCount, usersCount, menuCount] = await Promise.all([
        supabase.from('tables').select('id', { count: 'exact', head: true }).eq('restaurant_id', restData.id),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('restaurant_id', restData.id).in('role', ['chef', 'waiter', 'staff']),
        supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('restaurant_id', restData.id)
      ]);
      setCurrentCounts({ tables: tablesCount.count || 0, users: usersCount.count || 0, menu_items: menuCount.count || 0 });

      const { data: billData } = await supabase.from('billing').select('*').eq('restaurant_id', restData.id).in('status', ['pending', 'overdue']).order('created_at', { ascending: false }).limit(1).maybeSingle();
      setPendingBill(billData);

      const { data: historyData } = await supabase
        .from('billing')
        .select('*')
        .eq('restaurant_id', restData.id)
        .order('billing_year', { ascending: false })
        .order('billing_month', { ascending: false })
        .limit(12);
      setPaymentHistory(historyData || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getSubscriptionStatus = () => {
    if (!subscription) return { status: 'none', color: 'gray', message: 'No subscription', icon: Clock };
    const status = subscription.status?.toLowerCase();
    const expiryDate = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
    const isExpired = expiryDate && expiryDate < new Date();

    if (status === 'suspended' || status === 'cancelled') return { status: 'suspended', color: 'red', message: 'Suspended', icon: AlertTriangle };
    if (isExpired) return { status: 'expired', color: 'amber', message: 'Expired', icon: Clock };
    if (status === 'trial') {
      const trialEnd = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
      const daysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : 0;
      return { status: 'trial', color: 'blue', message: daysLeft + ' days trial left', icon: Zap };
    }
    if (status === 'active') {
      const daysLeft = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;
      return { status: 'active', color: 'green', message: daysLeft + ' days left', icon: CheckCircle };
    }
    return { status: 'unknown', color: 'gray', message: 'Unknown', icon: Clock };
  };

  const getDaysRemaining = () => {
    // If subscription has a valid future end date, use that
    if (subscription?.current_period_end) {
      const endDate = new Date(subscription.current_period_end);
      const now = new Date();
      if (endDate > now) {
        return Math.max(1, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
      }
    }
    
    // Otherwise, calculate days remaining in current calendar month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = Math.max(1, Math.ceil((endOfMonth - now) / (1000 * 60 * 60 * 24)) + 1);
    return daysRemaining;
  };

  const calculateMonthlyAmount = (tableCount = null) => {
    const tables = tableCount ?? (restaurant?.max_tables || 0);
    return tables * RATE_PER_TABLE_PER_DAY * 30;
  };

  const calculateUpgradeAmount = () => {
    if (!restaurant) return { total: 0, extraTables: 0, daysRemaining: 0 };
    const daysRemaining = getDaysRemaining();
    const extraTables = Math.max(0, editedLimits.max_tables - (restaurant.max_tables || 0));
    return { total: extraTables * RATE_PER_TABLE_PER_DAY * daysRemaining, extraTables, daysRemaining };
  };

  const hasUpgrades = () => restaurant && editedLimits.max_tables > (restaurant.max_tables || 0);
  const hasDowngrades = () => restaurant && editedLimits.max_tables < (restaurant.max_tables || 0);

  const handleLimitChange = (delta) => {
    setEditedLimits(prev => {
      const minValue = Math.max(currentCounts.tables, 1);
      const newValue = prev.max_tables + delta;
      return { ...prev, max_tables: Math.min(100, Math.max(minValue, newValue)) };
    });
  };

  const handleStaffLimitChange = (delta) => {
    setEditedLimits(prev => {
      const minValue = Math.max(currentCounts.users, 1);
      const newValue = (prev.max_users || 0) + delta;
      return { ...prev, max_users: Math.min(500, Math.max(minValue, newValue)) };
    });
  };

  const handleSaveLimits = async (skipPayment = false) => {
    setShowConfirmModal(false);
    try {
      setSavingLimits(true);
      const upgradeInfo = calculateUpgradeAmount();
      
      // If upgrading (adding tables) and there's a cost, process payment first
      if (hasUpgrades() && upgradeInfo.total > 0 && !skipPayment) { 
        await handleUpgradePayment(); 
        return; 
      }
      
      // For downgrades or no-cost changes, just update the limit
      // Downgrades will take effect next billing cycle (just update max_tables)
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          max_tables: editedLimits.max_tables, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', restaurant.id);
        
      if (error) throw error;
      
      // If downgrading, add a note to the billing record
      if (hasDowngrades()) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        const { data: currentBill } = await supabase
          .from('billing')
          .select('id, notes')
          .eq('restaurant_id', restaurant.id)
          .eq('billing_month', currentMonth)
          .eq('billing_year', currentYear)
          .maybeSingle();
          
        if (currentBill) {
          await supabase
            .from('billing')
            .update({
              notes: (currentBill.notes || '') + ' | Table limit reduced to ' + editedLimits.max_tables + ' (effective next cycle)',
              updated_at: now.toISOString()
            })
            .eq('id', currentBill.id);
        }
        
        toast.success('Table limit will be reduced to ' + editedLimits.max_tables + ' from next billing cycle.');
      } else {
        toast.success('Table limit updated!');
      }
      
      setRestaurant(prev => ({ ...prev, max_tables: editedLimits.max_tables }));
      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update limits');
    } finally {
      setSavingLimits(false);
    }
  };

  const handleSaveStaffLimits = async () => {
    try {
      setSavingLimits(true);
      const { error } = await supabase.from('restaurants').update({ max_users: editedLimits.max_users, updated_at: new Date().toISOString() }).eq('id', restaurant.id);
      if (error) throw error;
      setRestaurant(prev => ({ ...prev, max_users: editedLimits.max_users }));
      toast.success('Staff limit updated!');
      setIsEditingStaff(false);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update staff limit');
    } finally {
      setSavingLimits(false);
    }
  };

  const handleUpgradePayment = async () => {
    try {
      setProcessingPayment(true);
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }
      const upgradeInfo = calculateUpgradeAmount();
      const amount = Math.ceil(upgradeInfo.total);
      
      // If no payment needed (0 extra tables or 0 days remaining), just update
      if (amount <= 0) { 
        await handleSaveLimits(true); 
        return; 
      }

      const newTableCount = editedLimits.max_tables;
      const extraTables = upgradeInfo.extraTables;
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const billingPeriod = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];

      // Step 1: Create a billing record for this upgrade FIRST (so we have a billing_id)
      // Note: Using custom_amount to store the pro-rata info since it's available
      const { data: upgradeBill, error: billError } = await supabase
        .from('billing')
        .insert({
          restaurant_id: restaurant.id,
          billing_month: currentMonth,
          billing_year: currentYear,
          billing_period: billingPeriod,
          table_count: extraTables,
          rate_per_table_per_day: RATE_PER_TABLE_PER_DAY,
          days_in_month: upgradeInfo.daysRemaining, // Remaining days for pro-rata
          pricing_type: 'per_table',
          base_amount: amount,
          total_amount: amount,
          status: 'pending',
          due_date: now.toISOString().split('T')[0],
          grace_period_days: 0, // Upgrade payment - no grace period
          grace_end_date: now.toISOString().split('T')[0],
          created_at: now.toISOString()
        })
        .select()
        .single();

      if (billError) {
        console.error('Error creating upgrade billing:', billError);
        throw new Error('Failed to create billing record');
      }

      const upgradeBillingId = upgradeBill.id;

      // Step 2: Create Razorpay order with the billing ID
      const { data: authData } = await supabase.auth.getSession();
      const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/create-subscription-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authData.session?.access_token },
        body: JSON.stringify({ 
          billingId: upgradeBillingId,
          restaurantId: restaurant.id, 
          amount, 
          type: 'upgrade', 
          upgradeDetails: { 
            newTables: newTableCount, 
            oldTables: restaurant.max_tables, 
            extraTables: extraTables,
            daysRemaining: upgradeInfo.daysRemaining,
            ratePerDay: RATE_PER_TABLE_PER_DAY
          } 
        })
      });
      const orderData = await response.json();
      if (!orderData.success) {
        // Clean up the billing record if order creation fails
        await supabase.from('billing').delete().eq('id', upgradeBillingId);
        throw new Error(orderData.error || 'Failed to create order');
      }

      const options = {
        key: orderData.razorpayKey, 
        amount: orderData.order.amount, 
        currency: orderData.order.currency, 
        name: 'Praahis Platform', 
        description: 'Table Upgrade (+' + extraTables + ' tables) - ' + restaurant.name, 
        order_id: orderData.order.id, 
        theme: { color: '#10B981' },
        handler: async (res) => {
          try {
            // Step 3: Verify payment with the billing ID - this will record the payment properly!
            const { data: authData } = await supabase.auth.getSession();
            const verifyRes = await fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/verify-subscription-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authData.session?.access_token },
              body: JSON.stringify({ 
                ...res, 
                billingId: upgradeBillingId, // Now we have a proper billing ID!
                restaurantId: restaurant.id, 
                amount 
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              // Step 4: Update restaurant's max_tables
              await supabase
                .from('restaurants')
                .update({ 
                  max_tables: newTableCount,
                  updated_at: new Date().toISOString()
                })
                .eq('id', restaurant.id);
              
              // Step 5: Update current month's main billing record with new table count
              const { data: currentBill } = await supabase
                .from('billing')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('billing_month', currentMonth)
                .eq('billing_year', currentYear)
                .neq('id', upgradeBillingId) // Exclude the upgrade billing
                .in('status', ['pending', 'overdue'])
                .maybeSingle();

              if (currentBill) {
                const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
                const newBaseAmount = newTableCount * RATE_PER_TABLE_PER_DAY * daysInMonth;
                await supabase
                  .from('billing')
                  .update({
                    table_count: newTableCount,
                    base_amount: newBaseAmount,
                    total_amount: newBaseAmount - (currentBill.discount_amount || 0),
                    updated_at: now.toISOString()
                  })
                  .eq('id', currentBill.id);
              }
              
              toast.success(`Upgrade successful! ${extraTables} tables added. Payment recorded.`);
            } else {
              // Payment verification failed - mark billing as overdue (failed is not valid status)
              await supabase.from('billing').update({ status: 'overdue' }).eq('id', upgradeBillingId);
              toast.error('Payment verification failed');
            }
          } catch (err) {
            console.error('Upgrade handler error:', err);
            toast.error('Error processing upgrade');
          } finally {
            setIsEditing(false);
            setProcessingPayment(false);
            fetchData();
          }
        },
        modal: { 
          ondismiss: async () => { 
            // Payment cancelled - delete the pending billing record
            await supabase.from('billing').delete().eq('id', upgradeBillingId);
            setProcessingPayment(false); 
            toast.error('Payment cancelled');
          } 
        }
      };
      new window.Razorpay(options).open();
    } catch (error) {
      console.error('Upgrade payment error:', error);
      toast.error('Payment failed: ' + (error.message || 'Unknown error'));
      setProcessingPayment(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessingPayment(true);
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }
      const amount = pendingBill?.total_amount || pendingBill?.amount || calculateMonthlyAmount();
      const { data: authData } = await supabase.auth.getSession();
      const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/create-subscription-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authData.session?.access_token },
        body: JSON.stringify({ billingId: pendingBill?.id, restaurantId: restaurant.id, amount })
      });
      const orderData = await response.json();
      if (!orderData.success) throw new Error(orderData.error || 'Failed to create order');

      const options = {
        key: orderData.razorpayKey, amount: orderData.order.amount, currency: orderData.order.currency, name: 'Praahis Platform', description: 'Subscription - ' + restaurant.name, order_id: orderData.order.id, theme: { color: '#10B981' },
        handler: async (res) => {
          const { data: authData } = await supabase.auth.getSession();
          await fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/verify-subscription-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authData.session?.access_token },
            body: JSON.stringify({ ...res, billingId: pendingBill?.id, restaurantId: restaurant.id, amount })
          });
          await supabase.from('restaurants').update({ is_active: true }).eq('id', restaurant.id);
          if (subscription?.id) {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            await supabase.from('subscriptions').update({ status: 'active', current_period_start: new Date().toISOString(), current_period_end: nextMonth.toISOString() }).eq('id', subscription.id);
          }
          toast.success('Payment successful!');
          setProcessingPayment(false);
          setTimeout(() => navigate('/manager/dashboard'), 1500);
        },
        modal: { ondismiss: () => { setProcessingPayment(false); } }
      };
      new window.Razorpay(options).open();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Payment failed');
      setProcessingPayment(false);
    }
  };

  const statusInfo = getSubscriptionStatus();
  const StatusIcon = statusInfo.icon;
  const upgradeInfo = calculateUpgradeAmount();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-400">Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      {/* Decorative Elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Subscription</h1>
                <p className="text-sm text-zinc-400">{restaurant?.name || 'Your Restaurant'}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/manager/dashboard')} 
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-all"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6 w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutGrid },
            { id: 'management', label: 'Management', icon: Settings },
            { id: 'history', label: 'History', icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className={`p-4 rounded-2xl border ${
              statusInfo.color === 'red' ? 'bg-rose-500/10 border-rose-500/30' :
              statusInfo.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30' :
              statusInfo.color === 'green' ? 'bg-emerald-500/10 border-emerald-500/30' :
              statusInfo.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
              'bg-zinc-500/10 border-zinc-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    statusInfo.color === 'red' ? 'bg-rose-500/20' :
                    statusInfo.color === 'amber' ? 'bg-amber-500/20' :
                    statusInfo.color === 'green' ? 'bg-emerald-500/20' :
                    statusInfo.color === 'blue' ? 'bg-blue-500/20' :
                    'bg-zinc-500/20'
                  }`}>
                    <StatusIcon className={`w-5 h-5 ${
                      statusInfo.color === 'red' ? 'text-rose-400' :
                      statusInfo.color === 'amber' ? 'text-amber-400' :
                      statusInfo.color === 'green' ? 'text-emerald-400' :
                      statusInfo.color === 'blue' ? 'text-blue-400' :
                      'text-zinc-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Subscription Status</p>
                    <p className={`text-sm ${
                      statusInfo.color === 'red' ? 'text-rose-300' :
                      statusInfo.color === 'amber' ? 'text-amber-300' :
                      statusInfo.color === 'green' ? 'text-emerald-300' :
                      statusInfo.color === 'blue' ? 'text-blue-300' :
                      'text-zinc-300'
                    }`}>{statusInfo.message}</p>
                  </div>
                </div>
                {(statusInfo.status === 'active' || statusInfo.status === 'trial') && subscription?.current_period_end && (
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Renews on</p>
                    <p className="text-white font-medium">{new Date(subscription.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-zinc-400 text-sm">Tables</span>
                </div>
                <p className="text-2xl font-bold text-white">{currentCounts.tables}<span className="text-zinc-500 text-base font-normal">/{restaurant?.max_tables || 0}</span></p>
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: Math.min(100, (currentCounts.tables / (restaurant?.max_tables || 1)) * 100) + '%' }} />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-zinc-400 text-sm">Staff</span>
                </div>
                <p className="text-2xl font-bold text-white">{currentCounts.users}<span className="text-zinc-500 text-base font-normal">/{restaurant?.max_users || '∞'}</span></p>
                <p className="text-xs text-emerald-400 mt-2">Unlimited included</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Utensils className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-zinc-400 text-sm">Menu Items</span>
                </div>
                <p className="text-2xl font-bold text-white">{currentCounts.menu_items}</p>
                <p className="text-xs text-violet-400 mt-2">Unlimited included</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-zinc-400 text-sm">Monthly</span>
                </div>
                <p className="text-2xl font-bold text-white">₹{calculateMonthlyAmount().toLocaleString()}</p>
                <p className="text-xs text-zinc-500 mt-2">₹{RATE_PER_TABLE_PER_DAY}/table/day</p>
              </div>
            </div>

            {/* Payment Required Alert */}
            {(statusInfo.status === 'suspended' || statusInfo.status === 'expired') && (
              <div className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Payment Required</h3>
                    <p className="text-zinc-400 text-sm mb-4">Your restaurant access has been restricted. Complete the payment to reactivate all services.</p>
                    <div className="bg-black/20 rounded-xl p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-zinc-400">{restaurant?.max_tables || 0} Tables × ₹{RATE_PER_TABLE_PER_DAY}/day × 30 days</span>
                        <span className="text-white font-semibold">₹{calculateMonthlyAmount().toLocaleString()}</span>
                      </div>
                      <div className="border-t border-white/10 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-bold">Total Due</span>
                          <span className="text-2xl font-bold text-emerald-400">₹{(pendingBill?.total_amount || pendingBill?.amount || calculateMonthlyAmount()).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={handlePayment}
                      disabled={processingPayment}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25"
                    >
                      {processingPayment ? (
                        <><RefreshCw className="w-5 h-5 animate-spin" />Processing...</>
                      ) : (
                        <><CreditCard className="w-5 h-5" />Pay Now & Reactivate</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Breakdown */}
            {(statusInfo.status === 'active' || statusInfo.status === 'trial') && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  What's Included
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(PRICING_BREAKDOWN).map(([key, item]) => (
                    <div key={key} className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
                        <item.icon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <p className="text-white font-medium text-sm">{item.label}</p>
                      <p className="text-zinc-500 text-xs mt-1">₹{item.amount}/table/day</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-300 font-medium">All features included at ₹75/table/day</span>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Period Info */}
            {subscription && (statusInfo.status === 'active' || statusInfo.status === 'trial') && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Billing Period
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-zinc-500 text-sm mb-1">Period Start</p>
                    <p className="text-white font-semibold">
                      {subscription.current_period_start 
                        ? new Date(subscription.current_period_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '-'}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-zinc-500 text-sm mb-1">Period End</p>
                    <p className="text-white font-semibold">
                      {subscription.current_period_end 
                        ? new Date(subscription.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '-'}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-zinc-500 text-sm mb-1">Days Remaining</p>
                    <p className="text-2xl font-bold text-emerald-400">{getDaysRemaining()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MANAGEMENT TAB */}
        {activeTab === 'management' && (
          <div className="space-y-6">
            {/* Table Management */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Table Management</h3>
                    <p className="text-sm text-zinc-400">Adjust your table limit</p>
                  </div>
                </div>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl font-medium text-sm flex items-center gap-2 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />Edit
                  </button>
                ) : (
                  <button 
                    onClick={() => { setIsEditing(false); setEditedLimits({ ...editedLimits, max_tables: restaurant?.max_tables || 10 }); }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-zinc-300 rounded-xl font-medium text-sm flex items-center gap-2 transition-all"
                  >
                    <X className="w-4 h-4" />Cancel
                  </button>
                )}
              </div>

              <div className={`p-6 rounded-xl border-2 transition-all ${isEditing ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/10 bg-white/5'}`}>
                <div className="flex flex-col items-center">
                  {isEditing ? (
                    <div className="flex items-center gap-4 mb-4">
                      <button 
                        onClick={() => handleLimitChange(-1)}
                        disabled={editedLimits.max_tables <= Math.max(currentCounts.tables, 1)}
                        className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="text-center">
                        <span className="text-5xl font-bold text-orange-400">{editedLimits.max_tables}</span>
                        <p className="text-zinc-500 text-sm mt-1">tables</p>
                      </div>
                      <button 
                        onClick={() => handleLimitChange(1)}
                        className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <span className="text-5xl font-bold text-white">{restaurant?.max_tables || 0}</span>
                      <p className="text-zinc-500 text-sm mt-1">tables (using {currentCounts.tables})</p>
                    </div>
                  )}
                  <p className="text-zinc-400 text-sm">₹{RATE_PER_TABLE_PER_DAY} per table per day</p>
                </div>
              </div>

              {isEditing && (
                <div className="mt-4 space-y-4">
                  {hasUpgrades() && upgradeInfo.total > 0 && (
                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Upgrade Payment (Pro-rata)</span>
                      </div>
                      
                      {/* Detailed calculation */}
                      <div className="bg-black/20 rounded-lg p-3 mb-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">Extra tables</span>
                          <span className="text-white font-medium">+{upgradeInfo.extraTables} tables</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">Rate per table per day</span>
                          <span className="text-white font-medium">₹{RATE_PER_TABLE_PER_DAY}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">Days remaining in billing cycle</span>
                          <span className="text-white font-medium">{upgradeInfo.daysRemaining} days</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Calculation</span>
                            <span className="text-zinc-300">{upgradeInfo.extraTables} × ₹{RATE_PER_TABLE_PER_DAY} × {upgradeInfo.daysRemaining}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-300 font-medium">Pay Now</span>
                        <span className="text-2xl font-bold text-emerald-400">₹{Math.ceil(upgradeInfo.total).toLocaleString()}</span>
                      </div>
                      
                      <p className="text-xs text-zinc-500 mt-2">
                        After payment, your table limit will increase to {editedLimits.max_tables}. You can then add the new tables in the Tables section.
                      </p>
                    </div>
                  )}

                  {hasDowngrades() && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                      <ArrowDownRight className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-300 font-medium">Reducing tables: {restaurant?.max_tables} → {editedLimits.max_tables}</p>
                        <p className="text-amber-300/70 text-sm mt-1">This change will take effect from your next billing cycle. No refund for current cycle.</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-xs text-blue-300/70 mb-2">From next billing cycle</p>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-300">Monthly Rate ({editedLimits.max_tables} tables × ₹{RATE_PER_TABLE_PER_DAY} × 30)</span>
                      <div className="text-right">
                        {editedLimits.max_tables !== restaurant?.max_tables && (
                          <span className="text-zinc-500 line-through mr-2 text-sm">₹{calculateMonthlyAmount().toLocaleString()}</span>
                        )}
                        <span className="text-xl font-bold text-blue-400">₹{calculateMonthlyAmount(editedLimits.max_tables).toLocaleString()}/mo</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => hasUpgrades() && upgradeInfo.total > 5000 ? setShowConfirmModal(true) : handleSaveLimits()}
                    disabled={savingLimits || processingPayment || editedLimits.max_tables === restaurant?.max_tables}
                    className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                      hasUpgrades() && upgradeInfo.total > 0
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25'
                        : hasDowngrades()
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25'
                    }`}
                  >
                    {savingLimits || processingPayment ? (
                      <><RefreshCw className="w-5 h-5 animate-spin" />Processing...</>
                    ) : hasUpgrades() && upgradeInfo.total > 0 ? (
                      <><CreditCard className="w-5 h-5" />Pay ₹{Math.ceil(upgradeInfo.total).toLocaleString()} & Add {upgradeInfo.extraTables} Tables</>
                    ) : hasDowngrades() ? (
                      <><Save className="w-5 h-5" />Schedule Reduction</>
                    ) : (
                      <><Save className="w-5 h-5" />Save Changes</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Staff Management */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Staff Cap</h3>
                    <p className="text-sm text-zinc-400">Set internal staff limit (no extra cost)</p>
                  </div>
                </div>
                {!isEditingStaff ? (
                  <button 
                    onClick={() => setIsEditingStaff(true)}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-medium text-sm flex items-center gap-2 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />Edit
                  </button>
                ) : (
                  <button 
                    onClick={() => { setIsEditingStaff(false); setEditedLimits({ ...editedLimits, max_users: restaurant?.max_users || 5 }); }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-zinc-300 rounded-xl font-medium text-sm flex items-center gap-2 transition-all"
                  >
                    <X className="w-4 h-4" />Cancel
                  </button>
                )}
              </div>

              <div className={`p-6 rounded-xl border-2 transition-all ${isEditingStaff ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}>
                <div className="flex flex-col items-center">
                  {isEditingStaff ? (
                    <div className="flex items-center gap-4 mb-4">
                      <button 
                        onClick={() => handleStaffLimitChange(-1)}
                        disabled={(editedLimits.max_users || 0) <= Math.max(currentCounts.users, 1)}
                        className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="text-center">
                        <span className="text-5xl font-bold text-emerald-400">{editedLimits.max_users || 0}</span>
                        <p className="text-zinc-500 text-sm mt-1">staff members</p>
                      </div>
                      <button 
                        onClick={() => handleStaffLimitChange(1)}
                        className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <span className="text-5xl font-bold text-white">{restaurant?.max_users || 0}</span>
                      <p className="text-zinc-500 text-sm mt-1">staff members (using {currentCounts.users})</p>
                    </div>
                  )}
                  <p className="text-emerald-400 text-sm flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Unlimited staff included - No extra cost
                  </p>
                </div>
              </div>

              {isEditingStaff && (
                <button 
                  onClick={handleSaveStaffLimits}
                  disabled={savingLimits}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25"
                >
                  {savingLimits ? <><RefreshCw className="w-5 h-5 animate-spin" />Saving...</> : <><Save className="w-5 h-5" />Save Staff Cap</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-400" />
                  Payment History
                </h3>
              </div>

              {paymentHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400">No payment history yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {paymentHistory.map((bill, idx) => {
                    const isPaid = bill.status === 'paid';
                    const isPending = bill.status === 'pending';
                    // Detect upgrade: grace_period_days = 0 is only set for upgrades
                    const isUpgrade = bill.grace_period_days === 0;
                    const daysInMonth = new Date(bill.billing_year, bill.billing_month, 0).getDate();
                    return (
                      <div key={bill.id || idx} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isPaid ? 'bg-emerald-500/20' : isPending ? 'bg-amber-500/20' : 'bg-rose-500/20'
                            }`}>
                              {isPaid ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                               isPending ? <Clock className="w-5 h-5 text-amber-400" /> :
                               <AlertTriangle className="w-5 h-5 text-rose-400" />}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {new Date(bill.billing_year, bill.billing_month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                {isUpgrade && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Upgrade</span>}
                              </p>
                              <p className="text-zinc-500 text-sm">
                                {bill.invoice_number || 'Invoice #' + (bill.id?.slice(0, 8) || '-')}
                                {isUpgrade && ` • +${bill.table_count} tables (${bill.days_in_month || daysInMonth} days)`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-white font-bold">₹{(bill.total_amount || bill.amount || 0).toLocaleString()}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isPaid ? 'bg-emerald-500/20 text-emerald-400' :
                                isPending ? 'bg-amber-500/20 text-amber-400' :
                                'bg-rose-500/20 text-rose-400'
                              }`}>
                                {bill.status?.charAt(0).toUpperCase() + bill.status?.slice(1)}
                              </span>
                            </div>
                            {bill.receipt_url && (
                              <a 
                                href={bill.receipt_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Download className="w-5 h-5 text-zinc-400" />
                              </a>
                            )}
                          </div>
                        </div>
                        {bill.paid_at && (
                          <p className="text-zinc-600 text-xs mt-2 ml-14">
                            Paid on {new Date(bill.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Confirm Upgrade</h3>
              </div>
              <p className="text-zinc-400 mb-2">
                You are adding <strong className="text-white">{editedLimits.max_tables - (restaurant?.max_tables || 0)} tables</strong>.
              </p>
              <p className="text-zinc-400 mb-6">
                This will cost <strong className="text-emerald-400">₹{Math.ceil(upgradeInfo.total).toLocaleString()}</strong> for the remaining billing period.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSaveLimits()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl font-medium text-white transition-all"
                >
                  Confirm & Pay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
