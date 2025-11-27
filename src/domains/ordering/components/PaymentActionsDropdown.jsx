/**
 * PaymentActionsDropdown Component
 * Dropdown menu for payment actions: Cash, Online, and Split payments
 * Fully responsive with smooth animations and mobile-friendly positioning
 */

import React, { useState, useRef, useEffect } from 'react';
import { Banknote, CreditCard, Split, ChevronDown } from 'lucide-react';

const PaymentActionsDropdown = ({ onAction, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle action selection
  const handleAction = (actionType) => {
    setIsOpen(false);
    if (onAction) {
      onAction(actionType);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-center gap-2 px-3 py-2.5 
          rounded-lg font-semibold text-sm transition-all w-full
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 hover:scale-105'
          }
        `}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <CreditCard className="w-4 h-4" />
        <span className="hidden sm:inline">Mark Paid</span>
        <span className="sm:hidden">Pay</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu - Mobile optimized positioning */}
      {isOpen && (
        <div 
          className="
            absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 sm:w-72
            bg-white rounded-xl shadow-2xl 
            border border-gray-200 
            overflow-hidden z-50
            animate-fade-in
          "
        >
          <div className="py-2">
            {/* Full Cash Payment Option */}
            <button
              onClick={() => handleAction('cash')}
              className="
                w-full flex items-center gap-3 px-4 py-3.5
                text-left text-sm font-medium text-gray-700
                hover:bg-emerald-50 hover:text-emerald-700
                transition-colors active:bg-emerald-100
              "
            >
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900">Full Cash Payment</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Accept cash payment with change calculation
                </div>
              </div>
            </button>

            {/* Divider */}
            <div className="h-px bg-gray-100 my-1.5" />

            {/* Full Online Payment Option */}
            <button
              onClick={() => handleAction('online')}
              className="
                w-full flex items-center gap-3 px-4 py-3.5
                text-left text-sm font-medium text-gray-700
                hover:bg-blue-50 hover:text-blue-700
                transition-colors active:bg-blue-100
              "
            >
              <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900">Full Online Payment</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  UPI, Card, PhonePe, Paytm, or Gateway
                </div>
              </div>
            </button>

            {/* Divider */}
            <div className="h-px bg-gray-100 my-1.5" />

            {/* Split Payment Option */}
            <button
              onClick={() => handleAction('split')}
              className="
                w-full flex items-center gap-3 px-4 py-3.5
                text-left text-sm font-medium text-gray-700
                hover:bg-purple-50 hover:text-purple-700
                transition-colors active:bg-purple-100
              "
            >
              <div className="p-2.5 rounded-lg bg-purple-100 text-purple-600 flex-shrink-0">
                <Split className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900">Split Payment</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Combine cash + online payment methods
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { PaymentActionsDropdown };
