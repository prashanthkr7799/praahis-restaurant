/**
 * Payment Gateway Configuration Component
 * Allows restaurant managers/superadmins to configure their preferred payment gateway
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/utils/api/supabaseClient';
import { PAYMENT_PROVIDERS, GATEWAY_INFO } from '@/domains/billing/utils/paymentGateway';
import { CreditCard, CheckCircle, Eye, EyeOff, ExternalLink, AlertTriangle } from 'lucide-react';
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

  const renderSecretInput = (field, label, placeholder) => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={showSecrets[field] ? 'text' : 'password'}
          value={config[field]}
          onChange={(e) => setConfig(prev => ({ ...prev, [field]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <button
          type="button"
          onClick={() => toggleSecretVisibility(field)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showSecrets[field] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6" />
          <div>
            <h2 className="text-lg font-semibold">Payment Gateway Settings</h2>
            <p className="text-orange-100 text-sm">Configure how you receive payments</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium">Online Payments</h3>
            <p className="text-sm text-gray-500">Accept card, UPI, and wallet payments</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.payment_gateway_enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, payment_gateway_enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {config.payment_gateway_enabled && (
          <>
            {/* Gateway Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Payment Gateway
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(GATEWAY_INFO).map(([provider, info]) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, payment_provider: provider }))}
                    className={`relative p-4 border-2 rounded-xl transition-all ${
                      config.payment_provider === provider
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {config.payment_provider === provider && (
                      <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-orange-500" />
                    )}
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">{info.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{info.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {info.features.slice(0, 3).map(feature => (
                          <span key={feature} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Razorpay Configuration */}
            {config.payment_provider === 'razorpay' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-blue-900">Razorpay Configuration</h3>
                  <a
                    href="https://dashboard.razorpay.com/app/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Get API Keys <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key ID</label>
                    <input
                      type="text"
                      value={config.razorpay_key_id}
                      onChange={(e) => setConfig(prev => ({ ...prev, razorpay_key_id: e.target.value }))}
                      placeholder="rzp_live_xxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {renderSecretInput('razorpay_key_secret', 'Key Secret', 'Enter your Razorpay key secret')}
                </div>
              </div>
            )}

            {/* PhonePe Configuration */}
            {config.payment_provider === 'phonepe' && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-purple-900">PhonePe Configuration</h3>
                  <a
                    href="https://www.phonepe.com/business-solutions/payment-gateway/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    Get Merchant Account <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
                    <input
                      type="text"
                      value={config.phonepe_merchant_id}
                      onChange={(e) => setConfig(prev => ({ ...prev, phonepe_merchant_id: e.target.value }))}
                      placeholder="MERCHANTUAT"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {renderSecretInput('phonepe_salt_key', 'Salt Key', 'Enter your PhonePe salt key')}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salt Index</label>
                    <input
                      type="text"
                      value={config.phonepe_salt_index}
                      onChange={(e) => setConfig(prev => ({ ...prev, phonepe_salt_index: e.target.value }))}
                      placeholder="1"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-purple-700 bg-purple-100 p-3 rounded-lg">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>PhonePe uses redirect-based checkout. Customers will be redirected to PhonePe to complete payment.</p>
                </div>
              </div>
            )}

            {/* Paytm Configuration */}
            {config.payment_provider === 'paytm' && (
              <div className="space-y-4 p-4 bg-cyan-50 rounded-lg border border-cyan-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-cyan-900">Paytm Configuration</h3>
                  <a
                    href="https://business.paytm.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                  >
                    Get Merchant Account <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID (MID)</label>
                    <input
                      type="text"
                      value={config.paytm_merchant_id}
                      onChange={(e) => setConfig(prev => ({ ...prev, paytm_merchant_id: e.target.value }))}
                      placeholder="YOUR_MERCHANT_ID"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  {renderSecretInput('paytm_merchant_key', 'Merchant Key', 'Enter your Paytm merchant key')}
                </div>
                <div className="flex items-start gap-2 text-sm text-cyan-700 bg-cyan-100 p-3 rounded-lg">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>Paytm uses redirect-based checkout. Customers will be redirected to Paytm to complete payment.</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayConfig;
