import { useState } from 'react';
import { 
  AlertTriangle, 
  FileText, 
  Flag, 
  Clock, 
  CheckCircle,
  User,
  Calendar,
  XCircle
} from 'lucide-react';
import Modal from '@shared/components/compounds/Modal';
import { updateComplaint } from '@shared/utils/api/supabaseClient';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

/**
 * ComplaintDetailsModal Component
 * 
 * Modal for viewing and editing complaint details.
 * Allows staff to update status, add action taken notes, and resolve complaints.
 * 
 * @param {Object} props
 * @param {Object} props.complaint - Complaint object
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onUpdate - Update callback after changes
 * @param {string} props.restaurantId - Restaurant ID
 */
export default function ComplaintDetailsModal({ complaint, isOpen, onClose, onUpdate }) {
  const [status, setStatus] = useState(complaint?.status || 'open');
  const [actionTaken, setActionTaken] = useState(complaint?.action_taken || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'open', label: 'Open', color: 'amber', icon: Clock },
    { value: 'in_progress', label: 'In Progress', color: 'blue', icon: AlertTriangle },
    { value: 'resolved', label: 'Resolved', color: 'green', icon: CheckCircle },
    { value: 'closed', label: 'Closed', color: 'gray', icon: XCircle }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-900',
          badge: 'bg-red-500'
        };
      case 'medium':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          text: 'text-amber-900',
          badge: 'bg-amber-500'
        };
      case 'low':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-900',
          badge: 'bg-blue-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-900',
          badge: 'bg-gray-500'
        };
    }
  };

  const getStatusColor = (statusValue) => {
    switch (statusValue) {
      case 'open':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleUpdate = async () => {
    if (!complaint?.id) return;

    try {
      setIsProcessing(true);
      setError('');

      const updates = {
        status,
        action_taken: actionTaken.trim() || null
      };

      await updateComplaint(complaint.id, updates);

      toast.success('Complaint updated successfully');
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating complaint:', err);
      setError('Failed to update complaint. Please try again.');
      toast.error('Failed to update complaint');
    } finally {
      setIsProcessing(false);
    }
  };

  const hasChanges = status !== complaint?.status || actionTaken.trim() !== (complaint?.action_taken || '');

  if (!complaint) return null;

  const colors = getPriorityColor(complaint.priority);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complaint Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Priority & Status Header */}
        <div className={`p-4 rounded-xl border-2 ${colors.border} ${colors.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${colors.badge}`} />
              <div>
                <p className={`text-sm font-semibold uppercase ${colors.text}`}>
                  {complaint.priority} Priority
                </p>
                <p className="text-xs text-gray-600">
                  Reported {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border-2 ${getStatusColor(complaint.status)}`}>
              <span className="text-xs font-semibold uppercase">
                {complaint.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Order & Table Info */}
        {(complaint.orders?.order_number || complaint.table_number) && (
          <div className="flex items-center gap-4 text-sm text-gray-700">
            {complaint.orders?.order_number && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Order #{complaint.orders.order_number}</span>
              </div>
            )}
            {complaint.table_number && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Table {complaint.table_number}</span>
              </div>
            )}
          </div>
        )}

        {/* Issue Types */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Issue Types</span>
            </div>
          </label>
          <div className="flex flex-wrap gap-2">
            {complaint.issue_types?.map((type, index) => (
              <span
                key={index}
                className="px-3 py-1.5 text-sm font-medium bg-orange-50 text-orange-900 border-2 border-orange-300 rounded-lg"
              >
                {type.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Description</span>
            </div>
          </label>
          <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>
        </div>

        {/* Status Update */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              <span>Update Status</span>
            </div>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = status === option.value;
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  disabled={isProcessing}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `border-${option.color}-400 bg-${option.color}-50 shadow-sm`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    isSelected 
                      ? `text-${option.color}-600` 
                      : 'text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    isSelected 
                      ? `text-${option.color}-900` 
                      : 'text-gray-700'
                  }`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Taken */}
        <div className="space-y-2">
          <label htmlFor="actionTaken" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Action Taken</span>
            </div>
          </label>
          <textarea
            id="actionTaken"
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            placeholder="Describe the actions taken to resolve this issue..."
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-none transition-all"
            disabled={isProcessing}
            maxLength={500}
          />
          <div className="flex items-center justify-end">
            <span className="text-xs text-gray-500">
              {actionTaken.length}/500
            </span>
          </div>
        </div>

        {/* Metadata */}
        {complaint.resolved_at && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">
                Resolved on {format(new Date(complaint.resolved_at), 'MMM dd, yyyy')} at {format(new Date(complaint.resolved_at), 'h:mm a')}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={!hasChanges || isProcessing}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Update Complaint</span>
              </>
            )}
          </button>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-center text-gray-500">
          Created on {format(new Date(complaint.created_at), 'MMM dd, yyyy')} at {format(new Date(complaint.created_at), 'h:mm a')}
        </p>
      </div>
    </Modal>
  );
}
