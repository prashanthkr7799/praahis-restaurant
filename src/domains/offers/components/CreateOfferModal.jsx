import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { validateOfferOverlap } from '../utils/offersUtils';

export default function CreateOfferModal({ offer, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    offer_name: '',
    offer_type: 'percentage',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    category_id: '',
    item_id: '',
    valid_from: '',
    valid_until: '',
    first_time_only: false,
    status: 'active',
    bogo_config: null
  });

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [existingOffers, setExistingOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchItems();
    fetchExistingOffers();
  }, []);

  useEffect(() => {
    if (offer) {
      setFormData({
        offer_name: offer.offer_name || '',
        offer_type: offer.offer_type || 'percentage',
        discount_type: offer.discount_type || 'percentage',
        discount_value: offer.discount_value || '',
        min_order_amount: offer.min_order_amount || '',
        max_discount_amount: offer.max_discount_amount || '',
        category_id: offer.category_id || '',
        item_id: offer.item_id || '',
        valid_from: offer.valid_from ? offer.valid_from.split('T')[0] : '',
        valid_until: offer.valid_until ? offer.valid_until.split('T')[0] : '',
        first_time_only: offer.first_time_only || false,
        status: offer.status || 'active',
        bogo_config: offer.bogo_config || null
      });
    }
  }, [offer]);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('status', 'active')
      .order('name');
    setCategories(data || []);
  }

  async function fetchItems() {
    const { data } = await supabase
      .from('menu_items')
      .select('id, name, category_id')
      .eq('available', true)
      .order('name');
    setItems(data || []);
  }

  async function fetchExistingOffers() {
    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('status', 'active');
    setExistingOffers(data || []);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setValidationErrors([]);
  }

  function validateForm() {
    const errors = [];

    if (!formData.offer_name.trim()) {
      errors.push('Offer name is required');
    }

    if (!formData.discount_value || formData.discount_value <= 0) {
      errors.push('Discount value must be greater than 0');
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      errors.push('Percentage discount cannot exceed 100%');
    }

    if (!formData.valid_from) {
      errors.push('Start date is required');
    }

    if (!formData.valid_until) {
      errors.push('End date is required');
    }

    if (formData.valid_from && formData.valid_until) {
      if (new Date(formData.valid_from) >= new Date(formData.valid_until)) {
        errors.push('End date must be after start date');
      }
    }

    if (formData.offer_type === 'category' && !formData.category_id) {
      errors.push('Please select a category for category offer');
    }

    if (formData.offer_type === 'item' && !formData.item_id) {
      errors.push('Please select an item for item offer');
    }

    if (formData.offer_type === 'bogo') {
      if (!formData.bogo_config?.buy_item_id || !formData.bogo_config?.get_item_id) {
        errors.push('BOGO offer requires both buy and get items');
      }
    }

    // Check for overlapping offers
    const overlapCheck = validateOfferOverlap(
      { ...formData, id: offer?.id },
      existingOffers
    );

    if (overlapCheck.hasOverlap) {
      errors.push(`This offer overlaps with ${overlapCheck.conflictingOffers.length} existing offer(s)`);
    }

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const offerData = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        category_id: formData.offer_type === 'category' ? formData.category_id : null,
        item_id: formData.offer_type === 'item' ? formData.item_id : null
      };

      if (offer) {
        const { error: updateError } = await supabase
          .from('offers')
          .update(offerData)
          .eq('id', offer.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('offers')
          .insert([offerData]);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving offer:', err);
      setError(err.message || 'Failed to save offer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {offer ? 'Edit Offer' : 'Create New Offer'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-500 mb-2">Please fix the following errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((err, index) => (
                      <li key={index} className="text-red-400 text-sm">{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Offer Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Offer Name</label>
            <input
              type="text"
              name="offer_name"
              value={formData.offer_name}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Weekend Special"
              required
            />
          </div>

          {/* Offer Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Offer Type</label>
            <select
              name="offer_type"
              value={formData.offer_type}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="percentage">Percentage Off</option>
              <option value="flat">Flat Discount</option>
              <option value="bogo">Buy One Get One</option>
              <option value="category">Category Offer</option>
              <option value="item">Item Offer</option>
            </select>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Discount Type</label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="percentage">Percentage</option>
                <option value="flat">Flat Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
              </label>
              <input
                type="number"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                min="0"
                step={formData.discount_type === 'percentage' ? '0.1' : '1'}
                required
              />
            </div>
          </div>

          {/* Min Order & Max Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Min Order Amount (₹)</label>
              <input
                type="number"
                name="min_order_amount"
                value={formData.min_order_amount}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Optional"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Discount (₹)</label>
              <input
                type="number"
                name="max_discount_amount"
                value={formData.max_discount_amount}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Optional"
                min="0"
              />
            </div>
          </div>

          {/* Category Selection (if category offer) */}
          {formData.offer_type === 'category' && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Choose a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Item Selection (if item offer) */}
          {formData.offer_type === 'item' && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Item</label>
              <select
                name="item_id"
                value={formData.item_id}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Choose an item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Valid From</label>
              <input
                type="date"
                name="valid_from"
                value={formData.valid_from}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Valid Until</label>
              <input
                type="date"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* First Time Only */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="first_time_only"
              checked={formData.first_time_only}
              onChange={handleChange}
              className="w-5 h-5 rounded border-white/20 text-emerald-500 focus:ring-emerald-500"
            />
            <label className="text-sm">First-time customers only</label>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (offer ? 'Update Offer' : 'Create Offer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
