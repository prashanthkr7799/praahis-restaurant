/**
 * CashPaymentModal Component
 * Modal for accepting cash payments with change calculation
 * Features: denominations helper, change calculation, print receipt option
 * Validates that cash received is sufficient for the order total
 */

import React, { useState, useEffect } from 'react';
import { Banknote, AlertCircle, CheckCircle, Calculator, Printer, X } from 'lucide-react';
import Modal from '@shared/components/compounds/Modal';
import { formatCurrency } from '@shared/utils/helpers/formatters';

const CashPaymentModal = ({ order, isOpen, onClose, onSuccess }) => {
  const [cashReceived, setCashReceived] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDenominations, setShowDenominations] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);

  // Common denominations
  const denominations = [2000, 500, 200, 100, 50, 20, 10];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCashReceived('');
      setError('');
      setIsProcessing(false);
      setShowDenominations(false);
      setPrintReceipt(true);
    }
  }, [isOpen]);

  // Calculate change
  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0;
    const total = order?.total || order?.total_amount || 0;
    return received - total;
  };

  // Validation
  const validatePayment = () => {
    const received = parseFloat(cashReceived);
    const total = order?.total || order?.total_amount || 0;

    if (!cashReceived || cashReceived.trim() === '') {
      setError('Please enter amount received');
      return false;
    }

    if (isNaN(received) || received <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (received < total) {
      setError(`Amount must be at least ${formatCurrency(total)}`);
      return false;
    }

    setError('');
    return true;
  };

  // Handle input change
  const handleCashReceivedChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCashReceived(value);
      setError('');
    }
  };

  // Handle denomination click
  const handleDenominationClick = (amount) => {
    const orderTotal = order?.total || order?.total_amount || 0;
    const currentValue = parseFloat(cashReceived) || 0;
    const newValue = currentValue + amount;
    setCashReceived(newValue.toString());
    setError('');
    
    // Auto-hide denominations if amount is sufficient
    if (newValue >= orderTotal) {
      setTimeout(() => setShowDenominations(false), 300);
    }
  };

  // Quick set exact amount
  const handleExactAmount = () => {
    const orderTotal = order?.total || order?.total_amount || 0;
    setCashReceived(orderTotal.toString());
    setError('');
  };

  // Handle confirm payment
  const handleConfirm = async () => {
    if (!validatePayment()) return;

    setIsProcessing(true);
    
    try {
      const received = parseFloat(cashReceived);
      const total = order?.total || order?.total_amount || 0;
      const change = received - total;

      const paymentData = {
        method: 'cash',
        amount: total,
        cashReceived: received,
        change: change,
        printReceipt: printReceipt,
      };

      // Call success callback
      await onSuccess(paymentData);
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Cash payment error:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleConfirm();
    }
  };

  const orderTotal = order?.total || order?.total_amount || 0;
  const change = calculateChange();
  const isValid = cashReceived && parseFloat(cashReceived) >= orderTotal;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cash Payment"
      size="sm"
    >
      <div className="space-y-6">
        {/* Order Total Display */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Order Total</span>
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              <span className="text-2xl font-bold text-gray-900 font-mono">
                {formatCurrency(orderTotal)}
              </span>
            </div>
          </div>
          {order?.order_number && (
            <div className="text-xs text-gray-500">
              Order #{order.order_number}
            </div>
          )}
        </div>

        {/* Cash Received Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label 
              htmlFor="cashReceived" 
              className="block text-sm font-semibold text-gray-700"
            >
              Cash Received <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowDenominations(!showDenominations)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{showDenominations ? 'Hide' : 'Show'} Helper</span>
            </button>
          </div>
          
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-400">
              ₹
            </span>
            <input
              id="cashReceived"
              type="text"
              inputMode="decimal"
              value={cashReceived}
              onChange={handleCashReceivedChange}
              onKeyPress={handleKeyPress}
              placeholder="0.00"
              disabled={isProcessing}
              className={`
                w-full pl-12 pr-4 py-4 text-2xl font-mono font-bold
                border-2 rounded-xl transition-all
                focus:outline-none focus:ring-4
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${error 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                  : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-100'
                }
              `}
              autoFocus
            />
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Denominations Helper */}
          {showDenominations && (
            <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Quick Add</span>
                <button
                  type="button"
                  onClick={() => setShowDenominations(false)}
                  className="text-emerald-600 hover:text-emerald-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {denominations.map((denom) => (
                  <button
                    key={denom}
                    type="button"
                    onClick={() => handleDenominationClick(denom)}
                    disabled={isProcessing}
                    className="px-3 py-2 text-sm font-bold text-emerald-700 bg-white border-2 border-emerald-300 rounded-lg hover:bg-emerald-100 hover:border-emerald-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ₹{denom}
                  </button>
                ))}
                
                {/* Exact Amount Button */}
                <button
                  type="button"
                  onClick={handleExactAmount}
                  disabled={isProcessing}
                  className="col-span-4 px-3 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Exact Amount
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Change Calculation */}
        {isValid && change >= 0 && (
          <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">
                  Change to Return
                </span>
              </div>
              <span className="text-2xl font-bold text-emerald-700 font-mono">
                {formatCurrency(change)}
              </span>
            </div>
          </div>
        )}

        {/* Print Receipt Option */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={printReceipt}
                onChange={(e) => setPrintReceipt(e.target.checked)}
                disabled={isProcessing}
                className="
                  w-5 h-5 rounded border-2 border-gray-400
                  text-emerald-600 focus:ring-4 focus:ring-emerald-100
                  transition-all cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                  Print Receipt
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Generate and print a receipt for this cash payment
              </p>
            </div>
          </label>
        </div>

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
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
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
          Press Enter to confirm • Esc to cancel
        </div>
      </div>
    </Modal>
  );
};

export { CashPaymentModal };
