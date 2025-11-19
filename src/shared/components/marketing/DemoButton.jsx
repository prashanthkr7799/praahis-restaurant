import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ensureDemoRestaurant } from '@shared/utils/api/supabaseClient';
import { setRestaurantContext } from '@/lib/restaurantContextStore';

const DemoButton = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Try to provision or find demo tenant
      const { id, slug, created, seeded } = await ensureDemoRestaurant();

      if (created) {
        toast.success('Demo restaurant created');
      } else {
        toast.dismiss();
      }
      if (seeded) {
        toast.success('Demo data ready');
      }

      // Persist context (best effort even if id missing due to RLS)
      const ctx = {
        restaurantId: id || null,
        restaurantSlug: slug,
        restaurantName: id ? 'Demo Restaurant' : null,
        branding: null,
      };

      try {
        localStorage.setItem('praahis_restaurant_ctx', JSON.stringify(ctx));
      } catch {
        // ignore storage errors
      }
      setRestaurantContext(ctx);

  // Navigate to unified login (user can choose Admin/Manager)
  navigate('/login?demo=1');
    } catch (e) {
      console.error('Demo setup failed:', e);
  toast.error('Demo not provisioned yet. Continuing to login…');
  navigate('/login?demo=1');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors duration-300 inline-block disabled:opacity-70"
    >
      {loading ? 'Preparing demo…' : 'Try Demo'}
    </button>
  );
};

export default DemoButton;
