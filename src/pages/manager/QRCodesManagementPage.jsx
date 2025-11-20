import React, { useState, useEffect } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Grid3x3, 
  List,
  CheckSquare,
  Square,
  Printer,
  Download,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import QRCode from 'react-qr-code';

const QRCodesManagementPage = () => {
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTables, setSelectedTables] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableData, setNewTableData] = useState({ number: '', capacity: '4', zone: 'Main Hall' });

  const { restaurantId } = useRestaurant();

  const loadTables = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    if (restaurantId) loadTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  useEffect(() => {
    let filtered = [...tables];
    if (filterStatus !== 'all') {
      filtered = filtered.filter((table) =>
        filterStatus === 'occupied' ? table.status === 'occupied' : table.status === 'available'
      );
    }
    setFilteredTables(filtered);
  }, [tables, filterStatus]);

  const handleAddTable = async () => {
    try {
      const { error } = await supabase.from('tables').insert([{
        restaurant_id: restaurantId,
        table_number: newTableData.number,
        capacity: parseInt(newTableData.capacity),
        status: 'available'
      }]);

      if (error) throw error;
      toast.success('Table added successfully');
      setShowAddModal(false);
      setNewTableData({ number: '', capacity: '4', zone: 'Main Hall' });
      loadTables();
    } catch (error) {
      console.error('Error adding table:', error);
      toast.error('Failed to add table');
    }
  };

  const toggleSelection = (tableId) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAll = () => {
    if (selectedTables.length === filteredTables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(filteredTables.map(t => t.id));
    }
  };

  const getTableUrl = (tableId) => {
    return `${window.location.origin}/customer/menu/${restaurantId}/${tableId}`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header & Stats */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white text-glow tracking-tight">QR Codes</h1>
            <p className="text-zinc-400 mt-1">Manage tables and generate QR codes</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="glass-button-primary"
          >
            <Plus size={20} />
            <span>Add Table</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-zinc-500/10 text-zinc-400">
              <Grid3x3 size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono-nums">{tables.length}</p>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Total Tables</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono-nums">
                {tables.filter(t => t.status === 'available').length}
              </p>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Available</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
              <XCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono-nums">
                {tables.filter(t => t.status === 'occupied').length}
              </p>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Occupied</p>
            </div>
          </div>
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <CheckSquare size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono-nums">{selectedTables.length}</p>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Selected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'all' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilterStatus('available')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'available' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Available
          </button>
          <button 
            onClick={() => setFilterStatus('occupied')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === 'occupied' ? 'bg-rose-500/10 text-rose-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Occupied
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={selectAll}
            className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            {selectedTables.length === filteredTables.length ? <CheckSquare size={18} /> : <Square size={18} />}
            Select All
          </button>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex bg-white/5 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-400'}`}
            >
              <Grid3x3 size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-400'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid/List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTables.map((table) => (
            <div 
              key={table.id}
              className={`glass-panel p-6 group relative transition-all duration-300 ${
                selectedTables.includes(table.id) ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-white/10'
              }`}
            >
              <div 
                className="absolute top-4 right-4 z-10 cursor-pointer"
                onClick={() => toggleSelection(table.id)}
              >
                {selectedTables.includes(table.id) ? (
                  <CheckSquare className="text-primary" size={20} />
                ) : (
                  <Square className="text-zinc-600 group-hover:text-zinc-400" size={20} />
                )}
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="text-lg font-bold text-white">Table {table.table_number}</div>
                <div className="p-4 bg-white rounded-xl">
                  <QRCode value={getTableUrl(table.id)} size={120} />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  table.status === 'available' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {table.status.toUpperCase()}
                </div>
                
                <div className="flex items-center gap-2 w-full pt-4 border-t border-white/10">
                  <button className="flex-1 p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Print">
                    <Printer size={18} className="mx-auto" />
                  </button>
                  <button className="flex-1 p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Download">
                    <Download size={18} className="mx-auto" />
                  </button>
                  <button className="flex-1 p-2 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors" title="Delete">
                    <Trash2 size={18} className="mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-xs uppercase text-zinc-500">
              <tr>
                <th className="p-4 w-12">
                  <button onClick={selectAll}>
                    {selectedTables.length === filteredTables.length ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="p-4">Table Number</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTables.map((table) => (
                <tr key={table.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <button onClick={() => toggleSelection(table.id)}>
                      {selectedTables.includes(table.id) ? (
                        <CheckSquare size={16} className="text-primary" />
                      ) : (
                        <Square size={16} className="text-zinc-600" />
                      )}
                    </button>
                  </td>
                  <td className="p-4 font-mono-nums text-white font-bold">{table.table_number}</td>
                  <td className="p-4 text-zinc-400">{table.capacity} Seats</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      table.status === 'available' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                    }`}>
                      {table.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white">
                        <Printer size={16} />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 space-y-6 animate-scale-in">
            <h2 className="text-2xl font-bold text-white">Add New Table</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Table Number</label>
                <input 
                  type="text" 
                  value={newTableData.number}
                  onChange={(e) => setNewTableData({...newTableData, number: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="e.g. T-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Capacity</label>
                <input 
                  type="number" 
                  value={newTableData.capacity}
                  onChange={(e) => setNewTableData({...newTableData, capacity: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="4"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 glass-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddTable}
                className="flex-1 glass-button-primary"
              >
                Add Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodesManagementPage;
