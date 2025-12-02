/**
 * Payment Gateway Configuration Component
 * Allows restaurant managers/superadmins to configure their preferred payment gateway
 */

import { useState, useEffect } from 'react';
import { supabase } from '@config/supabase';
import { 
  CreditCard, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  AlertTriangle,
  Shield,
  Banknote,
  Loader2,
  Info,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentGatewayConfig = ({ restaurantId, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    payment_provider: 'razorpay',
    payment_gateway_enabled: true,
    // Razorpay
    razorpay_key_id: '',
    razorpay_key_secret: '',
    razorpay_webhook_secret: '',
    // PhonePe
    phonepe_merchant_id: '',
    phonepe_salt_key: '',
    phonepe_salt_index: '1',
    // Paytm
    paytm_merchant_id: '',
    paytm_merchant_key: '',
  });
  const [showSecrets, setShowSecrets] = useState({});

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          payment_provider,
          payment_gateway_enabled,
          razorpay_key_id,
          razorpay_key_secret,
          razorpay_webhook_secret,
          phonepe_merchant_id,
          phonepe_salt_key,
          phonepe_salt_index,
          paytm_merchant_id,
          paytm_merchant_key
        `)
        .eq('id', restaurantId)
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          payment_provider: data.payment_provider || 'razorpay',
          payment_gateway_enabled: data.payment_gateway_enabled ?? true,
          razorpay_key_id: data.razorpay_key_id || '',
          razorpay_key_secret: data.razorpay_key_secret || '',
          razorpay_webhook_secret: data.razorpay_webhook_secret || '',
          phonepe_merchant_id: data.phonepe_merchant_id || '',
          phonepe_salt_key: data.phonepe_salt_key || '',
          phonepe_salt_index: data.phonepe_salt_index || '1',
          paytm_merchant_id: data.paytm_merchant_id || '',
          paytm_merchant_key: data.paytm_merchant_key || '',
        });
      }
    } catch (error) {
      console.error('Error loading payment config:', error);
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      loadConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required credentials for selected provider
      const provider = config.payment_provider;
      if (config.payment_gateway_enabled) {
        if (provider === 'razorpay' && !config.razorpay_key_id) {
          toast.error('Razorpay Key ID is required');
          return;
        }
        if (provider === 'phonepe' && !config.phonepe_merchant_id) {
          toast.error('PhonePe Merchant ID is required');
          return;
        }
        if (provider === 'paytm' && !config.paytm_merchant_id) {
          toast.error('Paytm Merchant ID is required');
          return;
        }
      }

      const { error } = await supabase
        .from('restaurants')
        .update({
          payment_provider: config.payment_provider,
          payment_gateway_enabled: config.payment_gateway_enabled,
          razorpay_key_id: config.razorpay_key_id || null,
          razorpay_key_secret: config.razorpay_key_secret || null,
          razorpay_webhook_secret: config.razorpay_webhook_secret || null,
          phonepe_merchant_id: config.phonepe_merchant_id || null,
          phonepe_salt_key: config.phonepe_salt_key || null,
          phonepe_salt_index: config.phonepe_salt_index || '1',
          paytm_merchant_id: config.paytm_merchant_id || null,
          paytm_merchant_key: config.paytm_merchant_key || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', restaurantId);

      if (error) throw error;

      toast.success('Payment settings saved successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Error saving payment config:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleSecretVisibility = (field) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Determine mode based on provider and keys
  const getMode = () => {
    if (!config.payment_gateway_enabled) return 'disabled';
    
    if (config.payment_provider === 'razorpay') {
      if (!config.razorpay_key_id) return 'not_configured';
      return config.razorpay_key_id.startsWith('rzp_live_') ? 'live' : 'test';
    }
    if (config.payment_provider === 'phonepe') {
      if (!config.phonepe_merchant_id) return 'not_configured';
      return 'configured';
    }
    if (config.payment_provider === 'paytm') {
      if (!config.paytm_merchant_id) return 'not_configured';
      return 'configured';
    }
    return 'not_configured';
  };

  const mode = getMode();

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-gray-400">Loading payment settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Payment Gateway</h1>
              <p className="text-orange-100 mt-1">Configure how your restaurant receives payments</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            mode === 'live' ? 'bg-green-500 text-white' :
            mode === 'test' ? 'bg-yellow-500 text-yellow-900' :
            mode === 'configured' ? 'bg-blue-500 text-white' :
            mode === 'disabled' ? 'bg-gray-500 text-white' :
            'bg-red-500/80 text-white'
          }`}>
            {mode === 'live' ? '🟢 Live Mode' :
             mode === 'test' ? '🟡 Test Mode' :
             mode === 'configured' ? '✓ Configured' :
             mode === 'disabled' ? 'Disabled' :
             'Not Configured'}
          </div>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${config.payment_gateway_enabled ? 'bg-green-500/20' : 'bg-gray-700'}`}>
              <Banknote className={`w-6 h-6 ${config.payment_gateway_enabled ? 'text-green-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Online Payments</h3>
              <p className="text-gray-400 text-sm">Accept payments via cards, UPI, wallets, and net banking</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.payment_gateway_enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, payment_gateway_enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-700 peer-focus:ring-4 peer-focus:ring-orange-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>
      </div>

      {config.payment_gateway_enabled && (
        <>
          {/* Gateway Selection */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-400" />
              Select Payment Gateway
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Razorpay */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, payment_provider: 'razorpay' }))}
                className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                  config.payment_provider === 'razorpay'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                }`}
              >
                {config.payment_provider === 'razorpay' && (
                  <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-blue-400" />
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    R
                  </div>
                  <span className="text-white font-semibold">Razorpay</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">India's leading payment gateway with popup checkout</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">UPI</span>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Cards</span>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Wallets</span>
                </div>
              </button>

              {/* PhonePe */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, payment_provider: 'phonepe' }))}
                className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                  config.payment_provider === 'phonepe'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                }`}
              >
                {config.payment_provider === 'phonepe' && (
                  <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-purple-400" />
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    P
                  </div>
                  <span className="text-white font-semibold">PhonePe</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">Popular UPI-based payments with redirect flow</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">UPI</span>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Cards</span>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Redirect</span>
                </div>
              </button>

              {/* Paytm */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, payment_provider: 'paytm' }))}
                className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                  config.payment_provider === 'paytm'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                }`}
              >
                {config.payment_provider === 'paytm' && (
                  <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-cyan-400" />
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    PT
                  </div>
                  <span className="text-white font-semibold">Paytm</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">Paytm wallet & payment gateway with redirect</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Wallet</span>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">UPI</span>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Redirect</span>
                </div>
              </button>
            </div>
          </div>

          {/* Razorpay Configuration */}
          {config.payment_provider === 'razorpay' && (
            <div className="bg-gray-900 rounded-xl border border-blue-800/50 overflow-hidden">
              <div className="bg-blue-900/30 px-6 py-4 border-b border-blue-800/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-100 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
                    Razorpay Configuration
                  </h3>
                  <a
                    href="https://dashboard.razorpay.com/app/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    Get API Keys <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Help Box */}
                <div className="flex items-start gap-3 p-4 bg-blue-950/40 rounded-lg border border-blue-800/30">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">How to get credentials:</p>
                    <ol className="list-decimal ml-4 space-y-1 text-blue-300/80">
                      <li>Login to <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">Razorpay Dashboard</a></li>
                      <li>Go to Settings → API Keys</li>
                      <li>Copy your Key ID and Key Secret</li>
                    </ol>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Key ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Key ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.razorpay_key_id}
                      onChange={(e) => setConfig(prev => ({ ...prev, razorpay_key_id: e.target.value }))}
                      placeholder="rzp_live_xxxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Starts with <code className="text-blue-400">rzp_test_</code> or <code className="text-green-400">rzp_live_</code>
                    </p>
                  </div>

                  {/* Key Secret */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Key Secret <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets.razorpay_key_secret ? 'text' : 'password'}
                        value={config.razorpay_key_secret}
                        onChange={(e) => setConfig(prev => ({ ...prev, razorpay_key_secret: e.target.value }))}
                        placeholder="Enter your secret key"
                        className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility('razorpay_key_secret')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showSecrets.razorpay_key_secret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Webhook Secret */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Webhook Secret <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets.razorpay_webhook_secret ? 'text' : 'password'}
                      value={config.razorpay_webhook_secret}
                      onChange={(e) => setConfig(prev => ({ ...prev, razorpay_webhook_secret: e.target.value }))}
                      placeholder="For webhook verification (recommended for production)"
                      className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility('razorpay_webhook_secret')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showSecrets.razorpay_webhook_secret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PhonePe Configuration */}
          {config.payment_provider === 'phonepe' && (
            <div className="bg-gray-900 rounded-xl border border-purple-800/50 overflow-hidden">
              <div className="bg-purple-900/30 px-6 py-4 border-b border-purple-800/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-purple-100 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                    PhonePe Configuration
                  </h3>
                  <a
                    href="https://www.phonepe.com/business-solutions/payment-gateway/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    Get Merchant Account <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Info Box */}
                <div className="flex items-start gap-3 p-4 bg-purple-950/40 rounded-lg border border-purple-800/30">
                  <AlertTriangle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-purple-200">
                    PhonePe uses <strong>redirect-based checkout</strong>. Customers will be redirected to PhonePe to complete payment, then returned to your site.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Merchant ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Merchant ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.phonepe_merchant_id}
                      onChange={(e) => setConfig(prev => ({ ...prev, phonepe_merchant_id: e.target.value }))}
                      placeholder="MERCHANTUAT"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Salt Key */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Salt Key <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets.phonepe_salt_key ? 'text' : 'password'}
                        value={config.phonepe_salt_key}
                        onChange={(e) => setConfig(prev => ({ ...prev, phonepe_salt_key: e.target.value }))}
                        placeholder="Enter your salt key"
                        className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility('phonepe_salt_key')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showSecrets.phonepe_salt_key ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Salt Index */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Salt Index
                    </label>
                    <input
                      type="text"
                      value={config.phonepe_salt_index}
                      onChange={(e) => setConfig(prev => ({ ...prev, phonepe_salt_index: e.target.value }))}
                      placeholder="1"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Usually "1" unless specified otherwise</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paytm Configuration */}
          {config.payment_provider === 'paytm' && (
            <div className="bg-gray-900 rounded-xl border border-cyan-800/50 overflow-hidden">
              <div className="bg-cyan-900/30 px-6 py-4 border-b border-cyan-800/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-cyan-100 flex items-center gap-2">
                    <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">PT</div>
                    Paytm Configuration
                  </h3>
                  <a
                    href="https://business.paytm.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    Get Merchant Account <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Info Box */}
                <div className="flex items-start gap-3 p-4 bg-cyan-950/40 rounded-lg border border-cyan-800/30">
                  <AlertTriangle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-cyan-200">
                    Paytm uses <strong>redirect-based checkout</strong>. Customers will be redirected to Paytm to complete payment, then returned to your site.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Merchant ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Merchant ID (MID) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.paytm_merchant_id}
                      onChange={(e) => setConfig(prev => ({ ...prev, paytm_merchant_id: e.target.value }))}
                      placeholder="YOUR_MERCHANT_ID"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>

                  {/* Merchant Key */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Merchant Key <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets.paytm_merchant_key ? 'text' : 'password'}
                        value={config.paytm_merchant_key}
                        onChange={(e) => setConfig(prev => ({ ...prev, paytm_merchant_key: e.target.value }))}
                        placeholder="Enter your merchant key"
                        className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecretVisibility('paytm_merchant_key')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showSecrets.paytm_merchant_key ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Security Notice */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-2">Security & Privacy</h3>
            <ul className="space-y-1.5 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Your credentials are stored securely and encrypted
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Only restaurant owners and managers can access
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                All changes are logged in audit trail
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save Payment Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentGatewayConfig;
