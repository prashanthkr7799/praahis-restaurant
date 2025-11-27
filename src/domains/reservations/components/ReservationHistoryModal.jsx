/**
 * PHASE 10 — RESERVATION HISTORY MODAL
 * 
 * View past reservations with filters and export
 */

import { useState, useEffect } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { X, History, Download, Calendar } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { formatReservationStatus, exportReservationsToCSV } from '../utils/reservationUtils';

export default function ReservationHistoryModal({ onClose }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    status: ''
  });

  useEffect(() => {
    fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function fetchHistory() {
    setLoading(true);
    try {
      let query = supabase
        .from('reservations')
        .select('*')
        .gte('reservation_date', filters.startDate)
        .lte('reservation_date', filters.endDate)
        .order('reservation_date', { ascending: false })
        .limit(200);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    const csv = exportReservationsToCSV(reservations);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-6 h-6 text-blue-400" />
              Reservation History
            </h3>
            <p className="text-white/60 text-sm mt-1">{reservations.length} reservations found</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-2 block">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-2 block">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-2 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No reservations found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map(res => {
                const statusInfo = formatReservationStatus(res.status);
                return (
                  <div key={res.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium">{res.customer_name}</p>
                        <p className="text-white/60 text-sm mt-1">
                          {format(parseISO(res.reservation_date), 'MMM dd, yyyy')} at {res.time_slot}
                        </p>
                        <p className="text-white/40 text-sm">
                          Party of {res.party_size} • Table {res.table_number || 'TBD'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
