'use client';
// components/HeroCuratedCarousel/HeroCuratedCarousel.jsx
//
// Carousel driven by vouchers where isExclusive = true (max 4).
// Admin control: tick "Exclusive Voucher" on any voucher in /admin/vouchers.
// Order:  popularityScore DESC  (bump the score to reorder slides).
// Image:  store.coverImage → store.bigLogo → store.logo (fallback).
//
// Left  card → store logo + voucher title + description + CTA
// Right card → store image

import { useState, useEffect, useRef, useCallback } from 'react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

  .hcc-root {
    --hcc-bg:      #f8f7f4;
    --hcc-card:    #ffffff;
    --hcc-ink:     #111111;
    --hcc-muted:   #888888;
    --hcc-border:  #e2e0db;
    --hcc-cta:     #111111;
    --hcc-cta-txt: #ffffff;
    --hcc-radius:  18px;
    --hcc-shadow:  0 6px 40px rgba(0,0,0,0.11);
    font-family: 'DM Sans', sans-serif;
  }

  .hcc-section {
    background: var(--hcc-bg);
    padding: 60px 0 72px;
    overflow: hidden;
  }

  .hcc-inner {
    max-width: 1160px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* ── Header ── */
  .hcc-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 32px;
    gap: 16px;
    flex-wrap: wrap;
  }

  .hcc-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(22px, 3.5vw, 36px);
    font-weight: 700;
    color: var(--hcc-ink);
    line-height: 1.15;
    margin: 0;
  }

  .hcc-arrows {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }

  .hcc-arrow {
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 1.5px solid var(--hcc-border);
    background: var(--hcc-card);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #444;
    transition: background .18s, border-color .18s, color .18s, transform .15s;
  }
  .hcc-arrow:hover:not(:disabled) {
    background: var(--hcc-cta); border-color: var(--hcc-cta); color: #fff;
    transform: scale(1.06);
  }
  .hcc-arrow:disabled { opacity: .3; cursor: default; }

  /* ── Viewport ── */
  .hcc-viewport {
    overflow: hidden;
    border-radius: var(--hcc-radius);
    box-shadow: var(--hcc-shadow);
  }

  .hcc-track {
    display: flex;
    /* transform set inline */
    transition: transform .5s cubic-bezier(.25,0,.1,1);
    will-change: transform;
  }

  /* ── Slide (pair of cards) ── */
  .hcc-slide {
    min-width: 100%;
    display: grid;
    grid-template-columns: 46% 54%;
  }

  /* ── Left (info) ── */
  .hcc-info {
    background: var(--hcc-card);
    padding: 48px 52px 44px;
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 360px;
  }

  .hcc-store-logo {
    max-height: 42px;
    max-width: 180px;
    object-fit: contain;
    object-position: left;
    margin-bottom: 22px;
  }

  .hcc-store-name-text {
    font-size: 20px;
    font-weight: 700;
    color: var(--hcc-ink);
    margin-bottom: 22px;
  }

  .hcc-exclusive-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--hcc-muted);
    margin-bottom: 10px;
  }

  .hcc-voucher-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(18px, 2vw, 24px);
    font-weight: 700;
    color: var(--hcc-ink);
    line-height: 1.3;
    margin: 0 0 12px;
  }

  .hcc-voucher-desc {
    font-size: 14px;
    color: #666;
    line-height: 1.65;
    margin: 0;
    flex: 1;
  }

  .hcc-actions {
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .hcc-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--hcc-cta);
    color: var(--hcc-cta-txt);
    padding: 13px 24px;
    border-radius: 5px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .09em;
    text-transform: uppercase;
    text-decoration: none;
    border: none; cursor: pointer;
    transition: opacity .18s, transform .15s;
  }
  .hcc-cta-btn:hover { opacity: .82; transform: translateY(-1px); }

  .hcc-code-pill {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    background: #f4f3f0;
    border: 1.5px dashed #c8c5bc;
    border-radius: 7px;
    padding: 9px 15px;
    font-size: 13px;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    letter-spacing: .1em;
    color: var(--hcc-ink);
    cursor: pointer;
    transition: background .16s;
  }
  .hcc-code-pill:hover { background: #ebe8e0; }

  .hcc-copy-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--hcc-muted);
  }

  /* ── Right (image) ── */
  .hcc-image {
    position: relative;
    overflow: hidden;
    min-height: 360px;
  }
  .hcc-image img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform .65s ease;
  }
  .hcc-viewport:hover .hcc-image img { transform: scale(1.04); }
  .hcc-image-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(160deg, rgba(0,0,0,.14) 0%, transparent 55%);
    pointer-events: none;
  }

  /* ── Dots ── */
  .hcc-dots {
    display: flex; justify-content: center;
    gap: 8px; margin-top: 22px;
  }
  .hcc-dot {
    width: 8px; height: 8px; border-radius: 50%;
    border: none; padding: 0; cursor: pointer;
    background: #ccc;
    transition: background .2s, transform .2s;
  }
  .hcc-dot.on { background: var(--hcc-ink); transform: scale(1.4); }

  /* ── Toast ── */
  .hcc-toast {
    position: fixed; bottom: 28px; left: 50%;
    transform: translateX(-50%) translateY(14px);
    background: #111; color: #fff;
    font-size: 13px; font-weight: 500;
    padding: 10px 22px; border-radius: 40px;
    pointer-events: none; opacity: 0;
    transition: opacity .22s, transform .22s;
    z-index: 9999; white-space: nowrap;
  }
  .hcc-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

  /* ── Responsive ── */
  @media (max-width: 680px) {
    .hcc-slide { grid-template-columns: 1fr; }
    .hcc-image { min-height: 220px; order: -1; }
    .hcc-info  { padding: 32px 28px; min-height: auto; }
    .hcc-header { flex-direction: column; align-items: flex-start; }
  }
`;

export default function HeroCuratedCarousel({ vouchers = [], locale = 'ar-SA', heading }) {
  const lang  = locale.split('-')[0];
  const isRtl = lang === 'ar';
  const slides = vouchers.slice(0, 4);
  const total  = slides.length;

  const [idx,     setIdx]    = useState(0);
  const [copied,  setCopied] = useState('');
  const [toast,   setToast]  = useState(false);
  const timer = useRef(null);

  const go = useCallback(n => setIdx(i => Math.max(0, Math.min(total - 1, i + n))), [total]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'ArrowLeft')  go(isRtl ?  1 : -1);
      if (e.key === 'ArrowRight') go(isRtl ? -1 :  1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, isRtl]);

  function copyCode(code) {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setToast(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 2200);
  }

  const defaultHeading = isRtl
    ? 'أفضل الكوبونات والعروض الحصرية'
    : 'The Best Coupons, Promo Codes & Cash Back Offers';

  if (!total) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <section className="hcc-root hcc-section" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="hcc-inner">

          {/* Header */}
          <div className="hcc-header">
            <h2 className="hcc-title">{heading || defaultHeading}</h2>
            <div className="hcc-arrows">
              <button className="hcc-arrow" onClick={() => go(isRtl ? 1 : -1)} disabled={idx === 0} aria-label="Previous">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="hcc-arrow" onClick={() => go(isRtl ? -1 : 1)} disabled={idx === total - 1} aria-label="Next">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

          {/* Carousel */}
          <div className="hcc-viewport">
            <div
              className="hcc-track"
              style={{ transform: `translateX(${isRtl ? idx : -idx} * 100%)` }}
              // Note: inline style override below for correct RTL/LTR direction
            >
              {slides.map((v, i) => {
                const t = v.translations?.find(tr => tr.locale === lang)
                       || v.translations?.[0]
                       || {};

                const storeName = v.store?.name
                               || v.store?.translations?.[0]?.name
                               || '';
                const storeLogo = v.store?.logo;
                // Pick best image: coverImage > bigLogo > logo
                const storeImg  = v.store?.coverImage
                               || v.store?.bigLogo
                               || v.store?.logo;

                const offset = (i - idx) * (isRtl ? -100 : -100);

                return (
                  <div
                    key={v.id}
                    className="hcc-slide"
                    style={{ transform: `translateX(${offset}%)` }}
                    aria-hidden={i !== idx}
                  >
                    {/* Left: info */}
                    <div className="hcc-info">
                      {storeLogo
                        ? <img src={storeLogo} alt={storeName} className="hcc-store-logo" />
                        : <div className="hcc-store-name-text">{storeName}</div>
                      }

                      <span className="hcc-exclusive-tag">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        {isRtl ? 'عرض حصري' : 'Exclusive Offer'}
                      </span>

                      <h3 className="hcc-voucher-title">{t.title || v.discount || storeName}</h3>

                      {t.description && (
                        <p className="hcc-voucher-desc">{t.description}</p>
                      )}

                      <div className="hcc-actions">
                        <a
                          href={v.landingUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hcc-cta-btn"
                        >
                          {v.code
                            ? (isRtl ? 'اكشف الكود' : 'Reveal Code')
                            : (isRtl ? 'احصل على العرض' : 'Get Deal')
                          }
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </a>

                        {v.code && (
                          <button className="hcc-code-pill" onClick={() => copyCode(v.code)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            {v.code}
                            <span className="hcc-copy-label">
                              {copied === v.code ? '✓' : (isRtl ? 'نسخ' : 'Copy')}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: image */}
                    <div className="hcc-image">
                      {storeImg && <img src={storeImg} alt={storeName} loading={i === 0 ? 'eager' : 'lazy'} />}
                      <div className="hcc-image-overlay" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots */}
          {total > 1 && (
            <div className="hcc-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`hcc-dot ${i === idx ? 'on' : ''}`}
                  onClick={() => setIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className={`hcc-toast ${toast ? 'show' : ''}`}>
        ✓ {isRtl ? `تم نسخ: ${copied}` : `Copied: ${copied}`}
      </div>
    </>
  );
}
