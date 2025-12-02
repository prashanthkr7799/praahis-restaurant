import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useRestaurant from '@shared/hooks/useRestaurant';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import PaymentGatewayConfig from '@features/billing/components/PaymentGatewayConfig';
import { ArrowLeft } from 'lucide-react';

export default function PaymentSettingsPage() {
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      setLoading(false);
    }
  }, [restaurantId]);

  if (loading || !restaurantId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Settings</span>
        </button>

        {/* Payment Gateway Configuration */}
        <PaymentGatewayConfig 
          restaurantId={restaurantId} 
          onUpdate={() => {
            // Refresh if needed
          }}
        />
      </div>
    </div>
  );
}
