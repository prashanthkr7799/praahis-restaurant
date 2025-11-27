/**
 * PHASE 9 — OFFERS, COUPONS & MEMBERSHIP UTILITY FUNCTIONS
 * All discount calculations are 100% client-side
 */

/**
 * Validate if a coupon is applicable to an order
 * @param {Object} coupon - Coupon object from database
 * @param {Object} order - Current order object
 * @param {Object} customer - Customer object (optional)
 * @returns {Object} - { valid: boolean, reason: string }
 */
export function validateCoupon(coupon, order, customer = null) {
  if (!coupon || !order) {
    return { valid: false, reason: 'Invalid coupon or order' };
  }

  // Check if coupon is active
  if (coupon.status !== 'active') {
    return { valid: false, reason: 'Coupon is not active' };
  }

  // Check expiry
  if (isCouponExpired(coupon)) {
    return { valid: false, reason: 'Coupon has expired' };
  }

  // Check schedule
  if (!isWithinSchedule(coupon.valid_from, coupon.valid_until)) {
    return { valid: false, reason: 'Coupon is not valid at this time' };
  }

  // Check minimum order amount
  const orderTotal = calculateOrderTotal(order);
  if (coupon.min_order_amount && orderTotal < coupon.min_order_amount) {
    return { 
      valid: false, 
      reason: `Minimum order amount of ₹${coupon.min_order_amount} required` 
    };
  }

  // Check usage limit (global)
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, reason: 'Coupon usage limit reached' };
  }

  // Check per-user usage limit
  if (customer && coupon.per_user_limit) {
    const userUsageCount = coupon.user_usage_count?.[customer.id] || 0;
    if (userUsageCount >= coupon.per_user_limit) {
      return { valid: false, reason: 'You have reached the usage limit for this coupon' };
    }
  }

  // Check first-time user only
  if (coupon.first_time_only && customer && customer.order_count > 0) {
    return { valid: false, reason: 'This coupon is only for first-time users' };
  }

  return { valid: true, reason: 'Coupon is valid' };
}

/**
 * Validate if membership discount is applicable
 * @param {Object} customer - Customer with membership tier
 * @returns {Object} - { valid: boolean, discountPercent: number, tier: string }
 */
export function validateMembershipDiscount(customer) {
  if (!customer || !customer.membership_tier) {
    return { valid: false, discountPercent: 0, tier: null };
  }

  const tierDiscounts = {
    'silver': 5,
    'gold': 10,
    'platinum': 15
  };

  const tier = customer.membership_tier.toLowerCase();
  const discountPercent = tierDiscounts[tier] || 0;

  return {
    valid: discountPercent > 0,
    discountPercent,
    tier: customer.membership_tier
  };
}

/**
 * Get all eligible coupons for an order
 * @param {Array} allCoupons - All available coupons
 * @param {Object} order - Current order
 * @param {Object} customer - Customer object
 * @returns {Array} - Array of eligible coupons
 */
export function getEligibleCouponsForOrder(allCoupons, order, customer = null) {
  if (!allCoupons || !Array.isArray(allCoupons)) {
    return [];
  }

  return allCoupons.filter(coupon => {
    const validation = validateCoupon(coupon, order, customer);
    return validation.valid;
  });
}

/**
 * Compute final amount after applying discounts
 * @param {Object} order - Order object
 * @param {Object} coupon - Applied coupon (optional)
 * @param {Object} membership - Membership discount info (optional)
 * @param {Number} pointsRedeemed - Loyalty points redeemed (optional)
 * @returns {Object} - Complete breakdown
 */
export function computeFinalAmount(order, coupon = null, membership = null, pointsRedeemed = 0) {
  const subtotal = calculateOrderTotal(order);
  
  let couponDiscount = 0;
  let membershipDiscount = 0;
  let pointsDiscount = pointsRedeemed * 0.1; // 1 point = ₹0.10

  // Calculate coupon discount
  if (coupon) {
    couponDiscount = calculateDiscount(order, coupon);
  }

  // Calculate membership discount
  if (membership && membership.valid) {
    const afterCoupon = subtotal - couponDiscount;
    membershipDiscount = (afterCoupon * membership.discountPercent) / 100;
  }

  // Merge discounts logic: Don't allow total discount > subtotal
  const totalDiscount = Math.min(
    couponDiscount + membershipDiscount + pointsDiscount,
    subtotal
  );

  const finalAmount = Math.max(subtotal - totalDiscount, 0);

  return {
    subtotal,
    couponDiscount,
    membershipDiscount,
    pointsDiscount,
    totalDiscount,
    finalAmount,
    appliedCoupon: coupon,
    appliedMembership: membership,
    pointsRedeemed
  };
}

/**
 * Calculate discount amount from a coupon
 * @param {Object} order - Order object
 * @param {Object} coupon - Coupon object
 * @returns {Number} - Discount amount
 */
export function calculateDiscount(order, coupon) {
  const orderTotal = calculateOrderTotal(order);

  if (!coupon) return 0;

  let discount = 0;

  switch (coupon.discount_type) {
    case 'percentage':
      discount = (orderTotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount) {
        discount = Math.min(discount, coupon.max_discount_amount);
      }
      break;

    case 'flat':
      discount = coupon.discount_value;
      break;

    case 'bogo':
      discount = calculateBOGODiscount(order, coupon);
      break;

    case 'category':
      discount = calculateCategoryDiscount(order, coupon);
      break;

    case 'item':
      discount = calculateItemDiscount(order, coupon);
      break;

    default:
      discount = 0;
  }

  // Ensure discount doesn't exceed order total
  return Math.min(discount, orderTotal);
}

/**
 * Calculate BOGO (Buy One Get One) discount
 * @param {Object} order - Order object
 * @param {Object} coupon - Coupon with BOGO config
 * @returns {Number} - Discount amount
 */
function calculateBOGODiscount(order, coupon) {
  if (!order.items || !coupon.bogo_config) return 0;

  const { buy_item_id, get_item_id, get_discount_percent = 100 } = coupon.bogo_config;

  const buyItem = order.items.find(item => item.id === buy_item_id);
  const getItem = order.items.find(item => item.id === get_item_id);

  if (!buyItem || !getItem) return 0;

  // Apply discount to the cheaper item
  const freeQuantity = Math.min(buyItem.quantity, getItem.quantity);
  const discountPerItem = (getItem.price * get_discount_percent) / 100;

  return freeQuantity * discountPerItem;
}

/**
 * Calculate category-specific discount
 * @param {Object} order - Order object
 * @param {Object} coupon - Coupon with category config
 * @returns {Number} - Discount amount
 */
function calculateCategoryDiscount(order, coupon) {
  if (!order.items || !coupon.category_id) return 0;

  const categoryItems = order.items.filter(item => item.category_id === coupon.category_id);
  const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (categoryTotal * coupon.discount_value) / 100;
  } else {
    discount = coupon.discount_value;
  }

  return Math.min(discount, categoryTotal);
}

/**
 * Calculate item-specific discount
 * @param {Object} order - Order object
 * @param {Object} coupon - Coupon with item config
 * @returns {Number} - Discount amount
 */
function calculateItemDiscount(order, coupon) {
  if (!order.items || !coupon.item_id) return 0;

  const targetItem = order.items.find(item => item.id === coupon.item_id);
  if (!targetItem) return 0;

  const itemTotal = targetItem.price * targetItem.quantity;

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (itemTotal * coupon.discount_value) / 100;
  } else {
    discount = coupon.discount_value;
  }

  return Math.min(discount, itemTotal);
}

/**
 * Calculate reward points from order amount
 * @param {Number} amount - Order amount
 * @param {Number} pointsRate - Points per rupee (default: 1 point per ₹10)
 * @returns {Number} - Points earned
 */
export function rewardPointsFromOrder(amount, pointsRate = 0.1) {
  return Math.floor(amount * pointsRate);
}

/**
 * Get the best discount from multiple options
 * @param {Array} discountOptions - Array of discount objects
 * @returns {Object} - Best discount option
 */
export function getBestDiscount(discountOptions) {
  if (!discountOptions || discountOptions.length === 0) {
    return null;
  }

  return discountOptions.reduce((best, current) => {
    if (!best) return current;
    return current.totalDiscount > best.totalDiscount ? current : best;
  }, null);
}

/**
 * Check if coupon is expired
 * @param {Object} coupon - Coupon object
 * @returns {Boolean}
 */
export function isCouponExpired(coupon) {
  if (!coupon.valid_until) return false;
  const now = new Date();
  const expiry = new Date(coupon.valid_until);
  return now > expiry;
}

/**
 * Check if current time is within schedule
 * @param {String} startDate - Start date string
 * @param {String} endDate - End date string
 * @returns {Boolean}
 */
export function isWithinSchedule(startDate, endDate) {
  const now = new Date();
  
  if (startDate) {
    const start = new Date(startDate);
    if (now < start) return false;
  }

  if (endDate) {
    const end = new Date(endDate);
    if (now > end) return false;
  }

  return true;
}

/**
 * Calculate order total from items
 * @param {Object} order - Order object with items array
 * @returns {Number} - Total amount
 */
function calculateOrderTotal(order) {
  if (!order || !order.items || !Array.isArray(order.items)) {
    return order?.total_amount || 0;
  }

  return order.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

/**
 * Sanitize coupon metadata for storage
 * @param {Object} metadata - Raw metadata
 * @returns {Object} - Sanitized metadata
 */
export function sanitizeCouponMetadata(metadata) {
  if (!metadata) return {};

  return {
    description: metadata.description || '',
    terms_conditions: metadata.terms_conditions || '',
    applicable_categories: metadata.applicable_categories || [],
    applicable_items: metadata.applicable_items || [],
    excluded_categories: metadata.excluded_categories || [],
    excluded_items: metadata.excluded_items || [],
    bogo_config: metadata.bogo_config || null
  };
}

/**
 * Generate random coupon code
 * @param {Number} length - Code length
 * @returns {String} - Coupon code
 */
export function generateCouponCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if customer should be upgraded to next membership tier
 * @param {Object} customer - Customer object
 * @param {Number} totalSpending - Total lifetime spending
 * @returns {Object} - { shouldUpgrade: boolean, newTier: string }
 */
export function checkMembershipUpgrade(customer, totalSpending) {
  const tiers = [
    { name: 'silver', threshold: 5000 },
    { name: 'gold', threshold: 20000 },
    { name: 'platinum', threshold: 50000 }
  ];

  const currentTier = customer?.membership_tier?.toLowerCase() || null;
  
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (totalSpending >= tiers[i].threshold) {
      const newTier = tiers[i].name;
      if (newTier !== currentTier) {
        return { shouldUpgrade: true, newTier };
      }
      break;
    }
  }

  return { shouldUpgrade: false, newTier: currentTier };
}

/**
 * Validate offer overlap
 * @param {Object} newOffer - New offer to check
 * @param {Array} existingOffers - Existing offers
 * @returns {Object} - { hasOverlap: boolean, conflictingOffers: [] }
 */
export function validateOfferOverlap(newOffer, existingOffers) {
  if (!existingOffers || existingOffers.length === 0) {
    return { hasOverlap: false, conflictingOffers: [] };
  }

  const newStart = new Date(newOffer.valid_from);
  const newEnd = new Date(newOffer.valid_until);

  const conflicting = existingOffers.filter(offer => {
    if (offer.id === newOffer.id) return false; // Skip self when editing
    if (offer.status !== 'active') return false;

    const existingStart = new Date(offer.valid_from);
    const existingEnd = new Date(offer.valid_until);

    // Check date overlap
    const hasDateOverlap = (
      (newStart >= existingStart && newStart <= existingEnd) ||
      (newEnd >= existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );

    if (!hasDateOverlap) return false;

    // Check type overlap (same category or item)
    if (newOffer.offer_type === 'category' && offer.offer_type === 'category') {
      return newOffer.category_id === offer.category_id;
    }

    if (newOffer.offer_type === 'item' && offer.offer_type === 'item') {
      return newOffer.item_id === offer.item_id;
    }

    return false;
  });

  return {
    hasOverlap: conflicting.length > 0,
    conflictingOffers: conflicting
  };
}

/**
 * Format discount for display
 * @param {Number} amount - Discount amount
 * @returns {String} - Formatted string
 */
export function formatDiscount(amount) {
  return `₹${amount.toFixed(2)}`;
}

/**
 * Calculate points value in rupees
 * @param {Number} points - Number of points
 * @param {Number} conversionRate - Points to rupees rate (default: 1 point = ₹0.10)
 * @returns {Number} - Rupee value
 */
export function pointsToRupees(points, conversionRate = 0.1) {
  return points * conversionRate;
}

/**
 * Calculate rupees to points
 * @param {Number} rupees - Rupee amount
 * @param {Number} conversionRate - Rupees to points rate (default: ₹10 = 1 point)
 * @returns {Number} - Points
 */
export function rupeesToPoints(rupees, conversionRate = 0.1) {
  return Math.floor(rupees * conversionRate);
}

export default {
  validateCoupon,
  validateMembershipDiscount,
  getEligibleCouponsForOrder,
  computeFinalAmount,
  calculateDiscount,
  rewardPointsFromOrder,
  getBestDiscount,
  isCouponExpired,
  isWithinSchedule,
  sanitizeCouponMetadata,
  generateCouponCode,
  checkMembershipUpgrade,
  validateOfferOverlap,
  formatDiscount,
  pointsToRupees,
  rupeesToPoints
};
