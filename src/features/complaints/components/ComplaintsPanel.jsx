import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Filter,
  Search,
  Calendar,
  Flag,
  Eye,
  CheckSquare
} from 'lucide-react';
import { getComplaints } from '@config/supabase';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import ComplaintDetailsModal from './modals/ComplaintDetailsModal';

/**
 * ComplaintsPanel Component
 * 
 * Displays complaints/issues grouped by priority with filtering capabilities.
 * Used in Staff tab of ManagerDashboard.
 * 
 * @param {Object} props
 * @param {string} props.restaurantId - Restaurant ID
 */
export default function ComplaintsPanel({ restaurantId }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');

  const loadComplaints = async () => {
    try {
      setLoading(true);

      // Build filters object
      const filters = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      // Date range filter
      if (dateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filters.startDate = today.toISOString();
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filters.startDate = weekAgo.toISOString();
      } else if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filters.startDate = monthAgo.toISOString();
      }

      const data = await getComplaints(restaurantId, filters);
      setComplaints(data);
    } catch (error) {
      console.error('Error loading complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      loadComplaints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, statusFilter, dateRange]);

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleComplaintUpdated = () => {
    loadComplaints();
  };

  // Filter complaints by search query
  const filteredComplaints = complaints.filter(complaint => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      complaint.description?.toLowerCase().includes(searchLower) ||
      complaint.issue_types?.some(type => type.toLowerCase().includes(searchLower)) ||
      complaint.orders?.order_number?.toLowerCase().includes(searchLower) ||
      complaint.table_number?.toLowerCase().includes(searchLower)
    );
  });

  // Group by priority
  const highPriority = filteredComplaints.filter(c => c.priority === 'high');
  const mediumPriority = filteredComplaints.filter(c => c.priority === 'medium');
  const lowPriority = filteredComplaints.filter(c => c.priority === 'low');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-900',
          badge: 'bg-red-100 text-red-800'
        };
      case 'medium':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          text: 'text-amber-900',
          badge: 'bg-amber-100 text-amber-800'
        };
      case 'low':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const ComplaintCard = ({ complaint }) => {
    const colors = getPriorityColor(complaint.priority);
    
    return (
      <div
        onClick={() => handleComplaintClick(complaint)}
        className={`p-4 rounded-xl border-2 ${colors.border} ${colors.bg} cursor-pointer hover:shadow-md transition-all`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Flag className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
              <span className={`text-xs font-semibold uppercase ${colors.text}`}>
                {complaint.priority} Priority
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-600">
                {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Order/Table Info */}
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
              {complaint.orders?.order_number && (
                <span className="font-medium">Order #{complaint.orders.order_number}</span>
              )}
              {complaint.table_number && (
                <>
                  {complaint.orders?.order_number && <span>•</span>}
                  <span>Table {complaint.table_number}</span>
                </>
              )}
            </div>

            {/* Issue Types */}
            <div className="flex flex-wrap gap-1 mb-2">
              {complaint.issue_types?.map((type, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs font-medium bg-white/50 rounded-md border"
                >
                  {type.replace(/_/g, ' ')}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
              {complaint.description}
            </p>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {getStatusIcon(complaint.status)}
              <span className="text-xs font-medium text-gray-700">
                {getStatusLabel(complaint.status)}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            className="p-2 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleComplaintClick(complaint);
            }}
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    );
  };

  const PrioritySection = ({ title, complaints, icon, color }) => {
    if (complaints.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className={`text-sm font-semibold ${color}`}>
            {title} ({complaints.length})
          </h3>
        </div>
        <div className="space-y-2">
          {complaints.map(complaint => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Complaints & Issues</h2>
              <p className="text-sm text-gray-600">
                {filteredComplaints.length} total complaint{filteredComplaints.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={loadComplaints}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints..."
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all appearance-none bg-white cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List Grouped by Priority */}
      <div className="space-y-6">
        {filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Complaints Found
            </h3>
            <p className="text-sm text-gray-600">
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : 'All clear! No complaints to display for the selected period.'}
            </p>
          </div>
        ) : (
          <>
            <PrioritySection
              title="High Priority"
              complaints={highPriority}
              icon={<Flag className="w-5 h-5 text-red-600" />}
              color="text-red-900"
            />

            <PrioritySection
              title="Medium Priority"
              complaints={mediumPriority}
              icon={<Flag className="w-5 h-5 text-amber-600" />}
              color="text-amber-900"
            />

            <PrioritySection
              title="Low Priority"
              complaints={lowPriority}
              icon={<Flag className="w-5 h-5 text-blue-600" />}
              color="text-blue-900"
            />
          </>
        )}
      </div>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedComplaint(null);
          }}
          onUpdate={handleComplaintUpdated}
          restaurantId={restaurantId}
        />
      )}
    </div>
  );
}
