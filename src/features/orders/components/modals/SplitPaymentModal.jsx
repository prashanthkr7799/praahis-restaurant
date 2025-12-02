import { useState, useEffect } from 'react';
import { Banknote, CreditCard, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';
import Modal from '@shared/components/ui/Modal';
import { formatCurrency } from '@shared/utils/formatters';
import QRCode from 'react-qr-code';

/**
 * SplitPaymentModal Component
 * 
 * Modal for splitting payment between cash and online methods.
 * Validates that the sum of both amounts equals the order total.
 * 
 * @param {Object} props
 * @param {Object} props.order - Order object with total amount
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSuccess - Success callback with split payment data
 */
export function SplitPaymentModal({ order, isOpen, onClose, onSuccess }) {
  const [cashAmount, setCashAmount] = useState('');
  const [onlineAmount, setOnlineAmount] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const orderTotal = parseFloat(order?.total || 0);

  // Calculate remaining amount
  const cashValue = parseFloat(cashAmount) || 0;
  const onlineValue = parseFloat(onlineAmount) || 0;
  const totalEntered = cashValue + onlineValue;
  const remaining = orderTotal - totalEntered;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCashAmount('');
      setOnlineAmount('');
      setError('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Real-time validation
  useEffect(() => {
    if (!cashAmount && !onlineAmount) {
      setError('');
      return;
    }

    if (cashValue < 0 || onlineValue < 0) {
      setError('Amounts cannot be negative');
      return;
    }

    if (remaining < 0) {
      setError(`Total exceeds order amount by ${formatCurrency(Math.abs(remaining))}`);
      return;
    }

    if (remaining > 0 && (cashAmount || onlineAmount)) {
      setError(`Remaining amount: ${formatCurrency(remaining)}`);
      return;
    }

    setError('');
  }, [cashAmount, onlineAmount, cashValue, onlineValue, remaining, orderTotal]);

  const handleCashChange = (e) => {
    const value = e.target.value;
    // Allow empty or valid decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCashAmount(value);
    }
  };

  const handleOnlineChange = (e) => {
    const value = e.target.value;
    // Allow empty or valid decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setOnlineAmount(value);
    }
  };

  const validateSplit = () => {
    if (!cashAmount && !onlineAmount) {
      return 'Please enter payment amounts';
    }

    if (cashValue < 0 || onlineValue < 0) {
      return 'Amounts cannot be negative';
    }

    if (cashValue === 0 && onlineValue === 0) {
      return 'At least one amount must be greater than 0';
    }

    if (Math.abs(remaining) > 0.01) { // Allow 1 paisa tolerance for floating point
      if (remaining > 0) {
        return `Remaining amount: ${formatCurrency(remaining)}`;
      } else {
        return `Total exceeds order amount by ${formatCurrency(Math.abs(remaining))}`;
      }
    }

    return null;
  };

  const handleConfirm = async () => {
    const validationError = validateSplit();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Return split payment data
      const splitResults = [];

      if (cashValue > 0) {
        splitResults.push({
          method: 'cash',
          amount: cashValue
        });
      }

      if (onlineValue > 0) {
        splitResults.push({
          method: 'online',
          amount: onlineValue
        });
      }

      onSuccess(splitResults);
      onClose();
    } catch (err) {
      console.error('Error processing split payment:', err);
      setError('Failed to process split payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickSplit = (cashPercent) => {
    const cashAmt = (orderTotal * cashPercent / 100).toFixed(2);
    const onlineAmt = (orderTotal * (100 - cashPercent) / 100).toFixed(2);
    setCashAmount(cashAmt);
    setOnlineAmount(onlineAmt);
  };

  const handleFillRemaining = (field) => {
    if (field === 'cash' && remaining > 0) {
      setCashAmount((cashValue + remaining).toFixed(2));
    } else if (field === 'online' && remaining > 0) {
      setOnlineAmount((onlineValue + remaining).toFixed(2));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !validateSplit()) {
      handleConfirm();
    }
  };

  const isValid = Math.abs(remaining) < 0.01 && totalEntered > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Split Payment"
      size="md"
    >
      <div className="space-y-6">
        {/* Order Total */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-900">Order Total</span>
            <span className="text-2xl font-bold text-purple-900">
              {formatCurrency(orderTotal)}
            </span>
          </div>
        </div>

        {/* Quick Split Buttons */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Quick Split Options
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSplit(50)}
              className="px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 border border-purple-200 transition-colors"
              disabled={isProcessing}
            >
              50/50
            </button>
            <button
              type="button"
              onClick={() => handleQuickSplit(60)}
              className="px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 border border-purple-200 transition-colors"
              disabled={isProcessing}
            >
              60/40
            </button>
            <button
              type="button"
              onClick={() => handleQuickSplit(70)}
              className="px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 border border-purple-200 transition-colors"
              disabled={isProcessing}
            >
              70/30
            </button>
          </div>
        </div>

        {/* Cash Amount Input */}
        <div className="space-y-2">
          <label htmlFor="cashAmount" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Cash Amount</span>
            </div>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-400">
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              id="cashAmount"
              value={cashAmount}
              onChange={handleCashChange}
              onKeyPress={handleKeyPress}
              placeholder="0.00"
              className="w-full pl-12 pr-24 py-4 text-2xl font-semibold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
              disabled={isProcessing}
            />
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => handleFillRemaining('cash')}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-colors"
                disabled={isProcessing}
              >
                Fill
              </button>
            )}
          </div>
        </div>

        {/* Online Amount Input */}
        <div className="space-y-2">
          <label htmlFor="onlineAmount" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Online Amount</span>
            </div>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-400">
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              id="onlineAmount"
              value={onlineAmount}
              onChange={handleOnlineChange}
              onKeyPress={handleKeyPress}
              placeholder="0.00"
              className="w-full pl-12 pr-24 py-4 text-2xl font-semibold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              disabled={isProcessing}
            />
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => handleFillRemaining('online')}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors"
                disabled={isProcessing}
              >
                Fill
              </button>
            )}
          </div>
        </div>

        {/* Remaining Amount Indicator */}
        <div className={`rounded-xl p-4 border-2 transition-all ${
          isValid
            ? 'bg-emerald-50 border-emerald-300'
            : remaining > 0
            ? 'bg-amber-50 border-amber-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className={`text-sm font-medium ${
                isValid ? 'text-emerald-900' : 'text-amber-900'
              }`}>
                {isValid ? 'Payment Complete' : 'Remaining Amount'}
              </span>
            </div>
            <span className={`text-xl font-bold ${
              isValid
                ? 'text-emerald-900'
                : remaining > 0
                ? 'text-amber-900'
                : 'text-red-900'
            }`}>
              {formatCurrency(Math.abs(remaining))}
            </span>
          </div>
          {totalEntered > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              Total entered: {formatCurrency(totalEntered)} / {formatCurrency(orderTotal)}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && !isValid && (
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
            onClick={handleConfirm}
            disabled={!isValid || isProcessing}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              'Confirm Split Payment'
            )}
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-center text-gray-500">
          Press <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Enter</kbd> to confirm when amounts are correct
        </p>

        {/* QR Code Section - Show when online amount is entered */}
        {onlineValue > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Scan to Pay Online</h4>
              </div>
              <span className="text-lg font-bold text-blue-900">
                {formatCurrency(onlineValue)}
              </span>
            </div>
            
            {/* QR Code Display */}
            <div className="bg-white p-4 rounded-lg border-2 border-blue-300 flex justify-center items-center">
              <div className="bg-white p-2">
                <QRCode
                  value={`upi://pay?pa=merchant@upi&pn=Restaurant&am=${onlineValue.toFixed(2)}&cu=INR&tn=Order${order?.order_number || ''}`}
                  size={180}
                  level="H"
                  fgColor="#1e40af"
                />
              </div>
            </div>
            
            <p className="text-xs text-center text-blue-700 mt-3">
              Customer can scan this QR code with any UPI app to pay ₹{onlineValue.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
