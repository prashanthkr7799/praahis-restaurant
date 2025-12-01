import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Upload, Building2, Loader, User, Key, CreditCard, 
  ChevronRight, ChevronLeft, Check, AlertCircle, Eye, EyeOff,
  Mail, Phone, MapPin, Hash, Zap, Shield, Sparkles, Crown, CheckCircle2
} from 'lucide-react';
import { supabaseOwner } from '@/shared/utils/api/supabaseOwnerClient';
import { useToast } from '@/shared/components/superadmin/useToast';

const STEPS = [
  { id: 1, title: 'Restaurant Details', icon: Building2 },
  { id: 2, title: 'Manager Account', icon: User },
  { id: 3, title: 'Subscription Plan', icon: CreditCard },
  { id: 4, title: 'Payment Gateway', icon: Key },
];

const RATE_PER_TABLE_PER_DAY = 75;
// Breakdown: Core Platform ₹30 + Unlimited Staff ₹18 + Unlimited Menu ₹12 + Billing/POS ₹15 = ₹75
const PRICING_BREAKDOWN = {
  core: { label: 'Core Platform', amount: 30 },
  staff: { label: 'Unlimited Staff', amount: 18 },
  menu: { label: 'Unlimited Menu', amount: 12 },
  billing: { label: 'Billing & POS', amount: 15 }
};

const InputField = ({ label, name, value, onChange, error, icon: Icon, type = 'text', placeholder, hint, required, disabled, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      {Icon && <Icon className="inline h-4 w-4 mr-1 text-slate-400" />}
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50 ${error ? 'border-red-500' : 'border-white/10'}`}
      {...props}
    />
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    {hint && !error && <p className="text-slate-500 text-xs mt-1">{hint}</p>}
  </div>
);

const RestaurantFormModal = ({ isOpen, onClose, restaurant = null, onSuccess }) => {
  const { toast } = useToast();
  const isEdit = !!restaurant;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const [formData, setFormData] = useState({
    name: '', slug: '', address: '', phone: '', email: '',
    max_tables: '20', max_menu_items: '100', max_users: '10',
    manager_name: '', manager_email: '', manager_phone: '',
    manager_password: '', manager_confirm_password: '',
    pricing_type: 'per_table', price_per_table: RATE_PER_TABLE_PER_DAY.toString(),
    custom_monthly_amount: '', trial_days: '3',
    razorpay_key_id: '', razorpay_key_secret: '', razorpay_webhook_secret: '',
  });

  const [errors, setErrors] = useState({});
  const [stepCompleted, setStepCompleted] = useState({ 1: false, 2: false, 3: false, 4: false });

  useEffect(() => {
    if (restaurant) {
      let subscription = restaurant.subscription;
      if (Array.isArray(subscription)) subscription = subscription[0] || null;
      const pricePerTable = subscription?.price_per_table || RATE_PER_TABLE_PER_DAY;
      const paymentSettings = restaurant.payment_settings || {};
      
      setFormData(prev => ({
        ...prev,
        name: restaurant.name || '', slug: restaurant.slug || '',
        address: restaurant.address || '', phone: restaurant.phone || '',
        email: restaurant.email || '', max_tables: restaurant.max_tables?.toString() || '20',
        max_menu_items: restaurant.max_menu_items?.toString() || '100',
        max_users: restaurant.max_users?.toString() || '10',
        pricing_type: subscription?.price_per_table ? 'per_table' : 'custom',
        price_per_table: pricePerTable.toString(),
        custom_monthly_amount: subscription?.price?.toString() || '',
        razorpay_key_id: paymentSettings.razorpay_key_id || '',
        razorpay_key_secret: paymentSettings.razorpay_key_secret || '',
        razorpay_webhook_secret: paymentSettings.razorpay_webhook_secret || '',
      }));
      setLogoPreview(restaurant.logo_url || null);
      setStepCompleted({ 1: true, 2: true, 3: true, 4: true });
    }
  }, [restaurant]);

  const generateSlug = useCallback((name) => {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'name' && !isEdit) {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be less than 2MB'); return; }
      if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const calculateMonthlyTotal = () => {
    if (formData.pricing_type === 'per_table') {
      return (parseInt(formData.max_tables) || 0) * (parseFloat(formData.price_per_table) || RATE_PER_TABLE_PER_DAY) * 30;
    }
    return parseFloat(formData.custom_monthly_amount) || 0;
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Required';
      if (!formData.slug.trim()) newErrors.slug = 'Required';
      else if (!/^[a-z0-9-]+$/.test(formData.slug)) newErrors.slug = 'Invalid format';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
      const maxTables = parseInt(formData.max_tables);
      if (isNaN(maxTables) || maxTables < 1 || maxTables > 200) newErrors.max_tables = '1-200';
    }
    if (step === 2 && !isEdit) {
      if (!formData.manager_name.trim()) newErrors.manager_name = 'Required';
      if (!formData.manager_email.trim()) newErrors.manager_email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.manager_email)) newErrors.manager_email = 'Invalid';
      if (!formData.manager_password) newErrors.manager_password = 'Required';
      else if (formData.manager_password.length < 6) newErrors.manager_password = 'Min 6 chars';
      if (formData.manager_password !== formData.manager_confirm_password) newErrors.manager_confirm_password = 'No match';
    }
    if (step === 3) {
      if (formData.pricing_type === 'per_table') {
        if (isNaN(parseFloat(formData.price_per_table)) || parseFloat(formData.price_per_table) < 1) newErrors.price_per_table = 'Min ₹1';
      } else {
        if (isNaN(parseFloat(formData.custom_monthly_amount)) || parseFloat(formData.custom_monthly_amount) < 1) newErrors.custom_monthly_amount = 'Min ₹1';
      }
    }
    if (step === 4 && formData.razorpay_key_id && !formData.razorpay_key_id.startsWith('rzp_')) {
      newErrors.razorpay_key_id = 'Should start with rzp_';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setStepCompleted(prev => ({ ...prev, [currentStep]: true }));
      if (currentStep < 4) setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  const goToStep = (step) => { if (step <= currentStep || stepCompleted[step - 1]) setCurrentStep(step); };

  const handleSubmit = async () => {
    for (let step = 1; step <= 4; step++) {
      if (!validateStep(step)) { setCurrentStep(step); toast.error('Please fix errors'); return; }
    }

    try {
      setLoading(true);
      const restaurantData = {
        name: formData.name.trim(), slug: formData.slug.trim(),
        address: formData.address.trim() || null, phone: formData.phone.trim() || null,
        email: formData.email.trim() || null, max_tables: parseInt(formData.max_tables),
        max_menu_items: parseInt(formData.max_menu_items), max_users: parseInt(formData.max_users),
        logo_url: logoPreview, is_active: true,
        payment_settings: {
          razorpay_key_id: formData.razorpay_key_id.trim() || null,
          razorpay_key_secret: formData.razorpay_key_secret.trim() || null,
          razorpay_webhook_secret: formData.razorpay_webhook_secret.trim() || null,
        },
      };

      if (isEdit) {
        const { error: updateError } = await supabaseOwner.from('restaurants').update(restaurantData).eq('id', restaurant.id);
        if (updateError) throw updateError;
        
        const { data: existingSub } = await supabaseOwner.from('subscriptions').select('id').eq('restaurant_id', restaurant.id).maybeSingle();
        const monthlyAmount = calculateMonthlyTotal();
        const subscriptionData = {
          price: monthlyAmount,
          price_per_table: formData.pricing_type === 'per_table' ? parseFloat(formData.price_per_table) : null,
          plan_name: formData.pricing_type === 'per_table' ? `${formData.max_tables} Tables` : 'Custom Plan',
        };
        if (existingSub) await supabaseOwner.from('subscriptions').update(subscriptionData).eq('restaurant_id', restaurant.id);
        toast.success('Restaurant updated!');
      } else {
        const { data: newRestaurant, error: createError } = await supabaseOwner.from('restaurants').insert([restaurantData]).select().single();
        if (createError) throw createError;

        const trialDays = parseInt(formData.trial_days) || 3;
        const currentDate = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);

        await supabaseOwner.from('subscriptions').insert([{
          restaurant_id: newRestaurant.id, status: 'trial', price: calculateMonthlyTotal(),
          price_per_table: formData.pricing_type === 'per_table' ? parseFloat(formData.price_per_table) : null,
          plan_name: `${trialDays}-Day Trial`, current_period_start: currentDate.toISOString(),
          current_period_end: trialEndDate.toISOString(), trial_ends_at: trialEndDate.toISOString(), grace_period_days: 3,
        }]);

        if (formData.manager_email && formData.manager_password) {
          // Save current owner session before signUp (signUp will create a new session)
          const { data: currentSession } = await supabaseOwner.auth.getSession();
          
          // Use signUp instead of admin.createUser (admin requires service role key)
          const { data: authData, error: authError } = await supabaseOwner.auth.signUp({
            email: formData.manager_email.trim(),
            password: formData.manager_password,
            options: {
              data: {
                full_name: formData.manager_name.trim()
              }
            }
          });
          
          // Restore owner session immediately after signUp
          if (currentSession?.session) {
            await supabaseOwner.auth.setSession(currentSession.session);
          }
          
          if (authError) { 
            toast.error(`Manager creation failed: ${authError.message}`); 
          } else if (authData?.user?.id) {
            // Check if user needs email confirmation (identities will be empty)
            const needsConfirmation = !authData.user.identities || authData.user.identities.length === 0;
            
            console.log('Creating manager profile for user:', authData.user.id);
            console.log('Restaurant ID:', newRestaurant.id);
            
            // Use RPC function to create user profile (bypasses RLS issues)
            const { data: rpcResult, error: userError } = await supabaseOwner.rpc('owner_create_manager', {
              p_id: authData.user.id,
              p_email: formData.manager_email.trim(),
              p_full_name: formData.manager_name.trim(),
              p_phone: formData.manager_phone.trim() || null,
              p_restaurant_id: newRestaurant.id,
              p_role: 'manager',
              p_is_active: true,
            });
            
            console.log('RPC Result:', rpcResult);
            console.log('RPC Error:', userError);
            
            if (userError) { 
              console.error('Manager profile error:', userError);
              toast.error(`Manager profile creation failed: ${userError.message}`); 
            } else { 
              if (needsConfirmation) {
                toast.success('Manager account created! Email confirmation sent.');
              } else {
                toast.success('Manager account created!'); 
              }
            }
          }
        }
        toast.success(`Restaurant created with ${trialDays}-day trial!`);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-400" />
                {isEdit ? 'Edit Restaurant' : 'Add New Restaurant'}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {isEdit ? 'Update restaurant configuration' : 'Set up a new restaurant in the platform'}
              </p>
            </div>
            <button onClick={onClose} disabled={loading} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center mt-6 gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = stepCompleted[step.id] || currentStep > step.id;
              return (
                <React.Fragment key={step.id}>
                  <button onClick={() => goToStep(step.id)} disabled={loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all flex-shrink-0 ${
                      isActive ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                        : isCompleted ? 'bg-slate-700/50 text-white hover:bg-slate-700'
                        : 'bg-slate-800/30 text-slate-500 cursor-not-allowed'
                    }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted && !isActive ? 'bg-emerald-500 text-white' : ''}`}>
                      {isCompleted && !isActive ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    </div>
                    <span className="hidden md:inline text-sm font-medium">{step.title}</span>
                  </button>
                  {index < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-600 hidden md:block flex-shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden border-2 border-white/10 shadow-xl">
                    {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" /> : <Building2 className="h-10 w-10 text-slate-400" />}
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" disabled={loading} />
                  <label htmlFor="logo-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                    <Upload className="h-6 w-6 text-white" />
                  </label>
                </div>
                <div><h3 className="text-white font-semibold">Restaurant Logo</h3><p className="text-slate-400 text-sm">PNG or JPG (max 2MB)</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Restaurant Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} icon={Building2} placeholder="Aroma Dine" required disabled={loading} />
                <InputField label="URL Slug" name="slug" value={formData.slug} onChange={handleChange} error={errors.slug} icon={Hash} placeholder="aroma-dine" hint="Auto-generated" required disabled={loading} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} icon={Phone} placeholder="+91 98765 43210" disabled={loading} />
                <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} icon={Mail} placeholder="contact@restaurant.com" disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2"><MapPin className="inline h-4 w-4 mr-1 text-slate-400" />Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} disabled={loading} className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 resize-none disabled:opacity-50" placeholder="123 Main Street, City" />
              </div>
              <div className="p-4 bg-slate-800/30 rounded-xl border border-white/5">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2"><Zap className="h-4 w-4 text-amber-400" />Table Limit</h4>
                <div className="grid grid-cols-1 gap-4">
                  <InputField label="Max Tables" name="max_tables" type="number" value={formData.max_tables} onChange={handleChange} error={errors.max_tables} min="1" max="200" disabled={loading} hint="Staff & menu items are unlimited" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {isEdit ? (
                <div className="p-6 bg-slate-800/30 rounded-xl border border-white/5 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-white font-semibold text-lg">Manager Already Configured</h3>
                  <p className="text-slate-400 mt-2">Modify from Staff Management section.</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-start gap-3">
                      <Crown className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-white font-medium">Create Manager Account</h4>
                        <p className="text-slate-400 text-sm mt-1">Full access to manage restaurant, staff, menu, orders, and settings.</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Manager Name" name="manager_name" value={formData.manager_name} onChange={handleChange} error={errors.manager_name} icon={User} placeholder="John Doe" required disabled={loading} />
                    <InputField label="Manager Phone" name="manager_phone" value={formData.manager_phone} onChange={handleChange} icon={Phone} placeholder="+91 98765 43210" disabled={loading} />
                  </div>
                  <InputField label="Manager Email" name="manager_email" type="email" value={formData.manager_email} onChange={handleChange} error={errors.manager_email} icon={Mail} placeholder="manager@restaurant.com" hint="Used for login" required disabled={loading} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <InputField label="Password" name="manager_password" type={showPassword ? 'text' : 'password'} value={formData.manager_password} onChange={handleChange} error={errors.manager_password} icon={Key} placeholder="••••••••" required disabled={loading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-slate-400 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <InputField label="Confirm Password" name="manager_confirm_password" type={showPassword ? 'text' : 'password'} value={formData.manager_confirm_password} onChange={handleChange} error={errors.manager_confirm_password} icon={Key} placeholder="••••••••" required disabled={loading} />
                  </div>
                  {formData.manager_password && (
                    <div className="space-y-2">
                      <div className="flex gap-1">{[...Array(4)].map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${formData.manager_password.length > i * 3 ? (formData.manager_password.length > 8 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-700'}`} />)}</div>
                      <p className="text-xs text-slate-400">{formData.manager_password.length < 6 ? 'Too short' : formData.manager_password.length < 8 ? 'Moderate' : 'Strong'}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, pricing_type: 'per_table' }))} disabled={loading}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${formData.pricing_type === 'per_table' ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20' : 'border-white/10 bg-slate-800/30 hover:border-white/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <CreditCard className={`h-6 w-6 ${formData.pricing_type === 'per_table' ? 'text-emerald-400' : 'text-slate-400'}`} />
                    {formData.pricing_type === 'per_table' && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">Selected</span>}
                  </div>
                  <h4 className="text-white font-semibold">Per Table Pricing</h4>
                  <p className="text-slate-400 text-sm mt-1">₹{formData.price_per_table}/table/day</p>
                  <p className="text-slate-500 text-xs mt-2">Recommended for growing restaurants</p>
                </button>
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, pricing_type: 'custom' }))} disabled={loading}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${formData.pricing_type === 'custom' ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' : 'border-white/10 bg-slate-800/30 hover:border-white/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <Crown className={`h-6 w-6 ${formData.pricing_type === 'custom' ? 'text-purple-400' : 'text-slate-400'}`} />
                    {formData.pricing_type === 'custom' && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium">Selected</span>}
                  </div>
                  <h4 className="text-white font-semibold">Custom Plan</h4>
                  <p className="text-slate-400 text-sm mt-1">Fixed monthly amount</p>
                  <p className="text-slate-500 text-xs mt-2">For enterprise agreements</p>
                </button>
              </div>

              {formData.pricing_type === 'per_table' && (
                <div className="p-5 bg-slate-800/30 rounded-xl border border-white/5 space-y-4">
                  <InputField label="Price per Table (₹/day)" name="price_per_table" type="number" value={formData.price_per_table} onChange={handleChange} error={errors.price_per_table} min="1" required disabled={loading} />
                  {/* ₹75 Breakdown */}
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {Object.entries(PRICING_BREAKDOWN).map(([key, item]) => (
                      <div key={key} className="p-2 rounded-lg bg-white/5 text-center">
                        <div className="text-slate-400">{item.label}</div>
                        <div className="text-white font-medium">₹{item.amount}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 text-center">Staff & menu items are UNLIMITED in this pricing model</p>
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex justify-between items-center text-sm text-slate-400 mb-2">
                      <span>Calculation</span>
                      <span className="font-mono">{formData.max_tables} tables × ₹{formData.price_per_table}/day × 30 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">Monthly Total</span>
                      <span className="text-2xl font-bold text-emerald-400">₹{calculateMonthlyTotal().toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {formData.pricing_type === 'custom' && (
                <div className="p-5 bg-slate-800/30 rounded-xl border border-white/5 space-y-4">
                  <InputField label="Monthly Amount (₹)" name="custom_monthly_amount" type="number" value={formData.custom_monthly_amount} onChange={handleChange} error={errors.custom_monthly_amount} min="1" required disabled={loading} />
                  <div className="flex gap-2 flex-wrap">
                    {[{ amount: '25000', label: 'Basic' }, { amount: '35000', label: 'Standard' }, { amount: '50000', label: 'Premium' }].map(preset => (
                      <button key={preset.amount} type="button" onClick={() => setFormData(prev => ({ ...prev, custom_monthly_amount: preset.amount }))} disabled={loading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.custom_monthly_amount === preset.amount ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                        ₹{parseInt(preset.amount).toLocaleString('en-IN')} ({preset.label})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <div className="flex-1">
                    <h4 className="text-white font-medium">Free Trial Period</h4>
                    <p className="text-slate-400 text-sm">Starts with {formData.trial_days} days free</p>
                  </div>
                  <select name="trial_days" value={formData.trial_days} onChange={handleChange} disabled={loading} className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50">
                    <option value="3">3 Days</option><option value="7">7 Days</option><option value="14">14 Days</option><option value="30">30 Days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Razorpay Payment Gateway</h4>
                    <p className="text-slate-400 text-sm mt-1">Configure API keys for payment processing. Securely encrypted.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-800/30 rounded-xl border border-white/5 space-y-5">
                <InputField label="Razorpay Key ID" name="razorpay_key_id" value={formData.razorpay_key_id} onChange={handleChange} error={errors.razorpay_key_id} icon={Key} placeholder="rzp_live_xxxxxxxxxxxx" hint="Starts with rzp_live_ or rzp_test_" disabled={loading} />
                <div className="relative">
                  <InputField label="Razorpay Key Secret" name="razorpay_key_secret" type={showSecrets ? 'text' : 'password'} value={formData.razorpay_key_secret} onChange={handleChange} icon={Key} placeholder="••••••••••••••••" disabled={loading} />
                  <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="absolute right-3 top-9 text-slate-400 hover:text-white transition-colors">
                    {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <InputField label="Webhook Secret" name="razorpay_webhook_secret" type={showSecrets ? 'text' : 'password'} value={formData.razorpay_webhook_secret} onChange={handleChange} icon={Key} placeholder="••••••••••••••••" hint="Optional - For webhook verification" disabled={loading} />
              </div>

              {!formData.razorpay_key_id && (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 text-center">
                  <p className="text-slate-400 text-sm"><AlertCircle className="inline h-4 w-4 mr-1 text-amber-400" />Payment keys can be configured later from settings.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50 flex items-center justify-between">
          <button type="button" onClick={prevStep} disabled={currentStep === 1 || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${currentStep === 1 ? 'text-slate-600 cursor-not-allowed' : 'text-white bg-slate-700 hover:bg-slate-600'}`}>
            <ChevronLeft className="h-4 w-4" />Back
          </button>

          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>

            {currentStep < 4 ? (
              <button type="button" onClick={nextStep} disabled={loading}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/25 transition-all">
                Next<ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50">
                {loading ? <><Loader className="h-4 w-4 animate-spin" />Creating...</> : <><Check className="h-4 w-4" />{isEdit ? 'Update' : 'Create Restaurant'}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantFormModal;
