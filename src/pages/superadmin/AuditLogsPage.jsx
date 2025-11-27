import React, { useEffect, useState, useCallback } from 'react';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import { 
  Search, Filter, Eye, ChevronLeft, ChevronRight, X, RefreshCw, Wifi, WifiOff,
  Activity, Clock, User, Database, AlertTriangle, Shield, Zap, Terminal,
  Calendar, LayoutList, LayoutGrid, Download, TrendingUp, AlertCircle, Info
} from 'lucide-react';
import { useAuditRealtime } from '../../shared/hooks/useSuperadminRealtime';

// Reusable GlassCard Component
const GlassCard = ({ children, className = '', hover = true }) => (
  <div className={`
    bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10
    ${hover ? 'hover:border-white/20 hover:bg-slate-800/60 transition-all duration-300' : ''}
    ${className}
  `}>
    {children}
  </div>
);

// Animated Stat Card for Quick Stats
const StatCard = (props) => {
  const { icon: Icon, label, value, color, trend } = props;
  return (
    <GlassCard className="p-4 group">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-white">{value}</p>
            {trend && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
    { value: 'all', label: 'All Actions', icon: Activity },
    { value: 'created', label: 'Created', icon: Zap },
    { value: 'updated', label: 'Updated', icon: RefreshCw },
    { value: 'deleted', label: 'Deleted', icon: X },
    { value: 'login', label: 'Login', icon: User },
    { value: 'logout', label: 'Logout', icon: Shield },
    { value: 'payment', label: 'Payment', icon: TrendingUp },
    { value: 'backup', label: 'Backup', icon: Database }
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
    { value: 'info', label: 'Info', color: 'cyan', icon: Info },
    { value: 'warning', label: 'Warning', color: 'amber', icon: AlertTriangle },
    { value: 'error', label: 'Error', color: 'red', icon: AlertCircle },
    { value: 'critical', label: 'Critical', color: 'purple', icon: Shield }
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
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      alert('❌ Error loading audit logs: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, filters, logsPerPage, getDateFilter]);

  // Realtime subscription for audit trail updates
  const { isConnected } = useAuditRealtime(fetchLogs);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
  };

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

  // Get severity styling
  const getSeverityConfig = (severity) => {
    const config = {
      info: { 
        bg: 'bg-cyan-500/20', 
        border: 'border-cyan-500/30',
        text: 'text-cyan-400', 
        glow: 'shadow-cyan-500/20',
        icon: Info,
        gradient: 'from-cyan-500 to-blue-500'
      },
      warning: { 
        bg: 'bg-amber-500/20', 
        border: 'border-amber-500/30',
        text: 'text-amber-400', 
        glow: 'shadow-amber-500/20',
        icon: AlertTriangle,
        gradient: 'from-amber-500 to-orange-500'
      },
      error: { 
        bg: 'bg-red-500/20', 
        border: 'border-red-500/30',
        text: 'text-red-400', 
        glow: 'shadow-red-500/20',
        icon: AlertCircle,
        gradient: 'from-red-500 to-rose-500'
      },
      critical: { 
        bg: 'bg-purple-500/20', 
        border: 'border-purple-500/30',
        text: 'text-purple-400', 
        glow: 'shadow-purple-500/20',
        icon: Shield,
        gradient: 'from-purple-500 to-pink-500'
      }
    };
    return config[severity] || config.info;
  };

  const getSeverityBadge = (severity) => {
    const config = getSeverityConfig(severity);
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg 
        ${config.bg} ${config.border} ${config.text} border shadow-lg ${config.glow}`}>
        <IconComponent className="w-3 h-3" />
        {severity}
      </span>
    );
  };

  const getActionConfig = (action) => {
    if (action.includes('create')) return { icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (action.includes('update')) return { icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (action.includes('delete')) return { icon: X, color: 'text-red-400', bg: 'bg-red-500/20' };
    if (action.includes('login')) return { icon: User, color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
    if (action.includes('payment')) return { icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/20' };
    if (action.includes('backup')) return { icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/20' };
    return { icon: Terminal, color: 'text-slate-400', bg: 'bg-slate-500/20' };
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

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const activeFiltersCount = Object.values(filters).filter((v, i) => 
    i < 6 && v !== 'all' && v !== ''
  ).length;

  // Calculate stats
  const stats = {
    total: totalCount,
    info: logs.filter(l => l.severity === 'info').length,
    warning: logs.filter(l => l.severity === 'warning').length,
    error: logs.filter(l => l.severity === 'error').length + logs.filter(l => l.severity === 'critical').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Audit Trail
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Real-time system activity monitoring
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-sm ${
              isConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium">{isConnected ? 'Live Sync' : 'Offline'}</span>
              {isConnected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'timeline' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-all ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800/50 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Filter className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button className="p-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={Activity} 
            label="Total Events" 
            value={stats.total.toLocaleString()} 
            color="from-emerald-500 to-cyan-500"
          />
          <StatCard 
            icon={Info} 
            label="Info Events" 
            value={stats.info} 
            color="from-cyan-500 to-blue-500"
          />
          <StatCard 
            icon={AlertTriangle} 
            label="Warnings" 
            value={stats.warning} 
            color="from-amber-500 to-orange-500"
          />
          <StatCard 
            icon={AlertCircle} 
            label="Errors" 
            value={stats.error} 
            color="from-red-500 to-rose-500"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Filter className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Filters</h3>
                {activeFiltersCount > 0 && (
                  <span className="px-2.5 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                    {activeFiltersCount} active
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Reset All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Search className="w-4 h-4" />
                  Search
                </label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  placeholder="Search entity, description, or actor..."
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Action Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  {actionTypes.map(type => (
                    <option key={type.value} value={type.value} className="bg-slate-800">{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Entity Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Entity Type</label>
                <select
                  value={filters.entityType}
                  onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  {entityTypes.map(type => (
                    <option key={type.value} value={type.value} className="bg-slate-800">{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  {severityLevels.map(level => (
                    <option key={level.value} value={level.value} className="bg-slate-800">{level.label}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  {dateRanges.map(range => (
                    <option key={range.value} value={range.value} className="bg-slate-800">{range.label}</option>
                  ))}
                </select>
              </div>

              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        )}

        {/* Logs Display */}
        <GlassCard className="overflow-hidden" hover={false}>
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full" />
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin" />
              </div>
              <p className="text-slate-400 mt-4">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="p-4 rounded-2xl bg-slate-700/50 mb-4">
                <Activity className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-300 text-lg mb-2">No audit logs found</p>
              <p className="text-slate-500 text-sm">Try adjusting your filters</p>
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Action</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Entity</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Actor</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map(log => {
                      const actionConfig = getActionConfig(log.action);
                      const ActionIcon = actionConfig.icon;
                      
                      return (
                        <tr 
                          key={log.id} 
                          className="group hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => viewLogDetails(log)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <div>
                                <p className="text-sm text-white">{formatDate(log.created_at)}</p>
                                <p className="text-xs text-slate-500">{formatTimeAgo(log.created_at)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${actionConfig.bg}`}>
                                <ActionIcon className={`w-4 h-4 ${actionConfig.color}`} />
                              </div>
                              <span className="font-medium text-white">{log.action}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-white">{log.entity_name || 'N/A'}</p>
                              <p className="text-xs text-slate-500">{log.entity_type}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-400" />
                              </div>
                              <span className="text-slate-300 text-sm truncate max-w-[150px]">
                                {log.actor_email || 'System'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate hidden lg:table-cell">
                            {log.description}
                          </td>
                          <td className="px-6 py-4">
                            {getSeverityBadge(log.severity)}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewLogDetails(log);
                              }}
                              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors group-hover:shadow-lg group-hover:shadow-emerald-500/10"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Page <span className="font-medium text-white">{currentPage}</span> of{' '}
                  <span className="font-medium text-white">{totalPages}</span>
                  <span className="hidden sm:inline"> • {totalCount.toLocaleString()} total events</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm rounded-lg bg-slate-800/50 border border-white/10 text-slate-300 hover:bg-slate-700/50 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-slate-800/50 border border-white/10 text-slate-300 hover:bg-slate-700/50 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-slate-800/50 border border-white/10 text-slate-300 hover:bg-slate-700/50 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm rounded-lg bg-slate-800/50 border border-white/10 text-slate-300 hover:bg-slate-700/50 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Last
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Timeline View */
            <div className="p-6">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-cyan-500 to-purple-500" />
                
                <div className="space-y-6">
                  {logs.map((log) => {
                    const actionConfig = getActionConfig(log.action);
                    const ActionIcon = actionConfig.icon;
                    const severityConfig = getSeverityConfig(log.severity);
                    
                    return (
                      <div key={log.id} className="relative pl-16 group">
                        {/* Timeline Dot */}
                        <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${severityConfig.border} ${severityConfig.bg} transform -translate-x-1/2 group-hover:scale-125 transition-transform`}>
                          <div className={`absolute inset-1 rounded-full ${severityConfig.bg}`} />
                        </div>
                        
                        {/* Content Card */}
                        <GlassCard className="p-4 cursor-pointer" onClick={() => viewLogDetails(log)}>
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${actionConfig.bg}`}>
                                <ActionIcon className={`w-5 h-5 ${actionConfig.color}`} />
                              </div>
                              <div>
                                <p className="font-semibold text-white">{log.action}</p>
                                <p className="text-sm text-slate-400">{log.entity_name || log.entity_type}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {getSeverityBadge(log.severity)}
                              <span className="text-xs text-slate-500">{formatTimeAgo(log.created_at)}</span>
                            </div>
                          </div>
                          
                          {log.description && (
                            <p className="mt-3 text-sm text-slate-400 line-clamp-2">{log.description}</p>
                          )}
                          
                          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.actor_email || 'System'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                        </GlassCard>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Timeline Pagination */}
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm rounded-xl bg-slate-800/50 border border-white/10 text-slate-300 hover:bg-slate-700/50 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <span className="px-4 py-2 text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm rounded-xl bg-slate-800/50 border border-white/10 text-slate-300 hover:bg-slate-700/50 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Detail Modal */}
        {showDetailModal && selectedLog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20">
                    <Eye className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Event Details</h3>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Event Header */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-700/30 border border-white/5">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const actionConfig = getActionConfig(selectedLog.action);
                      const ActionIcon = actionConfig.icon;
                      return (
                        <div className={`p-3 rounded-xl ${actionConfig.bg}`}>
                          <ActionIcon className={`w-6 h-6 ${actionConfig.color}`} />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-xl font-semibold text-white">{selectedLog.action}</p>
                      <p className="text-sm text-slate-400">{selectedLog.entity_type}</p>
                    </div>
                  </div>
                  {getSeverityBadge(selectedLog.severity)}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Event ID</label>
                    <p className="text-sm text-slate-200 font-mono mt-1 truncate">{selectedLog.id}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</label>
                    <p className="text-sm text-slate-200 mt-1">{formatDate(selectedLog.created_at)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Entity Name</label>
                    <p className="text-sm text-white mt-1">{selectedLog.entity_name || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Entity ID</label>
                    <p className="text-sm text-slate-200 font-mono mt-1 truncate">{selectedLog.entity_id || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Actor</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <p className="text-sm text-white">{selectedLog.actor_email || 'System'}</p>
                    </div>
                  </div>
                  {selectedLog.ip_address && (
                    <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</label>
                      <p className="text-sm text-slate-200 font-mono mt-1">{selectedLog.ip_address}</p>
                    </div>
                  )}
                </div>

                {selectedLog.description && (
                  <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
                    <p className="text-sm text-slate-200 mt-2">{selectedLog.description}</p>
                  </div>
                )}

                {/* Changed Fields */}
                {selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Changed Fields</label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedLog.changed_fields.map((field, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-700/30 border border-white/5">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Metadata</label>
                    <pre className="mt-3 p-4 bg-slate-900/50 rounded-xl text-xs overflow-x-auto text-cyan-400 font-mono border border-white/5">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-sm px-6 py-4 border-t border-white/10">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
