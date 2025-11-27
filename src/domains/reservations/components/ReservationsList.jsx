/**
 * PHASE 10 — RESERVATIONS LIST
 * 
 * Displays paginated list of reservations with actions:
 * - Edit
 * - Cancel
 * - Mark Arrived
 * - Move to Waitlist
 * - QR Check-in
 * - View Details
 */

import { useState } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { 
  Edit2, 
  X, 
  Check, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  QrCode,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatReservationStatus, canCancelReservation } from '../utils/reservationUtils';
import CreateReservationModal from './CreateReservationModal';
import ReservationDetailsDrawer from './ReservationDetailsDrawer';
import QRCheckinModal from './QRCheckinModal';

export default function ReservationsList({ reservations = [], tables = [], onUpdate, type = 'all' }) {
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(reservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReservations = reservations.slice(startIndex, endIndex);

  async function handleStatusChange(reservation, newStatus) {
    setActionLoading(reservation.id);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setActionLoading(null);
      setShowActionMenu(null);
    }
  }

  async function handleCancelReservation(reservation) {
    const { canCancel, reason } = canCancelReservation(reservation);
    
    if (!canCancel) {
      alert(reason);
      return;
    }

    const confirmMsg = reason 
      ? `${reason}\n\nAre you sure you want to cancel this reservation?`
      : 'Are you sure you want to cancel this reservation?';

    if (!confirm(confirmMsg)) return;

    const cancellationReason = prompt('Cancellation reason (optional):');

    setActionLoading(reservation.id);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: 'cancelled',
          cancellation_reason: cancellationReason || null,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Failed to cancel reservation. Please try again.');
    } finally {
      setActionLoading(null);
      setShowActionMenu(null);
    }
  }

  function handleEditClick(reservation) {
    setSelectedReservation(reservation);
    setShowEditModal(true);
  }

  function handleDetailsClick(reservation) {
    setSelectedReservation(reservation);
    setShowDetailsDrawer(true);
  }

  function handleQRClick(reservation) {
    setSelectedReservation(reservation);
    setShowQRModal(true);
  }

  if (reservations.length === 0) {
    return (
      <div className="p-12 text-center">
        <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <p className="text-white/60 text-lg">No reservations found</p>
        <p className="text-white/40 text-sm mt-2">
          {type === 'today' && 'No reservations scheduled for today'}
          {type === 'upcoming' && 'No upcoming reservations'}
          {type === 'events' && 'No events scheduled'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-white/60 text-sm font-medium pb-3 px-4">Date & Time</th>
              <th className="text-left text-white/60 text-sm font-medium pb-3 px-4">Customer</th>
              <th className="text-left text-white/60 text-sm font-medium pb-3 px-4">Party</th>
              <th className="text-left text-white/60 text-sm font-medium pb-3 px-4">Table</th>
              <th className="text-left text-white/60 text-sm font-medium pb-3 px-4">Status</th>
              <th className="text-left text-white/60 text-sm font-medium pb-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentReservations.map((reservation) => {
              const statusInfo = formatReservationStatus(reservation.status);
              const isLoading = actionLoading === reservation.id;

              return (
                <tr 
                  key={reservation.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => handleDetailsClick(reservation)}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-white font-medium">
                          {format(parseISO(reservation.reservation_date), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-white/60 text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {reservation.time_slot}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div>
                      <p className="text-white font-medium">{reservation.customer_name}</p>
                      <div className="flex items-center gap-2 text-white/60 text-sm mt-1">
                        <Phone className="w-3 h-3" />
                        <span>{reservation.customer_phone}</span>
                      </div>
                      {reservation.customer_email && (
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{reservation.customer_email}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-medium">{reservation.party_size}</span>
                      {reservation.occasion && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                          {reservation.occasion}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span className="text-white font-medium">
                      {reservation.table_number || 'TBD'}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                      {statusInfo.label}
                    </span>
                  </td>

                  <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {reservation.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(reservation, 'arrived')}
                          disabled={isLoading}
                          className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all"
                          title="Mark as Arrived"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleQRClick(reservation)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all"
                        title="QR Check-in"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEditClick(reservation)}
                        disabled={isLoading}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === reservation.id ? null : reservation.id)}
                          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {showActionMenu === reservation.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-10">
                            {reservation.status === 'arrived' && (
                              <button
                                onClick={() => handleStatusChange(reservation, 'seated')}
                                className="w-full px-4 py-2 text-left text-white hover:bg-white/5 transition-colors"
                              >
                                Mark as Seated
                              </button>
                            )}
                            {reservation.status === 'seated' && (
                              <button
                                onClick={() => handleStatusChange(reservation, 'completed')}
                                className="w-full px-4 py-2 text-left text-white hover:bg-white/5 transition-colors"
                              >
                                Mark as Completed
                              </button>
                            )}
                            {!['cancelled', 'completed'].includes(reservation.status) && (
                              <button
                                onClick={() => handleCancelReservation(reservation)}
                                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                Cancel Reservation
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {currentReservations.map((reservation) => {
          const statusInfo = formatReservationStatus(reservation.status);
          const isLoading = actionLoading === reservation.id;

          return (
            <div
              key={reservation.id}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-3"
              onClick={() => handleDetailsClick(reservation)}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    {format(parseISO(reservation.reservation_date), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-white/60 text-sm flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {reservation.time_slot}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Customer Info */}
              <div>
                <p className="text-white font-medium">{reservation.customer_name}</p>
                <p className="text-white/60 text-sm flex items-center gap-2 mt-1">
                  <Phone className="w-3 h-3" />
                  {reservation.customer_phone}
                </p>
              </div>

              {/* Party & Table */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-white">{reservation.party_size} guests</span>
                </div>
                <div className="text-white/60">
                  Table {reservation.table_number || 'TBD'}
                </div>
              </div>

              {/* Special Requests */}
              {reservation.special_requests && (
                <div className="flex items-start gap-2 text-white/60 text-sm">
                  <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="line-clamp-2">{reservation.special_requests}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                {reservation.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange(reservation, 'arrived')}
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Arrived
                  </button>
                )}
                
                <button
                  onClick={() => handleEditClick(reservation)}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>

                {!['cancelled', 'completed'].includes(reservation.status) && (
                  <button
                    onClick={() => handleCancelReservation(reservation)}
                    disabled={isLoading}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-white/60 text-sm">
            Showing {startIndex + 1} to {Math.min(endIndex, reservations.length)} of {reservations.length} reservations
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`
                    w-10 h-10 rounded-lg transition-all font-medium
                    ${currentPage === page
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                    }
                  `}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditModal && selectedReservation && (
        <CreateReservationModal
          onClose={() => {
            setShowEditModal(false);
            setSelectedReservation(null);
          }}
          onSuccess={() => {
            onUpdate();
            setShowEditModal(false);
            setSelectedReservation(null);
          }}
          tables={tables}
          existingReservations={reservations}
          editMode={true}
          existingData={selectedReservation}
        />
      )}

      {showDetailsDrawer && selectedReservation && (
        <ReservationDetailsDrawer
          reservation={selectedReservation}
          onClose={() => {
            setShowDetailsDrawer(false);
            setSelectedReservation(null);
          }}
          onUpdate={onUpdate}
        />
      )}

      {showQRModal && selectedReservation && (
        <QRCheckinModal
          reservation={selectedReservation}
          onClose={() => {
            setShowQRModal(false);
            setSelectedReservation(null);
          }}
          onSuccess={() => {
            onUpdate();
            setShowQRModal(false);
            setSelectedReservation(null);
          }}
        />
      )}
    </div>
  );
}
