/**
 * Tables Management Page
 * View and manage restaurant tables, their status, sessions, and QR codes
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, QrCode, Users, Clock, ChevronRight, Search, Filter, RefreshCw, XCircle, AlertCircle } from 'lucide-react';
import { supabase, forceReleaseTableSession } from '@shared/utils/api/supabaseClient';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatCurrency } from '@shared/utils/helpers/formatters';

const TablesPage = () => {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [releasingTableId, setReleasingTableId] = useState(null);
  const { restaurantId } = useRestaurant();
  const navigate = useNavigate();

  useEffect(() => {
    loadTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Set up real-time subscriptions for table and session updates
  useEffect(() => {
    if (!restaurantId) return;

    // Subscribe to table changes
    const tablesSubscription = supabase
      .channel('manager-tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          loadTables();
        }
      )
      .subscribe();

    // Subscribe to table_sessions changes
    const sessionsSubscription = supabase
      .channel('manager-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_sessions',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          loadTables();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      tablesSubscription.unsubscribe();
      sessionsSubscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const loadTables = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: tablesData, error } = await supabase
        .from('tables')
        .select(`
          *,
          table_sessions!table_sessions_table_id_fkey (
            id,
            started_at,
            ended_at,
            status
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('table_number', { ascending: true });

      if (error) throw error;

      // Get active sessions for each table
      const enrichedTables = tablesData.map(table => {
        const activeSessions = table.table_sessions?.filter(s => s.status === 'active') || [];
        const activeSession = activeSessions[0] || null;
        
        return {
          ...table,
          activeSession,
          sessionCount: activeSessions.length,
        };
      });

      setTables(enrichedTables);
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return '✓';
      case 'occupied':
        return '●';
      case 'reserved':
        return '◆';
      case 'cleaning':
        return '○';
      default:
        return '—';
    }
  };

  const handleForceRelease = async (table, e) => {
    e.stopPropagation(); // Prevent navigation to table details

    const confirmMessage = `Are you sure you want to force-release Table ${table.table_number}? This will:\n\n• End the current session\n• Clear all cart data\n• Mark table as available\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setReleasingTableId(table.id);
    
    try {
      const result = await forceReleaseTableSession(
        table.activeSession?.id,
        table.id
      );

      if (result.success) {
        toast.success(`Table ${table.table_number} released successfully`);
        await loadTables(); // Refresh table list
      } else {
        toast.error(result.message || 'Failed to release table');
      }
    } catch (error) {
      console.error('Error force-releasing table:', error);
      toast.error('Failed to release table. Please try again.');
    } finally {
      setReleasingTableId(null);
    }
  };

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.table_number?.toString().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Tables
          </h1>
          <button
            onClick={loadTables}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card hover:bg-card/80 border border-border hover:border-primary/30 transition-smooth group"
          >
            <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-smooth" />
            <span className="font-medium">Refresh</span>
          </button>
        </div>
        <p className="text-muted-foreground text-lg">Manage table status and sessions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Tables */}
        <div className="card-lift bg-gradient-to-br from-card via-card to-muted/20 p-5 rounded-xl border border-border/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-muted/50 ring-1 ring-border">
                <LayoutGrid className="h-4 w-4 text-foreground" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{stats.total}</div>
            <div className="text-sm text-muted-foreground font-medium">Total Tables</div>
          </div>
        </div>

        {/* Available */}
        <div className="card-lift bg-gradient-to-br from-success/10 via-success/5 to-transparent p-5 rounded-xl border border-success/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-success/10 ring-1 ring-success/30">
                <div className="w-4 h-4 flex items-center justify-center text-success font-bold">✓</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-success mb-1">{stats.available}</div>
            <div className="text-sm text-success/80 font-medium">Available</div>
          </div>
        </div>

        {/* Occupied */}
        <div className="card-lift bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent p-5 rounded-xl border border-destructive/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10 ring-1 ring-destructive/30">
                <div className="w-4 h-4 flex items-center justify-center text-destructive font-bold">●</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-destructive mb-1">{stats.occupied}</div>
            <div className="text-sm text-destructive/80 font-medium">Occupied</div>
          </div>
        </div>

        {/* Reserved */}
        <div className="card-lift bg-gradient-to-br from-warning/10 via-warning/5 to-transparent p-5 rounded-xl border border-warning/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-warning/10 ring-1 ring-warning/30">
                <div className="w-4 h-4 flex items-center justify-center text-warning font-bold">◆</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-warning mb-1">{stats.reserved}</div>
            <div className="text-sm text-warning/80 font-medium">Reserved</div>
          </div>
        </div>

        {/* Cleaning */}
        <div className="card-lift bg-gradient-to-br from-info/10 via-info/5 to-transparent p-5 rounded-xl border border-info/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-info/10 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-info/10 ring-1 ring-info/30">
                <div className="w-4 h-4 flex items-center justify-center text-info font-bold">○</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-info mb-1">{stats.cleaning}</div>
            <div className="text-sm text-info/80 font-medium">Cleaning</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search table number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-card border border-border rounded-lg">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-foreground focus:outline-none focus:ring-0 cursor-pointer font-medium"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="cleaning">Cleaning</option>
          </select>
        </div>
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="card-lift bg-gradient-to-br from-card via-card to-muted/10 border border-border/50 rounded-xl p-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-muted/30 ring-1 ring-border mb-4">
            <LayoutGrid className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No tables found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Add your first table to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className="card-lift bg-gradient-to-br from-card via-card to-muted/10 border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-smooth cursor-pointer group relative overflow-hidden"
              onClick={() => navigate(`/manager/tables/${table.id}`)}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
              
              {/* Content */}
              <div className="relative">
                {/* Table Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      Table {table.table_number}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>Seats {table.capacity || 4}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth" />
                </div>

                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium mb-4 transition-smooth ${
                  table.status === 'available' ? 'badge-available' :
                  table.status === 'occupied' ? 'badge-occupied' :
                  table.status === 'reserved' ? 'badge-reserved' :
                  table.status === 'cleaning' ? 'bg-info/10 text-info border-info/20' :
                  'bg-muted/10 text-muted-foreground border-border'
                }`}>
                  <span className="text-base leading-none">{getStatusIcon(table.status)}</span>
                  <span className="capitalize">{table.status || 'Unknown'}</span>
                </div>

                {/* Active Session Info */}
                {table.activeSession && (
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 mb-4 space-y-3 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-foreground/80 font-medium">
                        Started {new Date(table.activeSession.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-primary">
                      {formatCurrency(table.activeSession.total_spent || 0)}
                    </div>
                    
                    {/* Force Release Button */}
                    <button
                      onClick={(e) => handleForceRelease(table, e)}
                      disabled={releasingTableId === table.id}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg transition-smooth disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      title="Force release this table"
                    >
                      {releasingTableId === table.id ? (
                        <>
                          <div className="h-4 w-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                          <span>Releasing...</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          <span>Force Release</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* QR Code Status */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="h-4 w-4" />
                    <span>QR Code</span>
                  </div>
                  <div className={`text-sm font-medium ${table.qr_code_url ? 'text-success' : 'text-muted-foreground/50'}`}>
                    {table.qr_code_url ? '✓ Generated' : 'Not created'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TablesPage;
