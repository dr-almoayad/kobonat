// components/affiliates/HomepageAffiliates.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import './HomepageAffiliates.css';

const HomepageAffiliates = ({ stores = [], loading = false }) => {
  const t = useTranslations('HomepageAffiliates');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  // Show only featured stores with logos
  const featuredStores = stores
    .filter(store => store.logo && store.voucherCount > 0)
    .slice(0, 12); // Show max 12 stores

  return (
    <section className="homepage-affiliates" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="affiliates-container">
        <div className="affiliates-header">
          <h1 className="affiliates-title">
            <span className="title-icon">🏪</span>
            {t('title') || (locale === 'ar' ? 'متاجرنا المميزة' : 'Featured Stores')}
          </h1>
          <p className="affiliates-subtitle">
            {t('subtitle') || (locale === 'ar' ? 'اكتشف أفضل العروض من متاجرك المفضلة' : 'Discover top deals from your favorite stores')}
          </p>
        </div>

        {loading ? (
          <div className="stores-loading">
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-logo"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="stores-grid">
            {featuredStores.map(store => (
              <Link
                key={store.id}
                href={`/${locale}/stores/${store.slug}`}
                className="store-logo-card"
                title={store.name}
              >
                <div className="logo-wrapper">
                  {store.logo ? (
                    <Image
                      src={store.logo}
                      alt={store.name}
                      width={120}
                      height={80}
                      className="store-logo"
                      priority={store.isFeatured}
                    />
                  ) : (
                    <div className="logo-placeholder">
                      {store.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="store-info">
                  <h3 className="store-name">{store.name}</h3>
                  {store.voucherCount > 0 && (
                    <span className="voucher-count">
                      <span className="material-symbols-sharp">local_offer</span>
                      {store.voucherCount} {locale === 'ar' ? 'كوبون' : 'offers'}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {featuredStores.length > 0 && (
          <div className="affiliates-footer">
            <Link href={`/${locale}/stores`} className="explore-button">
              {locale === 'ar' ? 'اكتشف جميع المتاجر' : 'Explore All Stores'}
              <span className="material-symbols-sharp">arrow_forward</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomepageAffiliates;