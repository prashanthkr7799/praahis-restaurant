/**
 * OfferForm Component
 * Form for creating and editing promotional offers
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { getCurrentUser } from '@shared/utils/auth/auth';
import { logOfferCreated, logOfferUpdated } from '@domains/staff/utils/activityLogger';
import toast from 'react-hot-toast';

const OFFER_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  BOGO: 'bogo',
};

const APPLICABLE_TO = {
  ALL: 'all',
  CATEGORY: 'category',
  ITEMS: 'items',
};

const OfferForm = ({ offer, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    discount_type: OFFER_TYPES.PERCENTAGE,
    discount_value: '',
    applicable_to: APPLICABLE_TO.ALL,
    applicable_items: [],
    min_order_value: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCategories();
    loadMenuItems();

    if (offer) {
      setFormData({
        name: offer.name || '',
        code: offer.code || '',
        description: offer.description || '',
        discount_type: offer.discount_type || OFFER_TYPES.PERCENTAGE,
        discount_value: offer.discount_value || '',
        applicable_to: offer.applicable_to || APPLICABLE_TO.ALL,
        applicable_items: offer.applicable_items || [],
        min_order_value: offer.min_order_value || '',
        usage_limit: offer.usage_limit || '',
        start_date: offer.start_date ? offer.start_date.split('T')[0] : '',
        end_date: offer.end_date ? offer.end_date.split('T')[0] : '',
        is_active: offer.is_active ?? true,
      });
    }
  }, [offer]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('category')
        .order('category');

      if (error) throw error;

      const uniqueCategories = [...new Set(data.map((item) => item.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, category')
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Offer name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Offer code is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters and numbers';
    }

    if (!formData.discount_value) {
      newErrors.discount_value = 'Discount value is required';
    } else if (formData.discount_value <= 0) {
      newErrors.discount_value = 'Discount must be greater than 0';
    } else if (
      formData.discount_type === OFFER_TYPES.PERCENTAGE &&
      formData.discount_value > 100
    ) {
      newErrors.discount_value = 'Percentage cannot exceed 100%';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    } else if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.applicable_to === APPLICABLE_TO.ITEMS && formData.applicable_items.length === 0) {
      newErrors.applicable_items = 'Please select at least one item';
    }

    if (formData.min_order_value && formData.min_order_value < 0) {
      newErrors.min_order_value = 'Minimum order value cannot be negative';
    }

    if (formData.usage_limit && formData.usage_limit < 0) {
      newErrors.usage_limit = 'Usage limit cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleItemToggle = (itemId) => {
    setFormData((prev) => ({
      ...prev,
      applicable_items: prev.applicable_items.includes(itemId)
        ? prev.applicable_items.filter((id) => id !== itemId)
        : [...prev.applicable_items, itemId],
    }));
    if (errors.applicable_items) {
      setErrors((prev) => ({ ...prev, applicable_items: undefined }));
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const categoryItems = menuItems
      .filter((item) => item.category === category)
      .map((item) => item.id);
    setFormData((prev) => ({
      ...prev,
      applicable_items: categoryItems,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      const offerData = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        applicable_to: formData.applicable_to,
        applicable_items:
          formData.applicable_to === APPLICABLE_TO.ITEMS ? formData.applicable_items : null,
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
        restaurant_id: currentUser.restaurant_id,
      };

      if (offer) {
        // Update existing offer
        const { error: updateError } = await supabase
          .from('offers')
          .update(offerData)
          .eq('id', offer.id);

        if (updateError) throw updateError;

        await logOfferUpdated(offer.id, offerData);

        toast.success('Offer updated successfully');
      } else {
        // Create new offer
        const { data, error: insertError } = await supabase
          .from('offers')
          .insert(offerData)
          .select()
          .single();

        if (insertError) throw insertError;

        await logOfferCreated(data.id, offerData);

        toast.success('Offer created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error(error.message || 'Failed to save offer');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems =
    selectedCategory && formData.applicable_to === APPLICABLE_TO.ITEMS
      ? menuItems.filter((item) => item.category === selectedCategory)
      : menuItems;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Offer Name */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Offer Name <span className="text-primary">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-3 bg-card border-2 text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 transition-smooth ${
            errors.name ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
          }`}
          placeholder="e.g., Weekend Special"
        />
        {errors.name && <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-1"><span>⚠</span>{errors.name}</p>}
      </div>

      {/* Offer Code */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Offer Code <span className="text-primary">*</span>
        </label>
        <input
          type="text"
          name="code"
          value={formData.code}
          onChange={handleChange}
          className={`w-full px-4 py-3 bg-card border-2 text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 transition-smooth ${
            errors.code ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
          }`}
          placeholder="e.g., WEEKEND20"
          style={{ textTransform: 'uppercase' }}
        />
        {errors.code && <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-1"><span>⚠</span>{errors.code}</p>}
        <p className="mt-2 text-xs text-muted-foreground font-medium">Use only uppercase letters and numbers</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth resize-none"
          placeholder="Describe the offer..."
        />
      </div>

      {/* Discount Type and Value Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Discount Type <span className="text-primary">*</span>
          </label>
          <select
            name="discount_type"
            value={formData.discount_type}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-card border-2 border-border text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth appearance-none bg-no-repeat bg-right pr-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundSize: '1.5rem',
              backgroundPosition: 'right 0.75rem center'
            }}
          >
            <option value={OFFER_TYPES.PERCENTAGE}>Percentage Off</option>
            <option value={OFFER_TYPES.FIXED}>Fixed Amount Off</option>
            <option value={OFFER_TYPES.BOGO}>Buy One Get One</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Discount Value <span className="text-primary">*</span>
          </label>
          <input
            type="number"
            name="discount_value"
            value={formData.discount_value}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-card border-2 text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 transition-smooth ${
              errors.discount_value ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
            }`}
            placeholder={formData.discount_type === OFFER_TYPES.PERCENTAGE ? '20' : '100'}
            disabled={formData.discount_type === OFFER_TYPES.BOGO}
          />
          {errors.discount_value && (
            <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-1"><span>⚠</span>{errors.discount_value}</p>
          )}
        </div>
      </div>

      {/* Applicable To */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-3">
          Applicable To <span className="text-primary">*</span>
        </label>
        <div className="space-y-3">
          <label className="flex items-center p-4 bg-card border-2 border-border rounded-xl cursor-pointer transition-all hover:border-primary/50">
            <input
              type="radio"
              name="applicable_to"
              value={APPLICABLE_TO.ALL}
              checked={formData.applicable_to === APPLICABLE_TO.ALL}
              onChange={handleChange}
              className="w-5 h-5 text-primary border-border focus:ring-2 focus:ring-primary/50"
            />
            <div className="ml-3">
              <div className="font-semibold text-foreground">All Items</div>
              <div className="text-sm text-muted-foreground">Apply to entire menu</div>
            </div>
          </label>

          <label className="flex items-center p-4 bg-card border-2 border-border rounded-xl cursor-pointer transition-all hover:border-primary/50">
            <input
              type="radio"
              name="applicable_to"
              value={APPLICABLE_TO.ITEMS}
              checked={formData.applicable_to === APPLICABLE_TO.ITEMS}
              onChange={handleChange}
              className="w-5 h-5 text-primary border-border focus:ring-2 focus:ring-primary/50"
            />
            <div className="ml-3">
              <div className="font-semibold text-foreground">Specific Items</div>
              <div className="text-sm text-muted-foreground">Choose individual menu items</div>
            </div>
          </label>
        </div>
      </div>

      {/* Item Selection */}
      {formData.applicable_to === APPLICABLE_TO.ITEMS && (
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Select Items <span className="text-primary">*</span>
          </label>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-4 py-3 bg-card border-2 border-border text-foreground rounded-xl mb-3 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth appearance-none bg-no-repeat bg-right pr-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundSize: '1.5rem',
              backgroundPosition: 'right 0.75rem center'
            }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div className="max-h-48 overflow-y-auto bg-card border-2 border-border rounded-xl p-3 space-y-2">
            {filteredMenuItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center p-3 hover:bg-muted rounded-lg cursor-pointer transition-smooth"
              >
                <input
                  type="checkbox"
                  checked={formData.applicable_items.includes(item.id)}
                  onChange={() => handleItemToggle(item.id)}
                  className="w-5 h-5 text-primary border-border focus:ring-2 focus:ring-primary/50 rounded"
                />
                <span className="ml-3 text-sm font-medium text-foreground">
                  {item.name} <span className="text-muted-foreground">({item.category})</span>
                </span>
              </label>
            ))}
          </div>

          {errors.applicable_items && (
            <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-1"><span>⚠</span>{errors.applicable_items}</p>
          )}

          <p className="mt-3 text-sm text-foreground font-semibold bg-primary/10 px-3 py-2 rounded-lg inline-block">
            {formData.applicable_items.length} item(s) selected
          </p>
        </div>
      )}

      {/* Min Order Value and Usage Limit Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Minimum Order Value
          </label>
          <input
            type="number"
            name="min_order_value"
            value={formData.min_order_value}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-card border-2 text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 transition-smooth ${
              errors.min_order_value ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
            }`}
            placeholder="0"
          />
          {errors.min_order_value && (
            <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-1"><span>⚠</span>{errors.min_order_value}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground font-medium">Leave empty for no minimum</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Usage Limit</label>
          <input
            type="number"
            name="usage_limit"
            value={formData.usage_limit}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-card border-2 text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary/50 transition-smooth ${
              errors.usage_limit ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
            }`}
            placeholder="Unlimited"
          />
          {errors.usage_limit && (
            <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-1"><span>⚠</span>{errors.usage_limit}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground font-medium">Total times offer can be used</p>
        </div>
      </div>

      {/* Date Range Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Start Date <span className="text-primary">*</span>
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-card border-2 text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 transition-smooth ${
              errors.start_date ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
            }`}
          />
          {errors.start_date && <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-1"><span>⚠</span>{errors.start_date}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            End Date <span className="text-primary">*</span>
          </label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-card border-2 text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 transition-smooth ${
              errors.end_date ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
            }`}
          />
          {errors.end_date && <p className="mt-2 text-sm text-red-500 font-medium flex items-center gap-1"><span>⚠</span>{errors.end_date}</p>}
        </div>
      </div>

      {/* Active Status Checkbox */}
      <label className="flex items-center gap-3 cursor-pointer p-4 bg-card border-2 border-border rounded-xl hover:border-primary/50 transition-smooth">
        <input
          type="checkbox"
          name="is_active"
          id="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="w-5 h-5 text-primary border-border rounded focus:ring-2 focus:ring-primary/50"
        />
        <span className="text-sm font-semibold text-foreground">Activate offer immediately</span>
      </label>

      {/* Form Actions */}
      <div className="flex gap-3 pt-6 border-t border-border/50">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-3 border-2 border-border bg-card text-foreground rounded-xl hover:bg-muted font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary text-white px-4 py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-smooth"
        >
          {loading ? 'Saving...' : offer ? 'Update Offer' : 'Create Offer'}
        </button>
      </div>
    </form>
  );
};

export default OfferForm;
