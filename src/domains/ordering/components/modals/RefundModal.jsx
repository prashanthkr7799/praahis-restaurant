import { useState, useEffect } from 'react';
import { DollarSign, AlertTriangle, CheckCircle, CreditCard, Banknote, RefreshCcw } from 'lucide-react';
import Modal from '@shared/components/compounds/Modal';
import { formatCurrency } from '@shared/utils/helpers/formatters';

/**
 * RefundModal Component
 * 
 * Modal for processing full or partial refunds for paid orders.
 * Supports cash refunds and online payment reversals.
 * 
 * @param {Object} props
 * @param {Object} props.order - Order object with payment info
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirmRefund - Confirmation callback with refund data
 */
export function RefundModal({ order, isOpen, onClose, onConfirmRefund }) {
  const [refundType, setRefundType] = useState('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('original_method');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate amounts
  const orderTotal = parseFloat(order?.total || order?.total_amount || 0);
  const alreadyRefunded = parseFloat(order?.refund_amount || 0);
  const refundableAmount = orderTotal - alreadyRefunded;
  const refundAmount = refundType === 'full' 
    ? refundableAmount 
    : parseFloat(partialAmount || 0);

  // Refund reason options
  const refundReasons = [
    { value: 'customer_request', label: 'Customer Request', icon: '🙋' },
    { value: 'order_cancelled', label: 'Order Cancelled', icon: '❌' },
    { value: 'wrong_order', label: 'Wrong Order Delivered', icon: '🔄' },
    { value: 'quality_issue', label: 'Food Quality Issue', icon: '⚠️' },
    { value: 'service_issue', label: 'Service Issue', icon: '🔧' },
    { value: 'overcharge', label: 'Overcharged', icon: '💰' },
    { value: 'duplicate_payment', label: 'Duplicate Payment', icon: '📋' },
    { value: 'item_unavailable', label: 'Items Not Available', icon: '🚫' },
    { value: 'late_delivery', label: 'Late Delivery', icon: '⏰' },
    { value: 'other', label: 'Other Reason', icon: '📝' }
  ];

  // Payment method display
  const paymentMethodDisplay = {
    cash: '💵 Cash',
    razorpay: '💳 Online Payment',
    upi: '📱 UPI',
    card: '💳 Card',
    split: '💰 Split Payment'
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRefundType('full');
      setPartialAmount('');
      setReason('');
      setRefundMethod('original_method');
      setError('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Real-time validation
  useEffect(() => {
    setError('');
    
    if (refundType === 'partial') {
      const amount = parseFloat(partialAmount || 0);
      if (amount <= 0) {
        setError('Partial refund amount must be greater than 0');
      } else if (amount > refundableAmount) {
        setError(`Cannot refund more than ${formatCurrency(refundableAmount)}`);
      }
    }
  }, [refundType, partialAmount, refundableAmount]);

  const validateRefund = () => {
    if (!reason) {
      return 'Please select a refund reason';
    }

    if (refundType === 'partial') {
      const amount = parseFloat(partialAmount || 0);
      if (amount <= 0) {
        return 'Partial refund amount must be greater than 0';
      }
      if (amount > refundableAmount) {
        return `Cannot refund more than ${formatCurrency(refundableAmount)}`;
      }
    }

    if (!refundMethod) {
      return 'Please select a refund method';
    }

    return null;
  };

  const handleConfirmRefund = async () => {
    const validationError = validateRefund();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Determine final refund amount
      const finalAmount = refundType === 'full' ? refundableAmount : parseFloat(partialAmount);

      // Return refund data
      onConfirmRefund({
        orderId: order?.id,
        refundType,
        refundAmount: finalAmount,
        reason,
        refundMethod,
        originalAmount: orderTotal,
        alreadyRefunded,
        remainingAmount: refundableAmount - finalAmount,
        refundedAt: new Date().toISOString()
      });

      onClose();
    } catch (err) {
      console.error('Error processing refund:', err);
      setError('Failed to process refund. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValid = !validateRefund();

  // Check if already fully refunded
  const isFullyRefunded = alreadyRefunded >= orderTotal;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Refund"
      size="md"
    >
      <div className="space-y-6">
        {/* Warning if already refunded */}
        {isFullyRefunded && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-900">
                  Order Already Fully Refunded
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  The full amount of {formatCurrency(orderTotal)} has already been refunded.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order & Payment Info */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">Order ID</span>
              <span className="text-sm font-semibold text-blue-900">
                #{order?.order_number || 'N/A'}
              </span>
            </div>
            {order?.table_number && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 font-medium">Table</span>
                <span className="text-sm font-semibold text-blue-900">
                  Table {order.table_number}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">Payment Method</span>
              <span className="text-sm font-semibold text-blue-900">
                {paymentMethodDisplay[order?.payment_method] || order?.payment_method || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-blue-200">
              <span className="text-sm text-blue-700 font-medium">Order Total</span>
              <span className="text-lg font-bold text-blue-900">
                {formatCurrency(orderTotal)}
              </span>
            </div>
            {alreadyRefunded > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-700 font-medium">Already Refunded</span>
                  <span className="text-sm font-semibold text-orange-900">
                    - {formatCurrency(alreadyRefunded)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                  <span className="text-sm text-emerald-700 font-medium">Available to Refund</span>
                  <span className="text-lg font-bold text-emerald-900">
                    {formatCurrency(refundableAmount)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Refund Type Selection */}
        {!isFullyRefunded && (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCcw className="w-4 h-4" />
                  <span>Refund Type *</span>
                </div>
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="refundType"
                    value="full"
                    checked={refundType === 'full'}
                    onChange={(e) => setRefundType(e.target.value)}
                    disabled={isProcessing}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-4 focus:ring-blue-500/20"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">Full Refund</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(refundableAmount)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Refund the entire {alreadyRefunded > 0 ? 'remaining' : ''} amount
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="refundType"
                    value="partial"
                    checked={refundType === 'partial'}
                    onChange={(e) => setRefundType(e.target.value)}
                    disabled={isProcessing}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-4 focus:ring-blue-500/20"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900">Partial Refund</span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Specify a custom refund amount
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Partial Amount Input */}
            {refundType === 'partial' && (
              <div className="space-y-2">
                <label htmlFor="partialAmount" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Refund Amount *</span>
                  </div>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    ₹
                  </span>
                  <input
                    id="partialAmount"
                    type="number"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    max={refundableAmount}
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    disabled={isProcessing}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Maximum: {formatCurrency(refundableAmount)}
                </p>
              </div>
            )}

            {/* Refund Reason */}
            <div className="space-y-2">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Refund Reason *</span>
                </div>
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none bg-white cursor-pointer"
                disabled={isProcessing}
              >
                <option value="">Select a refund reason...</option>
                {refundReasons.map((reasonOption) => (
                  <option key={reasonOption.value} value={reasonOption.value}>
                    {reasonOption.icon} {reasonOption.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refund Method */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Refund Method *</span>
                </div>
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="refundMethod"
                    value="original_method"
                    checked={refundMethod === 'original_method'}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    disabled={isProcessing}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-4 focus:ring-blue-500/20"
                  />
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Original Payment Method</span>
                      <p className="text-xs text-gray-600">
                        Reverse to {paymentMethodDisplay[order?.payment_method] || 'original method'}
                      </p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="refundMethod"
                    value="cash"
                    checked={refundMethod === 'cash'}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    disabled={isProcessing}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-4 focus:ring-blue-500/20"
                  />
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Cash Refund</span>
                      <p className="text-xs text-gray-600">
                        Give cash to customer immediately
                      </p>
                    </div>
                  </div>
                </label>

                {(order?.payment_method === 'razorpay' || order?.payment_method === 'upi' || order?.payment_method === 'card') && (
                  <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                    <input
                      type="radio"
                      name="refundMethod"
                      value="online"
                      checked={refundMethod === 'online'}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      disabled={isProcessing}
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-4 focus:ring-blue-500/20"
                    />
                    <div className="flex items-center gap-2">
                      <RefreshCcw className="w-5 h-5 text-purple-600" />
                      <div>
                        <span className="text-sm font-semibold text-gray-900">Online Reversal</span>
                        <p className="text-xs text-gray-600">
                          Process through payment gateway (3-7 days)
                        </p>
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Refund Summary */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border-2 border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-900">Refund Summary</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">Refund Amount:</span>
                  <span className="text-lg font-bold text-emerald-900">
                    {formatCurrency(refundAmount)}
                  </span>
                </div>
                {refundType === 'partial' && (
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                    <span className="text-sm text-emerald-700">Remaining Balance:</span>
                    <span className="text-sm font-semibold text-emerald-900">
                      {formatCurrency(refundableAmount - refundAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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
          {!isFullyRefunded && (
            <button
              type="button"
              onClick={handleConfirmRefund}
              disabled={!isValid || isProcessing}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Process Refund</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Helper Text */}
        {!isFullyRefunded && (
          <p className="text-xs text-center text-gray-500">
            {refundMethod === 'online' 
              ? 'Online refunds may take 3-7 business days to reflect in customer account'
              : 'Refund will be processed immediately'}
          </p>
        )}
      </div>
    </Modal>
  );
}
