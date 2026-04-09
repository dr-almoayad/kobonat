'use client';
// components/SavingsBanner/SavingsBanner.jsx
//
// Static banner with creative text effects.
// No images, light mode only, bilingual (Arabic/English).

import './SavingsBanner.css';

export default function SavingsBanner({ locale = 'ar-SA' }) {
  const lang = locale.split('-')[0];
  const isRtl = lang === 'ar';

  // Translations
  const translations = {
    ar: {
      word1: 'وفر',
      word2: 'في كل',
      word3: 'مكان!',
    },
    en: {
      word1: 'Save',
      word2: 'Everywhere',
      word3: 'You Shop!',
    }
  };

  const t = translations[lang] || translations.en;

  return (
    <div className="savings-banner-root" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="savings-banner-section">
        <div className="savings-banner-inner">
          <h1 className="savings-banner-title">
            <span className="savings-text-main">{t.word1}</span>
            <span className="savings-text-spacer"> </span>
            <span className="savings-text-accent">{t.word2}</span>
            <span className="savings-text-spacer"> </span>
            <span className="savings-text-highlight">{t.word3}</span>
          </h1>
          
          {/* Decorative animated underline */}
          <div className="savings-banner-underline">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </section>
    </div>
  );
}
