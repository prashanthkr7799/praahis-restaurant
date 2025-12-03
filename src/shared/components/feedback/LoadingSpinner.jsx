import React from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', text = 'Loading...', compact = false }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  const containerClass = compact
    ? 'flex items-center justify-center'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-orange-500`} />
      {text && !compact && <p className="mt-4 text-sm text-gray-300">{text}</p>}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'default', 'large']),
  text: PropTypes.string,
  compact: PropTypes.bool,
};

LoadingSpinner.defaultProps = {
  size: 'default',
  text: 'Loading...',
  compact: false,
};

export default LoadingSpinner;
