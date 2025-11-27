import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Send, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase, getSessionWithOrders, endTableSession } from '@shared/utils/api/supabaseClient';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';

const FeedbackPage = () => {
  const { sessionId } = useParams(); // Changed from orderId to sessionId
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [session, setSession] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [itemRatings, setItemRatings] = useState({}); // { menu_item_id: rating }

  // SECURITY: Check if this session is already completed
  useEffect(() => {
    if (sessionStorage.getItem('order_completed') === 'true') {
      navigate('/thank-you', { replace: true });
    }
  }, [navigate]);

  // Load session data and aggregate items
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch session with all orders
        const sessionData = await getSessionWithOrders(sessionId);
        setSession(sessionData);
        
        if (restaurantId && sessionData?.restaurant_id && sessionData.restaurant_id !== restaurantId) {
          throw new Error('Session does not belong to this restaurant');
        }

        const tableOrders = sessionData.orders || [];

        // Aggregate items across these orders
        const map = new Map();
        (tableOrders || []).forEach((o) => {
          if ((o.order_status || '').toLowerCase() === 'cancelled') return;
          const arr = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]');
          arr.forEach((it) => {
            const key = it.menu_item_id || `${it.name}|${it.price}`;
            const prev = map.get(key) || { ...it, quantity: 0 };
            map.set(key, { ...prev, quantity: (prev.quantity || 0) + (Number(it.quantity) || 0) });
          });
        });
        const aggregated = Array.from(map.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
        setOrderItems(aggregated);

        // Initialize ratings map with zeros for unique items
        const init = {};
        aggregated.forEach((it) => {
          if (it.menu_item_id) init[it.menu_item_id] = 0;
        });
        setItemRatings(init);
      } catch (e) {
        console.error('Could not load session data:', e);
        toast.error('Failed to load session data');
      }
    };
    if (sessionId && restaurantId) load();
  }, [sessionId, restaurantId]);

  const setItemRating = (menuItemId, value) => {
    setItemRatings((prev) => ({ ...prev, [menuItemId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Rating Required');
      return;
    }

    if (!session || !sessionId) {
      toast.error('Session data not loaded');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create feedback record
      const basePayload = {
        session_id: sessionId,
        rating,
        comment: comment.trim() || null,
        restaurant_id: session.restaurant_id,
        created_at: new Date().toISOString(),
      };
      
      let { error: feedbackError } = await supabase.from('feedbacks').insert([basePayload]);
      
      if (feedbackError?.code === 'PGRST204') {
        // Column restaurant_id missing (older schema) – retry without it
        const legacyPayload = { ...basePayload };
        delete legacyPayload.restaurant_id;
        ({ error: feedbackError } = await supabase.from('feedbacks').insert([legacyPayload]));
      }
      
      if (feedbackError) {
        console.error('Feedback insert error:', feedbackError);
        throw feedbackError;
      }

      // Insert per-item ratings
      try {
        const rows = Object.entries(itemRatings)
          .filter(([, r]) => Number(r) > 0)
          .map(([menuItemId, r]) => ({
            session_id: sessionId,
            menu_item_id: menuItemId,
            rating: Number(r),
            restaurant_id: session.restaurant_id,
            created_at: new Date().toISOString(),
          }));
          
        if (rows.length > 0) {
          const { error: ratingsError } = await supabase
            .from('menu_item_ratings')
            .insert(rows);
            
          if (ratingsError) {
             // Fallback for older schema
             if (ratingsError.code === 'PGRST204') {
                const legacyRows = rows.map(r => {
                  const { restaurant_id, ...rest } = r;
                  return rest;
                });
                await supabase.from('menu_item_ratings').insert(legacyRows);
             } else {
               console.error('Item ratings insert error:', ratingsError.message);
             }
          }
        }
      } catch (e) {
        console.error('Error saving per-item ratings:', e);
      }

      // Mark all session orders as feedback submitted
      if (session.orders && session.orders.length > 0) {
        const orderIds = session.orders.map(o => o.id);
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            feedback_submitted: true,
            feedback_submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in('id', orderIds)
          .eq('restaurant_id', session.restaurant_id);

        if (updateError) {
          console.error('Error updating orders feedback:', updateError);
        }
      }

      // End the table session using the database function
      try {
        await endTableSession(sessionId);
      } catch (endError) {
        console.error('Error ending session:', endError);
      }

      setSubmitted(true);
      toast.success('Thank You! 🎉', { duration: 2500 });

      // Mark order as completed to block all backward navigation
      sessionStorage.setItem('order_completed', 'true');
      sessionStorage.removeItem('payment_completed');
      
      // Push multiple history states to create a deep buffer that prevents back navigation
      for (let i = 0; i < 50; i++) {
        window.history.pushState({ feedbackComplete: true }, '', window.location.href);
      }

      // Redirect to Thank You page instead of homepage (replace history to prevent back)
      setTimeout(() => {
        navigate('/thank-you', { replace: true });
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
        <Motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500"></div>
          <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-500/10">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-zinc-400 mb-8">Your feedback helps us serve you better. We hope to see you again soon!</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all border border-white/10"
          >
            Return to Home
          </button>
        </Motion.div>
      </div>
    );
  }

  // Check if payment is completed - if so, hide back button
  const paymentCompleted = sessionStorage.getItem('payment_completed') === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans selection:bg-orange-500/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-transparent backdrop-blur-2xl border-b border-white/5">
        <div className="mx-auto w-full max-w-2xl px-4 py-4 flex items-center gap-4">
          {/* Only show back button if payment is not completed */}
          {!paymentCompleted && (
            <button 
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold">Feedback</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-lg"
        >
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">Rate your experience</h2>
              <p className="text-zinc-400">How was your meal at Taj Restaurant?</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Overall Star Rating */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2 sm:gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="group relative focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-orange-500 text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                            : 'text-zinc-600 fill-transparent group-hover:text-zinc-500'
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
                <p className="h-6 text-sm font-medium text-orange-400 transition-opacity duration-300">
                  {hoveredRating === 1 && "Terrible 😞"}
                  {hoveredRating === 2 && "Bad 😕"}
                  {hoveredRating === 3 && "Okay 😐"}
                  {hoveredRating === 4 && "Good 🙂"}
                  {hoveredRating === 5 && "Excellent! 🤩"}
                  {!hoveredRating && rating > 0 && (
                    rating === 1 ? "Terrible 😞" :
                    rating === 2 ? "Bad 😕" :
                    rating === 3 ? "Okay 😐" :
                    rating === 4 ? "Good 🙂" : "Excellent! 🤩"
                  )}
                </p>
              </div>

              {/* Item Ratings */}
              {orderItems.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-white/10"></div>
                    <span className="text-sm font-medium text-zinc-400">Rate Items</span>
                    <div className="h-px flex-1 bg-white/10"></div>
                  </div>
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.menu_item_id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-sm font-medium text-white truncate">{item.name}</p>
                          <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setItemRating(item.menu_item_id, star)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-5 h-5 transition-colors ${
                                  star <= (itemRatings[item.menu_item_id] || 0)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-zinc-600 fill-transparent'
                                }`}
                                strokeWidth={1.5}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment Box */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked or how we can improve..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    Submit Feedback
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </Motion.div>
      </main>
    </div>
  );
};

export default FeedbackPage;
