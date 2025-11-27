import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Search, X, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTable, getMenuItems, createOrder, markTableOccupied, supabase, getOrCreateActiveSessionId, getSharedCart, updateSharedCart, clearSharedCart, subscribeToSharedCart } from '@shared/utils/api/supabaseClient';
import { startSessionTracking, stopSessionTracking } from '@/shared/utils/helpers/sessionActivityTracker';
import { groupByCategory, getCategories, prepareOrderData } from '@domains/ordering/utils/orderHelpers';
import MenuItem from '@domains/ordering/components/MenuItem';
import MenuItemSkeleton from '@domains/ordering/components/MenuItemSkeleton';
import CategoryTabs from '@domains/ordering/components/CategoryTabs';
import CartSummary from '@domains/ordering/components/CartSummary';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import ErrorMessage from '@shared/components/feedback/ErrorMessage';
import CallWaiterButton from '@domains/ordering/components/CallWaiterButton';
import { useRestaurant } from '@/shared/hooks/useRestaurant';

const TablePage = () => {
  const { id: tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantSlug, setRestaurantBySlug } = useRestaurant();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [orderPaid, setOrderPaid] = useState(false); // Track if order is paid
  const [paidOrderId, setPaidOrderId] = useState(null); // Store paid order ID
  const isUpdatingFromRemote = useRef(false);

  // Load initial data and mark table as occupied
  // Ensure RestaurantContext is set from ?restaurant=slug before loading
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const slug = params.get('restaurant');
    if (slug && slug !== restaurantSlug) {
      setRestaurantBySlug(slug).catch(() => {});
    }
  }, [location.search, restaurantSlug, setRestaurantBySlug]);

  useEffect(() => {
    // Customer pages don't need restaurant context - load data directly
    
    // Guard: Check if tableId is valid
    if (!tableId || tableId === 'undefined') {
      console.error('❌ Invalid table ID:', tableId);
      setError('Invalid table ID. Please scan a valid QR code.');
      setLoading(false);
      return;
    }
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);



  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get restaurant slug from URL query params
      const params = new URLSearchParams(location.search);
      const restaurantSlug = params.get('restaurant');
      
      // Fetch table data
      const tableData = await getTable(tableId, restaurantSlug);
      
      if (!tableData || !tableData.restaurant_id) {
        throw new Error('Invalid table data - no restaurant_id found');
      }

      // Fetch menu items for the restaurant
      const menuData = await getMenuItems(tableData.restaurant_id);

      setTable(tableData);
      setMenuItems(menuData || []);

      // Mark table as occupied and get/create session - 100% DATABASE-DRIVEN
      // All devices scanning the same table will get the SAME session ID from the database
      const tableWithSession = await markTableOccupied(tableData.id);
      
      // Get session ID from database only - NO localStorage
      let currentSessionId = tableWithSession?.session_id;
      
      // If no session from markTableOccupied, explicitly fetch/create one
      if (!currentSessionId) {
        currentSessionId = await getOrCreateActiveSessionId(tableData.id);
      }

      setSessionId(currentSessionId);

      // Check if there's already a paid order for this session
      if (currentSessionId) {
        try {
          const { data: existingOrders, error: orderError } = await supabase
            .from('orders')
            .select('id, payment_status, order_status')
            .eq('session_id', currentSessionId)
            .eq('payment_status', 'paid')
            .order('created_at', { ascending: false })
            .limit(1);

          if (orderError) throw orderError;

          if (existingOrders && existingOrders.length > 0) {
            const paidOrder = existingOrders[0];
            setOrderPaid(true);
            setPaidOrderId(paidOrder.id);
            
            // Redirect to order status immediately
            toast('You already have a paid order. Redirecting...', { 
              icon: 'ℹ️',
              duration: 2000 
            });
            setTimeout(() => {
              navigate(`/order-status/${paidOrder.id}`, { replace: true });
            }, 1000);
            return; // Don't load cart or continue
          }
        } catch (err) {
          console.error('Error checking for paid orders:', err);
          // Continue loading - this is non-critical
        }
      }

      // Load shared cart from database
      if (currentSessionId) {
        try {
          const sharedCart = await getSharedCart(currentSessionId);
          if (sharedCart && Array.isArray(sharedCart)) {
            setCartItems(sharedCart);
          }
        } catch (err) {
          console.error('Failed to load shared cart:', err);
          // Continue without cart - user can still add items
        }
      }

      // Start activity tracking for this session
      if (currentSessionId) {
        startSessionTracking(currentSessionId);
      }

      // Set first category as active
      if (menuData && menuData.length > 0) {
        const categories = getCategories(menuData);
        setActiveCategory(categories[0]);
      }
    } catch (err) {
      console.error('Error loading table data:', err);
      setError(err.message || 'Failed to load menu. Please try again.');
      toast.error(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup activity tracker on unmount
  useEffect(() => {
    return () => {
      stopSessionTracking();
    };
  }, []);

  // Subscribe to shared cart updates
  useEffect(() => {
    if (!sessionId) return;

    
    const unsubscribe = subscribeToSharedCart(sessionId, (updatedCart) => {
      isUpdatingFromRemote.current = true;
      setCartItems(updatedCart || []);
      // Reset flag after state update completes
      setTimeout(() => {
        isUpdatingFromRemote.current = false;
      }, 100);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sessionId]);

  // Subscribe to order payment status changes
  useEffect(() => {
    if (!sessionId || !table?.id) return;


    // Subscribe to orders table for this session
    const orderSubscription = supabase
      .channel(`order-payment-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          
          // Check if payment_status changed to 'paid'
          if (payload.new.payment_status === 'paid' && payload.old.payment_status !== 'paid') {
            setOrderPaid(true);
            setPaidOrderId(payload.new.id);
            
            // Show toast notification
            toast.success('🎉 Payment completed! Redirecting to order status...');
            
            // Redirect all devices to order status page
            setTimeout(() => {
              navigate(`/order-status/${payload.new.id}`, { replace: true });
            }, 1500);
          }
        }
      )
      .subscribe((_status) => {
      });

    return () => {
      orderSubscription.unsubscribe();
    };
  }, [sessionId, table, navigate]);

  // Handle add to cart
  const handleAddToCart = async (item) => {
    if (!sessionId) {
      toast.error('Session not initialized. Please refresh the page.');
      return;
    }

    // Block if order is already paid
    if (orderPaid) {
      toast.error('Order is already paid. You cannot add more items.');
      return;
    }

    // Skip if update is from remote device
    if (isUpdatingFromRemote.current) {
      return;
    }

    const existingItemIndex = cartItems.findIndex(cartItem => cartItem.id === item.id);
    let newCart;

    if (existingItemIndex > -1) {
      // Update existing item
      newCart = [...cartItems];
      newCart[existingItemIndex].quantity += item.quantity;
      if (item.notes) {
        newCart[existingItemIndex].notes = item.notes;
      }
    } else {
      // Add new item
      newCart = [...cartItems, item];
    }

    // Optimistic update
    setCartItems(newCart);

    // Save to database
    try {
      await updateSharedCart(sessionId, newCart);
      toast.success(`${item.name} added to cart!`);
    } catch (err) {
      console.error('Failed to update shared cart:', err);
      // Rollback on error
      setCartItems(cartItems);
      toast.error('Failed to update cart. Please try again.');
    }
    
    // Do NOT auto-open cart on mobile - let user use the bottom button instead
    // This provides better UX and control
  };

  // Handle update quantity
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (!sessionId) return;
    if (isUpdatingFromRemote.current) return;

    // Block if order is already paid
    if (orderPaid) {
      toast.error('Order is already paid. You cannot modify the cart.');
      return;
    }

    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    const newCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );

    // Optimistic update
    setCartItems(newCart);

    try {
      await updateSharedCart(sessionId, newCart);
    } catch (err) {
      console.error('Failed to update cart quantity:', err);
      setCartItems(cartItems);
      toast.error('Failed to update quantity');
    }
  };

  // Handle remove item
  const handleRemoveItem = async (itemId) => {
    if (!sessionId) return;
    if (isUpdatingFromRemote.current) return;

    // Block if order is already paid
    if (orderPaid) {
      toast.error('Order is already paid. You cannot modify the cart.');
      return;
    }

    const newCart = cartItems.filter(item => item.id !== itemId);

    // Optimistic update
    setCartItems(newCart);

    try {
      await updateSharedCart(sessionId, newCart);
      toast.success('Item removed from cart');
    } catch (err) {
      console.error('Failed to remove item:', err);
      setCartItems(cartItems);
      toast.error('Failed to remove item');
    }
  };

  // Handle checkout
  // Create order and navigate to payment – only called from cart summary now
  const handleProceedToPayment = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    // Block if order is already paid
    if (orderPaid) {
      toast.error('Order is already paid. Please wait for your food.');
      navigate(`/order-status/${paidOrderId}`, { replace: true });
      return;
    }

    // Prevent double submission (important for React StrictMode)
    if (submittingOrder) {
      return;
    }

    // Verify table data is loaded
    if (!table || !table.id) {
      toast.error('Table information not loaded. Please refresh the page.');
      console.error('Table data missing:', table);
      return;
    }

    if (!sessionId) {
      toast.error('Session not initialized. Please refresh the page.');
      return;
    }

    try {
      setSubmittingOrder(true);
      toast.dismiss('order-progress');
      toast.loading('Creating your order...', { id: 'order-progress' });
      const orderData = prepareOrderData(cartItems, table, table.restaurant_id);
      const order = await createOrder(orderData);
      if (!order || !order.id) {
        throw new Error('Order response missing ID');
      }

      // Clear shared cart in database
      await clearSharedCart(sessionId);
      setCartItems([]);

      toast.success('Order created! Redirecting to payment...', { id: 'order-progress' });
      setShowCart(false); // Close sheet to avoid overlay blocking navigation perception
      navigate(`/payment/${order.id}`);
    } catch (err) {
      console.error('Error creating order:', err);
      console.error('Error message:', err.message);
      console.error('Error details:', JSON.stringify(err, null, 2));
      toast.error(`Failed to create order: ${err.message || 'Please try again.'}`, { id: 'order-progress' });
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Get grouped menu items
  const groupedMenuItems = groupByCategory(menuItems);
  const categories = getCategories(menuItems);

  // Filter menu items based on search query
  const filteredMenuItems = searchQuery.trim() 
    ? menuItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : menuItems;

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(query.trim().length > 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-2xl shadow-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-full animate-pulse"></div>
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse"></div>
            </div>
            <div className="w-9 h-9 bg-white/10 rounded-full animate-pulse"></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 pb-4">
            <div className="h-10 bg-white/10 rounded-xl animate-pulse"></div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        {/* Dark theme compatible error message override */}
        <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <ErrorMessage error={error} onRetry={loadData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-50 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-900/80 backdrop-blur-2xl shadow-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
          {/* Left: Back + Restaurant Info */}
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-full p-2 bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Restaurant logo" className="h-6 sm:h-7 w-auto object-contain" />
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg border border-orange-500/30 text-xs font-bold text-orange-400">
                  Table #{table?.table_number}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Profile Icon (placeholder) */}
            <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 ring-2 ring-orange-400/20">
              <span className="text-sm font-bold">
                {table?.table_number || 'T'}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="menu-search"
              name="menu-search"
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search for dishes..."
              autoComplete="off"
              className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm py-3 pl-11 pr-10 text-sm text-white placeholder:text-zinc-500 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            )}
          </div>
          {isSearching && (
            <p className="mt-2 text-sm text-zinc-400">
              Found <span className="text-orange-400 font-semibold">{filteredMenuItems.length}</span> {filteredMenuItems.length === 1 ? 'item' : 'items'}
            </p>
          )}
        </div>
      </div>

      {/* Cart banner removed - cart opens automatically after adding items on mobile */}

      {/* Category tabs - hide when searching */}
      {!isSearching && categories.length > 0 && (
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Menu items */}
          <div className="flex-1">
            {isSearching ? (
              // Search results view
              <div className="mb-6">
                <h2 className="mb-4 text-2xl font-bold text-white tracking-tight">
                  Search Results {searchQuery && <span className="text-orange-400">"{searchQuery}"</span>}
                </h2>
                {filteredMenuItems.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredMenuItems.map((item) => {
                      const cartItem = cartItems.find(ci => ci.id === item.id);
                      return (
                        <MenuItem
                          key={item.id}
                          item={item}
                          onAddToCart={handleAddToCart}
                          onUpdateQuantity={handleUpdateQuantity}
                          cartQuantity={cartItem?.quantity || 0}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center bg-slate-800/30 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/10">
                    <Search className="mx-auto h-16 w-16 text-zinc-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No items found
                    </h3>
                    <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                      We couldn't find any dishes matching "<span className="text-orange-400">{searchQuery}</span>". Try searching with different keywords.
                    </p>
                    <button
                      onClick={clearSearch}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20"
                    >
                      <X className="h-4 w-4" />
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Category view
              categories.map((category) => (
                <div
                  key={category}
                  className={`mb-6 ${activeCategory !== category ? 'hidden' : ''}`}
                >
                  <h2 className="mb-4 text-2xl font-bold text-white tracking-tight">{category}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {groupedMenuItems[category]?.map((item) => {
                      const cartItem = cartItems.find(ci => ci.id === item.id);
                      return (
                        <MenuItem
                          key={item.id}
                          item={item}
                          onAddToCart={handleAddToCart}
                          onUpdateQuantity={handleUpdateQuantity}
                          cartQuantity={cartItem?.quantity || 0}
                        />
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            {/* Empty menu fallback */}
            {!isSearching && categories.length === 0 && (
              <div className="py-20 text-center bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-white/10">
                <Search className="mx-auto h-16 w-16 text-zinc-600 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Menu Coming Soon</h2>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">No dishes are available right now. Please ask the staff or try again later.</p>
                <button
                  onClick={loadData}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>

          {/* Cart sidebar (desktop) - Fixed 320px width */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-32 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <CartSummary
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleProceedToPayment}
                isProcessing={submittingOrder}
              />
              {submittingOrder && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-900/90 backdrop-blur-sm">
                  <LoadingSpinner text="Creating order..." />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cart bottom sheet (mobile) */}
      {showCart && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submittingOrder) setShowCart(false);
          }}
        >
          {/* Dim backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div
            className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-3xl shadow-2xl border-t border-white/10 max-h-[85vh] flex flex-col w-full"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10">
              <h2 className="text-white font-bold text-lg">Review Order</h2>
              <button
                type="button"
                onClick={() => !submittingOrder && setShowCart(false)}
                className="rounded-full p-2 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <X className="h-5 w-5 text-zinc-300" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CartSummary
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleProceedToPayment}
                isProcessing={submittingOrder}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar (Mobile) - Cart info and actions */}
      {cartItems.length > 0 && !showCart && (
        <div className="fixed bottom-4 left-4 right-4 z-40 flex items-center gap-3 lg:hidden animate-slideUp">
          {/* Review Order Button (replaces Pay Now + Cart) */}
          <button
            type="button"
            aria-label="Review order"
            onClick={() => setShowCart(true)}
            className="flex-1 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 py-4 font-semibold text-white shadow-2xl shadow-orange-500/30 transition-all active:scale-[0.98] hover:shadow-orange-500/50 hover:brightness-110 border border-orange-400/30 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg ring-2 ring-orange-500/20">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium block">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                  <span className="text-lg font-bold tabular-nums">
                    ₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold whitespace-nowrap flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg">
                Review <ArrowLeft className="h-4 w-4 rotate-180" />
              </span>
            </div>
          </button>
          {/* Call Waiter Button - Compact repositioned */}
          <button
            type="button"
            aria-label="Call waiter"
            onClick={async () => {
              try {
                const channelName = table?.restaurant_id ? `waiter-alerts-${table.restaurant_id}` : 'waiter-alerts';
                const channel = supabase.channel(channelName);
                channel.subscribe((status) => {
                  if (status === 'SUBSCRIBED') {
                    channel.send({
                      type: 'broadcast',
                      event: 'call_waiter',
                      payload: {
                        tableNumber: table?.table_number || 'Unknown',
                        at: new Date().toISOString(),
                        restaurantId: table?.restaurant_id || null,
                      },
                    });
                    setTimeout(() => {
                      supabase.removeChannel(channel);
                    }, 3000);
                  }
                });
                toast.success('Waiter notified! 🔔');
              } catch (err) {
                console.error('Failed to send waiter alert:', err);
              }
            }}
            className="flex-shrink-0 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-4 text-white shadow-2xl shadow-orange-500/30 transition-all hover:brightness-110 active:scale-95 touch-manipulation ring-2 ring-orange-400/20"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Call Waiter Button - only when cart is empty and sheet is not open */}
      {cartItems.length === 0 && !showCart && (
        <CallWaiterButton tableNumber={table?.table_number} restaurantId={table?.restaurant_id} />
      )}
    </div>
  );
};

export default TablePage;
