// components/StoreCard/StoreCard.jsx
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import './StoreCard.css';

// Icon config (kept for fallback, but dynamic now)
const OFFER_TYPE_CONFIG = {
  CODE:          { icon: 'confirmation_number', color: '#7c3aed' },
  DEAL:          { icon: 'local_fire_department', color: '#ef4444' },
  DISCOUNT:      { icon: 'sell',                 color: '#3b82f6' },
  FREE_DELIVERY: { icon: 'local_shipping',       color: '#10b981' },
  FREE_SHIPPING: { icon: 'local_shipping',       color: '#10b981' },
  CASHBACK:      { icon: 'bolt',                 color: '#0ea5e9' },
  OFFER:         { icon: 'redeem',               color: '#470ae2' },
};

function getBestOffer(store, lang) {
  const isAr = lang === 'ar';
  let maxSavings = 0;
  let activeDealsCount = 0;

  // Extract max discount percentage
  if (store.vouchers && Array.isArray(store.vouchers)) {
    maxSavings = Math.max(
      ...store.vouchers.map(v => v.discountPercent || 0),
      0
    );
  } else if (store.vouchers?.[0]?.discountPercent) {
    maxSavings = store.vouchers[0].discountPercent;
  }

  // Extract active deals count
  if (store._count?.vouchers !== undefined) {
    activeDealsCount = store._count.vouchers;
  } else if (store.vouchers && Array.isArray(store.vouchers)) {
    activeDealsCount = store.vouchers.length;
  } else if (store.activeVouchersCount !== undefined) {
    activeDealsCount = store.activeVouchersCount;
  }

  const hasGoodSavings = maxSavings >= 15;
  const hasManyDeals = activeDealsCount >= 5;

  if (hasGoodSavings) {
    const savingsText = isAr ? `وفّر ${Math.round(maxSavings)}%` : `Save ${Math.round(maxSavings)}%`;
    return { text: savingsText, icon: 'percent', color: '#f59e0b' };
  }
  if (hasManyDeals) {
    const dealsText = isAr
      ? `${activeDealsCount}+ عرض نشط`
      : `${activeDealsCount}+ Active deals`;
    return { text: dealsText, icon: 'local_offer', color: '#10b981' };
  }
  const fallbackText = isAr ? 'اكتشف العروض' : 'See deals';
  return { text: fallbackText, icon: 'redeem', color: '#470ae2' };
}

export default function StoreCard({ store }) {
  const locale = useLocale();
  const lang = locale.split('-')[0];

  const name = store.translations?.find(t => t.locale === lang)?.name
    || store.translations?.[0]?.name
    || store.name
    || (lang === 'ar' ? 'متجر' : 'Store');

  const slug = store.translations?.find(t => t.locale === lang)?.slug
    || store.translations?.[0]?.slug
    || store.slug
    || 'store';

  const logo = store.bigLogo || store.logo || null;
  const color = store.color || '#470ae2';
  const bestOffer = getBestOffer(store, lang);

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <Link
      href={`/${locale}/stores/${slug}`}
      className="sc-root"
      aria-label={`${name} — ${bestOffer.text}`}
    >
      <div className="sc-logo-wrap">
        {logo ? (
          <Image
            src={logo}
            alt={name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
            className="sc-logo-img"
          />
        ) : (
          <div className="sc-logo-initials" style={{ background: color }}>
            {initials}
          </div>
        )}
      </div>

      <div className="sc-info">
        <p className="sc-name">{name}</p>
        <p className="sc-offer">
          <span
            className="sc-offer-icon material-symbols-sharp"
            style={{ color: bestOffer.color }}
          >
            {bestOffer.icon}
          </span>
          <span
            className="sc-offer-text"
            style={{ color: bestOffer.color }}
          >
            {bestOffer.text}
          </span>
        </p>
      </div>
    </Link>
  );
}
