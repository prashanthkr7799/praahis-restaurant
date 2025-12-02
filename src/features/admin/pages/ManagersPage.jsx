import React, { useState, useEffect } from 'react';
import { supabaseOwner } from '@shared/services/api/ownerApi';
import toast from 'react-hot-toast';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Power, 
  Key,
  Building2,
  Mail,
  Phone,
  Filter,
  RefreshCw,
  Users,
  CheckCircle,
  XCircle,
  Shield,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Activity,
  Calendar,
  X,
} from 'lucide-react';

// Glass Card Component
const GlassCard = ({ children, className = '', onClick, hover = true }) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden
      bg-slate-800/50 backdrop-blur-xl
      border border-white/10 rounded-2xl
      ${hover ? 'hover:border-white/20 hover:bg-slate-800/60 transition-all duration-300' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

const ManagersList = () => {
  const [managers, setManagers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    restaurant_id: '',
    role: 'manager',
    is_active: true,
    password: '', // Only for new managers
  });

  useEffect(() => {
    fetchManagers();
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabaseOwner
        .from('restaurants')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    }
  };

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseOwner
        .from('users')
        .select(`
          id,
          email,
          name,
          full_name,
          phone,
          role,
          is_active,
          restaurant_id,
          created_at,
          restaurants (
            id,
            name,
            slug
          )
        `)
        .in('role', ['manager', 'admin'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map data to ensure name exists (fallback to full_name)
      const mappedData = (data || []).map(user => ({
        ...user,
        name: user.name || user.full_name || 'Unknown'
      }));
      
      setManagers(mappedData);
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('Failed to load managers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddManager = async (e) => {
    e.preventDefault();
    
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!formData.restaurant_id) {
      toast.error('Please select a restaurant');
      return;
    }

    try {
      // First check if email already exists in users table
      const { data: existingUsers, error: checkError } = await supabaseOwner
        .from('users')
        .select('id, email')
        .eq('email', formData.email)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      // If user already exists in database, just update them
      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        const { error: updateError } = await supabaseOwner
          .from('users')
          .update({
            name: formData.name,
            full_name: formData.name,
            phone: formData.phone || null,
            restaurant_id: formData.restaurant_id,
            role: formData.role,
            is_active: formData.is_active,
          })
          .eq('id', existingUser.id);

        if (updateError) throw updateError;

        toast.success('Manager updated successfully');
        setShowAddModal(false);
        resetForm();
        fetchManagers();
        return;
      }

      // Otherwise, create new auth user using signUp (will be auto-confirmed by database trigger)
      const { data: authData, error: authError } = await supabaseOwner.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name
          }
        }
      });

      if (authError) throw authError;
      
      if (!authData?.user?.id) {
        throw new Error('Failed to create auth user - no user ID returned');
      }

      console.log('Auth user created with ID:', authData.user.id);

      // Use RPC function to create user profile (bypasses RLS issues)
      const { data: insertedUser, error: userError } = await supabaseOwner
        .rpc('owner_create_manager', {
          p_id: authData.user.id,
          p_email: formData.email,
          p_full_name: formData.name,
          p_phone: formData.phone || null,
          p_restaurant_id: formData.restaurant_id,
          p_role: formData.role,
          p_is_active: formData.is_active,
        });

      if (userError) {
        console.error('Failed to create manager profile:', userError);
        // If RPC doesn't exist, fall back to direct insert
        if (userError.message?.includes('function') || userError.code === '42883') {
          console.log('RPC not found, trying direct insert...');
          const { error: directError } = await supabaseOwner
            .from('users')
            .insert({
              id: authData.user.id,
              name: formData.name,
              full_name: formData.name,
              email: formData.email,
              phone: formData.phone || null,
              restaurant_id: formData.restaurant_id,
              role: formData.role,
              is_active: formData.is_active,
            });
          
          if (directError) {
            throw new Error(`Failed to create manager profile: ${directError.message}`);
          }
        } else {
          throw new Error(`Failed to create manager profile: ${userError.message}`);
        }
      }

      console.log('Manager profile created:', insertedUser);

      toast.success('Manager added successfully');
      setShowAddModal(false);
      resetForm();
      fetchManagers();
    } catch (error) {
      console.error('Error adding manager:', error);
      toast.error(error.message || 'Failed to add manager');
    }
  };

  const handleUpdateManager = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabaseOwner
        .from('users')
        .update({
          name: formData.name,
          full_name: formData.name, // Keep both in sync
          email: formData.email,
          phone: formData.phone || null,
          restaurant_id: formData.restaurant_id,
          role: formData.role,
          is_active: formData.is_active,
        })
        .eq('id', selectedManager.id);

      if (error) throw error;

      toast.success('Manager updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchManagers();
    } catch (error) {
      console.error('Error updating manager:', error);
      toast.error(error.message || 'Failed to update manager');
    }
  };

  const handleDeleteManager = async (managerId, managerName) => {
    if (!confirm(`Are you sure you want to delete manager "${managerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Try to delete from auth.users using admin API
      // This may fail with 403 if the user doesn't have admin permissions
      try {
        const { error: authError } = await supabaseOwner.auth.admin.deleteUser(managerId);
        if (authError && authError.status !== 403) {
          // Only log non-403 errors
          console.error('Auth deletion note:', authError.message);
        }
      } catch {
        // Silently continue - this might fail with 403 Forbidden if not an admin
      }

      // Delete from public.users (this is the important one)
      const { error: dbError } = await supabaseOwner
        .from('users')
        .delete()
        .eq('id', managerId);

      if (dbError) throw dbError;

      toast.success('Manager deleted successfully');
      fetchManagers();
    } catch (error) {
      console.error('Error deleting manager:', error);
      toast.error(error.message || 'Failed to delete manager');
    }
  };

  const handleToggleStatus = async (managerId, currentStatus) => {
    try {
      const { error } = await supabaseOwner
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', managerId);

      if (error) throw error;

      toast.success(`Manager ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchManagers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async (managerId, managerEmail) => {
    if (!confirm(`Send password reset email to ${managerEmail}?`)) return;

    try {
      const { error } = await supabaseOwner.auth.resetPasswordForEmail(managerEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${managerEmail}`);
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error(error.message || 'Failed to send password reset email');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      restaurant_id: '',
      role: 'manager',
      is_active: true,
      password: '',
    });
    setSelectedManager(null);
  };

  const openEditModal = (manager) => {
    setSelectedManager(manager);
    setFormData({
      name: manager.name || '',
      email: manager.email || '',
      phone: manager.phone || '',
      restaurant_id: manager.restaurant_id || '',
      role: manager.role || 'manager',
      is_active: manager.is_active ?? true,
      password: '', // Never pre-fill password
    });
    setShowEditModal(true);
  };

  // Filter managers
  const filteredManagers = managers.filter(manager => {
    const matchesSearch = 
      manager.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.phone?.includes(searchTerm);
    
    const matchesRestaurant = 
      restaurantFilter === 'all' || 
      manager.restaurant_id === restaurantFilter;
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && manager.is_active) ||
      (statusFilter === 'inactive' && !manager.is_active);
    
    return matchesSearch && matchesRestaurant && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredManagers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedManagers = filteredManagers.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 animate-pulse" />
            <div className="absolute inset-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 animate-ping opacity-25" />
          </div>
          <p className="text-gray-400">Loading managers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Managers</h1>
          <p className="text-gray-400">
            Manage restaurant managers and admins across {restaurants.length} locations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setRefreshing(true); fetchManagers(); }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl text-white font-medium shadow-lg shadow-emerald-500/25 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Add Manager</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Managers', value: managers.length, icon: Users, color: 'emerald' },
          { label: 'Active', value: managers.filter(m => m.is_active).length, icon: CheckCircle, color: 'cyan' },
          { label: 'Inactive', value: managers.filter(m => !m.is_active).length, icon: XCircle, color: 'rose' },
          { label: 'Restaurants', value: restaurants.length, icon: Building2, color: 'purple' },
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <GlassCard key={stat.label} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${
                  stat.color === 'emerald' ? 'from-emerald-500/20 to-cyan-500/20' :
                  stat.color === 'cyan' ? 'from-cyan-500/20 to-blue-500/20' :
                  stat.color === 'rose' ? 'from-rose-500/20 to-pink-500/20' :
                  'from-purple-500/20 to-pink-500/20'
                }`}>
                  <StatIcon className={`w-5 h-5 ${
                    stat.color === 'emerald' ? 'text-emerald-400' :
                    stat.color === 'cyan' ? 'text-cyan-400' :
                    stat.color === 'rose' ? 'text-rose-400' :
                    'text-purple-400'
                  }`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </GlassCard>
          );
        })}
      </div>

      {/* Filters */}
      <GlassCard className="p-4" hover={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Restaurant Filter */}
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none cursor-pointer transition-all"
            >
              <option value="all" className="bg-slate-800">All Restaurants</option>
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id} className="bg-slate-800">
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 appearance-none cursor-pointer transition-all"
            >
              <option value="all" className="bg-slate-800">All Status</option>
              <option value="active" className="bg-slate-800">Active Only</option>
              <option value="inactive" className="bg-slate-800">Inactive Only</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Managers Table */}
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Restaurant</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedManagers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 rounded-2xl bg-white/5 mb-4">
                        <Users className="w-8 h-8 text-gray-600" />
                      </div>
                      <p className="text-gray-400 font-medium">No managers found</p>
                      <p className="text-sm text-gray-600 mt-1">Try adjusting your filters or add a new manager</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedManagers.map((manager) => (
                  <tr key={manager.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
                          <span className="text-sm font-bold text-emerald-400">
                            {manager.name?.charAt(0)?.toUpperCase() || 'M'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{manager.name}</p>
                          <p className="text-xs text-gray-500">
                            Added {new Date(manager.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Mail className="w-3 h-3" />
                          {manager.email}
                        </div>
                        {manager.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {manager.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-white">
                          {manager.restaurants?.name || 'Not Assigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${
                        manager.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {manager.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${
                        manager.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {manager.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {manager.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(manager)}
                          className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(manager.id, manager.is_active)}
                          className="p-2 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title={manager.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(manager.id, manager.email)}
                          className="p-2 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteManager(manager.id, manager.name)}
                          className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing <span className="text-white font-medium">{startIndex + 1}</span> to{' '}
                <span className="text-white font-medium">{Math.min(startIndex + itemsPerPage, filteredManagers.length)}</span> of{' '}
                <span className="text-white font-medium">{filteredManagers.length}</span> managers
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Add Manager Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 dark:bg-card rounded-lg max-w-md w-full p-6 border border-gray-700 dark:border-border">
            <h2 className="text-2xl font-bold text-gray-100 dark:text-foreground mb-4">
              Add New Manager
            </h2>
            <form onSubmit={handleAddManager} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-foreground mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-foreground mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-foreground mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-foreground mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-foreground mb-1">
                  Restaurant *
                </label>
                <select
                  required
                  value={formData.restaurant_id}
                  onChange={(e) => setFormData({...formData, restaurant_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Restaurant</option>
                  {restaurants.map(restaurant => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-foreground mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
                >
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded border-gray-600 dark:border-border text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-100 dark:text-foreground">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-600 dark:border-border rounded-lg text-gray-100 dark:text-foreground hover:bg-gray-800 dark:hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Add Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Manager Modal */}
      {showEditModal && selectedManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 dark:bg-card rounded-lg max-w-md w-full p-6 border border-gray-700 dark:border-border">
            <h2 className="text-2xl font-bold text-gray-100 dark:text-foreground mb-4">
              Edit Manager
            </h2>
            <form onSubmit={handleUpdateManager} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-foreground mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-foreground mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-foreground mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-foreground mb-1">
                  Restaurant *
                </label>
                <select
                  required
                  value={formData.restaurant_id}
                  onChange={(e) => setFormData({...formData, restaurant_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Restaurant</option>
                  {restaurants.map(restaurant => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100 dark:text-foreground mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
                >
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded border-gray-600 dark:border-border text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="edit_is_active" className="text-sm text-gray-100 dark:text-foreground">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-600 dark:border-border rounded-lg text-gray-100 dark:text-foreground hover:bg-gray-800 dark:hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Update Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagersList;
