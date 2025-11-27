/**
 * PHASE 10 — RESERVATIONS TAB
 * 
 * Main entry point for Reservations management in Manager Dashboard
 * 
 * Features:
 * - Today's Reservations
 * - Upcoming Reservations
 * - Calendar View
 * - Events Management
 * - Waitlist
 * - History
 * - Search & Filters
 * - Real-time updates via Supabase
 */

import { useState, useEffect } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  Filter, 
  Plus, 
  ListFilter,
  CalendarDays,
  PartyPopper,
  Clock3,
  History
} from 'lucide-react';
import CreateReservationModal from './CreateReservationModal';
import ReservationsList from './ReservationsList';
import CalendarView from './CalendarView';
import WaitlistManager from './WaitlistManager';
import EventBookingModal from './EventBookingModal';
import ReservationHistoryModal from './ReservationHistoryModal';
import { getTodaysReservations, getUpcomingReservations, filterReservations } from '../utils/reservationUtils';

export default function ReservationsTab() {
  const [activeSubTab, setActiveSubTab] = useState('today');
  const [reservations, setReservations] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    partySize: '',
    dateRange: { start: '', end: '' }
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchReservations();
    fetchWaitlist();
    fetchTables();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const reservationsChannel = supabase
      .channel('reservations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    const waitlistChannel = supabase
      .channel('waitlist_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'waitlist' },
        () => {
          fetchWaitlist();
        }
      )
      .subscribe();

    return () => {
      reservationsChannel.unsubscribe();
      waitlistChannel.unsubscribe();
    };
  }, []);

  async function fetchReservations() {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('reservation_date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWaitlist() {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setWaitlist(data || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    }
  }

  async function fetchTables() {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number', { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  }

  // Filter logic
  const getFilteredReservations = () => {
    let filtered = reservations;

    // Apply search
    if (searchTerm) {
      filtered = filterReservations(filtered, { searchTerm });
    }

    // Apply filters
    if (filters.status || filters.partySize || filters.dateRange.start) {
      filtered = filterReservations(filtered, filters);
    }

    // Apply sub-tab specific filters
    switch (activeSubTab) {
      case 'today':
        return getTodaysReservations(filtered);
      case 'upcoming':
        return getUpcomingReservations(filtered);
      case 'calendar':
        return filtered;
      case 'events':
        return filtered.filter(r => r.type === 'event');
      default:
        return filtered;
    }
  };

  const filteredReservations = getFilteredReservations();

  // Sub tabs configuration
  const subTabs = [
    { id: 'today', label: 'Today', icon: Clock, count: getTodaysReservations(reservations).length },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarDays, count: getUpcomingReservations(reservations).length },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'events', label: 'Events', icon: PartyPopper, count: reservations.filter(r => r.type === 'event').length },
    { id: 'waitlist', label: 'Waitlist', icon: Clock3, count: waitlist.length },
    { id: 'history', label: 'History', icon: History }
  ];

  // Stats
  const stats = {
    todayTotal: getTodaysReservations(reservations).length,
    todayGuests: getTodaysReservations(reservations).reduce((sum, r) => sum + (r.party_size || 0), 0),
    upcomingTotal: getUpcomingReservations(reservations).length,
    waitlistCount: waitlist.length
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-emerald-400" />
            Reservations
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Manage table reservations, events, and waitlist
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg
                     transition-all flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            onClick={() => setShowEventModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600
                     text-white rounded-lg transition-all flex items-center gap-2 font-medium"
          >
            <PartyPopper className="w-4 h-4" />
            Book Event
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600
                     text-white rounded-lg transition-all flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Reservation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Today</p>
              <p className="text-white text-xl font-bold">{stats.todayTotal}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Guests Today</p>
              <p className="text-white text-xl font-bold">{stats.todayGuests}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Upcoming</p>
              <p className="text-white text-xl font-bold">{stats.upcomingTotal}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Clock3 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Waitlist</p>
              <p className="text-white text-xl font-bold">{stats.waitlistCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2">
        <div className="flex flex-wrap gap-2">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`
                  px-4 py-2 rounded-lg transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center
                  ${isActive 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium' 
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${isActive ? 'bg-white/20' : 'bg-white/10'}
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters */}
      {activeSubTab !== 'calendar' && activeSubTab !== 'history' && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg
                         text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                px-4 py-2 rounded-lg transition-all flex items-center gap-2
                ${showFilters 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              Filters
              {(filters.status || filters.partySize || filters.dateRange.start) && (
                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="arrived">Arrived</option>
                  <option value="seated">Seated</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Party Size</label>
                <input
                  type="number"
                  placeholder="Any size"
                  value={filters.partySize}
                  onChange={(e) => setFilters({ ...filters, partySize: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      dateRange: { ...filters.dateRange, start: e.target.value } 
                    })}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white
                             focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="md:col-span-3 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setFilters({ status: '', partySize: '', dateRange: { start: '', end: '' } });
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
        {activeSubTab === 'calendar' && (
          <CalendarView 
            reservations={reservations} 
            tables={tables}
            onDateClick={(date) => {
              setActiveSubTab('today');
              setFilters({ ...filters, dateRange: { start: date, end: date } });
            }}
          />
        )}

        {activeSubTab === 'waitlist' && (
          <WaitlistManager 
            waitlist={waitlist}
            tables={tables}
            reservations={reservations}
            onUpdate={fetchWaitlist}
          />
        )}

        {(activeSubTab === 'today' || activeSubTab === 'upcoming' || activeSubTab === 'events') && (
          <ReservationsList
            reservations={filteredReservations}
            tables={tables}
            onUpdate={fetchReservations}
            type={activeSubTab}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateReservationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchReservations();
            setShowCreateModal(false);
          }}
          tables={tables}
          existingReservations={reservations}
        />
      )}

      {showEventModal && (
        <EventBookingModal
          onClose={() => setShowEventModal(false)}
          onSuccess={() => {
            fetchReservations();
            setShowEventModal(false);
          }}
          tables={tables}
        />
      )}

      {showHistoryModal && (
        <ReservationHistoryModal
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}
