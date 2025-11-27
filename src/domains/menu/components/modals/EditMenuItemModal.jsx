/**
 * EditMenuItemModal - Edit menu item details
 * Allows manager to edit menu item fields including name, price, category, image, etc.
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Clock, DollarSign, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const EditMenuItemModal = ({ isOpen, onClose, item, restaurantId, onItemUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    preparationTime: '',
    isVegetarian: false,
    isAvailable: true,
    imageUrl: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        price: item.price || '',
        preparationTime: item.preparation_time || '',
        isVegetarian: item.is_vegetarian || false,
        isAvailable: item.is_available !== undefined ? item.is_available : true,
        imageUrl: item.image_url || '',
      });
      setImagePreview(item.image_url || null);
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${restaurantId}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        imageUrl: publicUrl,
      }));

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!item || !item.id) {
      toast.error('Menu item ID is missing');
      return;
    }

    try {
      setLoading(true);

      // Update menu item
      const { data: updatedItem, error } = await supabase
        .from('menu_items')
        .update({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          preparation_time: formData.preparationTime ? parseInt(formData.preparationTime) : null,
          is_vegetarian: formData.isVegetarian,
          is_available: formData.isAvailable,
          image_url: formData.imageUrl || null,
        })
        .eq('id', item.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Menu item updated successfully');

      // Notify parent component
      if (onItemUpdated) {
        onItemUpdated(updatedItem);
      }

      onClose();
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error('Failed to update menu item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 max-w-2xl w-full relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Save className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Edit Menu Item</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Update menu item details and availability
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Item Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Butter Chicken"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 transition-colors"
                required
              />
            </div>

            {/* Image Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-white mb-2">
                Item Image
              </label>
              <div className="flex items-start gap-4">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-zinc-600" />
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <label
                    htmlFor="image"
                    className="inline-flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white cursor-pointer transition-colors"
                  >
                    {uploadingImage ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload Image</span>
                      </>
                    )}
                  </label>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    PNG, JPG or WEBP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-white mb-2">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 transition-colors"
                required
              >
                <option value="">Select category</option>
                <option value="Appetizers">Appetizers</option>
                <option value="Main Course">Main Course</option>
                <option value="Desserts">Desserts</option>
                <option value="Beverages">Beverages</option>
                <option value="Breads">Breads</option>
                <option value="Rice">Rice</option>
                <option value="Salads">Salads</option>
                <option value="Soups">Soups</option>
                <option value="Sides">Sides</option>
                <option value="Specials">Specials</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-white mb-2">
                Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="299"
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Preparation Time */}
            <div>
              <label htmlFor="preparationTime" className="block text-sm font-semibold text-white mb-2">
                Preparation Time (min)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="number"
                  id="preparationTime"
                  name="preparationTime"
                  value={formData.preparationTime}
                  onChange={handleChange}
                  placeholder="15"
                  min="0"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="md:col-span-2 space-y-3">
              {/* Vegetarian Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥬</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Vegetarian</p>
                    <p className="text-xs text-zinc-500">Mark as vegetarian dish</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange({ target: { name: 'isVegetarian', type: 'checkbox', checked: !formData.isVegetarian } })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isVegetarian ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isVegetarian ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Available Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Available</p>
                    <p className="text-xs text-zinc-500">Item available for ordering</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange({ target: { name: 'isAvailable', type: 'checkbox', checked: !formData.isAvailable } })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isAvailable ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-white transition-colors border border-white/10"
              disabled={loading || uploadingImage}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMenuItemModal;
