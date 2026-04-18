/* components/HeroCuratedCarousel/HeroCuratedCarousel.jsx */
'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import './HeroCuratedCarousel.css';

// Helper: generate discount percent
function getDiscountPercent(originalPrice, currentPrice) {
  if (originalPrice && currentPrice && originalPrice > currentPrice) {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
  return null;
}

function LogoBadge({ logo, name }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';
  return (
    <div className="hcc-badge" aria-hidden="true">
      {logo ? (
        <img src={logo} alt={name} className="hcc-badge-img" />
      ) : (
        <span className="hcc-badge-initials">{initials}</span>
      )}
    </div>
  );
}

function SaleBadge({ discountPercent, badgeText, isUrgent = false }) {
  let content = badgeText || 'SALE';
  if (discountPercent && discountPercent > 0) {
    content = `-${discountPercent}%`;
  }
  return (
    <div className={`hcc-sale-badge ${isUrgent ? 'hcc-sale-badge--urgent' : ''}`}>
      {content}
    </div>
  );
}

function HeroSlide({ slide, isAr, isActive }) {
  const discountPercent = getDiscountPercent(slide.originalPrice, slide.currentPrice);
  const hasPriceInfo = slide.currentPrice !== undefined;
  
  const formatPrice = (price) => {
    if (price === undefined) return '';
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link href={slide.ctaUrl || '#'} className="hcc-slide-card" aria-label={slide.title}>
      {/* Background Image Panel */}
      <div className="hcc-img-panel">
        <img src={slide.offerImage} alt={slide.title} className="hcc-img" draggable={false} />
        <div className="hcc-img-overlay" />
      </div>

      {/* Sale Badge */}
      <SaleBadge 
        discountPercent={discountPercent} 
        badgeText={slide.discountBadge} 
        isUrgent={slide.isUrgent} 
      />

      {/* Store Logo */}
      <LogoBadge logo={slide.storeLogo} name={slide.storeName} />
      
      {/* Text Panel */}
      <div className="hcc-text-panel">
        <h2 className="hcc-headline">{slide.title}</h2>
        {slide.storeName && (
          <p className="hcc-store-name">
            {isAr ? `في ` : `at `} <strong>{slide.storeName}</strong>
          </p>
        )}
        
        {/* Price & Discount Row */}
        {hasPriceInfo && (
          <div className="hcc-price-row">
            <span className="hcc-price-current">{formatPrice(slide.currentPrice)}</span>
            {slide.originalPrice && slide.originalPrice > slide.currentPrice && (
              <>
                <span className="hcc-price-original">{formatPrice(slide.originalPrice)}</span>
                {discountPercent && <span className="hcc-discount-percent">-{discountPercent}%</span>}
              </>
            )}
          </div>
        )}
        
        <div className="hcc-cta-wrapper">
          <span className="hcc-cta">
            {slide.ctaText || (isAr ? 'اشتر الآن' : 'SHOP NOW')}
            <span className="material-symbols-sharp">
              {isAr ? 'arrow_left_alt' : 'arrow_right_alt'}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HeroCuratedCarousel({ slides, locale }) {
  const isAr = locale?.split('-')[0] === 'ar';

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    direction: isAr ? 'rtl' : 'ltr',
  });

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const sync = useCallback((api) => {
    setSelectedIdx(api.selectedScrollSnap());
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    sync(emblaApi);
    emblaApi.on('select', () => sync(emblaApi));
    emblaApi.on('reInit', () => sync(emblaApi));
  }, [emblaApi, sync]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi]);

  if (!slides?.length) return null;

  return (
    <div className="hcc-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="hcc-viewport" ref={emblaRef}>
        <div className="hcc-container">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`hcc-slide ${i === selectedIdx ? 'is-active' : ''}`}
            >
              <HeroSlide slide={slide} isAr={isAr} isActive={i === selectedIdx} />
            </div>
          ))}
        </div>
      </div>

      <div className="hcc-arrow-bounds">
        {canPrev && (
          <button
            className="hcc-arrow hcc-arrow--prev"
            onClick={scrollPrev}
            aria-label={isAr ? 'السابق' : 'Previous'}
          >
            <span className="material-symbols-sharp">
              {isAr ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        )}

        {canNext && (
          <button
            className="hcc-arrow hcc-arrow--next"
            onClick={scrollNext}
            aria-label={isAr ? 'التالي' : 'Next'}
          >
            <span className="material-symbols-sharp">
              {isAr ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>
        )}
      </div>

      {slides.length > 1 && (
        <div className="hcc-dots" role="tablist">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hcc-dot ${i === selectedIdx ? 'hcc-dot--active' : ''}`}
              onClick={() => scrollTo(i)}
              role="tab"
              aria-selected={i === selectedIdx}
              aria-label={`Slide ${i + 1} of ${slides.length}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
