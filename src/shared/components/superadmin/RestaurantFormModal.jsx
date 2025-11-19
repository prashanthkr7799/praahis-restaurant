import React, { useState, useEffect } from 'react';
import { X, Upload, Building2, Loader } from 'lucide-react';
import { supabaseOwner } from '@/shared/utils/api/supabaseOwnerClient';
import Button from '@/shared/components/superadmin/Button';
import { useToast } from '@/shared/components/superadmin/useToast';

/**
 * Professional Restaurant Form Modal
 * Handles both Add and Edit operations
 */
const RestaurantFormModal = ({ isOpen, onClose, restaurant = null, onSuccess }) => {
  const { toast } = useToast();
  const isEdit = !!restaurant;

  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(restaurant?.logo_url || null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    email: '',
    max_tables: '20',
    max_menu_items: '100',
    max_users: '10',
    pricing_type: 'per_table', // 'per_table' or 'custom'
    price_per_table: '100', // ₹100 per table per day
    custom_monthly_amount: '',
    subscription_status: 'active',
    razorpay_key_id: '',
    razorpay_key_secret: '',
    razorpay_webhook_secret: '',
  });

  const [errors, setErrors] = useState({});

  // Populate form if editing
  useEffect(() => {
    if (restaurant) {
      // Handle subscription - could be array, object, or null
      let subscription = restaurant.subscription;
      if (Array.isArray(subscription)) {
        subscription = subscription.length > 0 ? subscription[0] : null;
      }
      
      
      const pricePerTable = subscription?.price_per_table || 100;
      const hasPricePerTable = subscription?.price_per_table != null;

      // Handle payment_settings - could be JSON or null
      const paymentSettings = restaurant.payment_settings || {};
      
      setFormData({
        name: restaurant.name || '',
        slug: restaurant.slug || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        max_tables: restaurant.max_tables?.toString() || '20',
        max_menu_items: restaurant.max_menu_items?.toString() || '100',
        max_users: restaurant.max_users?.toString() || '10',
        pricing_type: hasPricePerTable ? 'per_table' : 'custom',
        price_per_table: pricePerTable.toString(),
        custom_monthly_amount: !hasPricePerTable && subscription?.price ? subscription.price.toString() : '',
        subscription_status: subscription?.status || 'active',
        razorpay_key_id: paymentSettings.razorpay_key_id || '',
        razorpay_key_secret: paymentSettings.razorpay_key_secret || '',
        razorpay_webhook_secret: paymentSettings.razorpay_webhook_secret || '',
      });
      setLogoPreview(restaurant.logo_url || null);
    }
  }, [restaurant]);

  // Auto-generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug when name changes
    if (name === 'name' && !isEdit) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate monthly total based on pricing type
  const calculateMonthlyTotal = () => {
    if (formData.pricing_type === 'per_table') {
      const tables = parseInt(formData.max_tables) || 0;
      const pricePerTable = parseFloat(formData.price_per_table) || 100;
      const dailyTotal = tables * pricePerTable;
      const monthlyTotal = dailyTotal * 30;
      return monthlyTotal;
    } else {
      return parseFloat(formData.custom_monthly_amount) || 0;
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Restaurant name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^[0-9+\-() ]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }

    const maxTables = parseInt(formData.max_tables);
    if (isNaN(maxTables) || maxTables < 1 || maxTables > 200) {
      newErrors.max_tables = 'Must be between 1 and 200';
    }

    const maxMenuItems = parseInt(formData.max_menu_items);
    if (isNaN(maxMenuItems) || maxMenuItems < 1 || maxMenuItems > 1000) {
      newErrors.max_menu_items = 'Must be between 1 and 1000';
    }

    const maxUsers = parseInt(formData.max_users);
    if (isNaN(maxUsers) || maxUsers < 1 || maxUsers > 100) {
      newErrors.max_users = 'Must be between 1 and 100';
    }

    // Pricing validation
    if (formData.pricing_type === 'per_table') {
      const pricePerTable = parseFloat(formData.price_per_table);
      if (isNaN(pricePerTable) || pricePerTable < 1) {
        newErrors.price_per_table = 'Must be at least ₹1';
      }
    } else {
      const customAmount = parseFloat(formData.custom_monthly_amount);
      if (isNaN(customAmount) || customAmount < 1) {
        newErrors.custom_monthly_amount = 'Must be at least ₹1';
      }
    }

    // Razorpay validation (optional but must be valid if provided)
    if (formData.razorpay_key_id && !formData.razorpay_key_id.startsWith('rzp_')) {
      newErrors.razorpay_key_id = 'Invalid Razorpay Key ID format (should start with rzp_)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);

      const restaurantData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        max_tables: parseInt(formData.max_tables),
        max_menu_items: parseInt(formData.max_menu_items),
        max_users: parseInt(formData.max_users),
        logo_url: logoPreview,
        is_active: true,
        payment_settings: {
          razorpay_key_id: formData.razorpay_key_id.trim() || null,
          razorpay_key_secret: formData.razorpay_key_secret.trim() || null,
          razorpay_webhook_secret: formData.razorpay_webhook_secret.trim() || null,
        },
      };

      if (isEdit) {
        // Update existing restaurant
        const { error: updateError } = await supabaseOwner
          .from('restaurants')
          .update(restaurantData)
          .eq('id', restaurant.id);

        if (updateError) throw updateError;

        // Update or create subscription
        // Check if subscription exists for this restaurant
        const { data: existingSub, error: checkError } = await supabaseOwner
          .from('subscriptions')
          .select('id')
          .eq('restaurant_id', restaurant.id)
          .maybeSingle();

        if (checkError) throw checkError;

        const monthlyAmount = calculateMonthlyTotal();
        const subscriptionData = {
          status: formData.subscription_status,
          price: monthlyAmount,
          billing_cycle: 'monthly',
        };

        // Add pricing-specific fields
        if (formData.pricing_type === 'per_table') {
          subscriptionData.price_per_table = parseFloat(formData.price_per_table);
          subscriptionData.plan_name = `${formData.max_tables} Tables`;
        } else {
          subscriptionData.price_per_table = null;
          // Set descriptive plan name based on amount
          const amount = parseFloat(formData.custom_monthly_amount);
          if (amount === 35000) {
            subscriptionData.plan_name = 'Standard Plan';
          } else if (amount === 50000) {
            subscriptionData.plan_name = 'Premium Plan';
          } else {
            subscriptionData.plan_name = `Custom (₹${amount.toLocaleString('en-IN')})`;
          }
        }


        if (existingSub) {
          // Update existing subscription
          const { error: subError } = await supabaseOwner
            .from('subscriptions')
            .update(subscriptionData)
            .eq('restaurant_id', restaurant.id);

          if (subError) throw subError;
        } else {
          // Create new subscription if it doesn't exist
          const currentDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30);

          const { error: subError } = await supabaseOwner
            .from('subscriptions')
            .insert([{
              restaurant_id: restaurant.id,
              current_period_start: currentDate.toISOString(),
              current_period_end: endDate.toISOString(),
              ...subscriptionData,
            }]);

          if (subError) throw subError;
        }

        toast.success('Restaurant updated successfully!');
      } else {
        // Create new restaurant with pricing configuration
        const restaurantDataWithPricing = {
          ...restaurantData,
          pricing_type: formData.pricing_type,
          custom_monthly_amount: formData.pricing_type === 'custom' 
            ? parseFloat(formData.custom_monthly_amount) 
            : null,
          trial_days: 3, // Fixed 3-day trial for all new restaurants
        };

        const { data: newRestaurant, error: createError } = await supabaseOwner
          .from('restaurants')
          .insert([restaurantDataWithPricing])
          .select()
          .single();

        if (createError) throw createError;

        // Create 3-day trial subscription using database function
        const { error: trialError } = await supabaseOwner
          .rpc('create_trial_subscription', {
            p_restaurant_id: newRestaurant.id,
            p_trial_days: 3
          });

        if (trialError) {
          console.error('Trial creation error:', trialError);
          // Fallback: Create trial subscription manually
          const currentDate = new Date();
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 3); // 3 days trial

          const monthlyAmount = calculateMonthlyTotal();
          
          const subscriptionData = {
            restaurant_id: newRestaurant.id,
            status: 'trial', // Always start with trial
            price: monthlyAmount,
            billing_cycle: 'monthly',
            current_period_start: currentDate.toISOString(),
            current_period_end: trialEndDate.toISOString(),
            end_date: trialEndDate.toISOString(),
            trial_ends_at: trialEndDate.toISOString(),
            grace_period_days: 3,
          };

          // Add pricing-specific fields
          if (formData.pricing_type === 'per_table') {
            subscriptionData.price_per_table = parseFloat(formData.price_per_table);
            subscriptionData.plan_name = `${formData.max_tables} Tables (Trial)`;
          } else {
            subscriptionData.price_per_table = null;
            const amount = parseFloat(formData.custom_monthly_amount);
            if (amount === 35000) {
              subscriptionData.plan_name = 'Standard Plan (Trial)';
            } else if (amount === 50000) {
              subscriptionData.plan_name = 'Premium Plan (Trial)';
            } else {
              subscriptionData.plan_name = `Custom (₹${amount.toLocaleString('en-IN')}) - Trial`;
            }
          }

          const { error: subError } = await supabaseOwner
            .from('subscriptions')
            .insert([subscriptionData]);

          if (subError) throw subError;
        }

        toast.success('Restaurant created successfully with 3-day free trial!');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} restaurant: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Restaurant' : 'Add New Restaurant'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Restaurant Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                    disabled={loading}
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={Upload}
                      size="sm"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={loading}
                    >
                      Upload Logo
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Restaurant Name & Slug - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                    ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Ex: Aroma Dine"
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                    ${errors.slug ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Ex: aroma-dine"
                />
                {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Auto-generated from name. Used in URLs.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                    ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="+1 234 567 8900"
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                    ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="contact@restaurant.com"
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="123 Main Street, City, State, ZIP"
              />
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="max_tables" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Tables <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="max_tables"
                  name="max_tables"
                  value={formData.max_tables}
                  onChange={handleChange}
                  disabled={loading}
                  min="1"
                  max="200"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                    ${errors.max_tables ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errors.max_tables && <p className="text-sm text-red-500 mt-1">{errors.max_tables}</p>}
              </div>

              <div>
                <label htmlFor="max_menu_items" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Menu Items <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="max_menu_items"
                  name="max_menu_items"
                  value={formData.max_menu_items}
                  onChange={handleChange}
                  disabled={loading}
                  min="1"
                  max="1000"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                    ${errors.max_menu_items ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errors.max_menu_items && <p className="text-sm text-red-500 mt-1">{errors.max_menu_items}</p>}
              </div>

              <div>
                <label htmlFor="max_users" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Users <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="max_users"
                  name="max_users"
                  value={formData.max_users}
                  onChange={handleChange}
                  disabled={loading}
                  min="1"
                  max="100"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                    ${errors.max_users ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errors.max_users && <p className="text-sm text-red-500 mt-1">{errors.max_users}</p>}
              </div>
            </div>

            {/* Pricing Model */}
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Pricing & Billing
              </h3>

              {/* Pricing Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pricing Model <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pricing_type: 'per_table' }))}
                    disabled={loading}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.pricing_type === 'per_table'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">Per Table</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      ₹{formData.price_per_table}/table/day
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pricing_type: 'custom' }))}
                    disabled={loading}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.pricing_type === 'custom'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">Custom Amount</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Fixed monthly price
                    </div>
                  </button>
                </div>
              </div>

              {/* Per Table Pricing */}
              {formData.pricing_type === 'per_table' && (
                <div>
                  <label htmlFor="price_per_table" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Per Table (₹/day) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price_per_table"
                    name="price_per_table"
                    value={formData.price_per_table}
                    onChange={handleChange}
                    disabled={loading}
                    min="1"
                    step="1"
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                      ${errors.price_per_table ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="100"
                  />
                  {errors.price_per_table && <p className="text-sm text-red-500 mt-1">{errors.price_per_table}</p>}
                  
                  {/* Monthly Total Calculation */}
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Calculation:</span>
                      <span className="font-mono text-gray-600 dark:text-gray-400">
                        {formData.max_tables} tables × ₹{formData.price_per_table}/day × 30 days
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-base font-semibold mt-2">
                      <span className="text-gray-900 dark:text-gray-100">Monthly Total:</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        ₹{calculateMonthlyTotal().toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Amount */}
              {formData.pricing_type === 'custom' && (
                <div>
                  <label htmlFor="custom_monthly_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Monthly Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="custom_monthly_amount"
                    name="custom_monthly_amount"
                    value={formData.custom_monthly_amount}
                    onChange={handleChange}
                    disabled={loading}
                    min="1"
                    step="1"
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                      ${errors.custom_monthly_amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="35000"
                  />
                  {errors.custom_monthly_amount && <p className="text-sm text-red-500 mt-1">{errors.custom_monthly_amount}</p>}
                  
                  {/* Quick preset buttons */}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, custom_monthly_amount: '35000' }));
                        if (errors.custom_monthly_amount) {
                          setErrors(prev => ({ ...prev, custom_monthly_amount: undefined }));
                        }
                      }}
                      className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 
                                 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      ₹35,000 (Standard)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, custom_monthly_amount: '50000' }));
                        if (errors.custom_monthly_amount) {
                          setErrors(prev => ({ ...prev, custom_monthly_amount: undefined }));
                        }
                      }}
                      className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 
                                 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      ₹50,000 (Premium)
                    </button>
                  </div>
                  
                  {formData.custom_monthly_amount && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center justify-between text-base font-semibold">
                        <span className="text-gray-900 dark:text-gray-100">Monthly Total:</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          ₹{parseFloat(formData.custom_monthly_amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subscription Status */}
              <div>
                <label htmlFor="subscription_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subscription Status
                </label>
                <select
                  id="subscription_status"
                  name="subscription_status"
                  value={formData.subscription_status}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Razorpay API Configuration */}
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Razorpay API Configuration
                </h3>
                <div className="group relative">
                  <svg 
                    className="h-4 w-4 text-gray-400 cursor-help" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                    These keys will be securely stored and used for your restaurant's payments.
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 space-y-4">
                {/* Razorpay Key ID */}
                <div>
                  <label htmlFor="razorpay_key_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    id="razorpay_key_id"
                    name="razorpay_key_id"
                    value={formData.razorpay_key_id}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                      ${errors.razorpay_key_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Enter your Razorpay Key ID (rzp_live_...)"
                  />
                  {errors.razorpay_key_id && <p className="text-sm text-red-500 mt-1">{errors.razorpay_key_id}</p>}
                </div>

                {/* Razorpay Key Secret */}
                <div>
                  <label htmlFor="razorpay_key_secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Razorpay Key Secret
                  </label>
                  <input
                    type="password"
                    id="razorpay_key_secret"
                    name="razorpay_key_secret"
                    value={formData.razorpay_key_secret}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your Razorpay Key Secret"
                  />
                </div>

                {/* Razorpay Webhook Secret */}
                <div>
                  <label htmlFor="razorpay_webhook_secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Webhook Secret <span className="text-gray-500 text-xs">(optional)</span>
                  </label>
                  <input
                    type="password"
                    id="razorpay_webhook_secret"
                    name="razorpay_webhook_secret"
                    value={formData.razorpay_webhook_secret}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your Webhook Secret (optional)"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            icon={loading ? Loader : undefined}
            className={loading ? 'opacity-75' : ''}
          >
            {loading ? 'Saving...' : isEdit ? 'Update Restaurant' : 'Create Restaurant'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantFormModal;
