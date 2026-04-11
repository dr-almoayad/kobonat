'use client';
// components/SavingsBanner/SavingsBanner.jsx

import './SavingsBanner.css';

const STATS = {
  ar: [
    { symbol: '%70',  label: 'أعلى توفير', icon: 'percent_discount'},
    { symbol: '+100', label: 'كود خصم فعال', icon: 'local_activity'},
    { symbol: '+50', label: 'متجر موثوق', icon: 'storefront'},
  ],
  en: [
    { symbol: '70%',  label: 'Max Savings'     },
    { symbol: '100+', label: 'Active Codes'    },
    { symbol: '50+', label: 'Verified Stores' },
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
        <p className="sb-eyebrow">
          {isAr ? 'كوبونات السعودية' : 'Saudi Coupons'}
        </p>

        {/* headline */}
        <h1 className="sb-headline">
          {isAr
            ? <>أحدث <span className="sb-accent">كوبونات</span> وأكواد الخصم في السعودية</>
            : <>Latest <span className="sb-accent">Coupons</span> &amp; Discount Codes in Saudi Arabia</>}
        </h1>

        {/* stat pills */}
        <ul className="sb-stats" role="list">
          {stats.map((s) => (
            <li key={s.symbol} className="sb-stat">
              <span class="material-symbols-sharp">{s.icon}</span>
              <span className="sb-stat__value">{s.symbol}</span>
              <span className="sb-stat__label">{s.label}</span>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}
