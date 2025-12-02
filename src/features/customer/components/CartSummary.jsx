import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, X } from 'lucide-react';
// eslint-disable-next-line no-unused-vars -- motion is used as motion.div in JSX
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, calculateSubtotal, calculateTax, calculateTotal } from '@features/orders/utils/orderHelpers';

const CartSummary = ({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout, onClose, isProcessing = false }) => {
  const subtotal = calculateSubtotal(cartItems);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <ShoppingCart className="h-16 w-16 text-gray-600" />
        <p className="mt-4 text-gray-400">Your cart is empty</p>
        <p className="mt-2 text-sm text-gray-500">Add some delicious items to get started!</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-bold text-white">Your Cart</h2>
          <span className="rounded-full bg-orange-500 px-2 py-1 text-xs font-bold text-white">
            {cartItems.length}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded-full p-2 hover:bg-gray-700 lg:hidden transition-colors touch-manipulation"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-900/30">
        <AnimatePresence>
          {cartItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mb-3 rounded-lg border border-gray-700 bg-gray-800 p-3">
              <div className="flex gap-3">
                {/* Item image */}
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-700">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">
                      🍽️
                    </div>
                  )}
                </div>

                {/* Item details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{item.name}</h3>
                      {item.notes && (
                        <p className="mt-1 text-xs text-gray-400">Note: {item.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      className="rounded p-1 text-red-400 hover:bg-red-500/20 transition-colors touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(item.id, item.quantity - 1);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors touch-manipulation"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-semibold text-white tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(item.id, item.quantity + 1);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white hover:brightness-110 transition-all touch-manipulation"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="font-bold text-yellow-400 tabular-nums">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="border-t border-gray-700 bg-gray-900 p-4">
        <div className="mb-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="font-semibold text-white tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Tax (5%)</span>
            <span className="font-semibold text-white tabular-nums">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-700 pt-2 text-lg font-bold">
            <span className="text-white">Total</span>
            <span className="text-yellow-400 tabular-nums">₹{formatCurrency(total).replace('₹', '')}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={isProcessing}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isProcessing) {
              onCheckout();
            }
          }}
          onTouchEnd={(e) => {
            // Ensure mobile tap triggers checkout as well
            e.preventDefault();
            e.stopPropagation();
            if (!isProcessing) {
              onCheckout();
            }
          }}
          className={`w-full rounded-xl px-6 py-3 font-semibold text-white transition-all shadow-lg touch-manipulation ${isProcessing ? 'bg-orange-500/60 cursor-not-allowed' : 'bg-orange-500 active:brightness-90 hover:brightness-110'}`}
        >
          {isProcessing ? 'Creating order…' : 'Proceed to Payment'}
        </button>
      </div>
    </div>
  );
};

export default CartSummary;
