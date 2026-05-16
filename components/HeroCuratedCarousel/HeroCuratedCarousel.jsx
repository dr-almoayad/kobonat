'use client';
import { useState } from 'react';
import Link from 'next/link';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import './HeroCuratedCarousel.css';

function SlideCard({ slide }) {
  const {
    id,
    mainImage,
    mainImageFallback,
    ctaUrl,
    title,
    subtitle,
    appIcon,
    appName,
    developer,
    rating,
    ctaText = "Install on Windows",
    ctaSubtext = "In-app purchases",
    badgeText = "Spotlight"
  } = slide;

  const isExternal = Boolean(ctaUrl && (ctaUrl.startsWith('http://') || ctaUrl.startsWith('https://')));
  const hasLink = Boolean(ctaUrl);
  const [imgSrc, setImgSrc] = useState(mainImage);

  const handleImageError = () => {
    if (mainImageFallback && imgSrc !== mainImageFallback) {
      setImgSrc(mainImageFallback);
    }
  };

  const inner = (
    <div className={`hcc-card ${!hasLink ? 'hcc-card--no-link' : ''}`}>
      {/* Top Header: Badge & Play Icon */}
      <div className="hcc-card-header">
        <span className="hcc-badge">{badgeText}</span>
        <svg className="hcc-play-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Placeholder for the Google Play Games PC logo */}
          <path d="M6 3L20 12L6 21V3Z" fill="#25E87C"/>
          <circle cx="16" cy="16" r="3" fill="#111"/>
        </svg>
      </div>

      {/* Main Image with 3D/Glow effect */}
      {mainImage && (
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

      {/* Main Text Content */}
      <div className="hcc-body">
        <h2 className="hcc-title">{title}</h2>
        {subtitle && <p className="hcc-subtitle">{subtitle}</p>}
      </div>

      {/* Footer: App Info & Button */}
      <div className="hcc-footer">
        <div className="hcc-app-info">
          {appIcon && <img src={appIcon} alt={appName} className="hcc-app-icon" />}
          <div className="hcc-app-meta-wrap">
            <span className="hcc-app-name">{appName}</span>
            <span className="hcc-app-meta">{developer} • {rating}</span>
          </div>
        </div>

        <div className="hcc-cta-wrap">
          <button className="hcc-cta">{ctaText}</button>
          <span className="hcc-cta-subtext">{ctaSubtext}</span>
        </div>
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
        slideWidth="auto"
        slideGap="16px"
        freeScroll={true}
        loop={false}
        className="hcc-embla"
      >
        {slides.map((slide) => (
          <SlideCard key={slide.id} slide={slide} />
        ))}
      </EmblaCarousel>
    </div>
  );
}
