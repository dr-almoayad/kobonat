// components/HeroCarousel/HeroCarousel.jsx
'use client';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { flushSync } from 'react-dom';
import './HeroCarousel.css';

/* ── inline SVG arrows ── */
const ChevronLeft = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/**
 * HeroCarousel
 *
 * Props (each item in `images` array):
 *   image        – cover image URL (required)
 *   logo         – store logo URL  (renders inside frosted pill)
 *   name         – store name      (shown under badge)
 *   discount     – e.g. "Up to 60% off" (badge text; if omitted badge is hidden)
 *   ctaText      – link label (defaults to "Explore Deals")
 *   ctaUrl       – link href  (defaults to "#")
 *
 * Component Props:
 *   locale, autoplayDelay, showDots, showArrows
 */
const HeroCarousel = ({
  images = [],
  locale = 'en-SA',
  autoplayDelay = 5500,
  showDots = true,
  showArrows = true,
}) => {
  const isRtl = locale.startsWith('ar');

  const autoplayRef = useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: false })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, direction: isRtl ? 'rtl' : 'ltr' },
    [autoplayRef.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [tweenValues, setTweenValues] = useState([]);

  // ── Parallax ──────────────────────────────────────────
  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const engine = emblaApi.internalEngine();
    const scrollProgress = emblaApi.scrollProgress();

    const styles = emblaApi.scrollSnapList().map((scrollSnap, index) => {
      let diff = scrollSnap - scrollProgress;
      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (index === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) diff = scrollSnap - (1 + scrollProgress);
            if (sign === 1) diff = scrollSnap + (1 - scrollProgress);
          }
        });
      }
      return diff * (-12) + '%'; // 12% parallax — smooth on mobile
    });
    setTweenValues(styles);
  }, [emblaApi]);

  // ── Navigation ────────────────────────────────────────
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const scrollTo = useCallback((index) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(index);
    autoplayRef.current.reset();
  }, [emblaApi]);

  // ── Selection sync ────────────────────────────────────
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    autoplayRef.current.reset();
  }, [emblaApi]);

  // ── Mount / event wiring ──────────────────────────────
  useEffect(() => {
    if (!emblaApi) return;

    onScroll();
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();

    emblaApi.on('scroll', () => flushSync(() => onScroll()));
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
      emblaApi.off('scroll', onScroll);
    };
  }, [emblaApi, onSelect, onScroll]);

  // ── Early exit ────────────────────────────────────────
  if (!images || images.length === 0) return null;

  // Localised CTA default
  const defaultCta = isRtl ? 'استكشاف العروض' : 'Explore Deals';

  return (
    <div className="hc-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ── Embla viewport ── */}
      <div className="hc-embla" ref={emblaRef}>
        <div className="hc-embla__container">
          {images.map((item, index) => {
            const isActive = index === selectedIndex;
            const logo = item.logo;
            const name = item.name || '';
            const discount = item.discount || '';
            const ctaText = item.ctaText || defaultCta;
            const ctaUrl = item.ctaUrl || '#';

            return (
              <div key={item.id || index} className="hc-embla__slide">
                <div className="hc-slide">

                  {/* Parallax image */}
                  <div className="hc-slide__parallax">
                    <div
                      className="hc-slide__img-wrap"
                      style={{ transform: `translateX(${tweenValues[index] || '0%'})` }}
                    >
                      <Image
                        src={item.image || item.coverImage}
                        alt={name || `Slide ${index + 1}`}
                        fill
                        priority={index === 0}
                        className="hc-slide__img"
                        sizes="100vw"
                      />
                    </div>
                  </div>

                  {/* Gradient scrim */}
                  <div className="hc-slide__overlay" />

                  {/* ── Frosted content strip ── */}
                  <div className={`hc-slide__content ${isActive ? 'is-active' : ''}`}>
                    <div className="hc-content-row">

                      {/* Logo pill */}
                      <div className={`hc-logo-pill ${!logo ? 'hc-logo-pill--fallback' : ''}`}>
                        {logo ? (
                          <Image src={logo} alt={`${name} logo`} width={54} height={54} quality={85} />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Badge + name */}
                      <div className="hc-content-mid">
                        {discount && (
                          <span className="hc-badge">
                            <span className="material-symbols-sharp">local_offer</span>
                            {discount}
                          </span>
                        )}
                        {name && <p className="hc-store-name">{name}</p>}
                      </div>

                      {/* CTA arrow link */}
                      <a href={ctaUrl} className="hc-cta" aria-label={`${ctaText} – ${name}`}>
                        {ctaText}
                        <span className="material-symbols-sharp">
                          {isRtl ? 'arrow_back' : 'arrow_forward'}
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Controls layer ── */}
      <div className="hc-controls">

        {/* Nav arrows */}
        {showArrows && images.length > 1 && (
          <>
            <button className="hc-nav hc-nav--prev" onClick={scrollPrev} aria-label={isRtl ? 'الشريحة التالية' : 'Previous slide'}>
              {isRtl ? <ChevronRight /> : <ChevronLeft />}
            </button>
            <button className="hc-nav hc-nav--next" onClick={scrollNext} aria-label={isRtl ? 'الشريحة السابقة' : 'Next slide'}>
              {isRtl ? <ChevronLeft /> : <ChevronRight />}
            </button>
          </>
        )}

        {/* Progress dots */}
        {showDots && images.length > 1 && (
          <div className="hc-dots">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                className={`hc-dot ${index === selectedIndex ? 'is-active' : ''}`}
                onClick={() => scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              >
                <span className="hc-dot__track">
                  {index === selectedIndex && (
                    <span
                      className="hc-dot__progress"
                      style={{ animationDuration: `${autoplayDelay}ms` }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCarousel;
