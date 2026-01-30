// components/BrandsCarousel/BrandsCarousel.jsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import './BrandsCarousel.css';

const BrandsCarousel = ({ brands = [], title, subtitle, showControls = false }) => {
  const locale = useLocale();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const autoplayRef = useRef(null);

  // Initialize Embla with autoplay
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      slidesToScroll: 1,
      skipSnaps: false,
      dragFree: false,
      containScroll: 'trimSnaps',
      speed: 12,
    },
    [
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        playOnInit: true,
      })
    ]
  );

  // Track scroll progress
  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
    setScrollProgress(progress * 100);
  }, [emblaApi]);

  // Track selected slide
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Setup event listeners
  useEffect(() => {
    if (!emblaApi) return;

    autoplayRef.current = emblaApi.plugins()?.autoplay;
    
    emblaApi.on('select', onSelect);
    emblaApi.on('scroll', onScroll);
    onSelect();
    onScroll();

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('scroll', onScroll);
    };
  }, [emblaApi, onSelect, onScroll]);

  // Navigation handlers
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  // Handle mouse enter/leave for autoplay control
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (autoplayRef.current) {
      autoplayRef.current.stop();
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (autoplayRef.current) {
      autoplayRef.current.play();
    }
  }, []);

  // Early return if no brands
  if (!brands || brands.length === 0) {
    return null;
  }

  // Calculate if we should show navigation
  const canScrollPrev = emblaApi?.canScrollPrev() ?? false;
  const canScrollNext = emblaApi?.canScrollNext() ?? false;
  const shouldShowNav = showControls && brands.length > 3;

  return (
    <section className="brands-carousel-section">
      <div className="brands-carousel-wrapper">
        {/* Header Section */}
        {(title || subtitle) && (
          <div className="brands-carousel-header">
            {subtitle && (
              <span className="brands-carousel-subtitle">
                {subtitle}
              </span>
            )}
            {title && (
              <h2 className="brands-carousel-title">
                {title}
              </h2>
            )}
          </div>
        )}

        {/* Carousel Container */}
        <div className="brands-carousel-container">
          {/* Gradient Overlays */}
          <div 
            className="brands-carousel-gradient brands-carousel-gradient-left"
            aria-hidden="true"
          />
          <div 
            className="brands-carousel-gradient brands-carousel-gradient-right"
            aria-hidden="true"
          />

          {/* Navigation Buttons */}
          {shouldShowNav && (
            <>
              <button
                className={`brands-carousel-nav brands-carousel-nav-prev ${
                  !canScrollPrev ? 'brands-carousel-nav-disabled' : ''
                }`}
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                aria-label="Previous brands"
                type="button"
              >
                <span className="material-symbols-sharp">chevron_left</span>
              </button>
              <button
                className={`brands-carousel-nav brands-carousel-nav-next ${
                  !canScrollNext ? 'brands-carousel-nav-disabled' : ''
                }`}
                onClick={scrollNext}
                disabled={!canScrollNext}
                aria-label="Next brands"
                type="button"
              >
                <span className="material-symbols-sharp">chevron_right</span>
              </button>
            </>
          )}

          {/* Embla Viewport */}
          <div 
            className="brands-carousel-embla"
            ref={emblaRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="brands-carousel-embla-container">
              {brands.map((brand, index) => (
                <div
                  key={brand.id || index}
                  className={`brands-carousel-embla-slide ${
                    index === selectedIndex ? 'is-active' : ''
                  }`}
                >
                  <Link
                    href={`/${locale}/brands/${brand.slug}`}
                    className="brand-logo-link"
                    aria-label={`View ${brand.name} products`}
                  >
                    <div className="brand-logo-wrapper">
                      {brand.logo ? (
                        <>
                          <Image
                            src={brand.logo}
                            alt={brand.name}
                            width={180}
                            height={90}
                            className="brand-logo"
                            loading="lazy"
                            quality={85}
                          />
                          <div className="brand-logo-shine" aria-hidden="true" />
                        </>
                      ) : (
                        <div className="brand-logo-placeholder">
                          <span className="material-symbols-sharp">store</span>
                          <span className="brand-placeholder-text">{brand.name}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar 
          <div className="brands-carousel-progress-container">
            <div 
              className="brands-carousel-progress-bar"
              style={{ width: `${scrollProgress}%` }}
              aria-hidden="true"
            />
          </div>*/}

          {/* Dots Navigation */}
          {brands.length <= 10 && (
            <div className="brands-carousel-dots">
              {brands.map((_, index) => (
                <button
                  key={index}
                  className={`brands-carousel-dot ${
                    index === selectedIndex ? 'is-active' : ''
                  }`}
                  onClick={() => scrollTo(index)}
                  aria-label={`Go to brand ${index + 1}`}
                  aria-current={index === selectedIndex ? 'true' : 'false'}
                  type="button"
                />
              ))}
            </div>
          )}
        </div>

        {/* Hover State Indicator */}
        {isHovered && (
          <div className="brands-carousel-pause-indicator">
            <span className="material-symbols-sharp">pause</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default BrandsCarousel;
