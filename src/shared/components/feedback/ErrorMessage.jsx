import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

const ErrorMessage = ({ error, onRetry }) => {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred';

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="rounded-full bg-red-100 p-3">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-900">Something went wrong</h3>
      <p className="mt-2 max-w-md text-center text-sm text-neutral-600">{errorMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 rounded-lg bg-orange-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-orange-600"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
