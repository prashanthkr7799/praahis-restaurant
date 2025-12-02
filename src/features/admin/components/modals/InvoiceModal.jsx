import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Send, 
  Printer, 
  Building2, 
  Calendar, 
  CreditCard,
  CheckCircle,
  FileText,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import Button from '@shared/components/ui/Button';

/**
 * Professional Invoice Modal for SuperAdmin Dashboard
 * Generates and displays invoices with print/download/email options
 */
const InvoiceModal = ({ 
  isOpen, 
  onClose, 
  bill, 
  restaurant,
  onSendEmail,
  onMarkPaid 
}) => {
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const invoiceRef = useRef(null);

  if (!isOpen || !bill) return null;

  const RATE_PER_TABLE_PER_DAY = 75;
  
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

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleDownload = () => {
    // Create a simple text-based invoice for download
    const invoiceText = `
PRAAHIS INVOICE
=====================================
Invoice Number: ${bill.invoice_number || 'N/A'}
Date: ${formatDate(bill.created_at)}
Due Date: ${formatDate(bill.due_date)}

BILLED TO:
${restaurant?.name || bill.restaurants?.name || 'Restaurant'}
${restaurant?.address || 'Address not provided'}
${restaurant?.email || ''}

BILLING PERIOD:
${getMonthName(bill.billing_month)} ${bill.billing_year}

DESCRIPTION:
Platform Subscription Fee
${bill.table_count || '-'} Tables × ₹${RATE_PER_TABLE_PER_DAY}/day × ${bill.days_in_month || 30} days

AMOUNT: ${formatCurrency(bill.total_amount)}

STATUS: ${bill.status?.toUpperCase()}
${bill.paid_at ? `Paid on: ${formatDate(bill.paid_at)}` : ''}

=====================================
Thank you for your business!
Praahis Restaurant Management Platform
support@praahis.com
    `.trim();

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${bill.invoice_number || bill.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    if (!onSendEmail) return;
    setSending(true);
    try {
      await onSendEmail(bill);
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!onMarkPaid) return;
    setMarking(true);
    try {
      await onMarkPaid(bill.id);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Invoice #{bill.invoice_number || bill.id.slice(0, 8)}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getMonthName(bill.billing_month)} {bill.billing_year}
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

        {/* Invoice Content */}
        <div ref={invoiceRef} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Company Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">PRAAHIS</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Restaurant Management Platform
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                support@praahis.com
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                bill.status === 'paid' 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : bill.status === 'overdue'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {bill.status === 'paid' && <CheckCircle className="w-4 h-4" />}
                {bill.status?.charAt(0).toUpperCase() + bill.status?.slice(1)}
              </div>
            </div>
          </div>

          {/* Bill To & Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Bill To
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {restaurant?.name || bill.restaurants?.name || 'Restaurant'}
                  </span>
                </div>
                {(restaurant?.address || bill.restaurants?.address) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {restaurant?.address || bill.restaurants?.address}
                    </span>
                  </div>
                )}
                {(restaurant?.email || bill.restaurants?.email) && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {restaurant?.email || bill.restaurants?.email}
                    </span>
                  </div>
                )}
                {(restaurant?.phone || bill.restaurants?.phone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {restaurant?.phone || bill.restaurants?.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Invoice Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Invoice Number:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {bill.invoice_number || `INV-${bill.id.slice(0, 8).toUpperCase()}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Invoice Date:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(bill.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Due Date:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(bill.due_date)}
                  </span>
                </div>
                {bill.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Paid Date:</span>
                    <span className="text-sm text-emerald-600 dark:text-emerald-400">
                      {formatDate(bill.paid_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Billing Period */}
          <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Billing Period
              </span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {getMonthName(bill.billing_month)} {bill.billing_year}
            </p>
          </div>

          {/* Line Items Table */}
          <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Platform Subscription Fee
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {bill.table_count} Tables × {bill.days_in_month || 30} days
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-gray-900 dark:text-white">
                    {bill.table_count || '-'}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-900 dark:text-white">
                    {formatCurrency(bill.rate_per_table_per_day || RATE_PER_TABLE_PER_DAY)}/day
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(bill.base_amount || bill.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                <span className="text-gray-900 dark:text-white">
                  {formatCurrency(bill.base_amount || bill.total_amount)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(bill.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              Payment Information
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Please make payment by the due date to avoid service interruption. 
              For any queries, contact support@praahis.com
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          <div className="flex items-center gap-2">
            {bill.status !== 'paid' && onMarkPaid && (
              <Button
                variant="success"
                icon={CheckCircle}
                onClick={handleMarkAsPaid}
                loading={marking}
              >
                Mark as Paid
              </Button>
            )}
            {onSendEmail && (
              <Button
                variant="primary"
                icon={Send}
                onClick={handleSendEmail}
                loading={sending}
              >
                Send Invoice
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
