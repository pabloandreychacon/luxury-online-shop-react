import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import type { Product } from '../lib/types';
import { supabase } from '../lib/supabase';
import { defaultSettings } from '../data/settings';

export default function Shop() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('featured');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<number>(0);

  const category = searchParams.get('category');

  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
    }
  }, [category]);

  useEffect(() => {
    loadData();
  }, [i18n.language]);

  const loadData = async () => {
    // Load categories first
    const { data: categoriesData } = await supabase
      .from('Categories')
      .select('*')
      .eq('IdBusiness', defaultSettings.id)
      .eq('Active', true);

    setCategories(categoriesData || []);

    const { data: brandsData } = await supabase
      .from('Brands')
      .select('Id, Name, DisplayName')
      .eq('IdBusiness', defaultSettings.id)
      .eq('Active', true);
    setBrands(brandsData || []);

    // Then load products
    const { data: productsData } = await supabase
      .from('Products')
      .select('*')
      .eq('IdBusiness', defaultSettings.id)
      .eq('Active', true)

    if (productsData && categoriesData) {
      const productIds = productsData.map((p) => p.Id);
      const { data: translationsData } = await supabase
        .from('ProductTranslations')
        .select('ProductId, Language, Name, Description')
        .in('ProductId', productIds);

      const translationsMap: Record<number, Record<string, { Name: string; Description?: string }>> = {};
      (translationsData || []).forEach((t) => {
        const pid = t.ProductId;
        translationsMap[pid] = translationsMap[pid] || {};
        translationsMap[pid][t.Language] = { Name: t.Name, Description: t.Description };
      });
      const { data: mediaData } = await supabase
        .from('ProductMedia')
        .select('ProductId, MediaUrl, DisplayOrder')
        .in('ProductId', productIds)
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

      const mappedProducts: Product[] = productsData.map(p => {
        const cat = categoriesData.find(c => c.Id === p.CategoryId);
        // pick translation for current language, or first available
        const trs = translationsMap[p.Id] || {};
        const preferred = trs[i18n.language];
        const first = Object.values(trs)[0];
        return {
          id: String(p.Id),
          name: preferred?.Name || first?.Name || '',
          category: cat?.Name?.toLowerCase() || '',
          price: p.Price,
          image: mediaMap[p.Id] || p.ImageUrl || '',
          description: preferred?.Description || first?.Description || '',
          material: '',
          rating: 4.5,
          reviews: 0,
          brandId: p.BrandId || 0
        };
      });
      setProducts(mappedProducts);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by category if specified
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (selectedBrand) {
      filtered = filtered.filter(p => p.brandId === selectedBrand);
    }

    // Filter by price
    filtered = filtered.filter(p => p.price <= maxPrice);

    // Sort
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }, [products, selectedCategory, selectedBrand, maxPrice, sortBy]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-8 pb-20">
      <div className="container-luxury">
        {/* Header */}
        <div className="mb-12">
          <h1 className="section-title">{t('shop.title')}</h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            {category && `${t('shop.showing')} ${category.charAt(0).toUpperCase() + category.slice(1)}s - `}
            {filteredProducts.length} {t('shop.products')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="font-luxury text-lg mb-6">{t('shop.filters')}</h3>

              {/* Category Filter */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-4">{t('shop.category')}</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${selectedCategory === ''
                      ? 'bg-luxury-gold text-luxury-dark font-semibold'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    {t('shop.allProducts')}
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.Id}
                      onClick={() => setSelectedCategory(cat.Name.toLowerCase())}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition ${selectedCategory === cat.Name.toLowerCase()
                        ? 'bg-luxury-gold text-luxury-dark font-semibold'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                      {cat.DisplayName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-4">{t('product.brand')}</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedBrand(0)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${selectedBrand === 0
                      ? 'bg-luxury-gold text-luxury-dark font-semibold'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    {t('shop.allBrands')}
                  </button>
                  {brands.map(brand => (
                    <button
                      key={brand.Id}
                      onClick={() => setSelectedBrand(brand.Id)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition ${selectedBrand === brand.Id
                        ? 'bg-luxury-gold text-luxury-dark font-semibold'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                      {brand.DisplayName || brand.Name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-4">{t('shop.priceRange')}</label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {t('shop.upTo')} ${maxPrice.toLocaleString()}
                </p>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold mb-4">{t('shop.sortBy')}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                >
                  <option value="featured">{t('shop.featured')}</option>
                  <option value="price-low">{t('shop.priceLow')}</option>
                  <option value="price-high">{t('shop.priceHigh')}</option>
                  <option value="rating">{t('shop.highestRated')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 text-lg">{t('common.noResults')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
