import { useState, useEffect } from 'react';
import { Percent, IndianRupee, Tag, AlertCircle, TrendingDown, AlertTriangle } from 'lucide-react';
import Modal from '@shared/components/ui/Modal';
import { formatCurrency } from '@shared/utils/formatters';

/**
 * DiscountModal Component
 * 
 * Modal for applying discounts to orders.
 * Supports both percentage and fixed amount discounts.
 * Shows real-time preview of discount calculation.
 * Blocks discounts on already paid orders.
 * 
 * @param {Object} props
 * @param {Object} props.order - Order object with subtotal
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onApply - Apply callback with discount data
 */
export function DiscountModal({ order, isOpen, onClose, onApply }) {
  const [discountType, setDiscountType] = useState('percentage');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const orderSubtotal = parseFloat(order?.subtotal || order?.total || 0);

  // Check if order is already paid
  const isOrderPaid = order?.payment_status === 'paid';

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setDiscountType('percentage');
      setValue('');
      setReason('');
      setError('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Calculate discount amount based on type
  const calculateDiscountAmount = () => {
    const numValue = parseFloat(value) || 0;
    
    if (discountType === 'percentage') {
      return (orderSubtotal * numValue) / 100;
    } else {
      return numValue;
    }
  };

  const discountAmount = calculateDiscountAmount();
  const newTotal = Math.max(0, orderSubtotal - discountAmount);

  // Real-time validation
  useEffect(() => {
    if (!value) {
      setError('');
      return;
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue) || numValue < 0) {
      setError('Value must be a positive number');
      return;
    }

    if (discountType === 'percentage') {
      if (numValue > 100) {
        setError('Percentage cannot exceed 100%');
        return;
      }
    } else {
      if (numValue > orderSubtotal) {
        setError(`Fixed amount cannot exceed ${formatCurrency(orderSubtotal)}`);
        return;
      }
    }

    setError('');
  }, [value, discountType, orderSubtotal]);

  // If order is paid, show warning message
  if (isOpen && isOrderPaid) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Cannot Apply Discount"
        size="sm"
      >
        <div className="p-6 text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Order Already Paid
            </h3>
            <p className="text-sm text-gray-600">
              Cannot apply discount to a paid order. Please use the <span className="font-semibold text-orange-600">Refund</span> option instead if you need to adjust the amount.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const handleValueChange = (e) => {
    const inputValue = e.target.value;
    // Allow empty or valid decimal numbers
    if (inputValue === '' || /^\d*\.?\d{0,2}$/.test(inputValue)) {
      setValue(inputValue);
    }
  };

  const validateDiscount = () => {
    if (!value) {
      return 'Please enter a discount value';
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue) || numValue <= 0) {
      return 'Discount value must be greater than 0';
    }

    if (discountType === 'percentage') {
      if (numValue < 0 || numValue > 100) {
        return 'Percentage must be between 0 and 100';
      }
    } else {
      if (numValue < 0 || numValue > orderSubtotal) {
        return `Fixed amount must be between 0 and ${formatCurrency(orderSubtotal)}`;
      }
    }

    if (discountAmount <= 0) {
      return 'Discount amount must be greater than 0';
    }

    return null;
  };

  const handleApply = async () => {
    const validationError = validateDiscount();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Return discount data
      onApply({
        type: discountType,
        value: parseFloat(value),
        amount: discountAmount,
        reason: reason.trim() || null,
        originalTotal: orderSubtotal,
        newTotal: newTotal
      });

      onClose();
    } catch (err) {
      console.error('Error applying discount:', err);
      setError('Failed to apply discount. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !validateDiscount()) {
      handleApply();
    }
  };

  // Quick discount presets
  const quickDiscounts = discountType === 'percentage' 
    ? [5, 10, 15, 20, 25, 50]
    : [50, 100, 200, 500];

  const isValid = !validateDiscount() && discountAmount > 0;
  const discountPercentage = (discountAmount / orderSubtotal * 100).toFixed(1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Discount"
      size="md"
    >
      <div className="space-y-6">
        {/* Order Subtotal */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Order Subtotal</span>
            <span className="text-2xl font-bold text-blue-900">
              {formatCurrency(orderSubtotal)}
            </span>
          </div>
        </div>

        {/* Discount Type Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Discount Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setDiscountType('percentage');
                setValue('');
                setError('');
              }}
              className={`relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                discountType === 'percentage'
                  ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-400 shadow-lg shadow-indigo-500/20'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              disabled={isProcessing}
            >
              <Percent className={`w-5 h-5 ${
                discountType === 'percentage' ? 'text-indigo-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                discountType === 'percentage' ? 'text-indigo-900' : 'text-gray-600'
              }`}>
                Percentage
              </span>
              {discountType === 'percentage' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setDiscountType('fixed');
                setValue('');
                setError('');
              }}
              className={`relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                discountType === 'fixed'
                  ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-400 shadow-lg shadow-indigo-500/20'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              disabled={isProcessing}
            >
              <IndianRupee className={`w-5 h-5 ${
                discountType === 'fixed' ? 'text-indigo-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                discountType === 'fixed' ? 'text-indigo-900' : 'text-gray-600'
              }`}>
                Fixed Amount
              </span>
              {discountType === 'fixed' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Discount Presets */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Quick Discounts
          </label>
          <div className="grid grid-cols-3 gap-2">
            {quickDiscounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setValue(preset.toString())}
                className="px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-colors"
                disabled={isProcessing}
              >
                {discountType === 'percentage' ? `${preset}%` : formatCurrency(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* Value Input */}
        <div className="space-y-2">
          <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">
            {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
          </label>
          <div className="relative">
            {discountType === 'percentage' ? (
              <>
                <input
                  type="text"
                  inputMode="decimal"
                  id="discountValue"
                  value={value}
                  onChange={handleValueChange}
                  onKeyPress={handleKeyPress}
                  placeholder="0.00"
                  className="w-full pl-4 pr-12 py-4 text-2xl font-semibold border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  disabled={isProcessing}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-400">
                  %
                </span>
              </>
            ) : (
              <>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-400">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  id="discountValue"
                  value={value}
                  onChange={handleValueChange}
                  onKeyPress={handleKeyPress}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 text-2xl font-semibold border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  disabled={isProcessing}
                />
              </>
            )}
          </div>
        </div>

        {/* Reason Input (Optional) */}
        <div className="space-y-2">
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>Reason (Optional)</span>
            </div>
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Regular customer, Birthday discount, Loyalty reward..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none transition-all"
            disabled={isProcessing}
            maxLength={200}
          />
          <div className="flex justify-end">
            <span className="text-xs text-gray-500">
              {reason.length}/200
            </span>
          </div>
        </div>

        {/* Discount Preview */}
        <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900">Discount Preview</h3>
          </div>

          {/* Original Total */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Original Total</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(orderSubtotal)}
            </span>
          </div>

          {/* Discount Amount */}
          <div className="flex items-center justify-between py-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">Discount</span>
              {discountAmount > 0 && (
                <span className="text-xs text-gray-500">
                  ({discountPercentage}%)
                </span>
              )}
            </div>
            <span className="text-lg font-semibold text-red-600">
              {discountAmount > 0 ? `- ${formatCurrency(discountAmount)}` : '₹0.00'}
            </span>
          </div>

          {/* New Total */}
          <div className="flex items-center justify-between py-3 border-t-2 border-gray-300 bg-gradient-to-r from-emerald-50 to-green-50 -mx-4 px-4 -mb-4 rounded-b-lg">
            <span className="text-base font-semibold text-emerald-900">New Total</span>
            <span className="text-2xl font-bold text-emerald-600">
              {formatCurrency(newTotal)}
            </span>
          </div>

          {/* Savings Badge */}
          {discountAmount > 0 && (
            <div className="absolute -top-2 right-4">
              <div className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
                SAVE {formatCurrency(discountAmount)}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!isValid || isProcessing}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              <>
                <Tag className="w-4 h-4" />
                <span>Apply Discount</span>
              </>
            )}
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-center text-gray-500">
          Press <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Enter</kbd> to apply discount
        </p>
      </div>
    </Modal>
  );
}
