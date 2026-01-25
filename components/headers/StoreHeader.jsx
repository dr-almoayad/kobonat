// components/headers/StoreHeader.jsx - ENHANCED WITH CATEGORIES & PAYMENT
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
  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);
  const descriptionRef = useRef(null);
  
  const isArabic = locale?.startsWith('ar');
  const storeName = store?.name || 'Store';
  const storeLogo = store?.logo;
  const storeCover = store?.coverImage;
  const storeDescription = store?.description;
  const categories = store?.categories || [];
  
  const topVoucherTitle = mostTrackedVoucher 
    ? (isArabic ? mostTrackedVoucher.title : mostTrackedVoucher.title)
    : null;

  // Check if description needs "Read More" button
  useEffect(() => {
    if (descriptionRef.current && storeDescription) {
      const lineHeight = parseFloat(getComputedStyle(descriptionRef.current).lineHeight);
      const maxHeight = lineHeight * 2; // 2 lines max
      const actualHeight = descriptionRef.current.scrollHeight;
      
      setShouldShowReadMore(actualHeight > maxHeight);
    }
  }, [storeDescription]);

  // Smooth scroll detection with debounce
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    const updateScrolled = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 350) {
        setScrolled(true);
      } else if (currentScrollY < 150) {
        setScrolled(false);
      }
      
      lastScrollY = currentScrollY;
      ticking = false;
    };
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrolled);
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTopVoucherClick = async () => {
    if (!mostTrackedVoucher?.code) {
      if (store?.websiteUrl) {
        window.open(store.websiteUrl, '_blank');
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(mostTrackedVoucher.code);
      setCopied(true);
      
      await fetch('/api/vouchers/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          voucherId: mostTrackedVoucher.id,
          countryCode: country?.code
        })
      });
      
      setTimeout(() => {
        if (store?.websiteUrl) {
          window.open(store.websiteUrl, '_blank');
        }
      }, 600);
      
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy:', err);
      if (store?.websiteUrl) {
        window.open(store.websiteUrl, '_blank');
      }
    }
  };

  if (!store) return null;

  return (
    <header className={`store-header-enhanced ${scrolled ? 'scrolled' : ''}`}>
      {/* Store Banner 
      {storeCover && (
        <div 
          className="store-header-banner"
          style={{ '--store-cover': `url(${storeCover})` }}
        />
      )}*/}
      
      <div className="store-header-content">
        <div className="store-header-inner">
          {/* Store Info */}
          <div className="store-info-section">
            {/* Logo */}
            <div className="store-logo-section">
              {storeLogo ? (
                <>
                  <Image 
                    src={storeLogo} 
                    alt={storeName}
                    width={scrolled ? 80 : 120}
                    height={scrolled ? 40 : 80}
                    className="store-logo-img"
                    priority
                  />
                  <h1 className="store-name">{storeName}</h1>
                </>
              ) : (
                <div className="store-logo-placeholder">
                  {storeName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Description with Read More */}
            {!scrolled && storeDescription && (
              <div className="store-description-container">
                <p 
                  ref={descriptionRef}
                  className={`store-description ${descriptionExpanded ? 'expanded' : ''}`}
                >
                  {storeDescription}
                </p>
                {shouldShowReadMore && !descriptionExpanded && (
                  <button 
                    className="read-more-btn"
                    onClick={() => setDescriptionExpanded(true)}
                    type="button"
                  >
                    {isArabic ? 'قراءة المزيد' : 'Read More'}
                  </button>
                )}
              </div>
            )}

            {/* Categories - Links to category pages */}
            {!scrolled && categories.length > 0 && (
              <div className="store-categories">
                {categories.slice(0, 4).map((category) => (
                  <Link
                    key={category.id}
                    href={`/${locale}/stores/${category.slug}`}
                    className="category-pill"
                    style={{ 
                      '--category-color': category.color || '#470ae2'
                    }}
                  >
                    <span className="material-symbols-sharp">{category.icon || 'category'}</span>
                    {category.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Payment Methods - Country Sensitive */}
            {!scrolled && (paymentMethods.length > 0 || bnplMethods.length > 0) && (
              <div className="payment-section">
                <div className="payment-methods-grid">
                  {/* Other Payment Methods */}
                  {paymentMethods.slice(0, 6).map((pm) => (
                    <div key={pm.id} className="payment-icon" title={pm.name}>
                      {pm.logo ? (
                        <Image 
                          src={pm.logo} 
                          alt={pm.name}
                          width={100}
                          height={100}
                        />
                      ) : (
                        <span className="material-symbols-sharp">
                          {pm.type === 'CARD' ? 'credit_card' : 
                            pm.type === 'WALLET' ? 'account_balance_wallet' : 
                            'payments'}
                        </span>
                      )}
                    </div>
                  ))}
                  {/* BNPL Section */}
                  {bnplMethods.map((pm) => (
                    <div key={pm.id} className="payment-icon" title={pm.name}>
                      {pm.logo ? (
                        <Image 
                          src={pm.logo} 
                          alt={pm.name}
                          width={100}
                          height={100}
                        />
                      ) : (
                        <span>{pm.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scrolled State Indicators 
            <div className="scrolled-indicators">
              {categories.length > 0 && (
                <span className="mini-indicator">
                  <span className="material-symbols-sharp">category</span>
                  {categories[0].name}
                  {categories.length > 1 && ` +${categories.length - 1}`}
                </span>
              )}
              {bnplMethods.length > 0 && (
                <span className="mini-indicator bnpl">
                  <span className="material-symbols-sharp">credit_score</span>
                  {isArabic ? 'تقسيط' : 'BNPL'}
                </span>
              )}
              {paymentMethods.length > 0 && (
                <span className="mini-indicator">
                  <span className="material-symbols-sharp">payment</span>
                  {paymentMethods.length}+
                </span>
              )}
            </div>*/}
          </div>

          {/* Action Button */}
          {store.websiteUrl && topVoucherTitle && (
            <button 
              className={`store-header-cta ${copied ? 'copied' : ''} ${scrolled ? 'compact' : ''}`}
              onClick={handleTopVoucherClick}
              type="button"
              aria-label={copied ? (isArabic ? 'تم النسخ' : 'Copied') : topVoucherTitle}
            >
              <span className="material-symbols-sharp">
                {copied ? 'check_circle' : 'arrow_outward'}
              </span>
              {!scrolled && (
                <span className='cta-title'>
                  {copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : 'احصل على أفضل عرض'}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default StoreHeader;
