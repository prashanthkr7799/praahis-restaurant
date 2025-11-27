import React, { useState } from 'react';
import { 
  AlertCircle, 
  Bell, 
  Info, 
  RefreshCw, 
  ShoppingBag, 
  CreditCard, 
  Settings, 
  Users,
  Phone,
  Eye,
  UtensilsCrossed,
  MessageSquare,
  Star,
  X,
  Check
} from 'lucide-react';
import {
  formatTimeAgo,
  priorityBadgeClasses,
  getActionButton,
  actionButtonClasses,
  parseNotificationData,
  getNotificationPriority,
} from '../utils/notificationUtils';

// Icon mapping
const IconMap = {
  AlertCircle,
  Bell,
  Info,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Settings,
  Users,
  Phone,
  Eye,
  UtensilsCrossed,
  MessageSquare,
  Star,
};

/**
 * NotificationCard Component
 * Displays individual notification with priority badge, actions, and dismiss button
 */
const NotificationCard = ({ notification, onDismiss, onAction }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const data = parseNotificationData(notification.data);
  const priority = getNotificationPriority(notification);
  const actionButton = data.action_type ? getActionButton(data.action_type) : null;

  // Get priority icon
  const getPriorityIcon = () => {
    const iconMap = {
      urgent: 'AlertCircle',
      attention: 'Bell',
      info: 'Info',
      update: 'RefreshCw',
    };
    return iconMap[priority] || 'Bell';
  };

  const PriorityIcon = IconMap[getPriorityIcon()];
  const ActionIcon = actionButton ? IconMap[actionButton.icon] : null;

  // Handle dismiss with animation
  const handleDismiss = async () => {
    setIsAnimatingOut(true);
    
    // Wait for animation to complete
    setTimeout(async () => {
      if (onDismiss) {
        await onDismiss(notification.id);
      }
    }, 300);
  };

  // Handle action button click
  const handleAction = () => {
    if (onAction && data.action_type) {
      onAction(notification, data);
    }
  };

  return (
    <div
      className={`
        notification-card relative
        bg-white dark:bg-gray-800 
        border-l-4 
        ${priority === 'urgent' ? 'border-red-500' : ''}
        ${priority === 'attention' ? 'border-amber-500' : ''}
        ${priority === 'info' ? 'border-green-500' : ''}
        ${priority === 'update' ? 'border-blue-500' : ''}
        ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
        rounded-lg shadow-sm hover:shadow-md
        transition-all duration-300
        ${isAnimatingOut ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        p-4 mb-3
      `}
    >
      {/* Unread indicator dot */}
      {!notification.is_read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}

      {/* Header: Badge and Timestamp */}
      <div className="flex items-start justify-between mb-2">
        <span className={priorityBadgeClasses(priority)}>
          <PriorityIcon className="w-3 h-3" />
          {priority.toUpperCase()}
        </span>
        
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatTimeAgo(notification.created_at)}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
        {notification.title}
      </h4>

      {/* Body */}
      {notification.body && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {notification.body}
        </p>
      )}

      {/* Additional data display */}
      {data.table_number && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          📍 Table {data.table_number}
        </div>
      )}
      {data.order_number && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          🧾 Order #{data.order_number}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3">
        {/* Primary Action Button */}
        {actionButton && (
          <button
            onClick={handleAction}
            className={actionButtonClasses(actionButton.color)}
          >
            {ActionIcon && <ActionIcon className="w-4 h-4 inline mr-1" />}
            {actionButton.label}
          </button>
        )}

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="
            px-3 py-1.5 rounded-lg text-sm font-medium
            bg-gray-200 dark:bg-gray-700 
            text-gray-700 dark:text-gray-300
            hover:bg-gray-300 dark:hover:bg-gray-600
            transition-all hover:scale-105 active:scale-95
            flex items-center gap-1
          "
        >
          {notification.is_read ? (
            <>
              <X className="w-4 h-4" />
              Dismiss
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Mark Read
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationCard;
