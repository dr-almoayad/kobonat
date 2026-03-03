// components/HomepageHeroSection/HomepageHeroSection.jsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './HomepageHeroSection.css';

const CYCLE_MS    = 30_000;
const MAX_STORES  = 5;

/* ─── Movement indicator (leaderboard) ───────────────────── */
function Movement({ movement, rank, previousRank }) {
  if (movement === 'NEW') return <span className="hhs-mv hhs-mv--new">NEW</span>;
  if (movement === 'UP') {
    const d = (previousRank || rank) - rank;
    return <span className="hhs-mv hhs-mv--up">▲{d > 0 ? d : ''}</span>;
  }
  if (movement === 'DOWN') {
    const d = rank - (previousRank || rank);
    return <span className="hhs-mv hhs-mv--dn">▼{d > 0 ? d : ''}</span>;
  }
  return <span className="hhs-mv hhs-mv--eq">—</span>;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function HomepageHeroSection({
  stores      = [],
  leaderboard = [],
  locale      = 'en-SA',
}) {
  const [active, setActive]       = useState(0);
  const [fading, setFading]       = useState(false);
  const [pbKey,  setPbKey]        = useState(0);   // re-mount progress-bar
  const timerRef = useRef(null);

  const isRTL = locale.startsWith('ar');
  const lang  = locale.split('-')[0];
  const pool  = stores.slice(0, MAX_STORES);

  /* restart auto-cycle */
  const restartTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (pool.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActive(p => (p + 1) % pool.length);
      setPbKey(p => p + 1);
    }, CYCLE_MS);
  }, [pool.length]);

  useEffect(() => { restartTimer(); return () => clearInterval(timerRef.current); }, [restartTimer]);

  const goTo = (idx) => {
    if (idx === active) return;
    setFading(true);
    setTimeout(() => {
      setActive(idx);
      setPbKey(p => p + 1);
      setFading(false);
      restartTimer();
    }, 200);
  };

  if (!pool.length) return null;

  const store = pool[active];

  /* labels */
  const L = {
    featured:    lang === 'ar' ? 'المتاجر المميزة' : 'Featured Stores',
    leaderboard: lang === 'ar' ? 'أفضل المتاجر'    : 'Store Leaderboard',
    viewAll:     lang === 'ar' ? 'عرض الكل'        : 'View all',
    savings:     lang === 'ar' ? 'توفير'           : 'Savings',
    explore:     lang === 'ar' ? 'استعرض العروض'   : 'Explore Deals',
    week:        lang === 'ar' ? 'هذا الأسبوع'     : 'This Week',
  };

  return (
    <section className="hhs-root" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="hhs-grid">

        {/* ══════════════════════════════════════════════════
            PANEL 1 — Hero card  (cover + cards + info)
        ══════════════════════════════════════════════════ */}
        <div className="hhs-panel hhs-panel--hero">

          {/* Cover image area */}
          <Link
            href={`/${locale}/stores/${store.slug}`}
            className={`hhs-hero-img-link${fading ? ' hhs-hero-img-link--fading' : ''}`}
            tabIndex={-1}
          >
            <div className="hhs-hero-img">
              {store.coverImage
                ? <Image src={store.coverImage} alt={store.name} fill sizes="(max-width:900px) 100vw, 55vw" style={{ objectFit: 'cover' }} priority />
                : <div className="hhs-hero-img-fallback" />
              }

              {/* gradient overlay */}
              <div className="hhs-hero-grad" />

              {/* top badge: "THIS WEEK · FEATURED STORES" */}
              <div className="hhs-hero-topbar">
                <span className="hhs-hero-week">{L.week}</span>
                <span className="hhs-hero-label">{L.featured}</span>
              </div>

             {/* ── THUMBNAIL CARD ROW ── */}
              {/*<div className="hhs-cards-row">
                {pool.map((s, i) => (
                  <button
                    key={s.id}
                    className={`hhs-card${i === active ? ' hhs-card--active' : ''}`}
                    onClick={e => { e.preventDefault(); goTo(i); }}
                    aria-label={s.name}
                  >
                    <div className="hhs-card-img">
                      {s.coverImage
                        ? <Image src={s.coverImage} alt={s.name} fill sizes="140px" style={{ objectFit: 'cover' }} />
                        : <div className="hhs-card-img-fallback" />
                      }
                      {i === active && <div className="hhs-card-ring" />}
                    </div>
              
                    <div className="hhs-card-bar">
                      <span className="hhs-card-name">{s.name}</span>
                    </div>
              
                    <div className="hhs-card-crest">
                      {s.bigLogo
                        ? <Image src={s.bigLogo} alt="" fill style={{ objectFit: 'contain' }} />
                        : <span className="hhs-card-crest-fallback">{s.name.charAt(0)}</span>
                      }
                    </div>
                  </button>
                ))}
              </div>*/}

              {/* progress bar */}
              <div className="hhs-progress" key={pbKey} />
            </div>
          </Link>

          {/* Dark info section below cover */}
          <Link href={`/${locale}/stores/${store.slug}`} className="hhs-info-section">
            <div className="hhs-info-text">
              <p className={`hhs-info-name${fading ? ' hhs-info-name--fading' : ''}`}>{store.name}</p>
              {store.seoTitle && (
                <p className={`hhs-info-seotitle${fading ? ' hhs-info-seotitle--fading' : ''}`}>
                  {store.seoTitle}
                </p>
              )}
              {store.description && (
                <p className={`hhs-info-desc${fading ? ' hhs-info-desc--fading' : ''}`}>
                  {store.description}
                </p>
              )}
            </div>
            <span className="hhs-info-tag">{L.explore} →</span>
          </Link>

        </div>{/* /panel hero */}


        {/* ══════════════════════════════════════════════════
            PANEL 2 — Featured-store news-item list
        ══════════════════════════════════════════════════ */}
        <div className="hhs-panel hhs-panel--list">
          {/*<div className="hhs-list-header">
            <span className="hhs-list-title">{L.featured}</span>
            <Link href={`/${locale}/stores`} className="hhs-viewall">{L.viewAll} →</Link>
          </div>*/}

          <div className="hhs-list-items">
            {pool.map((s, i) => (
              <button
                key={s.id}
                className={`hhs-list-item${i === active ? ' hhs-list-item--active' : ''}`}
                onClick={() => goTo(i)}
              >
                {/* left: text block */}
                <div className="hhs-list-text">
                  <p className="hhs-list-storename">{s.name}</p>
                  {s.seoTitle && <p className="hhs-list-seotitle">{s.seoTitle}</p>}
                  {s.showOffer && (
                    <span className="hhs-list-offer">{s.showOffer}</span>
                  )}
                </div>

                {/* right: thumbnail image */}
                <div className="hhs-list-thumb">
                  {s.coverImage
                    ? <Image src={s.coverImage} alt={s.name} fill sizes="120px" style={{ objectFit: 'cover' }} />
                    : <div className="hhs-list-thumb-fallback" />
                  }
                  {/* bigLogo badge over thumb */}
                  {/*{s.bigLogo && (
                    <div className="hhs-list-thumb-logo">
                      <Image src={s.bigLogo} alt="" fill style={{ objectFit: 'contain' }} />
                    </div>
                  )}*/}
                </div>
              </button>
            ))}
          </div>
        </div>{/* /panel list */}


        {/* ══════════════════════════════════════════════════
            PANEL 3 — Leaderboard
        ══════════════════════════════════════════════════ */}
        <div className="hhs-panel hhs-panel--lb">
          <div className="hhs-lb-header">
            <span class="material-symbols-sharp">leaderboard</span>
            <span className="hhs-lb-title">{L.leaderboard} {L.week}</span>
            {/*<Link href={`/${locale}/leaderboard`} className="hhs-viewall">{L.viewAll} →</Link>*/}
          </div>

          <div className="hhs-lb-col-row">
            <span className="hhs-lb-col">#</span>
            <span className="hhs-lb-col hhs-lb-col--stretch">
              {lang === 'ar' ? 'المتجر' : 'Store'}
            </span>
            <span className="hhs-lb-col hhs-lb-col--end">{L.savings}</span>
          </div>

          <div className="hhs-lb-rows">
            {leaderboard.length === 0 && (
              <p className="hhs-lb-empty">{lang === 'ar' ? 'لا توجد بيانات' : 'No data yet'}</p>
            )}
            {leaderboard.map(entry => {
              const name    = entry.store?.translations?.[0]?.name || '—';
              const slug    = entry.store?.translations?.[0]?.slug || '';
              const logo    = entry.store?.bigLogo || entry.store?.logo;
              const savings = entry.savingsOverridePercent ?? entry.calculatedMaxSavingsPercent ?? 0;

              return (
                <Link
                  key={entry.id ?? entry.rank}
                  href={slug ? `/${locale}/stores/${slug}` : '#'}
                  className={`hhs-lb-row${entry.rank <= 3 ? ` hhs-lb-row--top${entry.rank}` : ''}`}
                >
                  <div className="hhs-lb-rank">
                    {entry.rank <= 3
                      ? <span className={`hhs-medal hhs-medal--${entry.rank}`}>{entry.rank}</span>
                      : <span className="hhs-rank-n">{entry.rank}</span>
                    }
                  </div>

                  <div className="hhs-lb-store">
                    <div className="hhs-lb-logo">
                      {logo
                        ? <Image src={logo} alt={name} width={50} height={50} style={{ objectFit: 'cover' }} />
                        : <span className="hhs-lb-init">{name.charAt(0)}</span>
                      }
                    </div>
                    <div className="hhs-lb-namestack">
                      <span className="hhs-lb-name">{name}</span>
                      <Movement movement={entry.movement} rank={entry.rank} previousRank={entry.previousRank} />
                    </div>
                  </div>

                  <div className="hhs-lb-save">
                    <span className="hhs-save-pill">{savings > 0 ? `${Math.round(savings)}%` : '—'}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>{/* /panel lb */}

      </div>
    </section>
  );
}
