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
  freeScroll = false,   // if true, continuous drag (no snap)
}) {
  const isAr = locale?.split('-')[0] === 'ar';

  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction:     isAr ? 'rtl' : 'ltr',
    align:         'start',
    dragFree:      freeScroll,
    loop:          false,
    containScroll: 'trimSnaps',   // prevents overscroll beyond last slide
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

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
  const showArrows = isDesktop && (canPrev || canNext);

  // Arrow icons – RTL aware (no CSS flipping)
  const prevIcon = isAr ? 'chevron_right' : 'chevron_left';
  const nextIcon = isAr ? 'chevron_left' : 'chevron_right';

  return (
    <div className={`ec-root${className ? ` ${className}` : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ec-carousel-row">
        {showArrows && canPrev && (
          <button
            className="ec-arrow ec-arrow--prev"
            onClick={scrollPrev}
            aria-label={isAr ? 'السابق' : 'Previous'}
          >
            <span className="material-symbols-sharp">{prevIcon}</span>
          </button>
        )}

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

        {showArrows && canNext && (
          <button
            className="ec-arrow ec-arrow--next"
            onClick={scrollNext}
            aria-label={isAr ? 'التالي' : 'Next'}
          >
            <span className="material-symbols-sharp">{nextIcon}</span>
          </button>
        )}
      </div>
      {/* Dots removed */}
    </div>
  );
}
