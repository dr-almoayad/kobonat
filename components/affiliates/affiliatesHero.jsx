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
    setColumnDurations(Array.from({ length: cols }, () => Math.random() * (80 - 50) + 50));
  }, []);

  useEffect(() => {
    setIsClient(true);
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [updateColumns]);

  // Infinite Scroll Logic: Split and Duplicate
  const activeColumns = useMemo(() => {
    if (!stores.length) return [];
    const cols = Array.from({ length: numColumns }, () => []);
    stores.forEach((store, i) => cols[i % numColumns].push(store));
    // Duplicate each column to ensure seamless looping
    return cols.map(col => [...col, ...col, ...col]);
  }, [stores, numColumns]);

  if (!isClient || !stores.length) return <div className="hero-skeleton" />;

  return (
    <section className="affiliates-hero-section">
      <div className="hero-overlay-gradient" />
      
      <div className="hero-content-wrapper">
        <div className="hero-text-area">
          <h1 className="hero-title">
            {t('heroTitle', { defaultValue: 'Save More on Your Favorite Brands' })}
          </h1>
          <p className="hero-subtitle">
            {t('heroSubtitle', { defaultValue: 'Verified coupons and daily deals from top Saudi & Global stores.' })}
          </p>
        </div>

        <div className="brands-infinite-container">
          <div className="brands-grid" style={{ '--cols': numColumns }}>
            {activeColumns.map((col, colIdx) => (
              <div
                key={colIdx}
                className="brand-column-track"
                style={{
                  animationDuration: `${columnDurations[colIdx]}s`,
                  animationDirection: colIdx % 2 === 0 ? 'normal' : 'reverse'
                }}
              >
                {col.map((store, i) => (
                  <Link
                    key={`${store.id}-${colIdx}-${i}`}
                    href={`/${locale}/stores/${store.slug}`}
                    className="premium-brand-card"
                    style={{ '--brand-color': store.color || '#470ae2' }}
                  >
                    {/* Background Image Layer */}
                    {store.backgroundImage && (
                      <div className="card-bg-image">
                        <Image 
                          src={store.backgroundImage} 
                          alt="" 
                          fill 
                          sizes="200px"
                          className="object-cover"
                        />
                        <div className="card-image-overlay" />
                      </div>
                    )}
                    
                    {/* Content Layer */}
                    <div className="brand-card-inner">
                      {store.logo ? (
                        <div className="logo-glass-wrapper">
                          <Image
                            src={store.logo}
                            alt={store.name}
                            width={100}
                            height={100}
                            className="brand-main-logo"
                          />
                        </div>
                      ) : (
                        <span className="brand-fallback-text">{store.name}</span>
                      )}
                    </div>
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
