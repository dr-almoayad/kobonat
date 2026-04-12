'use client';
// components/SavingsBanner/SavingsBanner.jsx

import './SavingsBanner.css';

export default function SavingsBanner({ locale = 'ar-SA' }) {
  const isAr = locale?.startsWith('ar');

  return (
    <div className="sb-root" dir={isAr ? 'rtl' : 'ltr'}>
      {/* decorative abstract shapes */}
      <div className="sb-shape sb-shape-1"></div>
      <div className="sb-shape sb-shape-2"></div>
      <div className="sb-shape sb-shape-3"></div>

      <div className="sb-content">
        {/* Eyebrow / tagline */}
        <p className="sb-eyebrow">
          {isAr ? 'أحدث كوبونات السعودية' : 'Latest Saudi Coupons'}
        </p>

        {/* Main headline */}
        <h1 className="sb-headline">
          {isAr ? (
            <>أكثر من <span className="sb-accent">100+ كود</span> فعال</>
          ) : (
            <>Over <span className="sb-accent">100+ Active</span> Coupon Codes</>
          )}
        </h1>

        {/* Subtext – adds credibility */}
        <p className="sb-subtext">
          {isAr
            ? 'وفر حتى 70% على أشهر المتاجر – محدث يومياً'
            : 'Save up to 70% at top stores – updated daily'}
        </p>

        {/* Small stat badge (like +100 active coupons) – subtle, not a full stats row */}
        <div className="sb-badge">
          <span className="sb-badge-icon">✓</span>
          <span>{isAr ? '+100 كود خصم فعال' : '+100 Verified Active Codes'}</span>
        </div>

        {/* CTA Button */}
        <a href="#" className="sb-button">
          {isAr ? '!احصل على كود خصم الآن' : 'Get Code Now!'}
          <span className="sb-button-icon" aria-hidden="true">
            {isAr ? '←' : '→'}
          </span>
        </a>
      </div>
    </div>
  );
}
