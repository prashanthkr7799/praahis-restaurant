/**
 * Complaint Service
 * 
 * Handles all complaint-related operations with validation and error handling
 * Uses single issue_type field (not array) per schema v1.1.0
 */

import { supabase } from './supabaseClient';
import logger from '@shared/utils/helpers/logger';

/**
 * Valid issue types for complaints
 */
export const ISSUE_TYPES = {
  FOOD_QUALITY: 'food_quality',
  WRONG_ITEM: 'wrong_item',
  WAIT_TIME: 'wait_time',
  SERVICE: 'service',
  CLEANLINESS: 'cleanliness',
  BILLING: 'billing',
  OTHER: 'other'
};

/**
 * Valid complaint priorities
 */
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Valid complaint statuses
 */
export const STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

/**
 * Create a new complaint
 * @param {Object} data - Complaint data
 * @param {string} data.orderId - Order ID (required)
 * @param {Array<string>} data.issueTypes - Array of issue types from ISSUE_TYPES (required)
 * @param {string} data.description - Complaint description (required)
 * @param {string} data.priority - Priority level (default: 'medium')
 * @param {string} data.actionTaken - Initial action taken (optional)
 * @param {string} data.reportedBy - User ID who reported (optional)
 * @returns {Promise<Object>} Created complaint
 */
export const createComplaint = async (data) => {
  try {
    const { orderId, issueTypes, description, priority = 'medium', actionTaken, reportedBy } = data;

    // Validation
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!issueTypes || !Array.isArray(issueTypes) || issueTypes.length === 0) {
      throw new Error('At least one issue type is required');
    }

    const validIssueTypes = Object.values(ISSUE_TYPES);
    const invalidTypes = issueTypes.filter(type => !validIssueTypes.includes(type));
    if (invalidTypes.length > 0) {
      throw new Error(`Invalid issue types: ${invalidTypes.join(', ')}. Must be one of: ${validIssueTypes.join(', ')}`);
    }

    if (!description || description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (description.trim().length < 10) {
      throw new Error('Description must be at least 10 characters long');
    }

    const validPriorities = Object.values(PRIORITIES);
    if (!validPriorities.includes(priority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('restaurant_id, table_id, table_number')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');

    // Insert complaint with issue_types as array
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .insert({
        restaurant_id: order.restaurant_id,
        order_id: orderId,
        table_id: order.table_id,
        table_number: order.table_number,
        issue_types: issueTypes, // Changed from issue_type to issue_types (array)
        description: description.trim(),
        priority,
        status: STATUSES.OPEN,
        action_taken: actionTaken?.trim() || null,
        reported_by: reportedBy || null
      })
      .select(`
        *,
        orders!inner(order_number, customer_name, total),
        tables(table_number),
        reporter:reported_by(name, email),
        resolver:resolved_by(name, email)
      `)
      .single();

    if (complaintError) throw complaintError;

    logger.log('✅ Complaint created:', complaint.id);
    return {
      success: true,
      complaint
    };
  } catch (error) {
    console.error('❌ Error creating complaint:', error);
    throw new Error(`Failed to create complaint: ${error.message}`);
  }
};

/**
 * Update an existing complaint
 * @param {string} id - Complaint ID
 * @param {Object} updates - Fields to update
 * @param {string} updates.status - New status
 * @param {string} updates.priority - New priority
 * @param {string} updates.actionTaken - Action taken notes
 * @param {string} updates.resolvedBy - User ID who resolved
 * @returns {Promise<Object>} Updated complaint
 */
export const updateComplaint = async (id, updates) => {
  try {
    if (!id) {
      throw new Error('Complaint ID is required');
    }

    const payload = {
      updated_at: new Date().toISOString()
    };

    // Validate and add status if provided
    if (updates.status) {
      const validStatuses = Object.values(STATUSES);
      if (!validStatuses.includes(updates.status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      payload.status = updates.status;

      // Auto-set resolved_at if status is resolved
      if (updates.status === STATUSES.RESOLVED && !updates.resolvedAt) {
        payload.resolved_at = new Date().toISOString();
      }
    }

    // Validate and add priority if provided
    if (updates.priority) {
      const validPriorities = Object.values(PRIORITIES);
      if (!validPriorities.includes(updates.priority)) {
        throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }
      payload.priority = updates.priority;
    }

    // Add action taken if provided
    if (updates.actionTaken !== undefined) {
      payload.action_taken = updates.actionTaken?.trim() || null;
    }

    // Add resolved by if provided
    if (updates.resolvedBy) {
      payload.resolved_by = updates.resolvedBy;
    }

    // Add resolved_at if explicitly provided
    if (updates.resolvedAt) {
      payload.resolved_at = updates.resolvedAt;
    }

    const { data: complaint, error } = await supabase
      .from('complaints')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        orders(order_number, customer_name, total),
        tables(table_number),
        reporter:reported_by(name, email),
        resolver:resolved_by(name, email)
      `)
      .single();

    if (error) throw error;
    if (!complaint) throw new Error('Complaint not found');

    logger.log('✅ Complaint updated:', id);
    return {
      success: true,
      complaint
    };
  } catch (error) {
    console.error('❌ Error updating complaint:', error);
    throw new Error(`Failed to update complaint: ${error.message}`);
  }
};

/**
 * Get complaints for a restaurant with optional filters
 * @param {string} restaurantId - Restaurant ID
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @param {string} filters.priority - Filter by priority
 * @param {string} filters.issueType - Filter by issue type
 * @param {Date} filters.startDate - Filter from date
 * @param {Date} filters.endDate - Filter to date
 * @param {number} filters.limit - Max results (default: 100)
 * @returns {Promise<Array>} Array of complaints
 */
export const getComplaintsByRestaurant = async (restaurantId, filters = {}) => {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    let query = supabase
      .from('complaints')
      .select(`
        *,
        orders(order_number, customer_name, total, order_type),
        tables(table_number),
        reporter:reported_by(name, email),
        resolver:resolved_by(name, email)
      `)
      .eq('restaurant_id', restaurantId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.issueType) {
      query = query.eq('issue_type', filters.issueType);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    // Order by created date (newest first) and limit
    query = query
      .order('created_at', { ascending: false })
      .limit(filters.limit || 100);

    const { data: complaints, error } = await query;

    if (error) throw error;

    return {
      success: true,
      complaints: complaints || [],
      count: complaints?.length || 0
    };
  } catch (error) {
    console.error('❌ Error fetching complaints:', error);
    throw new Error(`Failed to fetch complaints: ${error.message}`);
  }
};

/**
 * Mark a complaint as resolved with notes
 * @param {string} id - Complaint ID
 * @param {string} notes - Resolution notes/action taken
 * @param {string} resolvedBy - User ID who resolved
 * @returns {Promise<Object>} Updated complaint
 */
export const markComplaintResolved = async (id, notes, resolvedBy) => {
  try {
    if (!id) {
      throw new Error('Complaint ID is required');
    }

    if (!notes || notes.trim().length === 0) {
      throw new Error('Resolution notes are required');
    }

    if (!resolvedBy) {
      throw new Error('Resolved by user ID is required');
    }

    const { data: complaint, error } = await supabase
      .from('complaints')
      .update({
        status: STATUSES.RESOLVED,
        action_taken: notes.trim(),
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        orders(order_number, customer_name, total),
        tables(table_number),
        reporter:reported_by(name, email),
        resolver:resolved_by(name, email)
      `)
      .single();

    if (error) throw error;
    if (!complaint) throw new Error('Complaint not found');

    logger.log('✅ Complaint resolved:', id);
    return {
      success: true,
      complaint
    };
  } catch (error) {
    console.error('❌ Error resolving complaint:', error);
    throw new Error(`Failed to resolve complaint: ${error.message}`);
  }
};

/**
 * Get complaint statistics for a restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {Date} startDate - Start date for stats
 * @param {Date} endDate - End date for stats
 * @returns {Promise<Object>} Complaint statistics
 */
export const getComplaintStats = async (restaurantId, startDate, endDate) => {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate || new Date();

    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) throw error;

    const stats = {
      total: complaints?.length || 0,
      byStatus: {},
      byPriority: {},
      byIssueType: {},
      avgResolutionTime: 0,
      resolved: 0,
      open: 0
    };

    // Calculate statistics
    Object.values(STATUSES).forEach(status => {
      stats.byStatus[status] = 0;
    });

    Object.values(PRIORITIES).forEach(priority => {
      stats.byPriority[priority] = 0;
    });

    Object.values(ISSUE_TYPES).forEach(type => {
      stats.byIssueType[type] = 0;
    });

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    complaints?.forEach(complaint => {
      // Count by status
      stats.byStatus[complaint.status]++;

      // Count by priority
      stats.byPriority[complaint.priority]++;

      // Count by issue type
      stats.byIssueType[complaint.issue_type]++;

      // Calculate resolution time for resolved complaints
      if (complaint.status === STATUSES.RESOLVED && complaint.resolved_at) {
        const createdAt = new Date(complaint.created_at);
        const resolvedAt = new Date(complaint.resolved_at);
        const resolutionTime = (resolvedAt - createdAt) / (1000 * 60 * 60); // Hours
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }

      // Count open vs resolved
      if (complaint.status === STATUSES.OPEN || complaint.status === STATUSES.IN_PROGRESS) {
        stats.open++;
      } else if (complaint.status === STATUSES.RESOLVED || complaint.status === STATUSES.CLOSED) {
        stats.resolved++;
      }
    });

    // Calculate average resolution time in hours
    stats.avgResolutionTime = resolvedCount > 0 ? (totalResolutionTime / resolvedCount).toFixed(2) : 0;

    return {
      success: true,
      stats,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    };
  } catch (error) {
    console.error('❌ Error fetching complaint stats:', error);
    throw new Error(`Failed to fetch complaint stats: ${error.message}`);
  }
};

/**
 * Delete a complaint (soft delete by setting status to closed)
 * @param {string} id - Complaint ID
 * @returns {Promise<Object>} Result
 */
export const deleteComplaint = async (id) => {
  try {
    if (!id) {
      throw new Error('Complaint ID is required');
    }

    // Soft delete by setting status to closed
    const { error } = await supabase
      .from('complaints')
      .update({
        status: STATUSES.CLOSED,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    logger.log('✅ Complaint closed:', id);
    return {
      success: true,
      message: 'Complaint closed successfully'
    };
  } catch (error) {
    console.error('❌ Error deleting complaint:', error);
    throw new Error(`Failed to delete complaint: ${error.message}`);
  }
};

export default {
  createComplaint,
  updateComplaint,
  getComplaintsByRestaurant,
  markComplaintResolved,
  getComplaintStats,
  deleteComplaint,
  ISSUE_TYPES,
  PRIORITIES,
  STATUSES
};
