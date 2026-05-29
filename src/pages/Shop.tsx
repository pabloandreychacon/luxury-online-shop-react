import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductFilters from '../components/ProductFilters';
import type { Product } from '../lib/types';
import { supabase } from '../lib/supabase';
import { defaultSettings } from '../data/settings';
import { Preloader } from 'luna-components-library';

export default function Shop() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('name');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedBrand, setSelectedBrand] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchName, setSearchName] = useState('');

  const category = searchParams.get('category');
  const brandParam = searchParams.get('brand');

  useEffect(() => {
    const initFromParams = async () => {
      if (category) {
        const catId = parseInt(category);
        if (!isNaN(catId)) {
          setSelectedCategory(catId);
          loadData(catId, brandParam ? parseInt(brandParam) : undefined);
        } else {
          const { data: cats } = await supabase
            .from('Categories')
            .select('Id, Name')
            .eq('IdBusiness', defaultSettings.id)
            .eq('Active', true);
          const match = (cats || []).find(c => c.Name?.toLowerCase() === category);
          if (match) {
            const id = Number(match.Id);
            setSelectedCategory(id);
            loadData(id, brandParam ? parseInt(brandParam) : undefined);
          }
        }
      } else {
        const brandId = brandParam ? parseInt(brandParam) : 3;
        setSelectedCategory(111);
        setSelectedBrand(brandId);
        loadData(111, brandId);
      }
    };
    initFromParams();
    setMounted(true);
  }, [category, brandParam]);

  useEffect(() => {
    if (!mounted) return;
    loadData(selectedCategory || undefined, selectedBrand || undefined, searchName);
  }, [i18n.language]);

  const loadData = async (categoryId?: number, brandId?: number, search?: string) => {
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

    // Then load products
    let query = supabase.from('Products').select('*').eq('IdBusiness', defaultSettings.id).eq('Active', true);
    if (effectiveCategoryId) {
      query = query.eq('CategoryId', effectiveCategoryId);
    }
    if (brandId) {
      query = query.eq('BrandId', brandId);
    }
    if (search) {
      query = query.ilike('Name', `%${search}%`);
    }
    if (!effectiveCategoryId && !brandId && !search) {
      query = query.order('Name', { ascending: true });
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
          weight: (p as any)?.Weight || 0,
          discountPercent: (p as any)?.DiscountPercent || 0,
          discountMinQuantity: (p as any)?.DiscountMinQuantity || 1,
        };
      });
      setProducts(mappedProducts);
    }
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
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
  }, [products, sortBy]);

  if (loading) return <Preloader isLoading={loading} backgroundColor="#0f0f0f" accentColor="#d4af37" size={70} borderWidth={3} />;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      <div className="container-luxury space-y-6">
        <ProductFilters
          categories={categories}
          brands={brands}
          filterCategory={selectedCategory}
          filterBrand={selectedBrand}
          searchName={searchName}
          onCategoryChange={(val) => { setSelectedCategory(val); loadData(val || undefined, selectedBrand || undefined, searchName); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onBrandChange={(val) => { setSelectedBrand(val); loadData(selectedCategory || undefined, val || undefined, searchName); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onSearchChange={(val) => { setSearchName(val); loadData(selectedCategory || undefined, selectedBrand || undefined, val); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onCloseFilters={() => setShowFilters(false)}
        >
          <div className="flex-1 min-w-32">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('shop.sortBy')}</label>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setShowFilters(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">
              <option value="name">{t('common.name')}</option>
              <option value="price-low">{t('shop.priceLow')}</option>
              <option value="price-high">{t('shop.priceHigh')}</option>
              <option value="rating">{t('shop.highestRated')}</option>
            </select>
          </div>
        </ProductFilters>

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
  );
}
