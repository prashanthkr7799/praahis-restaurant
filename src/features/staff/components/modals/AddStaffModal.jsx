/**
 * AddStaffModal - Add new staff member
 * Modal wrapper for StaffForm component
 */

import React from 'react';
import { X, UserPlus } from 'lucide-react';
import StaffForm from '@features/staff/components/StaffForm';

const AddStaffModal = ({ isOpen, onClose, onStaffAdded }) => {
  const handleSuccess = (newStaff) => {
    if (onStaffAdded) {
      onStaffAdded(newStaff);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel rounded-2xl p-6 border border-white/10 max-w-2xl w-full relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Add Staff Member</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Create a new staff account with role and permissions
          </p>
        </div>

        {/* Staff Form */}
        <StaffForm
          staff={null}
          onSuccess={handleSuccess}
          onCancel={onClose}
          allowedRoles={['chef', 'waiter', 'staff']}
        />
      </div>
    </div>
  );
};

export default AddStaffModal;
