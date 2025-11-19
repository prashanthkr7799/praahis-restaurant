/**
 * OffersManagement Component
 * Manage promotional offers and discounts
 */

import React, { useState, useEffect } from 'react';
import { Plus, Tag, Percent, Calendar, TrendingUp, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency, formatDate } from '@shared/utils/helpers/formatters';
import { logOfferUpdated, logOfferDeleted } from '@domains/staff/utils/activityLogger';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import DataTable from '@shared/components/compounds/DataTable';
import Modal from '@shared/components/compounds/Modal';
import ConfirmDialog from '@shared/components/compounds/ConfirmDialog';
import OfferForm from '@shared/components/compounds/OfferForm';
import Badge from '@shared/components/primitives/Badge';
import toast from 'react-hot-toast';

const OFFER_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  BOGO: 'bogo',
};

const OffersManagement = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [deletingOffer, setDeletingOffer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error loading offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingOffer(null);
    setShowFormModal(true);
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setShowFormModal(true);
  };

  const handleDelete = (offer) => {
    setDeletingOffer(offer);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingOffer) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', deletingOffer.id);

      if (error) throw error;

      await logOfferDeleted(deletingOffer.id, deletingOffer);

      toast.success('Offer deleted successfully');
      loadOffers();
      setShowDeleteDialog(false);
      setDeletingOffer(null);
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (offer) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_active: !offer.is_active })
        .eq('id', offer.id);

      if (error) throw error;

      await logOfferUpdated(offer.id, { is_active: !offer.is_active });

      toast.success(`Offer ${!offer.is_active ? 'activated' : 'deactivated'}`);
      loadOffers();
    } catch (error) {
      console.error('Error toggling offer:', error);
      toast.error('Failed to update offer');
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingOffer(null);
    loadOffers();
  };

  const isOfferValid = (offer) => {
    const now = new Date();
    const startDate = new Date(offer.start_date);
    const endDate = new Date(offer.end_date);
    return offer.is_active && now >= startDate && now <= endDate;
  };

  const getOfferTypeIcon = (type) => {
    switch (type) {
      case OFFER_TYPES.PERCENTAGE:
        return Percent;
      case OFFER_TYPES.FIXED:
        return Tag;
      case OFFER_TYPES.BOGO:
        return TrendingUp;
      default:
        return Tag;
    }
  };

  const formatDiscountValue = (offer) => {
    switch (offer.discount_type) {
      case OFFER_TYPES.PERCENTAGE:
        return `${offer.discount_value}% OFF`;
      case OFFER_TYPES.FIXED:
        return `${formatCurrency(offer.discount_value)} OFF`;
      case OFFER_TYPES.BOGO:
        return 'Buy 1 Get 1';
      default:
        return '-';
    }
  };

  const columns = [
    {
      header: 'Offer Details',
      field: 'name',
      render: (row) => {
        const Icon = getOfferTypeIcon(row.discount_type);
        return (
          <div className="flex items-center gap-3">
            <div className="bg-primary-tint p-2 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium text-foreground">{row.name}</div>
              <div className="text-sm text-muted-foreground">{row.code}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Discount',
      field: 'discount_value',
      render: (row) => (
        <div className="font-semibold text-primary">
          {formatDiscountValue(row)}
        </div>
      ),
    },
    {
      header: 'Applicable To',
      field: 'applicable_to',
      render: (row) => (
        <div className="text-sm">
          <div className="font-medium text-foreground capitalize">{row.applicable_to}</div>
          {row.applicable_items && (
            <div className="text-muted-foreground">{row.applicable_items.length} items</div>
          )}
        </div>
      ),
    },
    {
      header: 'Validity',
      field: 'start_date',
      render: (row) => (
        <div className="text-sm">
          <div className="text-foreground">
            {formatDate(row.start_date)} - {formatDate(row.end_date)}
          </div>
          {isOfferValid(row) ? (
            <Badge variant="success" size="sm" className="mt-1">
              Active Now
            </Badge>
          ) : (
            <Badge variant="default" size="sm" className="mt-1">
              {new Date(row.start_date) > new Date() ? 'Scheduled' : 'Expired'}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Usage',
      field: 'usage_count',
      render: (row) => (
        <div className="text-sm">
          <div className="font-medium text-foreground">
            {row.usage_count || 0}
            {row.usage_limit && ` / ${row.usage_limit}`}
          </div>
          {row.usage_limit && (
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div
                className="bg-primary h-1.5 rounded-full"
                style={{
                  width: `${Math.min(((row.usage_count || 0) / row.usage_limit) * 100, 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      ),
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
      header: 'Actions',
      field: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleToggleActive(row)}
            className={`p-2 rounded-lg transition-colors ${
              row.is_active
                ? 'text-warning hover:bg-warning-light'
                : 'text-success hover:bg-success-light'
            }`}
            title={row.is_active ? 'Deactivate' : 'Activate'}
          >
            {row.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-info hover:bg-info-light rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-2 text-destructive hover:bg-destructive-light rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const activeOffers = offers.filter((o) => o.is_active).length;
  const validOffers = offers.filter((o) => isOfferValid(o)).length;
  const totalUsage = offers.reduce((sum, o) => sum + (o.usage_count || 0), 0);

  if (loading) {
    return <LoadingSpinner text="Loading offers..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Offers Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage promotional offers</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Offer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-muted-foreground">Total Offers</div>
          <div className="text-2xl font-bold text-foreground">{offers.length}</div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-muted-foreground">Active Offers</div>
          <div className="text-2xl font-bold text-success">{activeOffers}</div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-muted-foreground">Valid Now</div>
          <div className="text-2xl font-bold text-primary">{validOffers}</div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-muted-foreground">Total Usage</div>
          <div className="text-2xl font-bold text-info">{totalUsage}</div>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <DataTable
          data={offers}
          columns={columns}
          searchable={true}
          searchPlaceholder="Search offers by name or code..."
          emptyMessage="No offers found. Create your first promotional offer to attract customers."
        />
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingOffer(null);
        }}
        title={editingOffer ? 'Edit Offer' : 'Create New Offer'}
        size="lg"
      >
        <OfferForm
          offer={editingOffer}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowFormModal(false);
            setEditingOffer(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingOffer(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Offer"
        message={`Are you sure you want to delete "${deletingOffer?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default OffersManagement;
