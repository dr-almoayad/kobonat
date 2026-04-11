'use client';
// components/SavingsBanner/SavingsBanner.jsx

import './SavingsBanner.css';

const STATS = {
  ar: [
    { symbol: '%70',  label: 'أعلى توفير', icon: 'percent' },
    { symbol: '+100', label: 'كود خصم فعال', icon: 'local_activity' },
    { symbol: '+50',  label: 'متجر موثوق', icon: 'storefront' },
  ],
  en: [
    { symbol: '70%',  label: 'Max Savings',     icon: 'percent' },
    { symbol: '100+', label: 'Active Codes',    icon: 'local_activity' },
    { symbol: '50+',  label: 'Verified Stores', icon: 'storefront' },
  ],
};

export default function SavingsBanner({ locale = 'ar-SA' }) {
  const lang  = locale.split('-')[0];
  const isAr  = lang === 'ar';
  const stats = STATS[lang] ?? STATS.ar;

  return (
    <div className="sb-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="sb-body">

        {/* Eyebrow badge */}
        <div className="sb-eyebrow">
          <span className="material-symbols-sharp sb-eyebrow-icon">verified</span>
          <span>{isAr ? 'كوبونات السعودية' : 'Saudi Coupons'}</span>
        </div>

        {/* Headline */}
        <h1 className="sb-headline">
          {isAr
            ? <>أحدث <span className="sb-accent">كوبونات</span> وأكواد الخصم في السعودية</>
            : <>Latest <span className="sb-accent">Coupons</span> &amp; Discount Codes in Saudi Arabia</>}
        </h1>

        {/* Stat pills */}
        <ul className="sb-stats" role="list">
          {stats.map((s) => (
            <li key={s.symbol} className="sb-stat">
              <div className="sb-stat__icon-wrapper">
                <span className="material-symbols-sharp">{s.icon}</span>
              </div>
              <div className="sb-stat__content">
                <span className="sb-stat__value">{s.symbol}</span>
                <span className="sb-stat__label">{s.label}</span>
              </div>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}
