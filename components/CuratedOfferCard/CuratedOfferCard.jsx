// components/CuratedOfferCard/CuratedOfferCard.jsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import './CuratedOfferCard.css';

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  CODE:          { icon: 'confirmation_number', en: 'Code',          ar: 'كود',           hue: '#4f46e5' },
  DEAL:          { icon: 'local_offer',         en: 'Deal',          ar: 'عرض',           hue: '#e11d48' },
  PRODUCT:       { icon: 'inventory_2',         en: 'Product',       ar: 'منتج',          hue: '#0284c7' },
  SEASONAL:      { icon: 'celebration',         en: 'Seasonal',      ar: 'موسمي',         hue: '#db2777' },
  FREE_SHIPPING: { icon: 'local_shipping',      en: 'Free Shipping', ar: 'شحن مجاني',    hue: '#059669' },
  CASHBACK:      { icon: 'payments',            en: 'Cashback',      ar: 'استرداد نقدي',  hue: '#0891b2' },
  BUNDLE:        { icon: 'redeem',              en: 'Bundle',        ar: 'باقة',          hue: '#7c3aed' },
  FLASH_SALE:    { icon: 'bolt',               en: 'Flash Sale',    ar: 'تخفيض سريع',   hue: '#ea580c' },
};

export default function CuratedOfferCard({ offer }) {
  const locale = useLocale();
  const lang   = locale.split('-')[0]; 
  const isRtl  = lang === 'ar';

  // ── Data extraction ───────────────────────────────────────────────────────
  const translation = offer.translations?.find(t => t.locale === lang) || offer.translations?.[0] || {};

  const title   = translation.title   || (isRtl ? 'عرض خاص'   : 'Special Offer');
  const ctaText = translation.ctaText || (isRtl ? 'تسوق الآن' : 'SHOP NOW');

  const storeName = offer.store?.translations?.find(t => t.locale === lang)?.name || offer.store?.translations?.[0]?.name || '';
  const storeLogo = offer.store?.bigLogo || null;
  const storeSlug = offer.store?.translations?.find(t => t.locale === lang)?.slug || offer.store?.translations?.[0]?.slug || 'store';

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
      className={`card-wrapper ${isExpired ? 'is-expired' : ''}`}
      aria-label={`${storeName} – ${title}`}
      target={isExternal ? '_blank' : '_self'}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    >
      {/* ── Top: Image Area ── */}
      <div className="card-media">
        {offerImage ? (
          // offerImage is a database-stored URL from arbitrary external domains
          // (S3 buckets, CDNs, partner sites, etc.) that cannot be enumerated
          // in next.config.js remotePatterns. Next.js <Image> would return a
          // 400 for any unlisted domain, breaking all offer images. Plain <img>
          // is the correct choice here — the original eslint-disable comment
          // was a deliberate signal of this constraint.
          // eslint-disable-next-line @next/next/no-img-element
          <Image
            src={offerImage}
            alt={`${storeName} – ${title}`}
            className="card-image"
            loading={offer.isFeatured ? 'eager' : 'lazy'}
            decoding="async"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="card-image-fallback" />
        )}

        {/* Featured Ribbon overlay */}
        {offer.isFeatured && (
          <div className="card-featured-badge">
            <span className="material-symbols-sharp">star</span>
            {isRtl ? 'مميز' : 'Featured'}
          </div>
        )}

        {/* Expired Overlay */}
        {isExpired && (
          <div className="card-expired-overlay">
            <span className="material-symbols-sharp">block</span>
            <span>{isRtl ? 'العرض منتهي' : 'Offer Expired'}</span>
          </div>
        )}
      </div>

      {/* ── Bottom: Content Area ── */}
      <div className="card-content">
        
        {/* Meta Row (Logo + Type Badge) */}
        <div className="card-meta">
          {storeLogo ? (
             <div className="card-logo">
               <Image src={storeLogo} alt={storeName} width={80} height={24} style={{ objectFit: 'contain', objectPosition: isRtl ? 'right' : 'left' }} />
             </div>
          ) : storeName ? (
            <span className="card-store-name">{storeName}</span>
          ) : <span />}

          <span className="card-type-badge" style={{ '--type-color': typeCfg.hue }}>
            <span className="material-symbols-sharp">{typeCfg.icon}</span>
            {badgeLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="card-title">{title}</h3>

        {/* Code Chip & CTA Row */}
        <div className="card-footer">
          {hasCode ? (
            <div className="card-code">
              <span className="material-symbols-sharp">content_copy</span>
              <strong>{offer.code}</strong>
            </div>
          ) : <div />}

          <div className="card-cta">
            <span className="card-cta-text">{ctaText}</span>
            <span className="material-symbols-sharp card-cta-icon">
              {isRtl ? 'arrow_left_alt' : 'arrow_right_alt'}
            </span>
          </div>
        </div>
        
      </div>
    </Link>
  );
}
