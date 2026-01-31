'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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

  // Simulate loading state to prevent hydration mismatch and add polish
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Intelligent Scroll Handler using IntersectionObserver pattern fallback
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Threshold: 100px is usually where the banner ends visually
          setIsScrolled(currentScrollY > 100);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Description height calculation
  useEffect(() => {
    if (descriptionRef.current && storeDescription) {
      const element = descriptionRef.current;
      setIsDescriptionOverflowing(element.scrollHeight > element.clientHeight);
    }
  }, [storeDescription]);

  const handleCopyAndTrack = async () => {
    if (!voucherCode) {
      if (websiteUrl) window.open(websiteUrl, '_blank');
      return;
    }

    try {
      // 1. Copy to Clipboard
      await navigator.clipboard.writeText(voucherCode);
      setIsCopied(true);
      
      // 2. Haptic Feedback (Mobile)
      if (navigator.vibrate) navigator.vibrate(50);

      // 3. API Tracking
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

      // 4. Redirect
      setTimeout(() => {
        if (websiteUrl) window.open(websiteUrl, '_blank');
      }, 800);

      // 5. Reset State
      setTimeout(() => setIsCopied(false), 3000);

    } catch (err) {
      console.error('Copy failed', err);
      if (websiteUrl) window.open(websiteUrl, '_blank');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${storeName} Coupons`,
      text: `Check out these offers for ${storeName}!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: Copy URL
      navigator.clipboard.writeText(window.location.href);
      alert(isArabic ? 'تم نسخ الرابط' : 'Link copied to clipboard');
    }
  };

  if (!store && !isLoading) return null;

  // --- SKELETON LOADING STATE ---
  if (isLoading) {
    return (
      <div className="sh-skeleton-container">
        <div className="sh-skeleton-banner"></div>
        <div className="sh-skeleton-content">
          <div className="sh-skeleton-logo"></div>
          <div className="sh-skeleton-lines">
            <div className="sh-line long"></div>
            <div className="sh-line short"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <header 
      className={`sh-container ${isScrolled ? 'sh-scrolled' : ''}`} 
      dir={dir}
    >
      {/* --- BACKGROUND BANNER (Parallax) --- */}
      <div className="sh-banner-wrapper">
        {storeCover ? (
          <Image
            src={storeCover}
            alt="Cover"
            fill
            className="sh-banner-img"
            priority
            quality={60}
          />
        ) : (
          <div className="sh-banner-placeholder" style={{ backgroundColor: '#1e293b' }} />
        )}
        <div className="sh-banner-overlay" />
      </div>

      {/* --- MAIN CONTENT CARD --- */}
      <div className="sh-content-wrapper">
        <div className="sh-main-grid">
          
          {/* 1. Left: Logo & Identity */}
          <div className="sh-identity-col">
            <div className="sh-logo-wrapper">
              {storeLogo ? (
                <Image 
                  src={storeLogo} 
                  alt={storeName} 
                  width={100} 
                  height={100} 
                  className="sh-logo-img"
                />
              ) : (
                <div className="sh-logo-fallback">{storeName.charAt(0)}</div>
              )}
              {/* Verified Badge Icon could go here */}
            </div>
            
            <div className="sh-identity-text">
              <h1 className="sh-store-name">
                {storeName}
                {/* Optional: Add Verified Icon */}
                <span className="material-symbols-sharp sh-verified-icon" title="Verified Store">verified</span>
              </h1>
              
              {/* Mobile Only Meta Stats */}
              <div className="sh-meta-row">
                <span className="sh-meta-item">
                  <span className="material-symbols-sharp">local_offer</span>
                  {Math.floor(Math.random() * 10) + 5} {isArabic ? 'عروض' : 'Offers'}
                </span>
                {country?.name && (
                  <span className="sh-meta-item">
                    <span className="material-symbols-sharp">public</span>
                    {country.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Middle: Description & Categories (Hidden on Scroll) */}
          <div className={`sh-details-col ${isScrolled ? 'sh-hide-details' : ''}`}>
            
            {/* Description */}
            {storeDescription && (
              <div className="sh-description-wrapper">
                <p 
                  ref={descriptionRef}
                  className={`sh-description ${isDescriptionExpanded ? 'expanded' : ''}`}
                >
                  {storeDescription}
                </p>
                {isDescriptionOverflowing && !isDescriptionExpanded && (
                  <button 
                    onClick={() => setIsDescriptionExpanded(true)}
                    className="sh-read-more-btn"
                  >
                    {isArabic ? 'عرض المزيد' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* Category Pills */}
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

            {/* Payment Methods (Desktop Row) */}
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

          {/* 3. Right: Action Buttons (Persistent) */}
          <div className="sh-actions-col">
            <button 
              className="sh-share-btn"
              onClick={handleShare}
              aria-label="Share Store"
              type="button"
            >
              <span className="material-symbols-sharp">ios_share</span>
            </button>

            {topVoucherTitle && (
              <button 
                className={`sh-cta-btn ${isCopied ? 'copied' : ''}`}
                onClick={handleCopyAndTrack}
                type="button"
              >
                <div className="sh-cta-content">
                  <span className="material-symbols-sharp">
                    {isCopied ? 'check' : 'content_cut'}
                  </span>
                  <div className="sh-cta-text-group">
                    <span className="sh-cta-label">
                      {isCopied 
                        ? (isArabic ? 'تم النسخ' : 'Copied!') 
                        : (isArabic ? 'نسخ الكود' : 'Get Code')
                      }
                    </span>
                    {!isScrolled && !isCopied && (
                      <span className="sh-cta-sub">
                        {isArabic ? 'أفضل عرض' : 'Best Offer'}
                      </span>
                    )}
                  </div>
                </div>
                {/* Visual ripple background effect */}
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
