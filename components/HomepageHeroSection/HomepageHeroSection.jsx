// components/HomepageHeroSection/HomepageHeroSection.jsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './HomepageHeroSection.css';

// movement icon helper
function MovementIcon({ movement, rank, previousRank }) {
  if (movement === 'NEW') {
    return <span className="hhs-badge hhs-badge--new">NEW</span>;
  }
  if (movement === 'UP') {
    const diff = (previousRank || rank) - rank;
    return (
      <span className="hhs-movement hhs-movement--up">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1L9 7H1L5 1Z" fill="currentColor"/></svg>
        {diff > 0 && diff}
      </span>
    );
  }
  if (movement === 'DOWN') {
    const diff = rank - (previousRank || rank);
    return (
      <span className="hhs-movement hhs-movement--down">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 9L1 3H9L5 9Z" fill="currentColor"/></svg>
        {diff > 0 && diff}
      </span>
    );
  }
  return <span className="hhs-movement hhs-movement--same">—</span>;
}

export default function HomepageHeroSection({ stores = [], leaderboard = [], locale = 'en-SA' }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const isRTL = locale?.startsWith('ar');
  const language = locale?.split('-')[0];

  // Ensure we have at least one store
  if (!stores.length) return null;

  const mainStore = stores[activeIdx] || stores[0];
  const thumbnailStores = stores.filter((_, i) => i !== activeIdx);

  const leaderboardLabel = language === 'ar' ? 'جدول المتاجر' : 'Store Leaderboard';
  const viewAllLabel     = language === 'ar' ? 'عرض الكل' : 'View all';
  const offerLabel       = language === 'ar' ? 'اكتشف العروض' : 'Explore Deals';
  const upcomingLabel    = language === 'ar' ? 'المتاجر المميزة' : 'Featured Stores';
  const savingsLabel     = language === 'ar' ? 'توفير' : 'Savings';

  return (
    <div className="hhs-wrapper" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="hhs-inner">

        {/* ── LEFT: Main Store Cover ───────────────────────────────── */}
        <div className="hhs-main">
          <Link href={`/${locale}/stores/${mainStore.slug}`} className="hhs-cover-link">
            <div className="hhs-cover">
              {mainStore.coverImage ? (
                <Image
                  src={mainStore.coverImage}
                  alt={mainStore.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              ) : (
                <div className="hhs-cover-placeholder">
                  {mainStore.logo && (
                    <Image
                      src={mainStore.logo}
                      alt={mainStore.name}
                      width={120}
                      height={120}
                      style={{ objectFit: 'contain' }}
                    />
                  )}
                </div>
              )}

              {/* Gradient overlay */}
              <div className="hhs-cover-overlay" />

              {/* Store branding at bottom */}
              <div className="hhs-cover-info">
                {mainStore.logo && (
                  <div className="hhs-cover-logo">
                    <Image
                      src={mainStore.logo}
                      alt={mainStore.name}
                      width={44}
                      height={44}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                )}
                <div className="hhs-cover-name-block">
                  <p className="hhs-cover-name">{mainStore.name}</p>
                  <p className="hhs-cover-cta">{offerLabel} →</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Show Offer badge */}
          {mainStore.showOffer && (
            <div className="hhs-show-offer">
              <span className="hhs-offer-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                {mainStore.showOffer}
              </span>
            </div>
          )}
        </div>

        {/* ── MIDDLE: Thumbnails ───────────────────────────────────── */}
        <div className="hhs-thumbnails-panel">
          <div className="hhs-panel-header">
            <span className="hhs-panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              {upcomingLabel}
            </span>
            <Link href={`/${locale}/stores`} className="hhs-view-all">{viewAllLabel} →</Link>
          </div>

          <div className="hhs-thumb-list">
            {stores.map((store, idx) => (
              <button
                key={store.id}
                className={`hhs-thumb-item${idx === activeIdx ? ' hhs-thumb-item--active' : ''}`}
                onClick={() => setActiveIdx(idx)}
              >
                <div className="hhs-thumb-img-wrap">
                  {store.coverImage ? (
                    <Image
                      src={store.coverImage}
                      alt={store.name}
                      fill
                      sizes="160px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : store.logo ? (
                    <Image
                      src={store.logo}
                      alt={store.name}
                      fill
                      sizes="160px"
                      style={{ objectFit: 'contain', padding: '8px' }}
                    />
                  ) : (
                    <div className="hhs-thumb-placeholder" />
                  )}
                  {/* Store logo overlay */}
                  {store.logo && store.coverImage && (
                    <div className="hhs-thumb-logo-badge">
                      <Image src={store.logo} alt="" width={20} height={20} style={{ objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
                <div className="hhs-thumb-info">
                  <p className="hhs-thumb-name">{store.name}</p>
                  {store.showOffer && (
                    <p className="hhs-thumb-offer">{store.showOffer}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Leaderboard ───────────────────────────────────── */}
        <div className="hhs-leaderboard-panel">
          <div className="hhs-panel-header">
            <span className="hhs-panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              {leaderboardLabel}
            </span>
            <Link href={`/${locale}/leaderboard`} className="hhs-view-all">{viewAllLabel} →</Link>
          </div>

          <div className="hhs-lb-cols">
            <span className="hhs-lb-col-label" style={{ width: 30 }}>#</span>
            <span className="hhs-lb-col-label hhs-lb-store-col">{language === 'ar' ? 'المتجر' : 'Store'}</span>
            <span className="hhs-lb-col-label" style={{ textAlign: 'end' }}>{savingsLabel}</span>
          </div>

          <div className="hhs-lb-list">
            {leaderboard.length === 0 ? (
              <p className="hhs-lb-empty">{language === 'ar' ? 'لا توجد بيانات' : 'No data yet'}</p>
            ) : (
              leaderboard.map((entry) => {
                const storeName = entry.store?.translations?.[0]?.name || entry.store?.name || '—';
                const storeSlug = entry.store?.translations?.[0]?.slug || '';
                const storeLogo = entry.store?.logo;
                const savings   = entry.savingsOverridePercent ?? entry.calculatedMaxSavingsPercent ?? 0;

                return (
                  <Link
                    key={entry.id || entry.storeId}
                    href={storeSlug ? `/${locale}/stores/${storeSlug}` : '#'}
                    className={`hhs-lb-row${entry.rank <= 3 ? ` hhs-lb-row--top${entry.rank}` : ''}`}
                  >
                    <div className="hhs-lb-rank">
                      {entry.rank <= 3 ? (
                        <span className={`hhs-rank-medal hhs-rank-medal--${entry.rank}`}>
                          {entry.rank}
                        </span>
                      ) : (
                        <span className="hhs-rank-num">{entry.rank}</span>
                      )}
                    </div>

                    <div className="hhs-lb-store">
                      <div className="hhs-lb-logo">
                        {storeLogo ? (
                          <Image src={storeLogo} alt={storeName} width={24} height={24} style={{ objectFit: 'contain' }} />
                        ) : (
                          <span className="hhs-lb-logo-fallback">{storeName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="hhs-lb-store-name-wrap">
                        <span className="hhs-lb-store-name">{storeName}</span>
                        <MovementIcon movement={entry.movement} rank={entry.rank} previousRank={entry.previousRank} />
                      </div>
                    </div>

                    <div className="hhs-lb-savings">
                      <span className="hhs-savings-pill">
                        {savings > 0 ? `${Math.round(savings)}%` : '—'}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
