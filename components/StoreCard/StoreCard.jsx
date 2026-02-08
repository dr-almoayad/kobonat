// components/StoreCard/StoreCard.jsx - UPDATED for new schema
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
  
  // Helper to get translation for current locale
  const getCurrentTranslation = () => {
    if (!store.translations || !Array.isArray(store.translations)) {
      return null;
    }
    
    // Try to find exact locale match (e.g., 'en' or 'ar')
    let translation = store.translations.find(t => t.locale === currentLanguage);
    
    // Fallback to any translation
    if (!translation && store.translations.length > 0) {
      translation = store.translations[0];
    }
    
    return translation;
  };
  
  // Extract store name from current translation
  const getStoreName = () => {
    const translation = getCurrentTranslation();
    if (translation?.name) return translation.name;
    
    // Fallback to direct store name (if exists in old schema)
    if (store.name) return store.name;
    
    return currentLanguage === 'ar' ? 'متجر' : 'Store';
  };
  
  // Extract store slug from current translation
  const getStoreSlug = () => {
    const translation = getCurrentTranslation();
    if (translation?.slug) return translation.slug;
    
    // Fallback to direct store slug (if exists in old schema)
    if (store.slug) return store.slug;
    
    // Generate from name if available
    const name = getStoreName();
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'store';
  };
  
  // Get store bigLogo (primary) or fallback to regular logo
  const getStoreLogo = () => {
    return store.bigLogo || store.logo || null;
  };
  
  // Get store brand color
  const getBrandColor = () => {
    return store.color || '#470ae2';
  };
  
  // ✅ UPDATED: Get the show offer text from current translation
  const getShowOffer = () => {
    const translation = getCurrentTranslation();
    
    // 1. First priority: showOffer from current translation (new schema)
    if (translation?.showOffer) {
      return translation.showOffer;
    }
    
    // 2. Second priority: Direct store.showOffer (old schema - backwards compatibility)
    if (store.showOffer) {
      return store.showOffer;
    }
    
    // 3. Fallback: Calculate from vouchers if available
    if (store.vouchers && store.vouchers.length > 0) {
      const activeVouchers = store.vouchers.filter(v => {
        // Check if voucher is still valid
        if (v.expiryDate) {
          return new Date(v.expiryDate) > new Date();
        }
        return true;
      });
      
      if (activeVouchers.length > 0) {
        const discounts = activeVouchers
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
            : `Get ${maxDiscount}% off all orders`;
        }
      }
    }
    
    // 4. Final fallback based on store type/status
    if (store.isFeatured) {
      return currentLanguage === 'ar' 
        ? 'عروض مميزة' 
        : 'Featured deals';
    }
    
    // 5. Default fallback
    return currentLanguage === 'ar' 
      ? 'عروض حصرية متاحة' 
      : 'Exclusive deals available';
  };
  
  // Get offer type display
  const getOfferTypeDisplay = () => {
    const offerType = store.showOfferType?.toUpperCase();
    
    const offerTypes = {
      CODE: {
        icon: 'confirmation_number',
        labelEn: 'Code',
        labelAr: 'كود',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      DEAL: {
        icon: 'local_fire_department',
        labelEn: 'Deal',
        labelAr: 'عرض',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      DISCOUNT: {
        icon: 'sell',
        labelEn: 'Discount',
        labelAr: 'خصم',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      },
      // ✅ REMOVED: FREE_DELIVERY (not in enum)
      FREE_SHIPPING: {
        icon: 'local_shipping', // or 'inventory_2' for shipping icon
        labelEn: 'Free Shipping',
        labelAr: 'شحن مجاني',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
      },
      CASHBACK: {
        icon: 'attach_money',
        labelEn: 'Cash Back',
        labelAr: 'استرداد نقدي',
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
      },
      OFFER: {
        icon: 'redeem',
        labelEn: 'Special Offer',
        labelAr: 'عرض خاص',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
      }
    };
    
    const config = offerTypes[offerType] || offerTypes.OFFER;
    
    return {
      icon: config.icon,
      label: currentLanguage === 'ar' ? config.labelAr : config.labelEn,
      gradient: config.gradient
    };
  };
  
  const storeName = getStoreName();
  const storeSlug = getStoreSlug();
  const storeLogo = getStoreLogo();
  const brandColor = getBrandColor();
  const showOffer = getShowOffer();
  const offerTypeDisplay = getOfferTypeDisplay();
  
  // Handle RTL layout for Arabic
  const isRTL = currentLanguage === 'ar';

  return (
    <Link 
      href={`/${locale}/stores/${storeSlug}`}
      className={`store-card-modern ${store.isFeatured ? 'featured' : ''} ${isRTL ? 'rtl' : ''}`}
      aria-label={`${storeName} - ${showOffer}`}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Main Card Container - Full Bleed Logo */}
      <div 
        className="card-container"
        style={{ 
          background: storeLogo 
            ? brandColor 
            : `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`
        }}
      >
        {storeLogo ? (
          <div className="logo-container">
            <Image
              src={storeLogo}
              alt={storeName}
              width={120}
              height={120}
              className="store-logo"
              style={{ 
                objectFit: 'contain',
                width: '100%',
                height: '100%'
              }}
              priority={false}
            />
          </div>
        ) : (
          <div className="store-name-fallback">
            {storeName}
          </div>
        )}
      </div>

      {/* Offer Type Badge */}
      {store.showOfferType && (
        <div 
          className="offer-type-badge"
          style={{ 
            background: offerTypeDisplay.gradient,
            direction: 'ltr' // Keep badge LTR even in RTL mode
          }}
        >
          <span className="material-symbols-sharp badge-icon">
            {offerTypeDisplay.icon}
          </span>
          <span className="badge-label">{offerTypeDisplay.label}</span>
        </div>
      )}

      {/* Main Offer Text with Arrow */}
      <div className="main-offer">
        <p className="offer-text">
          {showOffer}
          <span className="material-symbols-sharp offer-arrow">
            {isRTL ? 'arrow_back' : 'arrow_forward'}
          </span>
        </p>
      </div>
    </Link>
  );
};

export default StoreCard;
