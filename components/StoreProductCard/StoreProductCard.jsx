'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import './StoreProductCard.css';

const StoreProductCard = ({ product, storeName: storeNameProp, storeLogo: storeLogoProp }) => {
  const t      = useTranslations('StoreProductCard');
  const locale = useLocale();
  const isRtl  = locale.startsWith('ar');

  const [isClicked,       setIsClicked]       = useState(false);
  const [discountDisplay, setDiscountDisplay] = useState(null);

  const storeName = storeNameProp ?? product?.storeName ?? '';
  const storeLogo = storeLogoProp ?? product?.storeLogo ?? null;

  useEffect(() => {
    if (!product) { setDiscountDisplay(null); return; }
    const { discountValue, discountType } = product;
    if (!discountValue || discountValue <= 0) { setDiscountDisplay(null); return; }
    const v = Math.round(discountValue);
    setDiscountDisplay(
      discountType === 'PERCENTAGE' ? `${v}%` :
      discountType === 'ABSOLUTE'   ? `${v} SAR` : `${v}`
    );
  }, [product]);

  const handleClick = async (e) => {
    e.preventDefault();
    if (isClicked || !product?.productUrl) return;
    setIsClicked(true);

    try {
      await fetch('/api/store-products/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      });
    } catch (err) {
      console.error('Failed to track click:', err);
    }

    window.open(product.productUrl, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e); }
  };

  if (!product) return null;

  return (
    <article
      className="spc-card"
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${product.title || 'Product'}${storeName ? ` — ${storeName}` : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Image area */}
      <div className="spc-image-wrap">
        {discountDisplay && (
          <div className="spc-badge">
            <span className="spc-badge-flame" aria-hidden="true">🔥</span>
            {discountDisplay} {t('off', { default: 'OFF' })}
          </div>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || '/placeholder-product.jpg'}
          alt={product.title || 'Product'}
          className="spc-image"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
        />
      </div>

      {/* Info area */}
      <div className="spc-body">
        <p className="spc-title">
          {product.title || t('untitled', { default: 'Product' })}
        </p>

        <button
          className="spc-cta"
          onClick={handleClick}
          tabIndex={-1}
          aria-hidden="true"
        >
          {t('checkPrice', { default: 'Check price' })}
        </button>
      </div>
    </article>
  );
};

export default StoreProductCard;
