import React from 'react';
import PropTypes from 'prop-types';

/**
 * Professional Card Component for SuperAdmin Dashboard
 * Flexible card with header, body, and footer sections
 * Updated with improved responsive design and emerald accent
 */
const Card = ({ children, className = '', padding = true, hover = false }) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
        shadow-sm
        ${hover ? 'hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200' : ''}
        ${padding ? 'p-4 sm:p-6' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', action }) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4 ${className}`}
    >
      <div>{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

const CardTitle = ({ children, className = '' }) => {
  return (
    <h3
      className={`text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}
    >
      {children}
    </h3>
  );
};

const CardDescription = ({ children, className = '' }) => {
  return (
    <p className={`text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 ${className}`}>
      {children}
    </p>
  );
};

const CardBody = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;

// PropTypes
Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.bool,
  hover: PropTypes.bool,
};

Card.defaultProps = {
  className: '',
  padding: true,
  hover: false,
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  action: PropTypes.node,
};

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Card;
