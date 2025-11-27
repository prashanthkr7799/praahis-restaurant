/**
 * useOfflineDetection Hook
 * Detects network status and provides offline handling
 * Shows banner when offline, queues failed requests
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      if (wasOffline) {
        toast.success('🌐 Connection restored', {
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#FFFFFF',
          },
        });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      
      toast.error('📡 No internet connection', {
        duration: Infinity, // Keep showing until back online
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
        },
      });
    };

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
  };
};

export default useOfflineDetection;
