// components/HeroCarousel/HeroCarousel.jsx
'use client';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { flushSync } from 'react-dom';
import './HeroCarousel.css';

/* ── inline SVG arrows ── */
const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/**
 * HeroCarousel - RetailMeNot Style with Side Peeking
 * 
 * Props (same as original):
 *   image        – cover image URL (required)
 *   logo         – store logo URL  (renders inside pill)
 *   name         – store name
 *   discount     – discount text
 *   ctaText      – link label
 *   ctaUrl       – link href
 *   description  – store description
 */
const HeroCarousel = ({
  images = [],
  locale = 'en-SA',
  autoplayDelay = 5000,
  showDots = true,
  showArrows = true,
}) => {
  const isRtl = locale.startsWith('ar');

  const autoplayRef = useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: false })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      direction: isRtl ? 'rtl' : 'ltr',
      align: 'center',
      dragFree: false,
      containScroll: false,
      startIndex: 1
    },
    [autoplayRef.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [prevIndex, setPrevIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);

  // Calculate prev and next indices
  useEffect(() => {
    if (!emblaApi || images.length <= 1) return;
    
    const total = images.length;
    const prev = selectedIndex === 0 ? total - 1 : selectedIndex - 1;
    const next = selectedIndex === total - 1 ? 0 : selectedIndex + 1;
    
    setPrevIndex(prev);
    setNextIndex(next);
  }, [selectedIndex, images.length, emblaApi]);

  // ── Navigation ────────────────────────────────────────
  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      autoplayRef.current.reset();
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      autoplayRef.current.reset();
    }
  }, [emblaApi]);

  const scrollTo = useCallback((index) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(index);
    autoplayRef.current.reset();
  }, [emblaApi]);

  // ── Selection sync ────────────────────────────────────
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    autoplayRef.current.reset();
  }, [emblaApi]);

  // ── Mount / event wiring ──────────────────────────────
  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // ── Early exit ────────────────────────────────────────
  if (!images || images.length === 0) {
    // Fallback default images if none provided
    const defaultImages = [
      {
        id: 1,
        image: '/hero/hero1.jpg',
        logo: '/stores/boohoo-logo.png',
        name: 'BoohooMAN',
        discount: 'Extra 15% Off',
        description: 'For RMN Shoppers',
        ctaText: 'SHOP NOW',
        ctaUrl: '#'
      },
      {
        id: 2,
        image: '/hero/hero2.jpg',
        logo: '/stores/nike-logo.png',
        name: 'Nike',
        discount: 'Up to 40% Off',
        description: 'Limited time offer on select styles',
        ctaText: 'EXPLORE DEALS',
        ctaUrl: '#'
      },
      {
        id: 3,
        image: '/hero/hero3.jpg',
        logo: '/stores/apple-logo.png',
        name: 'Apple',
        discount: 'Save on iPhone',
        description: 'Exclusive deals for members',
        ctaText: 'VIEW OFFERS',
        ctaUrl: '#'
      },
      {
        id: 4,
        image: '/hero/hero4.jpg',
        logo: '/stores/amazon-logo.png',
        name: 'Amazon',
        discount: 'Prime Day Deals',
        description: 'Early access for members',
        ctaText: 'SHOP DEALS',
        ctaUrl: '#'
      }
    ];
    return <HeroCarousel images={defaultImages} {...{ locale, autoplayDelay, showDots, showArrows }} />;
  }

  // Localised CTA default
  const defaultCta = isRtl ? 'تسوق الآن' : 'Shop Now';

  // Get slide className based on position
  const getSlideClassName = (index) => {
    if (index === selectedIndex) return 'is-active';
    if (index === prevIndex) return 'is-prev';
    if (index === nextIndex) return 'is-next';
    return '';
  };

  return (
    <div className="hc-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ── Embla viewport ── */}
      <div className="hc-embla" ref={emblaRef}>
        <div className="hc-embla__container">
          {images.map((item, index) => {
            const slideClass = getSlideClassName(index);
            const logo = item.logo;
            const name = item.name || '';
            const discount = item.discount || '';
            const description = item.description || '';
            const ctaText = item.ctaText || defaultCta;
            const ctaUrl = item.ctaUrl || '#';

            return (
              <div 
                key={item.id || index} 
                className={`hc-embla__slide ${slideClass}`}
              >
                <div className="hc-slide">

                  {/* Parallax image */}
                  <div className="hc-slide__parallax">
                    <div className="hc-slide__img-wrap">
                      <Image
                        src={item.image || item.coverImage}
                        alt={name || `Slide ${index + 1}`}
                        fill
                        priority={index === selectedIndex}
                        className="hc-slide__img"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={index === selectedIndex ? 90 : 70}
                      />
                    </div>
                  </div>

                  {/* Gradient overlay */}
                  <div className="hc-slide__overlay" />

                  {/* ── RetailMeNot Style Content Strip ── */}
                  <div className="hc-slide__content">
                    <div className="hc-content-wrapper">
                      
                      {/* Logo pill */}
                      <div className={`hc-logo-pill ${!logo ? 'hc-logo-pill--fallback' : ''}`}>
                        {logo ? (
                          <Image 
                            src={logo} 
                            alt={`${name} logo`} 
                            width={70} 
                            height={70} 
                            quality={90}
                            style={{ objectFit: 'contain' }}
                          />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Content details */}
                      <div className="hc-content-details">
                        {discount && (
                          <span className="hc-deal-badge">
                            <span className="material-symbols-sharp">local_offer</span>
                            {discount}
                          </span>
                        )}
                        
                        {name && <h2 className="hc-store-name">{name}</h2>}
                        
                        {description && <p className="hc-store-description">{description}</p>}
                        
                        <a 
                          href={ctaUrl} 
                          className="hc-cta" 
                          aria-label={`${ctaText} – ${name}`}
                          onClick={(e) => {
                            if (ctaUrl === '#') e.preventDefault();
                          }}
                        >
                          {ctaText}
                          <span className="material-symbols-sharp">
                            {isRtl ? 'arrow_back' : 'arrow_forward'}
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Controls layer ── */}
      <div className="hc-controls">

        {/* Nav arrows */}
        {showArrows && images.length > 1 && (
          <>
            <button 
              className="hc-nav hc-nav--prev" 
              onClick={scrollPrev} 
              aria-label={isRtl ? 'الشريحة السابقة' : 'Previous slide'}
            >
              {isRtl ? <ChevronRight /> : <ChevronLeft />}
            </button>
            <button 
              className="hc-nav hc-nav--next" 
              onClick={scrollNext} 
              aria-label={isRtl ? 'الشريحة التالية' : 'Next slide'}
            >
              {isRtl ? <ChevronLeft /> : <ChevronRight />}
            </button>
          </>
        )}

        {/* Progress dots */}
        {showDots && images.length > 1 && (
          <div className="hc-dots">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                className={`hc-dot ${index === selectedIndex ? 'is-active' : ''}`}
                onClick={() => scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              >
                <span className="hc-dot__track">
                  {index === selectedIndex && (
                    <span
                      className="hc-dot__progress"
                      style={{ animationDuration: `${autoplayDelay}ms` }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCarousel;
