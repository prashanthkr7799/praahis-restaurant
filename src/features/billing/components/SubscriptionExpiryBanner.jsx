import React from 'react';
import { AlertTriangle, Clock, CreditCard } from 'lucide-react';

const SubscriptionExpiryBanner = ({ daysRemaining, expiresAt, plan, onUpgrade }) => {
  if (!daysRemaining || daysRemaining > 7) return null;

  const isUrgent = daysRemaining <= 3;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 ${
        isUrgent
          ? 'bg-red-600 dark:bg-red-700'
          : 'bg-orange-500 dark:bg-orange-600'
      } text-white shadow-lg`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {isUrgent ? (
              <AlertTriangle className="h-6 w-6 flex-shrink-0" />
            ) : (
              <Clock className="h-6 w-6 flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold">
                {isUrgent
                  ? `⚠️ Trial Expiring in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}!`
                  : `Your ${plan} plan expires soon`}
              </p>
              <p className="text-sm opacity-90">
                Expires on {formatDate(expiresAt)}. Upgrade now to continue using the platform.
              </p>
            </div>
          </div>

          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="flex items-center gap-2 px-6 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold shadow-md"
            >
              <CreditCard className="h-4 w-4" />
              Upgrade Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiryBanner;
