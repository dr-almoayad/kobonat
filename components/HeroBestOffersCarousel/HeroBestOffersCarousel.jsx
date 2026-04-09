'use client';
// components/HeroBestOffersCarousel/HeroBestOffersCarousel.jsx
//
// Modern, mobile-first carousel for exclusive offers.
// Features: horizontal snap scrolling, light cards, gradient animated title.
// No share button, no description – clean and focused.

import './HeroBestOffersCarousel.css';
import { useState, useRef, useEffect } from 'react';

export default function HeroBestOffersCarousel({ vouchers = [], locale = 'ar-SA', heading }) {
  const lang = locale.split('-')[0];
  const isRtl = lang === 'ar';
  const slides = vouchers.slice(0, 6);
  const total = slides.length;

  const [copiedCode, setCopiedCode] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

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
    }, 2000);
  };

  const handleReveal = (voucher) => {
    if (voucher.code) {
      navigator.clipboard?.writeText(voucher.code).catch(() => {});
      const message = isRtl ? `تم نسخ: ${voucher.code}` : `Copied: ${voucher.code}`;
      showToast(message);
    } else if (voucher.landingUrl) {
      window.open(voucher.landingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const defaultHeading = isRtl
    ? 'عروض حصرية لا تفوتك'
    : 'Exclusive Offers Just For You';

  const handleCardClick = (voucher) => {
    handleReveal(voucher);
  };

  if (!total) return null;

  return (
    <div className="hero-offers-root" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="hero-offers-section">
        <div className="hero-offers-inner">
          {/* Modern sales title with shine effect */}
          <div className="hero-offers-header">
            <div className="hero-offers-title-wrapper">
              <h2 className="hero-offers-title">
                {heading || defaultHeading}
              </h2>
            </div>
          </div>

          {/* Horizontal snap carousel */}
          <div className="hero-offers-scroll-container">
            <div className="hero-offers-track">
              {slides.map((voucher, idx) => {
                const translation = voucher.translations?.find(tr => tr.locale === lang)
                  || voucher.translations?.[0]
                  || {};

                const storeName = voucher.store?.name
                  || voucher.store?.translations?.[0]?.name
                  || '';

                const storeLogo = voucher.store?.logo || null;

                const displayTitle = translation.title
                  || voucher.discount
                  || (isRtl ? 'عرض حصري' : 'Exclusive Offer');

                return (
                  <div key={voucher.id} className="hero-offers-slide">
                    <div 
                      className="hero-offers-card"
                      onClick={() => handleCardClick(voucher)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCardClick(voucher);
                        }
                      }}
                    >
                      <div className="hero-offers-card-content">
                        <div className="hero-offers-brand-row">
                          {storeLogo ? (
                            <img
                              src={storeLogo}
                              alt={storeName}
                              className="hero-offers-store-logo"
                              loading={idx === 0 ? 'eager' : 'lazy'}
                            />
                          ) : (
                            <span style={{ fontWeight: 600, fontSize: '1rem', color: '#212529' }}>
                              {storeName}
                            </span>
                          )}
                          <span className="hero-offers-exclusive-tag">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            {isRtl ? 'حصري' : 'Exclusive'}
                          </span>
                        </div>

                        <h3 className="hero-offers-voucher-title">{displayTitle}</h3>

                        <button 
                          className="hero-offers-reveal-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReveal(voucher);
                          }}
                          aria-label={isRtl ? 'كشف الكود' : 'Reveal code'}
                        >
                          {isRtl ? 'احصل على العرض' : 'Get Offer'}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

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
