import React, { useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '@shared/utils/api/supabaseClient';

const CallWaiterButton = ({ tableNumber, restaurantId }) => {
  const [called, setCalled] = useState(false);

  const handleCallWaiter = async () => {
    // In production, this would send a real notification to waiter
    // Send a realtime broadcast to waiter dashboard
    try {
      const channelName = restaurantId ? `waiter-alerts-${restaurantId}` : 'waiter-alerts';
      const channel = supabase.channel(channelName);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'call_waiter',
            payload: {
              tableNumber: tableNumber || 'Unknown',
              at: new Date().toISOString(),
              restaurantId: restaurantId || null,
            },
          });
          // Auto cleanup after a short delay
          setTimeout(() => {
            supabase.removeChannel(channel);
          }, 3000);
        }
      });
    } catch (e) {
      console.error('Failed to send waiter alert:', e);
    }

    // Local feedback for customer
    setCalled(true);
    toast.success('Waiter has been notified! 🔔', {
      icon: '👨‍🍳',
      duration: 3000,
    });

    // Reset after 30 seconds
    setTimeout(() => {
      setCalled(false);
    }, 30000);
  };

  return (
    <Motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCallWaiter}
      disabled={called}
      className={`fixed bottom-4 right-4 z-50 p-3.5 rounded-full shadow-2xl transition-all duration-300 ${
        called
          ? 'bg-green-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-orange-500/50'
      }`}
      aria-label="Call waiter"
    >
      <AnimatePresence mode="wait">
        {called ? (
          <Motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
          >
            <CheckCircle className="w-5 h-5 text-white" />
          </Motion.div>
        ) : (
          <Motion.div
            key="bell"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            whileHover={{ rotate: [0, -15, 15, -15, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Bell className="w-5 h-5 text-white" />
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.button>
  );
};

export default CallWaiterButton;
