import React, { useState, useEffect } from 'react';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import toast from 'react-hot-toast';
import { Save, RefreshCw, Settings as SettingsIcon } from 'lucide-react';

/**
 * System Settings Component
 * Configure platform-wide settings
 */
const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Trial & Subscription Settings
    trial_grace_period_days: '0',
    send_expiry_warnings: 'true',
    warning_days_before_expiry: '[7, 3, 1]',
    auto_deactivate_expired: 'true',
    
    // Default Limits
    default_max_users: '10',
    default_max_tables: '20',
    default_max_menu_items: '100',
    
    // Plan Pricing
    plan_trial_price: '0',
    plan_basic_price: '999',
    plan_pro_price: '2999',
    plan_enterprise_price: '9999',
    
    // Platform Settings
    platform_name: 'Praahis',
    support_email: 'support@praahis.com',
    maintenance_mode: 'false'
  });

  const [originalSettings, setOriginalSettings] = useState({});

  useEffect(() => {
    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseOwner
        .from('platform_settings')
        .select('*');

      if (error) throw error;

      // Convert array to object
      const settingsObj = {};
      (data || []).forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });

      // Merge with defaults
      const mergedSettings = { ...settings, ...settingsObj };
      setSettings(mergedSettings);
      setOriginalSettings(mergedSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get changed settings
      const changedSettings = Object.entries(settings).filter(
        ([key, value]) => originalSettings[key] !== value
      );

      if (changedSettings.length === 0) {
        toast.success('No changes to save');
        return;
      }

      // Upsert each setting
      for (const [key, value] of changedSettings) {
        const { error } = await supabaseOwner
          .from('platform_settings')
          .upsert({
            key,
            value,
            category: getCategoryForKey(key)
          }, {
            onConflict: 'key'
          });

        if (error) throw error;
      }

      toast.success(`${changedSettings.length} setting(s) saved successfully`);
      setOriginalSettings(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    toast.info('Settings reset to last saved values');
  };

  const getCategoryForKey = (key) => {
    if (key.includes('trial') || key.includes('expiry') || key.includes('deactivate')) {
      return 'subscription';
    }
    if (key.includes('plan') || key.includes('price')) {
      return 'pricing';
    }
    if (key.includes('default') || key.includes('max')) {
      return 'limits';
    }
    return 'general';
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            System Settings
          </h1>
          <p className="text-gray-400 mt-1">Configure platform-wide settings and defaults</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {hasChanges && (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Trial & Subscription Settings */}
      <SettingsSection title="Trial & Subscription">
        <SettingField
          label="Trial Grace Period (days)"
          description="Days after trial expiry before deactivation"
          type="number"
          value={settings.trial_grace_period_days}
          onChange={(e) => handleChange('trial_grace_period_days', e.target.value)}
          min="0"
          max="30"
        />
        <SettingField
          label="Send Expiry Warnings"
          description="Send email warnings before subscription expires"
          type="toggle"
          value={settings.send_expiry_warnings === 'true'}
          onChange={(checked) => handleChange('send_expiry_warnings', checked ? 'true' : 'false')}
        />
        <SettingField
          label="Warning Days"
          description="Days before expiry to send warnings (e.g., [7, 3, 1])"
          type="text"
          value={settings.warning_days_before_expiry}
          onChange={(e) => handleChange('warning_days_before_expiry', e.target.value)}
          placeholder="[7, 3, 1]"
        />
        <SettingField
          label="Auto-Deactivate Expired"
          description="Automatically deactivate expired subscriptions"
          type="toggle"
          value={settings.auto_deactivate_expired === 'true'}
          onChange={(checked) => handleChange('auto_deactivate_expired', checked ? 'true' : 'false')}
        />
      </SettingsSection>

      {/* Default Resource Limits */}
      <SettingsSection title="Default Resource Limits">
        <SettingField
          label="Max Users"
          description="Default maximum users per restaurant"
          type="number"
          value={settings.default_max_users}
          onChange={(e) => handleChange('default_max_users', e.target.value)}
          min="1"
        />
        <SettingField
          label="Max Tables"
          description="Default maximum tables per restaurant"
          type="number"
          value={settings.default_max_tables}
          onChange={(e) => handleChange('default_max_tables', e.target.value)}
          min="1"
        />
        <SettingField
          label="Max Menu Items"
          description="Default maximum menu items per restaurant"
          type="number"
          value={settings.default_max_menu_items}
          onChange={(e) => handleChange('default_max_menu_items', e.target.value)}
          min="1"
        />
      </SettingsSection>

      {/* Plan Pricing */}
      <SettingsSection title="Subscription Plan Pricing">
        <SettingField
          label="Trial Plan (₹/month)"
          description="Price for trial plan (usually 0)"
          type="number"
          value={settings.plan_trial_price}
          onChange={(e) => handleChange('plan_trial_price', e.target.value)}
          min="0"
        />
        <SettingField
          label="Basic Plan (₹/month)"
          description="Price for Basic plan"
          type="number"
          value={settings.plan_basic_price}
          onChange={(e) => handleChange('plan_basic_price', e.target.value)}
          min="0"
        />
        <SettingField
          label="Pro Plan (₹/month)"
          description="Price for Pro plan"
          type="number"
          value={settings.plan_pro_price}
          onChange={(e) => handleChange('plan_pro_price', e.target.value)}
          min="0"
        />
        <SettingField
          label="Enterprise Plan (₹/month)"
          description="Price for Enterprise plan"
          type="number"
          value={settings.plan_enterprise_price}
          onChange={(e) => handleChange('plan_enterprise_price', e.target.value)}
          min="0"
        />
      </SettingsSection>

      {/* Platform Settings */}
      <SettingsSection title="Platform Configuration">
        <SettingField
          label="Platform Name"
          description="Name of the platform"
          type="text"
          value={settings.platform_name}
          onChange={(e) => handleChange('platform_name', e.target.value)}
        />
        <SettingField
          label="Support Email"
          description="Email for customer support"
          type="email"
          value={settings.support_email}
          onChange={(e) => handleChange('support_email', e.target.value)}
        />
        <SettingField
          label="Maintenance Mode"
          description="Enable maintenance mode (disable all restaurant access)"
          type="toggle"
          value={settings.maintenance_mode === 'true'}
          onChange={(checked) => handleChange('maintenance_mode', checked ? 'true' : 'false')}
        />
      </SettingsSection>

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <div className="sticky bottom-4 bg-gray-900 border border-orange-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">You have unsaved changes</p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const SettingsSection = ({ title, children }) => (
  <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-sm overflow-hidden">
    <div className="bg-gray-800 px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="p-6 space-y-6">
      {children}
    </div>
  </div>
);

const SettingField = ({ label, description, type, value, onChange, ...props }) => {
  if (type === 'toggle') {
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-900">{label}</label>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
            value ? 'bg-orange-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-gray-900 transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <label className="block text-sm font-medium text-gray-100 mb-1">{label}</label>
      <p className="text-sm text-gray-400 mb-2">{description}</p>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full max-w-md px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
        {...props}
      />
    </div>
  );
};

export default SystemSettings;
