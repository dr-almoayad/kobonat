// components/VoucherCard/VoucherCard.jsx - REDESIGNED
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
  const [showDetails, setShowDetails] = useState(false);
  
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

  // Count times used (clicks)
  const timesUsed = voucher._count?.clicks || 0;
  
  // Get last used time (from most recent click)
  const getLastUsedTime = () => {
    // If voucher has clicks array with clickedAt timestamps
    if (voucher.clicks && voucher.clicks.length > 0) {
      const lastClick = new Date(voucher.clicks[0].clickedAt);
      const now = new Date();
      const diffHours = Math.floor((now - lastClick) / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        return t('meta.justNow');
      } else if (diffHours < 24) {
        return t('meta.hoursAgo', { hours: diffHours });
      } else {
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) {
          return t('meta.yesterday');
        } else if (diffDays < 7) {
          return t('meta.daysAgo', { days: diffDays });
        } else {
          return t('meta.weeksAgo', { weeks: Math.floor(diffDays / 7) });
        }
      }
    }
    return null;
  };
  
  const lastUsed = getLastUsedTime();
  
  // Check if voucher is currently active (not expired and within valid date range)
  const isActive = !isExpired && 
    (!voucher.startDate || new Date(voucher.startDate) <= new Date());

  return (
    <div className={`voucher-card-new ${isExpired ? 'expired' : ''} ${featured ? 'featured' : ''}`}>
      
      {/* LEFT SECTION - Discount Badge */}
      <div className="voucher-left-new">
        <div className="discount-badge-new">
          <div className="discount-value-new">{getDiscountText()}</div>
          <div className="discount-label-new">{t('labels.off')}</div>
        </div>
        
        {voucher.type === 'CODE' && (
          <div className="voucher-type-label">{t('labels.code')}</div>
        )}
      </div>

      {/* RIGHT SECTION - Content & Actions */}
      <div className="voucher-right-new">
        
        {/* Header with Store Logo */}
        <div className="voucher-header-new">
          {voucher.store && (
            <Link 
              href={`/${locale}/stores/${storeSlug}`} 
              className="store-link-new"
            >
              <Image
                src={getStoreLogo()}
                alt={storeName}
                width={40}
                height={40}
                className="store-logo-new"
              />
            </Link>
          )}
          
          <div className="voucher-title-section">
            <h3 className="voucher-title-new">{title}</h3>
            <div className="times-used">
              {timesUsed} {t('meta.timesUsed')}
            </div>
          </div>
        </div>

        {/* Description (Collapsible) */}
        {description && (
          <div className={`voucher-description-new ${showDetails ? 'expanded' : ''}`}>
            <p>{description}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="voucher-actions-new">
          <div className="action-button-wrapper">
            {voucher.type === 'CODE' ? (
              <button 
                className={`show-code-btn ${copied ? 'copied' : ''}`}
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
                    {t('buttons.copyShort')}
                    <span className="code-preview">{voucher.code || 'CODE'}</span>
                  </>
                )}
              </button>
            ) : (
              <button 
                className="get-deal-btn"
                onClick={handleDealActivate}
                disabled={isExpired}
              >
                {t('buttons.getDeal')}
                <span className="material-symbols-sharp">arrow_forward</span>
              </button>
            )}

            {description && (
              <button 
                className="details-link"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? t('buttons.hideDetails') : t('buttons.seeDetails')}
                <span className="material-symbols-sharp caret">
                  {showDetails ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Meta */}
        <div className="voucher-footer-new">
          {isActive && !isExpired && (
            <span className="meta-badge active">
              <span className="material-symbols-sharp">check_circle</span>
              {t('badges.active')}
            </span>
          )}
          
          {lastUsed && (
            <span className="meta-badge last-used">
              <span className="material-symbols-sharp">schedule</span>
              {t('meta.lastUsed')}: {lastUsed}
            </span>
          )}
          
          {isExpiringSoon && !isExpired && (
            <span className="meta-badge urgent">
              <span className="material-symbols-sharp">timer</span>
              {t('meta.endingSoon')}
            </span>
          )}
          
          {isExpired && (
            <span className="meta-badge expired">
              <span className="material-symbols-sharp">block</span>
              {t('meta.expired')}
            </span>
          )}
          
          {voucher.isVerified && (
            <span className="meta-badge verified">
              <span className="material-symbols-sharp">verified</span>
              {t('badges.verified')}
            </span>
          )}

          {voucher.isExclusive && (
            <span className="meta-badge exclusive">
              <span className="material-symbols-sharp">star</span>
              {t('badges.exclusive')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherCard;
