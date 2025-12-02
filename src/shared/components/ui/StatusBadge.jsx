/**
 * StatusBadge Component
 * Specialized badge for order and payment statuses
 */

import React from 'react';
import { getStatusColor, formatOrderStatus, formatPaymentStatus } from '@shared/utils/formatters';

const StatusBadge = ({ status, type = 'order' }) => {
  const displayStatus = type === 'order' 
    ? formatOrderStatus(status) 
    : formatPaymentStatus(status);
  
  const colorClass = getStatusColor(status, type);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-sm font-medium border rounded-full ${colorClass}`}
    >
      {displayStatus}
    </span>
  );
};

export default StatusBadge;
