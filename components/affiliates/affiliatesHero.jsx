'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import './affiliatesHero.css';

const AffiliatesHero = ({ stores = [] }) => {
  const [numColumns, setNumColumns] = useState(2);
  const [columnDurations, setColumnDurations] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const locale = useLocale();
  const t = useTranslations('HomePage');

  // Mobile-first responsive column count
  const updateColumns = useCallback(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    let cols = 2; // Mobile default
    
    if (width >= 1536) cols = 6;      // 2xl
    else if (width >= 1280) cols = 5;  // xl
    else if (width >= 1024) cols = 4;  // lg
    else if (width >= 768) cols = 3;   // md
    else if (width >= 640) cols = 2;   // sm
    
    setNumColumns(cols);
    // Staggered animation durations for visual interest
    setColumnDurations(
      Array.from({ length: cols }, () => Math.random() * (90 - 70) + 70)
    );
  }, []);

  useEffect(() => {
    setIsClient(true);
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [updateColumns]);

  // Distribute stores across columns and triple for infinite scroll
  const activeColumns = useMemo(() => {
    if (!stores.length) return [];
    const cols = Array.from({ length: numColumns }, () => []);
    stores.forEach((store, i) => cols[i % numColumns].push(store));
    // Triple the content for seamless looping
    return cols.map(col => [...col, ...col, ...col]);
  }, [stores, numColumns]);

  if (!isClient || !stores.length) {
    return <div className="hero-skeleton" aria-label="Loading brands..." />;
  }

  return (
    <section className="affiliates-hero" aria-label="Featured brands showcase">
      <div className="hero-content">
        {/* Hero Text */}
        <div className="hero-text">
          <h1 className="hero-title">
            {t('heroTitle', { defaultValue: 'Save More on Your Favorite Brands' })}
          </h1>
          <p className="hero-subtitle">
            {t('heroSubtitle', { 
              defaultValue: 'Verified coupons and daily deals from top Saudi & Global stores.' 
            })}
          </p>
        </div>

        {/* Brands Scroll Container */}
        <div className="brands-scroll-container">
          <div className="gradient-overlay gradient-overlay-top" aria-hidden="true" />
          <div className="gradient-overlay gradient-overlay-bottom" aria-hidden="true" />
          
          <div 
            className="brands-columns-grid" 
            style={{ '--columns': numColumns }}
            role="list"
          >
            {activeColumns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="brand-column"
                style={{
                  '--animation-duration': `${columnDurations[columnIndex]}s`,
                  '--animation-direction': columnIndex % 2 === 0 ? 'normal' : 'reverse'
                }}
                role="listitem"
              >
                {column.map((store, index) => {
                  // Determine background style
                  const backgroundStyle = store.backgroundImage 
                    ? {
                        backgroundImage: `
                          linear-gradient(
                            to bottom,
                            rgba(0, 0, 0, 0.3),
                            rgba(0, 0, 0, 0.5)
                          ),
                          url(${store.backgroundImage})
                        `,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {
                        background: `linear-gradient(
                          135deg, 
                          ${store.color || '#470ae2'} 0%, 
                          ${store.color ? `${store.color}dd` : '#6366f1'} 100%
                        )`
                      };

                  return (
                    <Link
                      key={`${store.id}-${columnIndex}-${index}`}
                      href={`/${locale}/stores/${store.slug}`}
                      className="brand-card"
                      style={backgroundStyle}
                      aria-label={`View ${store.name} coupons and deals`}
                    >
                      {/* Store Logo */}
                      <div className="brand-logo-wrapper">
                        {store.logo ? (
                          <Image
                            src={store.logo}
                            alt={`${store.name} logo`}
                            width={100}
                            height={100}
                            className="brand-logo"
                            loading="lazy"
                            quality={85}
                          />
                        ) : (
                          <span className="brand-name">{store.name}</span>
                        )}
                      </div>

                      {/* Hover overlay effect */}
                      <div className="brand-card-overlay" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AffiliatesHero;
