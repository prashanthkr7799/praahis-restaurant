import React, { useState, useEffect } from 'react';
import { X, Activity, ShoppingCart, MessageSquare, Edit, Clock } from 'lucide-react';
import { supabase } from '@config/supabase';
import toast from 'react-hot-toast';

/**
 * StaffActivityModal Component
 * Display staff member activity logs and recent actions
 */
const StaffActivityModal = ({ isOpen, onClose, staff, restaurantId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && staff?.id) {
      loadActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, staff]);

  const loadActivity = async () => {
    setLoading(true);
    try {
      // Try to fetch from auth_activity_logs
      const { data: logs, error: logsError } = await supabase
        .from('auth_activity_logs')
        .select('*')
        .eq('user_id', staff.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsError && logsError.code !== 'PGRST116') {
        throw logsError;
      }

      // Fetch orders completed by this staff member
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total, order_status, created_at, updated_at')
        .eq('restaurant_id', restaurantId)
        .in('order_status', ['served', 'completed'])
        .order('updated_at', { ascending: false })
        .limit(10);

      if (ordersError && ordersError.code !== 'PGRST116') {
        throw ordersError;
      }

      // Combine and format activities
      const combinedActivities = [];

      // Add log activities
      if (logs && logs.length > 0) {
        logs.forEach((log) => {
          combinedActivities.push({
            id: log.id,
            type: 'log',
            action: log.action || 'Activity',
            description: log.metadata?.details
              ? JSON.stringify(log.metadata.details)
              : 'Performed action',
            timestamp: log.created_at,
            icon: Activity,
          });
        });
      }

      // Add order activities
      if (orders && orders.length > 0) {
        orders.forEach((order) => {
          combinedActivities.push({
            id: order.id,
            type: 'order',
            action: 'Order Completed',
            description: `Order #${order.order_number} - ${order.order_status}`,
            timestamp: order.updated_at,
            icon: ShoppingCart,
          });
        });
      }

      // Sort by timestamp
      combinedActivities.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setActivities(combinedActivities.slice(0, 20));
    } catch (error) {
      console.error('Error loading activity:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activity) => {
    if (activity.type === 'order') return ShoppingCart;
    if (activity.action?.toLowerCase().includes('message')) return MessageSquare;
    if (activity.action?.toLowerCase().includes('update')) return Edit;
    return Activity;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {staff?.avatar_url ? (
              <img
                src={staff.avatar_url}
                alt={staff.full_name || staff.name}
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-white/10">
                <span className="text-base font-bold text-white">
                  {staff?.full_name?.[0] || staff?.name?.[0] || '?'}
                </span>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-white">
                {staff?.full_name || staff?.name}
              </h2>
              <p className="text-sm text-zinc-400">
                {staff?.role || 'Staff'} • Activity Log
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {loading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 bg-white/5 rounded-xl animate-pulse"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && activities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No Activity Yet
              </h3>
              <p className="text-zinc-400">
                This staff member hasn't performed any tracked actions yet.
              </p>
            </div>
          )}

          {/* Activity Timeline */}
          {!loading && activities.length > 0 && (
            <div className="space-y-3">
              {activities.map((activity, index) => {
                const Icon = getActivityIcon(activity);
                return (
                  <div
                    key={activity.id + index}
                    className="flex gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white mb-1">
                        {activity.action}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span className="text-xs text-zinc-500">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffActivityModal;
