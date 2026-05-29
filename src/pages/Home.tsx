import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { defaultSettings } from '../data/settings';
import HeroCarousel from '../components/HeroCarousel';
import ProductCard from '../components/ProductCard';
import type { Product } from '../lib/types';
import SEO from '../components/SEO';

interface Category {
  Id: string;
  Name: string;
  DisplayName: string;
  Active: boolean;
}

interface Brand {
  Id: string;
  Name: string;
  DisplayName: string;
  BrandImage?: string;
}

export default function Home() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: categoriesData } = await supabase
      .from('Categories')
      .select('*')
      .eq('IdBusiness', defaultSettings.id)
      .eq('Active', true);
    setCategories(categoriesData || []);

    const { data: brandsData } = await supabase
      .from('Brands')
      .select('Id, Name, DisplayName, BrandImage')
      .eq('IdBusiness', defaultSettings.id)
      .eq('Active', true);
    setBrands(brandsData || []);

    if (categoriesData) {
      const featuredProducts: Product[] = [];

      for (const category of categoriesData) {
        const { data: productData } = await supabase
          .from('Products')
          .select('*')
          .eq('IdBusiness', defaultSettings.id)
          .eq('CategoryId', category.Id)
          .eq('Active', true)
          .limit(1)
          .maybeSingle();

        if (productData) {
          let imageUrl = productData.ImageUrl || '';
          const { data: mediaData } = await supabase
            .from('ProductMedia')
            .select('MediaUrl')
            .eq('ProductId', productData.Id)
            .eq('IdBusiness', defaultSettings.id)
            .order('DisplayOrder', { ascending: true })
            .limit(1);

          if (mediaData && mediaData.length > 0) {
            imageUrl = mediaData[0].MediaUrl;
          }

          featuredProducts.push({
            id: String(productData.Id),
            name: productData.Name,
            category: category.Name?.toLowerCase() || '',
            price: productData.Price,
            image: imageUrl,
            description: productData.Description,
            material: '',
            rating: 4.5,
            reviews: 0,
            taxes: productData.Taxes || 0,
            maxSellAllowed: (category as any).MaxSellAllowed || 10,
            weight: (productData as any)?.Weight || 0,
            discountPercent: (productData as any)?.DiscountPercent || 0,
            discountMinQuantity: (productData as any)?.DiscountMinQuantity || 1,
          });
        }
      }

      setProducts(featuredProducts);
    }
  };

  return (
    <>
      <SEO title="Luxury E-commerce Store" description="Discover premium luxury products at competitive prices." keywords="luxury, e-commerce, premium products, fashion, watches" />
      <div>
        <HeroCarousel />

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-luxury-dark via-gray-900 to-luxury-dark border-y border-luxury-gold/20">
          <div className="container-luxury py-6">
            <div className="space-y-2 text-center text-sm md:text-base text-gray-300 leading-relaxed">
              <p>{t('home.bannerLine1')}</p>
              <p>{t('home.bannerLine2')}</p>
              <p>{t('home.bannerLine3')}</p>
            </div>
          </div>
        </div>

        {/* Brands Section */}
        {brands.length > 0 && (
          <section className="py-20 bg-gray-50 dark:bg-gray-800">
            <div className="container-luxury">
              <h2 className="section-title">{t('admin.brands')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {brands.map((brand) => (
                  <Link
                    key={brand.Id}
                    to={`/shop?brand=${brand.Id}`}
                    className="group relative h-36 rounded-lg overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-luxury-gold transition-all duration-300"
                  >
                    {brand.BrandImage ? (
                      <>
                        <img src={brand.BrandImage} alt={brand.DisplayName}
                          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-300" />
                        <div className="absolute inset-0 bg-luxury-dark/50" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-luxury-charcoal dark:bg-gray-800" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <h3 className="text-xl font-luxury text-luxury-gold text-center group-hover:scale-110 transition duration-300">
                        {brand.DisplayName || brand.Name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container-luxury">
            <h2 className="section-title">{t('shop.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.map((category) => (
                <Link
                  key={category.Id}
                  to={`/shop?category=${category.Name.toLowerCase()}`}
                  className="group relative h-32 rounded-lg overflow-hidden cursor-pointer bg-luxury-charcoal dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-luxury-gold transition-all duration-300"
                >
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <h3 className="text-3xl font-luxury text-luxury-gold group-hover:scale-110 transition duration-300">
                      {category.DisplayName}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>


        {/* Products Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container-luxury">
            <h2 className="section-title">{t('home.featuredProducts')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
                {t('home.viewAllProducts')} <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container-luxury">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="font-luxury text-xl mb-2">{t('home.premiumQuality')}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('home.premiumQualityDesc')}
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🚚</div>
                <h3 className="font-luxury text-xl mb-2">{t('home.fastShipping')}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('home.fastShippingDesc')}
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="font-luxury text-xl mb-2">{t('home.secureCheckout')}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('home.secureCheckoutDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
