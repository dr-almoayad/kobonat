'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import EmblaCarousel from '@/components/EmblaCarousel/EmblaCarousel';
import './HeroCuratedCarousel.css';

function SlideCard({ slide, priority = false }) {
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

      <div className="hcc-img-container">
        {mainImage && (
          <>
            <Image
              src={imgSrc}
              alt={title}
              fill
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 65vw, 45vw"
              quality={80}
              className="hcc-img"
              onError={handleImageError}
              priority={priority}
            />
            <div className="hcc-img-overlay" />
          </>
        )}

        {/* ── Title/subtitle now sit on top of the image ── */}
        <div className="hcc-body hcc-body--overlay">
          <h2 className="hcc-title">{title}</h2>
          {subtitle && <p className="hcc-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="hcc-card-details">
        <div className="hcc-footer">
          <div className="hcc-app-info">
            {appIcon && <img src={appIcon} alt={appName} className="hcc-app-icon" />}
            <div className="hcc-app-meta-wrap">
              <span className="hcc-app-name">{appName}</span>
            </div>
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

  // ── Dynamic preload for LCP image ──
  useEffect(() => {
    const firstSlide = slides[0];
    if (!firstSlide?.mainImage) return;

    // Check if preload already exists to avoid duplicates
    const existingPreload = document.querySelector(
      `link[rel="preload"][as="image"][href="${firstSlide.mainImage}"]`
    );
    if (existingPreload) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = firstSlide.mainImage;
    link.fetchPriority = 'high';
    document.head.appendChild(link);

    // Cleanup: remove the link when component unmounts (optional)
    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [slides]);

  return (
    <div className="hcc-carousel-wrapper" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="hcc-root">
        <EmblaCarousel
          locale={locale}
          slideWidth="auto"
          slideGap="0"
          freeScroll={true}
          loop={false}
          className="hcc-embla"
        >
          {slides.map((slide, index) => (
            <SlideCard key={slide.id} slide={slide} priority={index === 0} />
          ))}
        </EmblaCarousel>
      </div>
    </div>
  );
}
