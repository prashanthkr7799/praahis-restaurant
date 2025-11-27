/**
 * EditTableModal - Edit table details
 * Allows manager to edit table number, seating capacity, zone, and delete the table
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Users, Hash, MapPin, AlertTriangle } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import toast from 'react-hot-toast';

const EditTableModal = ({ isOpen, onClose, table, restaurantId, onTableUpdated, onTableDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: 4,
    zone: '',
  });

  // Initialize form with table data
  useEffect(() => {
    if (table) {
      setFormData({
        tableNumber: table.table_number?.toString() || '',
        capacity: table.capacity || 4,
        zone: table.zone || '',
      });
    }
  }, [table]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tableNumber) {
      toast.error('Please enter a table number');
      return;
    }

    if (!table?.id) {
      toast.error('Table ID is missing');
      return;
    }

    try {
      setLoading(true);

      // Check if new table number already exists (if changed)
      if (formData.tableNumber !== table.table_number?.toString()) {
        const { data: existingTable, error: checkError } = await supabase
          .from('tables')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('table_number', formData.tableNumber)
          .neq('id', table.id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingTable) {
          toast.error(`Table ${formData.tableNumber} already exists`);
          setLoading(false);
          return;
        }
      }

      // Update table
      const { error: updateError } = await supabase
        .from('tables')
        .update({
          table_number: formData.tableNumber,
          capacity: formData.capacity,
          zone: formData.zone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', table.id);

      if (updateError) throw updateError;

      toast.success(`Table ${formData.tableNumber} updated successfully`);

      if (onTableUpdated) {
        onTableUpdated({ ...table, ...formData });
      }

      onClose();
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error('Failed to update table: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!table?.id) {
      toast.error('Table ID is missing');
      return;
    }

    try {
      setDeleting(true);

      // Check if table has active sessions
      const { data: activeSessions, error: sessionError } = await supabase
        .from('table_sessions')
        .select('id')
        .eq('table_id', table.id)
        .eq('status', 'active')
        .limit(1);

      if (sessionError) {
        console.error('Error checking sessions:', sessionError);
      }

      if (activeSessions && activeSessions.length > 0) {
        toast.error('Cannot delete table with active session. Please clear the table first.');
        setDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }

      // Delete the table
      const { error: deleteError } = await supabase
        .from('tables')
        .delete()
        .eq('id', table.id);

      if (deleteError) throw deleteError;

      toast.success(`Table ${table.table_number} deleted successfully`);

      if (onTableDeleted) {
        onTableDeleted(table.id);
      }

      onClose();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table: ' + error.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading || deleting}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Edit Table {table?.table_number}</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Update table details or delete the table
          </p>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm ? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-rose-400 mb-1">Delete Table?</h3>
                <p className="text-sm text-zinc-300 mb-4">
                  Are you sure you want to delete Table {table?.table_number}? This action cannot be undone. 
                  All associated QR codes will stop working.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Yes, Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Table Number */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Hash className="h-4 w-4 inline mr-1" />
                Table Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="tableNumber"
                value={formData.tableNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="e.g., 1, A1, VIP-1"
                required
              />
              <p className="text-xs text-zinc-500 mt-1">
                Can be a number or alphanumeric code
              </p>
            </div>

            {/* Seating Capacity */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Seating Capacity <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, capacity: Math.max(1, prev.capacity - 1) }))}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white"
                >
                  -
                </button>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-lg font-semibold focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, capacity: Math.min(20, prev.capacity + 1) }))}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Number of seats at this table (1-20)
              </p>
            </div>

            {/* Zone/Section (Optional) */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Zone / Section <span className="text-zinc-500">(optional)</span>
              </label>
              <input
                type="text"
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="e.g., Outdoor, VIP, Main Hall"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              {/* Delete Button */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>

              {/* Save Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 glass-button-primary py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditTableModal;
