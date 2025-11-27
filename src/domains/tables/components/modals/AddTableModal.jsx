/**
 * AddTableModal - Add new table with QR code generation
 * Allows manager to add a new table and automatically generate its QR code
 */

import React, { useState } from 'react';
import { X, Plus, QrCode } from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const AddTableModal = ({ isOpen, onClose, restaurantId, onTableAdded }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tableNumber: '',
    seats: 4,
    generateQR: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tableNumber) {
      toast.error('Please enter a table number');
      return;
    }

    if (!restaurantId) {
      toast.error('Restaurant ID is missing');
      return;
    }

    try {
      setLoading(true);

      // STEP 1: Check restaurant's limits using RPC (this bypasses RLS issues)
      const { data: limits, error: limitsError } = await supabase
        .rpc('get_restaurant_limits');

      if (limitsError) {
        console.error('Failed to fetch restaurant limits:', limitsError);
        // Continue without limit check if we can't fetch
      }

      // STEP 2: Check if table limit is reached
      if (limits && limits.length > 0) {
        const { max_tables, current_tables } = limits[0];
        if (current_tables >= max_tables) {
          toast.error(`Table limit reached! Your plan allows maximum ${max_tables} tables (currently ${current_tables}). Please upgrade your subscription or contact SuperAdmin.`);
          setLoading(false);
          return;
        }
      }

      // Check if table number already exists
      const { data: existingTable, error: checkError } = await supabase
        .from('tables')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('table_number', formData.tableNumber)
        .maybeSingle();

      // Ignore PGRST116 error (no rows found) - that's what we want
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingTable) {
        toast.error(`Table ${formData.tableNumber} already exists`);
        setLoading(false);
        return;
      }

      // Insert new table first (without QR code)
      const { data: newTable, error: insertError } = await supabase
        .from('tables')
        .insert([
          {
            restaurant_id: restaurantId,
            table_number: formData.tableNumber,
            capacity: parseInt(formData.seats),
            status: 'available',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Generate QR code with the table ID if requested
      if (formData.generateQR && newTable?.id) {
        const menuUrl = `${window.location.origin}/table/${newTable.id}`;
        const qrCodeData = await QRCode.toDataURL(menuUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        // Update table with QR code URL
        const { error: updateError } = await supabase
          .from('tables')
          .update({ qr_code_url: qrCodeData })
          .eq('id', newTable.id);

        if (updateError) {
          console.warn('Failed to update QR code:', updateError);
          // Don't throw - table is created, just QR failed
        }
      }

      toast.success(
        `Table ${formData.tableNumber} added successfully${formData.generateQR ? ' with QR code' : ''}`
      );

      // Reset form
      setFormData({
        tableNumber: '',
        seats: 4,
        generateQR: true,
      });

      // Notify parent component
      if (onTableAdded) {
        onTableAdded(newTable);
      }

      onClose();
    } catch (error) {
      console.error('Error adding table:', error);
      toast.error('Failed to add table: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Add New Table</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Create a new table and optionally generate a QR code
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Table Number */}
          <div>
            <label htmlFor="tableNumber" className="block text-sm font-semibold text-white mb-2">
              Table Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="tableNumber"
              name="tableNumber"
              value={formData.tableNumber}
              onChange={handleChange}
              placeholder="e.g., 1, 2, A1, B2"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>

          {/* Number of Seats */}
          <div>
            <label htmlFor="seats" className="block text-sm font-semibold text-white mb-2">
              Number of Seats
            </label>
            <input
              type="number"
              id="seats"
              name="seats"
              value={formData.seats}
              onChange={handleChange}
              min="1"
              max="20"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Generate QR Code Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <input
              type="checkbox"
              id="generateQR"
              name="generateQR"
              checked={formData.generateQR}
              onChange={handleChange}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <label htmlFor="generateQR" className="flex items-center gap-2 text-sm text-white cursor-pointer">
              <QrCode className="h-4 w-4 text-primary" />
              <span>Generate QR Code automatically</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-white transition-colors border border-white/10"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add Table</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTableModal;
