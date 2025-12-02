/**
 * StaffForm Component
 * Form for creating and editing staff members
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@config/supabase';
import { signUp } from '@features/auth/services/authService';
import { ROLES, getRoleDisplayName } from '@shared/utils/permissions';
import { useRestaurant } from '@shared/hooks/useRestaurant';
import { logUserCreated, logUserUpdated } from '@features/staff/utils/activityLogger';
import toast from 'react-hot-toast';

const StaffForm = ({ staff, onSuccess, onCancel, allowedRoles }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: ROLES.WAITER,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { restaurantId, loading: restaurantLoading } = useRestaurant();

  useEffect(() => {
    if (staff) {
      setFormData({
        full_name: staff.full_name || '',
        email: staff.email || '',
        password: '', // Don't populate password for edit
        phone: staff.phone || '',
        role: staff.role || ROLES.WAITER,
        is_active: staff.is_active ?? true,
      });
    }
  }, [staff]);

  // Block form if restaurant context is missing or loading
  if (restaurantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary/30 border-t-primary"></div>
          <span className="text-muted-foreground font-medium">Loading restaurant context...</span>
        </div>
      </div>
    );
  }
  
  if (!restaurantId) {
    return (
      <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/30 rounded-xl p-6 text-center">
        <div className="inline-flex p-3 rounded-full bg-destructive/10 ring-1 ring-destructive/30 mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-bold text-destructive mb-2">Missing Restaurant Context</h2>
        <p className="text-foreground/80 mb-2">Cannot add staff because restaurant context is not set.</p>
        <p className="text-sm text-muted-foreground">Please log out and log in again as manager, or reload the page.</p>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password only required for new staff
    if (!staff && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (!staff && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      if (!restaurantId) {
        toast.error('Missing restaurant context');
        return;
      }
      
      // For new staff: Check max_users limit before creating
      if (!staff) {
        // Fetch restaurant's limits using RPC (this bypasses RLS issues)
        const { data: limits, error: limitsError } = await supabase
          .rpc('get_restaurant_limits');

        if (limitsError) {
          console.error('Failed to fetch restaurant limits:', limitsError);
        }

        // Check if staff limit is reached
        if (limits && limits.length > 0) {
          const { max_users, current_users } = limits[0];
          if (current_users >= max_users) {
            toast.error(`Staff limit reached! Your plan allows maximum ${max_users} staff members (currently ${current_users}). Please upgrade your subscription or contact SuperAdmin.`);
            setLoading(false);
            return;
          }
        }
      }
      
      if (staff) {
        // Edit existing staff member via SECURITY DEFINER RPC (bypasses users RLS safely)
        const { error: updateError } = await supabase.rpc('admin_update_staff', {
          target_id: staff.id,
          p_full_name: formData.full_name,
          p_phone: formData.phone,
          p_role: formData.role,
          p_is_active: formData.is_active,
        });
        if (updateError) throw updateError;

        // Log activity
        await logUserUpdated(staff.id, {
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
          is_active: formData.is_active,
        });

        toast.success('Staff member updated successfully');
      } else {
        // Create new staff member via Auth sign-up
        const { data: authData, error: authError } = await signUp(
          formData.email,
          formData.password,
          {
            full_name: formData.full_name,
            role: formData.role,
            restaurant_id: restaurantId,
            phone: formData.phone || null,
          }
        );

        if (authError) {
          // Handle specific error cases
          const errorMsg = authError.message?.toLowerCase() || '';
          if (errorMsg.includes('already') || errorMsg.includes('duplicate')) {
            throw new Error('This email is already registered. Please use a different email.');
          }
          if (errorMsg.includes('password')) {
            throw new Error('Password must be at least 6 characters long.');
          }
          throw new Error(authError.message || 'Failed to create user account');
        }

        if (!authData?.user?.id) {
          throw new Error('Failed to create user account - no user ID returned');
        }

        // Create or update profile row via SECURITY DEFINER RPC
        const { error: profileErr } = await supabase.rpc('admin_upsert_user_profile', {
          p_id: authData.user.id,
          p_email: formData.email,
          p_full_name: formData.full_name,
          p_role: formData.role,
          p_phone: formData.phone || null,
          p_restaurant_id: restaurantId,
        });
        
        if (profileErr) {
          // Better error messages for RPC failures
          const rpcErrorMsg = profileErr.message?.toLowerCase() || '';
          if (rpcErrorMsg.includes('not a staff user')) {
            throw new Error('You must be logged in as a manager to add staff');
          }
          if (rpcErrorMsg.includes('insufficient role')) {
            throw new Error('Only managers and admins can add staff members');
          }
          if (rpcErrorMsg.includes('cross-restaurant')) {
            throw new Error('Cannot add staff to a different restaurant');
          }
          throw new Error(profileErr.message || 'Failed to create user profile');
        }

        // Log activity
        await logUserCreated(authData.user.id, {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
        });

        toast.success('Staff member added successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving staff:', error);
      toast.error(error.message || 'Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  // Define all available role options
  const allRoleOptions = [
    { value: ROLES.ADMIN, label: getRoleDisplayName(ROLES.ADMIN), description: 'Full system access' },
    { value: ROLES.MANAGER, label: getRoleDisplayName(ROLES.MANAGER), description: 'Manage operations & staff' },
    { value: ROLES.CHEF, label: getRoleDisplayName(ROLES.CHEF), description: 'View & update orders' },
    { value: ROLES.WAITER, label: getRoleDisplayName(ROLES.WAITER), description: 'Take & serve orders' },
  ];

  // Filter roles if allowedRoles is specified
  const roleOptions = allowedRoles 
    ? allRoleOptions.filter(option => allowedRoles.includes(option.value))
    : allRoleOptions;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Full Name */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Full Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 bg-card border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth ${
            errors.full_name ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'
          }`}
          placeholder="John Doe"
        />
        {errors.full_name && (
          <p className="mt-1.5 text-sm text-destructive flex items-center gap-1">
            <span className="text-base">⚠</span> {errors.full_name}
          </p>
        )}
      </div>

      {/* Email and Phone - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Email <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!!staff}
            className={`w-full px-4 py-2.5 bg-card border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth ${
              errors.email ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'
            } ${staff ? 'bg-muted/50 cursor-not-allowed opacity-60' : ''}`}
            placeholder="hgewf"
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-destructive flex items-center gap-1">
              <span className="text-base">⚠</span> {errors.email}
            </p>
          )}
          {staff && (
            <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
              🔒 Email cannot be changed
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 bg-card border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth ${
              errors.phone ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'
            }`}
            placeholder="+1 234 567 8900"
          />
          {errors.phone && (
            <p className="mt-1.5 text-sm text-destructive flex items-center gap-1">
              <span className="text-base">⚠</span> {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Password - Only for new staff */}
      {!staff && (
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Password <span className="text-destructive">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 bg-card border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth ${
              errors.password ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'
            }`}
            placeholder="Minimum 6 characters"
          />
          {errors.password && (
            <p className="mt-1.5 text-sm text-destructive flex items-center gap-1">
              <span className="text-base">⚠</span> {errors.password}
            </p>
          )}
        </div>
      )}

      {/* Role - 2 Column Grid */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-3">
          Role <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roleOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-smooth group relative overflow-hidden ${
                formData.role === option.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/30 hover:bg-card/80'
              }`}
            >
              {formData.role === option.value && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
              )}
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={formData.role === option.value}
                onChange={handleChange}
                className="mt-0.5 h-5 w-5 text-primary focus:ring-2 focus:ring-primary/50 border-border cursor-pointer relative z-10"
              />
              <div className="ml-3 relative z-10">
                <div className={`font-semibold mb-0.5 transition-smooth ${
                  formData.role === option.value ? 'text-primary' : 'text-foreground group-hover:text-primary'
                }`}>
                  {option.label}
                </div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Active Status */}
      <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="mt-0.5 h-5 w-5 text-primary focus:ring-2 focus:ring-primary/50 border-border rounded cursor-pointer"
          />
          <div className="flex-1">
            <div className="font-semibold text-foreground group-hover:text-primary transition-smooth">
              Active (Can login to the system)
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {formData.is_active ? '✓ This user can access the system' : '⚠ This user cannot login'}
            </div>
          </div>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : staff ? 'Update Staff' : 'Add Staff'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-card hover:bg-muted text-foreground border border-border hover:border-border/80 px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default StaffForm;
