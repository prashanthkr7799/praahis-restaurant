import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CreditCard, Clock } from 'lucide-react';

/**
 * SubscriptionExpiredScreen
 * Full-page lock screen shown when subscription is suspended/expired
 * Netflix-style: Clean, clear, with renewal CTA
 */
const SubscriptionExpiredScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { status, message, daysRemaining } = location.state || {};

  const getStatusConfig = (currentStatus) => {
    switch (currentStatus) {
      case 'suspended':
        return {
          icon: <Lock className="h-20 w-20 text-red-600" />,
          title: 'Subscription Suspended',
          description: 'Your subscription has been suspended due to non-payment. All restaurant services are currently disabled.',
          color: 'red',
          actionText: 'Renew Now'
        };
      case 'grace':
        return {
          icon: <AlertCircle className="h-20 w-20 text-orange-600" />,
          title: 'Payment Overdue',
          description: `Your subscription has expired. You have ${daysRemaining || 0} day(s) remaining before your account is suspended.`,
          color: 'orange',
          actionText: 'Pay Now'
        };
      case 'expired':
        return {
          icon: <Clock className="h-20 w-20 text-gray-600" />,
          title: 'Subscription Expired',
          description: 'Your trial or subscription period has ended. Renew to continue using Praahis.',
          color: 'gray',
          actionText: 'Renew Subscription'
        };
      default:
        return {
          icon: <Lock className="h-20 w-20 text-gray-600" />,
          title: 'Access Restricted',
          description: message || 'Please renew your subscription to continue.',
          color: 'gray',
          actionText: 'Contact Support'
        };
    }
  };

  const config = getStatusConfig(status);

  const handleRenew = () => {
    // Navigate to payment page or show payment modal
    navigate('/payment', { state: { from: location } });
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@praahis.com?subject=Subscription Renewal';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          {config.icon}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {config.title}
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {config.description}
          </p>

          {/* Pricing Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="text-sm text-gray-500 mb-2">Subscription Plan</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ₹35,000<span className="text-lg text-gray-500">/month</span>
            </div>
            <div className="text-sm text-gray-500">+ ₹5,000 one-time setup fee (if applicable)</div>
          </div>

          {/* Features */}
          <div className="text-left mb-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-1.5 w-1.5 bg-orange-600 rounded-full" />
              <span>Full restaurant management system</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-1.5 w-1.5 bg-orange-600 rounded-full" />
              <span>QR-based digital menu & ordering</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-1.5 w-1.5 bg-orange-600 rounded-full" />
              <span>Custom branding & deployment</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-1.5 w-1.5 bg-orange-600 rounded-full" />
              <span>24/7 support & maintenance</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRenew}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors`}
            >
              <CreditCard className="h-5 w-5" />
              {config.actionText}
            </button>

            <button
              onClick={handleContactSupport}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Contact Support
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-6">
            Questions? Email us at{' '}
            <a href="mailto:support@praahis.com" className="text-orange-600 hover:underline">
              support@praahis.com
            </a>
          </p>
        </div>

        {/* Data Safety Notice */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <Lock className="h-4 w-4 inline mr-1" />
          Your data is safe. Renew anytime to restore full access.
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiredScreen;
