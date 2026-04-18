'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import './HeroCuratedCarousel.css';

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

function HeroSlide({ slide, isAr }) {
  return (
    <Link href={slide.ctaUrl || '#'} className="hcc-slide-card" aria-label={slide.title}>
      <div className="hcc-img-panel">
        <img src={slide.offerImage} alt={slide.title} className="hcc-img" draggable={false} />
        <div className="hcc-img-overlay" />
      </div>

      <LogoBadge logo={slide.storeLogo} name={slide.storeName} />
      
      <div className="hcc-text-panel">
        <h2 className="hcc-headline">{slide.title}</h2>
        {slide.storeName && (
          <p className="hcc-store-name">
            {isAr ? `في ` : `at `} <strong>{slide.storeName}</strong>
          </p>
        )}
        <div className="hcc-cta-wrapper">
            <span className="hcc-cta">
              {slide.ctaText || (isAr ? 'تسوق الآن' : 'SHOP NOW')}
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
    skipSnaps: false,
    duration: 30 // Slightly slower duration for "smoother" feel
  });

  const [selectedIdx, setSelectedIdx] = useState(0);

  const onSelect = useCallback((api) => {
    setSelectedIdx(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo   = useCallback((i) => emblaApi && emblaApi.scrollTo(i), [emblaApi]);

  if (!slides?.length) return null;

  return (
    <div className="hcc-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="hcc-viewport" ref={emblaRef}>
        <div className="hcc-container">
          {slides.map((slide, i) => (
            <div 
              key={`${slide.id}-${i}`} 
              className={`hcc-slide ${i === selectedIdx ? 'is-active' : ''}`}
            >
              <HeroSlide slide={slide} isAr={isAr} />
            </div>
          ))}
        </div>
      </div>

      {/* Persistent Arrow Container for Desktop */}
      <div className="hcc-arrow-bounds">
        <button className="hcc-arrow hcc-arrow--prev" onClick={scrollPrev}>
          <span className="material-symbols-sharp">{isAr ? 'chevron_right' : 'chevron_left'}</span>
        </button>
        <button className="hcc-arrow hcc-arrow--next" onClick={scrollNext}>
          <span className="material-symbols-sharp">{isAr ? 'chevron_left' : 'chevron_right'}</span>
        </button>
      </div>

      {slides.length > 1 && (
        <div className="hcc-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hcc-dot ${i === selectedIdx ? 'hcc-dot--active' : ''}`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
