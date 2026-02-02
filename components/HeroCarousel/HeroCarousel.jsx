// components/HeroCarousel/HeroCarousel.jsx
'use client';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { flushSync } from 'react-dom';
import './HeroCarousel.css';

/* ── Global SVG Defs for Squircle Clip ── */
const SquircleDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
    <defs>
      <clipPath id="SquircleClip-3" clipPathUnits="objectBoundingBox">
        <path d="M 0,0.5 C 0,0.115  0.115,0  0.5,0 0.885,0  1,0.115  1,0.5 1,0.885  0.885,1  0.5,1 0.115,1  0,0.885  0,0.5" />
      </clipPath>
    </defs>
  </svg>
);

const ChevronLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
);
const ChevronRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
);

const HeroCarousel = ({
  images = [],
  locale = 'en-SA',
  autoplayDelay = 6000,
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

  // ── Navigation ────────────────────────────────────────
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
    <div className="hc-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Inject Clip Path Definition */}
      <SquircleDefs />

      <div className="hc-viewport" ref={emblaRef}>
        <div className="hc-container">
          {images.map((item, index) => {
            const isActive = index === selectedIndex;
            const ctaText = item.ctaText || (isRtl ? 'اكتشف المزيد' : 'Shop Collection');

            return (
              <div key={item.id || index} className={`hc-slide ${isActive ? 'is-active' : ''}`}>
                
                {/* 1. Blurred Backdrop */}
                <div className="hc-slide__backdrop">
                  <Image 
                    src={item.image} 
                    alt="" 
                    fill 
                    className="hc-backdrop-img"
                    sizes="100vw"
                    priority={index === 0}
                  />
                  <div className="hc-backdrop-overlay" />
                </div>

                {/* 2. Main Content Grid */}
                <div className="hc-content-grid">
                  
                  {/* Left Column: Branding (Logo + Badge) */}
                  <div className="hc-col-brand">
                    <div className="hc-brand-wrapper">
                      {item.logo && (
                        <div className="hc-logo-frame">
                          <Image src={item.logo} alt={item.name} width={60} height={60} className="hc-logo-img" />
                        </div>
                      )}
                      {item.discount && (
                        <span className="hc-discount-tag">{item.discount}</span>
                      )}
                    </div>
                  </div>

                  {/* Center Column: Squircle Image */}
                  <div className="hc-col-visual">
                    <div className="hc-squircle-frame">
                      <Image 
                        src={item.image} 
                        alt={item.name} 
                        fill 
                        className="hc-squircle-img"
                        sizes="(max-width: 768px) 90vw, 400px"
                        priority={index === 0}
                      />
                      {/* Inner border shine effect */}
                      <div className="hc-squircle-shine" />
                    </div>
                  </div>

                  {/* Right Column: Text & CTA */}
                  <div className="hc-col-info">
                    <div className="hc-info-wrapper">
                      <h2 className="hc-headline">{item.name}</h2>
                      <a href={item.ctaUrl || '#'} className="hc-cta-btn">
                        {ctaText}
                        <span className="material-symbols-sharp arrow-icon">
                          {isRtl ? 'arrow_back' : 'arrow_forward'}
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

      {/* Controls */}
      <div className="hc-controls">
        {showArrows && (
          <div className="hc-arrows">
            <button onClick={scrollPrev} className="hc-nav-btn" aria-label="Previous">
              {isRtl ? <ChevronRight /> : <ChevronLeft />}
            </button>
            <button onClick={scrollNext} className="hc-nav-btn" aria-label="Next">
              {isRtl ? <ChevronLeft /> : <ChevronRight />}
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
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCarousel;
