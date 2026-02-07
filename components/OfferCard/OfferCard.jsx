// components/OfferCard/OfferCard.jsx - Curated offers with squircle overflow
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import "./OfferCard.css";

const OfferCard = ({ offer }) => {
  const locale = useLocale();
  const currentLanguage = locale.split('-')[0];
  
  // Extract offer title
  const getTitle = () => {
    if (offer.title) return offer.title;
    if (offer.translations?.[0]?.title) return offer.translations[0].title;
    return currentLanguage === 'ar' ? 'عرض خاص' : 'Special Offer';
  };
  
  // Extract CTA text
  const getCtaText = () => {
    if (offer.ctaText) return offer.ctaText;
    if (offer.translations?.[0]?.ctaText) return offer.translations[0].ctaText;
    return currentLanguage === 'ar' ? 'تسوق الآن' : 'SHOP NOW';
  };
  
  // Get store details
  const getStoreName = () => {
    if (offer.store?.name) return offer.store.name;
    if (offer.store?.translations?.[0]?.name) return offer.store.translations[0].name;
    return '';
  };
  
  const getStoreLogo = () => {
    return offer.store?.logo || null;
  };
  
  const getStoreSlug = () => {
    if (offer.store?.slug) return offer.store.slug;
    if (offer.store?.translations?.[0]?.slug) return offer.store.translations[0].slug;
    return 'store';
  };
  
  // Get offer image
  const getOfferImage = () => {
    return offer.offerImage || '/placeholder-offer.jpg';
  };
  
  // Check if expired
  const isExpired = offer.expiryDate && new Date(offer.expiryDate) < new Date();
  
  // Get type badge config
  const getTypeBadge = () => {
    const type = offer.type?.toUpperCase();
    
    const badges = {
      CODE: {
        icon: 'confirmation_number',
        labelEn: 'Code',
        labelAr: 'كود',
        color: '#667eea'
      },
      DEAL: {
        icon: 'local_offer',
        labelEn: 'Deal',
        labelAr: 'عرض',
        color: '#f5576c'
      },
      PRODUCT: {
        icon: 'inventory_2',
        labelEn: 'Product',
        labelAr: 'منتج',
        color: '#4facfe'
      },
      SEASONAL: {
        icon: 'celebration',
        labelEn: 'Seasonal',
        labelAr: 'موسمي',
        color: '#fa709a'
      },
      FREE_SHIPPING: {
        icon: 'local_shipping',
        labelEn: 'Free Shipping',
        labelAr: 'شحن مجاني',
        color: '#43e97b'
      },
      CASHBACK: {
        icon: 'payments',
        labelEn: 'Cashback',
        labelAr: 'استرداد نقدي',
        color: '#30cfd0'
      },
      BUNDLE: {
        icon: 'redeem',
        labelEn: 'Bundle',
        labelAr: 'باقة',
        color: '#a8edea'
      },
      FLASH_SALE: {
        icon: 'bolt',
        labelEn: 'Flash Sale',
        labelAr: 'تخفيض سريع',
        color: '#ff6b6b'
      }
    };
    
    const config = badges[type] || badges.DEAL;
    
    return {
      icon: config.icon,
      label: currentLanguage === 'ar' ? config.labelAr : config.labelEn,
      color: config.color
    };
  };
  
  const title = getTitle();
  const ctaText = getCtaText();
  const storeName = getStoreName();
  const storeLogo = getStoreLogo();
  const storeSlug = getStoreSlug();
  const offerImage = getOfferImage();
  const typeBadge = getTypeBadge();

  return (
    <Link 
      href={offer.ctaUrl || `/${locale}/stores/${storeSlug}`}
      className={`offer-card ${isExpired ? 'expired' : ''} ${offer.isFeatured ? 'featured' : ''}`}
      aria-label={`${storeName} - ${title}`}
      target={offer.ctaUrl?.startsWith('http') ? '_blank' : '_self'}
      rel={offer.ctaUrl?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {/* Main Container */}
      <div className="offer-card-container">
        
        {/* Left Content Area */}
        <div className="offer-content">
          
          {/* Store Logo */}
          {storeLogo && (
            <div className="store-logo-container">
              <Image
                src={storeLogo}
                alt={storeName}
                width={120}
                height={40}
                className="store-logo"
              />
            </div>
          )}
          
          {/* Offer Type Badge */}
          {offer.type && (
            <div 
              className="type-badge"
              style={{ background: typeBadge.color }}
            >
              <span className="material-symbols-sharp badge-icon">
                {typeBadge.icon}
              </span>
              <span className="badge-label">{typeBadge.label}</span>
            </div>
          )}
          
          {/* Offer Title */}
          <h3 className="offer-title">{title}</h3>
          
          {/* CTA Button */}
          <div className="cta-button">
            <span className="cta-text">{ctaText}</span>
            <span className="material-symbols-sharp cta-arrow">
              arrow_forward
            </span>
          </div>
        </div>
        
        {/* Right Image Area - Squircle Overflow */}
        <div className="offer-image-container">
          <div className="squircle-wrapper">
            <Image
              src={offerImage}
              alt={title}
              fill
              className="offer-image"
              priority={offer.isFeatured}
            />
          </div>
        </div>
      </div>
      
      {/* Expired Overlay */}
      {isExpired && (
        <div className="expired-overlay">
          <span className="material-symbols-sharp">block</span>
          <span>{currentLanguage === 'ar' ? 'منتهي' : 'Expired'}</span>
        </div>
      )}
    </Link>
  );
};

export default OfferCard;
