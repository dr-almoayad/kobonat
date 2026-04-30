'use client';
// components/HeroCuratedCarousel/HeroCuratedCarousel.jsx
//
// Premium light‑theme coupon carousel – LOOPING version
// Features:
//   · Infinite loop
//   · Centered focus slide + scaled adjacent slides
//   · White/light gray cards, soft shadows
//   · Floating side arrows over preview edges
//   · Max width 1312px

import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import './HeroCuratedCarousel.css';

// Single card – forces light theme
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

  // Force light theme
  const cardStyle = {
    '--c-bg': '#FFFFFF',
    '--c-text': '#111111',
  };

  const inner = (
    <div
      className={`hcc-card hcc-card--${imagePosition}${!hasLink ? ' hcc-card--no-link' : ''}`}
      style={cardStyle}
    >
      {/* Image layer – clean, no dark overlays */}
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

      {/* Text content */}
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

export default function HeroCuratedCarousel({ slides, locale }) {
  const isAr = locale?.split('-')[0] === 'ar';

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,            // ✅ infinite loop
    align: 'center',       // focus active slide, show partial neighbors
    direction: isAr ? 'rtl' : 'ltr',
    containScroll: 'trimSnaps',
    dragFree: false,
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const syncSelected = useCallback((api) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    syncSelected(emblaApi);
    emblaApi.on('select', () => syncSelected(emblaApi));
    emblaApi.on('reInit', () => syncSelected(emblaApi));
    return () => {
      emblaApi.off('select', () => syncSelected(emblaApi));
    };
  }, [emblaApi, syncSelected]);

  if (!slides?.length) return null;

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

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

        {/* Floating arrows – overlaying the side previews */}
        <button
          className="hcc-arrow hcc-arrow--prev"
          onClick={scrollPrev}
          aria-label={isAr ? 'الشريحة السابقة' : 'Previous slide'}
        >
          <span className="material-symbols-sharp">
            {isAr ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>

        <button
          className="hcc-arrow hcc-arrow--next"
          onClick={scrollNext}
          aria-label={isAr ? 'الشريحة التالية' : 'Next slide'}
        >
          <span className="material-symbols-sharp">
            {isAr ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>
      </div>

      {/* Dots remain (minimal indicator) */}
      {slides.length > 1 && (
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
      )}
    </div>
  );
}
