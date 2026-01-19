// components/StoreCard/StoreCard.jsx - FIXED FOR MULTI-LANGUAGE
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import "./StoreCard.css";

const StoreCard = ({ store }) => {
  const locale = useLocale();
  const currentLanguage = locale.split('-')[0];
  
  // Safely extract store name
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
  
  // Get voucher count
  const getVoucherCount = () => {
    return store._count?.vouchers || 0;
  };
  
  // Get store logo
  const getStoreLogo = () => {
    return store.logo || null;
  };
  
  const storeName = getStoreName();
  const storeSlug = getStoreSlug();
  const voucherCount = getVoucherCount();
  const storeLogo = getStoreLogo();

  return (
    <Link 
      href={`/${locale}/stores/${storeSlug}`}
      className={`store-ticket-card ${store.isFeatured ? 'featured' : ''}`}
    >
      {/* --- TOP SECTION: BRAND IDENTITY --- */}
      <div className="ticket-header">
        <div className="logo-container">
          {storeLogo ? (
            <Image
              src={storeLogo}
              alt={storeName}
              width={72}
              height={72}
              className="store-card-logo"
            />
          ) : (
            <div className="store-logo-placeholder">
              {storeName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="store-info">
          <h1 className="store-name">
            {storeName}
          </h1>
        </div>
      </div>

      {/* --- DIVIDER: PERFORATION --- */}
      <div className="ticket-divider">
        <div className="notch notch-left"></div>
        <div className="dashed-line"></div>
        <div className="notch notch-right"></div>
      </div>

      {/* --- BOTTOM SECTION: STATS & ACTION --- */}
      <div className="ticket-body">
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-value">{voucherCount}</span>
            <span className="stat-label">
              {currentLanguage === 'ar' ? 'كوبون' : 'Coupons'}
            </span>
          </div>
        </div>
        
        <div className="action-area">
            <span className="action-text">
                {currentLanguage === 'ar' ? 'عرض المتجر' : 'View Store'}
            </span>
        </div>
      </div>
    </Link>
  );
};

export default StoreCard;