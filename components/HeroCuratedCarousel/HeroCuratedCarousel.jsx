'use client';
// components/HeroCuratedCarousel/HeroCuratedCarousel.jsx
//
// Premium light-themed coupon carousel.
// Features:
//   · Centered focus slide + scaled adjacent slides
//   · White/light gray cards, soft shadows
//   · Clean product/brand visuals (cover/bottom/right positions)
//   · Minimal arrow + dot controls
//   · No heavy gradients or dark overlays

import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import './HeroCuratedCarousel.css';

// ── Single card – forces light theme, removes dark overlays ─────────────────
function SlideCard({ slide, isAr }) {
  const {
    offerImage,
    ctaUrl,
    title,
    ctaText,
    storeName,
    storeLogo,
    imagePosition = 'cover',
    showCta = true,
    showStore = true,
  } = slide;

  const isExternal = Boolean(ctaUrl && (ctaUrl.startsWith('http://') || ctaUrl.startsWith('https://')));
  const hasLink = Boolean(ctaUrl);

  // Force light theme – no CMS dark colors or overlays
  const cardStyle = {
    '--c-bg': '#FFFFFF',
    '--c-text': '#111111',
  };

  const inner = (
    <div
      className={`hcc-card hcc-card--${imagePosition}${!hasLink ? ' hcc-card--no-link' : ''}`}
      style={cardStyle}
    >
      {/* Image layer – clean, no dark fade overlays */}
      {offerImage && (
        <div className="hcc-img-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={offerImage}
            alt={title}
            className="hcc-img"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {/* Text content – on white/light background (or semi‑transparent for cover variants) */}
      <div className="hcc-body">
        {showStore && storeName && (
          <div className="hcc-store">
            {storeLogo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={storeLogo} alt={storeName} className="hcc-store-logo" />
            )}
            <span className="hcc-store-name">{storeName}</span>
          </div>
        )}

        <h2 className="hcc-title">{title}</h2>

        {showCta && hasLink && (
          <div className="hcc-cta">
            <span>{ctaText || (isAr ? 'تسوق الآن' : 'Shop Now')}</span>
            <span className="material-symbols-sharp">
              {isAr ? 'arrow_back' : 'arrow_forward'}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (!hasLink) return inner;

  return (
    <Link
      href={ctaUrl}
      className="hcc-card-link"
      target={isExternal ? '_blank' : '_self'}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      aria-label={title}
    >
      {inner}
    </Link>
  );
}

// ── Carousel – centered focus, scaling inactive slides ──────────────────────
export default function HeroCuratedCarousel({ slides, locale }) {
  const isAr = locale?.split('-')[0] === 'ar';

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'center',         // focus on active slide, show partial neighbors
    direction: isAr ? 'rtl' : 'ltr',
    containScroll: 'trimSnaps',
    dragFree: false,
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const syncState = useCallback((api) => {
    setSelectedIndex(api.selectedScrollSnap());
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    syncState(emblaApi);
    emblaApi.on('select', () => syncState(emblaApi));
    emblaApi.on('reInit', () => syncState(emblaApi));
    return () => {
      emblaApi.off('select', () => syncState(emblaApi));
    };
  }, [emblaApi, syncState]);

  if (!slides?.length) return null;

  return (
    <div className="hcc-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="hcc-viewport" ref={emblaRef}>
        <div className="hcc-track">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`hcc-slide ${selectedIndex === idx ? 'is-active' : 'is-inactive'}`}
            >
              <SlideCard slide={slide} isAr={isAr} />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="hcc-controls">
          <button
            className="hcc-arrow"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
            aria-label={isAr ? 'الشريحة السابقة' : 'Previous slide'}
          >
            <span className="material-symbols-sharp">
              {isAr ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>

          <div className="hcc-dots" role="tablist">
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === selectedIndex}
                aria-label={`Slide ${i + 1} of ${slides.length}`}
                className={`hcc-dot${i === selectedIndex ? ' is-active' : ''}`}
                onClick={() => emblaApi?.scrollTo(i)}
              />
            ))}
          </div>

          <button
            className="hcc-arrow"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            aria-label={isAr ? 'الشريحة التالية' : 'Next slide'}
          >
            <span className="material-symbols-sharp">
              {isAr ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
