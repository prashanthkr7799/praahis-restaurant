import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import toast from 'react-hot-toast';
import { QrCode, Plus, RefreshCw, Filter, Grid3x3, List } from 'lucide-react';
import TableQRCard from '@shared/components/compounds/TableQRCard';
import BulkQRDownload from '@shared/components/compounds/BulkQRDownload';
import Modal from '@shared/components/compounds/Modal';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import { useRestaurant } from '@/shared/hooks/useRestaurant';

/**
 * QR Codes Management Page
 * Enhanced QR code generation and management for all tables
 */
const QRCodesManagement = () => {
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTables, setSelectedTables] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'available', 'occupied'
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');

  const { restaurantId } = useRestaurant();

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    loadTables();

    // Set up realtime subscription for table status updates
    const channel = supabase
      .channel('qr-tables-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log('Table change detected in QR page:', payload);
          loadTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const applyFilters = useCallback(() => {
    let filtered = [...tables];

    if (filterStatus !== 'all') {
      filtered = filtered.filter((table) =>
        filterStatus === 'occupied' ? table.status === 'occupied' : table.status === 'available'
      );
    }

    setFilteredTables(filtered);
  }, [tables, filterStatus]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadTables = async () => {
    try {
      setLoading(true);
      
      // Don't query if restaurantId is null
      if (!restaurantId) {
        console.warn('Cannot load tables: restaurantId is null');
        setTables([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  

  const handleAddTable = async () => {
    if (!newTableNumber.trim()) {
      toast.error('Please enter a table number');
      return;
    }

    try {
      const { data: _data, error } = await supabase
        .from('tables')
        .insert({
          table_number: newTableNumber,
          capacity: parseInt(newTableCapacity),
          status: 'available',
          restaurant_id: restaurantId,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Table ${newTableNumber} added successfully!`);
      setShowAddModal(false);
      setNewTableNumber('');
      setNewTableCapacity('4');
      loadTables();
    } catch (error) {
      console.error('Error adding table:', error);
      if (error.code === '23505') {
        toast.error('Table number already exists');
      } else {
        toast.error('Failed to add table');
      }
    }
  };

  const handleSelectTable = (tableId) => {
    setSelectedTables((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTables.length === filteredTables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(filteredTables.map((t) => t.id));
    }
  };

  const getSelectedTableObjects = () => {
    return tables.filter((t) => selectedTables.includes(t.id));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <QrCode className="w-8 h-8 text-primary" />
            QR Code Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate, download, and print QR codes for all tables
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadTables}
            className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground border border-border rounded-lg hover:opacity-90 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="text-sm text-muted-foreground mb-1">Total Tables</div>
          <div className="text-3xl font-bold text-foreground">{tables.length}</div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="text-sm text-muted-foreground mb-1">Available</div>
          <div className="text-3xl font-bold text-success">
            {tables.filter((t) => t.status === 'available').length}
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="text-sm text-muted-foreground mb-1">Occupied</div>
          <div className="text-3xl font-bold text-warning">
            {tables.filter((t) => t.status === 'occupied').length}
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <div className="text-sm text-muted-foreground mb-1">Selected</div>
          <div className="text-3xl font-bold text-primary">{selectedTables.length}</div>
        </div>
      </div>

      {/* Bulk Operations */}
      {tables.length > 0 && (
        <BulkQRDownload tables={tables} selectedTables={getSelectedTableObjects()} />
      )}

      {/* Filters and View Controls */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Filter:</span>
            <div className="flex gap-2">
              {['all', 'available', 'occupied'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-sm rounded-lg transition ${
                    filterStatus === status
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:opacity-90'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Select All */}
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 text-sm bg-muted text-foreground border border-border rounded-lg hover:opacity-90 transition"
          >
            {selectedTables.length === filteredTables.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Tables Grid/List */}
      {filteredTables.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
          <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No tables found</h3>
          <p className="text-muted-foreground mb-4">
            {filterStatus !== 'all'
              ? 'Try changing the filter'
              : 'Get started by adding your first table'}
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Add First Table
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }
        >
          {filteredTables.map((table) => (
            <div key={table.id} className="relative">
              {/* Selection Checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedTables.includes(table.id)}
                  onChange={() => handleSelectTable(table.id)}
                  className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-info cursor-pointer"
                />
              </div>
              <TableQRCard table={table} onRegenerate={loadTables} />
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Table"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Table Number *
            </label>
            <input
              type="number"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              placeholder="e.g., 1, 2, 3..."
              className="w-full px-4 py-2 border border-border bg-transparent text-foreground rounded-lg focus:ring-2 focus:ring-info focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Seating Capacity
            </label>
            <input
              type="number"
              value={newTableCapacity}
              onChange={(e) => setNewTableCapacity(e.target.value)}
              min="1"
              max="20"
              className="w-full px-4 py-2 border border-border bg-transparent text-foreground rounded-lg focus:ring-2 focus:ring-info focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTable}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Add Table
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QRCodesManagement;
