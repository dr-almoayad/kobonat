'use client';

import { useState, useRef, useLayoutEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './StoreHeader.css';

const StoreHeader = ({ 
  store, 
  mostTrackedVoucher, 
  paymentMethods = [],
  bnplMethods = [],
  locale,
  country,
  sentinelRef  // forwarded ref so parent can observe when this header leaves the viewport
}) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(false);

  const descriptionRef = useRef(null);
  
  const isArabic = locale?.startsWith('ar');
  const dir = isArabic ? 'rtl' : 'ltr';

  const storeName = store?.name || 'Store';
  const storeLogo = store?.logo;
  const storeCover = store?.coverImage;
  const storeDescription = store?.description;
  const categories = store?.categories || [];
  const websiteUrl = store?.websiteUrl;

  // Overflow detection for "Read more"
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
      
      {/* Banner */}
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

      {/* Content */}
      <div className="sh-content-wrapper">
        <div className="sh-main-grid">
          
          {/* Identity column: logo + name + meta */}
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

          {/* Details column: description, categories, payments */}
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
                    {cat.icon && <span className="material-symbols-sharp">{cat.icon}</span>}
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

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
