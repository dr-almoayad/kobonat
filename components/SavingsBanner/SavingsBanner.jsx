'use client';
// components/SavingsBanner/SavingsBanner.jsx
//
// Modern banner with new slogan, dark background, and text glow effect.
// Colors extracted from the uploaded screenshot.

import './SavingsBanner.css';

export default function SavingsBanner({ locale = 'ar-SA' }) {
  const lang = locale.split('-')[0];
  const isRtl = lang === 'ar';

  // New slogan (Arabic primary, English translation)
  const translations = {
    ar: 'أحدث كوبونات وأكواد الخصم في السعودية',
    en: 'Latest Coupons & Discount Codes in Saudi Arabia'
  };

  const slogan = translations[lang] || translations.ar;

  return (
    <div className="savings-banner-root" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="savings-banner-section">
        <div className="savings-banner-inner">
          <h1 className="savings-banner-title">{slogan}</h1>
        </div>
      </section>
    </div>
  );
}
