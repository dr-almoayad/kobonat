'use client';

import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import './HeroCuratedCarousel.css';

function SlideCard({ slide, isAr }) {
  const {
    offerImage,
    ctaUrl,
    title,
    ctaText,
    storeName,
    storeLogo,
    textColor = '#ffffff',
    bgColor = '#1a1a2e',
    overlayColor = null,
    overlayOpacity = 0.4,
    imagePosition = 'cover',
    showCta = true,
    showStore = true,
  } = slide;

  const isExternal = Boolean(ctaUrl && (ctaUrl.startsWith('http://') || ctaUrl.startsWith('https://')));
  const hasLink = Boolean(ctaUrl);

  const cardStyle = {
    '--card-bg': bgColor,
    '--card-text': textColor,
  };

  const innerContent = (
    <div className={`modern-card modern-card--${imagePosition}`} style={cardStyle}>
      {/* Background & Image */}
      <div className="modern-card__media">
        {offerImage && (
          <img
            src={offerImage}
            alt={title}
            className="modern-card__img"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        )}
        <div 
          className="modern-card__overlay" 
          style={{ 
            backgroundColor: overlayColor || '#000', 
            opacity: overlayColor ? overlayOpacity : 0.25 
          }} 
        />
        <div className="modern-card__gradient"></div>
      </div>

      {/* Content */}
      <div className="modern-card__content">
        <div className="modern-card__header">
          {showStore && storeName && (
            <div className="modern-badge">
              {storeLogo && (
                <img src={storeLogo} alt={storeName} className="modern-badge__logo" />
              )}
              <span className="modern-badge__text">{storeName}</span>
            </div>
          )}
        </div>

        <div className="modern-card__footer">
          <h2 className="modern-card__title">{title}</h2>
          
          {showCta && hasLink && (
            <div className="modern-cta">
              <span className="modern-cta__text">
                {ctaText || (isAr ? 'تسوق الآن' : 'Shop Now')}
              </span>
              <span className="material-symbols-sharp modern-cta__icon">
                {isAr ? 'arrow_back' : 'arrow_forward'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!hasLink) {
    return <div className="modern-card-wrapper">{innerContent}</div>;
  }

  return (
    <Link
      href={ctaUrl}
      className="modern-card-link"
      target={isExternal ? '_blank' : '_self'}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      aria-label={title}
    >
      {innerContent}
    </Link>
  );
}

export default function HeroCuratedCarousel({ slides, locale }) {
  const isAr = locale?.split('-')[0] === 'ar';

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    direction: isAr ? 'rtl' : 'ltr',
    containScroll: 'trimSnaps',
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
    <section className="modern-carousel-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="modern-carousel-viewport" ref={emblaRef}>
        <div className="modern-carousel-track">
          {slides.map((slide) => (
            <div key={slide.id} className="modern-carousel-slide">
              <SlideCard slide={slide} isAr={isAr} />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="modern-carousel-controls">
          <button
            className="modern-control-btn"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
            aria-label={isAr ? 'الشريحة السابقة' : 'Previous slide'}
          >
            <span className="material-symbols-sharp">
              {isAr ? 'arrow_forward' : 'arrow_back'}
            </span>
          </button>

          <div className="modern-pagination" role="tablist">
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === selectedIndex}
                aria-label={`Slide ${i + 1}`}
                className={`modern-dot ${i === selectedIndex ? 'is-active' : ''}`}
                onClick={() => emblaApi?.scrollTo(i)}
              />
            ))}
          </div>

          <button
            className="modern-control-btn"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            aria-label={isAr ? 'الشريحة التالية' : 'Next slide'}
          >
            <span className="material-symbols-sharp">
              {isAr ? 'arrow_back' : 'arrow_forward'}
            </span>
          </button>
        </div>
      )}
    </section>
  );
}
