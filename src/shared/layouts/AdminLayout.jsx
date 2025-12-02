import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabaseOwner } from '@shared/services/api/ownerApi';
import { useNotifications } from '@shared/contexts/useNotifications';
import {
  LayoutDashboard,
  Building2,
  Users,
  Download,
  FileText,
  HardDrive,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  User,
  CreditCard,
  Zap,
  Activity,
  Sparkles,
  ChevronRight,
  Settings,
  Search,
  Command,
} from 'lucide-react';

const ProfessionalSuperAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Real counts from database
  const [sidebarStats, setSidebarStats] = useState({
    restaurantCount: 0,
    pendingBillingCount: 0,
    activeCount: 0,
    monthlyRevenue: 0,
  });

  // Fetch real sidebar stats
  useEffect(() => {
    const fetchSidebarStats = async () => {
      try {
        // Get restaurant count
        const { count: restaurantCount } = await supabaseOwner
          .from('restaurants')
          .select('*', { count: 'exact', head: true });

        // Get active subscriptions count
        const { count: activeCount } = await supabaseOwner
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get pending/expiring subscriptions (grace period - next 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const { count: pendingCount } = await supabaseOwner
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .lte('end_date', sevenDaysFromNow.toISOString())
          .gte('end_date', new Date().toISOString());

        // Get this month's revenue
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        firstOfMonth.setHours(0, 0, 0, 0);
        const { data: payments } = await supabaseOwner
          .from('payments')
          .select('amount')
          .gte('created_at', firstOfMonth.toISOString())
          .eq('status', 'completed');

        const monthlyRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        setSidebarStats({
          restaurantCount: restaurantCount || 0,
          pendingBillingCount: pendingCount || 0,
          activeCount: activeCount || 0,
          monthlyRevenue,
        });
      } catch (error) {
        console.error('Error fetching sidebar stats:', error);
      }
    };

    fetchSidebarStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSidebarStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin', badge: null },
    { icon: Building2, label: 'Restaurants', path: '/superadmin/restaurants', badge: sidebarStats.restaurantCount > 0 ? String(sidebarStats.restaurantCount) : null },
    { icon: Users, label: 'Managers', path: '/superadmin/managers', badge: null },
    { icon: CreditCard, label: 'Billing', path: '/superadmin/billing', badge: sidebarStats.pendingBillingCount > 0 ? String(sidebarStats.pendingBillingCount) : null },
    { icon: Download, label: 'Data Export', path: '/superadmin/export', badge: null },
    { icon: FileText, label: 'Audit Logs', path: '/superadmin/audit', badge: null },
    { icon: HardDrive, label: 'Backups', path: '/superadmin/backups', badge: null },
  ];

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const isActive = (path) => {
    if (path === '/superadmin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Map notification types to display types
  const getNotificationType = (notification) => {
    const type = notification.type || notification.severity;
    if (type?.includes('expired') || type?.includes('overdue') || type === 'error') return 'warning';
    if (type?.includes('payment') || type?.includes('received')) return 'payment';
    if (type?.includes('restaurant') || type === 'success') return 'success';
    return 'info';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-slate-900/80 backdrop-blur-xl border-r border-white/10
          transition-all duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'w-20' : 'w-72'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
              </div>
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Praahis
                  </h1>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <p className="text-xs text-emerald-400 font-medium">SuperAdmin</p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Quick Stats (Collapsed view shows icons only) */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-white/10">
              <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl p-3 border border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">System Status</span>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Online</span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">{sidebarStats.activeCount}</div>
                    <div className="text-[10px] text-gray-500">Active</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-400">{sidebarStats.pendingBillingCount}</div>
                    <div className="text-[10px] text-gray-500">Pending</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-400">₹{sidebarStats.monthlyRevenue >= 100000 ? `${(sidebarStats.monthlyRevenue / 100000).toFixed(1)}L` : sidebarStats.monthlyRevenue.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-500">Revenue</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  title={sidebarCollapsed ? item.label : ''}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl
                    transition-all duration-200 group relative
                    ${active
                      ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-white shadow-lg shadow-emerald-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }
                  `}
                >
                  {/* Active indicator */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-r-full" />
                  )}
                  
                  <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : ''}`} />
                  </div>
                  
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-transform ${active ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-white/10 space-y-2">
            {!sidebarCollapsed && (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400 flex-1 text-left">Quick search...</span>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-gray-500">
                  <Command className="w-3 h-3" />K
                </div>
              </button>
            )}
            
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <Menu className="h-4 w-4" />
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="h-5 w-5 text-gray-400" />
              </button>
              
              {/* Breadcrumb / Page Title */}
              <div className="hidden sm:block">
                <h2 className="text-lg font-semibold text-white">
                  {navigationItems.find(item => isActive(item.path))?.label || 'Dashboard'}
                </h2>
                <p className="text-xs text-gray-500">
                  {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                  {' • '}
                  <span className="text-emerald-400 font-mono">
                    {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Live Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">Live</span>
              </div>

              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setProfileOpen(false);
                  }}
                  className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-96 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-20 overflow-hidden">
                      <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">Notifications</h3>
                          <p className="text-xs text-gray-500">{unreadCount} unread</p>
                        </div>
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">No notifications</p>
                            <p className="text-gray-500 text-xs mt-1">You're all caught up!</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notification) => {
                            const displayType = getNotificationType(notification);
                            return (
                              <div
                                key={notification.id}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  if (notification.action_url) {
                                    navigate(notification.action_url);
                                    setNotificationsOpen(false);
                                  }
                                }}
                                className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                                  !notification.read ? 'bg-emerald-500/5' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    displayType === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                    displayType === 'payment' ? 'bg-cyan-500/20 text-cyan-400' :
                                    displayType === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-blue-500/20 text-blue-400'
                                  }`}>
                                    {displayType === 'success' && <Building2 className="w-4 h-4" />}
                                    {displayType === 'payment' && <CreditCard className="w-4 h-4" />}
                                    {displayType === 'warning' && <Bell className="w-4 h-4" />}
                                    {displayType === 'info' && <HardDrive className="w-4 h-4" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {notification.title && (
                                      <p className="text-xs font-medium text-emerald-400 mb-0.5">{notification.title}</p>
                                    )}
                                    <p className="text-sm text-white">{notification.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {formatTimeAgo(notification.created_at)}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="p-3 text-center border-t border-white/10">
                        <button 
                          onClick={() => {
                            navigate('/superadmin/notifications');
                            setNotificationsOpen(false);
                          }}
                          className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-3 p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <div className="relative">
                    <div className="h-9 w-9 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-bold">SA</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-white">SuperAdmin</p>
                    <p className="text-xs text-gray-500">admin@praahis.com</p>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-20 overflow-hidden">
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold">SA</span>
                          </div>
                          <div>
                            <p className="font-medium text-white">SuperAdmin</p>
                            <p className="text-xs text-gray-500">admin@praahis.com</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => navigate('/superadmin/profile')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <User className="h-4 w-4" />
                          My Profile
                        </button>
                        <button
                          onClick={toggleDarkMode}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          {darkMode ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </button>
                      </div>
                      <div className="border-t border-white/10 p-2">
                        <button
                          onClick={async () => {
                            try {
                              await supabaseOwner.auth.signOut();
                              localStorage.removeItem('is_owner_session');
                              toast.success('Logged out successfully');
                              navigate('/superadmin-login', { replace: true });
                            } catch (error) {
                              console.error('[SuperAdmin] Logout error:', error);
                              toast.error('Failed to log out');
                            }
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1600px] mx-auto p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Command Palette / Search Modal */}
      {searchOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setSearchOpen(false)} />
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 p-4">
            <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search restaurants, managers, billing..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                  autoFocus
                />
                <kbd className="px-2 py-1 text-xs bg-white/10 text-gray-400 rounded">ESC</kbd>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Quick Actions</div>
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setSearchOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <div className="p-2 bg-white/5 rounded-lg">
                        <Icon className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="text-sm text-white">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfessionalSuperAdminLayout;
