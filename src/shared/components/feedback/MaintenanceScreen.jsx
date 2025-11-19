import React from 'react';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

const MaintenanceScreen = ({ title, message, estimatedDuration, startTime }) => {
  const formatTime = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-8 text-white">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="p-4 bg-white bg-opacity-20 rounded-full">
                <AlertTriangle className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">
              {title || 'System Maintenance'}
            </h1>
            <p className="text-center text-orange-100 text-lg">
              We'll be back shortly
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Message */}
            <div className="text-center">
              <p className="text-gray-700 text-lg leading-relaxed">
                {message || 'We are currently performing scheduled maintenance. The system will be back online shortly.'}
              </p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {startTime && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Started At</h3>
                  </div>
                  <p className="text-blue-700 text-sm">{formatTime(startTime)}</p>
                </div>
              )}

              {estimatedDuration && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <RefreshCw className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Estimated Duration</h3>
                  </div>
                  <p className="text-purple-700 text-sm">
                    {estimatedDuration >= 60 
                      ? `${Math.floor(estimatedDuration / 60)} hour${Math.floor(estimatedDuration / 60) > 1 ? 's' : ''}`
                      : `${estimatedDuration} minutes`}
                  </p>
                </div>
              )}
            </div>

            {/* What You Can Do */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">What you can do:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>Wait a few minutes and try refreshing this page</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>Check our social media for updates</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>Contact support if the issue persists</span>
                </li>
              </ul>
            </div>

            {/* Refresh Button */}
            <div className="text-center pt-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="font-semibold">Refresh Page</span>
              </button>
            </div>

            {/* Footer Note */}
            <div className="text-center text-sm text-gray-500 pt-4">
              We apologize for any inconvenience. Thank you for your patience!
            </div>
          </div>
        </div>

        {/* Animated Loader */}
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Praahis Logo/Branding */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">Powered by <span className="font-bold text-orange-600">Praahis</span></p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
