/**
 * SuperAdmin Realtime Hook
 * Provides realtime subscriptions for SuperAdmin dashboard with
 * reconnection handling, seq/version reconciliation, and optimistic updates.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabaseOwner } from '@shared/services/api/ownerApi';
import logger from '@shared/utils/logger';

/**
 * Hook for subscribing to realtime database changes
 * @param {Object} config - Configuration object
 * @param {string} config.channelName - Unique channel name
 * @param {Array} config.subscriptions - Array of subscription configs
 * @param {Function} config.onEvent - Callback when event received
 * @param {Function} config.onReconnect - Callback when reconnected
 * @param {boolean} config.enabled - Whether subscription is active
 * @returns {Object} - { isConnected, lastEventTime, reconnect }
 */
export function useSuperadminRealtime({
  channelName,
  subscriptions = [],
  onEvent,
  onReconnect,
  enabled = true,
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState(null);
  const channelRef = useRef(null);
  const lastSeqRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  // Handle incoming events with idempotency check
  const handleEvent = useCallback((payload, subscription) => {
    const eventTime = new Date().toISOString();
    setLastEventTime(eventTime);

    // Track sequence for reconciliation
    const eventSeq = payload.commit_timestamp || Date.now();
    if (eventSeq <= lastSeqRef.current) {
      logger.log('[Realtime] Duplicate event ignored:', eventSeq);
      return;
    }
    lastSeqRef.current = eventSeq;

    // Call user's event handler
    if (onEvent) {
      onEvent({
        type: payload.eventType,
        table: subscription.table,
        schema: subscription.schema || 'public',
        new: payload.new,
        old: payload.old,
        timestamp: eventTime,
        seq: eventSeq,
      });
    }
  }, [onEvent]);

  // Setup channel subscription
  const setupChannel = useCallback(() => {
    if (!enabled || subscriptions.length === 0) return;

    // Cleanup existing channel
    if (channelRef.current) {
      supabaseOwner.removeChannel(channelRef.current);
    }

    // Create new channel
    let channel = supabaseOwner.channel(channelName);

    // Add subscriptions
    subscriptions.forEach((sub) => {
      channel = channel.on(
        'postgres_changes',
        {
          event: sub.event || '*',
          schema: sub.schema || 'public',
          table: sub.table,
          filter: sub.filter,
        },
        (payload) => handleEvent(payload, sub)
      );
    });

    // Subscribe with status tracking
    channel.subscribe((status) => {
      logger.log(`[Realtime] Channel ${channelName} status:`, status);
      
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        
        // Handle reconnection
        if (lastEventTime && onReconnect) {
          logger.log('[Realtime] Reconnected, fetching missed events since:', lastEventTime);
          onReconnect(lastEventTime);
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        
        // Auto-reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectTimeoutRef.current || 0), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          logger.log('[Realtime] Attempting reconnection...');
          setupChannel();
        }, delay);
      }
    });

    channelRef.current = channel;
  }, [channelName, subscriptions, enabled, handleEvent, lastEventTime, onReconnect]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setupChannel();
  }, [setupChannel]);

  // Setup effect
  useEffect(() => {
    setupChannel();

    return () => {
      if (channelRef.current) {
        supabaseOwner.removeChannel(channelRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [setupChannel]);

  return {
    isConnected,
    lastEventTime,
    reconnect,
  };
}

/**
 * Pre-configured hook for SuperAdmin Dashboard realtime updates
 */
export function useDashboardRealtime({ onUpdate, enabled = true }) {
  return useSuperadminRealtime({
    channelName: 'superadmin-dashboard',
    subscriptions: [
      { table: 'orders', event: '*' },
      { table: 'payments', event: '*' },
      { table: 'restaurants', event: '*' },
      { table: 'subscriptions', event: '*' },
      { table: 'billing', event: '*' },
    ],
    onEvent: onUpdate,
    enabled,
  });
}

/**
 * Pre-configured hook for Audit Logs realtime updates
 */
export function useAuditLogsRealtime({ onNewLog, enabled = true }) {
  return useSuperadminRealtime({
    channelName: 'superadmin-audit',
    subscriptions: [
      { table: 'audit_trail', event: 'INSERT' },
    ],
    onEvent: (event) => {
      if (event.type === 'INSERT' && event.new) {
        onNewLog(event.new);
      }
    },
    enabled,
  });
}

// Alias for convenience
export const useAuditRealtime = (onUpdate, enabled = true) => {
  return useSuperadminRealtime({
    channelName: 'superadmin-audit-simple',
    subscriptions: [
      { table: 'audit_trail', event: '*' },
    ],
    onEvent: () => onUpdate?.(),
    onReconnect: () => onUpdate?.(),
    enabled,
  });
};

/**
 * Pre-configured hook for Billing realtime updates
 */
export function useBillingRealtime(onUpdate, enabled = true) {
  return useSuperadminRealtime({
    channelName: 'superadmin-billing',
    subscriptions: [
      { table: 'billing', event: '*' },
      { table: 'payments', event: 'INSERT' },
    ],
    onEvent: () => onUpdate?.(),
    onReconnect: () => onUpdate?.(),
    enabled,
  });
}

/**
 * Pre-configured hook for Restaurants realtime updates
 */
export function useRestaurantsRealtime(onUpdate, enabled = true) {
  return useSuperadminRealtime({
    channelName: 'superadmin-restaurants',
    subscriptions: [
      { table: 'restaurants', event: '*' },
      { table: 'subscriptions', event: 'UPDATE' },
    ],
    onEvent: () => onUpdate?.(),
    onReconnect: () => onUpdate?.(),
    enabled,
  });
}

export default useSuperadminRealtime;
