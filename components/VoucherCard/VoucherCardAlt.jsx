// components/VoucherCard/VoucherCard.jsx - HORIZONTAL LAYOUT
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import "./VoucherCardAlt.css";

const VoucherCardAlt = ({ voucher, featured = false }) => {
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  
  // Use "ar" or "en" content
  const title = locale === 'ar' ? voucher.title_ar : voucher.title_en;
  const description = locale === 'ar' ? voucher.description_ar : voucher.description_en;
  const storeName = locale === 'ar' ? voucher.store?.name_ar : voucher.store?.name_en;
  
  // Date Logic
  const isExpired = voucher.expiryDate && new Date(voucher.expiryDate) < new Date();
  const isExpiringSoon = voucher.expiryDate && 
    new Date(voucher.expiryDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  
  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!voucher.expiryDate) return null;
    const expiry = new Date(voucher.expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysRemaining = getDaysRemaining();

  const handleCodeCopy = async () => {
    if (!voucher.code) return;
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      
      // Track click
      await fetch('/api/vouchers/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherId: voucher.id })
      });
      
      // Open link after delay
      setTimeout(() => {
        window.open(voucher.landingUrl || voucher.store?.websiteUrl, '_blank');
      }, 600);
      
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDealActivate = async () => {
    await fetch('/api/vouchers/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucherId: voucher.id })
    });
    window.open(voucher.landingUrl || voucher.store?.websiteUrl, '_blank');
  };

  const formatExpiryDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return locale === 'ar' 
      ? d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get discount display text
  const getDiscountText = () => {
    if (!voucher.discount) return locale === 'ar' ? 'عرض خاص' : 'Special';
    
    if (voucher.discountType === 'percentage') {
      return `${voucher.discount}%`;
    } else if (voucher.discountType === 'fixed') {
      return `$${voucher.discount}`;
    } else if (voucher.discountType === 'delivery') {
      return locale === 'ar' ? 'توصيل مجاني' : 'Free Delivery';
    } else if (voucher.discountType === 'bogo') {
      return locale === 'ar' ? 'واحد مجاناً' : 'BOGO';
    }
    return `${voucher.discount}%`;
  };

  // Get discount type text
  const getDiscountType = () => {
    if (!voucher.discount) return locale === 'ar' ? 'عرض' : 'Deal';
    
    if (voucher.discountType === 'percentage') {
      return locale === 'ar' ? 'خصم' : 'OFF';
    } else if (voucher.discountType === 'fixed') {
      return locale === 'ar' ? 'تخفيض' : 'OFF';
    } else if (voucher.discountType === 'delivery') {
      return locale === 'ar' ? 'توصيل' : 'Delivery';
    } else if (voucher.discountType === 'bogo') {
      return locale === 'ar' ? 'واحد مجاني' : 'FREE';
    }
    return locale === 'ar' ? 'خصم' : 'OFF';
  };

  return (
    <div className={`ticket-card ${isExpired ? 'expired' : ''} ${featured ? 'featured' : ''}`}>
      
      {/* --- LEFT SECTION: DISCOUNT & STORE --- */}
      <div className="ticket-left">
        {/* Store Link */}
        {voucher.store && (
          <Link 
            href={`/${locale}/stores/${voucher.store.slug}`} 
            className="ticket-store-link"
          >
            <Image
              src={voucher.store.logo || '/placeholder_store.png'}
              alt={storeName || 'Store'}
              width={32}
              height={32}
              className="ticket-logo"
            />
            <span className="store-name">{storeName}</span>
          </Link>
        )}
        
        {/* Discount Value */}
        <div className="discount-container">
          <h2 className={`discount-amount ${!voucher.discount ? 'generic' : ''}`}>
            {getDiscountText()}
          </h2>
          <span className="discount-type">
            {getDiscountType()}
          </span>
        </div>
        
        {/* Decorative Background Element */}
        <div className="discount-bg"></div>
        
        {/* Featured Badge */}
        {featured && (
          <div className="ticket-badge featured">
            <span className="material-symbols-sharp">star</span>
            {locale === 'ar' ? 'مميز' : 'FEATURED'}
          </div>
        )}
        
        {/* Verified Badge */}
        {voucher.isVerified && !featured && (
          <div className="ticket-badge verified" title={locale === 'ar' ? 'موثق' : 'Verified'}>
            <span className="material-symbols-sharp">verified</span>
          </div>
        )}
      </div>

      {/* --- VERTICAL DIVIDER: PERFORATION --- */}
      <div className="ticket-divider-vertical">
        <div className="notch-vertical notch-top"></div>
        <div className="dashed-line-vertical"></div>
        <div className="notch-vertical notch-bottom"></div>
      </div>

      {/* --- RIGHT SECTION: CONTENT & ACTIONS --- */}
      <div className="ticket-right">
        {/* Title & Description */}
        <div className="ticket-content">
          <h3 className="ticket-title">{title}</h3>
          {description && <p className="ticket-desc">{description}</p>}
        </div>

        {/* Action Area */}
        <div className="ticket-actions">
          {voucher.type === 'CODE' ? (
            <div className="code-reveal-wrapper">
              <button 
                className={`ticket-btn ${copied ? 'success' : ''}`}
                onClick={handleCodeCopy}
                disabled={isExpired}
              >
                {copied ? (
                  <>
                    <span className="material-symbols-sharp">check_circle</span>
                    {locale === 'ar' ? 'تم النسخ' : 'Copied'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-sharp">content_copy</span>
                    {locale === 'ar' ? 'نسخ الكود' : 'Copy Code'}
                  </>
                )}
              </button>
              
              {/* Code Preview */}
              <div className="code-preview">
                {voucher.code ? `••••${voucher.code.slice(-3)}` : 'CODE'}
              </div>
            </div>
          ) : (
            <button 
              className="ticket-btn deal-btn"
              onClick={handleDealActivate}
              disabled={isExpired}
            >
              <span className="material-symbols-sharp">arrow_outward</span>
              {locale === 'ar' ? 'تفعيل العرض' : 'Get Deal'}
            </button>
          )}
        </div>

        {/* Footer Meta */}
        <div className="ticket-footer">
          {isExpiringSoon && !isExpired && (
            <span className="meta-tag urgent">
              <span className="material-symbols-sharp">timer</span>
              {locale === 'ar' ? 'قريباً' : 'Ending Soon'}
            </span>
          )}
          
          {isExpired && (
            <span className="meta-tag expired">
              <span className="material-symbols-sharp">timer_off</span>
              {locale === 'ar' ? 'منتهي' : 'Expired'}
            </span>
          )}
          
          {voucher.expiryDate && !isExpired && (
            <span className="meta-tag date">
              <span className="material-symbols-sharp">calendar_month</span>
              {`${locale === 'ar' ? 'حتى' : 'Until'} ${formatExpiryDate(voucher.expiryDate)}`}
            </span>
          )}
          
          {voucher.minPurchase > 0 && (
            <span className="meta-tag">
              <span className="material-symbols-sharp">shopping_bag</span>
              {`${locale === 'ar' ? 'الحد الأدنى' : 'Min'} $${voucher.minPurchase}`}
            </span>
          )}
        </div>
        
        {/* Days Remaining Counter */}
        {daysRemaining > 0 && daysRemaining <= 7 && (
          <div className="days-counter">
            <span className="material-symbols-sharp">schedule</span>
            {locale === 'ar' ? `${daysRemaining} أيام` : `${daysRemaining} days`}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherCardAlt;