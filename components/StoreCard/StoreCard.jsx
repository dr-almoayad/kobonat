// components/StoreCard/StoreCard.jsx - REDESIGNED TO MATCH UPLOADED IMAGE
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import "./StoreCard.css";

const StoreCard = ({ store }) => {
  const locale = useLocale();
  const currentLanguage = locale.split('-')[0];
  
  // Safely extract store name (for accessibility/alt text only)
  const getStoreName = () => {
    if (store.name) return store.name;
    if (store.translations?.[0]?.name) return store.translations[0].name;
    return currentLanguage === 'ar' ? 'متجر' : 'Store';
  };
  
  // Safely extract store slug
  const getStoreSlug = () => {
    if (store.slug) return store.slug;
    if (store.translations?.[0]?.slug) return store.translations[0].slug;
    return 'store';
  };
  
  // Get store bigLogo (primary) or fallback to regular logo
  const getStoreLogo = () => {
    return store.bigLogo || store.logo || null;
  };
  
  // Get maximum discount from store's vouchers
  const getMaximumDiscount = () => {
    if (!store.vouchers || store.vouchers.length === 0) {
      return currentLanguage === 'ar' ? 'عروض حصرية' : 'Exclusive Deals';
    }
    
    // Extract all discount percentages
    const discounts = store.vouchers
      .map(v => {
        if (!v.discount) return 0;
        const match = String(v.discount).match(/(\d+)%?/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(d => d > 0);
    
    if (discounts.length === 0) {
      return currentLanguage === 'ar' ? 'عروض حصرية' : 'Exclusive Deals';
    }
    
    const maxDiscount = Math.max(...discounts);
    return currentLanguage === 'ar' 
      ? `خصم حتى ${maxDiscount}%`
      : `Up to ${maxDiscount}%`;
  };
  
  const storeName = getStoreName();
  const storeSlug = getStoreSlug();
  const storeLogo = getStoreLogo();
  const maxDiscount = getMaximumDiscount();

  return (
    <Link 
      href={`/${locale}/stores/${storeSlug}`}
      className={`store-ticket-card ${store.isFeatured ? 'featured' : ''}`}
      aria-label={`${storeName} - ${maxDiscount}`}
    >
      {/* Circular Logo Container */}
      <div className="logo-circle">
        {storeLogo ? (
          <Image
            src={storeLogo}
            alt={storeName}
            width={120}
            height={120}
            className="store-card-logo"
            priority={false}
          />
        ) : (
          <div className="store-logo-placeholder">
            {storeName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Discount Badge */}
      <div className="discount-badge">
        <span className="discount-icon">🎁</span>
        <span className="discount-text">{maxDiscount}</span>
      </div>
    </Link>
  );
};

export default StoreCard;
