// components/HeroCarousel/HeroCarousel.jsx
'use client';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import './HeroCarousel.css';

/* ── Inline SVG Definitions ── */
const CarouselDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
    <defs>
      {/* The Requested Squircle Shape */}
      <clipPath id="SquircleClip-Hero" clipPathUnits="objectBoundingBox">
        <path d="M 0,0.5 C 0,0.115  0.115,0  0.5,0 0.885,0  1,0.115  1,0.5 1,0.885  0.885,1  0.5,1 0.115,1  0,0.885  0,0.5" />
      </clipPath>
    </defs>
  </svg>
);

/* ── Icons ── */
const ArrowIcon = ({ direction = 'right' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: direction === 'left' ? 'rotate(180deg)' : 'none' }}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const HeroCarousel = ({
  images = [],
  locale = 'en-SA',
  autoplayDelay = 5500,
  showDots = true,
  showArrows = true,
}) => {
  const isRtl = locale.startsWith('ar');
  const autoplayRef = useRef(Autoplay({ delay: autoplayDelay, stopOnInteraction: false }));
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, direction: isRtl ? 'rtl' : 'ltr' },
    [autoplayRef.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  // ── Navigation Logic ──
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index) => {
    emblaApi?.scrollTo(index);
    autoplayRef.current.reset();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    autoplayRef.current.reset();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!images.length) return null;

  return (
    <section className="hc-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      <CarouselDefs />

      <div className="hc-viewport" ref={emblaRef}>
        <div className="hc-container">
          {images.map((item, index) => {
            const isActive = index === selectedIndex;
            // Default Text Handling
            const ctaText = item.ctaText || (isRtl ? 'تسوق المجموعة' : 'Explore Collection');
            const ctaUrl = item.ctaUrl || '#';
            const brandInitial = item.name ? item.name.charAt(0) : 'S';

            return (
              <div key={item.id || index} className={`hc-slide ${isActive ? 'is-active' : ''}`}>
                <div className="hc-slide-inner">
                  
                  {/* ── 1. The Visual Stage (Center) ── */}
                  <div className="hc-visual-stage">
                    <div className="hc-squircle-mask">
                      <Image 
                        src={item.image} 
                        alt={item.name || "Cover"} 
                        fill 
                        className="hc-img"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority={index === 0}
                      />
                      {/* Subtle inner shadow overlay for depth inside the shape */}
                      <div className="hc-img-vignette" />
                    </div>
                  </div>

                  {/* ── 2. The Text Overlay (Magazine Style) ── */}
                  <div className="hc-content-layer">
                    
                    {/* Top Left: Floating Logo Pill */}
                    <div className="hc-brand-pill">
                      {item.logo ? (
                        <Image src={item.logo} alt="Logo" width={32} height={32} className="hc-brand-logo" />
                      ) : (
                        <span className="hc-brand-char">{brandInitial}</span>
                      )}
                      <span className="hc-brand-name">{item.name}</span>
                    </div>

                    {/* Left/Bottom: Massive Headline */}
                    <div className="hc-headline-wrap">
                      <h2 className="hc-headline">
                        {item.name}
                        {item.discount && <span className="hc-headline-highlight">{item.discount}</span>}
                      </h2>
                    </div>

                    {/* Right/Bottom: Call to Action */}
                    <div className="hc-cta-wrap">
                       <a href={ctaUrl} className="hc-cta-button">
                          <span>{ctaText}</span>
                          <span className="hc-cta-icon">
                            <ArrowIcon direction={isRtl ? 'left' : 'right'} />
                          </span>
                       </a>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Minimal Controls ── */}
      <div className="hc-ui-layer">
        {showArrows && (
          <div className="hc-arrows">
            <button onClick={scrollPrev} className="hc-arrow hc-arrow--prev" aria-label="Previous">
               <ArrowIcon direction={isRtl ? 'right' : 'left'} />
            </button>
            <button onClick={scrollNext} className="hc-arrow hc-arrow--next" aria-label="Next">
               <ArrowIcon direction={isRtl ? 'left' : 'right'} />
            </button>
          </div>
        )}

        {showDots && (
          <div className="hc-dots">
            {scrollSnaps.map((_, idx) => (
              <button
                key={idx}
                className={`hc-dot ${idx === selectedIndex ? 'is-active' : ''}`}
                onClick={() => scrollTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              >
                <span className="hc-dot-bar" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroCarousel;
