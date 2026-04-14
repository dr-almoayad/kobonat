'use client';
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
    direction:     isAr ? 'rtl' : 'ltr',
    align:         'start',
    dragFree:      false,
    loop:          false,
    containScroll: false,
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

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

  const slides = Array.isArray(children) ? children : [children];

  return (
    <div className={`ec-root${className ? ` ${className}` : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ec-carousel-row">
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

        <div className="ec-viewport" ref={emblaRef}>
          <div className="ec-container">
            {slides.map((slide, i) => (
              <div
                key={i}
                className="ec-slide"
                style={{
                  flex: `0 0 ${slideWidth}`,
                  marginInlineStart: i === 0 ? 0 : `calc(${slideGap} / 2)`,
                  marginInlineEnd:   i === slides.length - 1 ? 0 : `calc(${slideGap} / 2)`,
                }}
              >
                {slide}
              </div>
            ))}
          </div>
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

      {snapCount > 1 && (
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
      )}
    </div>
  );
}
