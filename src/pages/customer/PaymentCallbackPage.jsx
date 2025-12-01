/**
 * Payment Callback Page
 * Handles redirect returns from PhonePe and Paytm payment gateways
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { handlePaymentCallback } from '@/domains/billing/utils/paymentGateway';
import { updateOrder } from '@/shared/utils/api/supabaseClient';
import LoadingSpinner from '@/shared/components/feedback/LoadingSpinner';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, failed, error
  const [message, setMessage] = useState('Verifying your payment...');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Handle the payment callback
        const result = await handlePaymentCallback(searchParams);

        if (result.success) {
          setStatus('success');
          setMessage('Payment successful!');
          setOrderDetails(result.order);

          // Update order status
          if (result.orderId) {
            await updateOrder(result.orderId, {
              payment_status: 'paid',
              payment_method: result.provider,
            });
          }

          // Redirect to order status page after 3 seconds
          setTimeout(() => {
            if (result.orderToken) {
              navigate(`/order-status/${result.orderToken}`);
            } else {
              navigate('/');
            }
          }, 3000);
        } else {
          setStatus('failed');
          setMessage(result.error || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred while processing your payment');
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-20 h-20 text-green-500" />;
      case 'failed':
        return <XCircle className="w-20 h-20 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-20 h-20 text-yellow-500" />;
      default:
        return <LoadingSpinner size="lg" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'error':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        <h1 className={`text-2xl font-bold mb-2 ${getStatusColor()}`}>
          {status === 'processing' ? 'Processing Payment' : 
           status === 'success' ? 'Payment Successful' :
           status === 'failed' ? 'Payment Failed' : 'Payment Error'}
        </h1>

        <p className="text-gray-600 mb-6">{message}</p>

        {orderDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Order Number</span>
              <span className="font-medium">#{orderDetails.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium">₹{orderDetails.total?.toFixed(2)}</span>
            </div>
          </div>
        )}

        {status === 'success' && (
          <p className="text-sm text-gray-500">
            Redirecting to order status...
          </p>
        )}

        {(status === 'failed' || status === 'error') && (
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Go Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
