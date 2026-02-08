// components/StoreCard/StoreCard.jsx - UPDATED for multilingual showOffer
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import "./StoreCard.css";

const StoreCard = ({ store }) => {
  const locale = useLocale();
  const t = useTranslations('StoreCard');
  const currentLanguage = locale.split('-')[0];

useEffect(() => {
  console.log('FULL STORE DATA FOR DEBUG:', {
    id: store.id,
    translations: store.translations,
    translationsCount: store.translations?.length,
    firstTranslation: store.translations?.[0],
    showOfferField: store.translations?.[0]?.showOffer,
    showOfferType: store.showOfferType,
    name: store.name,
    vouchersCount: store.vouchers?.length
  });
}, [store]);
  
  // Extract store name
  const getStoreName = () => {
    if (store.name) return store.name;
    if (store.translations?.[0]?.name) return store.translations[0].name;
    return currentLanguage === 'ar' ? 'متجر' : 'Store';
  };
  
  // Extract store slug
  const getStoreSlug = () => {
    if (store.slug) return store.slug;
    if (store.translations?.[0]?.slug) return store.translations[0].slug;
    return 'store';
  };
  
  // Get store bigLogo (primary) or fallback to regular logo
  const getStoreLogo = () => {
    return store.bigLogo || store.logo || null;
  };
  
  // Get store brand color
  const getBrandColor = () => {
    return store.color || '#470ae2';
  };
  
 const getShowOffer = () => {
  console.log('Debug getShowOffer:', {
    storeId: store.id,
    translations: store.translations,
    hasTranslations: store.translations?.length > 0,
    firstTranslation: store.translations?.[0],
    showOfferInFirst: store.translations?.[0]?.showOffer
  });

  // First, check if showOffer exists in current translation
  if (store.translations?.[0]?.showOffer) {
    console.log('Found in translation[0]:', store.translations[0].showOffer);
    return store.translations[0].showOffer;
  }
  
  // Check ALL translations, not just first one
  if (store.translations?.length > 0) {
    // Try to find any translation with showOffer
    const translationWithOffer = store.translations.find(t => t.showOffer && t.showOffer.trim() !== '');
    if (translationWithOffer?.showOffer) {
      console.log('Found in other translation:', translationWithOffer.showOffer);
      return translationWithOffer.showOffer;
    }
  }
  
  // Fallback: Old format (for backwards compatibility during migration)
  if (store.showOffer) {
    console.log('Found in legacy store.showOffer:', store.showOffer);
    return store.showOffer;
  }
  
  // Fallback: Calculate from vouchers
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
      const fallback = currentLanguage === 'ar' 
        ? `خصم حتى ${maxDiscount}%`
        : `Get ${maxDiscount}% off all orders`;
      console.log('Using voucher fallback:', fallback);
      return fallback;
    }
  }
  
  // Final fallback - UNCOMMENT THIS
  console.log('Using final fallback');
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
      FREE_DELIVERY: {
        icon: 'local_shipping',
        labelEn: 'Free Delivery',
        labelAr: 'توصيل مجاني',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
      },
      FREE_SHIPPING: {
        icon: 'inventory_2',
        labelEn: 'Free Shipping',
        labelAr: 'شحن مجاني',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
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

  return (
    <Link 
      href={`/${locale}/stores/${storeSlug}`}
      className={`store-card-modern ${store.isFeatured ? 'featured' : ''}`}
      aria-label={`${storeName} - ${showOffer}`}
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
          <Image
            src={storeLogo}
            alt={storeName}
            fill
            className="store-logo"
            priority={false}
          />
        ) : (
          <div className="store-name-fallback">
            {storeName}
          </div>
        )}
      </div>

      <div className="offer-head">
        {/* Offer Type Badge */}
        {store.showOfferType && (
          <div 
            className="offer-type-badge"
            style={{ background: offerTypeDisplay.gradient }}
          >
            <span className="material-symbols-sharp badge-icon">
              {offerTypeDisplay.icon}
            </span>
            <span className="badge-label">{offerTypeDisplay.label}</span>
          </div>
        )}
        <p className="offer-store-name">
          {storeName}
        </p>
      </div>

      {/* Main Offer Text with Arrow */}
      <div className="main-offer">
        <p className="offer-text">
          {showOffer}
          <span className="material-symbols-sharp offer-arrow">
            arrow_forward
          </span>
        </p>
      </div>
    </Link>
  );
};

export default StoreCard;
