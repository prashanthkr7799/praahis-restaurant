import React from 'react';
import { AlertCircle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * GracePeriodBanner
 * Warning banner shown when subscription is in grace period
 * Appears at top of dashboard
 */
export const GracePeriodBanner = ({ daysRemaining, onDismiss }) => {
  const navigate = useNavigate();

  const handleRenew = () => {
    navigate('/payment');
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-600 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900">
              Payment Overdue - {daysRemaining} Day{daysRemaining !== 1 ? 's' : ''} Until Suspension
            </h3>
            <p className="text-sm text-gray-700 mt-0.5">
              Your subscription has expired. Please renew now to avoid service interruption.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRenew}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium whitespace-nowrap"
          >
            Renew Now
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-2 text-gray-500 hover:text-gray-700 rounded"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * RenewalCountdown
 * Shows days remaining until subscription expires
 * Displayed on admin dashboard
 */
export const RenewalCountdown = ({ daysRemaining, status, endDate }) => {
  const navigate = useNavigate();

  const getColorClass = () => {
    if (daysRemaining <= 3) return 'bg-red-50 border-red-200 text-red-800';
    if (daysRemaining <= 7) return 'bg-orange-50 border-orange-200 text-orange-800';
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const getIcon = () => {
    if (daysRemaining <= 3) return <AlertCircle className="h-5 w-5" />;
    return <Clock className="h-5 w-5" />;
  };

  const handleRenew = () => {
    navigate('/payment');
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${getColorClass()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <div className="font-semibold">
              {status === 'trial' ? 'Trial Period' : 'Subscription'}
            </div>
            <div className="text-sm">
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
            </div>
            {endDate && (
              <div className="text-xs opacity-75 mt-1">
                Expires: {new Date(endDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            )}
          </div>
        </div>
        {status === 'trial' && (
          <button
            onClick={handleRenew}
            className="px-4 py-2 bg-white rounded-lg font-medium shadow-sm hover:shadow-md transition-shadow whitespace-nowrap"
          >
            Upgrade Now
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * TrialBanner
 * Banner shown during active trial period
 */
export const TrialBanner = ({ daysRemaining }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">
              Free Trial - {daysRemaining} Day{daysRemaining !== 1 ? 's' : ''} Remaining
            </h3>
            <p className="text-sm text-gray-700 mt-0.5">
              Upgrade to continue after your trial ends. ₹35,000/month
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/payment')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
};

/**
 * SubscriptionStatusBadge
 * Small badge to show subscription status
 */
export const SubscriptionStatusBadge = ({ status, compact = false }) => {
  const getConfig = (currentStatus) => {
    switch (currentStatus) {
      case 'trial':
        return { color: 'bg-blue-100 text-blue-800', label: 'Trial' };
      case 'active':
        return { color: 'bg-green-100 text-green-800', label: 'Active' };
      case 'grace':
        return { color: 'bg-orange-100 text-orange-800', label: 'Grace Period' };
      case 'suspended':
        return { color: 'bg-red-100 text-red-800', label: 'Suspended' };
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    }
  };

  const config = getConfig(status);

  if (compact) {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

export default GracePeriodBanner;
