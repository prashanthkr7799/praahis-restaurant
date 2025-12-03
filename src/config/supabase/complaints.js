/**
 * Complaints Management Functions
 * Handle customer complaints and issue tracking
 */

import { supabase } from './client';

/**
 * Create a complaint/issue report for an order
 */
export const createComplaint = async (complaintData) => {
  try {
    const { orderId, issueType, description, priority, actionTaken, reportedBy } = complaintData;

    if (!orderId) throw new Error('Order ID is required');
    if (!issueType) throw new Error('Issue type is required');
    const validIssueTypes = [
      'food_quality',
      'wrong_item',
      'wait_time',
      'service',
      'cleanliness',
      'billing',
      'other',
    ];
    if (!validIssueTypes.includes(issueType)) {
      throw new Error(`Invalid issue type. Must be one of: ${validIssueTypes.join(', ')}`);
    }
    if (!description || description.trim().length === 0) {
      throw new Error('Description is required');
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('restaurant_id, table_id, table_number')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');

    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .insert({
        restaurant_id: order.restaurant_id,
        order_id: orderId,
        table_id: order.table_id,
        table_number: order.table_number,
        issue_type: issueType,
        description: description.trim(),
        priority: priority || 'medium',
        status: 'open',
        action_taken: actionTaken || null,
        reported_by: reportedBy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (complaintError) throw complaintError;

    return {
      success: true,
      complaint,
    };
  } catch (error) {
    console.error('Error creating complaint:', error);
    throw new Error(`Failed to create complaint: ${error.message}`);
  }
};

/**
 * Update an existing complaint
 */
export const updateComplaint = async (complaintId, updates) => {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.status === 'resolved' && !updates.resolved_at) {
      payload.resolved_at = new Date().toISOString();
    }

    const { data: complaint, error } = await supabase
      .from('complaints')
      .update(payload)
      .eq('id', complaintId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      complaint,
    };
  } catch (error) {
    console.error('Error updating complaint:', error);
    throw new Error(`Failed to update complaint: ${error.message}`);
  }
};

/**
 * Get complaints for a restaurant with optional filters
 */
export const getComplaints = async (restaurantId, filters = {}) => {
  try {
    let query = supabase
      .from('complaints')
      .select('*, orders(id, order_number, table_number)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data: complaints, error } = await query;

    if (error) throw error;

    return complaints || [];
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw new Error(`Failed to fetch complaints: ${error.message}`);
  }
};
