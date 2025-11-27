import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { ShoppingBag, MessageSquare, UtensilsCrossed, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';

const PostMealOptions = () => {
  const { sessionId, tableNumber: _tableNumber } = useParams(); // Changed from orderId to sessionId
  const navigate = useNavigate();

  // Check if payment is completed - Order More should be disabled
  const paymentCompleted = sessionStorage.getItem('payment_completed') === 'true';

  // SECURITY: Check if this session is already completed
  React.useEffect(() => {
    if (sessionStorage.getItem('order_completed') === 'true') {
      navigate('/thank-you', { replace: true });
    }
  }, [navigate]);

  const handleOrderMore = () => {
    // Block if payment is already completed
    if (paymentCompleted) {
      toast.error('Cannot order more after payment is completed');
      return;
    }
    // Route back to the same table ordering page
    const tableTarget = (_tableNumber ?? '').toString().trim();
    navigate(tableTarget ? `/table/${tableTarget}` : '/');
  };

  const handleNoThanks = () => {
    // Redirect to feedback page with sessionId (replace history to prevent back)
    navigate(`/feedback/${sessionId}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 py-6">
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <UtensilsCrossed className="h-16 w-16 text-emerald-400" />
          </div>
        </div>

        {/* Heading Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Enjoy your meal 🍽️</h1>
          <p className="text-lg text-zinc-400">Your food is served. What would you like to do next?</p>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {/* Order More Card - Disabled if payment is completed */}
          {!paymentCompleted ? (
            <Motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOrderMore}
              className="group w-full rounded-2xl bg-slate-800/50 backdrop-blur-xl border-2 border-amber-500/30 hover:border-amber-500/50 hover:bg-slate-800/70 transition-all duration-300 ease-in-out p-5 flex items-center gap-4 shadow-lg shadow-amber-500/10"
            >
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-colors duration-300 ease-in-out flex items-center justify-center border border-amber-500/20">
                <ShoppingBag className="h-10 w-10 text-amber-400" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-semibold text-white">Order more</h2>
                <p className="text-sm text-zinc-400 mt-1">Browse the menu and add more items</p>
              </div>
            </Motion.button>
          ) : (
            <div className="w-full rounded-2xl bg-slate-800/30 backdrop-blur-xl border-2 border-zinc-700/30 p-5 flex items-center gap-4 opacity-50 cursor-not-allowed">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-zinc-600/20 to-zinc-700/20 flex items-center justify-center border border-zinc-600/20">
                <ShoppingBag className="h-10 w-10 text-zinc-500" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-semibold text-zinc-500">Order more</h2>
                <p className="text-sm text-zinc-600 mt-1">Payment already completed</p>
              </div>
            </div>
          )}

          {/* No Thanks Card */}
          <Motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNoThanks}
            className="group w-full rounded-2xl bg-slate-800/50 backdrop-blur-xl border-2 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-slate-800/70 transition-all duration-300 ease-in-out p-5 flex items-center gap-4 shadow-lg shadow-emerald-500/10"
          >
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 group-hover:from-emerald-500/30 group-hover:to-green-500/30 transition-colors duration-300 ease-in-out flex items-center justify-center border border-emerald-500/20">
              <MessageSquare className="h-10 w-10 text-emerald-400" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-semibold text-white">No, thanks</h2>
              <p className="text-sm text-zinc-400 mt-1">Share quick feedback and finish up</p>
            </div>
          </Motion.button>
        </div>

        {/* Tip Box - Only show if ordering is still possible */}
        {!paymentCompleted && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-yellow-400 mt-0.5" />
              <p className="text-sm text-zinc-400"><span className="font-semibold text-zinc-300">Tip:</span> You can still order more before giving feedback.</p>
            </div>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

export default PostMealOptions;
