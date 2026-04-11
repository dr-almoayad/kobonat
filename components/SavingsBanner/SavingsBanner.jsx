'use client';
// components/SavingsBanner/SavingsBanner.jsx

import './SavingsBanner.css';

const STATS = {
  ar: [
    { symbol: '%70',  label: 'أعلى توفير', icon: 'percent' },
    { symbol: '+100', label: 'كود خصم فعال', icon: 'confirmation_number' },
    { symbol: '+50', label: 'متجر موثوق', icon: 'verified' },
  ],
  en: [
    { symbol: '70%',  label: 'Max Savings', icon: 'percent' },
    { symbol: '100+', label: 'Active Codes', icon: 'confirmation_number' },
    { symbol: '50+', label: 'Verified Stores', icon: 'verified' },
  ],
};

export default function SavingsBanner({ locale = 'ar-SA' }) {
  const lang  = locale.split('-')[0];
  const isAr  = lang === 'ar';
  const stats = STATS[lang] ?? STATS.ar;

  return (
    <div className="sb-root" dir={isAr ? 'rtl' : 'ltr'}>
      {/* decorative shape – subtle background accent */}
      <div className="sb-bg-shape"></div>

      <div className="sb-container">
        {/* left side: headline + CTA */}
        <div className="sb-content">
          <div className="sb-eyebrow">
            <span className="material-symbols-sharp sb-eyebrow-icon">local_offer</span>
            <span>{isAr ? 'كوبونات السعودية' : 'Saudi Coupons'}</span>
          </div>
          <h1 className="sb-headline">
            {isAr
              ? <>أحدث <span className="sb-accent">كوبونات</span> وأكواد الخصم في السعودية</>
              : <>Latest <span className="sb-accent">Coupons</span> &amp; Discount Codes in Saudi Arabia</>}
          </h1>
          <div className="sb-action">
            <a href="#" className="sb-action__link">
              {isAr ? 'استكشف جميع العروض' : 'Explore all deals'}
              <span className="sb-action__arrow" aria-hidden="true">
                {isAr ? '←' : '→'}
              </span>
            </a>
          </div>
        </div>

        {/* right side: stats cards (horizontal on desktop, vertical on mobile) */}
        <ul className="sb-stats" role="list">
          {stats.map((s, idx) => (
            <li key={s.symbol} className="sb-stat" style={{ animationDelay: `${idx * 0.08}s` }}>
              <div className="sb-stat__icon-wrapper">
                <span className="material-symbols-sharp sb-stat__icon">{s.icon}</span>
              </div>
              <div className="sb-stat__value">{s.symbol}</div>
              <div className="sb-stat__label">{s.label}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
