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

  // Optimized Scroll Handler
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Trigger scroll state earlier (100px) for smoother transition
          setIsScrolled(window.scrollY > 130);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fix: Robust Overflow Detection for Read More button
  useLayoutEffect(() => {
    const checkOverflow = () => {
      const element = descriptionRef.current;
      if (element && storeDescription) {
        // Compare scrollHeight (full content) vs clientHeight (visible area)
        // We add a small buffer (1px) to avoid rounding errors
        const isOverflowing = element.scrollHeight > element.clientHeight + 1;
        setIsDescriptionOverflowing(isOverflowing);
      }
    };

    // Run initially
    checkOverflow();

    // Re-run on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [storeDescription, isLoading]);

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const handleCopyAndTrack = async () => {
    if (!voucherCode) {
      if (websiteUrl) window.open(websiteUrl, '_blank');
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
        }).catch(err => console.error('Tracking Error', err));
      }

      setTimeout(() => {
        if (websiteUrl) window.open(websiteUrl, '_blank');
      }, 800);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      if (websiteUrl) window.open(websiteUrl, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `Check out ${storeName} offers!`,
          url: window.location.href,
        });
      } catch (err) { }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(isArabic ? 'تم نسخ الرابط' : 'Link copied');
    }
  };

  if (!store && !isLoading) return null;

  if (isLoading) {
    return <div className="sh-skeleton-container" />;
  }

  return (
    <header 
      className={`sh-container ${isScrolled ? 'sh-scrolled' : ''}`} 
      dir={dir}
    >
      {/* --- BACKGROUND BANNER --- */}
      <div className="sh-banner-wrapper">
        {storeCover ? (
          <Image
            src={storeCover}
            alt="Cover"
            fill
            className="sh-banner-img"
            priority
            quality={75}
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
            <div className="sh-logo-wrapper">
              {storeLogo ? (
                <Image 
                  src={storeLogo} 
                  alt={storeName} 
                  width={100} 
                  height={100} 
                  className="sh-logo-img"
                  priority
                />
              ) : (
                <div className="sh-logo-fallback">{storeName.charAt(0)}</div>
              )}
            </div>
            
            <div className="sh-identity-text">
              <h1 className="sh-store-name">{storeName}</h1>
              {/* Meta info hides on scroll */}
              <div className="sh-meta-row">
                {/*<span className="sh-meta-item">
                  <span className="material-symbols-sharp">local_offer</span>
                  {Math.floor(Math.random() * 10) + 5} {isArabic ? 'عروض' : 'Offers'}
                </span>*/}
                {country?.name && (
                  <span className="sh-meta-item">
                    <span className="material-symbols-sharp">public</span>
                    {country.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. MIDDLE: Description & Categories (Hides completely on scroll) */}
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
                {/* Button Logic Fixed: Only show if overflowing OR if already expanded */}
                {(isDescriptionOverflowing || isDescriptionExpanded) && (
                  <button 
                    onClick={toggleDescription}
                    className="sh-read-more-btn"
                    type="button"
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
                    {cat.icon && <span className="material-symbols-sharp">{cat.icon}</span>}
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Payments */}
            {(paymentMethods.length > 0 || bnplMethods.length > 0) && (
              <div className="sh-payments-row">
                {bnplMethods.map(pm => (
                  <div key={pm.id} className="sh-pay-icon bnpl" title={pm.name}>
                   {pm.logo ? <Image src={pm.logo} alt={pm.name} width={40} height={24} /> : <span>{pm.name}</span>}
                  </div>
                ))}
                {paymentMethods.slice(0, 4).map(pm => (
                  <div key={pm.id} className="sh-pay-icon" title={pm.name}>
                    {pm.logo ? <Image src={pm.logo} alt={pm.name} width={30} height={20} /> : <span className="material-symbols-sharp">credit_card</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. RIGHT: Action Buttons (Always visible) */}
          <div className="sh-actions-col">
            {/*<button 
              className="sh-share-btn"
              onClick={handleShare}
              aria-label="Share"
              type="button"
            >
              <span className="material-symbols-sharp">ios_share</span>
            </button>*/}

            {topVoucherTitle && (
              <button 
                className={`sh-cta-btn ${isCopied ? 'copied' : ''}`}
                onClick={handleCopyAndTrack}
                type="button"
              >
                <div className="sh-cta-content">
                  {/*<span className="material-symbols-sharp">
                    {isCopied ? 'check' : 'content_copy'}
                  </span>*/}
                  <div className="sh-cta-text-group">
                    <span className="sh-cta-label">
                      {isArabic ? 'الذهاب للمتجر' : 'Go to Store'}
                    </span>
                  </div>
                </div>
                {!isCopied && <div className="sh-cta-ripple"></div>}
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default StoreHeader;
