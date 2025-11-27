/**
 * PHASE 10 — CREATE RESERVATION MODAL
 * 
 * Form for creating new reservations with:
 * - Customer details
 * - Date/Time selection
 * - Table assignment
 * - Party size
 * - Special requests
 * - Validation & conflict checking
 */

import { useState, useEffect } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { X, Calendar, Clock, Users, Phone, Mail, User, MessageSquare, AlertCircle, Check } from 'lucide-react';
import { 
  validateReservation, 
  getAvailableTimeSlots, 
  checkTableAvailability, 
  findBestTableMatch 
} from '../utils/reservationUtils';
import { format } from 'date-fns';

export default function CreateReservationModal({ 
  onClose, 
  onSuccess, 
  tables = [], 
  existingReservations = [],
  editMode = false,
  existingData = null 
}) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    reservation_date: format(new Date(), 'yyyy-MM-dd'),
    time_slot: '',
    party_size: 2,
    table_id: '',
    occasion: '',
    special_requests: '',
    status: 'confirmed',
    type: 'regular'
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedTable, setSuggestedTable] = useState(null);
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Load existing data in edit mode
  useEffect(() => {
    if (editMode && existingData) {
      setFormData({
        ...existingData,
        reservation_date: existingData.reservation_date?.split('T')[0] || format(new Date(), 'yyyy-MM-dd')
      });
    }
  }, [editMode, existingData]);

  // Fetch existing customers for auto-suggest
  useEffect(() => {
    fetchExistingCustomers();
  }, []);

  // Update available time slots when date changes
  useEffect(() => {
    if (formData.reservation_date) {
      const slots = getAvailableTimeSlots(new Date(formData.reservation_date), {
        openTime: '11:00',
        closeTime: '23:00',
        slotDuration: 30
      });
      setAvailableSlots(slots);
    }
  }, [formData.reservation_date]);

  // Update available tables when date, time, or party size changes
  useEffect(() => {
    if (formData.reservation_date && formData.time_slot && formData.party_size) {
      updateAvailableTables();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.reservation_date, formData.time_slot, formData.party_size]);

  async function fetchExistingCustomers() {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('customer_name, customer_phone, customer_email')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Remove duplicates
      const unique = [];
      const seen = new Set();
      data?.forEach(item => {
        if (item.customer_phone && !seen.has(item.customer_phone)) {
          seen.add(item.customer_phone);
          unique.push(item);
        }
      });
      
      setExistingCustomers(unique);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }

  function updateAvailableTables() {
    const date = new Date(formData.reservation_date);
    
    const available = tables.filter(table => 
      table.capacity >= formData.party_size &&
      table.status === 'available' &&
      checkTableAvailability(
        existingReservations.filter(r => r.id !== existingData?.id), // Exclude current reservation in edit mode
        table.id,
        date,
        formData.time_slot
      )
    );

    setAvailableTables(available);

    // Auto-suggest best table
    if (available.length > 0) {
      const best = findBestTableMatch(
        tables,
        existingReservations.filter(r => r.id !== existingData?.id),
        formData.party_size,
        date,
        formData.time_slot
      );
      setSuggestedTable(best);
      
      // Auto-select if no table selected yet
      if (!formData.table_id && best) {
        setFormData(prev => ({ ...prev, table_id: best.id }));
      }
    } else {
      setSuggestedTable(null);
    }
  }

  function handleCustomerSelect(customer) {
    setFormData(prev => ({
      ...prev,
      customer_name: customer.customer_name,
      customer_phone: customer.customer_phone,
      customer_email: customer.customer_email || ''
    }));
    setShowCustomerSuggestions(false);
  }

  function handlePhoneChange(value) {
    setFormData(prev => ({ ...prev, customer_phone: value }));
    
    // Show suggestions if phone matches
    if (value.length >= 3) {
      const matches = existingCustomers.filter(c => 
        c.customer_phone.includes(value)
      );
      setShowCustomerSuggestions(matches.length > 0);
    } else {
      setShowCustomerSuggestions(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    // Validate
    const validation = validateReservation(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Check table conflict
    if (!editMode || formData.table_id !== existingData?.table_id || 
        formData.time_slot !== existingData?.time_slot ||
        formData.reservation_date !== existingData?.reservation_date) {
      
      const isAvailable = checkTableAvailability(
        existingReservations.filter(r => r.id !== existingData?.id),
        formData.table_id,
        new Date(formData.reservation_date),
        formData.time_slot
      );

      if (!isAvailable) {
        setErrors(['Selected table is not available at this time. Please choose another table or time slot.']);
        return;
      }
    }

    setLoading(true);

    try {
      const selectedTable = tables.find(t => t.id === formData.table_id);
      
      const reservationData = {
        ...formData,
        table_number: selectedTable?.table_number || null,
        restaurant_id: (await supabase.auth.getUser()).data.user?.user_metadata?.restaurant_id,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (editMode && existingData?.id) {
        // Update existing reservation
        result = await supabase
          .from('reservations')
          .update(reservationData)
          .eq('id', existingData.id)
          .select()
          .single();
      } else {
        // Create new reservation
        reservationData.created_at = new Date().toISOString();
        result = await supabase
          .from('reservations')
          .insert([reservationData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onSuccess(result.data);
    } catch (error) {
      console.error('Error saving reservation:', error);
      setErrors([error.message || 'Failed to save reservation. Please try again.']);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomerSuggestions = existingCustomers.filter(c =>
    c.customer_phone.includes(formData.customer_phone) ||
    c.customer_name.toLowerCase().includes(formData.customer_name.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-emerald-400" />
              {editMode ? 'Edit Reservation' : 'New Reservation'}
            </h3>
            <p className="text-white/60 text-sm mt-1">
              {editMode ? 'Update reservation details' : 'Create a new table reservation'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-medium mb-1">Please fix the following errors:</p>
                <ul className="text-red-300 text-sm space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Details */}
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Customer Details
            </h4>

            <div className="relative">
              <label className="text-white/60 text-sm mb-2 block">Customer Name *</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Enter customer name"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                         placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="relative">
              <label className="text-white/60 text-sm mb-2 block">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="10-digit phone number"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Customer Suggestions */}
              {showCustomerSuggestions && filteredCustomerSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-white/10 rounded-lg overflow-hidden shadow-xl">
                  {filteredCustomerSuggestions.map((customer, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <p className="text-white font-medium">{customer.customer_name}</p>
                      <p className="text-white/60 text-sm">{customer.customer_phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Email (Optional)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="customer@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Reservation Details */}
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Reservation Details
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Date *</label>
                <input
                  type="date"
                  value={formData.reservation_date}
                  onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Time *</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={formData.time_slot}
                    onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                             focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                    required
                  >
                    <option value="">Select time</option>
                    {availableSlots.map(slot => (
                      <option key={slot.time} value={slot.time}>
                        {slot.display}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Party Size *</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={formData.party_size}
                    onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="50"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                             focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Occasion</label>
                <select
                  value={formData.occasion}
                  onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Regular</option>
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="date">Date Night</option>
                  <option value="business">Business</option>
                  <option value="celebration">Celebration</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Table Assignment *</label>
              <select
                value={formData.table_id}
                onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                         focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select table</option>
                {availableTables.map(table => (
                  <option key={table.id} value={table.id}>
                    Table {table.table_number} - Seats {table.capacity}
                    {suggestedTable?.id === table.id ? ' (Recommended)' : ''}
                  </option>
                ))}
              </select>
              {availableTables.length === 0 && formData.time_slot && (
                <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  No tables available for this time. Try a different time slot.
                </p>
              )}
              {suggestedTable && (
                <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Table {suggestedTable.table_number} recommended for {formData.party_size} guests
                </p>
              )}
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">Special Requests</label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  placeholder="Any special requests or dietary requirements..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3 bg-white/5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg
                     transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600
                     text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {editMode ? 'Update Reservation' : 'Create Reservation'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
