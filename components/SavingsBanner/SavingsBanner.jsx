'use client';
// components/SavingsBanner/SavingsBanner.jsx
// Design: single-row horizontal banner — teal bg, stamp badge, bold headline, pill CTA, icon graphic.
// Matches the style of the reference image.

import Link from 'next/link';
import './SavingsBanner.css';

export default function SavingsBanner({
  locale    = 'ar-SA',
  href      = 'https://cobonat.me/ar-SA/coupons',
  savingsPct = 70,
}) {
  const isAr = locale?.startsWith('ar');

  return (
    <div className="sb-root" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Left stamp badge ── */}
      <div className="sb-badge" aria-hidden="true">
        <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* outer starburst */}
          <path
            d="M30 2L34.3 13.2L46.2 10.2L43.2 22.1L54.4 26.4L46.2 34.6L52.4 45L40.5 43.8L37.5 55.7L28 48.5L18.5 55.7L15.5 43.8L3.6 45L9.8 34.6L1.6 26.4L12.8 22.1L9.8 10.2L21.7 13.2Z"
            fill="#7C3AED"
            opacity="0.18"
          />
          {/* main circle */}
          <circle cx="30" cy="30" r="21" fill="#7C3AED" />
          {/* inner dashed ring */}
          <circle cx="30" cy="30" r="18.5" fill="none" stroke="#A78BFA" strokeWidth="1" strokeDasharray="3.2 2.4" />
          {/* "SAVE" label */}
          <text
            x="30" y="26"
            textAnchor="middle"
            fontFamily="'Alexandria', system-ui, sans-serif"
            fontSize="9"
            fontWeight="800"
            letterSpacing="0.12em"
            fill="white"
            opacity="0.85"
          >
            {isAr ? 'وفّر' : 'SAVE'}
          </text>
          {/* pct number */}
          <text
            x="30" y="38"
            textAnchor="middle"
            fontFamily="'Alexandria', system-ui, sans-serif"
            fontSize="15"
            fontWeight="900"
            fill="white"
          >
            {isAr ? 'أكثر' : 'MORE'}
          </text>
        </svg>
      </div>

      {/* ── Headline ── */}
      <h1 className="sb-headline">
        {isAr
              ? <>أحدث <span className="sb-accent">كوبونات</span> وأكواد الخصم في السعودية</>
              : <>Latest <span className="sb-accent">Coupons</span> &amp; Discount Codes in Saudi Arabia</>
        }
      </h1>

      {/* ── CTA pill ── */}
      <Link href={href} className="sb-cta">
        {isAr ? 'احصل على كود خصم الآن!' : 'Get A Discount Code Now!'}
      </Link>

      {/* ── Right decorative graphic ── */}
      <div className="sb-graphic" aria-hidden="true">
        <svg viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* soft bg circle */}
          <circle cx="29" cy="29" r="29" fill="#7C3AED" opacity="0.1" />
          {/* person silhouette */}
          <circle cx="27" cy="23" r="7" fill="#7C3AED" />
          <path
            d="M14 43C14 36.4 19.8 31 27 31C34.2 31 40 36.4 40 43"
            stroke="#7C3AED"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* bolt badge overlay */}
          <circle cx="40" cy="14" r="9" fill="#1AD9E8" stroke="#7C3AED" strokeWidth="1.5" />
          <path
            d="M42 9L38.5 14.5H41.5L39 19L43.5 13H40.5L42 9Z"
            fill="#7C3AED"
          />
        </svg>
      </div>

    </div>
  );
}
