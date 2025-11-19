/**
 * MenuManagement Component
 * Manage restaurant menu items with CRUD operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency } from '@shared/utils/helpers/formatters';
import { logMenuItemDeleted } from '@domains/staff/utils/activityLogger';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import Modal from '@shared/components/compounds/Modal';
import ConfirmDialog from '@shared/components/compounds/ConfirmDialog';
import MenuItemForm from '@domains/ordering/components/MenuItemForm';
import Badge from '@shared/components/primitives/Badge';
import toast from 'react-hot-toast';
import { useRestaurant } from '@/shared/hooks/useRestaurant';

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const { restaurantId } = useRestaurant();
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = ['all', 'Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Specials'];

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    
    loadMenuItems();
    
    // Set up auto-refresh every 10 seconds only if we have a restaurantId
    const refreshInterval = setInterval(() => {
      loadMenuItems();
    }, 10000); // 10 seconds

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const filterItems = useCallback(() => {
    let filtered = menuItems;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term)
      );
    }
    setFilteredItems(filtered);
  }, [menuItems, searchTerm, selectedCategory]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  const loadMenuItems = async () => {
    try {
      // Don't query if restaurantId is null
      if (!restaurantId) {
        console.warn('Cannot load menu items: restaurantId is null');
        setMenuItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      // Only set loading to false, never to true (managed by initial state)
      setLoading(false);
    }
  };


  const handleAddNew = () => {
    setEditingItem(null);
    setShowFormModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowFormModal(true);
  };

  const handleDelete = (item) => {
    setDeletingItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      // Delete image from storage if exists
      if (deletingItem.image_url) {
        const imagePath = deletingItem.image_url.split('/').pop();
        await supabase.storage
          .from('menu-images')
          .remove([imagePath]);
      }

      // Delete menu item
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', deletingItem.id);

      if (error) throw error;

      // Log activity
      await logMenuItemDeleted(deletingItem.id, deletingItem);

      toast.success('Menu item deleted successfully');
      loadMenuItems();
      setShowDeleteDialog(false);
      setDeletingItem(null);
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);

      if (error) throw error;

      toast.success(`${item.name} is now ${!item.is_available ? 'available' : 'unavailable'}`);
      loadMenuItems();
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingItem(null);
    loadMenuItems();
  };

  if (loading) {
    return <LoadingSpinner text="Loading menu items..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground mt-1">Manage your restaurant menu items</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Menu Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Total Items</div>
          <div className="text-2xl font-bold text-foreground">{menuItems.length}</div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Available</div>
          <div className="text-2xl font-bold text-green-600">
            {menuItems.filter(i => i.is_available).length}
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Unavailable</div>
          <div className="text-2xl font-bold text-red-600">
            {menuItems.filter(i => !i.is_available).length}
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="text-sm text-muted-foreground">Categories</div>
          <div className="text-2xl font-bold text-foreground">
            {new Set(menuItems.map(i => i.category)).size}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm p-12 text-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No menu items found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first menu item'}
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              <Plus className="h-5 w-5" />
              Add Menu Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-card rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="relative h-48 bg-muted">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="bg-red-600 text-white px-4 py-2 rounded-full font-medium">
                      Unavailable
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                    <Badge variant="default" size="sm" className="mt-1">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-orange-600">
                      {formatCurrency(item.price)}
                    </div>
                  </div>
                </div>

                {item.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Tags */}
                {(item.is_vegetarian || item.is_spicy) && (
                  <div className="flex gap-2 mb-3">
                    {item.is_vegetarian && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        🌱 Veg
                      </span>
                    )}
                    {item.is_spicy && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        🌶️ Spicy
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      item.is_available
                        ? 'border-border text-foreground hover:bg-muted'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {item.is_available ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span className="text-sm">Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">Unhide</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="text-sm">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="text-sm">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
        size="lg"
      >
        <MenuItemForm
          item={editingItem}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowFormModal(false);
            setEditingItem(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingItem(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MenuManagement;
