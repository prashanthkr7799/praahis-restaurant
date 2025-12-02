/**
 * Activity Logger Utility
 * Logs user and menu item activity for audit purposes
 */

import { supabase } from '@config/supabase';

/**
 * Log when a user is created
 */
export const logUserCreated = async (userId, details) => {
  try {
    await supabase.from('activity_logs').insert({
      action: 'user_created',
      user_id: userId,
      details: details,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log user creation:', error);
  }
};

/**
 * Log when a user is updated
 */
export const logUserUpdated = async (userId, details) => {
  try {
    await supabase.from('activity_logs').insert({
      action: 'user_updated',
      user_id: userId,
      details: details,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log user update:', error);
  }
};

/**
 * Log when a menu item is created
 */
export const logMenuItemCreated = async (itemId, details) => {
  try {
    await supabase.from('activity_logs').insert({
      action: 'menu_item_created',
      item_id: itemId,
      details: details,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log menu item creation:', error);
  }
};

/**
 * Log when a menu item is updated
 */
export const logMenuItemUpdated = async (itemId, details) => {
  try {
    await supabase.from('activity_logs').insert({
      action: 'menu_item_updated',
      item_id: itemId,
      details: details,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log menu item update:', error);
  }
};
