'use client';
// components/SavingsBanner/SavingsBanner.jsx

import './SavingsBanner.css';

const STATS = {
  ar: [
    { icon: 'confirmation_number', value: '500+', label: 'كود خصم فعال' },
    { icon: 'storefront',          value: '200+', label: 'متجر موثوق'   },
    { icon: 'savings',             value: '70%',  label: 'أعلى توفير'   },
  ],
  en: [
    { icon: 'confirmation_number', value: '500+', label: 'Active Codes'    },
    { icon: 'storefront',          value: '200+', label: 'Verified Stores' },
    { icon: 'savings',             value: '70%',  label: 'Max Savings'     },
  ],
};

export default function SavingsBanner({ locale = 'ar-SA' }) {
  const lang  = locale.split('-')[0];
  const isAr  = lang === 'ar';
  const stats = STATS[lang] ?? STATS.ar;

  return (
    <div className="sb-root" dir={isAr ? 'rtl' : 'ltr'}>

      {/* tri-color strip — identical to OfferStack top strip */}
      <div className="sb-strip" aria-hidden="true" />

      <div className="sb-body">

        {/* eyebrow */}
        <p className="sb-eyebrow">
          <span className="material-symbols-sharp">bolt</span>
          {isAr ? 'كوبونات السعودية' : 'Saudi Coupons'}
        </p>

        {/* headline */}
        <h1 className="sb-headline">
          {isAr
            ? <>أحدث <span className="sb-accent">كوبونات</span> وأكواد الخصم في السعودية</>
            : <>Latest <span className="sb-accent">Coupons</span> &amp; Discount Codes in Saudi Arabia</>}
        </h1>

        {/* divider */}
        <div className="sb-divider" aria-hidden="true" />

        {/* stats row */}
        <ul className="sb-stats" role="list">
          {stats.map((s) => (
            <li key={s.icon} className="sb-stat">
              <span className="sb-stat__icon material-symbols-sharp">{s.icon}</span>
              <span className="sb-stat__value">{s.value}</span>
              <span className="sb-stat__label">{s.label}</span>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}
