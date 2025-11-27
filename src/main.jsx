import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { RestaurantProvider } from '@shared/contexts/RestaurantContext.jsx'
import { ToastProvider } from '@/shared/components/superadmin/Toast'
import { initAuthErrorHandling } from '@/shared/utils/helpers/authErrorHandler'
import { initSentry } from '@/lib/sentry'
import '@/shared/utils/api/sessionHeartbeat' // Initialize session heartbeat

// Initialize Sentry for production error monitoring
initSentry();

// Initialize authentication error handling
initAuthErrorHandling();

// Suppress known external third-party console noise (Razorpay SDK)
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    const msg = args.join(' ');
    if (
      msg.includes('serviceworker') ||
      msg.includes('ERR_BLOCKED_BY_CLIENT') ||
      msg.includes('has payment enabled but no key configured')
    ) return;
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const msg = args.join(' ');
    if (
      msg.includes('attribute height: Expected length') ||
      msg.includes('attribute width: Expected length') ||
      msg.includes('validate/account') ||
      msg.includes('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT')
    ) return;
    originalError.apply(console, args);
  };
}

// StrictMode disabled to prevent double-renders during development
// which causes duplicate order creation and page reloading issues
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastProvider>
      <RestaurantProvider>
        <App />
      </RestaurantProvider>
    </ToastProvider>
  </BrowserRouter>
)
