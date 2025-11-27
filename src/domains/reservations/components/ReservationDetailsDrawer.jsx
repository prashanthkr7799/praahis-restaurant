/**
 * PHASE 10 — RESERVATION DETAILS DRAWER
 * 
 * Right-side drawer showing full reservation details
 */

import { X, Calendar, Users, Phone, Mail, Clock, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatReservationStatus } from '../utils/reservationUtils';

export default function ReservationDetailsDrawer({ reservation, onClose }) {
  const statusInfo = formatReservationStatus(reservation.status);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-900 border-l border-white/10 w-full md:w-[400px] h-[80vh] md:h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-white">Reservation Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={`px-4 py-3 rounded-xl ${statusInfo.bgColor} border ${statusInfo.bgColor.replace('/20', '/30')}`}>
            <p className={`${statusInfo.textColor} font-medium text-center`}>{statusInfo.label}</p>
          </div>

          <div>
            <p className="text-white/60 text-sm mb-2">Customer Name</p>
            <p className="text-white font-medium">{reservation.customer_name}</p>
          </div>

          <div className="flex items-center gap-3 text-white/80">
            <Phone className="w-4 h-4" />
            <span>{reservation.customer_phone}</span>
          </div>

          {reservation.customer_email && (
            <div className="flex items-center gap-3 text-white/80">
              <Mail className="w-4 h-4" />
              <span className="truncate">{reservation.customer_email}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </p>
              <p className="text-white font-medium">
                {format(parseISO(reservation.reservation_date), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time
              </p>
              <p className="text-white font-medium">{reservation.time_slot}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Party Size
              </p>
              <p className="text-white font-medium">{reservation.party_size} guests</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-2">Table</p>
              <p className="text-white font-medium">Table {reservation.table_number || 'TBD'}</p>
            </div>
          </div>

          {reservation.occasion && (
            <div>
              <p className="text-white/60 text-sm mb-2">Occasion</p>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                {reservation.occasion}
              </span>
            </div>
          )}

          {reservation.special_requests && (
            <div>
              <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Special Requests
              </p>
              <p className="text-white/80 text-sm bg-white/5 p-3 rounded-lg">{reservation.special_requests}</p>
            </div>
          )}

          {reservation.type === 'event' && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-purple-300 font-medium mb-2">Event Booking</p>
              {reservation.estimated_total && (
                <p className="text-white">Estimated Total: ₹{reservation.estimated_total.toLocaleString()}</p>
              )}
            </div>
          )}

          <div className="text-xs text-white/40 pt-4 border-t border-white/10">
            <p>Created: {format(parseISO(reservation.created_at), 'MMM dd, yyyy HH:mm')}</p>
            {reservation.updated_at && (
              <p className="mt-1">Updated: {format(parseISO(reservation.updated_at), 'MMM dd, yyyy HH:mm')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
