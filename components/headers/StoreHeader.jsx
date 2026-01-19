// components/headers/StoreHeader.jsx - ENHANCED WITH CATEGORIES & PAYMENT
'use client';
import { useState, useEffect } from 'react';
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
  
  const isArabic = locale?.startsWith('ar');
  const storeName = store?.name || 'Store';
  const storeLogo = store?.logo;
  const storeDescription = store?.description;
  const categories = store?.categories || [];
  
  const topVoucherTitle = mostTrackedVoucher 
    ? (isArabic ? mostTrackedVoucher.title : mostTrackedVoucher.title)
    : null;

  // Scroll detection
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 80);
          ticking = false;
        });
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
              <h1 className="store-name">{storeName}</h1>
            )}
          </div>
          {!scrolled && storeDescription && (
            <p className="store-description">
              {storeDescription}
            </p>
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
              {/*<h3 className="payment-title">
                <span className="material-symbols-sharp">payment</span>
                {isArabic ? 'طرق الدفع' : 'Payment Methods'}
              </h3>*/}
              
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

          {/* Scrolled State Indicators */}
          {scrolled && (
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
            </div>
          )}
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
    </header>
  );
};

export default StoreHeader;