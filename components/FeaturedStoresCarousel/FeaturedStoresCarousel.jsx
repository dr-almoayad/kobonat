'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import StoreDiscountCard from '../StoreDiscountCard/StoreDiscountCard';
import './FeaturedStoresCarousel.css';

// Helper to check RTL from locale
function isRtl(locale) {
  return locale?.startsWith('ar') ?? false;
}

// Simple media query hook
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export default function FeaturedStoresCarousel({ title, stores = [], locale = 'en-SA' }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: isRtl(locale) ? 'rtl' : 'ltr',
    align: 'start',
    dragFree: false,
    loop: false,
    containScroll: 'trimSnaps',
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const isMobile = useMediaQuery('(max-width: 900px)');

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
  const scrollTo = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi]);

  if (!stores.length) return null;

  const rtl = isRtl(locale);
  const slideWidth = isMobile ? '284px' : '300px';
  const slideGap = '1rem';

  return (
    <section className="fsc">
      <div className="fsc-inner">
        <h2 className="fsc-title">{title}</h2>

        <div className={`fsc-carousel ${isMobile ? 'fsc-carousel--full-bleed' : ''}`}>
          {/* Viewport with padding for 1rem gap */}
          <div className="fsc-viewport" ref={emblaRef}>
            <div className="fsc-container">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="fsc-slide"
                  style={{
                    flex: `0 0 ${slideWidth}`,
                    marginInlineStart: 0,
                    marginInlineEnd: `calc(${slideGap} / 2)`,
                  }}
                >
                  <StoreDiscountCard store={store} locale={locale} />
                </div>
              ))}
            </div>
          </div>

          {/* Controls (arrows + dots) */}
          {snapCount > 1 && (
            <div className="fsc-controls">
              <button
                className="fsc-arrow"
                onClick={rtl ? scrollNext : scrollPrev}
                disabled={rtl ? !canNext : !canPrev}
                aria-label={rtl ? 'Next' : 'Previous'}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d={rtl ? "M12 5l-5 5 5 5" : "M8 5l5 5-5 5"}
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="fsc-dots" role="tablist">
                {Array.from({ length: snapCount }).map((_, i) => (
                  <button
                    key={i}
                    className={`fsc-dot${i === selectedIdx ? ' fsc-dot--active' : ''}`}
                    onClick={() => scrollTo(i)}
                    role="tab"
                    aria-selected={i === selectedIdx}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                className="fsc-arrow"
                onClick={rtl ? scrollPrev : scrollNext}
                disabled={rtl ? !canPrev : !canNext}
                aria-label={rtl ? 'Previous' : 'Next'}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d={rtl ? "M8 5l5 5-5 5" : "M12 5l-5 5 5 5"}
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
