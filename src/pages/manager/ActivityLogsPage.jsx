/**
 * ActivityLogs Component
 * View system activity audit trail
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Filter, Download, RefreshCw, Search } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { formatDateTime } from '@shared/utils/helpers/formatters';
import { ListSkeleton } from '@shared/components/feedback/LoadingSkeleton';
import DataTable from '@shared/components/compounds/DataTable';
import Badge from '@shared/components/primitives/Badge';
import toast from 'react-hot-toast';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    action: 'all',
    entity: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const [users, setUsers] = useState([]);

  const getUserById = useCallback(
    (id) => users.find((u) => u.id === id) || null,
    [users]
  );

  useEffect(() => {
    loadActivityLogs();
    loadUsers();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...logs];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action?.toLowerCase().includes(searchLower) ||
          (log.entity_type || log.metadata?.entity_type)?.toLowerCase?.().includes(searchLower) ||
          getUserById(log.user_id)?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Action filter
    if (filters.action !== 'all') {
      filtered = filtered.filter((log) => log.action === filters.action);
    }

    // Entity type filter
    if (filters.entity !== 'all') {
      filtered = filtered.filter((log) => (log.entity_type || log.metadata?.entity_type) === filters.entity);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (log) => new Date(log.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (log) => new Date(log.created_at) <= endDate
      );
    }

    setFilteredLogs(filtered);
  }, [logs, filters, getUserById]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      // Normalize logs to keep backward-compatible fields for UI filters
      const normalized = (data || []).map((log) => ({
        ...log,
        entity_type: log.entity_type || log.metadata?.entity_type || null,
        entity_id: log.entity_id || log.metadata?.entity_id || null,
        details: log.details || log.metadata?.details || log.metadata || {},
      }));
      setLogs(normalized);
    } catch (error) {
      console.error('Error loading activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  

  const handleRefresh = () => {
    setRefreshing(true);
    loadActivityLogs();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      action: 'all',
      entity: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  const handleExportCSV = () => {
    try {
      let csv = 'Date & Time,User,Action,Entity Type,Entity ID,Details\n';
      
      filteredLogs.forEach((log) => {
        csv += `"${formatDateTime(log.created_at)}",`;
  const u = getUserById(log.user_id);
  csv += `"${u?.full_name || 'Unknown'}",`;
        csv += `"${log.action}",`;
        csv += `"${log.entity_type}",`;
        csv += `"${log.entity_id || 'N/A'}",`;
        csv += `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('Activity logs exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export activity logs');
    }
  };

  const getActionBadgeVariant = (action) => {
    const variants = {
      create: 'success',
      update: 'info',
      delete: 'danger',
      login: 'default',
      logout: 'default',
    };
    return variants[action] || 'default';
  };

  const columns = [
    {
      header: 'Date & Time',
      field: 'created_at',
      render: (row) => (
        <div className="text-sm text-foreground">
          {formatDateTime(row.created_at)}
        </div>
      ),
    },
    {
      header: 'User',
      field: 'user',
      render: (row) => {
        const u = getUserById(row.user_id);
        return (
          <div>
            <div className="font-medium text-foreground">
              {u?.full_name || 'Unknown User'}
            </div>
            <div className="text-sm text-muted-foreground">{u?.email}</div>
          </div>
        );
      },
    },
    {
      header: 'Action',
      field: 'action',
      render: (row) => (
        <Badge variant={getActionBadgeVariant(row.action)} size="sm">
          {row.action?.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Entity',
      field: 'entity_type',
      render: (row) => (
        <div>
          <div className="font-medium text-foreground capitalize">
            {row.entity_type?.replace('_', ' ')}
          </div>
          {row.entity_id && (
            <div className="text-xs text-muted-foreground font-mono">
              ID: {row.entity_id.slice(0, 8)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Details',
      field: 'details',
      render: (row) => (
        <div className="max-w-xs">
          {row.details && Object.keys(row.details).length > 0 ? (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                View details
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(row.details, null, 2)}
              </pre>
            </details>
          ) : (
            <span className="text-sm text-muted-foreground">No details</span>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="h-8 w-40 bg-white/10 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-white/5 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-white/10 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
        <ListSkeleton items={8} />
      </div>
    );
  }

  const uniqueActions = [...new Set(logs.map(log => log.action))].filter(Boolean);
  const uniqueEntities = [...new Set(logs.map(log => log.entity_type || log.metadata?.entity_type))].filter(Boolean);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground mt-1">Track system actions and audit trail</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-muted-foreground">Total Logs</div>
          <div className="text-2xl font-bold text-foreground">{logs.length}</div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-muted-foreground">Filtered Results</div>
          <div className="text-2xl font-bold text-primary">{filteredLogs.length}</div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-muted-foreground">Active Users</div>
          <div className="text-2xl font-bold text-success">{users.length}</div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
          <div className="text-sm text-muted-foreground">Action Types</div>
          <div className="text-2xl font-bold text-info">{uniqueActions.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm p-4 mb-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-primary hover:underline"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search logs..."
                className="w-full pl-10 pr-3 py-2 border border-border bg-transparent text-foreground rounded-lg focus:ring-2 focus:ring-info focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="w-full px-3 py-2 border border-border bg-transparent text-foreground rounded-lg focus:ring-2 focus:ring-info focus:border-transparent"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Entity Type
            </label>
            <select
              value={filters.entity}
              onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value }))}
              className="w-full px-3 py-2 border border-border bg-transparent text-foreground rounded-lg focus:ring-2 focus:ring-info focus:border-transparent"
            >
              <option value="all">All Entities</option>
              {uniqueEntities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-border bg-transparent text-foreground rounded-lg focus:ring-2 focus:ring-info focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-border bg-transparent text-foreground rounded-lg focus:ring-2 focus:ring-info focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <DataTable
          data={filteredLogs}
          columns={columns}
          emptyMessage="No activity logs found."
        />
      </div>
    </div>
  );
};

export default ActivityLogs;
