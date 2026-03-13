'use client';
// components/EmblaCarousel/EmblaCarousel.jsx
//
// Shared Embla carousel shell. Accepts RSC-rendered children — no re-render needed.
//
// Props:
//   children    — slides (any RSC or client nodes)
//   locale      — 'ar-SA' | 'en-SA' — drives RTL direction
//   slideWidth  — CSS value, e.g. '300px', '220px', '85vw'
//   slideGap    — CSS gap between slides, default '1rem'

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import './EmblaCarousel.css';

export default function EmblaCarousel({
  children,
  locale,
  slideWidth = '300px',
  slideGap   = '1rem',
  className  = '',
}) {
  const isAr = locale?.split('-')[0] === 'ar';

  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: isAr ? 'rtl' : 'ltr',
    align:     'start',
    dragFree:  false,
    loop:      false,
  });

  const [canPrev,     setCanPrev]     = useState(false);
  const [canNext,     setCanNext]     = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [snapCount,   setSnapCount]   = useState(0);

  const sync = useCallback((api) => {
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
    setSelectedIdx(api.selectedScrollSnap());
    setSnapCount(api.scrollSnapList().length);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    sync(emblaApi);
    emblaApi.on('select', () => sync(emblaApi));
    emblaApi.on('reInit', () => sync(emblaApi));
  }, [emblaApi, sync]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo   = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi]);

  // Normalize children into an array
  const slides = Array.isArray(children) ? children : [children];

  return (
    <div className={`ec-root${className ? ` ${className}` : ''}`} dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Viewport ────────────────────────────────────────────────────── */}
      <div className="ec-viewport" ref={emblaRef}>
        <div className="ec-container" style={{ gap: slideGap }}>
          {slides.map((slide, i) => (
            <div
              key={i}
              className="ec-slide"
              style={{ flex: `0 0 ${slideWidth}` }}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls: dots + arrows ──────────────────────────────────────── */}
      {snapCount > 1 && (
        <div className="ec-controls">
          <button
            className="ec-arrow"
            onClick={isAr ? scrollNext : scrollPrev}
            disabled={isAr ? !canNext : !canPrev}
            aria-label={isAr ? 'السابق' : 'Previous'}
          >
            <span className="material-symbols-sharp">
              {isAr ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>

          <div className="ec-dots" role="tablist">
            {Array.from({ length: snapCount }).map((_, i) => (
              <button
                key={i}
                className={`ec-dot${i === selectedIdx ? ' ec-dot--active' : ''}`}
                onClick={() => scrollTo(i)}
                role="tab"
                aria-selected={i === selectedIdx}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="ec-arrow"
            onClick={isAr ? scrollPrev : scrollNext}
            disabled={isAr ? !canPrev : !canNext}
            aria-label={isAr ? 'التالي' : 'Next'}
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
