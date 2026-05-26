import type { Product } from '../lib/types';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useState } from 'react';
import { useProductPriceLists } from '../hooks/useProductPriceLists';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [showAdded, setShowAdded] = useState(false);
  const inWishlist = isInWishlist(product.id);
  const priceListOptions = useProductPriceLists(product.id);
  const [selectedPriceListId, setSelectedPriceListId] = useState<number>(0);

  const effectivePrice = priceListOptions.find(o => o.id === selectedPriceListId)?.price ?? product.price;

  const handleAddToCart = () => {
    addItem({ ...product, price: effectivePrice }, quantity, selectedPriceListId);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
  };

  return (
    <div className="card-luxury rounded-lg overflow-hidden group">
      {/* Image Container */}
      <Link to={`/product/${product.id}`} className="relative h-80 bg-gray-200 dark:bg-gray-800 overflow-hidden block">
        {/\.mp4$/i.test(product.image) ? (
          <video
            src={product.image}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover cursor-pointer"
          />
        ) : (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-300 cursor-pointer"
          />
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (inWishlist) {
              removeFromWishlist(product.id);
            } else {
              addToWishlist(product);
            }
          }}
          className={`absolute top-4 right-4 p-2 rounded-full shadow-lg transition ${inWishlist
              ? 'bg-luxury-gold text-luxury-dark'
              : 'bg-white dark:bg-gray-800 hover:bg-luxury-gold text-gray-700 dark:text-gray-300'
            }`}
        >
          <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
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
        <h3 className="font-luxury text-lg mb-1 text-gray-900 dark:text-gray-100 line-clamp-2">
          {product.name}
        </h3>

        {/* Brand */}
        {product.brandName && (
          <p className="text-xs font-semibold tracking-widest text-luxury-gold/80 uppercase mb-2">
            {product.brandName}
          </p>
        )}

        {/* Material */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {product.material}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-luxury text-luxury-gold">
            ${effectivePrice.toFixed(2)}
          </span>
        </div>

        {/* Price List Selector */}
        {priceListOptions.length > 0 && (
          <select
            value={selectedPriceListId}
            onChange={(e) => setSelectedPriceListId(Number(e.target.value))}
            className="w-full mb-3 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-sm focus:outline-none focus:border-luxury-gold"
          >
            <option value={0}>{t('product.price')} (base)</option>
            {priceListOptions.map(o => (
              <option key={o.id} value={o.id}>{o.label} — ${o.price.toFixed(2)}</option>
            ))}
          </select>
        )}

        {/* Add to Cart */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max={product.maxSellAllowed || 10}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(product.maxSellAllowed || 10, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-sm"
          />
          <button
            onClick={handleAddToCart}
            className="flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 transition bg-luxury-gold text-luxury-dark hover:bg-opacity-90 font-semibold"
          >
            <ShoppingBag size={16} />
            {showAdded ? '✓' : t('product.addToCart')}
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
  );
}
