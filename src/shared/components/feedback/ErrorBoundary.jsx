import React from 'react';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { captureException, addSentryBreadcrumb } from '@config/sentry';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Log to Sentry with full context
    addSentryBreadcrumb('error-boundary', 'Error caught by ErrorBoundary', {
      componentStack: errorInfo?.componentStack,
    });

    captureException(error, {
      componentStack: errorInfo?.componentStack,
      errorBoundary: this.props.name || 'default',
      route: window.location.pathname,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>

              <p className="text-gray-600 mb-4">
                We&apos;ve been notified and are working on a fix.
              </p>

              <p className="text-sm text-gray-500 mb-6">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>

              {import.meta.env.MODE === 'development' && this.state.errorInfo && (
                <details className="w-full mb-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {this.state.error?.stack}
                  </pre>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={this.handleGoBack}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
