'use client';
// components/StoreDiscountCard/StoreDiscountCard.jsx

import Link from 'next/link';
import './StoreDiscountCard.css';

export default function StoreDiscountCard({ store, locale }) {
  const storeUrl = store.ctaUrl || `/${locale}/stores/${store.slug}`;
  const isExternal = store.ctaUrl?.startsWith('http');

  return (
    <Link
      href={storeUrl}
      target={isExternal ? '_blank' : '_self'}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="sdc"
    >
      {/* Logo */}
      <div className="sdc-logo">
        {store.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logo} alt={store.name} />
        ) : (
          <div className="sdc-logo-fallback">
            {store.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="sdc-info">
        <div className="sdc-name-row">
          <span className="sdc-name">{store.name}</span>
          <svg className="sdc-ext-icon" viewBox="0 0 12 12" fill="none">
            <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="sdc-discount">
          {store.discount}
        </div>

        {store.previousDiscount && (
          <div className="sdc-was">was {store.previousDiscount}</div>
        )}

        {store.isPersonalized && (
          <div className="sdc-badge">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="#470ae2">
              <path d="M6 1l1.4 2.8L11 4.3l-2.5 2.4.6 3.4L6 8.6l-3.1 1.5.6-3.4L1 4.3l3.6-.5L6 1z"/>
            </svg>
            <span>Just for you</span>
          </div>
        )}
      </div>
    </Link>
  );
}
