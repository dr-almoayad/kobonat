'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import './EmblaCarousel.css';

export default function EmblaCarousel({
  children,
  locale,
  slideWidth = '85%', // Defaulting to 85% to tease the next card on mobile (Play Store style)
  slideGap   = '1rem',
  className  = '',
  freeScroll = true,  // Defaulted to true for continuous drag[cite: 2]
}) {
  const isAr = locale?.split('-')[0] === 'ar';[cite: 2]

  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction:     isAr ? 'rtl' : 'ltr',[cite: 2]
    align:         'start',[cite: 2]
    dragFree:      freeScroll,[cite: 2]
    containScroll: 'trimSnaps',[cite: 2]
  });

  const [canPrev, setCanPrev] = useState(false);[cite: 2]
  const [canNext, setCanNext] = useState(false);[cite: 2]

  const sync = useCallback((api) => {
    setCanPrev(api.canScrollPrev());[cite: 2]
    setCanNext(api.canScrollNext());[cite: 2]
  }, []);

  useEffect(() => {
    if (!emblaApi) return;[cite: 2]
    sync(emblaApi);[cite: 2]
    emblaApi.on('select', () => sync(emblaApi));[cite: 2]
    emblaApi.on('reInit', () => sync(emblaApi));[cite: 2]
  }, [emblaApi, sync]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);[cite: 2]
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);[cite: 2]

  const slides = Array.isArray(children) ? children : [children];[cite: 2]

  // Logical icons based on direction (No CSS flipping required)
  const prevIcon = isAr ? 'chevron_right' : 'chevron_left';[cite: 2]
  const nextIcon = isAr ? 'chevron_left' : 'chevron_right';[cite: 2]

  return (
    <div 
      className={`ec-root${className ? ` ${className}` : ''}`}[cite: 2] 
      dir={isAr ? 'rtl' : 'ltr'}[cite: 2]
      style={{ '--ec-gap': slideGap }}
    >
      <div className="ec-carousel-row">[cite: 2]
        
        {/* Previous Arrow */}
        <button
          className="ec-arrow ec-arrow--prev"[cite: 2]
          onClick={scrollPrev}[cite: 2]
          disabled={!canPrev}
          aria-label={isAr ? 'السابق' : 'Previous'}[cite: 2]
        >
          <span className="material-symbols-sharp">{prevIcon}</span>[cite: 2]
        </button>

        {/* Viewport & Container */}
        <div className="ec-viewport" ref={emblaRef}>[cite: 2]
          <div className="ec-container">[cite: 2]
            {slides.map((slide, i) => (
              <div
                key={i}
                className="ec-slide"[cite: 2]
                style={{ flex: `0 0 ${slideWidth}` }}
              >
                {slide}
              </div>
            ))}
          </div>
        </div>

        {/* Next Arrow */}
        <button
          className="ec-arrow ec-arrow--next"[cite: 2]
          onClick={scrollNext}[cite: 2]
          disabled={!canNext}
          aria-label={isAr ? 'التالي' : 'Next'}[cite: 2]
        >
          <span className="material-symbols-sharp">{nextIcon}</span>[cite: 2]
        </button>
        
      </div>
    </div>
  );
}
