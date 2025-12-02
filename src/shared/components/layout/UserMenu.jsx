import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { signOut } from '@features/auth/services/authService';
import toast from 'react-hot-toast';

/**
 * ManagerUserMenu Component
 * Dropdown menu for manager/admin user actions
 * Options: Settings, Sign Out
 */
const ManagerUserMenu = ({ profile }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Menu item component
  const MenuItem = ({ icon: Icon, children, onClick, variant = 'default' }) => {
    const variantClasses = {
      default: 'hover:bg-muted text-foreground',
      danger: 'hover:bg-destructive/10 text-destructive'
    };

    const IconComponent = Icon;

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
          setOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${variantClasses[variant]}`}
      >
        <IconComponent className="w-4 h-4" />
        <span>{children}</span>
      </button>
    );
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[ManagerUserMenu] signOut error:', error);
      toast.error('Failed to sign out');
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!profile?.full_name) return 'M';
    const names = profile.full_name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return profile.full_name[0].toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-card border border-border hover:bg-muted transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* Avatar */}
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
          {getInitials()}
        </div>

        {/* Name (hidden on mobile) */}
        <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
          {profile?.full_name || 'Manager'}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-card border border-border shadow-xl z-50 overflow-hidden">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile?.full_name || 'Manager'}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {profile?.email || ''}
            </p>
            {profile?.role && (
              <p className="text-[10px] text-muted-foreground uppercase mt-1 font-medium">
                {profile.role}
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <MenuItem
              icon={Settings}
              onClick={() => navigate('/manager/settings')}
            >
              Settings
            </MenuItem>
          </div>

          {/* Sign Out */}
          <div className="border-t border-border py-1">
            <MenuItem icon={LogOut} onClick={handleSignOut} variant="danger">
              Sign Out
            </MenuItem>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerUserMenu;
