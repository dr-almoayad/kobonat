'use client';
// components/HeroCuratedCarousel/HeroCuratedCarousel.jsx
//
// RetailMeNot-style hero carousel.
// Receives plain `slides` data from the RSC parent — no refetch needed.
//
// Slide shape:
//   { id, offerImage, title, storeName, storeLogo, ctaText, ctaUrl }

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import './HeroCuratedCarousel.css';

// ── Store logo badge (dark circle) ───────────────────────────────────────────
function LogoBadge({ logo, name }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';

  return (
    <div className="hcc-badge" aria-hidden="true">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} className="hcc-badge-img" />
      ) : (
        <span className="hcc-badge-initials">{initials}</span>
      )}
    </div>
  );
}

// ── Individual slide ──────────────────────────────────────────────────────────
function HeroSlide({ slide, isAr }) {
  return (
    <Link href={slide.ctaUrl || '#'} className="hcc-slide-card" aria-label={slide.title}>

      {/* ── Image panel ── */}
      <div className="hcc-img-panel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.offerImage}
          alt={slide.title}
          className="hcc-img"
          draggable={false}
        />
        <LogoBadge logo={slide.storeLogo} name={slide.storeName} />
      </div>

      {/* ── Text panel ── */}
      <div className="hcc-text-panel">
        <h2 className="hcc-headline">{slide.title}</h2>
        {slide.storeName && (
          <p className="hcc-store-name">
            {isAr ? `في ${slide.storeName}` : `at ${slide.storeName}`}
          </p>
        )}
        <span className="hcc-cta">
          {slide.ctaText || (isAr ? 'تسوق الآن' : 'SHOP NOW')}
        </span>
      </div>

    </Link>
  );
}

// ── Main carousel ─────────────────────────────────────────────────────────────
export default function HeroCuratedCarousel({ slides, locale }) {
  const isAr = locale?.split('-')[0] === 'ar';

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop:      true,
    align:     'center',
    direction: isAr ? 'rtl' : 'ltr',
  });

  const [selectedIdx, setSelectedIdx] = useState(0);

  const sync = useCallback((api) => {
    setSelectedIdx(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    sync(emblaApi);
    emblaApi.on('select', () => sync(emblaApi));
    emblaApi.on('reInit', () => sync(emblaApi));
  }, [emblaApi, sync]);

  const scrollTo = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi]);

  if (!slides?.length) return null;

  return (
    <div className="hcc-root" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Embla viewport ── */}
      <div className="hcc-viewport" ref={emblaRef}>
        <div className="hcc-container">
          {slides.map((slide) => (
            <div key={slide.id} className="hcc-slide">
              <HeroSlide slide={slide} isAr={isAr} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Dots ── */}
      {slides.length > 1 && (
        <div className="hcc-dots" role="tablist" aria-label="Slides">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hcc-dot${i === selectedIdx ? ' hcc-dot--active' : ''}`}
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
