/**
 * StaffManagement Component
 * Manage staff members with RBAC
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, UserCheck, UserX, Edit2, Mail, Phone, Shield, Link as LinkIcon, Copy, Trash2 } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { ROLES, getRoleDisplayName, getRoleBadgeColor } from '@shared/utils/permissions/permissions';
import { formatDateTime } from '@shared/utils/helpers/formatters';
import { logUserDeactivated } from '@domains/staff/utils/activityLogger';
import { TableSkeleton } from '@shared/components/feedback/LoadingSkeleton';
import DataTable from '@shared/components/compounds/DataTable';
import Modal from '@shared/components/compounds/Modal';
import ConfirmDialog from '@shared/components/compounds/ConfirmDialog';
import StaffForm from '@domains/staff/components/StaffForm';
import Badge from '@shared/components/primitives/Badge';
import toast from 'react-hot-toast';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import { resetPassword } from '@shared/utils/auth/auth';
import { getChefLoginLink, getWaiterLoginLink } from '@shared/utils/helpers/linkHelpers';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { restaurantId, restaurantSlug } = useRestaurant();

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('list_staff_for_current_restaurant');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    loadStaff();
  }, [restaurantId, loadStaff]);

  const handleAddNew = () => {
    setEditingStaff(null);
    setShowFormModal(true);
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setShowFormModal(true);
  };

  const handleDeactivate = (staffMember) => {
    setDeletingStaff(staffMember);
    setShowDeleteDialog(true);
  };

  const confirmDeactivate = async () => {
    if (!deletingStaff) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .rpc('admin_set_staff_active', { target_id: deletingStaff.id, p_is_active: false });
      if (error) throw error;

      await logUserDeactivated(deletingStaff.id, deletingStaff);

      toast.success(`${deletingStaff.full_name} has been deactivated`);
      loadStaff();
      setShowDeleteDialog(false);
      setDeletingStaff(null);
    } catch (error) {
      console.error('Error deactivating staff:', error);
      toast.error('Failed to deactivate staff member');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivate = async (staffMember) => {
    try {
      const { error } = await supabase
        .rpc('admin_set_staff_active', { target_id: staffMember.id, p_is_active: true });
      if (error) throw error;

      toast.success(`${staffMember.full_name} has been activated`);
      loadStaff();
    } catch (error) {
      console.error('Error activating staff:', error);
      toast.error('Failed to activate staff member');
    }
  };

  const handlePermanentDelete = (staffMember) => {
    setDeletingStaff(staffMember);
    setShowPermanentDeleteDialog(true);
  };

  const confirmPermanentDelete = async () => {
    if (!deletingStaff) return;

    setIsDeleting(true);
    try {
      // Get current user to prevent self-deletion
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id === deletingStaff.id) {
        toast.error('You cannot delete yourself');
        setShowPermanentDeleteDialog(false);
        setDeletingStaff(null);
        setIsDeleting(false);
        return;
      }

      // Use the new admin_delete_staff_member function
      const { error } = await supabase
        .rpc('admin_delete_staff_member', { target_id: deletingStaff.id });

      if (error) throw error;

      toast.success(`${deletingStaff.full_name} has been permanently deleted`);
      
      // Reload staff list to reflect changes
      await loadStaff();
      
      setShowPermanentDeleteDialog(false);
      setDeletingStaff(null);
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error(error.message || 'Failed to delete staff member');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async (staffMember) => {
    try {
      await resetPassword(staffMember.email);
      toast.success(`Password reset email sent to ${staffMember.email}`);
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send reset email');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingStaff(null);
    loadStaff();
  };

  const columns = [
    {
      header: 'Name',
      field: 'full_name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold">
            {(row.full_name || row.name || row.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-foreground">{row.full_name || row.name || 'Unknown'}</div>
            <div className="text-sm text-muted-foreground">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      field: 'role',
      render: (row) => (
        <Badge variant={getRoleBadgeColor(row.role)} size="sm">
          <Shield className="h-3 w-3 mr-1" />
          {getRoleDisplayName(row.role)}
        </Badge>
      ),
    },
    {
      header: 'Phone',
      field: 'phone',
      render: (row) => (
        <div className="flex items-center gap-2 text-foreground">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {row.phone || '-'}
        </div>
      ),
    },
    {
      header: 'Login Link',
      field: 'login_link',
      render: (row) => {
  if (!restaurantSlug) return <span className="text-muted-foreground">-</span>;
        let link = null;
        if (row.role === ROLES.CHEF) link = getChefLoginLink(restaurantSlug);
        if (row.role === ROLES.WAITER) link = getWaiterLoginLink(restaurantSlug);
  if (!link) return <span className="text-muted-foreground">-</span>;
        return (
          <button
            onClick={() => copyToClipboard(link)}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            title="Copy login link"
          >
            <LinkIcon className="h-4 w-4" />
            <Copy className="h-3 w-3" />
            Copy
          </button>
        );
      },
    },
    {
      header: 'Status',
      field: 'is_active',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'danger'} size="sm">
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Last Login',
      field: 'last_login',
      render: (row) => (
        <div className="text-sm text-muted-foreground">
          {row.last_login ? formatDateTime(row.last_login) : 'Never'}
        </div>
      ),
    },
    {
      header: 'Actions',
      field: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleResetPassword(row)}
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Send password reset email"
          >
            <Mail className="h-4 w-4" />
          </button>
          {row.is_active ? (
            <>
              <button
                onClick={() => handleEdit(row)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeactivate(row)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Deactivate"
              >
                <UserX className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePermanentDelete(row)}
                className="p-2 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                title="Permanently Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleActivate(row)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Activate"
              >
                <UserCheck className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePermanentDelete(row)}
                className="p-2 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                title="Permanently Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-72 bg-white/5 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-40 bg-white/10 rounded-lg animate-pulse"></div>
        </div>
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Manage your restaurant staff and permissions</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Staff Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Total Staff</div>
          <div className="text-2xl font-bold text-foreground">{staff.length}</div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {staff.filter(s => s.is_active).length}
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Inactive</div>
          <div className="text-2xl font-bold text-red-600">
            {staff.filter(s => !s.is_active).length}
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Admins</div>
          <div className="text-2xl font-bold text-purple-600">
            {staff.filter(s => s.role === ROLES.ADMIN).length}
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-card rounded-lg shadow-sm">
        <DataTable
          data={staff}
          columns={columns}
          searchable={true}
          searchPlaceholder="Search staff by name or email..."
          emptyMessage="No staff members found. Add your first team member to get started."
        />
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingStaff(null);
        }}
        title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
        size="md"
      >
        <StaffForm
          staff={editingStaff}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowFormModal(false);
            setEditingStaff(null);
          }}
          allowedRoles={[ROLES.CHEF, ROLES.WAITER]}
        />
      </Modal>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingStaff(null);
        }}
        onConfirm={confirmDeactivate}
        title="Deactivate Staff Member"
        message={`Are you sure you want to deactivate "${deletingStaff?.full_name}"? They will not be able to login but their data will be preserved.`}
        confirmText="Deactivate"
        variant="warning"
        isLoading={isDeleting}
      />

      {/* Permanent Delete Confirmation */}
      <ConfirmDialog
        isOpen={showPermanentDeleteDialog}
        onClose={() => {
          setShowPermanentDeleteDialog(false);
          setDeletingStaff(null);
        }}
        onConfirm={confirmPermanentDelete}
        title="Permanently Delete Staff Member"
        message={`Are you sure you want to permanently delete "${deletingStaff?.full_name}"? This action cannot be undone and will remove them from all databases including authentication.`}
        confirmText="Delete Permanently"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default StaffManagement;
