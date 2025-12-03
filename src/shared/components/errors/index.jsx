/**
 * Feature Error Boundary Wrappers
 * Pre-configured error boundaries for specific features
 */

import React from 'react';
import PropTypes from 'prop-types';
import FeatureErrorBoundary from './FeatureErrorBoundary';

/**
 * Orders Feature Error Boundary
 */
export const OrdersErrorBoundary = ({ children }) => (
  <FeatureErrorBoundary featureName="Orders" helpLink="/docs/ROLE_WORKFLOW_MANAGER.md">
    {children}
  </FeatureErrorBoundary>
);

OrdersErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Menu Feature Error Boundary
 */
export const MenuErrorBoundary = ({ children }) => (
  <FeatureErrorBoundary featureName="Menu" helpLink="/docs/MANAGER_DASHBOARD_FEATURES.md">
    {children}
  </FeatureErrorBoundary>
);

MenuErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Payment Feature Error Boundary
 */
export const PaymentErrorBoundary = ({ children }) => (
  <FeatureErrorBoundary featureName="Payments" helpLink="/docs/PAYMENT_DEBUG_GUIDE.md">
    {children}
  </FeatureErrorBoundary>
);

PaymentErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Auth Feature Error Boundary
 */
export const AuthErrorBoundary = ({ children }) => (
  <FeatureErrorBoundary
    featureName="Authentication"
    showHomeButton={false}
    helpLink="/docs/LOGIN_TROUBLESHOOTING.md"
  >
    {children}
  </FeatureErrorBoundary>
);

AuthErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Dashboard Feature Error Boundary
 */
export const DashboardErrorBoundary = ({ children }) => (
  <FeatureErrorBoundary
    featureName="Dashboard"
    helpLink="/docs/MANAGER_DASHBOARD_QUICK_REFERENCE.md"
  >
    {children}
  </FeatureErrorBoundary>
);

DashboardErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Tables Feature Error Boundary
 */
export const TablesErrorBoundary = ({ children }) => (
  <FeatureErrorBoundary featureName="Tables">{children}</FeatureErrorBoundary>
);

TablesErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Reports Feature Error Boundary
 */
export const ReportsErrorBoundary = ({ children }) => (
  <FeatureErrorBoundary featureName="Reports & Analytics">{children}</FeatureErrorBoundary>
);

ReportsErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Customer Feature Error Boundary
 */
export const CustomerErrorBoundary = ({ children }) => (
  <FeatureErrorBoundary featureName="Customer Portal">{children}</FeatureErrorBoundary>
);

CustomerErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

// Export all boundaries
export default FeatureErrorBoundary;
