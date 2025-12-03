/**
 * useNetworkStatus Hook
 * Monitors network connectivity and provides offline support
 */

import { useState, useEffect, useCallback } from 'react';
import { onNetworkChange, isOnline } from '@shared/utils/serviceWorker';

export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline());
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const cleanup = onNetworkChange((isOnline) => {
      setOnline(isOnline);

      if (!isOnline) {
        setWasOffline(true);
      }
    });

    return cleanup;
  }, []);

  const clearOfflineFlag = useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    online,
    offline: !online,
    wasOffline,
    clearOfflineFlag,
  };
}

/**
 * useServiceWorkerUpdate Hook
 * Detects when a new version is available
 */
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate);
    };
  }, []);

  const reloadApp = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    updateAvailable,
    reloadApp,
  };
}

export default useNetworkStatus;
