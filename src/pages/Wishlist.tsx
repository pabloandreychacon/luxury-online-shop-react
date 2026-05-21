import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function Wishlist() {
  const { t } = useTranslation();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState<{ [key: string]: number }>({});

  const handleAddToCart = (productId: string) => {
    const product = wishlistItems.find(p => p.id === productId);
    if (product) {
      const qty = quantity[productId] || 1;
      addItem(product, qty);
      // Reset quantity after adding
      setQuantity(prev => ({ ...prev, [productId]: 1 }));
    }
  };

  const getQuantity = (productId: string) => {
    return quantity[productId] || 1;
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="container-luxury py-16">
        <div className="text-center">
          <Heart size={80} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
          <h1 className="text-3xl font-luxury mb-4 text-gray-900 dark:text-gray-100">
            {t('wishlist.title') || 'Your Wishlist'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('wishlist.empty') || 'Your wishlist is empty'}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-luxury-gold text-luxury-dark px-6 py-3 rounded font-semibold hover:bg-opacity-90 transition"
          >
            {t('shop.continueShopping') || 'Continue Shopping'} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-luxury py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-luxury-gold hover:text-opacity-80 transition mb-4"
        >
          <ArrowLeft size={20} />
          {t('common.back') || 'Back to Shop'}
        </Link>
        <h1 className="text-4xl font-luxury text-gray-900 dark:text-gray-100 mb-2">
          {t('wishlist.title') || 'My Wishlist'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} in your wishlist
        </p>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {wishlistItems.map(product => (
          <div key={product.id} className="card-luxury rounded-lg overflow-hidden group">
            {/* Image Container */}
            <Link
              to={`/product/${product.id}`}
              className="relative h-64 bg-gray-200 dark:bg-gray-800 overflow-hidden block"
            >
              {product.image?.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={product.image}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
              )}
              <button
                onClick={e => {
                  e.preventDefault();
                  removeFromWishlist(product.id);
                }}
                className="absolute top-4 right-4 p-2 bg-luxury-gold text-luxury-dark rounded-full shadow-lg hover:bg-opacity-90 transition"
              >
                <Heart size={20} fill="currentColor" />
              </button>
            </Link>

            {/* Content */}
            <div className="p-6">
              {/* Category & Rating */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-luxury-gold uppercase tracking-wider">
                  {product.category}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ⭐ {product.rating} ({product.reviews})
                </span>
              </div>

              {/* Name */}
              <h3 className="font-luxury text-lg mb-2 text-gray-900 dark:text-gray-100 line-clamp-2">
                {product.name}
              </h3>

              {/* Material */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {product.material}
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-luxury text-luxury-gold">
                  ${product.price.toFixed(2)}
                </span>
              </div>

              {/* Add to Cart */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={getQuantity(product.id)}
                  onChange={e => setQuantity(prev => ({ ...prev, [product.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-sm"
                />
                <button
                  onClick={() => handleAddToCart(product.id)}
                  className="flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 transition bg-luxury-gold text-luxury-dark hover:bg-opacity-90 font-semibold"
                >
                  <ShoppingBag size={16} />
                  {t('product.addToCart')}
                </button>
              </div>

              {/* View Details Link */}
              <Link
                to={`/product/${product.id}`}
                className="mt-3 block text-center text-sm text-luxury-gold hover:text-opacity-80 transition"
              >
                {t('shop.viewDetails')} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Link
          to="/shop"
          className="px-8 py-3 border-2 border-luxury-gold text-luxury-gold rounded font-semibold hover:bg-luxury-gold hover:text-luxury-dark transition"
        >
          {t('shop.continueShopping') || 'Continue Shopping'}
        </Link>
        <Link
          to="/cart"
          className="px-8 py-3 bg-luxury-gold text-luxury-dark rounded font-semibold hover:bg-opacity-90 transition"
        >
          {t('cart.viewCart') || 'View Cart'} →
        </Link>
      </div>
    </div>
  );
}
