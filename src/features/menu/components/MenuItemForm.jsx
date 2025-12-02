/**
 * MenuItemForm Component
 * Form for creating/editing menu items with image upload
 */

import React, { useState, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@config/supabase';
import { getCurrentUser } from '@features/auth/services/authService';
import { logMenuItemCreated, logMenuItemUpdated } from '@features/staff/utils/activityLogger';
import toast from 'react-hot-toast';

const MenuItemForm = ({ item, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    is_vegetarian: false,
    is_available: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price || '',
        category: item.category || 'Main Course',
        is_vegetarian: item.is_vegetarian || false,
        is_available: item.is_available !== undefined ? item.is_available : true,
      });
      if (item.image_url) {
        setImagePreview(item.image_url);
      }
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(item?.image_url || null);
  };

  const uploadImage = async () => {
    if (!imageFile) return item?.image_url || null;

    setUploadingImage(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload image');
      }

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload image: ${error.message}`);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteOldImage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.includes('menu-images')) return;
    
    try {
      const imagePath = imageUrl.split('/').pop();
      await supabase.storage
        .from('menu-images')
        .remove([imagePath]);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter menu item name');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setLoading(true);

    try {
      const { user } = await getCurrentUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // Get restaurant ID
      const { data: userData } = await supabase
        .from('users')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.restaurant_id) {
        toast.error('Restaurant not found');
        return;
      }

      // Upload image if changed
      let imageUrl = item?.image_url;
      if (imageFile) {
        // Delete old image if exists and updating
        if (item?.image_url && imageFile) {
          await deleteOldImage(item.image_url);
        }
        try {
          imageUrl = await uploadImage();
        } catch {
          // Image upload failed, stop the submission
          setLoading(false);
          return;
        }
      }

      const menuItemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        category: formData.category,
        is_vegetarian: formData.is_vegetarian,
        is_available: formData.is_available,
        image_url: imageUrl,
        restaurant_id: userData.restaurant_id,
      };

      if (item) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update(menuItemData)
          .eq('id', item.id);

        if (error) throw error;

        await logMenuItemUpdated(item.id, { ...item, ...menuItemData });
        toast.success('Menu item updated successfully');
      } else {
        // Create new item
        const { data, error } = await supabase
          .from('menu_items')
          .insert([menuItemData])
          .select()
          .single();

        if (error) throw error;

        await logMenuItemCreated(data.id, data);
        toast.success('Menu item created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(error.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-3">
          Dish Image
        </label>
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div className="flex-shrink-0">
            {imagePreview ? (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/10 ring-2 ring-primary/20">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition-smooth"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border bg-card/50 flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-border bg-card text-foreground rounded-lg text-sm font-medium hover:bg-muted cursor-pointer transition-smooth"
            >
              <Upload className="h-4 w-4" />
              Choose Image
            </label>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              PNG, JPG up to 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
          Dish Name <span className="text-primary">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
          placeholder="e.g., Butter Chicken"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-foreground mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth resize-none"
          placeholder="Brief description of the dish..."
        />
      </div>

      {/* Price & Category Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-foreground mb-2">
            Price (₹) <span className="text-primary">*</span>
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            step="0.01"
            min="0"
            className="w-full px-4 py-3 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-foreground mb-2">
            Category <span className="text-primary">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-card border-2 border-border text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth appearance-none bg-no-repeat bg-right pr-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundSize: '1.5rem',
              backgroundPosition: 'right 0.75rem center'
            }}
          >
            <option value="">Select category</option>
            <option value="Starters">Starters</option>
            <option value="Main Course">Main Course</option>
            <option value="Desserts">Desserts</option>
            <option value="Beverages">Beverages</option>
            <option value="Snacks">Snacks</option>
          </select>
        </div>
      </div>

      {/* Checkboxes Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <label className="flex items-center gap-3 cursor-pointer p-4 bg-card border-2 border-border rounded-xl hover:border-primary/50 transition-smooth">
          <input
            type="checkbox"
            name="is_vegetarian"
            checked={formData.is_vegetarian}
            onChange={handleChange}
            className="w-5 h-5 text-primary border-border rounded focus:ring-2 focus:ring-primary/50"
          />
          <span className="text-sm font-medium text-foreground flex items-center gap-2">
            <span>🌱</span>
            <span>Vegetarian</span>
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer p-4 bg-card border-2 border-border rounded-xl hover:border-primary/50 transition-smooth">
          <input
            type="checkbox"
            name="is_available"
            checked={formData.is_available}
            onChange={handleChange}
            className="w-5 h-5 text-primary border-border rounded focus:ring-2 focus:ring-primary/50"
          />
          <span className="text-sm font-medium text-foreground">Available Now</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t border-border/50">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || uploadingImage}
          className="flex-1 px-4 py-3 border-2 border-border bg-card text-foreground rounded-xl hover:bg-muted font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-smooth"
        >
          {(loading || uploadingImage) && <Loader2 className="h-4 w-4 animate-spin" />}
          {uploadingImage ? 'Uploading...' : loading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
        </button>
      </div>
    </form>
  );
};

export default MenuItemForm;
