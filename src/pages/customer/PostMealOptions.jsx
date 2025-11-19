import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { ShoppingBag, MessageSquare, UtensilsCrossed, Lightbulb } from 'lucide-react';

const PostMealOptions = () => {
  const { sessionId, tableNumber: _tableNumber } = useParams(); // Changed from orderId to sessionId
  const navigate = useNavigate();

  const handleOrderMore = () => {
    // Route back to the same table ordering page
    const tableTarget = (_tableNumber ?? '').toString().trim();
    navigate(tableTarget ? `/table/${tableTarget}` : '/');
  };

  const handleNoThanks = () => {
    // Redirect to feedback page with sessionId
    navigate(`/feedback/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-6">
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="h-32 w-32 rounded-full bg-success/20 flex items-center justify-center">
            <UtensilsCrossed className="h-16 w-16 text-success" />
          </div>
        </div>

        {/* Heading Section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Enjoy your meal 🍽️</h1>
          <p className="text-lg text-muted-foreground">Your food is served. What would you like to do next?</p>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {/* Order More Card */}
          <Motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOrderMore}
            className="group w-full rounded-2xl bg-card border-2 border-warning/30 hover:border-warning/50 transition-all duration-300 ease-in-out p-5 flex items-center gap-4"
          >
            <div className="h-20 w-20 rounded-full bg-warning/20 group-hover:bg-warning/30 transition-colors duration-300 ease-in-out flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-warning" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-semibold">Order more</h2>
              <p className="text-sm text-muted-foreground mt-1">Browse the menu and add more items</p>
            </div>
          </Motion.button>

          {/* No Thanks Card */}
          <Motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNoThanks}
            className="group w-full rounded-2xl bg-card border-2 border-success/30 hover:border-success/50 transition-all duration-300 ease-in-out p-5 flex items-center gap-4"
          >
            <div className="h-20 w-20 rounded-full bg-success/20 group-hover:bg-success/30 transition-colors duration-300 ease-in-out flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-success" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-semibold">No, thanks</h2>
              <p className="text-sm text-muted-foreground mt-1">Share quick feedback and finish up</p>
            </div>
          </Motion.button>
        </div>

        {/* Tip Box */}
        <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-yellow-400 mt-0.5" />
            <p className="text-sm text-muted-foreground"><span className="font-semibold">Tip:</span> You can still order more before giving feedback.</p>
          </div>
        </div>
      </Motion.div>
    </div>
  );
};

export default PostMealOptions;
