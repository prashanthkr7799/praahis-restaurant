import React, { useState } from 'react';
import { 
  Plus, 
  QrCode, 
  LayoutGrid, 
  List, 
  Search,
  Edit
} from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { useRealtimeOrders } from '@/shared/context/RealtimeOrderContext';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import TableCard from '@domains/tables/components/TableCard';
import TableListItem from '@domains/tables/components/TableListItem';
import ViewAllQRCodesModal from '@domains/tables/components/modals/ViewAllQRCodesModal';
import AddTableModal from '@domains/tables/components/modals/AddTableModal';
import EditTableModal from '@domains/tables/components/modals/EditTableModal';
import TableDetailsModal from '@domains/ordering/components/modals/TableDetailsModal';
import toast from 'react-hot-toast';

const TablesTab = () => {
  const { tables, refreshTables, loading } = useRealtimeOrders();
  const { restaurantId } = useRestaurant();

  // Local state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableDetailsModal, setShowTableDetailsModal] = useState(false);
  const [showQRCodesModal, setShowQRCodesModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showEditTableModal, setShowEditTableModal] = useState(false);
  const [tableToEdit, setTableToEdit] = useState(null);

  // Filter tables
  const filteredTables = tables.filter(table => 
    table.table_number.toString().includes(searchQuery) ||
    (table.zone && table.zone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handlers
  const handleTableClick = (table) => {
    setSelectedTable(table);
    setShowTableDetailsModal(true);
  };

  const handleMarkTableAvailable = async (tableId) => {
    try {
      toast.loading('Marking table as available...', { id: 'mark-available' });

      const { error } = await supabase
        .from('tables')
        .update({
          status: 'available',
          booked_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tableId);

      if (error) throw error;

      toast.success('Table marked as available!', { id: 'mark-available' });
      refreshTables();
      setShowTableDetailsModal(false);
    } catch (error) {
      console.error('Error marking table available:', error);
      toast.error('Failed to mark table available', { id: 'mark-available' });
    }
  };

  const handleCallWaiter = async (tableNumber) => {
    try {
      // Insert notification for waiters
      const { error } = await supabase
        .from('notifications')
        .insert({
          restaurant_id: restaurantId,
          type: 'alert',
          title: `Table ${tableNumber} needs assistance`,
          body: `Customer at table ${tableNumber} has called for a waiter.`,
          data: { tableNumber, type: 'call_waiter' },
        });

      if (error) throw error;

      toast.success('Waiter has been notified! 🔔');
    } catch (error) {
      console.error('Error calling waiter:', error);
      toast.error('Failed to notify waiter');
    }
  };

  const handleTableAdded = () => {
    refreshTables();
    setShowAddTableModal(false);
    toast.success('Table added successfully');
  };

  const handleEditTable = (table, e) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering table click
    }
    setTableToEdit(table);
    setShowEditTableModal(true);
  };

  const handleTableUpdated = () => {
    refreshTables();
    setShowEditTableModal(false);
    setTableToEdit(null);
  };

  const handleTableDeleted = () => {
    refreshTables();
    setShowEditTableModal(false);
    setTableToEdit(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 w-full sm:w-auto relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowQRCodesModal(true)}
            className="flex-1 sm:flex-none glass-button px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">QR Codes</span>
          </button>
          <button
            onClick={() => setShowAddTableModal(true)}
            className="flex-1 sm:flex-none glass-button-primary px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Tables Grid/List */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-square glass-panel rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-xl border border-white/10">
          <LayoutGrid className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No Tables Found</h3>
          <p className="text-zinc-400">Try adjusting your search or add a new table.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTables.map(table => (
            <div key={table.id} className="relative group">
              <TableCard
                table={table}
                onClick={() => handleTableClick(table)}
              />
              {/* Edit Button Overlay */}
              <button
                onClick={(e) => handleEditTable(table, e)}
                className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-primary/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 text-white"
                title="Edit Table"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
          <div className="divide-y divide-white/5">
            {filteredTables.map(table => (
              <div key={table.id} className="relative flex items-center">
                <div className="flex-1">
                  <TableListItem
                    table={table}
                    onClick={() => handleTableClick(table)}
                  />
                </div>
                {/* Edit Button */}
                <button
                  onClick={(e) => handleEditTable(table, e)}
                  className="absolute right-4 p-2 bg-white/5 hover:bg-primary/20 rounded-lg transition-all text-zinc-400 hover:text-primary"
                  title="Edit Table"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showTableDetailsModal && selectedTable && (
        <TableDetailsModal
          isOpen={showTableDetailsModal}
          onClose={() => setShowTableDetailsModal(false)}
          table={selectedTable}
          onMarkAvailable={() => handleMarkTableAvailable(selectedTable.id)}
          onCallWaiter={() => handleCallWaiter(selectedTable.table_number)}
        />
      )}

      {showQRCodesModal && (
        <ViewAllQRCodesModal
          isOpen={showQRCodesModal}
          onClose={() => setShowQRCodesModal(false)}
          tables={tables}
          restaurantId={restaurantId}
        />
      )}

      {showAddTableModal && (
        <AddTableModal
          isOpen={showAddTableModal}
          onClose={() => setShowAddTableModal(false)}
          restaurantId={restaurantId}
          onTableAdded={handleTableAdded}
        />
      )}

      {showEditTableModal && tableToEdit && (
        <EditTableModal
          isOpen={showEditTableModal}
          onClose={() => {
            setShowEditTableModal(false);
            setTableToEdit(null);
          }}
          table={tableToEdit}
          restaurantId={restaurantId}
          onTableUpdated={handleTableUpdated}
          onTableDeleted={handleTableDeleted}
        />
      )}
    </div>
  );
};

export default TablesTab;
