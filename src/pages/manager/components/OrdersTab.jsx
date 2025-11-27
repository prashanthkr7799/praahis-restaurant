import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  X, 
  Filter, 
  Plus, 
  Utensils, 
  ShoppingBag,
  Calendar,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import OrderCard from '@domains/ordering/components/OrderCard';
import { CreateTakeawayOrderModal } from '@domains/ordering/components/modals/CreateTakeawayOrderModal';
import Modal from '@shared/components/compounds/Modal';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { formatCurrency } from '@shared/utils/helpers/formatters';

const OrdersTab = () => {
  const { restaurantId } = useRestaurant();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTakeawayModal, setShowTakeawayModal] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [paymentQRData, setPaymentQRData] = useState(null);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState(null);
  
  // Date Filters
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0], // Today
    end: new Date().toISOString().split('T')[0]   // Today
  });
  
  // Advanced Filters
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed, cancelled, pending
  const [filterType, setFilterType] = useState('all'); // all, dine_in, takeaway

  // Stats for the current view
  const [viewStats, setViewStats] = useState({ count: 0, revenue: 0 });

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          tables (table_number),
          items:order_items (*)
        `)
        .eq('restaurant_id', restaurantId)
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`)
        .order('created_at', { ascending: false });

      // IMPORTANT: Always exclude pending_payment orders that haven't been paid yet
      // These are orders where customer clicked "Proceed to Payment" but hasn't completed payment
      // They should only appear after payment is completed (payment_status = 'paid')
      // or if customer selected cash payment (payment_method = 'cash')
      
      if (filterStatus !== 'all') {
        if (filterStatus === 'completed') {
          query = query.in('order_status', ['served', 'completed']);
        } else if (filterStatus === 'cancelled') {
          query = query.eq('order_status', 'cancelled');
        } else if (filterStatus === 'active') {
          // Only show active orders that are actually in progress (not pending payment)
          query = query.in('order_status', ['received', 'preparing', 'ready']);
        } else if (filterStatus === 'pending') {
          // Show orders awaiting payment confirmation
          query = query.eq('order_status', 'pending_payment');
        }
      } else {
        // For 'all' filter, exclude pending_payment orders unless they have cash payment method
        query = query.neq('order_status', 'pending_payment');
      }

      if (filterType !== 'all') {
        query = query.eq('order_type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
      updateStats(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, dateRange, filterStatus, filterType]);

  // Load orders based on filters
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Initialize filter from URL param (e.g. ordersFilter=pending)
  useEffect(() => {
    const initialFilter = searchParams.get('ordersFilter');
    if (initialFilter && ['all','active','pending','completed','cancelled'].includes(initialFilter)) {
      setFilterStatus(initialFilter);
    }
  }, [searchParams]);

  // Search filtering (client-side for now for speed on fetched set)
  useEffect(() => {
    if (!searchQuery) {
      updateStats(orders);
      return;
    }
    // We don't update 'orders' state to avoid losing data, we just derive view
    // But for simplicity in this redesign, let's just filter the display
  }, [searchQuery, orders]);

  const updateStats = (data) => {
    const revenue = data.reduce((sum, o) => {
      return o.order_status !== 'cancelled' ? sum + (o.total_amount || 0) : sum;
    }, 0);
    setViewStats({ count: data.length, revenue });
  };

  // Pending payments count for quick access
  const pendingCount = orders.filter(o => o.order_status === 'pending_payment').length;

  // Derived orders for display (including search)
  const displayOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(lowerQ) ||
      o.customer_name?.toLowerCase().includes(lowerQ) ||
      o.tables?.table_number?.toString().includes(lowerQ)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      {/* Header & Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Title & Date Picker */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Order History
            </h2>
            
            <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-xs sm:text-sm text-white border-none focus:ring-0 px-2 py-1 w-32 cursor-pointer"
              />
              <span className="text-zinc-500">-</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-xs sm:text-sm text-white border-none focus:ring-0 px-2 py-1 w-32 cursor-pointer"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Quick Pending Payments Button */}
            <button 
              onClick={() => setFilterStatus('pending')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl font-bold text-sm transition-all border border-amber-500/30"
              title="Show orders awaiting payment confirmation"
            >
              <ChevronDown className="w-4 h-4" />
              Pending Payments
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded bg-amber-500/20 border border-amber-500/40">{pendingCount}</span>
              )}
            </button>
            
            <button 
              onClick={() => setShowTakeawayModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Order</span>
            </button>
          </div>
        </div>

        {/* Filters & Stats Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
            {['all', 'active', 'pending', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border ${
                  filterStatus === status 
                    ? 'bg-white/10 text-white border-white/20' 
                    : 'text-zinc-500 border-transparent hover:bg-white/5 hover:text-zinc-300'
                }`}
              >
                {status}
              </button>
            ))}
            <div className="w-px h-6 bg-white/10 mx-2" />
            {['all', 'dine_in', 'takeaway'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border ${
                  filterType === type 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'text-zinc-500 border-transparent hover:bg-white/5 hover:text-zinc-300'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-zinc-400 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
            <span>Orders: <span className="text-white font-mono">{viewStats.count}</span></span>
            <span className="w-px h-3 bg-white/10" />
            <span>Revenue: <span className="text-emerald-400 font-mono">{formatCurrency(viewStats.revenue)}</span></span>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-2 opacity-50" />
            <p className="text-sm">Loading history...</p>
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm font-medium">No orders found</p>
            <p className="text-xs mt-1 opacity-50">Try adjusting your filters or date range</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            {displayOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={{
                  ...order,
                  items: order.items || [],
                  status: order.order_status,
                  table_number: order.tables?.table_number || order.table_number,
                  subtotal: order.subtotal,
                  tax_amount: order.tax_amount,
                  total_amount: order.total,
                }}
                compact={true}
                onPaymentComplete={() => fetchOrders()}
                onOrderUpdate={() => fetchOrders()}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTakeawayOrderModal 
        isOpen={showTakeawayModal} 
        onClose={() => setShowTakeawayModal(false)}
        onCreate={async (rawData) => {
          try {
            if (!restaurantId) {
              toast.error('Missing restaurant context');
              return;
            }

            // Map payment method for storage (counter -> cash)
            // Map UI methods to DB-allowed values (check constraint): 'cash' or 'razorpay'
            const paymentMethod = rawData.payment_method === 'counter' ? 'cash' : 'razorpay';

            // Generate order number & token helpers
            const { generateOrderNumber, generateOrderToken, calculateTax, calculateTotal } = await import('@domains/ordering/utils/orderHelpers.js');
            const order_number = generateOrderNumber();
            const order_token = generateOrderToken();

            // Flatten customer details
            const customer = rawData.customer || {};

            // Calculate (recalculate defensively)
            const subtotal = rawData.subtotal ?? rawData.items.reduce((s, i) => s + (i.price * i.qty), 0);
            const discountAmount = rawData.discount?.amount || 0;
            const tax = rawData.tax ?? calculateTax(subtotal - discountAmount);
            const total = rawData.total ?? calculateTotal(subtotal - discountAmount, tax, 0);

            // Determine initial statuses
            const isOnline = paymentMethod === 'razorpay';
            // Always start as pending_payment until payment is confirmed
            const order_status = 'pending_payment';
            const payment_status = 'pending';

            // Normalize items for storage (use consistent keys)
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
              // Generate QR for payment URL
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
              // Keep original modal closed per requirement (only close for counter). We already closed in child if counter.
              toast('Scan to pay using the QR code', { icon: '💳' });
            } else {
              // Refresh orders list so new order appears immediately
              fetchOrders();
              // Switch to Orders tab and pending view via URL params so it's consistent
              setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set('tab', 'orders');
                next.set('ordersFilter', 'pending');
                return next;
              });
              setFilterStatus('pending');
              setShowTakeawayModal(false);
              toast.success(`Order ${created.order_number} created • awaiting cash confirmation`);
            }
          } catch (err) {
            console.error('Error creating takeaway order:', err);
            toast.error(err.message || 'Failed to create order');
          }
        }}
      />

      {/* Payment QR Modal */}
      {showPaymentQR && (
        <Modal
          isOpen={showPaymentQR}
          onClose={() => { setShowPaymentQR(false); setPendingPaymentOrder(null); setPaymentQRData(null); fetchOrders(); }}
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
    </div>
  );
};

export default OrdersTab;
