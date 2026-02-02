// components/CategoryOfferBanners.jsx
'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import './CategoryOfferBanners.css';

export default function CategoryOfferBanners({ categorySlug, countryCode = 'SA' }) {
  const locale = useLocale();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch(
          `/api/category-banners?category=${categorySlug}&locale=${locale}&country=${countryCode}`
        );
        const data = await res.json();
        setBanners(data.banners || []);
      } catch (error) {
        console.error('Error fetching category banners:', error);
      } finally {
        setLoading(false);
      }
    }

    if (categorySlug) {
      fetchBanners();
    }
  }, [categorySlug, locale, countryCode]);

  const handleBannerClick = async (banner) => {
    // Track click
    try {
      await fetch('/api/category-banners/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerId: banner.id })
      });
    } catch (error) {
      console.error('Error tracking banner click:', error);
    }

    // Open URL
    if (banner.url) {
      window.open(banner.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="category-banners-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!banners.length) {
    return null;
  }

  return (
    <section className="category-offer-banners">
      <div className="container">
        <div className="banners-grid">
          {banners.map((banner, index) => {
            // Determine layout class based on position
            const layoutClass = index === 0 && banners.length > 1 ? 'banner-large' : 'banner-small';
            
            return (
              <div
                key={banner.id}
                className={`offer-banner ${layoutClass}`}
                onClick={() => handleBannerClick(banner)}
                style={{ 
                  backgroundColor: banner.backgroundColor || '#f3f4f6'
                }}
              >
                <div className="banner-content">
                  {banner.image && (
                    <div className="banner-image-container">
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="banner-image"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="banner-text">
                    {banner.tag && (
                      <span className="banner-tag">{banner.tag}</span>
                    )}
                    
                    <h3 className="banner-title">{banner.title}</h3>
                    
                    {banner.description && (
                      <p className="banner-description">{banner.description}</p>
                    )}

                    {banner.discount && (
                      <div className="banner-discount">
                        {banner.discount}
                      </div>
                    )}

                    <button className="banner-cta">
                      <span>{banner.ctaText || (locale.startsWith('ar') ? 'تسوق الآن' : 'Shop Now')}</span>
                      <span className="material-symbols-sharp">
                        {locale.startsWith('ar') ? 'arrow_back' : 'arrow_forward'}
                      </span>
                    </button>
                  </div>
                </div>

                {banner.expiryDate && (
                  <div className="banner-expiry">
                    <span className="material-symbols-sharp">schedule</span>
                    {locale.startsWith('ar') ? 'ينتهي' : 'Ends'}: {new Date(banner.expiryDate).toLocaleDateString(locale)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
