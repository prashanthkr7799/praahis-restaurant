// Simple runtime store for active restaurant context, usable outside React

let current = null;

// Shape: { restaurantId, restaurantSlug, restaurantName, branding }
export const setRestaurantContext = (ctx) => {
  current = ctx ? { ...ctx } : null;
};

export const getRestaurantContext = () => current;

export const clearRestaurantContext = () => {
  current = null;
};

export const getActiveRestaurantId = (fallbackId) => {
  return current?.restaurantId || fallbackId || null;
};

export default {
  setRestaurantContext,
  getRestaurantContext,
  clearRestaurantContext,
  getActiveRestaurantId,
};
