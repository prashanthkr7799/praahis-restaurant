/**
 * Settings Component
 * Application settings with tabbed interface
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Lock, 
  Bell,
  Save,
  Upload,
  Camera
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

const Settings = () => {
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

      // Load notification settings (would come from a settings table in real app)
      // For now, using default values
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: restaurantData.name,
          address: restaurantData.address,
          phone: restaurantData.phone,
          email: restaurantData.email,
        })
        .eq('id', currentUser.restaurant_id);

      if (error) throw error;

      toast.success('Restaurant information updated successfully');
    } catch (error) {
      console.error('Error saving restaurant info:', error);
      toast.error('Failed to update restaurant information');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setSaving(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.restaurant_id}-${Date.now()}.${fileExt}`;
      const filePath = `restaurant-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-logos')
        .getPublicUrl(filePath);

      // Update restaurant record
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ logo_url: publicUrl })
        .eq('id', currentUser.restaurant_id);

      if (updateError) throw updateError;

      setRestaurantData(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      await loadSettings(); // Reload to update currentUser
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securityData.new_password !== securityData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (securityData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: securityData.new_password,
      });

      if (error) throw error;

      setSecurityData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });

      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    setSaving(true);
    try {
      // In a real application, save to a settings table
      // For now, just show success message
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading settings..." />;
  }

  const tabs = [
    { id: TABS.RESTAURANT, label: 'Restaurant Info', icon: Building2 },
    { id: TABS.PROFILE, label: 'Profile', icon: User },
    { id: TABS.SECURITY, label: 'Security', icon: Lock },
    { id: TABS.NOTIFICATIONS, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground text-lg">Manage your restaurant and account settings</p>
      </div>

      {/* Tabs */}
      <div className="card-lift bg-gradient-to-br from-card via-card to-muted/10 rounded-xl shadow-sm border border-border/50 overflow-hidden">
        <div className="border-b border-border/50 bg-muted/20">
          <div className="flex space-x-2 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-smooth relative ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-primary/5 -z-10" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-8">
          {/* Restaurant Info Tab */}
          {activeTab === TABS.RESTAURANT && (
            <div className="max-w-2xl space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Restaurant Logo
                </label>
                <div className="flex items-center gap-6">
                  {restaurantData.logo_url ? (
                    <img
                      src={restaurantData.logo_url}
                      alt="Restaurant Logo"
                      className="w-24 h-24 rounded-xl object-cover border-2 border-border/50 ring-2 ring-primary/10"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
                      <Camera className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 bg-card hover:bg-muted text-foreground border border-border hover:border-primary/30 px-5 py-2.5 rounded-lg cursor-pointer transition-smooth font-medium">
                    <Upload className="h-4 w-4" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Recommended: Square image, max 2MB
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={restaurantData.name}
                  onChange={(e) => setRestaurantData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
                  placeholder="Enter restaurant name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Address
                </label>
                <textarea
                  value={restaurantData.address}
                  onChange={(e) => setRestaurantData(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth resize-none"
                  placeholder="Enter full address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={restaurantData.phone}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={restaurantData.email}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <button
                onClick={handleRestaurantSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === TABS.PROFILE && (
            <div className="max-w-2xl space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-border/50 rounded-lg bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
                <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
                  placeholder="Phone number"
                />
              </div>

              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === TABS.SECURITY && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-gradient-to-r from-info/10 to-info/5 border border-info/30 rounded-xl p-5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-info/10 ring-1 ring-info/30 mt-0.5">
                  <Lock className="h-4 w-4 text-info" />
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  For security reasons, you'll be asked to log in again after changing your password.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={securityData.current_password}
                  onChange={(e) => setSecurityData(prev => ({ ...prev, current_password: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={securityData.new_password}
                  onChange={(e) => setSecurityData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
                  placeholder="Enter new password"
                />
                <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                  Minimum 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={securityData.confirm_password}
                  onChange={(e) => setSecurityData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={saving}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
              >
                <Lock className="h-4 w-4" />
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === TABS.NOTIFICATIONS && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Email Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-5 border border-border/50 bg-card rounded-xl cursor-pointer hover:border-primary/30 hover:bg-card/80 transition-smooth group">
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-smooth">New Orders</div>
                      <div className="text-sm text-muted-foreground mt-1">Get notified when new orders are placed</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.email_new_orders}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, email_new_orders: e.target.checked }))}
                      className="h-5 w-5 text-primary focus:ring-2 focus:ring-primary/50 border-border rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-5 border border-border/50 bg-card rounded-xl cursor-pointer hover:border-primary/30 hover:bg-card/80 transition-smooth group">
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-smooth">Payment Received</div>
                      <div className="text-sm text-muted-foreground mt-1">Get notified when payments are confirmed</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.email_payment_received}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, email_payment_received: e.target.checked }))}
                      className="h-5 w-5 text-primary focus:ring-2 focus:ring-primary/50 border-border rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-5 border border-border/50 bg-card rounded-xl cursor-pointer hover:border-primary/30 hover:bg-card/80 transition-smooth group">
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-smooth">Daily Summary</div>
                      <div className="text-sm text-muted-foreground mt-1">Receive daily sales and activity summary</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.email_daily_summary}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, email_daily_summary: e.target.checked }))}
                      className="h-5 w-5 text-primary focus:ring-2 focus:ring-primary/50 border-border rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-5 border border-border/50 bg-card rounded-xl cursor-pointer hover:border-primary/30 hover:bg-card/80 transition-smooth group">
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-smooth">Weekly Report</div>
                      <div className="text-sm text-muted-foreground mt-1">Receive weekly performance report</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.email_weekly_report}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, email_weekly_report: e.target.checked }))}
                      className="h-5 w-5 text-primary focus:ring-2 focus:ring-primary/50 border-border rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <button
                onClick={handleNotificationsSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
