/**
 * Feature Error Boundary
 * Reusable error boundary component for feature modules
 * Catches JavaScript errors in child components and displays fallback UI
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw, Home, ChevronRight } from 'lucide-react';

class FeatureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.group(`🔴 Error in ${this.props.featureName || 'Feature'}`);
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo?.componentStack);
      console.groupEnd();
    }

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (if configured)
    this.reportError(error, errorInfo);
  }

  reportError = (_error, _errorInfo) => {
    // TODO: Integrate with error tracking (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(_error, { extra: _errorInfo });
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({
              error: this.state.error,
              errorInfo: this.state.errorInfo,
              retry: this.handleRetry,
            })
          : this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          className="min-h-[400px] flex items-center justify-center p-8"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {this.props.featureName || 'Feature'} Error
                  </h2>
                  <p className="text-sm text-red-100">Something went wrong in this section</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                We encountered an unexpected error. This has been logged and we&apos;ll look into
                it.
              </p>

              {/* Error details (development only) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Show error details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs font-mono text-red-600 overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <pre className="mt-2 text-gray-500 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={`Retry loading ${this.props.featureName || 'this feature'}`}
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Try Again
                </button>

                {this.props.showHomeButton !== false && (
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Return to home page"
                  >
                    <Home className="w-4 h-4" aria-hidden="true" />
                    Go Home
                  </button>
                )}
              </div>

              {/* Additional help */}
              {this.props.helpLink && (
                <a
                  href={this.props.helpLink}
                  className="flex items-center justify-center gap-1 mt-4 text-sm text-blue-600 hover:text-blue-700"
                >
                  Get help
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

FeatureErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  featureName: PropTypes.string,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onError: PropTypes.func,
  onRetry: PropTypes.func,
  showHomeButton: PropTypes.bool,
  helpLink: PropTypes.string,
};

FeatureErrorBoundary.defaultProps = {
  featureName: 'Feature',
  fallback: null,
  onError: null,
  onRetry: null,
  showHomeButton: true,
  helpLink: null,
};

export default FeatureErrorBoundary;
