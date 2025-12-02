import React, { useEffect, useState } from 'react';
import { CheckCircle, UtensilsCrossed, Sparkles } from 'lucide-react';

const ThankYouPage = () => {
  const [countdown, setCountdown] = useState(5);
  const [sessionEnded, setSessionEnded] = useState(false);

  // Function to close/exit the page
  const closePage = () => {
    // Try to close the tab/window
    window.close();
    
    // Fallback: If window.close() doesn't work, show "Session Ended" message
    setTimeout(() => {
      setSessionEnded(true);
    }, 200);
  };

  // Handle back button - close the page when user presses back
  useEffect(() => {
    // Push one state so we can detect back button press
    window.history.pushState({ thankyou: true }, '', window.location.href);
    
    const handlePopState = () => {
      // User pressed back - close the page
      closePage();
    };
    
    // Listen for back button press
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Countdown timer that auto-closes at 0
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (countdown === 0) {
      // Countdown reached 0 - close the page
      closePage();
    }
  }, [countdown]);

  // Show "Session Ended" screen if window.close() didn't work
  if (sessionEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Session Ended</h1>
          <p className="text-lg text-zinc-400 mb-6">
            Thank you for dining with us! You can now close this tab.
          </p>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <p className="text-sm text-zinc-500">
              Please close this browser tab to complete your session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      {/* Main Content */}
      <div className="text-center max-w-2xl mx-auto">
        {/* Success Icon with Animation */}
        <div className="mb-8 relative inline-block">
          <div className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <CheckCircle className="w-16 h-16 text-emerald-400 animate-bounce" strokeWidth={1.5} />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Thank You! 🎉
        </h1>

        {/* Submessage */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <UtensilsCrossed className="w-6 h-6 text-orange-400" />
          <p className="text-xl md:text-2xl text-zinc-300 font-medium">
            For Dining With Us
          </p>
          <Sparkles className="w-6 h-6 text-amber-400" />
        </div>

        {/* Additional Message */}
        <p className="text-lg text-zinc-400 mb-8">
          Your feedback helps us serve you better!
        </p>

        {/* Decorative Elements */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="w-20 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"></div>
          <div className="w-20 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"></div>
          <div className="w-20 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"></div>
        </div>

        {/* Countdown Display */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8">
          <p className="text-sm text-zinc-400 italic">
            Closing in <span className="font-bold text-orange-400 text-2xl">{countdown}</span> second{countdown !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Footer Message */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-md text-zinc-400">
            We hope to see you again soon! 🍽️
          </p>
        </div>
      </div>

      {/* Background Decorative Shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-500/10 rounded-full mix-blend-normal filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-amber-500/10 rounded-full mix-blend-normal filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 h-64 bg-emerald-500/10 rounded-full mix-blend-normal filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
};

export default ThankYouPage;
