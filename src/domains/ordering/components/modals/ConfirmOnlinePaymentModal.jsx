/**
 * ConfirmOnlinePaymentModal Component
 * Modal for online payments with QR code display and UPI ID
 * Features: QR code, UPI ID copy, gateway selection, transaction ID
 * Requires verification checkbox to ensure payment is confirmed
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, AlertCircle, CheckCircle, Smartphone, 
  Copy, Check, QrCode, ExternalLink 
} from 'lucide-react';
import QRCode from 'react-qr-code';
import Modal from '@shared/components/compounds/Modal';
import { formatCurrency } from '@shared/utils/helpers/formatters';

const ConfirmOnlinePaymentModal = ({ order, isOpen, onClose, onSuccess }) => {
  const [transactionId, setTransactionId] = useState('');
  const [gateway, setGateway] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);

  // UPI Configuration (replace with your actual UPI details)
  const UPI_ID = import.meta.env.VITE_UPI_ID || 'restaurant@paytm';
  const MERCHANT_NAME = import.meta.env.VITE_MERCHANT_NAME || 'Restaurant Name';

  // Payment gateway options
  const paymentGateways = [
    'UPI',
    'Razorpay',
    'PhonePe',
    'Paytm',
    'Google Pay',
    'Other'
  ];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTransactionId('');
      setGateway('');
      setIsVerified(false);
      setError('');
      setIsProcessing(false);
      setShowQRCode(false);
      setCopiedUPI(false);
    }
  }, [isOpen]);

  // Generate UPI payment string
  const generateUPIString = () => {
    const orderTotal = order?.total || order?.total_amount || 0;
    const orderNumber = order?.order_number || 'ORDER';
    return `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${orderTotal}&cu=INR&tn=${encodeURIComponent(`Payment for ${orderNumber}`)}`;
  };

  // Copy UPI ID to clipboard
  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopiedUPI(true);
      setTimeout(() => setCopiedUPI(false), 2000);
    } catch (err) {
      console.error('Failed to copy UPI ID:', err);
    }
  };

  // Validation
  const validatePayment = () => {
    if (!gateway) {
      setError('Please select a payment gateway');
      return false;
    }

    if (!isVerified) {
      setError('Please verify that payment has been received');
      return false;
    }

    setError('');
    return true;
  };

  // Handle confirm payment
  const handleConfirm = async () => {
    if (!validatePayment()) return;

    setIsProcessing(true);

    try {
      const orderTotal = order?.total || order?.total_amount || 0;

      const paymentData = {
        method: 'online',
        amount: orderTotal,
        transactionId: transactionId.trim() || null,
        gateway: gateway,
      };

      // Call success callback
      await onSuccess(paymentData);

      // Close modal
      onClose();
    } catch (err) {
      console.error('Online payment confirmation error:', err);
      setError('Failed to confirm payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle checkbox change
  const handleVerifyChange = (e) => {
    setIsVerified(e.target.checked);
    if (e.target.checked) {
      setError('');
    }
  };

  const orderTotal = order?.total || order?.total_amount || 0;
  const isValid = gateway && isVerified;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Online Payment"
      size="sm"
    >
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">Order Total</span>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-900 font-mono">
                {formatCurrency(orderTotal)}
              </span>
            </div>
          </div>
          {order?.order_number && (
            <div className="text-xs text-blue-600">
              Order #{order.order_number}
            </div>
          )}
        </div>

        {/* QR Code Section */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-700" />
              <span className="text-sm font-bold text-purple-900">Scan to Pay</span>
            </div>
            <button
              type="button"
              onClick={() => setShowQRCode(!showQRCode)}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 transition-colors"
            >
              {showQRCode ? 'Hide QR' : 'Show QR'}
            </button>
          </div>

          {showQRCode && (
            <div className="space-y-3">
              {/* QR Code Display */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCode
                  value={generateUPIString()}
                  size={200}
                  level="H"
                  className="border-4 border-white shadow-lg"
                />
              </div>

              {/* UPI ID with Copy Button */}
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-gray-600 block mb-1">
                      UPI ID:
                    </span>
                    <span className="text-sm font-mono font-bold text-gray-900 block truncate">
                      {UPI_ID}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUPI}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                      transition-all flex-shrink-0
                      ${copiedUPI
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
                      }
                    `}
                  >
                    {copiedUPI ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Open in UPI App Button */}
              <a
                href={generateUPIString()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in UPI App</span>
              </a>
            </div>
          )}
        </div>

        {/* Payment Gateway Selection */}
        <div>
          <label 
            htmlFor="gateway" 
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Payment Gateway <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              id="gateway"
              value={gateway}
              onChange={(e) => {
                setGateway(e.target.value);
                setError('');
              }}
              disabled={isProcessing}
              className={`
                w-full pl-11 pr-4 py-3 text-sm font-medium
                border-2 rounded-xl transition-all
                focus:outline-none focus:ring-4
                appearance-none bg-white
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${error && !gateway
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                }
              `}
            >
              <option value="">Select payment gateway...</option>
              {paymentGateways.map((gw) => (
                <option key={gw} value={gw}>
                  {gw}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Transaction ID (Optional) */}
        <div>
          <label 
            htmlFor="transactionId" 
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Transaction ID <span className="text-xs text-gray-500">(Optional)</span>
          </label>
          <input
            id="transactionId"
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter transaction ID if available"
            disabled={isProcessing}
            className="
              w-full px-4 py-3 text-sm font-mono
              border-2 border-gray-300 rounded-xl
              focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-100
              transition-all disabled:bg-gray-100 disabled:cursor-not-allowed
              placeholder:text-gray-400 placeholder:font-sans
            "
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Reference number from payment gateway (if available)
          </p>
        </div>

        {/* Verification Checkbox */}
        <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={isVerified}
                onChange={handleVerifyChange}
                disabled={isProcessing}
                className="
                  w-5 h-5 rounded border-2 border-amber-400
                  text-amber-600 focus:ring-4 focus:ring-amber-100
                  transition-all cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-amber-900 group-hover:text-amber-800 transition-colors">
                Payment verified from gateway
              </span>
              <p className="text-xs text-amber-700 mt-1">
                I confirm that the payment has been successfully received and verified through the selected payment gateway.
              </p>
            </div>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Indicator (when valid) */}
        {isValid && !error && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Ready to confirm payment</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="
              flex-1 px-4 py-3 rounded-xl font-semibold text-sm
              bg-gray-100 text-gray-700 hover:bg-gray-200
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || isProcessing}
            className={`
              flex-1 px-4 py-3 rounded-xl font-semibold text-sm
              transition-all disabled:opacity-50 disabled:cursor-not-allowed
              ${isValid && !isProcessing
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              'Confirm Payment'
            )}
          </button>
        </div>

        {/* Helper Text */}
        <div className="text-xs text-center text-gray-500 -mt-2">
          Ensure payment is verified before confirming
        </div>
      </div>
    </Modal>
  );
};

export { ConfirmOnlinePaymentModal };
