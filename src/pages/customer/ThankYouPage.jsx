import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, UtensilsCrossed, Sparkles } from 'lucide-react';

const ThankYouPage = () => {
  const [countdown, setCountdown] = useState(5);
  const isLockedRef = useRef(true);

  // History-lock: Prevent back button during countdown
  useEffect(() => {
    // Push a few dummy states (not too many to avoid blocking our own exit)
    window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = () => {
      // ALWAYS prevent navigation while lock is active
      if (isLockedRef.current) {
        // Immediately push state again to stay locked
        window.history.pushState(null, '', window.location.href);
      }
    };
    
    // Listen for back button press
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    // Countdown timer: Decrement every second
    if (countdown > 0) {
      const countdownTimer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => {
        clearInterval(countdownTimer);
      };
    } else if (countdown === 0) {
      // Disable history lock IMMEDIATELY
      isLockedRef.current = false;
      
      // Go back multiple steps to skip ALL order pages
      setTimeout(() => {
        // Go back 50 steps to completely exit the ordering flow
        // This skips: Menu → Payment → OrderStatus → PostMeal → Feedback → ThankYou
        // User will either close tab or land on QR scanner / home
        window.history.go(-50);
      }, 200);
    }
  }, [countdown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4">
      {/* Main Content */}
      <div className="text-center max-w-2xl mx-auto">
        {/* Success Icon with Animation */}
        <div className="mb-8 relative inline-block">
          <div className="absolute inset-0 bg-green-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <CheckCircle className="w-24 h-24 text-green-500 relative animate-bounce" strokeWidth={1.5} />
        </div>

        {/* Main Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-4">
          Thank You! 🎉
        </h1>

        {/* Submessage */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <UtensilsCrossed className="w-6 h-6 text-orange-500" />
          <p className="text-xl md:text-2xl text-gray-300 font-medium">
            For Dining With Us
          </p>
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </div>

        {/* Additional Message */}
        <p className="text-lg text-gray-400 mb-8">
          Your feedback helps us serve you better!
        </p>

        {/* Decorative Elements */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="w-20 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"></div>
          <div className="w-20 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
          <div className="w-20 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
        </div>

        {/* Info Text with Countdown */}
        <p className="text-sm text-gray-400 italic">
          Closing in <span className="font-bold text-orange-500 text-lg">{countdown}</span> second{countdown !== 1 ? 's' : ''}
        </p>

        {/* Footer Message */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-md text-gray-600">
            We hope to see you again soon! 🍽️
          </p>
        </div>
      </div>

      {/* Background Decorative Shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
};

export default ThankYouPage;
