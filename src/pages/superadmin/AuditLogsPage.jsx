import React, { useEffect, useState, useCallback } from 'react';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 20;
  
  // Filters
  const [filters, setFilters] = useState({
    action: 'all',
    entityType: 'all',
    severity: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'deleted', label: 'Deleted' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'payment', label: 'Payment' },
    { value: 'backup', label: 'Backup' }
  ];

  const entityTypes = [
    { value: 'all', label: 'All Entities' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'user', label: 'User' },
    { value: 'billing', label: 'Billing' },
    { value: 'payment', label: 'Payment' },
    { value: 'backup', label: 'Backup' },
    { value: 'menu', label: 'Menu' },
    { value: 'order', label: 'Order' }
  ];

  const severityLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'info', label: 'Info', color: 'blue' },
    { value: 'warning', label: 'Warning', color: 'yellow' },
    { value: 'error', label: 'Error', color: 'red' },
    { value: 'critical', label: 'Critical', color: 'purple' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const getDateFilter = useCallback(() => {
    const now = new Date();
    let startDate, endDate;

    switch (filters.dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        endDate = new Date().toISOString();
        break;
      case 'month':
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
        endDate = new Date().toISOString();
        break;
      case 'custom':
        startDate = filters.startDate ? new Date(filters.startDate).toISOString() : null;
        endDate = filters.endDate ? new Date(filters.endDate).toISOString() : null;
        break;
      default:
        return null;
    }

    return { startDate, endDate };
  }, [filters.dateRange, filters.startDate, filters.endDate]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabaseOwner
        .from('audit_trail')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.action !== 'all') {
        query = query.ilike('action', `%${filters.action}%`);
      }

      if (filters.entityType !== 'all') {
        query = query.eq('entity_type', filters.entityType);
      }

      if (filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
      }

      if (filters.searchTerm) {
        query = query.or(`entity_name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,actor_email.ilike.%${filters.searchTerm}%`);
      }

      const dateFilter = getDateFilter();
      if (dateFilter && dateFilter.startDate) {
        query = query.gte('created_at', dateFilter.startDate);
      }
      if (dateFilter && dateFilter.endDate) {
        query = query.lte('created_at', dateFilter.endDate);
      }

      // Pagination
      const from = (currentPage - 1) * logsPerPage;
      const to = from + logsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / logsPerPage));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      alert('❌ Error loading audit logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, logsPerPage, getDateFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const resetFilters = () => {
    setFilters({
      action: 'all',
      entityType: 'all',
      severity: 'all',
      dateRange: 'all',
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
    setCurrentPage(1);
  };

  const getSeverityBadge = (severity) => {
    const config = {
      info: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'ℹ️' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚠️' },
      error: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' },
      critical: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🚨' }
    };

    const style = config[severity] || config.info;
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${style.bg} ${style.text}`}>
        {style.icon} {severity}
      </span>
    );
  };

  const getActionIcon = (action) => {
    if (action.includes('create')) return '➕';
    if (action.includes('update')) return '✏️';
    if (action.includes('delete')) return '🗑️';
    if (action.includes('login')) return '🔐';
    if (action.includes('payment')) return '💰';
    if (action.includes('backup')) return '💾';
    return '📝';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const activeFiltersCount = Object.values(filters).filter((v, i) => 
    i < 6 && v !== 'all' && v !== ''
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
          <p className="text-sm text-gray-400 mt-1">
            View all system activity and user actions
          </p>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-sm text-gray-400 hover:text-gray-900"
            >
              Reset All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              placeholder="Search entity, description, or actor..."
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {actionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {entityTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {severityLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-900 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading audit logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64">
            <p className="text-gray-400 text-lg mb-2">No audit logs found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-200">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center space-x-1">
                          <span>{getActionIcon(log.action)}</span>
                          <span className="font-medium text-gray-900">{log.action}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{log.entity_name || 'N/A'}</span>
                          <span className="text-xs text-gray-500">{log.entity_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.actor_email || 'System'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                        {log.description}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getSeverityBadge(log.severity)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => viewLogDetails(log)}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Audit Log Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-sm text-gray-100 font-mono">{selectedLog.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedLog.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Action</label>
                  <p className="text-sm text-gray-900">
                    {getActionIcon(selectedLog.action)} {selectedLog.action}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Severity</label>
                  <div className="mt-1">
                    {getSeverityBadge(selectedLog.severity)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Entity Type</label>
                  <p className="text-sm text-gray-900">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Entity Name</label>
                  <p className="text-sm text-gray-900">{selectedLog.entity_name || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Entity ID</label>
                <p className="text-sm text-gray-100 font-mono">{selectedLog.entity_id || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Actor Email</label>
                  <p className="text-sm text-gray-900">{selectedLog.actor_email || 'System'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Actor ID</label>
                  <p className="text-sm text-gray-100 font-mono">{selectedLog.actor_id || 'N/A'}</p>
                </div>
              </div>

              {selectedLog.ip_address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">IP Address</label>
                  <p className="text-sm text-gray-100 font-mono">{selectedLog.ip_address}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm text-gray-900">{selectedLog.description}</p>
              </div>

              {/* Changed Fields */}
              {selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Changed Fields</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedLog.changed_fields.map((field, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Metadata</label>
                  <pre className="mt-2 p-3 bg-gray-800 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-800 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 text-sm text-white bg-gray-600 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
