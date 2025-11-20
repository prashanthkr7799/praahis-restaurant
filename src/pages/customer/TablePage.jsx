import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Search, X, Bell } from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';
// Mark 'm' as used for ESLint while also enabling JSX usage like <m.div>
const MOTION = m;
import toast from 'react-hot-toast';
import { getTable, getMenuItems, createOrder, markTableOccupied, supabase, getOrCreateActiveSessionId } from '@shared/utils/api/supabaseClient';
import { getCart, saveCart, clearCart, getSession, saveSession } from '@/shared/utils/helpers/localStorage';
import { startSessionTracking, stopSessionTracking } from '@/shared/utils/helpers/sessionActivityTracker';
import { groupByCategory, getCategories, prepareOrderData } from '@domains/ordering/utils/orderHelpers';
import MenuItem from '@domains/ordering/components/MenuItem';
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
    console.log('🔵 useEffect triggered - starting loadData()');
    loadData();
    
    // Load cart from localStorage
    const savedCart = getCart(tableId);
    setCartItems(savedCart);
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

      // Mark table as occupied and create/get session
      const tableWithSession = await markTableOccupied(tableData.id);
      
      // Get or create session ID
      let currentSessionId = getSession(tableId);
      if (!currentSessionId && tableWithSession?.session_id) {
        currentSessionId = tableWithSession.session_id;
        saveSession(tableId, currentSessionId);
      } else if (!currentSessionId) {
        currentSessionId = await getOrCreateActiveSessionId(tableData.id);
        saveSession(tableId, currentSessionId);
      }

      // Start activity tracking for this session
      if (currentSessionId) {
        console.log('🟢 Starting session activity tracking:', currentSessionId);
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
      console.log('🔴 Stopping session activity tracking on unmount');
      stopSessionTracking();
    };
  }, []);

  // Handle add to cart
  const handleAddToCart = (item) => {
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

    setCartItems(newCart);
    saveCart(tableId, newCart);
    toast.success(`${item.name} added to cart!`);
    
    // Do NOT auto-open cart on mobile - let user use the bottom button instead
    // This provides better UX and control
  };

  // Handle update quantity
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    const newCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(newCart);
    saveCart(tableId, newCart);
  };

  // Handle remove item
  const handleRemoveItem = (itemId) => {
    const newCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(newCart);
    saveCart(tableId, newCart);
    toast.success('Item removed from cart');
  };

  // Handle checkout
  // Create order and navigate to payment – only called from cart summary now
  const handleProceedToPayment = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty!');
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

    try {
      setSubmittingOrder(true);
      toast.dismiss('order-progress');
      toast.loading('Creating your order...', { id: 'order-progress' });
      console.log('[Checkout] Creating order for table:', table?.id, 'items:', cartItems.length);
      const orderData = prepareOrderData(cartItems, table, table.restaurant_id);
      const order = await createOrder(orderData);
      if (!order || !order.id) {
        throw new Error('Order response missing ID');
      }
      clearCart(tableId);
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
      <div className="min-h-screen customer-theme flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading menu..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen customer-theme flex items-center justify-center">
        {/* Dark theme compatible error message override */}
        <div className="w-full max-w-md customer-card">
          <ErrorMessage error={error} onRetry={loadData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen customer-theme">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-50 customer-card shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
          {/* Left: Back + Restaurant Info */}
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-full p-2 hover:bg-gray-700 transition-colors">
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Restaurant logo" className="h-6 sm:h-7 w-auto object-contain" />
              <p className="text-xs text-gray-400">Table #{table?.table_number}</p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Cart button removed from mobile view - cart opens automatically after adding items */}
            
            {/* Profile Icon (placeholder) */}
            <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 text-white">
              <span className="text-sm font-semibold">
                {table?.table_number || 'T'}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              id="menu-search"
              name="menu-search"
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search for dishes..."
              autoComplete="off"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          {isSearching && (
            <p className="mt-2 text-sm text-gray-400">
              Found {filteredMenuItems.length} {filteredMenuItems.length === 1 ? 'item' : 'items'}
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
                <h2 className="mb-4 text-2xl font-bold text-white">
                  Search Results {searchQuery && `for "${searchQuery}"`}
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
                          cartQuantity={cartItem?.quantity || 0}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-lg text-gray-400">No items found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Try searching with different keywords
                    </p>
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
              <div className="py-20 text-center customer-card">
                <Search className="mx-auto h-16 w-16 text-gray-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Menu Coming Soon</h2>
                <p className="text-sm text-gray-400 max-w-md mx-auto">No dishes are available right now. Please ask the staff or try again later.</p>
                <button
                  onClick={loadData}
                  className="mt-6 px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg active:scale-95"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>

          {/* Cart sidebar (desktop) - Fixed 320px width */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-32 customer-card">
              <CartSummary
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleProceedToPayment}
                isProcessing={submittingOrder}
              />
              {submittingOrder && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-900/90">
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-gray-900 rounded-t-3xl shadow-2xl border-t border-gray-800 max-h-[85vh] flex flex-col w-full"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-800">
              <h2 className="text-white font-semibold">Review Order</h2>
              <button
                type="button"
                onClick={() => !submittingOrder && setShowCart(false)}
                className="rounded-full p-2 hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-300" />
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
        <div className="fixed bottom-4 left-4 right-4 z-40 flex items-center gap-3 lg:hidden">
          {/* Review Order Button (replaces Pay Now + Cart) */}
          <button
            type="button"
            aria-label="Review order"
            onClick={() => setShowCart(true)}
            className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3.5 font-semibold text-white shadow-2xl transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
                <span className="text-sm text-white/70">|</span>
                <span className="text-lg font-bold tabular-nums">
                  ₹{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </span>
              </div>
              <span className="text-sm font-semibold whitespace-nowrap">
                Review →
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
            className="flex-shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-3.5 text-white shadow-2xl transition-all hover:brightness-110 active:scale-95 touch-manipulation"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Call Waiter Button - When cart is empty or hidden */}
      {(cartItems.length === 0 || showCart) && (
        <CallWaiterButton tableNumber={table?.table_number} restaurantId={table?.restaurant_id} />
      )}
    </div>
  );
};

export default TablePage;
