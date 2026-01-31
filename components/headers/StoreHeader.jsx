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
  const scrollTimeoutRef = useRef(null);
  
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

  // FIXED: Optimized scroll detection with throttling
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    const updateScrolledState = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY);
      
      // Only update if scrolled significantly (reduces flickering)
      if (scrollDifference > 20) {
        // Single threshold with hysteresis to prevent rapid toggling
        if (currentScrollY >= 180) {
          setIsScrolled(true);
        } else if (currentScrollY < 120) {
          setIsScrolled(false);
        }
        lastScrollY = currentScrollY;
      }
      ticking = false;
    };
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrolledState);
        ticking = true;
      }
    };
    
    // Set initial state
    updateScrolledState();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // FIXED: Improved overflow detection
  useLayoutEffect(() => {
    const checkOverflow = () => {
      const element = descriptionRef.current;
      if (element && storeDescription) {
        // More accurate overflow detection
        const isOverflowing = element.scrollHeight > element.clientHeight + 5;
        setIsDescriptionOverflowing(isOverflowing);
      }
    };

    checkOverflow();
    
    // Debounce resize events
    const handleResize = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(checkOverflow, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
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

      // Track voucher usage
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

      // Open store website after brief delay
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
      data-scrolled={isScrolled}
    >
      {/* --- BACKGROUND BANNER --- */}
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

      {/* --- MAIN CONTENT --- */}
      <div className="sh-content-wrapper">
        <div className="sh-main-grid">
          
          {/* 1. LEFT: Identity (Logo + Name) */}
          <div className="sh-identity-col">
            {/* Logo - Always visible, just scales */}
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
              
              {/* Meta info - hides on scroll */}
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

          {/* 2. MIDDLE: Description & Categories - Hides on scroll */}
          <div className="sh-details-container">
            {/* Description */}
            {storeDescription && (
              <div className="sh-description-wrapper">
                <p 
                  ref={descriptionRef}
                  className={`sh-description ${isDescriptionExpanded ? 'expanded' : ''}`}
                >
                  {storeDescription}
                </p>
                
                {/* Show button if overflowing OR already expanded */}
                {(isDescriptionOverflowing || isDescriptionExpanded) && (
                  <button 
                    onClick={toggleDescription}
                    className="sh-read-more-btn"
                    type="button"
                    aria-expanded={isDescriptionExpanded}
                    aria-label={isDescriptionExpanded 
                      ? (isArabic ? 'عرض أقل' : 'Show less description')
                      : (isArabic ? 'عرض المزيد' : 'Show more description')
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

            {/* Categories */}
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

            {/* Payment Methods */}
            {(paymentMethods.length > 0 || bnplMethods.length > 0) && (
              <div className="sh-payments-row">
                {/* BNPL Methods First */}
                {bnplMethods.map(pm => (
                  <div 
                    key={pm.id} 
                    className="sh-pay-icon bnpl" 
                    title={pm.name}
                    aria-label={`Payment method: ${pm.name}`}
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
                
                {/* Regular Payment Methods */}
                {paymentMethods.slice(0, 5).map(pm => (
                  <div 
                    key={pm.id} 
                    className="sh-pay-icon" 
                    title={pm.name}
                    aria-label={`Payment method: ${pm.name}`}
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

          {/* 3. RIGHT: Action Buttons - Only visible when scrolled */}
          <div className="sh-actions-col">
            {/* CTA Button */}
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
                <div className="sh-cta-content">
                  <span className="material-symbols-sharp" aria-hidden="true">
                    {isCopied ? 'check_circle' : 'arrow_forward'}
                  </span>
                  <div className="sh-cta-text-group">
                    <span className="sh-cta-label">
                      {isCopied 
                        ? (isArabic ? 'تم النسخ!' : 'Copied!') 
                        : (isArabic ? 'الذهاب للمتجر' : 'Go to Store')
                      }
                    </span>
                  </div>
                </div>
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
