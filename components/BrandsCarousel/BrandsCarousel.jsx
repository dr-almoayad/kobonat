// components/BrandsCarousel/BrandsCarousel.jsx
'use client';

import { useEffect } from 'react';
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
        delay: 2500,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      })
    ]
  );

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
        <div className="brands-carousel-embla" ref={emblaRef}>
          <div className="brands-carousel-embla-container">
            {brands.map((brand) => (
              <div key={brand.id} className="brands-carousel-embla-slide">
                <Link 
                  href={`/${locale}/stores/${brand.slug}`}
                  className="brand-logo-link"
                  aria-label={brand.name}
                >
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt={brand.name || 'Brand logo'}
                      width={120}
                      height={80}
                      className="brand-logo"
                      loading="lazy"
                    />
                  ) : (
                    <div className="brand-logo-placeholder">
                      <span className="material-symbols-sharp">store</span>
                    </div>
                  )}
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
