import React from 'react';
import { ShoppingCart, Star, Plus, Minus } from 'lucide-react';
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
const MenuItem = ({ item, onAddToCart, onUpdateQuantity, cartQuantity = 0 }) => {
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);

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
  if (item.is_hot) tags.push('🔥 Hot');
  if (item.is_cold) tags.push('❄️ Cold');
  if (item.is_popular) tags.push('⭐ Popular');

  return (
    <div className="customer-card p-3 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-orange-500/30 border border-transparent group">
      {/* Image Area - 5:4 Aspect Ratio */}
      <div className="relative aspect-5-4 mb-3 rounded-lg overflow-hidden bg-gray-800">
        {item.image_url ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                <div className="text-4xl opacity-30">🍽️</div>
              </div>
            )}
            <img
              src={item.image_url}
              alt={item.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setImageLoading(false)}
              onError={(e) => {
                setImageError(true);
                setImageLoading(false);
                e.target.style.display = 'none';
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {imageError && !imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
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
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            {cartQuantity}
          </div>
        )}
      </div>

      {/* Tags - Orange Tinted with Emojis */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium backdrop-blur-sm"
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
      <div className="mt-auto">
        {cartQuantity > 0 ? (
          <div className="flex items-center justify-between bg-zinc-900/80 rounded-lg border border-orange-500/50 p-1 shadow-lg backdrop-blur-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQuantity(item.id, cartQuantity - 1);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 text-white hover:bg-zinc-700 active:scale-95 transition-all border border-white/5"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-white tabular-nums text-sm px-2">{cartQuantity}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQuantity(item.id, cartQuantity + 1);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-orange-500 text-white hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 hover:shadow-lg hover:shadow-orange-500/30 active:scale-95 transition-all duration-200 text-sm font-semibold"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuItem;
