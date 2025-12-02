import { useState, useEffect } from 'react';
import { XCircle, AlertTriangle, FileText, RefreshCcw, AlertCircle } from 'lucide-react';
import Modal from '@shared/components/ui/Modal';
import { formatCurrency } from '@shared/utils/formatters';

/**
 * CancelOrderModal Component
 * 
 * Modal for canceling orders with reason and optional refund.
 * Shows warning message and requires reason selection.
 * 
 * @param {Object} props
 * @param {Object} props.order - Order object with payment info
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirmCancel - Confirmation callback with cancel data
 */
export function CancelOrderModal({ order, isOpen, onClose, onConfirmCancel }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [requiresRefund, setRequiresRefund] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if order has been paid
  const isPaid = order?.payment_status === 'paid' || order?.paymentStatus === 'paid';
  const orderAmount = parseFloat(order?.total || 0);
  
  // Check if order is served - cannot be cancelled
  const isServed = order?.status === 'served' || order?.order_status === 'served';

  // Cancellation reason options
  const cancellationReasons = [
    { value: 'customer_request', label: 'Customer Requested Cancellation', icon: '🙋' },
    { value: 'unavailable_items', label: 'Items Not Available', icon: '❌' },
    { value: 'kitchen_delay', label: 'Kitchen Delay/Overload', icon: '⏰' },
    { value: 'wrong_order', label: 'Wrong Order Placed', icon: '🔄' },
    { value: 'payment_issue', label: 'Payment Issue', icon: '💳' },
    { value: 'duplicate_order', label: 'Duplicate Order', icon: '📋' },
    { value: 'quality_concern', label: 'Quality Concerns', icon: '⚠️' },
    { value: 'customer_no_show', label: 'Customer No-Show', icon: '👻' },
    { value: 'staff_error', label: 'Staff Error', icon: '🔧' },
    { value: 'other', label: 'Other Reason', icon: '📝' }
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setNotes('');
      setRequiresRefund(false);
      setError('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Real-time validation
  useEffect(() => {
    if (!reason) {
      setError('');
      return;
    }

    setError('');
  }, [reason, notes]);

  const validateCancellation = () => {
    if (!reason) {
      return 'Please select a cancellation reason';
    }
    
    // Prevent cancellation if order is served
    if (isServed) {
      return 'Cannot cancel an order that has already been served';
    }

    return null;
  };

  const handleConfirmCancel = async () => {
    const validationError = validateCancellation();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 600));

      // Return cancellation data
      onConfirmCancel({
        orderId: order?.id,
        reason,
        notes: notes.trim() || null,
        refund: isPaid && requiresRefund,
        refundAmount: isPaid && requiresRefund ? orderAmount : null,
        cancelledAt: new Date().toISOString()
      });

      onClose();
    } catch (err) {
      console.error('Error canceling order:', err);
      setError('Failed to cancel order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValid = !validateCancellation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Order"
      size="md"
    >
      <div className="space-y-6">
        {/* Served Order Warning - Cannot Cancel */}
        {isServed && (
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-900">
                  Cannot Cancel Served Order
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  This order has already been served to the customer and cannot be cancelled. 
                  Please contact support if a refund is needed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning Banner */}
        {!isServed && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border-2 border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  Warning: This action cannot be undone
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Canceling this order will permanently mark it as cancelled. Please ensure this is the correct action.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Info */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Order ID</span>
              <span className="text-sm font-semibold text-gray-900">
                #{order?.id || 'N/A'}
              </span>
            </div>
            {order?.table_number && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Table</span>
                <span className="text-sm font-semibold text-gray-900">
                  Table {order.table_number}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Amount</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(orderAmount)}
              </span>
            </div>
            {isPaid && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm text-emerald-600 font-medium">Payment Status</span>
                <span className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full">
                  PAID
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Reason Dropdown */}
        <div className="space-y-2">
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span>Cancellation Reason *</span>
            </div>
          </label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all appearance-none bg-white cursor-pointer"
            disabled={isProcessing || isServed}
          >
            <option value="">Select a cancellation reason...</option>
            {cancellationReasons.map((reasonOption) => (
              <option key={reasonOption.value} value={reasonOption.value}>
                {reasonOption.icon} {reasonOption.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notes Textarea */}
        <div className="space-y-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Additional Notes (Optional)</span>
            </div>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional context or information about the cancellation..."
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 resize-none transition-all"
            disabled={isProcessing || isServed}
            maxLength={300}
          />
          <div className="flex justify-end">
            <span className="text-xs text-gray-500">
              {notes.length}/300
            </span>
          </div>
        </div>

        {/* Refund Checkbox (only if paid) */}
        {isPaid && (
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-amber-200">
            <div className="flex items-start gap-3">
              <RefreshCcw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Refund Required?
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      This order has been paid. Check if refund should be processed.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-3 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresRefund}
                    onChange={(e) => setRequiresRefund(e.target.checked)}
                    disabled={isProcessing || isServed}
                    className="w-5 h-5 text-amber-600 border-2 border-amber-300 rounded focus:ring-4 focus:ring-amber-500/20 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-amber-900">
                    Process refund of {formatCurrency(orderAmount)}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Checklist */}
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-xs font-semibold text-red-900 mb-2">
            Please confirm:
          </p>
          <ul className="space-y-1.5 text-xs text-red-800">
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">•</span>
              <span>You have verified this is the correct order to cancel</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">•</span>
              <span>The customer has been informed (if applicable)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-0.5">•</span>
              <span>Kitchen has been notified to stop preparation</span>
            </li>
            {isPaid && requiresRefund && (
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span>Refund will be processed through the original payment method</span>
              </li>
            )}
          </ul>
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
            {isServed ? 'Close' : 'Keep Order'}
          </button>
          {!isServed && (
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={!isValid || isProcessing}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-orange-600 rounded-xl hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Canceling...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Confirm Cancellation</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Helper Text */}
        <p className="text-xs text-center text-gray-500">
          Order status will be updated immediately upon confirmation
        </p>
      </div>
    </Modal>
  );
}
