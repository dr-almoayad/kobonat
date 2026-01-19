// components/Affiliates/affiliatesHero.jsx - FIXED TRANSLATIONS
'use client'
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import './affiliatesHero.css';

const AffiliatesHero = ({ stores = [] }) => {
  const [numColumns, setNumColumns] = useState(3);
  const [columnDurations, setColumnDurations] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const locale = useLocale();
  const t = useTranslations('HomePage'); // Changed from 'affiliatesHero' to match your translations

  // Generate random animation durations
  const getRandomDuration = useCallback(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      return isMobile 
        ? Math.random() * (90 - 60) + 60
        : Math.random() * (70 - 45) + 45;
    }
    return 60;
  }, []);

  // Handle responsive column count
  const updateColumns = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    let newNumColumns = 3;
    
    if (window.innerWidth >= 1536) newNumColumns = 6;
    else if (window.innerWidth >= 1024) newNumColumns = 6;
    else if (window.innerWidth >= 768) newNumColumns = 5;
    else if (window.innerWidth >= 640) newNumColumns = 4;
    else newNumColumns = 3;
    
    setNumColumns(newNumColumns);
    
    const durations = Array.from({ length: newNumColumns }, () => getRandomDuration());
    setColumnDurations(durations);
  }, [getRandomDuration]);

  // Initialize and handle resize
  useEffect(() => {
    setIsClient(true);
    updateColumns();
    
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateColumns, 150);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateColumns]);

  // Split stores into columns for animation
  const splitIntoColumns = useCallback((arr, cols) => {
    if (!arr || arr.length === 0) {
      return Array.from({ length: cols }, () => []);
    }
    
    let processArr = arr;
    const minItemsPerColumn = 10;
    const totalNeeded = cols * minItemsPerColumn;
    
    if (arr.length < totalNeeded) {
      const multiplier = Math.ceil(totalNeeded / arr.length);
      processArr = Array.from({ length: multiplier }, () => arr).flat();
    }
    
    return Array.from({ length: cols }, (_, i) =>
      processArr.filter((_, idx) => idx % cols === i)
    );
  }, []);

  // Pause/play animation on touch (mobile)
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY;
    
    if (Math.abs(diff) > 50) {
      // Pause/resume logic if needed
    }
  };

  // If no stores or not client yet, show minimal fallback
  if (!stores || stores.length === 0 || !isClient) {
    return (
      <section className='affiliates_section'>
        <div className="affiliates_content_container">
          <div className="search-bar-wrapper">
            <h1 className="hero-title">
              {t('heroTitle', { defaultValue: 'Find the Best Deals' })}
            </h1>
          </div>
          <div className="brands-wrapper">
            <div className="brands-columns" style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
              {Array.from({ length: numColumns }).map((_, colIdx) => (
                <div key={colIdx} className="brand-column">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="brand-card">
                      <div className="store-name-fallback">
                        {t('loading', { defaultValue: 'Loading...' })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const activeColumns = splitIntoColumns(stores, numColumns);

  return (
    <section 
      className='affiliates_section'
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="affiliates_content_container">
        <div className="search-bar-wrapper">
          <h1 className="hero-title">
            {t('heroTitle', { defaultValue: 'Find the Best Deals' })}
          </h1>
        </div>

        <div className="brands-wrapper">
          <div 
            className="brands-columns" 
            style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}
          >
            {activeColumns.map((col, colIdx) => (
              <div
                key={colIdx}
                className="brand-column"
                style={{
                  animationDuration: `${columnDurations[colIdx] || 60}s`,
                  animationDelay: `${colIdx * -10}s`,
                  animationPlayState: 'running',
                  ...(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches 
                    ? { animation: 'none' }
                    : {})
                }}
              >
                {[...col, ...col].map((store, i) => {
                  const uniqueKey = `${store.id || i}-${colIdx}-${i}`;
                  
                  return (
                    <Link
                      href={`/${locale}/stores/${store.slug}`}
                      className="brand-card" 
                      key={uniqueKey}
                      aria-label={store.name}
                      prefetch={false}
                    >
                      <div className="brand-card-bg"></div>
                      
                      {store.logo ? (
                        <Image 
                          className='affiliate_logo' 
                          src={store.logo} 
                          alt={store.name} 
                          width={120}
                          height={120}
                          loading={i < 8 ? "eager" : "lazy"}
                          sizes="(max-width: 640px) 70px, (max-width: 768px) 90px, (max-width: 1024px) 100px, 120px"
                        />
                      ) : (
                        <span className="store-name-fallback">
                          {store.name.length > 12 
                            ? `${store.name.substring(0, 12)}...` 
                            : store.name}
                        </span>
                      )}
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