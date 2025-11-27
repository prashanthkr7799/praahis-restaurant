import React, { useState } from 'react';
import { X, Send, AlertCircle, Clock, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * StaffMessageModal Component
 * Send messages to individual staff members via notifications table
 */
const StaffMessageModal = ({ isOpen, onClose, staff, onSend, restaurantId }) => {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [sending, setSending] = useState(false);

  const quickMessages = [
    'Come to counter',
    'Order ready for delivery',
    'Need assistance at table',
    'Break time - cover needed',
  ];

  const handleQuickMessage = (msg) => {
    setMessage(msg);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      await onSend?.({
        staff,
        message: message.trim(),
        priority,
        restaurantId,
      });
      
      toast.success(`Message sent to ${staff.full_name || staff.name}`);
      setMessage('');
      setPriority('medium');
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getPriorityColor = (p) => {
    if (p === 'high') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (p === 'low') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  };

  const getPriorityIcon = (p) => {
    if (p === 'high') return AlertCircle;
    if (p === 'low') return Clock;
    return Bell;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl border border-white/10 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Send Message</h2>
            <p className="text-sm text-zinc-400 mt-1">
              To: {staff?.full_name || staff?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            disabled={sending}
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Quick Messages */}
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-3">
              Quick Messages
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickMessages.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickMessage(msg)}
                  className="text-left text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-zinc-300 transition-all"
                  disabled={sending}
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">
              Custom Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 resize-none"
              disabled={sending}
            />
          </div>

          {/* Priority Selector */}
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-3">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map((p) => {
                const Icon = getPriorityIcon(p);
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                      isSelected
                        ? getPriorityColor(p)
                        : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/20'
                    }`}
                    disabled={sending}
                  >
                    <Icon className="w-4 h-4" />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-white transition-colors"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-hover rounded-xl font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffMessageModal;
