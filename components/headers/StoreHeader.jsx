'use client';

import { useState, useRef, useLayoutEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './StoreHeader.css';

/**
 * FIXED StoreHeader Component
 * * ✅ FIX 1: Receives pre-computed `pageH1` and `heroSubtitle` as props from the Server Component.
 * ✅ FIX 2: Uses <h1> for the primary heading to match the <title> tag exactly.
 * ✅ FIX 3: Removed redundant client-side generation of SEO titles to improve performance.
 */
const StoreHeader = ({ 
  store, 
  mostTrackedVoucher, 
  paymentMethods = [],
  bnplMethods = [],
  locale,
  country,
  sentinelRef,
  voucherCount = 0,
  maxSavings = 0,
  // These props are now passed from page.jsx to ensure server-client consistency
  pageH1,
  heroSubtitle
}) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(false);

  const descriptionRef = useRef(null);
  
  const isArabic = locale?.startsWith('ar');
  const dir = isArabic ? 'rtl' : 'ltr';

  const storeName = store?.name || 'Store';
  const storeLogo = store?.bigLogo || store?.logo;
  const storeCover = store?.coverImage;
  const storeDescription = store?.description;
  const categories = store?.categories || [];

  // Semantic timestamp for freshness (E-E-A-T)
  const getLastUpdatedTime = () => {
    if (!store?.updatedAt) return null;
    const updated = new Date(store.updatedAt);
    const now = new Date();
    const diffHours = Math.floor((now - updated) / (1000 * 60 * 60));

    if (diffHours < 1) return isArabic ? 'محدث للتو' : 'Updated just now';
    if (diffHours < 24) return isArabic ? `محدث قبل ${diffHours} ساعة` : `Updated ${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return isArabic ? 'محدث أمس' : 'Updated yesterday';
    if (diffDays < 7) return isArabic ? `محدث قبل ${diffDays} أيام` : `Updated ${diffDays}d ago`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    return isArabic
      ? `محدث قبل ${diffWeeks} ${diffWeeks === 1 ? 'أسبوع' : 'أسابيع'}`
      : `Updated ${diffWeeks}w ago`;
  };
  
  const lastUpdated = getLastUpdatedTime();

  // Check for description text overflow to show "Read More"
  useLayoutEffect(() => {
    const checkOverflow = () => {
      const element = descriptionRef.current;
      if (element && storeDescription) {
        setIsDescriptionOverflowing(element.scrollHeight > element.clientHeight + 2);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [storeDescription]);

  if (!store) return null;

  return (
    <header className="sh-container" dir={dir} ref={sentinelRef}>
      
      {/* Visual Banner Background */}
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

      {/* Main Content Area */}
      <div className="sh-content-wrapper">
        <div className="sh-main-grid">
          
          {/* Brand Identity Section */}
          <div className="sh-identity-col">
            <div className="sh-logo-wrapper">
              {storeLogo ? (
                <Image 
                  src={storeLogo} 
                  alt={`${storeName} logo`} 
                  width={110} 
                  height={110} 
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
              {/* ✅ THE PRIMARY H1: Matches metadata <title> for maximum SEO relevance */}
              <h1 className="sh-store-name">{pageH1}</h1>
              
              {/* Dynamic hero metadata string (e.g. "12 active codes • Save up to 15%") */}
              {heroSubtitle && (
                <div className="sh-hero-subtitle">{heroSubtitle}</div>
              )}
              
              <div className="sh-meta-row">
                {country?.name && (
                  <span className="sh-meta-item">
                    <span className="material-symbols-sharp">public</span>
                    {country.name}
                  </span>
                )}
                {lastUpdated && (
                  <span className="sh-meta-item">
                    <span className="material-symbols-sharp">update</span>
                    {lastUpdated}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Brand Details and Payment Options */}
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
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="sh-read-more-btn"
                    type="button"
                  >
                    {isDescriptionExpanded 
                      ? (isArabic ? 'عرض أقل' : 'Read less')
                      : (isArabic ? 'عرض المزيد' : 'Read more')}
                  </button>
                )}
              </div>
            )}

            {/* Category Breadcrumbs/Pills */}
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

            {/* Payment Method Icons (BNPL & Standard) */}
            {(paymentMethods.length > 0 || bnplMethods.length > 0) && (
              <div className="sh-payments-row">
                {bnplMethods.map(pm => (
                  <div key={pm.id} className="sh-pay-icon bnpl" title={pm.name}>
                    {pm.logo ? (
                      <Image src={pm.logo} alt={pm.name} width={72} height={36} quality={90} />
                    ) : (
                      <span>{pm.name}</span>
                    )}
                  </div>
                ))}
                {paymentMethods.slice(0, 5).map(pm => (
                  <div key={pm.id} className="sh-pay-icon" title={pm.name}>
                    {pm.logo ? (
                      <Image src={pm.logo} alt={pm.name} width={56} height={36} quality={90} />
                    ) : (
                      <span className="material-symbols-sharp">credit_card</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default StoreHeader;
