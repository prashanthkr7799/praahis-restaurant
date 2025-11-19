import React, { useState, useRef, useEffect } from 'react';

/**
 * Tooltip Component
 * 
 * Usage:
 * <Tooltip content="This is a tooltip">
 *   <button>Hover me</button>
 * </Tooltip>
 * 
 * Props:
 * - content: string or JSX - The tooltip content
 * - position: 'top' | 'bottom' | 'left' | 'right' - Tooltip position (default: 'top')
 * - delay: number - Delay in ms before showing tooltip (default: 300)
 * - className: string - Additional CSS classes for the tooltip
 */

const Tooltip = ({ 
  children, 
  content, 
  position = 'top', 
  delay = 300,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimeout, setShowTimeout] = useState(null);
  const tooltipRef = useRef(null);
  const targetRef = useRef(null);

  useEffect(() => {
    return () => {
      if (showTimeout) {
        clearTimeout(showTimeout);
      }
    };
  }, [showTimeout]);

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setShowTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (showTimeout) {
      clearTimeout(showTimeout);
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    const positions = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };
    return positions[position] || positions.top;
  };

  const getArrowClasses = () => {
    const arrows = {
      top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
      left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
      right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
    };
    return arrows[position] || arrows.top;
  };

  if (!content) {
    return children;
  }

  return (
    <div 
      className="relative inline-block"
      ref={targetRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg
            whitespace-nowrap pointer-events-none transition-opacity duration-200
            ${getPositionClasses()}
            ${className}
          `}
          style={{
            opacity: isVisible ? 1 : 0,
          }}
        >
          {content}
          {/* Arrow */}
          <div
            className={`
              absolute w-0 h-0 border-4
              ${getArrowClasses()}
            `}
          />
        </div>
      )}
    </div>
  );
};

/**
 * IconTooltip - Specialized tooltip for icon buttons
 */
export const IconTooltip = ({ children, content, ...props }) => {
  return (
    <Tooltip content={content} {...props}>
      <div className="inline-flex items-center justify-center cursor-pointer">
        {children}
      </div>
    </Tooltip>
  );
};

/**
 * InfoTooltip - Info icon with tooltip
 */
export const InfoTooltip = ({ content, position = 'top' }) => {
  return (
    <Tooltip content={content} position={position}>
      <span className="inline-flex items-center justify-center w-4 h-4 text-xs text-gray-500 border border-gray-400 rounded-full cursor-help hover:text-gray-700 hover:border-gray-600">
        i
      </span>
    </Tooltip>
  );
};

/**
 * HelpTooltip - Question mark icon with tooltip
 */
export const HelpTooltip = ({ content, position = 'top' }) => {
  return (
    <Tooltip content={content} position={position}>
      <span className="inline-flex items-center justify-center w-4 h-4 text-xs text-orange-600 bg-orange-100 border border-orange-300 rounded-full cursor-help hover:bg-orange-200">
        ?
      </span>
    </Tooltip>
  );
};

export default Tooltip;
