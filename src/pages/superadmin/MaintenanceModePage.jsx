import React, { useEffect, useState } from 'react';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import { AlertTriangle, Clock, Calendar, Power, Shield } from 'lucide-react';
import { showSuccess, showError, showWarning } from '@shared/utils/helpers/toast.jsx';

const MaintenanceMode = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const [toggleConfig, setToggleConfig] = useState({
    title: 'System Maintenance',
    message: 'We are currently performing scheduled maintenance. The system will be back online shortly.',
    reason: ''
  });

  const [scheduleConfig, setScheduleConfig] = useState({
    title: 'Scheduled Maintenance',
    message: 'We will be performing system maintenance during this time.',
    startDate: '',
    startTime: '02:00',
    endDate: '',
    endTime: '04:00',
    estimatedDuration: 120
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseOwner.rpc('get_maintenance_status');

      if (error) throw error;

      setStatus(data);
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
      // Default to inactive if error
      setStatus({ is_active: false });
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async (activate) => {
    if (!toggleConfig.reason.trim() && activate) {
      showWarning('Please provide a reason for maintenance');
      return;
    }

    if (activate && !confirm('⚠️ This will make the platform inaccessible to users. Continue?')) {
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabaseOwner.auth.getUser();

      const { error } = await supabaseOwner.rpc('toggle_maintenance_mode', {
        p_is_active: activate,
        p_title: toggleConfig.title,
        p_message: toggleConfig.message,
        p_reason: toggleConfig.reason || (activate ? 'Manual activation' : 'Manual deactivation'),
        p_user_id: user?.id
      });

      if (error) throw error;

      showSuccess(`Maintenance mode ${activate ? 'activated' : 'deactivated'} successfully!`);
      setToggleConfig({
        title: 'System Maintenance',
        message: 'We are currently performing scheduled maintenance. The system will be back online shortly.',
        reason: ''
      });
      fetchStatus();
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      showError('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const scheduleMaintenance = async () => {
    if (!scheduleConfig.title.trim() || !scheduleConfig.message.trim()) {
      showWarning('Please fill in all required fields');
      return;
    }

    if (!scheduleConfig.startDate || !scheduleConfig.endDate) {
      showWarning('Please select start and end dates');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabaseOwner.auth.getUser();

      const startDateTime = new Date(`${scheduleConfig.startDate}T${scheduleConfig.startTime}:00`).toISOString();
      const endDateTime = new Date(`${scheduleConfig.endDate}T${scheduleConfig.endTime}:00`).toISOString();

      const { error } = await supabaseOwner.rpc('schedule_maintenance', {
        p_start_time: startDateTime,
        p_end_time: endDateTime,
        p_title: scheduleConfig.title,
        p_message: scheduleConfig.message,
        p_estimated_duration: scheduleConfig.estimatedDuration,
        p_user_id: user?.id
      });

      if (error) throw error;

      showSuccess('Maintenance scheduled successfully!');
      setShowScheduleModal(false);
      setScheduleConfig({
        title: 'Scheduled Maintenance',
        message: 'We will be performing system maintenance during this time.',
        startDate: '',
        startTime: '02:00',
        endDate: '',
        endTime: '04:00',
        estimatedDuration: 120
      });
      fetchStatus();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      showError('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading maintenance status...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Mode</h2>
          <p className="text-sm text-gray-400 mt-1">Control system-wide maintenance and scheduled downtime</p>
        </div>
      </div>

      {/* Current Status Card */}
      <div className={`rounded-lg shadow-lg p-6 ${
        status?.is_active ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border-2 border-green-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-full ${
              status?.is_active ? 'bg-red-200' : 'bg-green-200'
            }`}>
              {status?.is_active ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <Shield className="w-8 h-8 text-green-600" />
              )}
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${
                status?.is_active ? 'text-red-900' : 'text-green-900'
              }`}>
                {status?.is_active ? 'Maintenance Mode ACTIVE' : 'System Operating Normally'}
              </h3>
              <p className={`text-sm mt-1 ${
                status?.is_active ? 'text-red-700' : 'text-green-700'
              }`}>
                {status?.is_active 
                  ? 'Platform is currently under maintenance' 
                  : 'All systems operational'}
              </p>
            </div>
          </div>

          <div className={`px-6 py-3 rounded-lg font-bold text-lg ${
            status?.is_active 
              ? 'bg-red-600 text-white' 
              : 'bg-green-600 text-white'
          }`}>
            {status?.is_active ? 'DOWN' : 'ONLINE'}
          </div>
        </div>

        {status?.is_active && status?.activated_at && (
          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-sm text-red-700">
              <strong>Activated:</strong> {formatDate(status.activated_at)}
            </p>
            {status.title && (
              <p className="text-sm text-red-700 mt-1">
                <strong>Title:</strong> {status.title}
              </p>
            )}
            {status.message && (
              <p className="text-sm text-red-700 mt-1">
                <strong>Message:</strong> {status.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Toggle Maintenance */}
        <div className="bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Power className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Toggle</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={toggleConfig.title}
                onChange={(e) => setToggleConfig({ ...toggleConfig, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
              <textarea
                value={toggleConfig.message}
                onChange={(e) => setToggleConfig({ ...toggleConfig, message: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
              <input
                type="text"
                value={toggleConfig.reason}
                onChange={(e) => setToggleConfig({ ...toggleConfig, reason: e.target.value })}
                placeholder="e.g., Emergency database repair"
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {status?.is_active ? (
              <button
                onClick={() => toggleMaintenance(false)}
                disabled={processing}
                className="w-full px-4 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
              >
                {processing ? 'Processing...' : '✓ Disable Maintenance Mode'}
              </button>
            ) : (
              <button
                onClick={() => toggleMaintenance(true)}
                disabled={processing}
                className="w-full px-4 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
              >
                {processing ? 'Processing...' : '⚠️ Enable Maintenance Mode'}
              </button>
            )}
          </div>
        </div>

        {/* Schedule Maintenance */}
        <div className="bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Schedule Maintenance</h3>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Plan maintenance windows in advance. Users will be notified of upcoming downtime.
            </p>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold"
            >
              📅 Schedule New Maintenance
            </button>

            {status?.scheduled && !status?.is_active && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Upcoming Maintenance:</p>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Start:</strong> {formatDate(status.start_time)}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>End:</strong> {formatDate(status.end_time)}
                </p>
                {status.estimated_duration && (
                  <p className="text-sm text-blue-700">
                    <strong>Duration:</strong> {status.estimated_duration} minutes
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Admin Access</h4>
          </div>
          <p className="text-sm text-gray-600">
            Super admins can always access the platform, even during maintenance mode.
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Automatic Scheduling</h4>
          </div>
          <p className="text-sm text-gray-600">
            Scheduled maintenance activates and deactivates automatically at the specified times.
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-gray-900">User Notification</h4>
          </div>
          <p className="text-sm text-gray-600">
            Users see your custom message when they try to access the platform during maintenance.
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900">Important Notes:</p>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1">
              <li>• Restaurant managers and staff will not be able to access the system during maintenance</li>
              <li>• Orders and customer-facing features will be unavailable</li>
              <li>• Plan maintenance during low-traffic hours (e.g., 2 AM - 4 AM)</li>
              <li>• Notify restaurants in advance for scheduled maintenance</li>
              <li>• Keep maintenance windows as short as possible</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Schedule Maintenance Window</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={scheduleConfig.title}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, title: e.target.value })}
                  placeholder="e.g., Database Upgrade"
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message *</label>
                <textarea
                  value={scheduleConfig.message}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, message: e.target.value })}
                  placeholder="Message shown to users during maintenance"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={scheduleConfig.startDate}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={scheduleConfig.startTime}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={scheduleConfig.endDate}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Time *</label>
                  <input
                    type="time"
                    value={scheduleConfig.endTime}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={scheduleConfig.estimatedDuration}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, estimatedDuration: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Scheduled maintenance will activate automatically at the start time
                  and deactivate at the end time. You can also manually control it before/after.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 text-sm text-gray-300 bg-gray-900 border border-gray-600 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={scheduleMaintenance}
                disabled={processing}
                className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Scheduling...' : 'Schedule Maintenance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceMode;
