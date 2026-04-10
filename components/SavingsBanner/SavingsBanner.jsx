'use client';
// components/SavingsBanner/SavingsBanner.jsx

import './SavingsBanner.css';

const STATS = {
  ar: [
    { symbol: '%70',  label: 'أعلى توفير'    },
    { symbol: '+500', label: 'كود خصم فعال'  },
    { symbol: '+200', label: 'متجر موثوق'    },
  ],
  en: [
    { symbol: '70%',  label: 'Max Savings'     },
    { symbol: '500+', label: 'Active Codes'    },
    { symbol: '200+', label: 'Verified Stores' },
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
          <span className="sb-eyebrow-pct">%</span>
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
              <span className="sb-stat__value">{s.symbol}</span>
              <span className="sb-stat__label">{s.label}</span>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}
