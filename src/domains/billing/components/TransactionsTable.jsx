import React from 'react';
import { Eye, Receipt, Clock, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatINR, formatRelativeTime } from '../utils/billingUtils';

/**
 * TRANSACTIONS TABLE COMPONENT
 * Displays paginated list of all payments with:
 * - Payment ID / Transaction ID
 * - Order Number
 * - Table Number
 * - Payment Method
 * - Amount
 * - Status
 * - Timestamp
 * - Actions (View Invoice)
 */

const TransactionsTable = ({ payments, loading, onViewInvoice }) => {
  const [displayCount, setDisplayCount] = React.useState(20);

  const visiblePayments = React.useMemo(() => {
    return payments.slice(0, displayCount);
  }, [payments, displayCount]);

  const hasMore = payments.length > displayCount;

  const loadMore = () => {
    setDisplayCount((prev) => prev + 20);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      paid: {
        icon: CheckCircle,
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
        label: 'Paid',
      },
      completed: {
        icon: CheckCircle,
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
        label: 'Completed',
      },
      success: {
        icon: CheckCircle,
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
        label: 'Success',
      },
      pending: {
        icon: Clock,
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
        label: 'Pending',
      },
      failed: {
        icon: XCircle,
        className: 'bg-red-500/20 text-red-400 border-red-500/50',
        label: 'Failed',
      },
      refunded: {
        icon: AlertCircle,
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        label: 'Refunded',
      },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`
          inline-flex items-center gap-1.5 px-3 py-1
          rounded-full text-xs font-medium border
          ${config.className}
        `}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Payment method badge component
  const PaymentMethodBadge = ({ method }) => {
    const methodConfig = {
      cash: {
        icon: '💵',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        label: 'Cash',
      },
      online: {
        icon: '💳',
        className: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        label: 'Online',
      },
      split: {
        icon: '🔀',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        label: 'Split',
      },
    };

    const config = methodConfig[method?.toLowerCase()] || {
      icon: '❓',
      className: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
      label: method || 'N/A',
    };

    return (
      <span
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1
          rounded-lg text-xs font-medium border
          ${config.className}
        `}
      >
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-12">
        <div className="text-center">
          <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Transactions Found</h3>
          <p className="text-gray-400">
            No payment transactions match your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-800/50 border-b border-gray-700/50 px-6 py-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-purple-400" />
          Transactions
          <span className="text-sm text-gray-400 font-normal">
            ({payments.length} total)
          </span>
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/30 border-b border-gray-700/50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Payment ID
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Order
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Table
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Method
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Time
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {visiblePayments.map((payment) => (
              <tr
                key={payment.id}
                className="hover:bg-gray-800/30 transition-colors"
              >
                {/* Payment ID */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-300 font-mono">
                      {payment.id?.substring(0, 8)}...
                    </span>
                  </div>
                </td>

                {/* Order Number */}
                <td className="px-6 py-4">
                  <span className="text-sm text-white font-medium">
                    #{payment.order_number || payment.order?.order_number || 'N/A'}
                  </span>
                </td>

                {/* Table Number */}
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-300">
                    {payment.table_number || payment.order?.table_number || 'N/A'}
                  </span>
                </td>

                {/* Payment Method */}
                <td className="px-6 py-4">
                  <PaymentMethodBadge method={payment.payment_method} />
                </td>

                {/* Amount */}
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-emerald-400">
                    {formatINR(payment.amount)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <StatusBadge status={payment.status} />
                </td>

                {/* Timestamp */}
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-400">
                    {formatRelativeTime(payment.created_at)}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <button
                    onClick={() => onViewInvoice(payment)}
                    className="
                      inline-flex items-center gap-1.5 px-3 py-1.5
                      bg-purple-500/10 border border-purple-500/30
                      rounded-lg
                      text-purple-400 text-sm font-medium
                      hover:bg-purple-500/20 hover:border-purple-500/50
                      transition-all
                    "
                  >
                    <Eye className="w-4 h-4" />
                    Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="border-t border-gray-700/50 p-4 text-center">
          <button
            onClick={loadMore}
            className="
              px-6 py-2.5
              bg-gray-800/50 border border-gray-700/50
              rounded-lg
              text-gray-300 font-medium
              hover:bg-gray-700/50 hover:border-purple-500/50
              transition-all
            "
          >
            Load More ({payments.length - displayCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;
