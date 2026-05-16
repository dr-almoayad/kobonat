// components/HeroCuratedCarousel/HeroCuratedCarousel.jsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import './HeroCuratedCarousel.css';

function SlideCard({ slide, isAr }) {
  const {
    offerImage,
    offerImageFallback,
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
  const [imgSrc, setImgSrc] = useState(offerImage);

  const handleImageError = () => {
    if (offerImageFallback && imgSrc !== offerImageFallback) {
      setImgSrc(offerImageFallback);
    }
  };

  const inner = (
    <div className={`hcc-card hcc-card--${imagePosition}${!hasLink ? ' hcc-card--no-link' : ''}`}>
      {offerImage && (
        <div className="hcc-img-wrap">
          <img
            src={imgSrc}
            alt={title}
            className="hcc-img"
            draggable={false}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
        </div>
      )}

      <div className="hcc-body">
        {showStore && storeName && (
          <div className="hcc-store">
            {storeLogo && (
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
  if (!slides?.length) return null;

  return (
    <div className="hcc-root" dir={isAr ? 'rtl' : 'ltr'}>
      <EmblaCarousel
        locale={locale}
        slideWidth="auto"        // let CSS control slide width
        slideGap="12px"          // gap between slides (EmblaCarousel will respect)
        freeScroll={true}        // enable free dragging / no snap
        loop={false}             // no infinite loop
        className="hcc-embla"
      >
        {slides.map((slide) => (
          <SlideCard key={slide.id} slide={slide} isAr={isAr} />
        ))}
      </EmblaCarousel>
    </div>
  );
}
