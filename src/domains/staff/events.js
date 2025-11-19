/**
 * Staff Domain Events
 * 
 * Event definitions for the staff domain.
 * These events are emitted when staff-related actions occur.
 */

export const STAFF_EVENTS = {
  // Staff lifecycle events
  STAFF_CREATED: 'staff:created',
  STAFF_UPDATED: 'staff:updated',
  STAFF_DELETED: 'staff:deleted',
  STAFF_ACTIVATED: 'staff:activated',
  STAFF_DEACTIVATED: 'staff:deactivated',
  
  // Attendance events
  STAFF_CLOCKED_IN: 'staff:clocked_in',
  STAFF_CLOCKED_OUT: 'staff:clocked_out',
  SHIFT_STARTED: 'staff:shift_started',
  SHIFT_ENDED: 'staff:shift_ended',
  
  // Permission events
  PERMISSION_GRANTED: 'staff:permission_granted',
  PERMISSION_REVOKED: 'staff:permission_revoked',
  ROLE_CHANGED: 'staff:role_changed',
};
