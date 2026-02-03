// components/HeroCarousel/HeroCarousel.jsx - Modern Minimalist Design
'use client';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import './HeroCarousel.css';

/* ── Arrow Icon ── */
const ArrowIcon = ({ direction = 'right' }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transform: direction === 'left' ? 'rotate(180deg)' : 'none' }}
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const HeroCarousel = ({
  images = [],
  locale = 'en-SA',
  autoplayDelay = 5000,
  showDots = true,
  showArrows = true,
}) => {
  const isRtl = locale.startsWith('ar');
  const autoplayRef = useRef(Autoplay({ 
    delay: autoplayDelay, 
    stopOnInteraction: false 
  }));
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      direction: isRtl ? 'rtl' : 'ltr',
      skipSnaps: false
    },
    [autoplayRef.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  // ── Navigation Logic ──
  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
    autoplayRef.current.reset();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
    autoplayRef.current.reset();
  }, [emblaApi]);
  
  const scrollTo = useCallback((index) => {
    emblaApi?.scrollTo(index);
    autoplayRef.current.reset();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!images || images.length === 0) return null;

  return (
    <section className="hc-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* ── Carousel Viewport ── */}
      <div className="hc-viewport" ref={emblaRef}>
        <div className="hc-container">
          {images.map((item, index) => {
            const isActive = index === selectedIndex;
            const ctaText = item.ctaText || (isRtl ? 'تسوق الآن' : 'Shop Now');
            const ctaUrl = item.ctaUrl || '#';
            const brandInitial = item.name ? item.name.charAt(0) : 'S';

            return (
              <div 
                key={item.id || index} 
                className={`hc-slide ${isActive ? 'is-active' : ''}`}
              >
                <div className="hc-slide-inner">
                  
                  {/* ── Background Image ── */}
                  <div className="hc-image-container">
                    <Image 
                      src={item.image} 
                      alt={item.name || "Promotion"} 
                      fill 
                      className="hc-img"
                      sizes="100vw"
                      priority={index === 0}
                      quality={90}
                    />
                  </div>

                  {/* ── Content Overlay ── */}
                  <div className="hc-content-overlay">
                    
                    {/* Logo Badge */}
                    {(item.logo || item.name) && (
                      <div className="hc-logo-badge">
                        {item.logo ? (
                          <Image 
                            src={item.logo} 
                            alt="Brand Logo" 
                            width={56} 
                            height={56}
                          />
                        ) : (
                          <span className="hc-logo-char">{brandInitial}</span>
                        )}
                      </div>
                    )}

                    {/* Text Content */}
                    <div className="hc-text-content">
                      <h2 className="hc-title">{item.name}</h2>
                      {item.description && (
                        <p className="hc-description">{item.description}</p>
                      )}
                      
                      {/* CTA Button */}
                      <a href={ctaUrl} className="hc-cta-button">
                        <span>{ctaText}</span>
                        <ArrowIcon direction={isRtl ? 'left' : 'right'} />
                      </a>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Navigation Controls ── */}
      
      {/* Arrows */}
      {showArrows && images.length > 1 && (
        <div className="hc-arrows">
          <button 
            onClick={scrollPrev} 
            className="hc-arrow hc-arrow--prev" 
            aria-label={isRtl ? 'التالي' : 'Previous'}
          >
            <ArrowIcon direction={isRtl ? 'right' : 'left'} />
          </button>
          <button 
            onClick={scrollNext} 
            className="hc-arrow hc-arrow--next" 
            aria-label={isRtl ? 'السابق' : 'Next'}
          >
            <ArrowIcon direction={isRtl ? 'left' : 'right'} />
          </button>
        </div>
      )}

      {/* Dot Indicators */}
      {showDots && images.length > 1 && (
        <div className="hc-dots">
          {scrollSnaps.map((_, idx) => (
            <button
              key={idx}
              className={`hc-dot ${idx === selectedIndex ? 'is-active' : ''}`}
              onClick={() => scrollTo(idx)}
              aria-label={`${isRtl ? 'انتقل إلى الشريحة' : 'Go to slide'} ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroCarousel;
