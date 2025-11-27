import { useState, useEffect } from 'react';
import { AlertTriangle, FileText, Flag, AlertCircle, CheckSquare, Square } from 'lucide-react';
import Modal from '@shared/components/compounds/Modal';

/**
 * IssueReportModal Component
 * 
 * Modal for reporting issues with orders.
 * Allows staff to document problems and set priority levels.
 * Supports multiple issue types via checkboxes.
 * 
 * @param {Object} props
 * @param {Object} props.order - Order object
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSubmit - Submit callback with issue data
 */
export function IssueReportModal({ order, isOpen, onClose, onSubmit }) {
  const [issueTypes, setIssueTypes] = useState([]);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [actionTaken, setActionTaken] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Issue type options (checkbox list)
  const issueTypeOptions = [
    { value: 'food_quality', label: 'Food Quality', icon: '👎' },
    { value: 'wrong_item', label: 'Wrong Item', icon: '🍽️' },
    { value: 'wait_time', label: 'Wait Time', icon: '⏰' },
    { value: 'service', label: 'Service', icon: '�' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'blue', description: 'Minor issue, no rush' },
    { value: 'medium', label: 'Medium', color: 'amber', description: 'Needs attention' },
    { value: 'high', label: 'High', color: 'red', description: 'Urgent resolution required' }
  ];

  // Toggle issue type checkbox
  const toggleIssueType = (value) => {
    setIssueTypes(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIssueTypes([]);
      setDescription('');
      setPriority('medium');
      setActionTaken('');
      setError('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Real-time validation
  useEffect(() => {
    if (issueTypes.length === 0 && !description) {
      setError('');
      return;
    }

    if (issueTypes.length > 0 && !description) {
      setError('Please provide a description of the issue');
      return;
    }

    if (description && description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setError('');
  }, [issueTypes, description]);

  const validateIssue = () => {
    if (issueTypes.length === 0) {
      return 'Please select at least one issue type';
    }

    if (!description || description.trim().length === 0) {
      return 'Please provide a description';
    }

    if (description.trim().length < 10) {
      return 'Description must be at least 10 characters';
    }

    if (!priority) {
      return 'Please select a priority level';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateIssue();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Return issue data
      onSubmit({
        orderId: order?.id,
        issueTypes: issueTypes,
        description: description.trim(),
        priority,
        actionTaken: actionTaken.trim() || null,
        reportedAt: new Date().toISOString()
      });

      onClose();
    } catch (err) {
      console.error('Error submitting issue report:', err);
      setError('Failed to submit issue report. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValid = !validateIssue();

  const getPriorityColorClasses = (priorityValue) => {
    switch (priorityValue) {
      case 'low':
        return {
          border: 'border-blue-300',
          bg: 'bg-blue-50',
          text: 'text-blue-900',
          ring: 'ring-blue-400',
          button: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'medium':
        return {
          border: 'border-amber-300',
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          ring: 'ring-amber-400',
          button: 'bg-amber-500 hover:bg-amber-600'
        };
      case 'high':
        return {
          border: 'border-red-300',
          bg: 'bg-red-50',
          text: 'text-red-900',
          ring: 'ring-red-400',
          button: 'bg-red-500 hover:bg-red-600'
        };
      default:
        return {
          border: 'border-gray-300',
          bg: 'bg-gray-50',
          text: 'text-gray-900',
          ring: 'ring-gray-400',
          button: 'bg-gray-500 hover:bg-gray-600'
        };
    }
  };

  const selectedPriority = priorityOptions.find(p => p.value === priority);
  const colorClasses = getPriorityColorClasses(priority);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Issue"
      size="lg"
    >
      <div className="space-y-6">
        {/* Order Info Banner */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  Order #{order?.id || 'N/A'}
                </p>
                <p className="text-xs text-orange-700">
                  Report an issue to improve service quality
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Issue Type Checkboxes */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Issue Type(s) *</span>
            </div>
          </label>
          <div className="space-y-2">
            {issueTypeOptions.map((type) => {
              const isChecked = issueTypes.includes(type.value);
              
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleIssueType(type.value)}
                  disabled={isProcessing}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    isChecked
                      ? 'bg-orange-50 border-orange-300 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-lg">{type.icon}</span>
                  <span className={`text-sm font-medium ${
                    isChecked ? 'text-orange-900' : 'text-gray-700'
                  }`}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
          {issueTypes.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {issueTypes.length} issue{issueTypes.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Description Textarea */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Description *</span>
            </div>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please describe the issue in detail. Include what happened, when it occurred, and any relevant information..."
            rows={5}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-none transition-all"
            disabled={isProcessing}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${
              description.trim().length < 10 
                ? 'text-amber-600 font-medium' 
                : 'text-gray-500'
            }`}>
              {description.trim().length < 10 
                ? `${10 - description.trim().length} more characters required`
                : 'Minimum length met'
              }
            </span>
            <span className="text-xs text-gray-500">
              {description.length}/500
            </span>
          </div>
        </div>

        {/* Action Taken Textarea */}
        <div className="space-y-2">
          <label htmlFor="actionTaken" className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Action Taken (Optional)</span>
            </div>
          </label>
          <textarea
            id="actionTaken"
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            placeholder="Describe any immediate actions taken to address the issue..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-none transition-all"
            disabled={isProcessing}
            maxLength={300}
          />
          <div className="flex items-center justify-end">
            <span className="text-xs text-gray-500">
              {actionTaken.length}/300
            </span>
          </div>
        </div>

        {/* Priority Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              <span>Priority Level *</span>
            </div>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {priorityOptions.map((option) => {
              const isSelected = priority === option.value;
              const colors = getPriorityColorClasses(option.value);
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`relative flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `${colors.bg} ${colors.border} shadow-lg ring-2 ${colors.ring}`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isProcessing}
                >
                  <Flag className={`w-6 h-6 ${
                    isSelected ? colors.text : 'text-gray-400'
                  }`} />
                  <div className="text-center">
                    <div className={`text-sm font-semibold ${
                      isSelected ? colors.text : 'text-gray-600'
                    }`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                      option.color === 'blue' ? 'bg-blue-500' :
                      option.color === 'amber' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Info Card */}
        {priority && (
          <div className={`p-4 rounded-xl border-2 ${colorClasses.border} ${colorClasses.bg}`}>
            <div className="flex items-start gap-3">
              <Flag className={`w-5 h-5 ${colorClasses.text} flex-shrink-0 mt-0.5`} />
              <div>
                <p className={`text-sm font-semibold ${colorClasses.text}`}>
                  {selectedPriority?.label} Priority Selected
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedPriority?.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isProcessing}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 ${
              colorClasses.button
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Submit Issue Report</span>
              </>
            )}
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-center text-gray-500">
          All reports are logged for quality improvement and follow-up
        </p>
      </div>
    </Modal>
  );
}
