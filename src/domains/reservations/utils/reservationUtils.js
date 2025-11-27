/**
 * PHASE 10 — RESERVATION UTILITIES
 * 
 * All client-side logic for:
 * - Time slot generation and availability
 * - Table availability checking
 * - Reservation validation
 * - Event calculations
 * - Filtering and grouping
 * - Notification triggers
 * - Format helpers
 * 
 * NO SQL queries — all pure functions
 */

import { format, addDays, startOfDay, isSameDay, parseISO, addMinutes } from 'date-fns';

// ============================================================================
// TIME SLOT MANAGEMENT
// ============================================================================

/**
 * Generate available time slots for a given date
 * @param {Date} date - Target date
 * @param {Object} settings - Restaurant settings (opening hours, slot duration)
 * @returns {Array} Array of time slot objects
 */
export function getAvailableTimeSlots(date, settings = {}) {
  const {
    openTime = '11:00',
    closeTime = '23:00',
    slotDuration = 30, // minutes
    breakTimes = [] // [{start: '15:00', end: '17:00'}]
  } = settings;

  const slots = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  let currentTime = new Date(date);
  currentTime.setHours(openHour, openMin, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(closeHour, closeMin, 0, 0);

  while (currentTime < endTime) {
    const timeStr = format(currentTime, 'HH:mm');
    
    // Check if time falls in break period
    const isBreak = breakTimes.some(bt => timeStr >= bt.start && timeStr < bt.end);
    
    if (!isBreak) {
      slots.push({
        time: timeStr,
        display: format(currentTime, 'h:mm a'),
        available: true,
        datetime: new Date(currentTime)
      });
    }

    currentTime = addMinutes(currentTime, slotDuration);
  }

  return slots;
}

/**
 * Check if a time slot is available for given table
 * @param {Array} reservations - Existing reservations
 * @param {string} tableId - Table ID
 * @param {Date} date - Reservation date
 * @param {string} time - Time slot (HH:mm)
 * @param {number} duration - Reservation duration in minutes
 * @returns {boolean}
 */
export function checkTableAvailability(reservations, tableId, date, time, duration = 120) {
  const [hour, min] = time.split(':').map(Number);
  const requestedStart = new Date(date);
  requestedStart.setHours(hour, min, 0, 0);
  const requestedEnd = addMinutes(requestedStart, duration);

  return !reservations.some(res => {
    if (res.table_id !== tableId) return false;
    if (res.status === 'cancelled') return false;
    if (!isSameDay(parseISO(res.reservation_date), date)) return false;

    const [resHour, resMin] = res.time_slot.split(':').map(Number);
    const resStart = new Date(date);
    resStart.setHours(resHour, resMin, 0, 0);
    const resEnd = addMinutes(resStart, res.duration || 120);

    // Check overlap
    return (
      (requestedStart >= resStart && requestedStart < resEnd) ||
      (requestedEnd > resStart && requestedEnd <= resEnd) ||
      (requestedStart <= resStart && requestedEnd >= resEnd)
    );
  });
}

/**
 * Find best available table for party size
 * @param {Array} tables - All tables
 * @param {Array} reservations - Current reservations
 * @param {number} partySize - Number of guests
 * @param {Date} date - Reservation date
 * @param {string} time - Time slot
 * @returns {Object|null} Best matching table
 */
export function findBestTableMatch(tables, reservations, partySize, date, time) {
  // Filter available tables for the time slot
  const availableTables = tables.filter(table => 
    checkTableAvailability(reservations, table.id, date, time) &&
    table.capacity >= partySize &&
    table.status === 'available'
  );

  if (availableTables.length === 0) return null;

  // Sort by capacity (prefer smallest table that fits)
  availableTables.sort((a, b) => a.capacity - b.capacity);

  return availableTables[0];
}

// ============================================================================
// RESERVATION FILTERING & GROUPING
// ============================================================================

/**
 * Filter reservations by multiple criteria
 * @param {Array} reservations - All reservations
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered reservations
 */
export function filterReservations(reservations, filters = {}) {
  const {
    status,
    dateRange,
    partySize,
    searchTerm,
    type,
    tableId
  } = filters;

  return reservations.filter(res => {
    // Status filter
    if (status && res.status !== status) return false;

    // Date range filter
    if (dateRange?.start && dateRange?.end) {
      const resDate = parseISO(res.reservation_date);
      if (resDate < parseISO(dateRange.start) || resDate > parseISO(dateRange.end)) {
        return false;
      }
    }

    // Party size filter
    if (partySize && res.party_size !== partySize) return false;

    // Type filter
    if (type && res.type !== type) return false;

    // Table filter
    if (tableId && res.table_id !== tableId) return false;

    // Search term (name, phone, email)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        res.customer_name?.toLowerCase().includes(term) ||
        res.customer_phone?.includes(term) ||
        res.customer_email?.toLowerCase().includes(term)
      );
    }

    return true;
  });
}

/**
 * Group reservations by date
 * @param {Array} reservations - All reservations
 * @returns {Object} Reservations grouped by date string
 */
export function groupByDate(reservations) {
  return reservations.reduce((groups, res) => {
    const dateKey = format(parseISO(res.reservation_date), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(res);
    return groups;
  }, {});
}

/**
 * Get upcoming reservations (next 7 days)
 * @param {Array} reservations - All reservations
 * @returns {Array} Upcoming reservations sorted by date/time
 */
export function getUpcomingReservations(reservations) {
  const now = new Date();
  const nextWeek = addDays(now, 7);

  return reservations
    .filter(res => {
      if (res.status === 'cancelled') return false;
      const resDate = parseISO(res.reservation_date);
      return resDate >= now && resDate <= nextWeek;
    })
    .sort((a, b) => {
      const dateCompare = parseISO(a.reservation_date) - parseISO(b.reservation_date);
      if (dateCompare !== 0) return dateCompare;
      return a.time_slot.localeCompare(b.time_slot);
    });
}

/**
 * Get today's reservations
 * @param {Array} reservations - All reservations
 * @returns {Array} Today's reservations sorted by time
 */
export function getTodaysReservations(reservations) {
  const today = new Date();
  
  return reservations
    .filter(res => isSameDay(parseISO(res.reservation_date), today))
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate reservation data
 * @param {Object} data - Reservation data
 * @returns {Object} {valid: boolean, errors: Array}
 */
export function validateReservation(data) {
  const errors = [];

  if (!data.customer_name || data.customer_name.trim().length < 2) {
    errors.push('Customer name is required (min 2 characters)');
  }

  if (!data.customer_phone || !/^\d{10}$/.test(data.customer_phone.replace(/\D/g, ''))) {
    errors.push('Valid 10-digit phone number is required');
  }

  if (data.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) {
    errors.push('Invalid email format');
  }

  if (!data.reservation_date) {
    errors.push('Reservation date is required');
  } else {
    const resDate = new Date(data.reservation_date);
    const today = startOfDay(new Date());
    if (resDate < today) {
      errors.push('Reservation date cannot be in the past');
    }
  }

  if (!data.time_slot) {
    errors.push('Time slot is required');
  }

  if (!data.party_size || data.party_size < 1) {
    errors.push('Party size must be at least 1');
  }

  if (data.party_size > 50) {
    errors.push('Party size exceeds maximum (50). Please book an event instead.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate event booking data
 * @param {Object} data - Event booking data
 * @returns {Object} {valid: boolean, errors: Array}
 */
export function validateEventBooking(data) {
  const errors = [];
  const baseValidation = validateReservation(data);
  
  errors.push(...baseValidation.errors);

  if (!data.event_type) {
    errors.push('Event type is required');
  }

  if (!data.event_package && data.party_size >= 10) {
    errors.push('Package selection is required for events with 10+ guests');
  }

  if (data.advance_payment && (data.advance_payment < 0 || data.advance_payment > data.estimated_total)) {
    errors.push('Invalid advance payment amount');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// EVENT CALCULATIONS
// ============================================================================

/**
 * Calculate event total based on package and party size
 * @param {Object} eventData - Event booking data
 * @param {Object} packages - Available packages
 * @returns {Object} {subtotal, tax, total, perPerson}
 */
export function calculateEventTotal(eventData, packages = {}) {
  const {
    party_size = 0,
    event_package = 'standard',
    add_ons = [],
    venue_charge = 0
  } = eventData;

  const packagePricing = packages[event_package] || { perPerson: 500 };
  const perPerson = packagePricing.perPerson || 500;

  let subtotal = party_size * perPerson;
  
  // Add venue charge
  subtotal += venue_charge;

  // Add add-ons
  const addOnsTotal = add_ons.reduce((sum, addon) => sum + (addon.price || 0), 0);
  subtotal += addOnsTotal;

  // Calculate tax (GST 5%)
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
    perPerson,
    addOnsTotal,
    breakdown: {
      foodBeverage: party_size * perPerson,
      venue: venue_charge,
      addOns: addOnsTotal,
      tax
    }
  };
}

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

/**
 * Calculate peak score for a day (how busy)
 * @param {Array} reservations - Reservations for the day
 * @param {number} totalTables - Total available tables
 * @returns {number} Score 0-100
 */
export function getDayPeakScore(reservations, totalTables = 20) {
  if (reservations.length === 0) return 0;

  const activeReservations = reservations.filter(r => r.status !== 'cancelled');
  const totalGuests = activeReservations.reduce((sum, r) => sum + (r.party_size || 0), 0);
  const avgCapacity = totalTables * 4; // Assume avg 4 seats per table

  return Math.min(100, Math.round((totalGuests / avgCapacity) * 100));
}

/**
 * Get reservation statistics for date range
 * @param {Array} reservations - All reservations
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Stats object
 */
export function getReservationStats(reservations, startDate, endDate) {
  const filtered = reservations.filter(res => {
    const resDate = parseISO(res.reservation_date);
    return resDate >= startDate && resDate <= endDate;
  });

  const stats = {
    total: filtered.length,
    confirmed: filtered.filter(r => r.status === 'confirmed').length,
    completed: filtered.filter(r => r.status === 'completed').length,
    cancelled: filtered.filter(r => r.status === 'cancelled').length,
    noShow: filtered.filter(r => r.status === 'no_show').length,
    totalGuests: filtered.reduce((sum, r) => sum + (r.party_size || 0), 0),
    avgPartySize: 0,
    revenue: filtered
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.total_amount || 0), 0)
  };

  stats.avgPartySize = stats.total > 0 
    ? Math.round((stats.totalGuests / stats.total) * 10) / 10 
    : 0;

  return stats;
}

// ============================================================================
// WAITLIST MANAGEMENT
// ============================================================================

/**
 * Convert waitlist entry to reservation when table becomes available
 * @param {Object} waitlistEntry - Waitlist entry
 * @param {Object} table - Available table
 * @returns {Object} New reservation object
 */
export function convertWaitlistToReservation(waitlistEntry, table) {
  return {
    customer_name: waitlistEntry.customer_name,
    customer_phone: waitlistEntry.customer_phone,
    customer_email: waitlistEntry.customer_email,
    party_size: waitlistEntry.party_size,
    reservation_date: waitlistEntry.preferred_date || format(new Date(), 'yyyy-MM-dd'),
    time_slot: waitlistEntry.preferred_time || format(new Date(), 'HH:mm'),
    table_id: table.id,
    table_number: table.table_number,
    status: 'confirmed',
    type: 'walk-in',
    source: 'waitlist',
    special_requests: waitlistEntry.notes,
    created_from_waitlist: true,
    waitlist_id: waitlistEntry.id
  };
}

/**
 * Find waitlist entries that match available table
 * @param {Array} waitlist - Waitlist entries
 * @param {Object} table - Available table
 * @param {Date} date - Date
 * @param {string} time - Time slot
 * @returns {Array} Matching waitlist entries
 */
export function findMatchingWaitlistEntries(waitlist, table, date, time) {
  return waitlist
    .filter(entry => {
      if (entry.status !== 'waiting') return false;
      if (entry.party_size > table.capacity) return false;
      
      // Check if preferred date matches
      if (entry.preferred_date) {
        const prefDate = parseISO(entry.preferred_date);
        if (!isSameDay(prefDate, date)) return false;
      }

      // Check if preferred time is close (within 1 hour)
      if (entry.preferred_time) {
        const [prefHour] = entry.preferred_time.split(':').map(Number);
        const [slotHour] = time.split(':').map(Number);
        if (Math.abs(prefHour - slotHour) > 1) return false;
      }

      return true;
    })
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // FIFO
}

// ============================================================================
// FORMATTING & DISPLAY
// ============================================================================

/**
 * Format reservation status for display
 * @param {string} status - Status code
 * @returns {Object} {label, color, icon}
 */
export function formatReservationStatus(status) {
  const statusMap = {
    pending: { label: 'Pending', color: 'amber', bgColor: 'bg-amber-500/20', textColor: 'text-amber-300' },
    confirmed: { label: 'Confirmed', color: 'emerald', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-300' },
    arrived: { label: 'Arrived', color: 'blue', bgColor: 'bg-blue-500/20', textColor: 'text-blue-300' },
    seated: { label: 'Seated', color: 'cyan', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-300' },
    completed: { label: 'Completed', color: 'green', bgColor: 'bg-green-500/20', textColor: 'text-green-300' },
    cancelled: { label: 'Cancelled', color: 'red', bgColor: 'bg-red-500/20', textColor: 'text-red-300' },
    no_show: { label: 'No Show', color: 'gray', bgColor: 'bg-gray-500/20', textColor: 'text-gray-300' }
  };

  return statusMap[status] || statusMap.pending;
}

/**
 * Format event type for display
 * @param {string} type - Event type code
 * @returns {Object} {label, emoji, color}
 */
export function formatEventType(type) {
  const typeMap = {
    birthday: { label: 'Birthday Party', emoji: '🎂', color: 'pink' },
    anniversary: { label: 'Anniversary', emoji: '💝', color: 'rose' },
    corporate: { label: 'Corporate Event', emoji: '💼', color: 'blue' },
    wedding: { label: 'Wedding Reception', emoji: '💒', color: 'purple' },
    party: { label: 'Party', emoji: '🎉', color: 'yellow' },
    meeting: { label: 'Business Meeting', emoji: '🤝', color: 'teal' },
    custom: { label: 'Custom Event', emoji: '✨', color: 'indigo' }
  };

  return typeMap[type] || typeMap.custom;
}

/**
 * Generate iCal format for reservation
 * @param {Object} reservation - Reservation object
 * @returns {string} iCal format string
 */
export function generateICalEntry(reservation) {
  const startDate = parseISO(reservation.reservation_date);
  const [hour, min] = reservation.time_slot.split(':').map(Number);
  startDate.setHours(hour, min);
  
  const endDate = addMinutes(startDate, reservation.duration || 120);

  const formatDate = (date) => format(date, "yyyyMMdd'T'HHmmss");

  return `BEGIN:VEVENT
UID:${reservation.id}@restaurant-reservation
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:Reservation - ${reservation.customer_name}
DESCRIPTION:Party of ${reservation.party_size}\\nTable ${reservation.table_number || 'TBD'}
LOCATION:Restaurant
STATUS:CONFIRMED
END:VEVENT`;
}

/**
 * Export reservations to CSV
 * @param {Array} reservations - Reservations to export
 * @returns {string} CSV content
 */
export function exportReservationsToCSV(reservations) {
  const headers = [
    'Date',
    'Time',
    'Customer Name',
    'Phone',
    'Email',
    'Party Size',
    'Table',
    'Status',
    'Type',
    'Special Requests'
  ];

  const rows = reservations.map(res => [
    format(parseISO(res.reservation_date), 'yyyy-MM-dd'),
    res.time_slot,
    res.customer_name,
    res.customer_phone,
    res.customer_email || '',
    res.party_size,
    res.table_number || '',
    res.status,
    res.type || 'regular',
    res.special_requests || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

// ============================================================================
// NOTIFICATION TRIGGERS
// ============================================================================

/**
 * Trigger notification for new reservation
 * @param {Object} reservation - New reservation
 * @param {Function} notifyFn - Notification function from triggers file
 */
export function notifyReservationCreated(reservation, notifyFn) {
  if (typeof notifyFn === 'function') {
    notifyFn({
      type: 'reservation_created',
      title: 'New Reservation',
      message: `${reservation.customer_name} - Party of ${reservation.party_size} on ${format(parseISO(reservation.reservation_date), 'MMM dd, yyyy')} at ${reservation.time_slot}`,
      data: reservation
    });
  }
}

/**
 * Trigger customer reminder notification
 * @param {Object} reservation - Reservation to remind
 * @param {Function} notifyFn - Notification function
 */
export function notifyCustomerReminder(reservation, notifyFn) {
  if (typeof notifyFn === 'function') {
    notifyFn({
      type: 'reservation_reminder',
      recipient: reservation.customer_phone,
      title: 'Reservation Reminder',
      message: `Reminder: Your reservation for ${reservation.party_size} guests is today at ${reservation.time_slot}. We look forward to seeing you!`,
      data: reservation
    });
  }
}

/**
 * Trigger table ready notification for waitlist
 * @param {Object} waitlistEntry - Waitlist entry
 * @param {Object} table - Available table
 * @param {Function} notifyFn - Notification function
 */
export function notifyTableReady(waitlistEntry, table, notifyFn) {
  if (typeof notifyFn === 'function') {
    notifyFn({
      type: 'table_ready',
      recipient: waitlistEntry.customer_phone,
      title: 'Table Ready!',
      message: `Good news! Table ${table.table_number} is now ready for your party of ${waitlistEntry.party_size}.`,
      data: { waitlistEntry, table }
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if reservation is editable
 * @param {Object} reservation - Reservation object
 * @returns {boolean}
 */
export function isReservationEditable(reservation) {
  if (!reservation) return false;
  if (['cancelled', 'completed', 'no_show'].includes(reservation.status)) return false;
  
  const resDate = parseISO(reservation.reservation_date);
  const now = new Date();
  
  return resDate > now;
}

/**
 * Check if reservation can be cancelled
 * @param {Object} reservation - Reservation object
 * @returns {Object} {canCancel: boolean, reason: string}
 */
export function canCancelReservation(reservation) {
  if (!reservation) return { canCancel: false, reason: 'No reservation found' };
  
  if (reservation.status === 'cancelled') {
    return { canCancel: false, reason: 'Already cancelled' };
  }
  
  if (reservation.status === 'completed') {
    return { canCancel: false, reason: 'Already completed' };
  }

  const resDate = parseISO(reservation.reservation_date);
  const [hour, min] = reservation.time_slot.split(':').map(Number);
  resDate.setHours(hour, min);
  
  const now = new Date();
  const hoursUntil = (resDate - now) / (1000 * 60 * 60);

  if (hoursUntil < 2) {
    return { canCancel: true, reason: 'Late cancellation (less than 2 hours notice)' };
  }

  return { canCancel: true, reason: '' };
}

/**
 * Generate QR code data for reservation
 * @param {Object} reservation - Reservation object
 * @returns {string} QR data string
 */
export function generateReservationQRData(reservation) {
  return JSON.stringify({
    id: reservation.id,
    name: reservation.customer_name,
    date: reservation.reservation_date,
    time: reservation.time_slot,
    party: reservation.party_size,
    table: reservation.table_number,
    type: 'reservation_checkin'
  });
}

/**
 * Parse QR code data
 * @param {string} qrData - QR code data string
 * @returns {Object|null} Parsed data or null
 */
export function parseReservationQRData(qrData) {
  try {
    const data = JSON.parse(qrData);
    if (data.type === 'reservation_checkin') {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export default {
  getAvailableTimeSlots,
  checkTableAvailability,
  findBestTableMatch,
  filterReservations,
  groupByDate,
  getUpcomingReservations,
  getTodaysReservations,
  validateReservation,
  validateEventBooking,
  calculateEventTotal,
  getDayPeakScore,
  getReservationStats,
  convertWaitlistToReservation,
  findMatchingWaitlistEntries,
  formatReservationStatus,
  formatEventType,
  generateICalEntry,
  exportReservationsToCSV,
  notifyReservationCreated,
  notifyCustomerReminder,
  notifyTableReady,
  isReservationEditable,
  canCancelReservation,
  generateReservationQRData,
  parseReservationQRData
};
