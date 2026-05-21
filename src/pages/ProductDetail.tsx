import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { ShoppingBag, Heart, ArrowLeft, Share2, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import type { Product } from '../lib/types';
import { supabase } from '../lib/supabase';
import { defaultSettings } from '../data/settings';
import { useProductPriceLists } from '../hooks/useProductPriceLists';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [showAdded, setShowAdded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [mediaItems, setMediaItems] = useState<{ MediaUrl: string; isVideo: boolean }[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const priceListOptions = useProductPriceLists(id || '');
  const [selectedPriceListId, setSelectedPriceListId] = useState<number>(0);

  const effectivePrice = product
    ? (priceListOptions.find(o => o.id === selectedPriceListId)?.price ?? product.price)
    : 0;

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    const { data: productData } = await supabase
      .from('Products')
      .select('*')
      .eq('Id', id)
      .eq('IdBusiness', defaultSettings.id)
      .maybeSingle();

    if (productData) {
      const { data: categoryData } = await supabase
        .from('Categories')
        .select('*')
        .eq('Id', productData.CategoryId)
        .maybeSingle();

      // fetch translation for current language
      // fetch all translations for this product and pick preferred or first available
      const { data: trAll } = await supabase
        .from('ProductTranslations')
        .select('Language, Name, Description')
        .eq('ProductId', productData.Id);

      const trMap: Record<string, { Name: string; Description?: string }> = {};
      (trAll || []).forEach((r) => { trMap[r.Language] = { Name: r.Name, Description: r.Description }; });
      const preferred = trMap[i18n.language] || Object.values(trMap)[0];

      const mappedProduct: Product = {
        id: String(productData.Id),
        name: preferred?.Name || '',
        category: categoryData?.Name?.toLowerCase() || '',
        price: productData.Price,
        image: productData.ImageUrl,
        description: preferred?.Description || '',
        material: '',
        rating: 4.5,
        reviews: 0
      };

      setProduct(mappedProduct);

      await loadProductMedia(productData.Id, productData.ImageUrl);

      await loadRelatedProducts(productData.CategoryId, productData.Id);
    }
  };

  const loadProductMedia = async (productId: number, fallbackUrl?: string) => {
    try {
      const { data, error } = await supabase
        .from('ProductMedia')
        .select('MediaUrl, isVideo')
        .eq('ProductId', productId)
        .eq('IdBusiness', defaultSettings.id)
        .order('DisplayOrder', { ascending: true });

      if (error) {
        console.error('Error loading product media:', error);
        return;
      }

      if (data && data.length > 0) {
        setMediaItems(data.map((item) => ({ MediaUrl: item.MediaUrl, isVideo: item.isVideo })));
      } else if (fallbackUrl) {
        setMediaItems([{ MediaUrl: fallbackUrl, isVideo: false }]);
      } else {
        setMediaItems([]);
      }
      setActiveImageIndex(0);
    } catch (error) {
      console.error('Error loading product media:', error);
    }
  };

  const loadRelatedProducts = async (categoryId: number, currentProductId: number) => {
    const { data } = await supabase
      .from('Products')
      .select('*')
      .eq('IdBusiness', defaultSettings.id)
      .eq('CategoryId', categoryId)
      .eq('Active', true)
      .neq('Id', currentProductId)
      .limit(3);

    if (data) {
      const { data: categoryData } = await supabase
        .from('Categories')
        .select('*')
        .eq('Id', categoryId)
        .maybeSingle();

      const relatedProductIds = data.map((p) => p.Id);
      const { data: mediaData } = await supabase
        .from('ProductMedia')
        .select('ProductId, MediaUrl, DisplayOrder')
        .in('ProductId', relatedProductIds)
        .eq('IdBusiness', defaultSettings.id)
        .order('DisplayOrder', { ascending: true });

      const mediaMap: Record<number, string> = {};
      if (mediaData) {
        mediaData.forEach((media) => {
          if (!mediaMap[media.ProductId]) {
            mediaMap[media.ProductId] = media.MediaUrl;
          }
        });
      }

      // fetch translations for related products in current language
      const relatedIds = data.map((p) => p.Id);
      const { data: translations } = await supabase
        .from('ProductTranslations')
        .select('ProductId, Language, Name, Description')
        .in('ProductId', relatedIds);

      const trMap: Record<number, Record<string, { Name: string; Description?: string }>> = {};
      (translations || []).forEach((t) => {
        trMap[t.ProductId] = trMap[t.ProductId] || {};
        trMap[t.ProductId][t.Language] = { Name: t.Name, Description: t.Description };
      });

      const mapped: Product[] = data.map(p => {
        const trs = trMap[p.Id] || {};
        const preferred = trs[i18n.language] || Object.values(trs)[0];
        return {
          id: String(p.Id),
          name: preferred?.Name || '',
          category: categoryData?.Name?.toLowerCase() || '',
          price: p.Price,
          image: mediaMap[p.Id] || p.ImageUrl,
          description: preferred?.Description || '',
          material: '',
          rating: 4.5,
          reviews: 0
        };
      });
      setRelatedProducts(mapped);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-luxury mb-4">{t('common.notFound')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Product not found</p>
        <Link to="/shop" className="text-luxury-gold hover:text-opacity-80 transition">
          ← Back to Shop
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({ ...product, price: effectivePrice }, quantity);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
  };

  const handleFavorite = () => {
    if (product) {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product);
      }
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} - $${product.price.toFixed(2)}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  // Use loaded media or fallback to main image
  const displayMedia = mediaItems.length > 0
    ? mediaItems
    : product?.image
      ? [{ MediaUrl: product.image, isVideo: false }]
      : [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-luxury py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-luxury-gold hover:text-opacity-80 transition mb-4"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <nav className="text-sm text-gray-600 dark:text-gray-400">
            <Link to="/" className="hover:text-luxury-gold transition">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/shop" className="hover:text-luxury-gold transition">Shop</Link>
            <span className="mx-2">/</span>
            <span className="capitalize">{product.category}</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-gray-100 font-semibold">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-luxury py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            {/* Main Image */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4 aspect-square">
              {displayMedia[activeImageIndex]?.isVideo ? (
                <video
                  src={displayMedia[activeImageIndex].MediaUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={displayMedia[activeImageIndex]?.MediaUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Thumbnail Gallery */}
            {displayMedia.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {displayMedia.map((media, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition ${activeImageIndex === idx
                      ? 'border-luxury-gold'
                      : 'border-gray-300 dark:border-gray-700 hover:border-luxury-gold'
                      }`}
                  >
                    {media.isVideo ? (
                      <video src={media.MediaUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={media.MediaUrl} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Category & Rating */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-luxury-gold uppercase tracking-wider">
                {product.category}
              </span>
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">⭐ {product.rating}</span>
                  <span className="text-gray-600 dark:text-gray-400"> ({product.reviews} {t('product.reviews')})</span>
                </div>
                <button
                  onClick={handleFavorite}
                  className={`p-2 rounded-full transition ${product && isInWishlist(product.id)
                    ? 'bg-luxury-gold text-luxury-dark'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-luxury-gold hover:text-luxury-dark'
                    }`}
                >
                  <Heart size={20} fill={product && isInWishlist(product.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Product Name */}
            <h1 className="font-luxury text-4xl mb-2 text-gray-900 dark:text-gray-100">
              {product.name}
            </h1>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
              {product.description}
            </p>

            {/* Price */}
            <div className="mb-8">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('product.price')}</p>
              <p className="text-4xl font-luxury text-luxury-gold">
                ${effectivePrice.toFixed(2)}
              </p>
            </div>

            {/* Price List Selector */}
            {priceListOptions.length > 0 && (
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Price List
                </label>
                <select
                  value={selectedPriceListId}
                  onChange={(e) => setSelectedPriceListId(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:border-luxury-gold"
                >
                  <option value={0}>{t('product.price')} (base) — ${product?.price.toFixed(2)}</option>
                  {priceListOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label} — ${o.price.toFixed(2)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Stock Status removed - Active products are always available */}

            {/* Product Details */}
            <div className="space-y-4 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('product.material')}</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{product.material}</p>
              </div>
              {product.dimensions && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('product.dimensions')}</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{product.dimensions}</p>
                </div>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t('product.quantity')}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="w-20 px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-center"
                    disabled={false}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('product.maxPerOrder')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-4 px-6 rounded-lg flex items-center justify-center gap-3 font-semibold text-lg transition bg-luxury-gold text-luxury-dark hover:bg-opacity-90"
              >
                {showAdded ? (
                  <>
                    <Check size={24} />
                    {t('product.addedToCart')}
                  </>
                ) : (
                  <>
                    <ShoppingBag size={24} />
                    {t('product.addToCart')}
                  </>
                )}
              </button>

              <button onClick={handleShare} className="w-full py-4 px-6 rounded-lg border-2 border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-dark transition font-semibold flex items-center justify-center gap-2">
                <Share2 size={20} />
                {t('product.shareProduct')}
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 space-y-4 text-sm">
              <div className="flex items-start gap-4">
                {/* <div className="text-luxury-gold">✓</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Free Shipping</p>
                  <p className="text-gray-600 dark:text-gray-400">On orders over $100</p>
                </div> */}
              </div>
              <div className="flex items-start gap-4">
                <div className="text-luxury-gold">✓</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{t('product.easyReturns')}</p>
                  <p className="text-gray-600 dark:text-gray-400">{t('product.easyReturnsDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-luxury-gold">✓</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{t('product.originalProducts')}</p>
                  <p className="text-gray-600 dark:text-gray-400">{t('product.originalProductsDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-200 dark:border-gray-700">
            <h2 className="section-title mb-12">{t('product.relatedProducts')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedProducts.map(relProduct => (
                <Link
                  key={relProduct.id}
                  to={`/product/${relProduct.id}`}
                  className="group card-luxury rounded-lg overflow-hidden cursor-pointer"
                >
                  <div className="relative h-64 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <img
                      src={relProduct.image}
                      alt={relProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-luxury text-lg text-gray-900 dark:text-gray-100 mb-2">
                      {relProduct.name}
                    </h3>
                    <p className="text-2xl font-luxury text-luxury-gold">
                      ${relProduct.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
