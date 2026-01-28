'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import './affiliatesHero.css';

const AffiliatesHero = ({ stores = [] }) => {
  const [numColumns, setNumColumns] = useState(3);
  const [columnDurations, setColumnDurations] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const locale = useLocale();
  const t = useTranslations('HomePage');

  // Handle responsive column count
  const updateColumns = useCallback(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    let cols = 3;
    if (width >= 1536) cols = 6;
    else if (width >= 1024) cols = 5;
    else if (width >= 768) cols = 4;
    
    setNumColumns(cols);
    // Slightly slower, more elegant animation
    setColumnDurations(Array.from({ length: cols }, () => Math.random() * (100 - 60) + 60));
  }, []);

  useEffect(() => {
    setIsClient(true);
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [updateColumns]);

  // Infinite Scroll Logic
  const activeColumns = useMemo(() => {
    if (!stores.length) return [];
    const cols = Array.from({ length: numColumns }, () => []);
    stores.forEach((store, i) => cols[i % numColumns].push(store));
    // Triple for seamless looping
    return cols.map(col => [...col, ...col, ...col]);
  }, [stores, numColumns]);

  if (!isClient || !stores.length) return <div className="hero-skeleton" />;

  return (
    <section className="affiliates-hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            {t('heroTitle', { defaultValue: 'Save More on Your Favorite Brands' })}
          </h1>
          <p className="hero-subtitle">
            {t('heroSubtitle', { defaultValue: 'Verified coupons and daily deals from top Saudi & Global stores.' })}
          </p>
        </div>

        <div className="brands-scroll-container">
          <div className="gradient-overlay top-overlay" />
          <div className="gradient-overlay bottom-overlay" />
          
          <div className="brands-columns-grid" style={{ '--columns': numColumns }}>
            {activeColumns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="brand-column"
                style={{
                  '--animation-duration': `${columnDurations[columnIndex]}s`,
                  '--animation-direction': columnIndex % 2 === 0 ? 'normal' : 'reverse'
                }}
              >
                {column.map((store, index) => (
                  <Link
                    key={`${store.id}-${columnIndex}-${index}`}
                    href={`/${locale}/stores/${store.slug}`}
                    className="brand-card"
                    style={{
                      backgroundImage: store.backgroundImage 
                        ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url(${store.backgroundImage})`
                        : `linear-gradient(135deg, ${store.color || '#470ae2'} 0%, #6366f1 100%)`
                    }}
                  >
                    {/* Store Logo */}
                    <div className="brand-logo-wrapper">
                      {store.logo ? (
                        <div className="logo-container">
                          <Image
                            src={store.logo}
                            alt={store.name}
                            width={80}
                            height={80}
                            className="brand-logo"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <span className="brand-name">{store.name}</span>
                      )}
                    </div>

                    {/* Subtle glow effect */}
                    <div className="card-glow" />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AffiliatesHero;
