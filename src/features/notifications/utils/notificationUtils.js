/**
 * Notification Utility Functions
 * Helper functions for notification system
 */

/**
 * Format timestamp to relative time (e.g., "2 minutes ago", "3 hours ago")
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';

  const now = Date.now();
  const past = new Date(timestamp).getTime();
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  
  // For older notifications, show date
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDay > 365 ? 'numeric' : undefined,
  });
};

/**
 * Truncate text to specified length with ellipsis
 */
export const truncate = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
};

/**
 * Get priority color based on notification type
 * urgent → red
 * attention → amber
 * info → green
 * update → blue
 */
export const priorityColor = (type) => {
  const colors = {
    urgent: 'red',
    attention: 'amber',
    info: 'green',
    update: 'blue',
    alert: 'red',
    order: 'blue',
    payment: 'amber',
    system: 'gray',
    staff: 'purple',
  };

  return colors[type] || 'gray';
};

/**
 * Get priority badge classes based on type
 */
export const priorityBadgeClasses = (type) => {
  const baseClasses = 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold uppercase';
  
  const colorMap = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    attention: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    alert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    order: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    payment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    system: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    staff: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return `${baseClasses} ${colorMap[type] || colorMap.system}`;
};

/**
 * Get icon for priority type (returns icon name for lucide-react)
 */
export const priorityIcon = (type) => {
  const iconMap = {
    urgent: 'AlertCircle',
    attention: 'Bell',
    info: 'Info',
    update: 'RefreshCw',
    alert: 'AlertCircle',
    order: 'ShoppingBag',
    payment: 'CreditCard',
    system: 'Settings',
    staff: 'Users',
  };

  return iconMap[type] || 'Bell';
};

/**
 * Get action button configuration based on action_type
 */
export const getActionButton = (actionType) => {
  const actions = {
    alert_waiter: {
      label: 'Alert Waiter',
      icon: 'Bell',
      color: 'blue',
    },
    call_customer: {
      label: 'Call Customer',
      icon: 'Phone',
      color: 'green',
    },
    view_order: {
      label: 'View Order',
      icon: 'Eye',
      color: 'purple',
    },
    view_menu: {
      label: 'View Menu',
      icon: 'UtensilsCrossed',
      color: 'amber',
    },
    view_complaint: {
      label: 'View Complaint',
      icon: 'MessageSquare',
      color: 'red',
    },
    view_feedback: {
      label: 'View Feedback',
      icon: 'Star',
      color: 'yellow',
    },
  };

  return actions[actionType] || null;
};

/**
 * Get action button classes
 */
export const actionButtonClasses = (color) => {
  const baseClasses = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95';
  
  const colorMap = {
    blue: 'bg-blue-500 text-white hover:bg-blue-600',
    green: 'bg-green-500 text-white hover:bg-green-600',
    purple: 'bg-purple-500 text-white hover:bg-purple-600',
    amber: 'bg-amber-500 text-white hover:bg-amber-600',
    red: 'bg-red-500 text-white hover:bg-red-600',
    yellow: 'bg-yellow-500 text-white hover:bg-yellow-600',
  };

  return `${baseClasses} ${colorMap[color] || colorMap.blue}`;
};

/**
 * Parse notification data JSON safely
 */
export const parseNotificationData = (data) => {
  if (!data) return {};
  if (typeof data === 'object') return data;
  
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse notification data:', e);
    return {};
  }
};

/**
 * Get notification priority from data
 */
export const getNotificationPriority = (notification) => {
  const data = parseNotificationData(notification.data);
  
  // Check if priority is explicitly set in data
  if (data.priority) {
    return data.priority;
  }

  // Infer priority from type
  const typeMap = {
    alert: 'urgent',
    order: 'attention',
    payment: 'attention',
    system: 'info',
    staff: 'update',
  };

  return typeMap[notification.type] || 'info';
};

/**
 * Check if notification should show action button
 */
export const hasActionButton = (notification) => {
  const data = parseNotificationData(notification.data);
  return !!data.action_type;
};

/**
 * Sort notifications by priority and date
 */
export const sortNotifications = (notifications) => {
  const priorityOrder = {
    urgent: 1,
    attention: 2,
    info: 3,
    update: 4,
  };

  return [...notifications].sort((a, b) => {
    const aPriority = getNotificationPriority(a);
    const bPriority = getNotificationPriority(b);

    // Sort by priority first
    if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    }

    // Then by date (newest first)
    return new Date(b.created_at) - new Date(a.created_at);
  });
};

/**
 * Filter notifications by search query
 */
export const filterNotifications = (notifications, query) => {
  if (!query || !query.trim()) return notifications;

  const lowerQuery = query.toLowerCase().trim();

  return notifications.filter((notification) => {
    const titleMatch = notification.title?.toLowerCase().includes(lowerQuery);
    const bodyMatch = notification.body?.toLowerCase().includes(lowerQuery);
    const typeMatch = notification.type?.toLowerCase().includes(lowerQuery);

    return titleMatch || bodyMatch || typeMatch;
  });
};

/**
 * Group notifications by date
 */
export const groupNotificationsByDate = (notifications) => {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.created_at);
    const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

    if (notifDay.getTime() === today.getTime()) {
      groups.today.push(notification);
    } else if (notifDay.getTime() === yesterday.getTime()) {
      groups.yesterday.push(notification);
    } else if (notifDate >= weekAgo) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
};
