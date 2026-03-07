// components/OfferStackBox/OfferStackBox.jsx
// Server-compatible (no 'use client'). Pure display component.
// Receives a pre-built stack object from buildOfferStacks().

import Image from 'next/image';
import Link from 'next/link';
import './OfferStackBox.css';

const TYPE_META = {
  CODE: {
    labelAr: 'كود خصم',
    labelEn: 'Coupon Code',
    icon:    'confirmation_number',
    cls:     'type-code',
  },
  DEAL: {
    labelAr: 'عرض',
    labelEn: 'Deal',
    icon:    'local_fire_department',
    cls:     'type-deal',
  },
  BANK_OFFER: {
    labelAr: 'عرض بنكي',
    labelEn: 'Bank Offer',
    icon:    'account_balance',
    cls:     'type-bank',
  },
};

export default function OfferStackBox({ stack, locale }) {
  const lang     = locale?.split('-')[0] || 'ar';
  const isAr     = lang === 'ar';

  const { store, items, combinedSavingsPercent } = stack;

  const storeHref = `/${locale}/stores/${store.slug}`;

  // Labels
  const savingsLabel  = isAr ? 'ادخر حتى' : 'Save up to';
  const stackLabel    = isAr ? 'عروض قابلة للجمع' : 'Stackable Offers';
  const ctaText       = isAr ? 'احصل على الخصم' : 'Stack & Save';

  return (
    <div className="stack-box">
      {/* ── Header: logo + store name + savings badge ── */}
      <div className="stack-box-header">
        {store.logo ? (
          <Image
            src={store.logo}
            alt={store.name}
            width={36}
            height={36}
            className="stack-store-logo"
            unoptimized
          />
        ) : (
          <div className="stack-store-logo-placeholder">
            <span className="material-symbols-sharp" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>storefront</span>
          </div>
        )}

        <span className="stack-store-name">{store.name}</span>

        {combinedSavingsPercent != null && combinedSavingsPercent > 0 && (
          <span className="stack-savings-badge">
            {isAr ? `وفر ${combinedSavingsPercent}%` : `Save ${combinedSavingsPercent}%`}
          </span>
        )}
      </div>

      {/* ── Sub-label ── */}
      <div className="stack-label">{stackLabel}</div>

      {/* ── Items row ── */}
      <div className="stack-items-row">
        {items.map((item, idx) => {
          const meta = TYPE_META[item.itemType] || TYPE_META.DEAL;
          const typeLabel = isAr ? meta.labelAr : meta.labelEn;

          return (
            <>
              {idx > 0 && (
                <div key={`plus-${idx}`} className="stack-plus">+</div>
              )}
              <div key={item.id} className="stack-item">
                {/* Type badge */}
                <span className={`stack-item-type-badge ${meta.cls}`}>
                  <span className="material-symbols-sharp" style={{ fontSize: '0.65rem' }}>{meta.icon}</span>
                  {typeLabel}
                </span>

                {/* Title */}
                <span className="stack-item-title">{item.title}</span>

                {/* Discount or code */}
                {item.discount && (
                  <span className="stack-item-discount">{item.discount}</span>
                )}
                {item.discountPercent != null && !item.discount && (
                  <span className="stack-item-discount">{item.discountPercent}%</span>
                )}
                {item.code && (
                  <span className="stack-item-code">
                    <span className="material-symbols-sharp" style={{ fontSize: '0.65rem', opacity: 0.7 }}>content_cut</span>
                    {item.code}
                  </span>
                )}
              </div>
            </>
          );
        })}
      </div>

      {/* ── CTA ── */}
      <Link href={storeHref} className="stack-cta">
        <span className="material-symbols-sharp">bolt</span>
        {ctaText}
        <span className="material-symbols-sharp">
          {isAr ? 'chevron_left' : 'chevron_right'}
        </span>
      </Link>
    </div>
  );
}
