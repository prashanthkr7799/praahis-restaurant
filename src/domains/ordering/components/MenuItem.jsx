import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { formatCurrency } from '@domains/ordering/utils/orderHelpers';

/**
 * Premium MenuItem Component for Customer Page
 * Dark theme with vibrant orange accents
 * 
 * Features:
 * - 5:4 aspect ratio image
 * - Green veg indicator (border + dot)
 * - Orange-tinted tags (hot, cold, popular)
 * - Title & price side-by-side
 * - 2-line description clamp
 * - 5-star rating display
 * - Orange add-to-cart button
 */
const MenuItem = ({ item, onAddToCart, cartQuantity = 0 }) => {
  const handleAdd = () => {
    onAddToCart({
      ...item,
      quantity: 1, // Always add 1 item at a time
    });
  };

  // Render star rating
  const renderStars = () => {
    const stars = [];
    const rating = item.avg_rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3 h-3 ${
            i <= Math.floor(rating)
              ? 'fill-current customer-rating'
              : 'text-gray-600'
          }`}
        />
      );
    }
    return stars;
  };

  // Get tags array
  const tags = [];
  if (item.is_hot) tags.push('Hot');
  if (item.is_cold) tags.push('Cold');
  if (item.is_popular) tags.push('Popular');

  return (
    <div className="customer-card p-3 transition-all duration-300 hover:shadow-2xl">
      {/* Image Area - 5:4 Aspect Ratio */}
      <div className="relative aspect-5-4 mb-3 rounded-lg overflow-hidden bg-gray-800">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <span className="text-4xl">🍽️</span>
          </div>
        )}

        {/* Veg Indicator - Top Left */}
        {item.is_veg && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded border-2 border-green-500 bg-gray-900/80 flex items-center justify-center customer-success">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        )}

        {/* Cart Badge - Top Right */}
        {cartQuantity > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {cartQuantity}
          </div>
        )}
      </div>

      {/* Tags - Orange Tinted */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Title & Price - Side by Side */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-white flex-1 mr-2 leading-tight">
          {item.name}
        </h3>
        <span className="text-sm font-bold customer-rating whitespace-nowrap">
          {formatCurrency(item.price)}
        </span>
      </div>

      {/* Description - 2 Line Clamp */}
      {item.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Rating Display */}
      {item.avg_rating > 0 && (
        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center gap-0.5">
            {renderStars()}
          </div>
          <span className="text-xs text-gray-500 ml-1">
            ({item.total_ratings || 0})
          </span>
        </div>
      )}

      {/* Add to Cart Section */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 customer-primary text-white rounded-lg hover:brightness-110 active:scale-95 transition-all text-sm font-medium"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};

export default MenuItem;
