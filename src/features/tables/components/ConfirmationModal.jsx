import React from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * ConfirmationModal Component
 * Generic confirmation dialog for destructive or important actions
 * 
 * Props:
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Handler to close modal
 * @param {Function} onConfirm - Handler when confirmed
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Confirm button text (default: "Confirm")
 * @param {string} cancelText - Cancel button text (default: "Cancel")
 * @param {string} variant - 'danger' or 'success' (default: 'danger')
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const iconColor = isDanger ? 'text-rose-400' : 'text-emerald-400';
  const iconBg = isDanger ? 'bg-rose-500/20' : 'bg-emerald-500/20';
  const buttonColor = isDanger 
    ? 'bg-rose-500 hover:bg-rose-600' 
    : 'bg-emerald-500 hover:bg-emerald-600';

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="glass-panel rounded-2xl border border-white/10 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${iconBg}`}>
              {isDanger ? (
                <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
              ) : (
                <CheckCircle className={`h-5 w-5 ${iconColor}`} />
              )}
            </div>
            <h2 className="text-xl font-bold text-white">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Close confirmation dialog"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-zinc-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-white transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-3 ${buttonColor} rounded-xl font-bold text-white transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
