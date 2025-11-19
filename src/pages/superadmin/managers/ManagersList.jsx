import React, { useState, useEffect } from 'react';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
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
  Filter
} from 'lucide-react';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';

const ManagersList = () => {
  const [managers, setManagers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
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
    }
  };

  const handleAddManager = async (e) => {
    e.preventDefault();
    
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      // First check if email already exists in users table
      const { data: existingUser, error: checkError } = await supabaseOwner
        .from('users')
        .select('id, email')
        .eq('email', formData.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // If user already exists in database, just update them
      if (existingUser) {
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

      // Otherwise, create new auth user (will be auto-confirmed by database trigger)
      const { data: authData, error: authError } = await supabaseOwner.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name
          },
          emailRedirectTo: undefined // Prevent confirmation email
        }
      });

      if (authError) throw authError;

      // Then create user record in public.users with the new auth user ID
      const { error: userError } = await supabaseOwner
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

      if (userError) throw userError;

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
        console.log('Note: Could not delete from auth.users (may not have admin permissions)');
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
    const newPassword = prompt(`Enter new password for ${managerEmail} (min 6 characters):`);
    
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabaseOwner.auth.admin.updateUserById(
        managerId,
        { password: newPassword }
      );

      if (error) throw error;

      toast.success('Password reset successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
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
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 dark:text-foreground">
            Managers Management
          </h1>
          <p className="text-gray-400 dark:text-muted-foreground mt-1">
            Manage restaurant managers and admins across all locations
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={20} />
          Add Manager
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 dark:bg-card rounded-lg p-4 border border-gray-700 dark:border-border">
          <div className="text-sm text-gray-400 dark:text-muted-foreground">Total Managers</div>
          <div className="text-2xl font-bold text-gray-100 dark:text-foreground mt-1">
            {managers.length}
          </div>
        </div>
        <div className="bg-gray-900 dark:bg-card rounded-lg p-4 border border-gray-700 dark:border-border">
          <div className="text-sm text-gray-400 dark:text-muted-foreground">Active</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-500 mt-1">
            {managers.filter(m => m.is_active).length}
          </div>
        </div>
        <div className="bg-gray-900 dark:bg-card rounded-lg p-4 border border-gray-700 dark:border-border">
          <div className="text-sm text-gray-400 dark:text-muted-foreground">Inactive</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-500 mt-1">
            {managers.filter(m => !m.is_active).length}
          </div>
        </div>
        <div className="bg-gray-900 dark:bg-card rounded-lg p-4 border border-gray-700 dark:border-border">
          <div className="text-sm text-gray-400 dark:text-muted-foreground">Restaurants</div>
          <div className="text-2xl font-bold text-gray-100 dark:text-foreground mt-1">
            {restaurants.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 dark:bg-card rounded-lg p-4 border border-gray-700 dark:border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Restaurant Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Restaurants</option>
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Power className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-600 dark:border-border rounded-lg bg-gray-900 dark:bg-background text-gray-100 dark:text-foreground focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Managers Table */}
      <div className="bg-gray-900 dark:bg-card rounded-lg border border-gray-700 dark:border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 dark:bg-muted/50 border-b border-gray-700 dark:border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 dark:text-foreground uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 dark:text-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 dark:text-foreground uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 dark:text-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 dark:text-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 dark:text-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-border">
              {paginatedManagers.map((manager) => (
                <tr key={manager.id} className="hover:bg-gray-800 dark:hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-100 dark:text-foreground">
                      {manager.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-muted-foreground">
                        <Mail size={14} />
                        {manager.email}
                      </div>
                      {manager.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-muted-foreground">
                          <Phone size={14} />
                          {manager.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-100 dark:text-foreground">
                      <Building2 size={16} className="text-gray-400" />
                      {manager.restaurants?.name || 'Not Assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {manager.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      manager.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {manager.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(manager)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(manager.id, manager.is_active)}
                        className="p-1.5 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded"
                        title={manager.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        onClick={() => handleResetPassword(manager.id, manager.email)}
                        className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded"
                        title="Reset Password"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteManager(manager.id, manager.name)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-700 dark:border-border flex items-center justify-between">
            <div className="text-sm text-gray-400 dark:text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredManagers.length)} of {filteredManagers.length} managers
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-600 dark:border-border rounded text-sm text-gray-100 dark:text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 dark:hover:bg-muted"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-100 dark:text-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-600 dark:border-border rounded text-sm text-gray-100 dark:text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 dark:hover:bg-muted"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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
