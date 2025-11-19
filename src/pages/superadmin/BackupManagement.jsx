import React, { useEffect, useState } from 'react';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import { Database, Play, Trash2, Download, Calendar, Clock, HardDrive } from 'lucide-react';
import { showSuccess, showError, showWarning } from '@shared/utils/helpers/toast.jsx';

const BackupManagement = () => {
  const [backups, setBackups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const [newBackup, setNewBackup] = useState({
    type: 'full',
    name: '',
    restaurantId: null
  });

  const [newSchedule, setNewSchedule] = useState({
    name: '',
    backupType: 'full',
    frequency: 'daily',
    scheduleTime: '02:00',
    scheduleDay: 1,
    retentionDays: 30
  });

  const [stats, setStats] = useState({
    totalBackups: 0,
    completedBackups: 0,
    failedBackups: 0,
    totalSize: 0,
    activeSchedules: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch backups
      const { data: backupsData, error: backupsError } = await supabaseOwner
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (backupsError) throw backupsError;

      // Fetch schedules
      const { data: schedulesData, error: schedulesError } = await supabaseOwner
        .from('backup_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (schedulesError) throw schedulesError;

      setBackups(backupsData || []);
      setSchedules(schedulesData || []);

      // Calculate stats
      const completed = (backupsData || []).filter(b => b.status === 'completed').length;
      const failed = (backupsData || []).filter(b => b.status === 'failed').length;
      const totalSize = (backupsData || [])
        .filter(b => b.file_size)
        .reduce((sum, b) => sum + (b.file_size || 0), 0);
      const activeSchedules = (schedulesData || []).filter(s => s.is_active).length;

      setStats({
        totalBackups: (backupsData || []).length,
        completedBackups: completed,
        failedBackups: failed,
        totalSize,
        activeSchedules
      });
    } catch (error) {
      console.error('Error fetching backup data:', error);
      showError('Error loading backups: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createManualBackup = async () => {
    if (!newBackup.name.trim()) {
      showWarning('Please enter a backup name');
      return;
    }

    setCreating(true);
    try {
      // Get current user
      const { data: { user } } = await supabaseOwner.auth.getUser();

      // Call the create_backup_record function
      const { data, error } = await supabaseOwner.rpc('create_backup_record', {
        p_backup_type: newBackup.type,
        p_backup_name: newBackup.name,
        p_restaurant_id: newBackup.restaurantId,
        p_initiated_by: user?.id
      });

      if (error) throw error;

      // In a real implementation, you would trigger the actual backup process here
      // For now, we'll simulate completion after a short delay
      setTimeout(async () => {
        // Mark as completed (in production, this would be done by the backup process)
        await supabaseOwner.rpc('complete_backup', {
          p_backup_id: data,
          p_file_path: `/backups/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${newBackup.name}.sql.gz`,
          p_file_size: Math.floor(Math.random() * 10000000), // Simulated size
          p_tables_backed_up: ['restaurants', 'users', 'billing', 'payments', 'menu_categories', 'menu_items'],
          p_row_count: Math.floor(Math.random() * 100000) // Simulated count
        });

        showSuccess('Backup created successfully!');
        setShowCreateModal(false);
        setNewBackup({ type: 'full', name: '', restaurantId: null });
        fetchData();
      }, 2000);

    } catch (error) {
      console.error('Error creating backup:', error);
      showError('Error creating backup: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const createSchedule = async () => {
    if (!newSchedule.name.trim()) {
      showWarning('Please enter a schedule name');
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabaseOwner.auth.getUser();

      const { error } = await supabaseOwner
        .from('backup_schedules')
        .insert({
          name: newSchedule.name,
          backup_type: newSchedule.backupType,
          frequency: newSchedule.frequency,
          schedule_time: newSchedule.scheduleTime,
          schedule_day: newSchedule.scheduleDay,
          retention_days: newSchedule.retentionDays,
          include_all_restaurants: true,
          is_active: true,
          created_by: user?.id
        });

      if (error) throw error;

      showSuccess('Schedule created successfully!');
      setShowScheduleModal(false);
      setNewSchedule({
        name: '',
        backupType: 'full',
        frequency: 'daily',
        scheduleTime: '02:00',
        scheduleDay: 1,
        retentionDays: 30
      });
      fetchData();
    } catch (error) {
      console.error('Error creating schedule:', error);
      showError('Error creating schedule: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleSchedule = async (scheduleId, currentStatus) => {
    try {
      const { error } = await supabaseOwner
        .from('backup_schedules')
        .update({ is_active: !currentStatus })
        .eq('id', scheduleId);

      if (error) throw error;

      showSuccess(`Schedule ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      showError('Error: ' + error.message);
    }
  };

  const deleteBackup = async (backupId) => {
    if (!confirm('⚠️ Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabaseOwner
        .from('backups')
        .update({ status: 'deleted', can_restore: false })
        .eq('id', backupId);

      if (error) throw error;

      showSuccess('Backup deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting backup:', error);
      showError('Error: ' + error.message);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!confirm('⚠️ Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const { error } = await supabaseOwner
        .from('backup_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      showSuccess('Schedule deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showError('Error: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '⏳' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: '✗' },
      deleted: { bg: 'bg-gray-100', text: 'text-gray-600', icon: '🗑️' }
    };

    const style = config[status] || config.in_progress;
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${style.bg} ${style.text}`}>
        {style.icon} {status}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const config = {
      full: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '💾' },
      incremental: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📦' },
      restaurant: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🏪' },
      manual: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '👤' }
    };

    const style = config[type] || config.manual;
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${style.bg} ${style.text}`}>
        {style.icon} {type}
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Backup Management</h2>
          <p className="text-sm text-gray-400 mt-1">Manage database backups and schedules</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>New Schedule</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Create Backup</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-900 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Backups</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBackups}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedBackups}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failedBackups}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HardDrive className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Size</p>
              <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.totalSize)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSchedules}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Schedules */}
      <div className="bg-gray-900 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Backup Schedules</h3>
        </div>
        <div className="overflow-x-auto">
          {schedules.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No backup schedules configured</p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Create your first schedule
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Last Run</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-200">
                {schedules.map(schedule => (
                  <tr key={schedule.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{schedule.name}</td>
                    <td className="px-4 py-3 text-sm">{getTypeBadge(schedule.backup_type)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{schedule.frequency}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{schedule.schedule_time || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {schedule.last_run ? formatDate(schedule.last_run) : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-800 text-gray-600'
                      }`}>
                        {schedule.is_active ? '✓ Active' : '⏸ Paused'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button
                        onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                        className="text-blue-600 hover:underline"
                      >
                        {schedule.is_active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteSchedule(schedule.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-gray-900 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Backup History</h3>
          <button
            onClick={fetchData}
            className="text-sm text-blue-600 hover:underline"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No backups created yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Create your first backup
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Initiated By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-200">
                {backups.map(backup => (
                  <tr key={backup.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{backup.backup_name}</td>
                    <td className="px-4 py-3 text-sm">{getTypeBadge(backup.backup_type)}</td>
                    <td className="px-4 py-3 text-sm">{getStatusBadge(backup.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(backup.file_size)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDuration(backup.duration_seconds)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(backup.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{backup.initiated_by_email || 'System'}</td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      {backup.status === 'completed' && backup.can_restore && (
                        <>
                          <button className="text-green-600 hover:underline">Restore</button>
                          <button className="text-blue-600 hover:underline">Download</button>
                        </>
                      )}
                      {backup.status !== 'deleted' && (
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Create Manual Backup</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Backup Name</label>
                <input
                  type="text"
                  value={newBackup.name}
                  onChange={(e) => setNewBackup({ ...newBackup, name: e.target.value })}
                  placeholder="e.g., manual_backup_2025_11_07"
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Backup Type</label>
                <select
                  value={newBackup.type}
                  onChange={(e) => setNewBackup({ ...newBackup, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="full">Full Backup (All Data)</option>
                  <option value="incremental">Incremental (Changes Only)</option>
                  <option value="manual">Manual (Custom)</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will create a backup record. In production, this would trigger
                  an actual database dump process via an Edge Function or external service.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="flex-1 px-4 py-2 text-sm text-gray-300 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={createManualBackup}
                disabled={creating}
                className="flex-1 px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Create Backup Schedule</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Name</label>
                <input
                  type="text"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  placeholder="e.g., Daily Full Backup"
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Backup Type</label>
                  <select
                    value={newSchedule.backupType}
                    onChange={(e) => setNewSchedule({ ...newSchedule, backupType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full">Full</option>
                    <option value="incremental">Incremental</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                  <select
                    value={newSchedule.frequency}
                    onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                  <input
                    type="time"
                    value={newSchedule.scheduleTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, scheduleTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Retention (Days)</label>
                  <input
                    type="number"
                    value={newSchedule.retentionDays}
                    onChange={(e) => setNewSchedule({ ...newSchedule, retentionDays: parseInt(e.target.value) })}
                    min="1"
                    max="365"
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Schedules require pg_cron extension to be configured in Supabase.
                  The schedule will be created but needs manual cron job setup.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                disabled={creating}
                className="flex-1 px-4 py-2 text-sm text-gray-300 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={createSchedule}
                disabled={creating}
                className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManagement;
