'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import './EmblaCarousel.css';

export default function EmblaCarousel({
  children,
  locale,
  slideWidth = '85%', // Defaulting to 85% to tease the next card on mobile
  slideGap   = '1rem',
  className  = '',
  freeScroll = true,  // Defaulted to true for continuous drag
}) {
  const isAr = locale?.split('-')[0] === 'ar';

  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction:     isAr ? 'rtl' : 'ltr',
    align:         'start',
    dragFree:      freeScroll,
    containScroll: 'trimSnaps',
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback((api) => {
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

  const slides = Array.isArray(children) ? children : [children];

  // Logical icons based on direction (No CSS flipping required)
  const prevIcon = isAr ? 'chevron_right' : 'chevron_left';
  const nextIcon = isAr ? 'chevron_left' : 'chevron_right';

  return (
    <div 
      className={`ec-root${className ? ` ${className}` : ''}`} 
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ '--ec-gap': slideGap }}
    >
      <div className="ec-carousel-row">
        
        {/* Previous Arrow */}
        <button
          className="ec-arrow ec-arrow--prev"
          onClick={scrollPrev}
          disabled={!canPrev}
          aria-label={isAr ? 'السابق' : 'Previous'}
        >
          <span className="material-symbols-sharp">{prevIcon}</span>
        </button>

        {/* Viewport & Container */}
        <div className="ec-viewport" ref={emblaRef}>
          <div className="ec-container">
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

        {/* Next Arrow */}
        <button
          className="ec-arrow ec-arrow--next"
          onClick={scrollNext}
          disabled={!canNext}
          aria-label={isAr ? 'التالي' : 'Next'}
        >
          <span className="material-symbols-sharp">{nextIcon}</span>
        </button>
        
      </div>
    </div>
  );
}
