// components/BrandsCarousel/BrandsCarousel.jsx
'use client';

import { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import './BrandsCarousel.css';

const BrandsCarousel = ({ brands = [] }) => {
  const locale = useLocale();
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: 'start',
      slidesToScroll: 1,
      skipSnaps: false,
      dragFree: false,
    },
    [
      Autoplay({ 
        delay: 3000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      })
    ]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = emblaApi.plugins()?.autoplay;
    if (!autoplay) return;

    // Auto-play starts automatically
  }, [emblaApi]);

  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <section className="brands-carousel-section">
      <div className="brands-carousel-container">
        <div className="brands-carousel-header">
          <h2 className="brands-carousel-title">
            <span className="material-symbols-sharp">storefront</span>
            Featured Brands
          </h2>
          <div className="brands-carousel-controls">
            <button 
              className="brands-carousel-btn brands-carousel-btn-prev" 
              onClick={scrollPrev}
              aria-label="Previous brands"
            >
              <span className="material-symbols-sharp">chevron_left</span>
            </button>
            <button 
              className="brands-carousel-btn brands-carousel-btn-next" 
              onClick={scrollNext}
              aria-label="Next brands"
            >
              <span className="material-symbols-sharp">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="brands-carousel-embla" ref={emblaRef}>
          <div className="brands-carousel-embla-container">
            {brands.map((brand) => (
              <div key={brand.id} className="brands-carousel-embla-slide">
                <Link 
                  href={`/${locale}/stores/${brand.slug}`}
                  className="brand-card"
                >
                  <div className="brand-card-logo-wrapper">
                    {brand.logo ? (
                      <Image
                        src={brand.logo}
                        alt={brand.name || 'Brand logo'}
                        width={120}
                        height={120}
                        className="brand-card-logo"
                        loading="lazy"
                      />
                    ) : (
                      <div className="brand-card-logo-placeholder">
                        <span className="material-symbols-sharp">store</span>
                      </div>
                    )}
                  </div>
                  <div className="brand-card-info">
                    <h3 className="brand-card-name">{brand.name}</h3>
                    {brand.activeVouchersCount > 0 && (
                      <span className="brand-card-vouchers">
                        {brand.activeVouchersCount} {brand.activeVouchersCount === 1 ? 'offer' : 'offers'}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandsCarousel;
