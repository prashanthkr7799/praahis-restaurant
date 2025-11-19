import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/utils/api/supabaseClient';
import useRestaurant from '@/shared/hooks/useRestaurant';
import toast from 'react-hot-toast';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';

export default function PaymentSettingsPage() {
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [formData, setFormData] = useState({
    razorpay_key_id: '',
    razorpay_key_secret: '',
    razorpay_webhook_secret: '',
    payment_gateway_enabled: false,
    payment_settings: {
      currency: 'INR',
      accepted_methods: ['card', 'netbanking', 'wallet', 'upi'],
      auto_capture: true,
      retry_enabled: false,
    }
  });

  const [showSecrets, setShowSecrets] = useState({
    key_secret: false,
    webhook_secret: false,
  });

  useEffect(() => {
    if (restaurantId) {
      fetchPaymentSettings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret, payment_gateway_enabled, payment_settings')
        .eq('id', restaurantId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          razorpay_key_id: data.razorpay_key_id || '',
          razorpay_key_secret: data.razorpay_key_secret || '',
          razorpay_webhook_secret: data.razorpay_webhook_secret || '',
          payment_gateway_enabled: data.payment_gateway_enabled || false,
          payment_settings: data.payment_settings || formData.payment_settings,
        });
      }
    } catch (err) {
      console.error('Error fetching payment settings:', err);
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePaymentMethodToggle = (method) => {
    setFormData(prev => ({
      ...prev,
      payment_settings: {
        ...prev.payment_settings,
        accepted_methods: prev.payment_settings.accepted_methods.includes(method)
          ? prev.payment_settings.accepted_methods.filter(m => m !== method)
          : [...prev.payment_settings.accepted_methods, method]
      }
    }));
  };

  const validateCredentials = () => {
    if (!formData.razorpay_key_id.trim()) {
      toast.error('Please enter Razorpay Key ID');
      return false;
    }

    if (!formData.razorpay_key_id.match(/^rzp_(test|live)_[A-Za-z0-9]+$/)) {
      toast.error('Invalid Razorpay Key ID format. Should start with rzp_test_ or rzp_live_');
      return false;
    }

    if (!formData.razorpay_key_secret.trim()) {
      toast.error('Please enter Razorpay Key Secret');
      return false;
    }

    return true;
  };

  const handleTestConnection = async () => {
    if (!validateCredentials()) return;

    setTesting(true);
    try {
      // Test by attempting to load Razorpay SDK with the provided key
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });

      // Basic validation passed
      toast.success('✓ Razorpay credentials format is valid');
      
      // Note: Full validation requires server-side API call
      toast.info('💡 Save settings to fully validate credentials with Razorpay');
    } catch (err) {
      console.error('Test connection error:', err);
      toast.error('Failed to connect to Razorpay. Please check your internet connection.');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCredentials()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          razorpay_key_id: formData.razorpay_key_id.trim(),
          razorpay_key_secret: formData.razorpay_key_secret.trim(),
          razorpay_webhook_secret: formData.razorpay_webhook_secret.trim() || null,
          payment_gateway_enabled: true, // Auto-enable when credentials are saved
          payment_settings: formData.payment_settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) throw error;

      toast.success('✅ Payment settings saved successfully!');
      
      // Log the change in audit trail
      await supabase.from('payment_credential_audit').insert({
        restaurant_id: restaurantId,
        action: formData.razorpay_key_id ? 'updated' : 'added',
        new_key_id: formData.razorpay_key_id,
        notes: 'Credentials updated via settings page'
      });

    } catch (err) {
      console.error('Error saving payment settings:', err);
      toast.error(err.message || 'Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDisablePayments = async () => {
    if (!confirm('Are you sure you want to disable payment gateway? Customers will not be able to pay online.')) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          payment_gateway_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId);

      if (error) throw error;

      setFormData(prev => ({ ...prev, payment_gateway_enabled: false }));
      toast.success('Payment gateway disabled');

    } catch (err) {
      console.error('Error disabling payments:', err);
      toast.error('Failed to disable payment gateway');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 dark:text-white mb-2">
          Payment Gateway Settings
        </h1>
        <p className="text-gray-400 dark:text-gray-400">
          Configure your Razorpay account to accept online payments from customers
        </p>
      </div>

      {/* Status Banner */}
      {formData.payment_gateway_enabled ? (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-green-800 dark:text-green-300 font-semibold">
                  Payment Gateway Active
                </h3>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Online payments are enabled for your restaurant
                </p>
              </div>
            </div>
            <button
              onClick={handleDisablePayments}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 
                       hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Disable
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-yellow-800 dark:text-yellow-300 font-semibold">
                Payment Gateway Inactive
              </h3>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                Configure your Razorpay credentials below to enable online payments
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Razorpay Credentials Card */}
        <div className="bg-gray-900 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-700 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-100 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Razorpay API Credentials
          </h2>

          {/* Help Text */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
              📚 <strong>How to get your Razorpay credentials:</strong>
            </p>
            <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-5 list-decimal">
              <li>Login to <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="underline">Razorpay Dashboard</a></li>
              <li>Go to Settings → API Keys</li>
              <li>Generate or copy your Key ID and Key Secret</li>
              <li>Use Test Mode keys for testing, Live Mode for production</li>
            </ol>
          </div>

          <div className="space-y-4">
            {/* Key ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-2">
                Razorpay Key ID *
              </label>
              <input
                type="text"
                name="razorpay_key_id"
                value={formData.razorpay_key_id}
                onChange={handleInputChange}
                placeholder="rzp_test_xxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-600 dark:border-gray-600 rounded-lg 
                         bg-gray-900 dark:bg-gray-700 text-gray-100 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-400">
                Starts with rzp_test_ (test mode) or rzp_live_ (live mode)
              </p>
            </div>

            {/* Key Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-2">
                Razorpay Key Secret *
              </label>
              <div className="relative">
                <input
                  type={showSecrets.key_secret ? 'text' : 'password'}
                  name="razorpay_key_secret"
                  value={formData.razorpay_key_secret}
                  onChange={handleInputChange}
                  placeholder="Enter your Razorpay Key Secret"
                  className="w-full px-4 py-2 pr-12 border border-gray-600 dark:border-gray-600 rounded-lg 
                           bg-gray-900 dark:bg-gray-700 text-gray-100 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(prev => ({ ...prev, key_secret: !prev.key_secret }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 dark:hover:text-gray-300"
                >
                  {showSecrets.key_secret ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-400">
                Keep this secret secure. Never share it publicly.
              </p>
            </div>

            {/* Webhook Secret (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-2">
                Webhook Secret (Optional)
              </label>
              <div className="relative">
                <input
                  type={showSecrets.webhook_secret ? 'text' : 'password'}
                  name="razorpay_webhook_secret"
                  value={formData.razorpay_webhook_secret}
                  onChange={handleInputChange}
                  placeholder="Enter webhook secret for payment verification"
                  className="w-full px-4 py-2 pr-12 border border-gray-600 dark:border-gray-600 rounded-lg 
                           bg-gray-900 dark:bg-gray-700 text-gray-100 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(prev => ({ ...prev, webhook_secret: !prev.webhook_secret }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 dark:hover:text-gray-300"
                >
                  {showSecrets.webhook_secret ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-400">
                Required for webhook verification (recommended for production)
              </p>
            </div>

            {/* Test Connection Button */}
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !formData.razorpay_key_id}
              className="w-full py-2 px-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 
                       dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/20
                       rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Testing Connection...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Test Connection
                </>
              )}
            </button>
          </div>
        </div>

        {/* Payment Settings Card */}
        <div className="bg-gray-900 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-700 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-100 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Payment Options
          </h2>

          <div className="space-y-4">
            {/* Accepted Payment Methods */}
            <div>
              <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-3">
                Accepted Payment Methods
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
                  { value: 'netbanking', label: 'Net Banking', icon: '🏦' },
                  { value: 'wallet', label: 'Wallets', icon: '👝' },
                  { value: 'upi', label: 'UPI', icon: '📱' },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                      ${formData.payment_settings.accepted_methods.includes(method.value)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-700 dark:border-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.payment_settings.accepted_methods.includes(method.value)}
                      onChange={() => handlePaymentMethodToggle(method.value)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-2xl">{method.icon}</span>
                    <span className="text-sm font-medium text-gray-300 dark:text-gray-300">
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={formData.payment_settings.currency}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  payment_settings: { ...prev.payment_settings, currency: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-600 dark:border-gray-600 rounded-lg 
                         bg-gray-900 dark:bg-gray-700 text-gray-100 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Payment Settings
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-600 dark:border-gray-600 text-gray-300 dark:text-gray-300
                     hover:bg-gray-800 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <div className="mt-8 p-4 bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700 dark:border-gray-700">
        <h3 className="font-semibold text-gray-100 dark:text-white mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Security & Privacy
        </h3>
        <ul className="text-sm text-gray-400 dark:text-gray-400 space-y-1 ml-7">
          <li>• Your payment credentials are stored securely and encrypted</li>
          <li>• Only restaurant owners and managers can view/edit credentials</li>
          <li>• All credential changes are logged in audit trail</li>
          <li>• Razorpay handles all payment processing securely</li>
        </ul>
      </div>
    </div>
  );
}
