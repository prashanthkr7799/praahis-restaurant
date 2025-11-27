import React, { useState, useEffect } from 'react';
import { X, Send, Phone, Edit2, MessageSquare, CheckCircle } from 'lucide-react';
import Modal from '@shared/components/compounds/Modal';

/**
 * TakeawayNotificationModal
 * 
 * Modal for sending SMS notifications to customers for takeaway orders
 * Features:
 * - Preview SMS message with order details
 * - Edit phone number if needed
 * - Send notification button
 * - Success/error feedback
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.order - Order object with customer details
 * @param {Function} props.onSend - Callback when notification is sent
 */
const TakeawayNotificationModal = ({ isOpen, onClose, order, onSend }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Initialize phone number from order
  useEffect(() => {
    if (order?.customer_phone) {
      setPhoneNumber(order.customer_phone);
    }
  }, [order]);

  // Generate SMS message
  const generateMessage = () => {
    if (!order) return '';
    
    const customerName = order.customer_name || 'Customer';
    const orderNumber = order.order_number || 'N/A';
    const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'Our Restaurant';
    
    return `Hi ${customerName}! Your takeaway order #${orderNumber} is ready for pickup at ${restaurantName}. Thank you! 😊`;
  };

  // Handle send notification
  const handleSend = async () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.trim() === '') {
      setError('Please enter a valid phone number');
      return;
    }

    // Basic phone number validation (10 digits for India)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Phone number must be at least 10 digits');
      return;
    }

    setSending(true);
    setError('');

    try {
      // Call the onSend callback
      if (onSend) {
        await onSend({
          orderId: order.id,
          phoneNumber: cleanPhone,
          message: generateMessage()
        });
      }
      
      // Close modal on success
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  // Format phone number for display
  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
    }
    return phone;
  };

  if (!order) return null;

  const message = generateMessage();
  const characterCount = message.length;
  const smsCount = Math.ceil(characterCount / 160);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Customer Notification">
      <div className="space-y-6">
        {/* Order Info */}
        <div className="bg-zinc-800 rounded-xl p-4 border border-white/10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-white">
                Order #{order.order_number}
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                {order.customer_name || 'Customer'}
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-bold border border-purple-500/30">
              Takeaway
            </span>
          </div>
          
          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Customer Phone
            </label>
            
            {isEditingPhone ? (
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="flex-1 px-4 py-2 bg-zinc-900 border border-white/20 rounded-lg text-white placeholder:text-zinc-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  autoFocus
                />
                <button
                  onClick={() => setIsEditingPhone(false)}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-white font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-white/10">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-zinc-400" />
                  <span className="text-white font-medium">
                    {formatPhoneDisplay(phoneNumber) || 'No phone number'}
                  </span>
                </div>
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Edit phone number"
                >
                  <Edit2 className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              SMS Preview
            </label>
            <span className="text-xs text-zinc-500">
              {characterCount} chars • {smsCount} SMS
            </span>
          </div>
          
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-4 border border-white/10">
            <p className="text-white leading-relaxed whitespace-pre-wrap">
              {message}
            </p>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            💡 This message will be sent via SMS to the customer's phone number. 
            Make sure the phone number is correct before sending.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !phoneNumber}
            className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send Notification</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export { TakeawayNotificationModal };
