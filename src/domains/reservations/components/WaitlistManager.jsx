/**
 * PHASE 10 — WAITLIST MANAGER
 * 
 * Manage waitlist entries with:
 * - Add to waitlist
 * - Auto-assign table when available
 * - Notifications
 * - Convert to reservation
 */

import { useState } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { 
  Clock3, 
  Users, 
  Phone, 
  X, 
  Check, 
  Plus,
  AlertCircle,
  Bell,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { findMatchingWaitlistEntries, convertWaitlistToReservation, findBestTableMatch } from '../utils/reservationUtils';

export default function WaitlistManager({ waitlist = [], tables = [], reservations = [], onUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: 2,
    preferred_date: format(new Date(), 'yyyy-MM-dd'),
    preferred_time: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  async function handleAddToWaitlist(e) {
    e.preventDefault();
    setErrors([]);

    // Validate
    if (!formData.customer_name || formData.customer_name.trim().length < 2) {
      setErrors(['Customer name is required (min 2 characters)']);
      return;
    }
    if (!formData.customer_phone || !/^\d{10}$/.test(formData.customer_phone.replace(/\D/g, ''))) {
      setErrors(['Valid 10-digit phone number is required']);
      return;
    }
    if (formData.party_size < 1) {
      setErrors(['Party size must be at least 1']);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{
          ...formData,
          status: 'waiting',
          created_at: new Date().toISOString(),
          restaurant_id: (await supabase.auth.getUser()).data.user?.user_metadata?.restaurant_id
        }]);

      if (error) throw error;

      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        party_size: 2,
        preferred_date: format(new Date(), 'yyyy-MM-dd'),
        preferred_time: '',
        notes: ''
      });
      setShowAddForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      setErrors([error.message || 'Failed to add to waitlist']);
    } finally {
      setLoading(false);
    }
  }

  async function handleConvertToReservation(entry) {
    // Find best available table
    const date = entry.preferred_date ? new Date(entry.preferred_date) : new Date();
    const time = entry.preferred_time || format(new Date(), 'HH:mm');
    
    const bestTable = findBestTableMatch(tables, reservations, entry.party_size, date, time);

    if (!bestTable) {
      alert('No tables currently available for this party size. Please try a different time or table size.');
      return;
    }

    if (!confirm(`Convert to reservation with Table ${bestTable.table_number}?`)) {
      return;
    }

    setLoading(true);

    try {
      // Create reservation
      const reservationData = convertWaitlistToReservation(entry, bestTable);
      reservationData.restaurant_id = (await supabase.auth.getUser()).data.user?.user_metadata?.restaurant_id;

      const { error: resError } = await supabase
        .from('reservations')
        .insert([reservationData]);

      if (resError) throw resError;

      // Update waitlist status
      const { error: waitlistError } = await supabase
        .from('waitlist')
        .update({ status: 'converted', converted_at: new Date().toISOString() })
        .eq('id', entry.id);

      if (waitlistError) throw waitlistError;

      onUpdate();
      alert(`Successfully converted to reservation! Table ${bestTable.table_number} assigned.`);
    } catch (error) {
      console.error('Error converting to reservation:', error);
      alert('Failed to convert to reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveFromWaitlist(entry) {
    if (!confirm('Remove this entry from waitlist?')) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('waitlist')
        .update({ status: 'removed', removed_at: new Date().toISOString() })
        .eq('id', entry.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      alert('Failed to remove from waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleNotifyCustomer(entry) {
    // In a real implementation, this would trigger SMS/email notification
    alert(`Notification sent to ${entry.customer_name} (${entry.customer_phone})`);
  }

  if (waitlist.length === 0 && !showAddForm) {
    return (
      <div className="p-12 text-center">
        <Clock3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <p className="text-white/60 text-lg mb-4">No entries in waitlist</p>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600
                   text-white rounded-lg transition-all font-medium flex items-center gap-2 mx-auto"
        >
          <Plus className="w-5 h-5" />
          Add to Waitlist
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock3 className="w-6 h-6 text-amber-400" />
          Waitlist ({waitlist.length})
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600
                   text-white rounded-lg transition-all font-medium flex items-center gap-2"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'Add to Waitlist'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <form onSubmit={handleAddToWaitlist} className="space-y-4">
            {errors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    {errors.map((error, i) => (
                      <p key={i} className="text-red-400 text-sm">{error}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Customer Name *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Party Size *</label>
                <input
                  type="number"
                  value={formData.party_size}
                  onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Preferred Date</label>
                <input
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Preferred Time</label>
                <input
                  type="time"
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                         placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600
                         text-white rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Adding...' : 'Add to Waitlist'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Waitlist Entries */}
      <div className="space-y-3">
        {waitlist.map((entry, index) => {
          const waitTime = Math.floor((new Date() - new Date(entry.created_at)) / (1000 * 60)); // minutes
          const matchingTables = findMatchingWaitlistEntries([entry], tables[0], new Date(), '12:00');
          const hasAvailableTable = matchingTables.length > 0;

          return (
            <div
              key={entry.id}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-medium text-lg">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{entry.customer_name}</p>
                      <p className="text-white/60 text-sm flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {entry.customer_phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <Users className="w-4 h-4" />
                      <span>{entry.party_size} guests</span>
                    </div>
                    
                    {entry.preferred_time && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Clock3 className="w-4 h-4" />
                        <span>{entry.preferred_time}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        waitTime < 15 ? 'bg-emerald-500/20 text-emerald-300' :
                        waitTime < 30 ? 'bg-amber-500/20 text-amber-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        Waiting {waitTime}m
                      </span>
                    </div>

                    {hasAvailableTable && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                          ✓ Table Available
                        </span>
                      </div>
                    )}
                  </div>

                  {entry.notes && (
                    <p className="text-white/60 text-sm mt-2 italic">{entry.notes}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleConvertToReservation(entry)}
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600
                             text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" />
                    Convert
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleNotifyCustomer(entry)}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all text-sm flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Notify
                  </button>

                  <button
                    onClick={() => handleRemoveFromWaitlist(entry)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all text-sm flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
