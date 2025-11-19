import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { RestaurantProvider } from '@shared/contexts/RestaurantContext.jsx'
import { ToastProvider } from '@/shared/components/superadmin/Toast'
import { initAuthErrorHandling } from '@/shared/utils/helpers/authErrorHandler'
import '@/shared/utils/api/sessionHeartbeat' // Initialize session heartbeat

// Initialize authentication error handling
initAuthErrorHandling();

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
