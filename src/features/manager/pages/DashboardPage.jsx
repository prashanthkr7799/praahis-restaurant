import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  ShoppingCart, 
  ChefHat, 
  Users, 
  BarChart2,
  Plus,
  Store,
  Volume2,
  VolumeX,
  LogOut,
  Settings,
  User,
  Printer,
  ChevronDown
} from 'lucide-react';
import { RealtimeOrderProvider, useRealtimeOrders } from '@shared/contexts/RealtimeOrderContext';
import { useRestaurant } from '@shared/hooks/useRestaurant';
import { getCurrentUser, signOut } from '@features/auth/services/authService';
import notificationService from '@features/notifications/services/notificationService';
import OverviewTab from '../components/tabs/OverviewTab';
import OrdersTab from '../components/tabs/OrdersTab';
import TablesTab from '../components/tabs/TablesTab';
import KitchenTab from '../components/tabs/KitchenTab';
import StaffTab from '../components/tabs/StaffTab';
import CreateTakeawayOrderModal from '@features/orders/components/modals/CreateTakeawayOrderModal';
import toast from 'react-hot-toast';
import { supabase } from '@config/supabase';
import Modal from '@shared/components/ui/Modal';
import QRCode from 'qrcode';

const ManagerDashboardContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'overview';
  const { restaurantId, restaurantName, branding } = useRestaurant();
  const { refreshOrders, stats } = useRealtimeOrders();
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [paymentQRData, setPaymentQRData] = useState(null);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('manager_sound_enabled');
    return stored !== 'false';
  });

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { profile } = await getCurrentUser();
      if (profile) {
        setCurrentUser(profile);
      }
    };
    fetchUser();
  }, []);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  // Register audio unlock on mount
  useEffect(() => {
    notificationService.registerUserGestureUnlock();
  }, []);

  // Sound toggle
  const handleSoundToggle = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('manager_sound_enabled', String(newState));
    if (newState) {
      notificationService.playSound('success');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserMenu]);

  // Print receipt helper
  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      toast.error('Please allow popups to print receipts');
      return;
    }
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${order.order_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; padding: 10px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .restaurant-name { font-size: 16px; font-weight: bold; }
          .order-info { margin-bottom: 10px; }
          .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .totals { padding-top: 10px; }
          .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          @media print { body { width: 72mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">${restaurantName || 'Restaurant'}</div>
          <div>Order #${order.order_number}</div>
          <div>${new Date(order.created_at).toLocaleString()}</div>
        </div>
        <div class="order-info">
          <div>Type: ${order.order_type === 'takeaway' ? 'Takeaway' : 'Dine-in'}</div>
          ${order.table_number ? `<div>Table: ${order.table_number}</div>` : ''}
          ${order.customer_name ? `<div>Customer: ${order.customer_name}</div>` : ''}
        </div>
        <div class="items">
          ${(order.items || []).map(item => `
            <div class="item">
              <span>${item.quantity || 1}x ${item.name}</span>
              <span>₹${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span>₹${(order.subtotal || 0).toFixed(2)}</span></div>
          ${order.discount ? `<div class="total-row"><span>Discount</span><span>-₹${order.discount.toFixed(2)}</span></div>` : ''}
          <div class="total-row"><span>Tax</span><span>₹${(order.tax || 0).toFixed(2)}</span></div>
          <div class="total-row grand-total"><span>TOTAL</span><span>₹${(order.total || 0).toFixed(2)}</span></div>
        </div>
        <div class="footer">
          <div>Thank you for your order!</div>
          <div>Powered by Praahis</div>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'tables', label: 'Tables', icon: LayoutGrid },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
    { id: 'staff', label: 'Staff', icon: Users },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab onTabChange={handleTabChange} onPrintReceipt={handlePrintReceipt} />;
      case 'orders':
        return <OrdersTab onPrintReceipt={handlePrintReceipt} />;
      case 'tables':
        return <TablesTab restaurantId={restaurantId} />;
      case 'kitchen':
        return <KitchenTab />;
      case 'staff':
        return <StaffTab />;
      default:
        return <OverviewTab onTabChange={handleTabChange} onPrintReceipt={handlePrintReceipt} />;
    }
  };

  // Get user initials
  const getUserInitials = () => {
    if (!currentUser?.full_name) return 'M';
    const names = currentUser.full_name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 md:pb-0">
      {/* Clean Header */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand */}
            <div className="flex items-center gap-3">
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt={restaurantName} className="h-9 w-9 rounded-xl object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold text-white">{restaurantName || 'Restaurant'}</h1>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-emerald-400 font-medium">Live</span>
                  {stats && (
                    <span className="text-[10px] text-zinc-500 ml-2">{stats.todayOrders || 0} orders</span>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Tabs (Desktop) */}
            <nav className="hidden md:flex items-center bg-white/5 rounded-lg p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2
                      ${isActive 
                        ? 'bg-white/10 text-white' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                onClick={handleSoundToggle}
                className={`p-2 rounded-lg transition-all ${
                  soundEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
                title={soundEnabled ? 'Mute' : 'Unmute'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* New Order Button */}
              <button
                onClick={() => setShowCreateOrderModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Order</span>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-lg hover:bg-white/5 transition-all"
                >
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {getUserInitials()}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium text-white truncate max-w-[120px]">
                      {currentUser?.full_name || 'Manager'}
                    </div>
                    <div className="text-[10px] text-zinc-500 capitalize">{currentUser?.role || 'manager'}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-slate-900 shadow-xl py-1 z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="text-sm font-medium text-white">{currentUser?.full_name || 'Manager'}</div>
                      <div className="text-xs text-zinc-500">{currentUser?.email}</div>
                    </div>
                    <Link 
                      to="/manager/settings" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <Link 
                      to="/manager/subscription" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Subscription</span>
                    </Link>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden pb-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all
                      ${isActive 
                        ? 'bg-violet-600 text-white' 
                        : 'text-zinc-400 bg-white/5'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {renderTabContent()}
      </main>

      {/* Modals */}
      {showCreateOrderModal && (
          <CreateTakeawayOrderModal
            isOpen={showCreateOrderModal}
            onClose={() => setShowCreateOrderModal(false)}
            onCreate={async (rawData) => {
              try {
                if (!restaurantId) {
                  toast.error('Missing restaurant context');
                  return;
                }

                // Map UI methods to DB-allowed values (check constraint): 'cash' or 'razorpay'
                const paymentMethod = rawData.payment_method === 'counter' ? 'cash' : 'razorpay';
                const { generateOrderNumber, generateOrderToken, calculateTax, calculateTotal } = await import('@features/orders/utils/orderHelpers');
                const order_number = generateOrderNumber();
                const order_token = generateOrderToken();
                const customer = rawData.customer || {};
                const subtotal = rawData.subtotal ?? rawData.items.reduce((s, i) => s + (i.price * i.qty), 0);
                const discountAmount = rawData.discount?.amount || 0;
                const tax = rawData.tax ?? calculateTax(subtotal - discountAmount);
                const total = rawData.total ?? calculateTotal(subtotal - discountAmount, tax, 0);
                const isOnline = paymentMethod === 'razorpay';
                // Always start as pending_payment until payment is confirmed
                const order_status = 'pending_payment';
                const payment_status = 'pending';
                const items = rawData.items.map(it => ({
                  menu_item_id: it.item_id || it.itemId || it.menu_item_id || null,
                  name: it.name,
                  price: it.price,
                  quantity: it.qty || it.quantity || 1,
                  is_veg: it.is_veg || it.isVeg || false,
                  item_status: isOnline ? 'queued' : 'received'
                }));

                const insertPayload = {
                  restaurant_id: restaurantId,
                  order_type: rawData.order_type,
                  order_number,
                  order_token,
                  items,
                  subtotal,
                  discount: discountAmount,
                  tax,
                  total,
                  payment_method: paymentMethod,
                  payment_status,
                  order_status,
                  special_instructions: rawData.special_instructions || null,
                  customer_name: customer.name || null,
                  customer_phone: customer.phone || null,
                  customer_email: customer.email || null,
                  // customer_address column may not exist; omit to avoid schema errors
                  created_at: new Date().toISOString(),
                };

                const { data, error } = await supabase
                  .from('orders')
                  .insert([insertPayload])
                  .select('id,restaurant_id,order_type,order_number,order_token,items,subtotal,discount,tax,total,payment_method,payment_status,order_status,special_instructions,customer_name,customer_phone,customer_email,created_at');
                if (error) throw error;
                const created = Array.isArray(data) ? data[0] : data;

                if (isOnline) {
                  const payUrl = `${window.location.origin}/payment/${created.id}`;
                  try {
                    const qr = await QRCode.toDataURL(payUrl, { width: 320, margin: 2 });
                    setPaymentQRData({ qr, payUrl });
                  } catch (qrErr) {
                    console.error('QR generation failed', qrErr);
                    setPaymentQRData({ qr: null, payUrl });
                  }
                  setPendingPaymentOrder(created);
                  setShowPaymentQR(true);
                  toast('Scan to pay using the QR code', { icon: '💳' });
                } else {
                  // For cash, keep it pending until manager confirms payment
                  refreshOrders();
                  // Navigate to Orders tab and preselect pending filter so manager sees it
                  setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.set('tab', 'orders');
                    next.set('ordersFilter', 'pending');
                    return next;
                  });
                  setShowCreateOrderModal(false);
                  toast.success(`Order ${created.order_number} created • awaiting cash confirmation`);
                }
              } catch (err) {
                console.error('Error creating takeaway order:', err);
                toast.error(err.message || 'Failed to create order');
              }
            }}
          />
        )}

        {showPaymentQR && (
          <Modal
            isOpen={showPaymentQR}
            onClose={() => { setShowPaymentQR(false); setPendingPaymentOrder(null); setPaymentQRData(null); refreshOrders(); }}
            title="Scan & Pay"
            size="sm"
          >
            <div className="flex flex-col items-center gap-4 py-4 text-white">
              <p className="text-sm text-zinc-400 text-center">Customer can scan this QR to complete payment. Order will appear after payment succeeds.</p>
              {paymentQRData?.qr ? (
                <img src={paymentQRData.qr} alt="Payment QR" className="w-64 h-64 bg-white p-2 rounded-lg" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center border border-dashed border-white/20 rounded-lg text-xs text-zinc-500">QR unavailable</div>
              )}
              {paymentQRData?.payUrl && (
                <div className="w-full flex flex-col gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(paymentQRData.payUrl); toast.success('Payment link copied'); }}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
                  >Copy Link</button>
                  <a
                    href={paymentQRData.payUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-bold text-center hover:bg-white/20 transition-colors"
                  >Open Payment Page</a>
                </div>
              )}
              {pendingPaymentOrder && (
                <div className="text-xs text-zinc-500 mt-2">Order #{pendingPaymentOrder.order_number} • Status: Pending Payment</div>
              )}
            </div>
          </Modal>
        )}

        {/* Mobile FAB for Create Order */}
        <button
          onClick={() => setShowCreateOrderModal(true)}
          className="md:hidden fixed bottom-24 right-4 h-14 w-14 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-full shadow-xl shadow-violet-500/40 flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-all ring-2 ring-violet-400/20"
        >
          <Plus className="w-7 h-7" />
        </button>
    </div>
  );
};

const ManagerDashboard = () => {
  return (
    <RealtimeOrderProvider>
      <ManagerDashboardContent />
    </RealtimeOrderProvider>
  );
};

export default ManagerDashboard;
