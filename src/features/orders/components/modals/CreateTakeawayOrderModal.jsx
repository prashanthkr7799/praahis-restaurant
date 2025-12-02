import { useState, useEffect } from 'react';
import { 
  User, Phone, Mail, MapPin, Search, ShoppingBag, 
  ChevronRight, ChevronLeft, X, Plus, Minus, 
  FileText, Percent, CreditCard, Banknote, Check
} from 'lucide-react';
import Modal from '@shared/components/ui/Modal';
import { formatCurrency } from '@shared/utils/formatters';
import { DiscountModal } from './DiscountModal';
import { supabase } from '@config/supabase';

/**
 * CreateTakeawayOrderModal Component
 * 
 * 3-step wizard modal for creating takeaway/delivery orders.
 * Steps: Customer Info → Menu Selection → Order Summary
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onCreate - Create callback with order data
 */
export function CreateTakeawayOrderModal({ isOpen, onClose, onCreate }) {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderType, setOrderType] = useState('takeaway');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Step 2: Menu Selection
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]); // { itemId, name, price, qty, isVeg }
  const [loading, setLoading] = useState(false);

  // Step 3: Order Summary
  const [discount, setDiscount] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('counter');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Error state
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setOrderType('takeaway');
      setDeliveryAddress('');
      setCart([]);
      setDiscount(null);
      setPaymentMethod('counter');
      setSpecialInstructions('');
      setSearchQuery('');
      setSelectedCategory('all');
      setError('');
    }
  }, [isOpen]);

  // Fetch menu items when step 2 is reached
  useEffect(() => {
    if (isOpen && currentStep === 2 && menuItems.length === 0) {
      fetchMenuItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStep]);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setMenuItems(data || []);

      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 validation
  const isStep1Valid = () => {
    if (!customerName.trim()) return false;
    if (!customerPhone.trim() || customerPhone.length !== 10) return false;
    if (orderType === 'delivery' && !deliveryAddress.trim()) return false;
    return true;
  };

  // Step 2 validation
  const isStep2Valid = () => {
    return cart.length > 0;
  };

  // Cart operations
  const addToCart = (item) => {
    const existingItem = cart.find(c => c.itemId === item.id);
    if (existingItem) {
      setCart(cart.map(c => 
        c.itemId === item.id 
          ? { ...c, qty: c.qty + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        itemId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        qty: 1,
        isVeg: item.is_veg
      }]);
    }
  };

  const updateCartQty = (itemId, delta) => {
    setCart(cart.map(c => {
      if (c.itemId === itemId) {
        const newQty = c.qty + delta;
        return { ...c, qty: Math.max(0, newQty) };
      }
      return c;
    }).filter(c => c.qty > 0));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c.itemId !== itemId));
  };

  const getCartItemQty = (itemId) => {
    const item = cart.find(c => c.itemId === itemId);
    return item ? item.qty : 0;
  };

  // Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = discount ? discount.amount : 0;
  const taxRate = 0.05;
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const total = subtotal - discountAmount + taxAmount;

  // Handle discount apply
  const handleDiscountApply = (discountData) => {
    setDiscount(discountData);
    setShowDiscountModal(false);
  };

  // Navigation
  const handleNext = () => {
    setError('');
    if (currentStep === 1 && !isStep1Valid()) {
      setError('Please fill in all required fields correctly');
      return;
    }
    if (currentStep === 2 && !isStep2Valid()) {
      setError('Please add at least one item to the cart');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleCreate = () => {
    if (!isStep1Valid() || !isStep2Valid()) {
      setError('Please complete all required fields');
      return;
    }

    const orderData = {
      order_type: orderType,
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || null,
        address: orderType === 'delivery' ? deliveryAddress.trim() : null
      },
      items: cart.map(item => ({
        item_id: item.itemId,
        name: item.name,
        price: item.price,
        qty: item.qty,
        is_veg: item.isVeg
      })),
      subtotal,
      discount: discount ? {
        type: discount.type,
        value: discount.value,
        amount: discountAmount
      } : null,
      tax: taxAmount,
      total,
      payment_method: paymentMethod,
      special_instructions: specialInstructions.trim() || null
    };

    if (typeof onCreate === 'function') {
      onCreate(orderData);
    }

    // Requirement: Close only when Pay at Counter selected
    if (paymentMethod === 'counter') {
      onClose();
    }
  };

  // Step indicator
  const steps = [
    { number: 1, label: 'Customer Info' },
    { number: 2, label: 'Menu Selection' },
    { number: 3, label: 'Order Summary' }
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Create Takeaway Order"
        size="xl"
      >
        <div className="flex flex-col h-full max-h-[80vh] text-white">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8 px-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1 relative">
                <div className="flex flex-col items-center flex-1 z-10">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20 scale-110'
                        : 'bg-white/5 text-zinc-500 border border-white/10'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className={`text-xs mt-3 font-medium tracking-wide uppercase ${
                    currentStep >= step.number ? 'text-orange-400' : 'text-zinc-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-[2px] -translate-y-1/2 -z-0">
                    <div className={`h-full transition-all duration-500 ${
                      currentStep > step.number ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-white/5'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
            {/* Step 1: Customer Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <User className="w-4 h-4 text-orange-500" />
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder:text-zinc-600 outline-none"
                      maxLength={100}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-orange-500" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={customerPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          setCustomerPhone(value);
                        }
                      }}
                      placeholder="10-digit phone number"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder:text-zinc-600 outline-none"
                    />
                    {customerPhone && customerPhone.length !== 10 && (
                      <p className="text-xs text-red-400">Phone must be 10 digits</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-orange-500" />
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder:text-zinc-600 outline-none"
                    />
                  </div>

                  {/* Order Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-orange-500" />
                      Order Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOrderType('takeaway')}
                        className={`px-4 py-3 rounded-xl border font-medium transition-all duration-300 ${
                          orderType === 'takeaway'
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        Takeaway
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`px-4 py-3 rounded-xl border font-medium transition-all duration-300 ${
                          orderType === 'delivery'
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        Delivery
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                {orderType === 'delivery' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      Delivery Address *
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter complete delivery address with landmarks..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 resize-none transition-all text-white placeholder:text-zinc-600 outline-none"
                      maxLength={300}
                    />
                    <div className="flex justify-end">
                      <span className="text-xs text-zinc-600">
                        {deliveryAddress.length}/300
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Menu Selection */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Search Bar */}
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder:text-zinc-600 outline-none"
                  />
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    All Items
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                        selectedCategory === category
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Menu Items and Cart Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Menu Items */}
                  <div className="lg:col-span-2 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : filteredMenuItems.length === 0 ? (
                      <div className="text-center py-12 text-zinc-600 border border-dashed border-white/10 rounded-xl">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No items found</p>
                      </div>
                    ) : (
                      filteredMenuItems.map(item => {
                        const qtyInCart = getCartItemQty(item.id);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 hover:bg-white/[0.07] transition-all group"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${
                                  item.is_veg ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'
                                }`} />
                                <h4 className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{item.name}</h4>
                              </div>
                              <p className="text-xs text-zinc-500 mt-1">{item.category}</p>
                              <p className="text-lg font-bold text-orange-400 mt-1">
                                {formatCurrency(item.price)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              {qtyInCart === 0 ? (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-500/20 transition-all"
                                >
                                  Add
                                </button>
                              ) : (
                                <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-white/5">
                                  <button
                                    onClick={() => updateCartQty(item.id, -1)}
                                    className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-md hover:bg-white/10 hover:text-red-400 transition-colors"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-8 text-center font-bold text-white">
                                    {qtyInCart}
                                  </span>
                                  <button
                                    onClick={() => updateCartQty(item.id, 1)}
                                    className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-md hover:bg-white/10 hover:text-green-400 transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Cart */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-0 bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
                      <h3 className="font-semibold text-white mb-4 flex items-center gap-2 pb-3 border-b border-white/10">
                        <ShoppingBag className="w-5 h-5 text-orange-500" />
                        Cart ({cart.length})
                      </h3>

                      {cart.length === 0 ? (
                        <p className="text-sm text-zinc-500 text-center py-8 italic">
                          No items added yet
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                          {cart.map(item => (
                            <div
                              key={item.itemId}
                              className="flex items-start justify-between p-2.5 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    item.isVeg ? 'bg-green-500' : 'bg-red-500'
                                  }`} />
                                  <p className="text-sm font-medium text-zinc-200 line-clamp-1">
                                    {item.name}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center mt-1 pr-2">
                                  <p className="text-xs text-zinc-500">
                                    {item.qty} × {formatCurrency(item.price)}
                                  </p>
                                  <p className="text-sm font-bold text-orange-400">
                                    {formatCurrency(item.price * item.qty)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.itemId)}
                                className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-zinc-500 rounded transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {cart.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="flex justify-between text-sm font-medium text-zinc-300">
                            <span>Subtotal</span>
                            <span className="text-white">{formatCurrency(subtotal)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Order Summary */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Customer Info Summary */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-500" />
                    Customer Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500 mb-1">Name</p>
                      <p className="font-medium text-zinc-200">{customerName}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Phone</p>
                      <p className="font-medium text-zinc-200">{customerPhone}</p>
                    </div>
                    {customerEmail && (
                      <div>
                        <p className="text-zinc-500 mb-1">Email</p>
                        <p className="font-medium text-zinc-200">{customerEmail}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-zinc-500 mb-1">Type</p>
                      <p className="font-medium text-orange-400 capitalize">{orderType}</p>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="sm:col-span-2">
                        <p className="text-zinc-500 mb-1">Address</p>
                        <p className="font-medium text-zinc-200">{deliveryAddress}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    Order Items
                  </h3>
                  <div className="space-y-2 bg-white/5 rounded-xl p-4 border border-white/10">
                    {cart.map(item => (
                      <div
                        key={item.itemId}
                        className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${
                            item.isVeg ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium text-zinc-200">{item.name}</p>
                            <p className="text-xs text-zinc-500">
                              {item.qty} × {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-white">
                          {formatCurrency(item.price * item.qty)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discount Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Percent className="w-4 h-4 text-orange-500" />
                      Discount
                    </h3>
                    <button
                      onClick={() => setShowDiscountModal(true)}
                      className="text-xs font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wide transition-colors"
                    >
                      {discount ? 'Edit' : 'Add Discount'}
                    </button>
                  </div>
                  {discount && (
                    <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-orange-400">
                          {discount.type === 'percentage' 
                            ? `${discount.value}% Discount` 
                            : `${formatCurrency(discount.value)} Off`}
                        </p>
                        {discount.reason && (
                          <p className="text-xs text-orange-500/70 mt-0.5">{discount.reason}</p>
                        )}
                      </div>
                      <p className="font-bold text-red-400">
                        - {formatCurrency(discountAmount)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('counter')}
                      className={`flex items-center justify-center gap-2 px-4 py-4 rounded-xl border font-medium transition-all duration-300 ${
                        paymentMethod === 'counter'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Banknote className="w-5 h-5" />
                      Pay at Counter
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`flex items-center justify-center gap-2 px-4 py-4 rounded-xl border font-medium transition-all duration-300 ${
                        paymentMethod === 'online'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      Pay Now (Online)
                    </button>
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requests or instructions..."
                    rows={2}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 resize-none transition-all text-white placeholder:text-zinc-600 outline-none"
                    maxLength={200}
                  />
                </div>

                {/* Total Breakdown */}
                <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-5 border border-white/10 shadow-xl">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount && (
                      <div className="flex justify-between text-sm text-red-400">
                        <span>Discount</span>
                        <span>- {formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Tax (5%)</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold text-white pt-3 border-t border-white/10">
                      <span>Total</span>
                      <span className="text-orange-500">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-white/10 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-sm font-bold text-zinc-400 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all"
            >
              Cancel
            </button>

            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-white/10 border border-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={(currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid())}
                className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={!isStep1Valid() || !isStep2Valid()}
                className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
              >
                <ShoppingBag className="w-4 h-4" />
                Create Order
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Discount Modal */}
      {showDiscountModal && (
        <DiscountModal
          isOpen={showDiscountModal}
          onClose={() => setShowDiscountModal(false)}
          onApply={handleDiscountApply}
          currentTotal={subtotal}
        />
      )}
    </>
  );
}

export default CreateTakeawayOrderModal;
