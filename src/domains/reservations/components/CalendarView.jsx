/**
 * PHASE 10 — CALENDAR VIEW
 * 
 * Monthly/Weekly calendar view with:
 * - Reservation counts per day
 * - Peak day highlights
 * - Clickable dates
 * - Visual density indicators
 */

import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Users,
  TrendingUp
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { groupByDate, getDayPeakScore } from '../utils/reservationUtils';

export default function CalendarView({ reservations = [], tables = [], onDateClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Group reservations by date
  const reservationsByDate = groupByDate(reservations);

  // Get reservations for selected date
  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedDateReservations = selectedDateKey ? (reservationsByDate[selectedDateKey] || []) : [];

  function handleDateClick(date) {
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(format(date, 'yyyy-MM-dd'));
    }
  }

  function getDayStats(date) {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayReservations = reservationsByDate[dateKey] || [];
    const activeReservations = dayReservations.filter(r => r.status !== 'cancelled');
    
    return {
      total: activeReservations.length,
      guests: activeReservations.reduce((sum, r) => sum + (r.party_size || 0), 0),
      peakScore: getDayPeakScore(activeReservations, tables.length)
    };
  }

  function getPeakColorClass(score) {
    if (score >= 80) return 'bg-red-500/20 border-red-500/40 text-red-300';
    if (score >= 60) return 'bg-orange-500/20 border-orange-500/40 text-orange-300';
    if (score >= 40) return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
    if (score >= 20) return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
    return 'bg-white/5 border-white/10 text-white/60';
  }

  return (
    <div className="p-4 md:p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-400" />
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
          </div>

          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentMonth(new Date())}
            className="ml-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all text-sm font-medium"
          >
            Today
          </button>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/40 rounded" />
            <span className="text-white/60">Light</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500/20 border border-amber-500/40 rounded" />
            <span className="text-white/60">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500/20 border border-orange-500/40 rounded" />
            <span className="text-white/60">Busy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/20 border border-red-500/40 rounded" />
            <span className="text-white/60">Peak</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-white/60 text-sm font-medium py-2">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map(day => {
          const stats = getDayStats(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isPast = day < new Date() && !isToday;

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              disabled={!isCurrentMonth}
              className={`
                aspect-square p-2 rounded-xl border-2 transition-all relative
                ${isCurrentMonth ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'}
                ${isSelected 
                  ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-gray-900' 
                  : ''
                }
                ${isToday ? 'ring-2 ring-blue-500' : ''}
                ${isPast && isCurrentMonth ? 'opacity-60' : ''}
                ${stats.total > 0 && isCurrentMonth
                  ? getPeakColorClass(stats.peakScore)
                  : 'bg-white/5 border-white/10 text-white/40'
                }
                ${stats.total > 0 && isCurrentMonth ? 'hover:scale-105' : 'hover:bg-white/10'}
              `}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className={`text-sm font-medium ${isToday ? 'text-blue-300' : ''}`}>
                  {format(day, 'd')}
                </span>
                
                {stats.total > 0 && isCurrentMonth && (
                  <>
                    <div className="flex items-center gap-1 mt-1">
                      <CalendarIcon className="w-3 h-3" />
                      <span className="text-xs font-bold">{stats.total}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className="text-xs">{stats.guests}</span>
                    </div>
                  </>
                )}

                {stats.peakScore >= 80 && isCurrentMonth && (
                  <TrendingUp className="w-3 h-3 absolute top-1 right-1" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && selectedDateReservations.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <p className="text-emerald-400 text-sm">Total Reservations</p>
              <p className="text-white text-2xl font-bold">{selectedDateReservations.length}</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-blue-400 text-sm">Total Guests</p>
              <p className="text-white text-2xl font-bold">
                {selectedDateReservations.reduce((sum, r) => sum + (r.party_size || 0), 0)}
              </p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <p className="text-purple-400 text-sm">Peak Score</p>
              <p className="text-white text-2xl font-bold">
                {getDayPeakScore(selectedDateReservations, tables.length)}%
              </p>
            </div>
          </div>

          {/* Reservation Timeline */}
          <div className="space-y-2">
            <h5 className="text-white/60 text-sm font-medium mb-3">Reservations Timeline</h5>
            {selectedDateReservations
              .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
              .map(reservation => (
                <div 
                  key={reservation.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{reservation.time_slot}</span>
                    <span className="text-white/60">•</span>
                    <span className="text-white">{reservation.customer_name}</span>
                    <span className="text-white/60 text-sm flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {reservation.party_size}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">Table {reservation.table_number}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      reservation.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' :
                      reservation.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {reservation.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* No selection */}
      {selectedDate && selectedDateReservations.length === 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60">No reservations for {format(selectedDate, 'MMMM d, yyyy')}</p>
        </div>
      )}
    </div>
  );
}
