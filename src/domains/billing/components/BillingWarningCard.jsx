/**
 * Billing Warning Card - Manager Dashboard
 * Shows payment status, due date, and suspension warning
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatCurrency } from '@shared/utils/helpers/formatters';

const BillingWarningCard = ({ restaurantId }) => {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBillingInfo = useCallback(async () => {
    try {
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      // Fetch latest bill for this restaurant
      const { data, error } = await supabase
        .from('billing')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('billing_period', { ascending: false })
        .limit(1);

      if (error) {
        // If table doesn't exist or RLS denies access, silently fail
        if (error.code === '42P01' || error.code === 'PGRST301') {
          console.warn('Billing table not accessible:', error.message);
          setLoading(false);
          return;
        }
        throw error;
      }

      // Set first record if exists, otherwise null
      setBilling(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Error fetching billing:', error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      fetchBillingInfo();
    }
  }, [restaurantId, fetchBillingInfo]);

  const getDaysRemaining = () => {
    if (!billing || billing.status === 'paid') return null;
    
    const now = new Date();
    const graceEnd = new Date(billing.grace_end_date);
    const daysLeft = Math.ceil((graceEnd - now) / (1000 * 60 * 60 * 24));
    
    return daysLeft;
  };

  const getStatusColor = () => {
    if (!billing) return 'gray';
    if (billing.status === 'paid') return 'green';
    if (billing.status === 'overdue') return 'red';
    
    const daysLeft = getDaysRemaining();
    if (daysLeft <= 1) return 'red';
    if (daysLeft <= 3) return 'yellow';
    return 'blue';
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    switch (color) {
      case 'green':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'red':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case 'yellow':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      default:
        return <CreditCard className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    if (!billing) {
      return 'No billing information available';
    }

    if (billing.status === 'paid') {
      return '✓ Payment up to date';
    }

    if (billing.status === 'overdue') {
      return '⚠️ PAYMENT OVERDUE - Restaurant Suspended';
    }

    const daysLeft = getDaysRemaining();
    if (daysLeft <= 0) {
      return '⚠️ Payment due - Restaurant will be suspended today';
    }
    if (daysLeft === 1) {
      return '⚠️ Payment due tomorrow - Action required!';
    }
    if (daysLeft <= 3) {
      return `⚠️ Payment due in ${daysLeft} days`;
    }

    return `Payment due on ${new Date(billing.due_date).toLocaleDateString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!billing) {
    return null; // Don't show if no billing info
  }

  const statusColor = getStatusColor();
  const daysLeft = getDaysRemaining();

  return (
    <div className={`rounded-lg shadow-md p-6 border-l-4 ${
      statusColor === 'green' ? 'bg-green-50 border-green-500' :
      statusColor === 'red' ? 'bg-red-50 border-red-500' :
      statusColor === 'yellow' ? 'bg-yellow-50 border-yellow-500' :
      'bg-blue-50 border-blue-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-sm font-medium text-gray-900">Billing Status</h3>
            <p className={`text-xs mt-1 ${
              statusColor === 'red' ? 'text-red-700' :
              statusColor === 'yellow' ? 'text-yellow-700' :
              statusColor === 'green' ? 'text-green-700' :
              'text-gray-600'
            }`}>
              {getStatusMessage()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-600">Amount Due</div>
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(billing.total_amount)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600">Due Date</div>
          <div className="text-sm font-medium text-gray-900">
            {new Date(billing.due_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>

      {billing.status !== 'paid' && daysLeft !== null && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Grace Period Ends:</span>
            <span className={`font-medium ${
              daysLeft <= 1 ? 'text-red-600' :
              daysLeft <= 3 ? 'text-yellow-600' :
              'text-gray-900'
            }`}>
              {new Date(billing.grace_end_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
              {daysLeft > 0 && ` (${daysLeft} days left)`}
            </span>
          </div>
        </div>
      )}

      {billing.status === 'overdue' && (
        <div className="mt-4 p-3 bg-red-100 rounded-lg">
          <p className="text-xs text-red-800">
            <strong>⚠️ Restaurant Suspended:</strong> Your restaurant is currently suspended due to overdue payment. 
            Please contact the administrator or make a payment to reactivate your services.
          </p>
        </div>
      )}

      {billing.status === 'pending' && daysLeft <= 3 && (
        <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Action Required:</strong> Please make the payment before {new Date(billing.grace_end_date).toLocaleDateString('en-IN')} 
            to avoid service suspension.
          </p>
        </div>
      )}

      {billing.status === 'paid' && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <p className="text-xs text-green-800">
            ✓ Thank you! Your payment for {new Date(billing.billing_period).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} has been received.
          </p>
        </div>
      )}
    </div>
  );
};

export default BillingWarningCard;
