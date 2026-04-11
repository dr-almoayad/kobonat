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
      <div className="sb-body">

        {/* eyebrow badge */}
        <div className="sb-eyebrow">
          <span className="material-symbols-sharp sb-eyebrow-icon">
            {isAr ? 'stars' : 'sell'}
          </span>
          <span>{isAr ? 'كوبونات السعودية' : 'Saudi Coupons'}</span>
        </div>

        {/* headline */}
        <h1 className="sb-headline">
          {isAr
            ? <>أحدث <span className="sb-accent">كوبونات</span> وأكواد الخصم في السعودية</>
            : <>Latest <span className="sb-accent">Coupons</span> &amp; Discount Codes in Saudi Arabia</>}
        </h1>

        {/* stat pills */}
        <ul className="sb-stats" role="list">
          {stats.map((s, idx) => (
            <li key={s.symbol} className="sb-stat" style={{ animationDelay: `${idx * 0.1}s` }}>
              <span className="material-symbols-sharp sb-stat__icon">{s.icon}</span>
              <span className="sb-stat__value">{s.symbol}</span>
              <span className="sb-stat__label">{s.label}</span>
            </li>
          ))}
        </ul>

        {/* subtle CTA for sales direction */}
        <div className="sb-action">
          <a href="#" className="sb-action__link">
            {isAr ? 'استكشف جميع العروض' : 'Explore all deals'}
            <span className="sb-action__arrow" aria-hidden="true">
              {isAr ? '←' : '→'}
            </span>
          </a>
        </div>

      </div>
    </div>
  );
}
