'use client';
import { useState, useEffect, useCallback } from 'react';
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
    ctaText = "Install",
    ctaSubtext = "In-app purchases",
    badgeText = "Update available",
    // Color configurations defaulting to a light theme variant
    bgColor = "#f3e8ee", 
    textColor = "#1f2937",
    badgeBg = "rgba(255, 255, 255, 0.6)",
    badgeColor = "#111111",
    btnBg = "rgba(0, 0, 0, 0.05)",
    btnColor = "#111111"
  } = slide;

  const isExternal = Boolean(ctaUrl && (ctaUrl.startsWith('http://') || ctaUrl.startsWith('https://')));
  const hasLink = Boolean(ctaUrl);
  const [imgSrc, setImgSrc] = useState(mainImage);

  const handleImageError = () => {
    if (mainImageFallback && imgSrc !== mainImageFallback) {
      setImgSrc(mainImageFallback);
    }
  };

  // Inline CSS variables keep colors perfectly isolated per card
  const cardStyles = {
    '--card-bg': bgColor,
    '--card-text': textColor,
    '--badge-bg': badgeBg,
    '--badge-text': badgeColor,
    '--btn-bg': btnBg,
    '--btn-text': btnColor,
  };

  const inner = (
    <div className={`hcc-card ${!hasLink ? 'hcc-card--no-link' : ''}`} style={cardStyles}>
      
      {/* Top Banner Area with Badge */}
      <div className="hcc-img-container">
        {badgeText && <span className="hcc-badge">{badgeText}</span>}
        {mainImage && (
          <>
            <img
              src={imgSrc}
              alt={title}
              className="hcc-img"
              draggable={false}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
            {/* Creates the smooth visual blend from image to solid color below */}
            <div className="hcc-img-overlay" />
          </>
        )}
      </div>

      {/* Card Content Details */}
      <div className="hcc-card-details">
        <div className="hcc-body">
          <h2 className="hcc-title">{title}</h2>
          {subtitle && <p className="hcc-subtitle">{subtitle}</p>}
        </div>

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
            {ctaSubtext && <span className="hcc-cta-subtext">{ctaSubtext}</span>}
          </div>
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
    <div className="hcc-carousel-wrapper" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="hcc-root">
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

      {/* Floating Next Navigation Arrow Button */}
      <button 
        className="hcc-nav-arrow hcc-nav-next" 
        aria-label="Next slide"
        onClick={() => {
          // Internal fallback trigger logic assuming your Embla wrapper captures global/parent actions
          const emblaNode = document.querySelector('.hcc-embla');
          if (emblaNode) {
            const nextBtn = emblaNode.querySelector('.embla__button--next');
            if (nextBtn) nextBtn.click();
          }
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
