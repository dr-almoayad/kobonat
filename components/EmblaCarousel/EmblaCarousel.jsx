'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import './EmblaCarousel.css';

export default function EmblaCarousel({
  children,
  locale,
  slideWidth = '85%',
  slideGap = '1rem',
  className = '',
  freeScroll = true,
  scrollSlides = 1, // NEW: number of slides to scroll per arrow click
}) {
  const isAr = locale?.split('-')[0] === 'ar';

  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: isAr ? 'rtl' : 'ltr',
    align: 'start',
    dragFree: freeScroll,
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

  // Scroll by multiple slides
  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    const currentIndex = emblaApi.selectedScrollSnap();
    const targetIndex = Math.max(0, currentIndex - scrollSlides);
    emblaApi.scrollTo(targetIndex);
  }, [emblaApi, scrollSlides]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    const currentIndex = emblaApi.selectedScrollSnap();
    const maxIndex = emblaApi.scrollSnapList().length - 1;
    const targetIndex = Math.min(maxIndex, currentIndex + scrollSlides);
    emblaApi.scrollTo(targetIndex);
  }, [emblaApi, scrollSlides]);

  const slides = Array.isArray(children) ? children : [children];

  const prevIcon = isAr ? 'chevron_right' : 'chevron_left';
  const nextIcon = isAr ? 'chevron_left' : 'chevron_right';

  const isAuto = slideWidth === 'auto';

  return (
    <div
      className={`ec-root${className ? ` ${className}` : ''}`}
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ '--ec-gap': slideGap }}
    >
      <div className="ec-carousel-row">
        <button
          className="ec-arrow ec-arrow--prev"
          onClick={scrollPrev}
          disabled={!canPrev}
          aria-label={isAr ? 'السابق' : 'Previous'}
        >
          <span className="material-symbols-sharp">{prevIcon}</span>
        </button>

        <div className="ec-viewport" ref={emblaRef}>
          <div className="ec-container">
            {slides.map((slide, i) => (
              <div
                key={i}
                className="ec-slide"
                style={isAuto ? {} : { flex: `0 0 ${slideWidth}` }}
              >
                {slide}
              </div>
            ))}
          </div>
        </div>

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
