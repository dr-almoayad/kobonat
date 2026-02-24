// components/CuratedOfferCard/CuratedOfferCard.jsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import './CuratedOfferCard.css';

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  CODE:          { icon: 'confirmation_number', en: 'Code',          ar: 'كود',           hue: '#5b4cff' },
  DEAL:          { icon: 'local_offer',         en: 'Deal',          ar: 'عرض',           hue: '#e8445a' },
  PRODUCT:       { icon: 'inventory_2',         en: 'Product',       ar: 'منتج',          hue: '#0ea5e9' },
  SEASONAL:      { icon: 'celebration',         en: 'Seasonal',      ar: 'موسمي',         hue: '#f472b6' },
  FREE_SHIPPING: { icon: 'local_shipping',      en: 'Free Shipping', ar: 'شحن مجاني',    hue: '#10b981' },
  CASHBACK:      { icon: 'payments',            en: 'Cashback',      ar: 'استرداد نقدي',  hue: '#06b6d4' },
  BUNDLE:        { icon: 'redeem',              en: 'Bundle',        ar: 'باقة',          hue: '#8b5cf6' },
  FLASH_SALE:    { icon: 'bolt',               en: 'Flash Sale',    ar: 'تخفيض سريع',   hue: '#f97316' },
};

export default function CuratedOfferCard({ offer }) {
  const locale = useLocale();
  const lang   = locale.split('-')[0]; // 'ar' | 'en'
  const isRtl  = lang === 'ar';

  // ── Data extraction ───────────────────────────────────────────────────────
  const translation = offer.translations?.find(t => t.locale === lang)
    || offer.translations?.[0]
    || {};

  const title   = translation.title   || (isRtl ? 'عرض خاص'   : 'Special Offer');
  const ctaText = translation.ctaText || (isRtl ? 'تسوق الآن' : 'SHOP NOW');

  const storeName = offer.store?.translations?.find(t => t.locale === lang)?.name
    || offer.store?.translations?.[0]?.name
    || '';
  const storeLogo = offer.store?.logo || null;
  const storeSlug = offer.store?.translations?.find(t => t.locale === lang)?.slug
    || offer.store?.translations?.[0]?.slug
    || 'store';

  const offerImage = offer.offerImage || null;
  const href       = offer.ctaUrl || `/${locale}/stores/${storeSlug}`;
  const isExternal = href.startsWith('http');
  const isExpired  = offer.expiryDate && new Date(offer.expiryDate) < new Date();

  const typeKey    = offer.type?.toUpperCase() || 'DEAL';
  const typeCfg    = TYPE_CONFIG[typeKey] || TYPE_CONFIG.DEAL;
  const badgeLabel = isRtl ? typeCfg.ar : typeCfg.en;
  const hasCode    = typeKey === 'CODE' && offer.code;

  return (
    <Link
      href={href}
      className={`co-card${isExpired ? ' co-card--expired' : ''}${offer.isFeatured ? ' co-card--featured' : ''}`}
      aria-label={`${storeName} – ${title}`}
      target={isExternal ? '_blank' : '_self'}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    >
      {/* Featured ribbon */}
      {offer.isFeatured && (
        <div className="co-ribbon">
          <span className="material-symbols-sharp">star</span>
          {isRtl ? 'مميز' : 'Featured'}
        </div>
      )}

      {/* Body */}
      <div className="co-body">

        {/* LEFT — content */}
        <div className="co-content">
          {/* Store logo */}
          {storeLogo ? (
            <div className="co-store-logo">
              <Image
                src={storeLogo}
                alt={storeName}
                width={110}
                height={36}
                style={{ objectFit: 'contain' }}
              />
            </div>
          ) : storeName ? (
            <p className="co-store-name">{storeName}</p>
          ) : null}

          {/* Type badge */}
          <span className="co-badge" style={{ '--badge-hue': typeCfg.hue }}>
            <span className="material-symbols-sharp">{typeCfg.icon}</span>
            {badgeLabel}
          </span>

          {/* Offer title */}
          <h3 className="co-title">{title}</h3>

          {/* Code chip */}
          {hasCode && (
            <div className="co-code-chip">
              <span className="material-symbols-sharp">content_copy</span>
              <span className="co-code-value">{offer.code}</span>
            </div>
          )}

          {/* CTA */}
          <div className="co-cta">
            <span className="co-cta-text">{ctaText}</span>
            <span className="material-symbols-sharp co-cta-arrow">
              {isRtl ? 'arrow_back' : 'arrow_forward'}
            </span>
          </div>
        </div>

        {/* RIGHT — image
            Using a plain <img> tag instead of next/image fill.
            next/image fill requires a fully established CSS position chain
            (positioned ancestor with explicit px height all the way up),
            which is fragile inside flex/grid layouts.
            A plain <img> with object-fit: cover on the .co-squircle container
            is simpler and works unconditionally. */}
        {offerImage && (
          <div className="co-image-wrap" aria-hidden="true">
            <div className="co-squircle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={offerImage}
                alt=""
                className="co-image"
                loading={offer.isFeatured ? 'eager' : 'lazy'}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expired overlay */}
      {isExpired && (
        <div className="co-expired" aria-label={isRtl ? 'منتهي' : 'Expired'}>
          <span className="material-symbols-sharp">block</span>
          {isRtl ? 'منتهي' : 'Expired'}
        </div>
      )}
    </Link>
  );
}
