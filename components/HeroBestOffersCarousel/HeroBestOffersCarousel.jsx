'use client';
// components/HeroBestOffersCarousel/HeroBestOffersCarousel.jsx
//
// Mobile-first carousel driven by vouchers where isExclusive = true (max 4).
// No arrows or dots – users swipe / scroll horizontally with snap points.
// Matches the uploaded image design.

import './HeroBestOffersCarousel.css'; // Import external CSS
import { useState, useRef, useEffect } from 'react';

export default function HeroBestOffersCarousel({ vouchers = [], locale = 'ar-SA', heading }) {
  const lang = locale.split('-')[0];
  const isRtl = lang === 'ar';
  const slides = vouchers.slice(0, 4);
  const total = slides.length;

  const [copiedCode, setCopiedCode] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (message) => {
    setCopiedCode(message);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToastVisible(false);
      setCopiedCode('');
    }, 2200);
  };

  // Handle REVEAL CODE click
  const handleReveal = (voucher) => {
    if (voucher.code) {
      // Copy code to clipboard
      navigator.clipboard?.writeText(voucher.code).catch(() => {});
      const message = isRtl ? `تم نسخ: ${voucher.code}` : `Copied: ${voucher.code}`;
      showToast(message);
    } else if (voucher.landingUrl) {
      // No code, navigate to offer
      window.open(voucher.landingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle SHARE
  const handleShare = async (voucher) => {
    const shareUrl = voucher.landingUrl || window.location.href;
    const shareTitle = voucher.translations?.[0]?.title || voucher.discount || 'Special offer';
    const shareText = voucher.translations?.[0]?.description || 'Check out this exclusive offer!';

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed – fallback to copy link
        copyShareLink(shareUrl);
      }
    } else {
      copyShareLink(shareUrl);
    }
  };

  const copyShareLink = (url) => {
    navigator.clipboard?.writeText(url).catch(() => {});
    const message = isRtl ? 'تم نسخ الرابط' : 'Link copied!';
    showToast(message);
  };

  const defaultHeading = isRtl
    ? 'أفضل الكوبونات والعروض الحصرية'
    : 'The Best Coupons, Promo Codes & Cash Back Offers';

  if (!total) return null;

  return (
    <div className="hero-offers-root" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="hero-offers-section">
        <div className="hero-offers-inner">
          {/* Header – title only, no arrows */}
          <div className="hero-offers-header">
            <h2 className="hero-offers-title">{heading || defaultHeading}</h2>
          </div>

          {/* Horizontal snap carousel – no JS navigation */}
          <div className="hero-offers-scroll-container">
            <div className="hero-offers-track">
              {slides.map((voucher, idx) => {
                // Extract translation and store data
                const translation = voucher.translations?.find(tr => tr.locale === lang)
                  || voucher.translations?.[0]
                  || {};

                const storeName = voucher.store?.name
                  || voucher.store?.translations?.[0]?.name
                  || '';

                const storeLogo = voucher.store?.logo || null;

                // Title priority: translation.title → voucher.discount → storeName
                const displayTitle = translation.title
                  || voucher.discount
                  || (isRtl ? 'عرض حصري' : 'Exclusive Offer');

                const displayDesc = translation.description || '';

                return (
                  <div key={voucher.id} className="hero-offers-slide">
                    <div className="hero-offers-card">
                      <div className="hero-offers-card-content">
                        {/* Brand row: logo + exclusive badge */}
                        <div className="hero-offers-brand-row">
                          {storeLogo ? (
                            <img
                              src={storeLogo}
                              alt={storeName}
                              className="hero-offers-store-logo"
                              loading={idx === 0 ? 'eager' : 'lazy'}
                            />
                          ) : (
                            <span className="hero-offers-store-name-text" style={{ fontWeight: 600, fontSize: '1rem' }}>
                              {storeName}
                            </span>
                          )}
                          <span className="hero-offers-exclusive-tag">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            {isRtl ? 'عرض حصري' : 'Exclusive Offer'}
                          </span>
                        </div>

                        {/* Offer title */}
                        <h3 className="hero-offers-voucher-title">{displayTitle}</h3>

                        {/* Description (optional) */}
                        {displayDesc && (
                          <p className="hero-offers-voucher-desc">{displayDesc}</p>
                        )}

                        {/* Action buttons */}
                        <div className="hero-offers-actions">
                          <button
                            onClick={() => handleReveal(voucher)}
                            className="hero-offers-reveal-btn"
                            aria-label={isRtl ? 'كشف الكود' : 'Reveal code'}
                          >
                            {isRtl ? 'كشف الكود' : 'REVEAL CODE'}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleShare(voucher)}
                            className="hero-offers-share-btn"
                            aria-label={isRtl ? 'مشاركة' : 'Share'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                              <polyline points="16 6 12 2 8 6" />
                              <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                            {isRtl ? 'مشاركة' : 'SHARE'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Toast notification */}
      <div className={`hero-offers-toast ${toastVisible ? 'show' : ''}`}>
        {toastVisible && (
          <>
            ✓ {copiedCode}
          </>
        )}
      </div>
    </div>
  );
                            }
