import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import toast from 'react-hot-toast';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';

const RestaurantForm = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const isEditMode = !!restaurantId;
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subscription_status: 'trial', // This is for UI only, stored in subscriptions table
    max_users: 10,
    max_tables: 20,
    max_menu_items: 100,
    is_active: true,
  });
  const [subscriptionId, setSubscriptionId] = useState(null); // Track subscription ID for updates
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Fetch restaurant data if in edit mode
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) return;
      
      try {
        // Fetch restaurant with subscription data
        const { data, error } = await supabaseOwner
          .from('restaurants')
          .select(`
            *,
            subscriptions (
              id,
              status,
              plan_name
            )
          `)
          .eq('id', restaurantId)
          .single();

        if (error) throw error;

        // Get subscription status from subscriptions table
        const subscription = Array.isArray(data.subscriptions) 
          ? data.subscriptions[0] 
          : data.subscriptions;
        
        if (subscription?.id) {
          setSubscriptionId(subscription.id);
        }

        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          subscription_status: subscription?.status || 'trial', // Get from subscriptions table
          max_users: data.max_users || 10,
          max_tables: data.max_tables || 20,
          max_menu_items: data.max_menu_items || 100,
          is_active: data.is_active ?? true,
        });
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        toast.error('Failed to load restaurant data');
        navigate('/superadmin/restaurants');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId, navigate]);

  const generateSlug = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        // Update existing restaurant (don't include subscription_status - it's in subscriptions table)
        const { error } = await supabaseOwner
          .from('restaurants')
          .update({
            name: formData.name,
            slug: formData.slug,
            max_users: formData.max_users,
            max_tables: formData.max_tables,
            max_menu_items: formData.max_menu_items,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', restaurantId);

        if (error) throw error;

        // Update subscription status in subscriptions table
        if (subscriptionId) {
          const { error: subError } = await supabaseOwner
            .from('subscriptions')
            .update({
              status: formData.subscription_status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscriptionId);

          if (subError) {
            console.error('Failed to update subscription:', subError);
            // Don't throw - restaurant update succeeded
          }
        } else {
          // Create subscription if none exists
          await supabaseOwner.from('subscriptions').insert([{
            restaurant_id: restaurantId,
            plan_name: 'Per-Table Plan',
            status: formData.subscription_status,
            price_per_table: 75,
            current_period_start: new Date().toISOString(),
          }]);
        }

        toast.success('Restaurant updated successfully');
        navigate(`/superadmin/restaurants/${restaurantId}`);
      } else {
        // Create new restaurant (exclude subscription_status - it goes in subscriptions table)
        const { subscription_status, ...restaurantData } = formData;
        
        const { data, error } = await supabaseOwner
          .from('restaurants')
          .insert([{
            ...restaurantData,
            slug: formData.slug || generateSlug(formData.name)
          }])
          .select()
          .single();

        if (error) throw error;

        // Unified subscription: 3-day trial → ₹75/table/day
        const isTrial = subscription_status === 'trial';
        const trialDays = 3; // Unified: 3-day trial
        const billingDays = 30; // Monthly billing cycle
        
        const currentDate = new Date();
        const subscriptionEndDate = new Date(currentDate.getTime() + (isTrial ? trialDays : billingDays) * 24 * 60 * 60 * 1000);

        // Create subscription record with per-table pricing
        await supabaseOwner.from('subscriptions').insert([{
          restaurant_id: data.id,
          plan_name: 'Per-Table Plan',
          status: isTrial ? 'trial' : 'active',
          price_per_table: 75, // ₹75/table/day
          current_period_start: currentDate.toISOString(),
          current_period_end: isTrial ? null : subscriptionEndDate.toISOString(),
          trial_ends_at: isTrial ? subscriptionEndDate.toISOString() : null,
          next_billing_date: subscriptionEndDate.toISOString(),
        }]);

        toast.success('Restaurant created successfully');
        navigate(`/superadmin/restaurants/${data.id}`);
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast.error(error.message || 'Failed to save restaurant');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
          {isEditMode ? 'Edit Restaurant' : 'Add New Restaurant'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-card via-card to-muted/10 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-2xl space-y-6">
        {/* Restaurant Name */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Restaurant Name <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
            className="w-full px-4 py-3 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
            placeholder="Enter restaurant name"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Slug <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-4 py-3 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
            placeholder="restaurant-slug"
          />
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            Auto-generated from name. Used in URLs.
          </p>
        </div>

        {/* Subscription Plan & Status */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Subscription Plan
            </label>
            <select
              value={formData.subscription_status}
              onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
              className="w-full px-4 py-3 bg-card border-2 border-border text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth appearance-none bg-no-repeat bg-right pr-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundSize: '1.5rem',
                backgroundPosition: 'right 0.75rem center'
              }}
            >
              <option value="trial">✓ Trial (3 days)</option>
              <option value="active">Active (₹35,000/mo)</option>
            </select>
            {formData.subscription_status === 'active' && (
              <p className="text-xs text-primary mt-2 font-semibold">
                + ₹5,000 one-time setup fee
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Status
            </label>
            <select
              value={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
              className="w-full px-4 py-3 bg-card border-2 border-border text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth appearance-none bg-no-repeat bg-right pr-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundSize: '1.5rem',
                backgroundPosition: 'right 0.75rem center'
              }}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Resource Limits */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            Resource Limits
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Max Users
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-card border-2 border-border text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Max Tables
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_tables}
                onChange={(e) => setFormData({ ...formData, max_tables: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-card border-2 border-border text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Max Menu Items
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_menu_items}
                onChange={(e) => setFormData({ ...formData, max_menu_items: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-card border-2 border-border text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-border/50">
          <button
            type="button"
            onClick={() => navigate(isEditMode ? `/superadmin/restaurants/${restaurantId}` : '/superadmin/restaurants')}
            className="px-6 py-3 border-2 border-border bg-card text-foreground rounded-xl hover:bg-muted font-semibold transition-smooth"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-smooth"
          >
            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Restaurant' : 'Create Restaurant')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantForm;
