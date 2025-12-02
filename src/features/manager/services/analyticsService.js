/**
 * Data Backup and Restore Utilities
 * Handle data export, import, and backup operations
 */

import { supabase } from '@config/supabase';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

/**
 * Export all data from database
 * @returns {Promise<object>} All exported data
 */
export const exportAllData = async () => {
  try {
  const tables = ['menu_items', 'orders', 'tables', 'users'];
    const exportData = {
      export_date: new Date().toISOString(),
      version: '1.0',
      data: {},
    };

    toast.loading('Exporting data...', { id: 'export' });

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*');

        if (error) {
          exportData.data[tableName] = { error: error.message, data: [] };
        } else {
          exportData.data[tableName] = data || [];
        }
      } catch (err) {
        console.warn(`Error exporting ${tableName}:`, err);
        exportData.data[tableName] = { error: err.message, data: [] };
      }
    }

    toast.success('Data exported successfully', { id: 'export' });
    return exportData;
  } catch (error) {
    toast.error('Failed to export data', { id: 'export' });
    throw error;
  }
};

/**
 * Download backup as JSON file
 * @param {object} data - Data to backup
 * @param {string} filename - Filename
 */
export const downloadBackup = (data, filename = 'restaurant-backup') => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const timestamp = new Date().toISOString().split('T')[0];
    saveAs(blob, `${filename}-${timestamp}.json`);
    toast.success('Backup downloaded successfully');
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download backup');
    throw error;
  }
};

/**
 * Import data from backup file
 * @param {File} file - JSON backup file
 * @returns {Promise<object>} Parsed data
 */
export const importData = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Restore data to database (DANGER: Will overwrite existing data)
 * @param {object} backupData - Backup data to restore
 * @param {object} options - Restore options
 */
export const restoreData = async (backupData, options = {}) => {
  const { clearExisting = false } = options;

  try {
    toast.loading('Restoring data...', { id: 'restore' });

    if (!backupData.data) {
      throw new Error('Invalid backup format');
    }

    const results = [];

    for (const [tableName, tableData] of Object.entries(backupData.data)) {
      try {
        // Skip if there's an error in backup
        if (tableData.error) {
          results.push({ table: tableName, status: 'skipped', error: tableData.error });
          continue;
        }

        // Clear existing data if requested
        if (clearExisting) {
          await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }

        // Insert backup data
        if (Array.isArray(tableData) && tableData.length > 0) {
          const { error } = await supabase.from(tableName).insert(tableData);

          if (error) {
            results.push({ table: tableName, status: 'failed', error: error.message });
          } else {
            results.push({ table: tableName, status: 'success', count: tableData.length });
          }
        } else {
          results.push({ table: tableName, status: 'empty' });
        }
      } catch (err) {
        results.push({ table: tableName, status: 'error', error: err.message });
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const failedCount = results.filter((r) => r.status === 'failed' || r.status === 'error').length;

    if (failedCount === 0) {
      toast.success(`Data restored successfully (${successCount} tables)`, { id: 'restore' });
    } else {
      toast.warning(
        `Restore completed with errors: ${successCount} success, ${failedCount} failed`,
        { id: 'restore' }
      );
    }

    return { results, success: failedCount === 0 };
  } catch (error) {
    toast.error('Failed to restore data', { id: 'restore' });
    throw error;
  }
};

/**
 * Export specific table data
 * @param {string} tableName - Table name
 * @param {object} filters - Optional filters
 * @returns {Promise<Array>} Table data
 */
export const exportTable = async (tableName, filters = {}) => {
  try {
    let query = supabase.from(tableName).select('*');

    // Apply filters
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Export ${tableName} error:`, error);
    throw error;
  }
};

/**
 * Schedule automatic backup (using localStorage reminder)
 * @param {number} intervalDays - Interval in days
 */
export const scheduleBackup = (intervalDays = 7) => {
  const lastBackup = localStorage.getItem('last_backup_date');
  const now = new Date();

  if (!lastBackup) {
    localStorage.setItem('last_backup_date', now.toISOString());
    return { needsBackup: true, daysSince: Infinity };
  }

  const lastBackupDate = new Date(lastBackup);
  const daysSince = Math.floor((now - lastBackupDate) / (1000 * 60 * 60 * 24));

  if (daysSince >= intervalDays) {
    return { needsBackup: true, daysSince };
  }

  return { needsBackup: false, daysSince };
};

/**
 * Mark backup as completed
 */
export const markBackupCompleted = () => {
  localStorage.setItem('last_backup_date', new Date().toISOString());
};

/**
 * Get backup statistics
 * @returns {Promise<object>} Backup stats
 */
export const getBackupStats = async () => {
  try {
  const tables = ['menu_items', 'orders', 'tables', 'users'];
    const stats = {};

    for (const tableName of tables) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      stats[tableName] = error ? 0 : count;
    }

    const lastBackup = localStorage.getItem('last_backup_date');

    return {
      tables: stats,
      totalRecords: Object.values(stats).reduce((a, b) => a + b, 0),
      lastBackupDate: lastBackup ? new Date(lastBackup).toLocaleString() : 'Never',
    };
  } catch (error) {
    console.error('Get backup stats error:', error);
    return null;
  }
};

export default {
  exportAllData,
  downloadBackup,
  importData,
  restoreData,
  exportTable,
  scheduleBackup,
  markBackupCompleted,
  getBackupStats,
};
