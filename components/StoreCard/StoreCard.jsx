// components/StoreCard/StoreCard.jsx
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import './StoreCard.css';

// Icon + color per offer type
const OFFER_TYPE_CONFIG = {
  CODE:          { icon: 'confirmation_number', color: '#7c3aed' },
  DEAL:          { icon: 'local_fire_department', color: '#ef4444' },
  DISCOUNT:      { icon: 'sell',                 color: '#3b82f6' },
  FREE_DELIVERY: { icon: 'local_shipping',        color: '#10b981' },
  FREE_SHIPPING: { icon: 'local_shipping',        color: '#10b981' },
  CASHBACK:      { icon: 'bolt',                  color: '#0ea5e9' },
  OFFER:         { icon: 'redeem',                color: '#f59e0b' },
};

export default function StoreCard({ store }) {
  const locale    = useLocale();
  const lang      = locale.split('-')[0];

  // ── Helpers ────────────────────────────────────────────────────────────────
  const name = store.translations?.find(t => t.locale === lang)?.name
    || store.translations?.[0]?.name
    || store.name
    || (lang === 'ar' ? 'متجر' : 'Store');

  const slug = store.translations?.find(t => t.locale === lang)?.slug
    || store.translations?.[0]?.slug
    || store.slug
    || 'store';

  const logo  = store.bigLogo || store.logo || null;
  const color = store.color   || '#470ae2';

  const showOffer = (() => {
    // Prefer locale-matched translation
    const matched = store.translations?.find(t => t.locale === lang)?.showOffer;
    if (matched?.trim()) return matched;
    // Any translation with a value
    const any = store.translations?.find(t => t.showOffer?.trim())?.showOffer;
    if (any) return any;
    // Legacy field
    if (store.showOffer) return store.showOffer;
    // Derive from vouchers
    if (store.vouchers?.length) {
      const max = Math.max(
        ...store.vouchers
          .map(v => { const m = String(v.discount || '').match(/(\d+)/); return m ? +m[1] : 0; })
          .filter(Boolean)
      );
      if (max > 0) return lang === 'ar' ? `خصم حتى ${max}%` : `Up to ${max}% off`;
    }
    return lang === 'ar' ? 'اكتشف العروض' : 'See deals';
  })();

  const offerKey    = store.showOfferType?.toUpperCase();
  const offerConfig = OFFER_TYPE_CONFIG[offerKey] || OFFER_TYPE_CONFIG.OFFER;

  // Initials fallback when no logo
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
      aria-label={`${name} — ${showOffer}`}
    >
      {/* ── Logo area ───────────────────────────────────────────────────── */}
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
          <div
            className="sc-logo-initials"
            style={{ background: color }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* ── Info area ───────────────────────────────────────────────────── */}
      <div className="sc-info">
        <p className="sc-name">{name}</p>
        <p className="sc-offer">
          <span
            className="sc-offer-icon material-symbols-sharp"
            style={{ color: offerConfig.color }}
          >
            {offerConfig.icon}
          </span>
          <span className="sc-offer-text">{showOffer}</span>
        </p>
      </div>
    </Link>
  );
}
