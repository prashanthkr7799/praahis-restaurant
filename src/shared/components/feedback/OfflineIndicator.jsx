/**
 * OfflineIndicator Component
 * Shows when the app is offline and handles reconnection
 */

import React from 'react';
import PropTypes from 'prop-types';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';
import { useNetworkStatus, useServiceWorkerUpdate } from '@shared/hooks/useNetworkStatus';

const OfflineIndicator = ({ position = 'bottom' }) => {
  const { online, offline, wasOffline, clearOfflineFlag } = useNetworkStatus();
  const { updateAvailable, reloadApp } = useServiceWorkerUpdate();

  // Show reconnected message briefly
  React.useEffect(() => {
    if (online && wasOffline) {
      const timer = setTimeout(clearOfflineFlag, 3000);
      return () => clearTimeout(timer);
    }
  }, [online, wasOffline, clearOfflineFlag]);

  const positionClasses = {
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0',
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Nothing to show
  if (online && !wasOffline && !updateAvailable) {
    return null;
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 pointer-events-none`}
      role="status"
      aria-live="polite"
    >
      {/* Offline Banner */}
      {offline && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 pointer-events-auto shadow-lg">
          <WifiOff className="w-5 h-5" aria-hidden="true" />
          <span className="font-medium">You&apos;re offline</span>
          <span className="text-amber-100 text-sm">Some features may be unavailable</span>
        </div>
      )}

      {/* Reconnected Toast */}
      {online && wasOffline && (
        <div className="flex justify-center p-4 pointer-events-auto">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg animate-fade-in">
            <Wifi className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">Back online</span>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {updateAvailable && (
        <div className="bg-blue-500 text-white px-4 py-2 flex items-center justify-center gap-3 pointer-events-auto shadow-lg">
          <RefreshCw className="w-5 h-5" aria-hidden="true" />
          <span className="font-medium">A new version is available</span>
          <button
            onClick={reloadApp}
            className="bg-white text-blue-500 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Update Now
          </button>
        </div>
      )}
    </div>
  );
};

OfflineIndicator.propTypes = {
  position: PropTypes.oneOf(['top', 'bottom', 'top-right', 'bottom-right']),
};

/**
 * OfflineFallback Component
 * Full-page fallback when critical functionality needs network
 */
export const OfflineFallback = ({
  title = 'No internet connection',
  message = 'Please check your connection and try again.',
  onRetry,
}) => {
  const { online } = useNetworkStatus();

  // Auto-retry when back online
  React.useEffect(() => {
    if (online && onRetry) {
      onRetry();
    }
  }, [online, onRetry]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-amber-500" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            Try Again
          </button>
        )}

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">Waiting for connection...</p>
      </div>
    </div>
  );
};

OfflineFallback.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
};

export default OfflineIndicator;
