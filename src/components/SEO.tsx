import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  ogImage,
  canonical,
  noIndex = false
}) => {
  const { t } = useTranslation();
  const location = useLocation();

  // Default values
  const defaultTitle = t('siteTitle', 'Luxury Online Shop - Exclusive Deals on High-End Products');
  const defaultDescription = t('siteDescription', 'Discover the finest selection of luxury products at our online shop. From designer fashion to premium watches, we offer exclusive deals on high-end items. Shop now and experience unparalleled quality and service.');
  const defaultKeywords = 'luxury online shop, designer fashion, premium watches, exclusive deals, high-end products, luxury brands, shop now';
  const defaultOgImage = '/profile-img.jpg';

  const metaTitle = title || defaultTitle;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  const metaOgImage = ogImage || defaultOgImage;
  const metaCanonical = canonical || `${window.location.origin}${location.pathname}`;

  useEffect(() => {
    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: string) => {
      let tag: HTMLMetaElement | null = null;

      if (property) {
        tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      } else {
        tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      }

      if (!tag) {
        tag = document.createElement('meta');
        if (property) {
          tag.setAttribute('property', property);
        } else {
          tag.setAttribute('name', name);
        }
        document.head.appendChild(tag);
      }

      tag.setAttribute('content', content);
    };

    // Update or create link tags
    const updateLinkTag = (rel: string, href: string) => {
      let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

      if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        document.head.appendChild(tag);
      }

      tag.setAttribute('href', href);
    };

    // Update title
    document.title = metaTitle;

    // Basic Meta Tags
    updateMetaTag('description', metaDescription);
    updateMetaTag('keywords', metaKeywords);
    updateMetaTag('author', 'Luxury E-commerce Store');
    updateMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Canonical URL
    updateLinkTag('canonical', metaCanonical);

    // Open Graph / Facebook
    updateMetaTag('og:type', 'website', 'og:type');
    updateMetaTag('og:url', metaCanonical, 'og:url');
    updateMetaTag('og:title', metaTitle, 'og:title');
    updateMetaTag('og:description', metaDescription, 'og:description');
    updateMetaTag('og:image', metaOgImage, 'og:image');
    updateMetaTag('og:image:width', '1200', 'og:image:width');
    updateMetaTag('og:image:height', '630', 'og:image:height');

    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image', 'twitter:card');
    updateMetaTag('twitter:url', metaCanonical, 'twitter:url');
    updateMetaTag('twitter:title', metaTitle, 'twitter:title');
    updateMetaTag('twitter:description', metaDescription, 'twitter:description');
    updateMetaTag('twitter:image', metaOgImage, 'twitter:image');

    // Additional Meta Tags
    updateMetaTag('language', 'English');
    updateMetaTag('theme-color', '#0d6efd');

    // Structured Data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Luxury E-commerce Store",
      "url": metaCanonical,
      "image": metaOgImage,
      "description": metaDescription,
      "jobTitle": "Online Retailer",
      "knowsAbout": ["Luxury Products", "Designer Fashion", "Premium Watches", "Exclusive Deals"],
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Optional: cleanup if needed when component unmounts
    };
  }, [metaTitle, metaDescription, metaKeywords, metaOgImage, metaCanonical, noIndex, location.pathname]);

  return null; // This component doesn't render anything
};

export default SEO;
