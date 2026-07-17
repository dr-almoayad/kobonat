'use client';
import { useState, useEffect } from 'react';
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
    ctaText = "Install",
    ctaSubtext = "In-app purchases",
    badgeText,
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
    <div className="hcc-card" style={cardStyles}>
      <div className="hcc-image-wrapper">
        {mainImage && (
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
        )}
        {/* Overlay with the same background color */}
        <div className="hcc-overlay" />
        {/* Content overlay */}
        <div className="hcc-content">
          <div className="hcc-header">
            <h2 className="hcc-title">{title}</h2>
            {subtitle && <p className="hcc-subtitle">{subtitle}</p>}
          </div>
          <div className="hcc-footer">
            <div className="hcc-app-info">
              {appIcon && (
                <img src={appIcon} alt={appName} className="hcc-app-icon" />
              )}
              <span className="hcc-app-name">{appName}</span>
            </div>
            <div className="hcc-cta-wrap">
              <button className="hcc-cta" type="button">
                {ctaText}
              </button>
              {ctaSubtext && <span className="hcc-cta-subtext">{ctaSubtext}</span>}
            </div>
          </div>
        </div>
        {badgeText && (
          <div className="hcc-badge" style={{ backgroundColor: badgeBg, color: badgeColor }}>
            {badgeText}
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

  useEffect(() => {
    const firstSlide = slides[0];
    if (!firstSlide?.mainImage) return;
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
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
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
