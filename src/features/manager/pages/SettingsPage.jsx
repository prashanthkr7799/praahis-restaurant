import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  User as UserIcon, 
  Lock, 
  Bell,
  Save,
  Upload,
  Camera,
  Check,
  Shield,
  LayoutGrid,
  Users
} from 'lucide-react';
import { supabase } from '@config/supabase';
import { getCurrentUser } from '@features/auth/services/authService';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import PaymentSettingsPage from '@features/manager/pages/PaymentSettingsPage.jsx';

const TABS = {
  RESTAURANT: 'restaurant',
  PROFILE: 'profile',
  SECURITY: 'security',
  NOTIFICATIONS: 'notifications',
  PAYMENT: 'payment',
  MANAGEMENT: 'management',
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

  // Resource Management
  // resourceLoading reserved for future skeleton states (not used currently)
  // const [resourceLoading, setResourceLoading] = useState(true);
  const [resourceSaving, setResourceSaving] = useState(false);
  const [maxTables, setMaxTables] = useState(0);
  const [maxUsers, setMaxUsers] = useState(0);
  const [origMaxTables, setOrigMaxTables] = useState(0);
  const [origMaxUsers, setOrigMaxUsers] = useState(0);
  const [counts, setCounts] = useState({ tables: 0, users: 0 });
  const [editingTables, setEditingTables] = useState(false);
  const [editingStaff, setEditingStaff] = useState(false);

  // Profile Data
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  // Security Data
  // For future password change wiring; currently simulated only
  // const [securityData, setSecurityData] = useState({
  //   current_password: '',
  //   new_password: '',
  //   confirm_password: '',
  // });

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
          .select('*, max_tables, max_users')
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

        // Initialize resource management state
        setMaxTables(Number(restaurant.max_tables || 0));
        setOrigMaxTables(Number(restaurant.max_tables || 0));
        setMaxUsers(Number(restaurant.max_users || 0));
        setOrigMaxUsers(Number(restaurant.max_users || 0));

        // Fetch current usage counts
        const [tablesCount, usersCount] = await Promise.all([
          supabase.from('tables').select('id', { count: 'exact', head: true }).eq('restaurant_id', userData.profile.restaurant_id),
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('restaurant_id', userData.profile.restaurant_id).in('role', ['chef','waiter','staff'])
        ]);
        setCounts({ tables: tablesCount.count || 0, users: usersCount.count || 0 });
  // setResourceLoading(false);
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

  const saveTablesCap = async () => {
    try {
      setResourceSaving(true);
      if (maxTables < counts.tables) {
        toast.error(`Cannot set tables below current usage (${counts.tables})`);
        setResourceSaving(false);
        return;
      }
      // If increasing beyond original cap, route user to Subscription page for upgrade/payment
      if (maxTables > origMaxTables) {
        toast('To increase tables, complete upgrade in Subscription');
        // navigate to subscription
        window.location.href = '/manager/subscription';
        return;
      }
      const { error } = await supabase
        .from('restaurants')
        .update({ max_tables: maxTables, updated_at: new Date().toISOString() })
        .eq('id', currentUser.restaurant_id);
      if (error) throw error;
      toast.success('Table cap updated');
      setOrigMaxTables(maxTables);
      setEditingTables(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update table cap');
    } finally {
      setResourceSaving(false);
    }
  };

  const saveStaffCap = async () => {
    try {
      setResourceSaving(true);
      if (maxUsers < counts.users) {
        toast.error(`Cannot set staff cap below current usage (${counts.users})`);
        setResourceSaving(false);
        return;
      }
      const { error } = await supabase
        .from('restaurants')
        .update({ max_users: maxUsers, updated_at: new Date().toISOString() })
        .eq('id', currentUser.restaurant_id);
      if (error) throw error;
      toast.success('Staff cap updated');
      setOrigMaxUsers(maxUsers);
      setEditingStaff(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update staff cap');
    } finally {
      setResourceSaving(false);
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
          { id: TABS.PROFILE, label: 'Profile', icon: UserIcon },
          { id: TABS.PAYMENT, label: 'Payment', icon: Shield },
          { id: TABS.MANAGEMENT, label: 'Management', icon: LayoutGrid },
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
        {activeTab === TABS.PAYMENT && (
          <div className="animate-fade-in">
            {/* Embed Payment Settings directly */}
            <PaymentSettingsPage />
          </div>
        )}

        {activeTab === TABS.MANAGEMENT && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Links to Manager views */}
            <div className="flex items-center gap-3">
              <Link
                to="/manager?tab=tables"
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
              >
                Go to Tables
              </Link>
              <Link
                to="/manager?tab=staff"
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
              >
                Go to Staff
              </Link>
            </div>
            {/* Tables Cap */}
            <div className={`p-6 rounded-xl border ${editingTables ? 'border-orange-200 bg-orange-50' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-orange-500" />
                  <h3 className="text-white font-bold">Tables Cap</h3>
                </div>
                {!editingTables ? (
                  <button onClick={() => setEditingTables(true)} className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-sm font-medium">Edit</button>
                ) : (
                  <button onClick={() => { setEditingTables(false); setMaxTables(origMaxTables); }} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium">Cancel</button>
                )}
              </div>
              <div className="text-sm text-zinc-400 mb-3">Current usage: {counts.tables}</div>
              {editingTables ? (
                <div className="flex items-center gap-3">
                  <button onClick={() => setMaxTables(v => Math.max(counts.tables, (v||0)-1))} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200">-</button>
                  <div className="text-2xl font-bold text-orange-600 w-16 text-center">{maxTables}</div>
                  <button onClick={() => setMaxTables(v => Math.min(100, (v||0)+1))} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200">+</button>
                  <div className="ml-auto">
                    <button disabled={resourceSaving} onClick={saveTablesCap} className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold disabled:opacity-50">{resourceSaving ? 'Saving...' : 'Save'}</button>
                  </div>
                </div>
              ) : (
                <div className="text-xl font-bold text-white">{maxTables}</div>
              )}
              <div className="mt-2 text-xs text-zinc-500">Upgrades require payment—use Subscription to increase tables.</div>
            </div>

            {/* Staff Cap */}
            <div className={`p-6 rounded-xl border ${editingStaff ? 'border-emerald-200 bg-emerald-50' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-white font-bold">Staff Cap</h3>
                </div>
                {!editingStaff ? (
                  <button onClick={() => setEditingStaff(true)} className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium">Edit</button>
                ) : (
                  <button onClick={() => { setEditingStaff(false); setMaxUsers(origMaxUsers); }} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium">Cancel</button>
                )}
              </div>
              <div className="text-sm text-zinc-400 mb-3">Current usage: {counts.users}</div>
              {editingStaff ? (
                <div className="flex items-center gap-3">
                  <button onClick={() => setMaxUsers(v => Math.max(counts.users, (v||0)-1))} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200">-</button>
                  <div className="text-2xl font-bold text-emerald-600 w-16 text-center">{maxUsers}</div>
                  <button onClick={() => setMaxUsers(v => Math.min(500, (v||0)+1))} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200">+</button>
                  <div className="ml-auto">
                    <button disabled={resourceSaving} onClick={saveStaffCap} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50">{resourceSaving ? 'Saving...' : 'Save'}</button>
                  </div>
                </div>
              ) : (
                <div className="text-xl font-bold text-white">{maxUsers}</div>
              )}
              <div className="mt-2 text-xs text-zinc-500">No extra cost. This cap is for your internal control.</div>
            </div>
          </div>
        )}

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
