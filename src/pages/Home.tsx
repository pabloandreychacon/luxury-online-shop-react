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

export default function Home() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
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
            taxes: productData.Taxes || 0
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

        {/* Categories Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container-luxury">
            <h2 className="section-title">{t('shop.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.map((category) => (
                <Link
                  key={category.Id}
                  to={`/shop?category=${category.Name.toLowerCase()}`}
                  className="group relative h-96 rounded-lg overflow-hidden cursor-pointer bg-luxury-charcoal dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-luxury-gold transition-all duration-300"
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
