/**
 * PHASE 10 — EVENT BOOKING MODAL
 * 
 * Specialized modal for event bookings (birthdays, corporate, etc.)
 */

import { useState } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { X, PartyPopper, Calendar, Users, DollarSign, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { validateEventBooking, calculateEventTotal } from '../utils/reservationUtils';

const EVENT_PACKAGES = {
  basic: { perPerson: 500, name: 'Basic Package', includes: 'Standard menu' },
  standard: { perPerson: 800, name: 'Standard Package', includes: 'Premium menu + decorations' },
  premium: { perPerson: 1200, name: 'Premium Package', includes: 'Premium menu + decorations + cake' },
  luxury: { perPerson: 1800, name: 'Luxury Package', includes: 'All inclusive + photography' }
};

export default function EventBookingModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    event_type: 'birthday',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    reservation_date: format(new Date(), 'yyyy-MM-dd'),
    time_slot: '',
    party_size: 10,
    event_package: 'standard',
    venue_charge: 5000,
    special_requests: '',
    advance_payment: 0
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const eventTotal = calculateEventTotal(formData, EVENT_PACKAGES);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const validation = validateEventBooking(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .insert([{
          ...formData,
          type: 'event',
          status: 'confirmed',
          estimated_total: eventTotal.total,
          created_at: new Date().toISOString(),
          restaurant_id: (await supabase.auth.getUser()).data.user?.user_metadata?.restaurant_id
        }]);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating event:', error);
      setErrors([error.message || 'Failed to create event booking']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-3xl w-full my-8">
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <PartyPopper className="w-6 h-6 text-purple-400" />
              Book Event
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                {errors.map((error, i) => (
                  <p key={i} className="text-red-400 text-sm">{error}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="text-white/60 text-sm mb-2 block">Event Type *</label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="birthday">🎂 Birthday Party</option>
              <option value="anniversary">💝 Anniversary</option>
              <option value="corporate">💼 Corporate Event</option>
              <option value="wedding">💒 Wedding Reception</option>
              <option value="party">🎉 Party</option>
              <option value="custom">✨ Custom Event</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Customer Name *"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number *"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date *
              </label>
              <input
                type="date"
                value={formData.reservation_date}
                onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Guests *
              </label>
              <input
                type="number"
                value={formData.party_size}
                onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) || 10 })}
                min="10"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-3 block">Package Selection *</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(EVENT_PACKAGES).map(([key, pkg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, event_package: key })}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.event_package === key
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className="text-white font-medium">{pkg.name}</p>
                  <p className="text-emerald-400 text-lg font-bold">₹{pkg.perPerson}/person</p>
                  <p className="text-white/60 text-xs mt-1">{pkg.includes}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Price Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Food & Beverage ({formData.party_size} × ₹{EVENT_PACKAGES[formData.event_package].perPerson})</span>
                <span className="text-white">₹{eventTotal.breakdown.foodBeverage.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Venue Charge</span>
                <span className="text-white">₹{eventTotal.breakdown.venue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>GST (5%)</span>
                <span className="text-white">₹{eventTotal.breakdown.tax.toLocaleString()}</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2 flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-emerald-400">₹{eventTotal.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <textarea
            placeholder="Special requests, dietary requirements, decorations..."
            value={formData.special_requests}
            onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Booking...' : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
