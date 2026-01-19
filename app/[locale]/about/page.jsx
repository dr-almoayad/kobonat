// app/[locale]/about/page.jsx - UPDATED
'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import './about.css';

const Page = () => {
  const t = useTranslations('About');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  // Stats data
  const stats = [
    { icon: 'store', number: '5K+', label: t('activeProducts') },
    { icon: 'trending_up', number: '3.5M+', label: t('priceChecks') },
    { icon: 'savings', number: '$15M+', label: t('totalSavings') },
    { icon: 'person', number: '500K+', label: t('happyUsers') },
  ];

  // Team members
  const team = [
    { name: t('founder'), role: t('ceoRole'), icon: 'person' },
    { name: t('techLead'), role: t('techRole'), icon: 'code' },
    { name: t('dataLead'), role: t('dataRole'), icon: 'analytics' },
  ];

  return (
    <div className="about-page" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="about-container">
        {/* Hero Section */}
        <section className="about-hero">
          
          
          <h1>{t('heroTitle')}</h1>
          <p className="hero-subtitle">
            {t.rich('heroSubtitle', {
              brand: (chunks) => <span className="brand-highlight">{chunks}</span>
            })}
          </p>
        </section>

        {/* Stats Section 
        <div className="about-stats">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <i className="material-symbols-sharp stat-icon">{stat.icon}</i>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>*/}

        {/* Content Grid */}
        <div className="about-content-grid">
          <div className="about-card">
            <div className="about-card-icon">
              <i className="material-symbols-sharp">target</i>
            </div>
            <h2>{t('missionTitle')}</h2>
            <p>{t('missionDescription')}</p>
          </div>

          <div className="about-card">
            <div className="about-card-icon">
              <i className="material-symbols-sharp">star</i>
            </div>
            <h2>{t('whyUsTitle')}</h2>
            <ul>
              {[1, 2, 3, 4].map((item) => (
                <li key={item}>
                  <i className="material-symbols-sharp">check_circle</i>
                  <span>{t(`benefit${item}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Vision Section - Full Width */}
          <div className="about-vision">
            <div className="about-vision-content">
              <i className="material-symbols-sharp about-vision-icon">visibility</i>
              <h2>{t('visionTitle')}</h2>
              <p>{t('visionDescription')}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="about-footer">
          <p>{t('footerText')}</p>
        </footer>
      </div>
    </div>
  );
};

export default Page;