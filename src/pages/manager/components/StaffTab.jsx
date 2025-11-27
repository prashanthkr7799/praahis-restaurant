import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  Plus,
  Radio
} from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { useRealtimeOrders } from '@/shared/context/RealtimeOrderContext';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import StaffCard from '@domains/staff/components/StaffCard';
import ComplaintsPanel from '@domains/complaints/components/ComplaintsPanel';
import StaffMessageModal from '@domains/staff/components/modals/StaffMessageModal';
import BroadcastMessageModal from '@domains/staff/components/modals/BroadcastMessageModal';
import StaffActivityModal from '@domains/staff/components/modals/StaffActivityModal';
import AddStaffModal from '@domains/staff/components/modals/AddStaffModal';
import toast from 'react-hot-toast';

const StaffTab = () => {
  const { staff, feedbacks, refreshStaff, loading } = useRealtimeOrders();
  const { restaurantId } = useRestaurant();

  // Local state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showStaffMessageModal, setShowStaffMessageModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // Handlers
  const handleStaffMessage = (member) => {
    setSelectedStaff(member);
    setShowStaffMessageModal(true);
  };

  const handleStaffCall = async (member) => {
    try {
      // Send notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          restaurant_id: restaurantId,
          user_id: member.id,
          type: 'alert',
          title: 'Manager Calling',
          body: 'Please report to the manager station immediately.',
          data: { priority: 'high', type: 'staff_call' }
        });

      if (error) throw error;
      toast.success(`Called ${member.full_name || member.name || 'staff member'}`);
    } catch (error) {
      console.error('Error calling staff:', error);
      toast.error('Failed to call staff member');
    }
  };

  const handleViewActivity = (member) => {
    setSelectedStaff(member);
    setShowActivityModal(true);
  };

  const handleStaffAdded = () => {
    refreshStaff();
    setShowAddStaffModal(false);
    toast.success('Staff member added successfully');
  };

  const handleSendMessage = async (messageData) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          restaurant_id: restaurantId,
          user_id: selectedStaff.id,
          type: 'message',
          title: 'Message from Manager',
          body: messageData.message,
          data: { priority: messageData.priority, type: 'direct_message' }
        });

      if (error) throw error;
      toast.success('Message sent successfully');
      setShowStaffMessageModal(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleBroadcast = async ({ message, priority, roles, restaurantId: rid }) => {
    try {
      // Get staff members based on roles
      let targetStaff = staff;
      if (!roles.includes('all')) {
        targetStaff = staff.filter((member) =>
          roles.some((role) => member.role.toLowerCase().includes(role.toLowerCase()))
        );
      }

      // Create notifications for all target staff
      const notifications = targetStaff.map((member) => ({
        restaurant_id: rid || restaurantId,
        user_id: member.id,
        type: 'staff',
        title: 'Broadcast Message',
        body: message,
        data: { priority, broadcast: true },
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      // Also send via Realtime Broadcast for immediate delivery
      const channel = supabase.channel(`broadcast:${rid || restaurantId}`);
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'announcement',
            payload: { 
              message, 
              priority, 
              roles, 
              from: 'Manager',
              created_at: new Date().toISOString() 
            },
          });
          supabase.removeChannel(channel);
        }
      });

      toast.success('Broadcast sent successfully');
      setShowBroadcastModal(false);
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('Failed to send broadcast');
    }
  };

  return (
    <div className="space-y-6">
      {/* Staff Header & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Staff Management</h2>
            <p className="text-sm text-zinc-400">{staff.length} active members</p>
          </div>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex-1 sm:flex-none glass-button px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">Broadcast</span>
          </button>
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="flex-1 sm:flex-none glass-button-primary px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Staff</span>
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="glass-panel h-48 rounded-xl animate-pulse"></div>
          ))
        ) : (
          staff.map(member => (
            <StaffCard
              key={member.id}
              staff={member}
              onMessage={() => handleStaffMessage(member)}
              onCall={() => handleStaffCall(member)}
              onViewActivity={() => handleViewActivity(member)}
            />
          ))
        )}
      </div>

      {/* Complaints/Feedback Panel */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-zinc-400" />
          Recent Feedback & Complaints
        </h3>
        <ComplaintsPanel feedbacks={feedbacks} />
      </div>

      {/* Modals */}
      {showStaffMessageModal && selectedStaff && (
        <StaffMessageModal
          isOpen={showStaffMessageModal}
          onClose={() => setShowStaffMessageModal(false)}
          staffMember={selectedStaff}
          onSend={handleSendMessage}
        />
      )}

      {showBroadcastModal && (
        <BroadcastMessageModal
          isOpen={showBroadcastModal}
          onClose={() => setShowBroadcastModal(false)}
          onSend={handleBroadcast}
          restaurantId={restaurantId}
        />
      )}

      {showActivityModal && selectedStaff && (
        <StaffActivityModal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          staffMember={selectedStaff}
        />
      )}

      {showAddStaffModal && (
        <AddStaffModal
          isOpen={showAddStaffModal}
          onClose={() => setShowAddStaffModal(false)}
          onAdd={handleStaffAdded}
        />
      )}
    </div>
  );
};

export default StaffTab;
