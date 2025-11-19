/**
 * Analytics Domain Events
 * 
 * Event definitions for the analytics domain.
 * These events are emitted when analytics-related actions occur.
 */

export const ANALYTICS_EVENTS = {
  // Report generation events
  REPORT_GENERATED: 'analytics:report_generated',
  REPORT_FAILED: 'analytics:report_failed',
  REPORT_EXPORTED: 'analytics:report_exported',
  
  // Data analysis events
  ANOMALY_DETECTED: 'analytics:anomaly_detected',
  FORECAST_UPDATED: 'analytics:forecast_updated',
  INSIGHT_GENERATED: 'analytics:insight_generated',
  
  // Dashboard events
  DASHBOARD_LOADED: 'analytics:dashboard_loaded',
  CHART_RENDERED: 'analytics:chart_rendered',
  DATA_REFRESHED: 'analytics:data_refreshed',
};
