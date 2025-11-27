import { useState, useEffect } from 'react';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { generateCouponCode } from '../utils/offersUtils';

export default function CreateCouponModal({ coupon, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    max_discount_amount: '',
    min_order_amount: '',
    valid_from: '',
    valid_until: '',
    usage_limit: '',
    per_user_limit: '',
    first_time_only: false,
    status: 'active',
    terms_conditions: ''
  });

  const [existingCoupons, setExistingCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    fetchExistingCoupons();
    if (!coupon) {
      generateAndSetCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code || '',
        description: coupon.description || '',
        discount_type: coupon.discount_type || 'percentage',
        discount_value: coupon.discount_value || '',
        max_discount_amount: coupon.max_discount_amount || '',
        min_order_amount: coupon.min_order_amount || '',
        valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
        valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
        usage_limit: coupon.usage_limit || '',
        per_user_limit: coupon.per_user_limit || '',
        first_time_only: coupon.first_time_only || false,
        status: coupon.status || 'active',
        terms_conditions: coupon.terms_conditions || ''
      });
    }
  }, [coupon]);

  async function fetchExistingCoupons() {
    const { data } = await supabase
      .from('coupons')
      .select('code, id');
    setExistingCoupons(data || []);
  }

  function generateAndSetCode() {
    let newCode;
    do {
      newCode = generateCouponCode(8);
    } while (existingCoupons.some(c => c.code === newCode));
    
    setFormData(prev => ({ ...prev, code: newCode }));
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

    if (!formData.code.trim()) {
      errors.push('Coupon code is required');
    }

    if (formData.code.length < 4) {
      errors.push('Coupon code must be at least 4 characters');
    }

    // Check for duplicate code
    const isDuplicate = existingCoupons.some(
      c => c.code.toUpperCase() === formData.code.toUpperCase() && c.id !== coupon?.id
    );
    if (isDuplicate) {
      errors.push('This coupon code already exists');
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
      const couponData = {
        ...formData,
        code: formData.code.toUpperCase(),
        discount_value: parseFloat(formData.discount_value),
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        per_user_limit: formData.per_user_limit ? parseInt(formData.per_user_limit) : null,
        usage_count: coupon?.usage_count || 0
      };

      if (coupon) {
        const { error: updateError } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', coupon.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('coupons')
          .insert([couponData]);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving coupon:', err);
      setError(err.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {coupon ? 'Edit Coupon' : 'Create New Coupon'}
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

          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-medium mb-2">Coupon Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                placeholder="SAVE20"
                required
              />
              {!coupon && (
                <button
                  type="button"
                  onClick={generateAndSetCode}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-all"
                  title="Generate new code"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Get 20% off on orders above ₹500"
            />
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Discount Type</label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
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
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="500"
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
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="200"
                min="0"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Valid From</label>
              <input
                type="date"
                name="valid_from"
                value={formData.valid_from}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Total Usage Limit</label>
              <input
                type="number"
                name="usage_limit"
                value={formData.usage_limit}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Unlimited"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Per User Limit</label>
              <input
                type="number"
                name="per_user_limit"
                value={formData.per_user_limit}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
                min="0"
              />
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <label className="block text-sm font-medium mb-2">Terms & Conditions</label>
            <textarea
              name="terms_conditions"
              value={formData.terms_conditions}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
              placeholder="Enter terms and conditions..."
            />
          </div>

          {/* First Time Only */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="first_time_only"
              checked={formData.first_time_only}
              onChange={handleChange}
              className="w-5 h-5 rounded border-white/20 text-blue-500 focus:ring-blue-500"
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
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (coupon ? 'Update Coupon' : 'Create Coupon')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
