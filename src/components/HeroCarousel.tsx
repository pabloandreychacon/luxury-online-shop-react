import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSettings, defaultSettings } from '../data/settings';
import { supabase } from '../lib/supabase';
import heroImage from '../assets/img/main-luxe-hero.jpg';

const isVideo = (url: string) => /\.mp4$/i.test(url);

const getCurrencySymbol = (currencyCode?: string) => {
  switch (currencyCode) {
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'USD':
    default:
      return '$';
  }
};

interface OfferProduct {
  Id: number;
  Name: string;
  Description: string;
  Price: number;
  ImageUrl: string;
  BrandId?: number;
  BrandName?: string;
}

const HeroCarousel = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<OfferProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const settings = await getSettings();
        setCurrencySymbol(getCurrencySymbol(settings?.currencyCode));

        const { data, error } = await supabase
          .from('Products')
          .select('Id, Name, Description, Price, ImageUrl, BrandId')
          .eq('IdBusiness', defaultSettings.id)
          .eq('Active', true)
          .eq('IsOffer', true)
          .limit(5);

        if (error) throw error;

        const slidesWithMedia = data || [];
        const productIds = slidesWithMedia.map((product) => product.Id);

        // Load brands
        const brandIds = [...new Set(slidesWithMedia.map(p => p.BrandId).filter(Boolean))];
        let brandMap: Record<number, string> = {};
        if (brandIds.length > 0) {
          const { data: brandsData } = await supabase.from('Brands').select('Id, DisplayName, Name').in('Id', brandIds);
          (brandsData || []).forEach((b: any) => { brandMap[b.Id] = b.DisplayName || b.Name; });
        }
        if (productIds.length > 0) {
          const { data: mediaData } = await supabase
            .from('ProductMedia')
            .select('ProductId, MediaUrl, DisplayOrder')
            .in('ProductId', productIds)
            .eq('IdBusiness', defaultSettings.id)
            .order('DisplayOrder', { ascending: true });

          const mediaMap: Record<number, string> = {};
          if (mediaData) {
            mediaData.forEach((media) => {
              const existing = mediaMap[media.ProductId];
              // prefer video over image
              if (!existing || (!isVideo(existing) && isVideo(media.MediaUrl))) {
                mediaMap[media.ProductId] = media.MediaUrl;
              }
            });
          }

          setSlides(slidesWithMedia
            .map((slide) => ({
              ...slide,
              ImageUrl: (mediaMap[slide.Id] || slide.ImageUrl || '').trim(),
              BrandName: brandMap[slide.BrandId] || ''
            }))
            .filter((slide) => slide.ImageUrl !== '')
          );
        } else {
          setSlides(slidesWithMedia
            .filter((slide) => (slide.ImageUrl || '').trim() !== '')
            .map(slide => ({ ...slide, BrandName: brandMap[slide.BrandId] || '' }))
          );
        }
      } catch (error) {
        console.error('Error loading hero carousel offers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading) {
    return (
      <section className="relative h-screen w-full flex items-center justify-center bg-luxury-dark text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold" />
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative h-screen bg-luxury-dark text-white flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center animate-zoom"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="container-luxury relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-luxury mb-6 text-luxury-gold">
            {t('hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
            {t('hero.cta')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black text-white">
      {slides.map((slide, index) => (
        <div
          key={slide.Id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
          {isVideo(slide.ImageUrl) ? (
            <video
              src={slide.ImageUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover object-center scale-105"
            />
          ) : (
            <img
              src={slide.ImageUrl || heroImage}
              alt={slide.Name}
              className="w-full h-full object-cover object-center scale-105 animate-slow-zoom"
            />
          )}
          <div className="absolute inset-0 z-20 flex items-center pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 border border-luxury-gold/30 px-3 py-1 rounded-sm bg-luxury-gold/10">
                  <span className="w-2 h-2 bg-luxury-gold animate-pulse rounded-full" />
                  <span className="text-[10px] font-bold tracking-widest text-luxury-gold uppercase">
                    Limited Offer
                  </span>
                </div>

                {slide.BrandName && (
                  <span className="text-sm font-semibold tracking-widest text-gray-300 uppercase">
                    {slide.BrandName}
                  </span>
                )}

                <h1 className="text-5xl md:text-7xl font-luxury font-semibold leading-tight tracking-tight uppercase">
                  {slide.Name}
                </h1>

                <p className="text-4xl font-luxury text-luxury-gold">
                  {currencySymbol}{slide.Price}
                </p>

                <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl leading-relaxed">
                  {slide.Description}
                </p>

                <div className="flex flex-wrap gap-4 pt-4 justify-center lg:justify-start">
                  <Link to={`/product/${slide.Id}`} className="btn-primary inline-flex items-center gap-2">
                    {t('hero.cta')}
                  </Link>
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-center">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-luxury-gold/20 blur-2xl group-hover:bg-luxury-gold/30 transition-all rounded-full" />
                  {isVideo(slide.ImageUrl) ? (
                    <video
                      src={slide.ImageUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="relative w-80 h-80 object-cover rounded-sm shadow-2xl border-4 border-gray-900 transform rotate-3 group-hover:rotate-0 transition-transform duration-500"
                    />
                  ) : (
                    <img
                      src={slide.ImageUrl || heroImage}
                      alt={slide.Name}
                      className="relative w-80 h-80 object-cover rounded-sm shadow-2xl border-4 border-gray-900 transform rotate-3 group-hover:rotate-0 transition-transform duration-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-8 right-8 z-30 flex gap-2">
        <button
          onClick={prevSlide}
          className="p-3 bg-gray-900/80 hover:bg-luxury-gold hover:text-black transition-all rounded-sm border border-white/10"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          className="p-3 bg-gray-900/80 hover:bg-luxury-gold hover:text-black transition-all rounded-sm border border-white/10"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1 transition-all duration-300 rounded-full ${index === currentSlide ? 'w-12 bg-luxury-gold' : 'w-6 bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
