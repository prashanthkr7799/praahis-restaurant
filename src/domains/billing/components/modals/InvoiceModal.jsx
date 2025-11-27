import React from 'react';
import { X, Printer, Download, Receipt, Store, Calendar } from 'lucide-react';
import { formatINR, calculateTotal } from '../../utils/billingUtils';

/**
 * INVOICE MODAL COMPONENT
 * Displays detailed invoice with:
 * - Restaurant info
 * - Invoice/Payment ID
 * - Order details
 * - Itemized list
 * - Discount, Tax, Total breakdown
 * - Payment method
 * - Print/Download functionality
 */

const InvoiceModal = ({ isOpen, onClose, payment, restaurant }) => {
  const invoiceRef = React.useRef(null);

  // Calculate totals
  const orderTotals = React.useMemo(() => {
    if (!payment || !payment.order) {
      return {
        subtotal: payment?.amount || 0,
        tax: 0,
        discount: 0,
        total: payment?.amount || 0,
      };
    }
    return calculateTotal(payment.order);
  }, [payment]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger browser's print to PDF
    window.print();
  };

  if (!isOpen || !payment) return null;

  const order = payment.order || {};
  const items = order.items || [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Container */}
        <div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Only visible on screen, not in print */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Invoice</h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="
                  flex items-center gap-2 px-3 py-2
                  bg-gray-800 border border-gray-700
                  rounded-lg
                  text-gray-300 text-sm font-medium
                  hover:bg-gray-700 hover:border-purple-500/50
                  transition-all
                "
              >
                <Printer className="w-4 h-4" />
                Print
              </button>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="
                  flex items-center gap-2 px-3 py-2
                  bg-gray-800 border border-gray-700
                  rounded-lg
                  text-gray-300 text-sm font-medium
                  hover:bg-gray-700 hover:border-emerald-500/50
                  transition-all
                "
              >
                <Download className="w-4 h-4" />
                PDF
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Invoice Content - Printable */}
          <div ref={invoiceRef} className="p-8 bg-white print:p-12">
            {/* Restaurant Header */}
            <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Store className="w-8 h-8 text-gray-800" />
                <h1 className="text-3xl font-bold text-gray-800">
                  {restaurant?.name || 'Restaurant Name'}
                </h1>
              </div>
              {restaurant?.address && (
                <p className="text-gray-600 text-sm">{restaurant.address}</p>
              )}
              {restaurant?.phone && (
                <p className="text-gray-600 text-sm">Phone: {restaurant.phone}</p>
              )}
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                  Invoice Information
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Invoice #:</span>{' '}
                    <span className="font-mono">{payment.id?.substring(0, 12)}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Order #:</span>{' '}
                    {order.order_number || 'N/A'}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Table:</span>{' '}
                    {order.table_number || payment.table_number || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                  Payment Details
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Date:</span>{' '}
                    {new Date(payment.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Time:</span>{' '}
                    {new Date(payment.created_at).toLocaleTimeString('en-IN')}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Method:</span>{' '}
                    <span className="capitalize font-semibold">
                      {payment.payment_method || 'N/A'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
                Order Items
              </h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="text-left py-2 text-xs font-semibold text-gray-700 uppercase">
                      Item
                    </th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-700 uppercase">
                      Qty
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-700 uppercase">
                      Price
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-700 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-3 text-sm text-gray-800">
                          {item.name || item.item_name || 'Item'}
                        </td>
                        <td className="py-3 text-sm text-gray-600 text-center">
                          {item.quantity || 1}
                        </td>
                        <td className="py-3 text-sm text-gray-600 text-right">
                          {formatINR(item.price || 0)}
                        </td>
                        <td className="py-3 text-sm text-gray-800 font-medium text-right">
                          {formatINR((item.price || 0) * (item.quantity || 1))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-gray-500 text-sm">
                        No items available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2">
                {/* Subtotal */}
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm text-gray-800 font-medium">
                    {formatINR(orderTotals.subtotal)}
                  </span>
                </div>

                {/* Discount */}
                {orderTotals.discount > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Discount:</span>
                    <span className="text-sm text-emerald-600 font-medium">
                      -{formatINR(orderTotals.discount)}
                    </span>
                  </div>
                )}

                {/* Tax */}
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Tax (5% GST):</span>
                  <span className="text-sm text-gray-800 font-medium">
                    {formatINR(orderTotals.tax)}
                  </span>
                </div>

                {/* Total */}
                <div className="flex justify-between py-3 border-t-2 border-gray-800">
                  <span className="text-base font-bold text-gray-800">Total:</span>
                  <span className="text-lg font-bold text-gray-800">
                    {formatINR(payment.amount || orderTotals.total)}
                  </span>
                </div>

                {/* Payment Status */}
                <div className="pt-2">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide">
                      Payment Status
                    </p>
                    <p className="text-sm text-emerald-800 font-bold mt-1 capitalize">
                      {payment.status || 'Completed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t-2 border-gray-800 pt-6">
              <p className="text-lg font-semibold text-gray-800 mb-2">
                Thank you for your business!
              </p>
              <p className="text-sm text-gray-600">
                Please visit us again soon.
              </p>
            </div>

            {/* Print-only footer */}
            <div className="hidden print:block mt-8 text-center text-xs text-gray-500">
              <p>This is a computer-generated invoice.</p>
              <p>Printed on {new Date().toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          ${invoiceRef.current && `
            #invoice-content,
            #invoice-content * {
              visibility: visible;
            }
            #invoice-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          `}
        }
      `}</style>
    </>
  );
};

export default InvoiceModal;
