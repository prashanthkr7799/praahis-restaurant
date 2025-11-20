import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Lock, 
  Bell,
  Save,
  Upload,
  Camera,
  Check,
  Shield
} from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { getCurrentUser } from '@shared/utils/auth/auth';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const TABS = {
  RESTAURANT: 'restaurant',
  PROFILE: 'profile',
  SECURITY: 'security',
  NOTIFICATIONS: 'notifications',
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(TABS.RESTAURANT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Restaurant Info
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    logo_url: '',
  });

  // Profile Data
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  // Security Data
  const [securityData, setSecurityData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_new_orders: true,
    email_payment_received: true,
    email_daily_summary: false,
    email_weekly_report: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userData = await getCurrentUser();
      if (!userData?.profile) {
        throw new Error('User profile not found');
      }

      setCurrentUser(userData.profile);

      // Load restaurant data
      if (userData.profile.restaurant_id) {
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', userData.profile.restaurant_id)
          .single();

        if (restaurantError) throw restaurantError;

        setRestaurantData({
          name: restaurant.name || '',
          address: restaurant.address || '',
          phone: restaurant.phone || '',
          email: restaurant.email || '',
          logo_url: restaurant.logo_url || '',
        });
      }

      // Set profile data
      setProfileData({
        full_name: userData.profile.full_name || '',
        email: userData.profile.email || '',
        phone: userData.profile.phone || '',
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === TABS.RESTAURANT) {
        const { error } = await supabase
          .from('restaurants')
          .update(restaurantData)
          .eq('id', currentUser.restaurant_id);
        if (error) throw error;
      } else if (activeTab === TABS.PROFILE) {
        const { error } = await supabase
          .from('users')
          .update({
            full_name: profileData.full_name,
            phone: profileData.phone,
          })
          .eq('id', currentUser.id);
        if (error) throw error;
      } else if (activeTab === TABS.SECURITY) {
        // Password update logic would go here (requires Supabase Auth API)
        toast.success('Password update simulated');
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-white text-glow tracking-tight">Settings</h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="glass-button-primary"
        >
          {saving ? <LoadingSpinner size="sm" /> : <Save size={20} />}
          <span>Save Changes</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="glass-panel p-1 flex overflow-x-auto">
        {[
          { id: TABS.RESTAURANT, label: 'Restaurant', icon: Building2 },
          { id: TABS.PROFILE, label: 'Profile', icon: User },
          { id: TABS.SECURITY, label: 'Security', icon: Lock },
          { id: TABS.NOTIFICATIONS, label: 'Notifications', icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white/10 text-white shadow-lg' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="glass-panel p-6 md:p-8">
        {activeTab === TABS.RESTAURANT && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {restaurantData.logo_url ? (
                    <img src={restaurantData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={40} className="text-zinc-600" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Restaurant Logo</h3>
                <p className="text-sm text-zinc-500">Recommended size: 512x512px</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Restaurant Name</label>
                <input 
                  type="text" 
                  value={restaurantData.name}
                  onChange={(e) => setRestaurantData({...restaurantData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  placeholder="Enter restaurant name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Email Address</label>
                <input 
                  type="email" 
                  value={restaurantData.email}
                  onChange={(e) => setRestaurantData({...restaurantData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  placeholder="contact@restaurant.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Phone Number</label>
                <input 
                  type="tel" 
                  value={restaurantData.phone}
                  onChange={(e) => setRestaurantData({...restaurantData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Address</label>
                <textarea 
                  value={restaurantData.address}
                  onChange={(e) => setRestaurantData({...restaurantData, address: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all min-h-[100px]"
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === TABS.PROFILE && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Full Name</label>
                <input 
                  type="text" 
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Email</label>
                <input 
                  type="email" 
                  value={profileData.email}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Phone</label>
                <input 
                  type="tel" 
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === TABS.SECURITY && (
          <div className="space-y-8 animate-fade-in">
            <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Security Mode Active</h3>
                <p className="text-sm text-zinc-400">Your account is protected with industry standard encryption. Enable 2FA for extra security.</p>
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <h3 className="text-lg font-bold text-white">Change Password</h3>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Current Password</label>
                <input 
                  type="password" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">New Password</label>
                <input 
                  type="password" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Confirm Password</label>
                <input 
                  type="password" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === TABS.NOTIFICATIONS && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'email_new_orders', label: 'New Orders', desc: 'Get notified when a new order is placed' },
                { key: 'email_payment_received', label: 'Payments', desc: 'Get notified when a payment is successful' },
                { key: 'email_daily_summary', label: 'Daily Summary', desc: 'Receive a daily report of your sales' },
                { key: 'email_weekly_report', label: 'Weekly Report', desc: 'Weekly analysis of your performance' },
              ].map((item) => (
                <div 
                  key={item.key}
                  onClick={() => setNotificationSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    notificationSettings[item.key] 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-bold mb-1 ${notificationSettings[item.key] ? 'text-primary' : 'text-white'}`}>
                        {item.label}
                      </h4>
                      <p className="text-xs text-zinc-400">{item.desc}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      notificationSettings[item.key]
                        ? 'bg-primary border-primary text-white'
                        : 'border-zinc-600'
                    }`}>
                      {notificationSettings[item.key] && <Check size={14} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
