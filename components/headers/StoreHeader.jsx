'use client';
import { useState, useEffect, useRef } from 'react';
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

  // Optimized Scroll Handler using requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          // Threshold: 120px is a good balance for the 200px banner
          const shouldBeScrolled = currentScrollY > 120;
          
          setIsScrolled((prev) => {
             // Only update state if it actually changes to prevent re-renders
             if (prev !== shouldBeScrolled) return shouldBeScrolled;
             return prev;
          });
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check overflow logic for Read More
  useEffect(() => {
    if (descriptionRef.current && storeDescription) {
      const element = descriptionRef.current;
      // Check if scrollHeight is significantly larger than clientHeight (2 lines approx 3em)
      setIsDescriptionOverflowing(element.scrollHeight > element.clientHeight + 2);
    }
  }, [storeDescription]);

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
      console.error('Copy failed', err);
      if (websiteUrl) window.open(websiteUrl, '_blank');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${storeName}`,
      text: `Check out these offers for ${storeName}!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) { }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(isArabic ? 'تم نسخ الرابط' : 'Link copied');
    }
  };

  if (!store && !isLoading) return null;

  if (isLoading) {
    return (
      <div className="sh-skeleton-container">
        <div className="sh-skeleton-banner"></div>
        <div className="sh-skeleton-content">
          <div className="sh-skeleton-logo"></div>
          <div className="sh-skeleton-lines"></div>
        </div>
      </div>
    );
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
                  priority
                />
              ) : (
                <div className="sh-logo-fallback">{storeName.charAt(0)}</div>
              )}
            </div>
            
            <div className="sh-identity-text">
              <h1 className="sh-store-name">
                {storeName}
              </h1>
              
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

          {/* 2. Middle: Description & Categories */}
          <div className="sh-details-container">
            <div className={`sh-details-inner ${isScrolled ? 'fade-out' : ''}`}>
              
              {/* Description */}
              {storeDescription && (
                <div className="sh-description-wrapper">
                  <p 
                    ref={descriptionRef}
                    className={`sh-description ${isDescriptionExpanded ? 'expanded' : ''}`}
                  >
                    {storeDescription}
                  </p>
                  {isDescriptionOverflowing && (
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
          </div>

          {/* 3. Right: Action Buttons */}
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
                    <span className={`sh-cta-sub ${isScrolled ? 'fade-out' : ''}`}>
                      {isArabic ? 'أفضل عرض' : 'Best Offer'}
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
