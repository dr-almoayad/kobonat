'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './StoreHeader.css';

const StoreHeader = ({ 
  store, 
  mostTrackedVoucher, 
  paymentMethods = [],
  bnplMethods = [],
  locale,
  country 
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const descriptionRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  
  const isArabic = locale?.startsWith('ar');
  const dir = isArabic ? 'rtl' : 'ltr';

  // Safe Checks & Defaults
  const storeName = store?.name || 'Store';
  const storeLogo = store?.logo;
  const storeCover = store?.coverImage;
  const storeDescription = store?.description;
  const categories = store?.categories || [];
  const websiteUrl = store?.websiteUrl;

  const topVoucherTitle = mostTrackedVoucher?.title || null;
  const voucherCode = mostTrackedVoucher?.code;

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // CLEAN SCROLL HANDLER - No stuttering
  useEffect(() => {
    let ticking = false;
    
    const updateScrollState = () => {
      const scrollY = window.scrollY;
      
      // Simple hysteresis: collapse at 180px, expand at 120px
      if (scrollY > 180) {
        setIsScrolled(true);
      } else if (scrollY < 120) {
        setIsScrolled(false);
      }
      // Between 120-180px: maintain current state (dead zone)
      
      ticking = false;
    };
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    };
    
    // Set initial state
    updateScrollState();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Overflow detection for Read More button
  useLayoutEffect(() => {
    const checkOverflow = () => {
      const element = descriptionRef.current;
      if (element && storeDescription) {
        const isOverflowing = element.scrollHeight > element.clientHeight + 2;
        setIsDescriptionOverflowing(isOverflowing);
      }
    };

    checkOverflow();
    
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(checkOverflow, 150);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [storeDescription, isLoading]);

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const handleCopyAndTrack = async () => {
    if (!voucherCode) {
      if (websiteUrl) window.open(websiteUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      await navigator.clipboard.writeText(voucherCode);
      setIsCopied(true);
      if (navigator.vibrate) navigator.vibrate(50);

      if (mostTrackedVoucher?.id) {
        fetch('/api/vouchers/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            voucherId: mostTrackedVoucher.id,
            countryCode: country?.code 
          })
        }).catch(err => console.error('Tracking Error:', err));
      }

      setTimeout(() => {
        if (websiteUrl) window.open(websiteUrl, '_blank', 'noopener,noreferrer');
      }, 800);
      
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error('Copy failed:', err);
      if (websiteUrl) window.open(websiteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!store && !isLoading) return null;

  if (isLoading) {
    return (
      <div className="sh-skeleton-container">
        <div className="sh-skeleton-banner" />
        <div className="sh-skeleton-content">
          <div className="sh-skeleton-logo" />
          <div className="sh-skeleton-lines" />
        </div>
      </div>
    );
  }

  return (
    <header 
      className={`sh-container ${isScrolled ? 'sh-scrolled' : ''}`} 
      dir={dir}
    >
      {/* BACKGROUND BANNER */}
      <div className="sh-banner-wrapper">
        {storeCover ? (
          <Image
            src={storeCover}
            alt={`${storeName} cover`}
            fill
            className="sh-banner-img"
            priority
            quality={80}
            sizes="100vw"
          />
        ) : (
          <div className="sh-banner-placeholder" />
        )}
        <div className="sh-banner-overlay" />
      </div>

      {/* MAIN CONTENT */}
      <div className="sh-content-wrapper">
        <div className="sh-main-grid">
          
          {/* LEFT: Logo + Name */}
          <div className="sh-identity-col">
            <div className="sh-logo-wrapper">
              {storeLogo ? (
                <Image 
                  src={storeLogo} 
                  alt={`${storeName} logo`} 
                  width={80} 
                  height={80} 
                  className="sh-logo-img"
                  quality={90}
                />
              ) : (
                <div className="sh-logo-fallback">
                  {storeName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="sh-identity-text">
              <h1 className="sh-store-name">{storeName}</h1>
              
              <div className="sh-meta-row">
                {country?.name && (
                  <span className="sh-meta-item">
                    <span className="material-symbols-sharp">public</span>
                    {country.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE: Description & Categories */}
          <div className="sh-details-container">
            {storeDescription && (
              <div className="sh-description-wrapper">
                <p 
                  ref={descriptionRef}
                  className={`sh-description ${isDescriptionExpanded ? 'expanded' : ''}`}
                >
                  {storeDescription}
                </p>
                
                {(isDescriptionOverflowing || isDescriptionExpanded) && (
                  <button 
                    onClick={toggleDescription}
                    className="sh-read-more-btn"
                    type="button"
                    aria-expanded={isDescriptionExpanded}
                    aria-label={isDescriptionExpanded 
                      ? (isArabic ? 'عرض أقل' : 'Show less')
                      : (isArabic ? 'عرض المزيد' : 'Read more')
                    }
                  >
                    {isDescriptionExpanded 
                      ? (isArabic ? 'عرض أقل' : 'Read less')
                      : (isArabic ? 'عرض المزيد' : 'Read more')
                    }
                  </button>
                )}
              </div>
            )}

            {categories.length > 0 && (
              <div className="sh-categories-scroll">
                {categories.map((cat) => (
                  <Link 
                    key={cat.id} 
                    href={`/${locale}/stores/${cat.slug}`}
                    className="sh-cat-pill"
                    style={{ '--hover-color': cat.color || '#6366f1' }}
                  >
                    {cat.icon && (
                      <span className="material-symbols-sharp" aria-hidden="true">
                        {cat.icon}
                      </span>
                    )}
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {(paymentMethods.length > 0 || bnplMethods.length > 0) && (
              <div className="sh-payments-row">
                {bnplMethods.map(pm => (
                  <div 
                    key={pm.id} 
                    className="sh-pay-icon bnpl" 
                    title={pm.name}
                  >
                    {pm.logo ? (
                      <Image 
                        src={pm.logo} 
                        alt={pm.name} 
                        width={72} 
                        height={36}
                        quality={90}
                      />
                    ) : (
                      <span>{pm.name}</span>
                    )}
                  </div>
                ))}
                
                {paymentMethods.slice(0, 5).map(pm => (
                  <div 
                    key={pm.id} 
                    className="sh-pay-icon" 
                    title={pm.name}
                  >
                    {pm.logo ? (
                      <Image 
                        src={pm.logo} 
                        alt={pm.name} 
                        width={56} 
                        height={36}
                        quality={90}
                      />
                    ) : (
                      <span className="material-symbols-sharp">credit_card</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: CTA Button (visible when scrolled) */}
          <div className="sh-actions-col">
            {topVoucherTitle && (
              <button 
                className={`sh-cta-btn ${isCopied ? 'copied' : ''}`}
                onClick={handleCopyAndTrack}
                type="button"
                aria-label={isCopied 
                  ? (isArabic ? 'تم النسخ!' : 'Copied!') 
                  : (isArabic ? 'الذهاب للمتجر' : 'Go to Store')
                }
              >
                <span className="material-symbols-sharp" aria-hidden="true">
                  {isCopied ? 'check_circle' : 'arrow_forward'}
                </span>
                <span className="sh-cta-label">
                  {isCopied 
                    ? (isArabic ? 'تم النسخ!' : 'Copied!') 
                    : (isArabic ? 'الذهاب للمتجر' : 'Go to Store')
                  }
                </span>
                {!isCopied && <div className="sh-cta-ripple" aria-hidden="true" />}
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default StoreHeader;
