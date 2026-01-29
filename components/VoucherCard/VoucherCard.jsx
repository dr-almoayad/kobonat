// components/VoucherCard/VoucherCard.jsx - FIXED FOR MULTI-LANGUAGE
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import "./VoucherCard.css";

const VoucherCard = ({ voucher, featured = false }) => {
  const locale = useLocale();
  const t = useTranslations('VoucherCard');
  const [copied, setCopied] = useState(false);
  
  // Get current language from locale
  const currentLanguage = locale.split('-')[0];
  
  // Safely extract title with multiple fallbacks
  const getVoucherTitle = () => {
    if (voucher.title) return voucher.title;
    if (voucher.translations?.[0]?.title) return voucher.translations[0].title;
    if (voucher.type === 'CODE') return t('labels.code');
    if (voucher.type === 'DEAL') return t('labels.deal');
    if (voucher.type === 'FREE_SHIPPING') return t('labels.freeDelivery');
    return t('labels.specialDeal');
  };
  
  // Safely extract description
  const getVoucherDescription = () => {
    if (voucher.description) return voucher.description;
    if (voucher.translations?.[0]?.description) return voucher.translations[0].description;
    return null;
  };
  
  // Safely extract store name
  const getStoreName = () => {
    if (voucher.store?.name) return voucher.store.name;
    if (voucher.store?.translations?.[0]?.name) return voucher.store.translations[0].name;
    return currentLanguage === 'ar' ? 'متجر' : 'Store';
  };
  
  // Safely extract store slug
  const getStoreSlug = () => {
    if (voucher.store?.slug) return voucher.store.slug;
    if (voucher.store?.translations?.[0]?.slug) return voucher.store.translations[0].slug;
    return 'store';
  };
  
  const title = getVoucherTitle();
  const description = getVoucherDescription();
  const storeName = getStoreName();
  const storeSlug = getStoreSlug();
  
  // Date handling
  const isExpired = voucher.expiryDate && new Date(voucher.expiryDate) < new Date();
  const isExpiringSoon = voucher.expiryDate && 
    !isExpired &&
    new Date(voucher.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  const getDaysRemaining = () => {
    if (!voucher.expiryDate) return null;
    const expiry = new Date(voucher.expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const daysRemaining = getDaysRemaining();

  // Handle tracking with country code from locale
  const handleCodeCopy = async () => {
    if (!voucher.code) return;
    
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      
      const [, countryCode] = locale.split('-');
      
      await fetch('/api/vouchers/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          voucherId: voucher.id,
          countryCode 
        })
      });
      
      setTimeout(() => {
        window.open(voucher.landingUrl || voucher.store?.websiteUrl, '_blank');
      }, 600);
      
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDealActivate = async () => {
    const [, countryCode] = locale.split('-');
    
    await fetch('/api/vouchers/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        voucherId: voucher.id,
        countryCode 
      })
    });
    
    window.open(voucher.landingUrl || voucher.store?.websiteUrl, '_blank');
  };

  // Date formatting with locale
  const formatExpiryDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    
    return d.toLocaleDateString(
      currentLanguage === 'ar' ? 'ar-EG' : 'en-US', 
      { month: 'short', day: 'numeric' }
    );
  };

  // Handle discount display
  const getDiscountText = () => {
    if (!voucher.discount) {
      return voucher.type === 'FREE_SHIPPING' 
        ? t('labels.freeDelivery') 
        : t('labels.specialDeal');
    }
    
    const discountStr = String(voucher.discount);
    
    if (discountStr.includes('%')) {
      return discountStr;
    } else if (discountStr.match(/^\d+$/)) {
      return `${voucher.discount}%`;
    }
    
    return discountStr;
  };

  // Get store logo URL
  const getStoreLogo = () => {
    return voucher.store?.logo || '/placeholder_store.png';
  };

  return (
    <div className={`ticket-card ${isExpired ? 'expired' : ''} ${featured ? 'featured' : ''}`}>
      
      {/* LEFT SECTION */}
      <div className="ticket-left">
        {/* Store Link */}
        {voucher.store && (
          <Link 
            href={`/${locale}/stores/${storeSlug}`} 
            className="ticket-store-link"
          >
            <Image
              src={getStoreLogo()}
              alt={storeName}
              width={200}
              height={200}
              className="ticket-logo"
            />
          </Link>
        )}
        
        {/* Discount Value */}
        <div className="discount-container">
          <h2 className={`discount-amount ${!voucher.discount ? 'generic' : ''}`}>
            {getDiscountText()}
          </h2>
        </div>
        
        {/* <div className="discount-bg"></div>*/}
        
        {/* Badges */}
        {featured && (
          <div className="ticket-badge featured">
            <span className="material-symbols-sharp">star</span>
            {t('badges.featuredFull')}
          </div>
        )}
      </div>

      {/* DIVIDER 
      <div className="ticket-divider-vertical">
        <div className="notch-vertical notch-top"></div>
        <div className="dashed-line-vertical"></div>
        <div className="notch-vertical notch-bottom"></div>
      </div>*/}

      {/* RIGHT SECTION */}
      <div className="ticket-right">
        <div className="ticket-content">
          <h3 className="ticket-title">{title}</h3>
          {description && <p className="ticket-desc">{description}</p>}
        </div>

        {/* Actions */}
        <div className="ticket-actions">
          {voucher.type === 'CODE' ? (
            <div className="code-display-container">
              <div className="full-code-display">
                {voucher.code || t('labels.code')}
              </div>
              <button 
                className={`copy-btn-small ${copied ? 'success' : ''}`}
                onClick={handleCodeCopy}
                disabled={isExpired}
              >
                {copied ? (
                  <>
                    <span className="material-symbols-sharp">check_circle</span>
                    {t('buttons.copied')}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-sharp">content_copy</span>
                    {t('buttons.copyShort')}
                  </>
                )}
              </button>
            </div>
          ) : (
            <button 
              className="deal-btn"
              onClick={handleDealActivate}
              disabled={isExpired}
            >
              <span className="material-symbols-sharp">arrow_outward</span>
              {t('buttons.getDeal')}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="ticket-footer">
          {isExpiringSoon && !isExpired && (
            <span className="meta-tag urgent">
              <span className="material-symbols-sharp">timer</span>
              {t('meta.endingSoon')}
            </span>
          )}
          
          {isExpired && (
            <span className="meta-tag expired">
              <span className="material-symbols-sharp">timer_off</span>
              {t('meta.expired')}
            </span>
          )}
          
          {voucher.expiryDate && !isExpired && (
            <span className="meta-tag date">
              <span className="material-symbols-sharp">calendar_month</span>
              {`${t('meta.until')} ${formatExpiryDate(voucher.expiryDate)}`}
            </span>
          )}

          {/* Days Counter 
          {daysRemaining > 0 && daysRemaining <= 7 && (
            <div className="meta-tag days-counter">
              <span className="material-symbols-sharp">schedule</span>
              {daysRemaining} {t('meta.days')}
            </div>
          )}*/}
        </div>
        
        
      </div>
    </div>
  );
};

export default VoucherCard;
