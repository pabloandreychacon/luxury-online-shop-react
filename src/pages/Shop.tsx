import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import type { Product } from '../lib/types';
import { supabase } from '../lib/supabase';
import { defaultSettings } from '../data/settings';
import { Preloader } from 'luna-components-library';

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
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const category = searchParams.get('category');
  const brandParam = searchParams.get('brand');

  useEffect(() => {
    const initFromParams = async () => {
      if (category) {
        setSelectedCategory(category);
        const { data: cats } = await supabase
          .from('Categories')
          .select('Id, Name')
          .eq('IdBusiness', defaultSettings.id)
          .eq('Active', true);
        const match = (cats || []).find(c => c.Id.toString() === category || c.Name?.toLowerCase() === category);
        loadData(match ? Number(match.Id) : undefined, brandParam ? parseInt(brandParam) : undefined);
      } else {
        loadData(undefined, brandParam ? parseInt(brandParam) : undefined);
      }
      if (brandParam) setSelectedBrand(parseInt(brandParam));
    };
    initFromParams();
    setMounted(true);
  }, [category, brandParam]);

  useEffect(() => {
    if (!mounted) return;
    loadData();
  }, [i18n.language]);

  const loadData = async (categoryId?: number, brandId?: number) => {
    setLoading(true);
    // Load categories first
    const { data: categoriesData } = await supabase
      .from('Categories')
      .select('*')
      .eq('IdBusiness', defaultSettings.id)
      .eq('Active', true);

    const cats = (categoriesData || []).sort((a, b) => (a.DisplayName || a.Name || '').localeCompare(b.DisplayName || b.Name || ''));
    setCategories(cats);

    const { data: brandsData } = await supabase
      .from('Brands')
      .select('Id, Name, DisplayName')
      .eq('IdBusiness', defaultSettings.id)
      .eq('Active', true);
    setBrands((brandsData || []).sort((a, b) => (a.DisplayName || a.Name || '').localeCompare(b.DisplayName || b.Name || '')));

    const effectiveCategoryId = categoryId !== undefined ? categoryId : undefined;
    if (!category && !brandParam && categoryId === undefined) {
      setSelectedCategory('');
    }

    // Then load products
    let query = supabase.from('Products').select('*').eq('IdBusiness', defaultSettings.id).eq('Active', true);
    if (effectiveCategoryId) {
      query = query.eq('CategoryId', effectiveCategoryId);
    }
    if (brandId) {
      query = query.eq('BrandId', brandId);
    }
    if (!brandId) {
      query = query.order('Name', { ascending: true }).limit(100);
    }
    const { data: productsData } = await query;

    if (productsData && cats) {
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

      const brandMap: Record<number, string> = {};
      (brandsData || []).forEach((b: any) => { brandMap[b.Id] = b.DisplayName || b.Name; });

      const mappedProducts: Product[] = productsData.map(p => {
        const cat = categoriesData.find(c => c.Id === p.CategoryId);
        const trs = translationsMap[p.Id] || {};
        const tr = trs[i18n.language];
        return {
          id: String(p.Id),
          name: tr?.Name || p.Name || '',
          category: cat?.Name?.toLowerCase() || '',
          price: p.Price,
          image: mediaMap[p.Id] || p.ImageUrl || '',
          description: tr?.Description || p.Description || '',
          material: '',
          rating: 4.5,
          reviews: 0,
          brandId: p.BrandId || 0,
          brandName: brandMap[p.BrandId] || '',
          maxSellAllowed: (cat as any)?.MaxSellAllowed || 10,
          weight: (p as any)?.Weight || 0
        };
      });
      setProducts(mappedProducts);
    }
    setLoading(false);
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
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [products, selectedCategory, selectedBrand, maxPrice, sortBy]);

  if (loading) return <Preloader isLoading={loading} backgroundColor="#0f0f0f" accentColor="#d4af37" size={70} borderWidth={3} />;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      <div className="container-luxury">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start sticky top-20 z-10">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full mb-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              {t('shop.filters')}
              <span className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
            </button>
            <div className={`${showFilters ? 'fixed inset-x-0 top-20 bottom-0 z-20 bg-white dark:bg-gray-900 p-4 overflow-y-auto' : 'hidden'} lg:block lg:static lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0 lg:overflow-visible`}>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-luxury text-lg">{t('shop.filters')}</h3>
                  <button onClick={() => setShowFilters(false)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
                </div>

              {/* Category Filter */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-4">{t('shop.category')}</label>
                <select
                  className="w-full px-3 py-2 rounded text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  value={selectedCategory}
                  onChange={(e) => { const val = e.target.value; if (val === '') { setSelectedCategory(''); loadData(0, selectedBrand || undefined); } else { const cat = categories.find(c => c.Name.toLowerCase() === val); if (cat) { setSelectedCategory(val); loadData(Number(cat.Id), selectedBrand || undefined); } } setShowFilters(false); }}
                >
                  <option value="">{t('shop.allProducts')}</option>
                  {categories.map(cat => (
                    <option key={cat.Id} value={cat.Name.toLowerCase()}>{cat.DisplayName}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div className="mb-8">
                <label className="block text-sm font-semibold mb-4">{t('product.brand')}</label>
                <select
                  className="w-full px-3 py-2 rounded text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  value={selectedBrand}
                  onChange={(e) => { const val = parseInt(e.target.value); setSelectedBrand(val); const catId = selectedCategory ? categories.find(c => c.Name.toLowerCase() === selectedCategory)?.Id : undefined; loadData(catId ? Number(catId) : undefined, val || undefined); setShowFilters(false); }}
                >
                  <option value={0}>{t('shop.allBrands')}</option>
                  {brands.map(brand => (
                    <option key={brand.Id} value={brand.Id}>{brand.DisplayName || brand.Name}</option>
                  ))}
                </select>
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
                  onChange={(e) => { setSortBy(e.target.value); setShowFilters(false); }}
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
          </div>

        {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 text-lg">{t('common.noResults')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
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
