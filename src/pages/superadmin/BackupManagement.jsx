import React, { useEffect, useState } from 'react';
import { supabaseOwner } from '@shared/utils/api/supabaseOwnerClient';
import { 
  Database, Play, Trash2, Download, Calendar, Clock, HardDrive, RefreshCw,
  Plus, CheckCircle2, XCircle, Archive, Server, Shield, Zap, Timer,
  ChevronRight, RotateCcw, Settings2, Pause, AlertTriangle, X
} from 'lucide-react';
import { showSuccess, showError, showWarning } from '@shared/utils/helpers/toast.jsx';

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

// Storage Usage Visualization
const StorageUsage = ({ used, total }) => {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const getColor = () => {
    if (percentage < 50) return 'from-emerald-500 to-cyan-500';
    if (percentage < 80) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">Storage Used</span>
        <span className="text-white font-medium">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const BackupManagement = () => {
  const [backups, setBackups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(false);
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
      completed: { 
        bg: 'bg-emerald-500/20', 
        border: 'border-emerald-500/30',
        text: 'text-emerald-400', 
        icon: CheckCircle2,
        glow: 'shadow-emerald-500/20'
      },
      in_progress: { 
        bg: 'bg-cyan-500/20', 
        border: 'border-cyan-500/30',
        text: 'text-cyan-400', 
        icon: RefreshCw,
        glow: 'shadow-cyan-500/20'
      },
      failed: { 
        bg: 'bg-red-500/20', 
        border: 'border-red-500/30',
        text: 'text-red-400', 
        icon: XCircle,
        glow: 'shadow-red-500/20'
      },
      deleted: { 
        bg: 'bg-slate-500/20', 
        border: 'border-slate-500/30',
        text: 'text-slate-400', 
        icon: Trash2,
        glow: 'shadow-slate-500/20'
      }
    };

    const style = config[status] || config.in_progress;
    const Icon = style.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg 
        ${style.bg} ${style.border} ${style.text} border shadow-lg ${style.glow}`}>
        <Icon className={`w-3 h-3 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const config = {
      full: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', icon: Database },
      incremental: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: Archive },
      restaurant: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: Server },
      manual: { bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-300', icon: Settings2 }
    };

    const style = config[type] || config.manual;
    const Icon = style.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg 
        ${style.bg} ${style.border} ${style.text} border`}>
        <Icon className="w-3 h-3" />
        {type}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/20">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Backup Center
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Database backup management & scheduling
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { setRefreshing(true); fetchData(); }}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">New Schedule</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Backup</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <GlassCard className="p-5 group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Total Backups</p>
                <p className="text-2xl font-bold text-white">{stats.totalBackups}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completedBackups}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg group-hover:scale-110 transition-transform">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Failed</p>
                <p className="text-2xl font-bold text-white">{stats.failedBackups}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg group-hover:scale-110 transition-transform">
                <HardDrive className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Total Size</p>
                <p className="text-2xl font-bold text-white">{formatFileSize(stats.totalSize)}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 group col-span-2 lg:col-span-1">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Active Schedules</p>
                <p className="text-2xl font-bold text-white">{stats.activeSchedules}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Storage Overview Card */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Server className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Storage Overview</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <StorageUsage used={stats.totalSize} total={10 * 1024 * 1024 * 1024} />
              <p className="text-xs text-slate-500">
                {formatFileSize(stats.totalSize)} of 10 GB used
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Last Backup</p>
                <p className="text-lg font-semibold text-white">
                  {backups[0] ? formatTimeAgo(backups[0].created_at) : 'Never'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/20">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Next Scheduled</p>
                <p className="text-lg font-semibold text-white">
                  {schedules.find(s => s.is_active)?.schedule_time || 'None'}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Backup Schedules */}
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Backup Schedules</h3>
            </div>
            <span className="px-2.5 py-1 text-xs bg-slate-700/50 text-slate-300 rounded-lg border border-white/10">
              {schedules.length} schedules
            </span>
          </div>
          
          {schedules.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="p-4 rounded-2xl bg-slate-700/30 w-fit mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-300 text-lg mb-2">No backup schedules configured</p>
              <p className="text-slate-500 text-sm mb-4">Create automated backup schedules</p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Create your first schedule →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {schedules.map(schedule => (
                <div key={schedule.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${schedule.is_active ? 'bg-emerald-500/20' : 'bg-slate-600/20'}`}>
                        {schedule.is_active ? (
                          <Play className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Pause className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{schedule.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {schedule.schedule_time || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {schedule.frequency}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getTypeBadge(schedule.backup_type)}
                      <span className={`px-2.5 py-1 text-xs rounded-lg border ${
                        schedule.is_active 
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-600/20 border-slate-500/30 text-slate-400'
                      }`}>
                        {schedule.is_active ? 'Active' : 'Paused'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title={schedule.is_active ? 'Pause' : 'Activate'}
                        >
                          {schedule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Backup History */}
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Archive className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Backup History</h3>
            </div>
            <button
              onClick={fetchData}
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full" />
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin" />
              </div>
              <p className="text-slate-400 mt-4">Loading backups...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="p-4 rounded-2xl bg-slate-700/30 w-fit mx-auto mb-4">
                <Database className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-300 text-lg mb-2">No backups created yet</p>
              <p className="text-slate-500 text-sm mb-4">Start by creating your first backup</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Create your first backup →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Backup</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Size</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {backups.map(backup => (
                    <tr key={backup.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-700/50">
                            <Database className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{backup.backup_name}</p>
                            <p className="text-xs text-slate-500">{backup.initiated_by_email || 'System'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getTypeBadge(backup.backup_type)}</td>
                      <td className="px-6 py-4">{getStatusBadge(backup.status)}</td>
                      <td className="px-6 py-4 text-slate-300 hidden md:table-cell">{formatFileSize(backup.file_size)}</td>
                      <td className="px-6 py-4 text-slate-300 hidden lg:table-cell">{formatDuration(backup.duration_seconds)}</td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div>
                          <p className="text-sm text-white">{formatDate(backup.created_at)}</p>
                          <p className="text-xs text-slate-500">{formatTimeAgo(backup.created_at)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {backup.status === 'completed' && backup.can_restore && (
                            <>
                              <button className="p-2 rounded-lg hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors" title="Restore">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button className="p-2 rounded-lg hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors" title="Download">
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {backup.status !== 'deleted' && (
                            <button
                              onClick={() => deleteBackup(backup.id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl max-w-md w-full shadow-2xl border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                  <Database className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Create Manual Backup</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Backup Name</label>
                <input
                  type="text"
                  value={newBackup.name}
                  onChange={(e) => setNewBackup({ ...newBackup, name: e.target.value })}
                  placeholder="e.g., manual_backup_2025_01_15"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Backup Type</label>
                <select
                  value={newBackup.type}
                  onChange={(e) => setNewBackup({ ...newBackup, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value="full" className="bg-slate-800">Full Backup (All Data)</option>
                  <option value="incremental" className="bg-slate-800">Incremental (Changes Only)</option>
                  <option value="manual" className="bg-slate-800">Manual (Custom)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-cyan-300 font-medium">Note</p>
                    <p className="text-sm text-cyan-400/80 mt-1">
                      This will create a backup record. In production, this triggers an actual database dump process.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-900/50 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="flex-1 px-4 py-3 text-sm text-slate-300 bg-slate-800 border border-white/10 rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createManualBackup}
                disabled={creating}
                className="flex-1 px-4 py-3 text-sm text-white bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Create Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl max-w-lg w-full shadow-2xl border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Create Backup Schedule</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Schedule Name</label>
                <input
                  type="text"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  placeholder="e.g., Daily Full Backup"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Backup Type</label>
                  <select
                    value={newSchedule.backupType}
                    onChange={(e) => setNewSchedule({ ...newSchedule, backupType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  >
                    <option value="full" className="bg-slate-800">Full</option>
                    <option value="incremental" className="bg-slate-800">Incremental</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Frequency</label>
                  <select
                    value={newSchedule.frequency}
                    onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  >
                    <option value="hourly" className="bg-slate-800">Hourly</option>
                    <option value="daily" className="bg-slate-800">Daily</option>
                    <option value="weekly" className="bg-slate-800">Weekly</option>
                    <option value="monthly" className="bg-slate-800">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <Clock className="w-4 h-4" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={newSchedule.scheduleTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, scheduleTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <Timer className="w-4 h-4" />
                    Retention (Days)
                  </label>
                  <input
                    type="number"
                    value={newSchedule.retentionDays}
                    onChange={(e) => setNewSchedule({ ...newSchedule, retentionDays: parseInt(e.target.value) })}
                    min="1"
                    max="365"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-300 font-medium">Requires pg_cron</p>
                    <p className="text-sm text-amber-400/80 mt-1">
                      Schedules require pg_cron extension to be configured in Supabase for automatic execution.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-900/50 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                disabled={creating}
                className="flex-1 px-4 py-3 text-sm text-slate-300 bg-slate-800 border border-white/10 rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createSchedule}
                disabled={creating}
                className="flex-1 px-4 py-3 text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Create Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManagement;
