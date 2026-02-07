// components/StoreCard/StoreCard.jsx - UPDATED WITH showOffer & showOfferType
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import "./StoreCard.css";

const StoreCard = ({ store }) => {
  const locale = useLocale();
  const t = useTranslations('StoreCard');
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
  
  // Get the show offer text (admin-controlled)
  const getShowOffer = () => {
    if (store.showOffer) {
      return store.showOffer;
    }
    
    // Fallback: Calculate from vouchers if showOffer is not set
    if (store.vouchers && store.vouchers.length > 0) {
      const discounts = store.vouchers
        .map(v => {
          if (!v.discount) return 0;
          const match = String(v.discount).match(/(\d+)%?/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(d => d > 0);
      
      if (discounts.length > 0) {
        const maxDiscount = Math.max(...discounts);
        return currentLanguage === 'ar' 
          ? `خصم حتى ${maxDiscount}%`
          : `Up to ${maxDiscount}%`;
      }
    }
    
    return currentLanguage === 'ar' ? 'عروض حصرية' : 'Exclusive Deals';
  };
  
  // Get offer type label and icon
  const getOfferTypeDisplay = () => {
    const offerType = store.showOfferType?.toUpperCase();
    
    // Define offer type configurations
    const offerTypes = {
      CODE: {
        icon: '🎟️',
        labelEn: 'Code',
        labelAr: 'كود'
      },
      DEAL: {
        icon: '🔥',
        labelEn: 'Deal',
        labelAr: 'عرض'
      },
      DISCOUNT: {
        icon: '💰',
        labelEn: 'Discount',
        labelAr: 'خصم'
      },
      FREE_DELIVERY: {
        icon: '🚚',
        labelEn: 'Free Delivery',
        labelAr: 'توصيل مجاني'
      },
      FREE_SHIPPING: {
        icon: '📦',
        labelEn: 'Free Shipping',
        labelAr: 'شحن مجاني'
      },
      CASHBACK: {
        icon: '💵',
        labelEn: 'Cash Back',
        labelAr: 'استرداد نقدي'
      },
      OFFER: {
        icon: '🎁',
        labelEn: 'Special Offer',
        labelAr: 'عرض خاص'
      }
    };
    
    // Get configuration or use default
    const config = offerTypes[offerType] || offerTypes.OFFER;
    
    return {
      icon: config.icon,
      label: currentLanguage === 'ar' ? config.labelAr : config.labelEn
    };
  };
  
  const storeName = getStoreName();
  const storeSlug = getStoreSlug();
  const storeLogo = getStoreLogo();
  const showOffer = getShowOffer();
  const offerTypeDisplay = getOfferTypeDisplay();

  return (
    <Link 
      href={`/${locale}/stores/${storeSlug}`}
      className={`store-ticket-card ${store.isFeatured ? 'featured' : ''}`}
      aria-label={`${storeName} - ${showOffer} - ${offerTypeDisplay.label}`}
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

      {/* Show Offer (Main Discount/Offer Text) */}
      <div className="show-offer">
        <span className="offer-text">{showOffer}</span>
      </div>

      {/* Offer Type Badge (Bottom - Code/Deal/etc) */}
      {store.showOfferType && (
        <div className="offer-type-badge">
          <span className="type-icon">{offerTypeDisplay.icon}</span>
          <span className="type-label">{offerTypeDisplay.label}</span>
        </div>
      )}
    </Link>
  );
};

export default StoreCard;
