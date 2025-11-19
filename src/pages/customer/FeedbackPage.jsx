import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Send, Home } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase, getSessionWithOrders, endTableSession } from '@shared/utils/api/supabaseClient';
import { useRestaurant } from '@/shared/hooks/useRestaurant';

const FeedbackPage = () => {
  const { sessionId } = useParams(); // Changed from orderId to sessionId
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();

  const [rating, setRating] = useState(0);
  const [serviceQuality, setServiceQuality] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [itemRatings, setItemRatings] = useState({}); // { menu_item_id: rating }
  const [session, setSession] = useState(null);

  // Load all items from this table session (aggregate across multiple orders during current seating)
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
        console.error('Could not load session items for ratings:', e);
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

      // Prepare comment to include extra details (service) since schema only has rating/comment
      const details = [];
      if (serviceQuality) details.push(`Service:${serviceQuality}`);
      const composedComment = [comment.trim(), details.length ? `(${details.join(', ')})` : '']
        .filter(Boolean)
        .join(' ');

      // Create feedback record with session_id
      const { error: feedbackError } = await supabase
        .from('feedbacks')
        .insert([{
          session_id: sessionId,
          rating: rating,
          comment: composedComment || null,
          restaurant_id: session.restaurant_id,
          created_at: new Date().toISOString(),
        }]);

      if (feedbackError) {
        console.error('Feedback insert error:', feedbackError);
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

      // Insert per-item ratings (if schema exists and has session_id column)
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
            // If session_id column doesn't exist yet, run migration: database/22_table_sessions.sql
            console.error('Item ratings insert error:', ratingsError.message);
          }
        }
      } catch (e) {
        console.error('Error saving per-item ratings:', e);
      }

      toast.success('Thank You! 🎉', { duration: 2500 });

      // Redirect to Thank You page instead of homepage
      setTimeout(() => {
        navigate('/thank-you');
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('Failed to submit feedback');
      setIsSubmitting(false);
    }
  };

  const StarRow = ({ value, onChange, size = 'lg', label, compact = false, align = 'center' }) => {
    const [hovered, setHovered] = useState(0);
    const isLg = size === 'lg';
    const isMd = size === 'md';
    const dim = isLg ? 'w-12 h-12' : isMd ? 'w-10 h-10' : 'w-7 h-7'; // 48px, 40px, 28px
    const gap = isLg ? 'gap-2' : isMd ? 'gap-2' : 'gap-1.5';
    const justify = align === 'end' ? 'justify-end' : align === 'start' ? 'justify-start' : 'justify-center';
    return (
      <div className={compact ? '' : (label ? 'mb-8' : 'mb-6')}>
        {label && (
          <label className="block text-lg font-semibold text-foreground mb-3">
            {label}
          </label>
        )}
        <div role="radiogroup" className={`flex ${gap} ${justify}`} aria-label={label || 'rating'}>
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hovered || value);
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={star === value}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                onClick={() => onChange(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange(star);
                  }
                }}
                className={`transition-transform ${compact ? 'hover:scale-105' : 'hover:scale-110'} focus:outline-none focus:ring-2 focus:ring-warning rounded-sm`}
              >
                <Star
                  className={`${dim} ${active ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-muted-foreground/50'}`}
                  strokeWidth={2}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Share Your Feedback</h1>
            <p className="text-lg text-muted-foreground">We'd love to hear from you!</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-warning px-4 py-2 text-sm font-semibold text-background transition-colors hover:brightness-110"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-minimal bg-card p-6 sm:p-8"
        >
          <form onSubmit={handleSubmit}>
            {/* Overall Experience */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-foreground/90 mb-2">How was your experience?</h2>
              <p className="text-base text-muted-foreground mb-6">Rate your overall experience</p>
              <div className="flex justify-center gap-2 mb-2">
                <StarRow
                  value={rating}
                  onChange={setRating}
                  size="lg"
                  idPrefix="overall"
                />
              </div>
            </div>

            <div className="border-t border-border my-6" />

            {/* Per-item Ratings (compact inline rows) */}
            {orderItems && orderItems.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-2">
                  Items from your current visit (all orders at this table)
                </p>
                <ul className="divide-y divide-border">
                  {orderItems.map((it, idx) => (
                    <li key={it.menu_item_id || idx} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-foreground truncate pr-3">
                        {it.name}
                        <span className="text-muted-foreground ml-1">× {it.quantity}</span>
                      </span>
                      {it.menu_item_id ? (
                        <StarRow
                          value={itemRatings[it.menu_item_id] || 0}
                          onChange={(v) => setItemRating(it.menu_item_id, v)}
                          size="sm"
                          compact
                          align="end"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Service Quality (compact inline row, label slightly larger than item name) */}
            <div className="mb-6">
              <div className="flex items-center justify-between py-2">
                <span className="text-base font-semibold text-foreground">Service quality</span>
                <StarRow value={serviceQuality} onChange={setServiceQuality} size="sm" />
              </div>
            </div>

            <div className="border-t border-border my-6" />

            {/* Comments */}
            <div className="mb-6">
              <label htmlFor="feedback-comments" className="block text-lg font-semibold mb-2">
                Comments <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
              </label>
              <textarea
                id="feedback-comments"
                name="comments"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="Tell us more about your experience..."
                className="w-full min-h-32 px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warning resize-none"
                maxLength={500}
              />
              <p className="text-sm text-muted-foreground mt-1">{comment.length}/500 characters</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className={`w-full h-14 inline-flex items-center justify-center gap-2 rounded-lg text-lg font-semibold transition-colors ${
                isSubmitting || rating === 0
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-warning text-background hover:bg-warning/90'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Feedback
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-muted-foreground">
            Your feedback helps us serve you better! 🙏
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default FeedbackPage;
