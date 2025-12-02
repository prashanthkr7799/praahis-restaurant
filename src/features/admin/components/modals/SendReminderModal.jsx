import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Mail, 
  Send,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Building2,
  MessageSquare
} from 'lucide-react';
import Button from '@shared/components/ui/Button';

/**
 * Send Reminder Modal for Billing
 * Allows sending payment reminders via email to restaurants
 */
const SendReminderModal = ({ 
  isOpen, 
  onClose, 
  bill, 
  restaurant,
  onSend 
}) => {
  const [sending, setSending] = useState(false);
  const [reminderType, setReminderType] = useState('payment_due');
  const [customMessage, setCustomMessage] = useState('');
  const [includeInvoice, setIncludeInvoice] = useState(true);

  if (!isOpen || !bill) return null;

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const reminderTypes = [
    {
      id: 'payment_due',
      title: 'Payment Due Reminder',
      description: 'Gentle reminder that payment is due soon',
      icon: Clock,
      color: 'amber'
    },
    {
      id: 'overdue',
      title: 'Overdue Payment Notice',
      description: 'Payment is past due date',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      id: 'final_notice',
      title: 'Final Notice',
      description: 'Last reminder before service suspension',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      id: 'thank_you',
      title: 'Payment Received',
      description: 'Thank you for your payment',
      icon: CheckCircle,
      color: 'green'
    }
  ];

  const getEmailPreview = () => {
    const restaurantName = restaurant?.name || bill.restaurants?.name || 'Restaurant';
    const period = `${getMonthName(bill.billing_month)} ${bill.billing_year}`;
    const amount = formatCurrency(bill.total_amount);
    const dueDate = formatDate(bill.due_date);

    switch (reminderType) {
      case 'payment_due':
        return {
          subject: `Payment Reminder: ${period} Subscription`,
          body: `Dear ${restaurantName},

This is a friendly reminder that your subscription payment of ${amount} for ${period} is due on ${dueDate}.

Please make the payment at your earliest convenience to ensure uninterrupted service.

${customMessage ? `\nNote: ${customMessage}\n` : ''}
${includeInvoice ? 'Invoice attached.' : ''}

Thank you for being a valued Praahis partner!

Best regards,
Praahis Team`
        };

      case 'overdue':
        return {
          subject: `⚠️ Overdue Payment: ${period} Subscription`,
          body: `Dear ${restaurantName},

Your subscription payment of ${amount} for ${period} was due on ${dueDate} and is now overdue.

Please make the payment immediately to avoid any service interruptions.

${customMessage ? `\nNote: ${customMessage}\n` : ''}
${includeInvoice ? 'Invoice attached.' : ''}

If you have already made the payment, please disregard this notice.

Best regards,
Praahis Team`
        };

      case 'final_notice':
        return {
          subject: `🚨 Final Notice: Subscription Payment Required`,
          body: `Dear ${restaurantName},

URGENT: This is a final notice regarding your overdue payment of ${amount} for ${period}.

Your subscription will be suspended within 48 hours if payment is not received.

To avoid service interruption, please make the payment immediately.

${customMessage ? `\nNote: ${customMessage}\n` : ''}
${includeInvoice ? 'Invoice attached.' : ''}

Contact support@praahis.com if you need assistance.

Best regards,
Praahis Team`
        };

      case 'thank_you':
        return {
          subject: `✅ Payment Received: ${period} Subscription`,
          body: `Dear ${restaurantName},

Thank you! We have received your payment of ${amount} for ${period}.

Your subscription is now active and up to date.

${customMessage ? `\nNote: ${customMessage}\n` : ''}
${includeInvoice ? 'Receipt attached.' : ''}

Thank you for being a valued Praahis partner!

Best regards,
Praahis Team`
        };

      default:
        return { subject: '', body: '' };
    }
  };

  const handleSend = async () => {
    if (!onSend) return;
    
    setSending(true);
    try {
      const emailContent = getEmailPreview();
      await onSend({
        billId: bill.id,
        restaurantId: bill.restaurant_id,
        type: reminderType,
        subject: emailContent.subject,
        body: emailContent.body,
        includeInvoice,
        customMessage
      });
      onClose();
    } catch (error) {
      console.error('Failed to send reminder:', error);
    } finally {
      setSending(false);
    }
  };

  const emailPreview = getEmailPreview();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Send Reminder
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {restaurant?.name || bill.restaurants?.name} - {getMonthName(bill.billing_month)} {bill.billing_year}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Options */}
            <div className="space-y-6">
              {/* Reminder Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Reminder Type
                </label>
                <div className="space-y-2">
                  {reminderTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = reminderType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setReminderType(type.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          type.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30' :
                          type.color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
                          'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            type.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                            type.color === 'red' ? 'text-red-600 dark:text-red-400' :
                            'text-green-600 dark:text-green-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${
                            isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                          }`}>
                            {type.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {type.description}
                          </p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personal note to the email..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Options */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="includeInvoice"
                  checked={includeInvoice}
                  onChange={(e) => setIncludeInvoice(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="includeInvoice" className="text-sm text-gray-700 dark:text-gray-300">
                  Attach invoice to email
                </label>
              </div>

              {/* Bill Summary */}
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Bill Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {bill.invoice_number || `INV-${bill.id.slice(0, 8)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(bill.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Due Date:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDate(bill.due_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-medium ${
                      bill.status === 'paid' ? 'text-green-600' :
                      bill.status === 'overdue' ? 'text-red-600' :
                      'text-amber-600'
                    }`}>
                      {bill.status?.charAt(0).toUpperCase() + bill.status?.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Email Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Email Preview
              </label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Email Header */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">To:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {restaurant?.email || bill.restaurants?.email || 'restaurant@email.com'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Subject:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {emailPreview.subject}
                    </span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-4 bg-white dark:bg-gray-900 min-h-[300px]">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                    {emailPreview.body}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            icon={Send}
            onClick={handleSend}
            loading={sending}
          >
            Send Reminder
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendReminderModal;
