// components/StoreProductCard/StoreProductCard.jsx
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

  // Multi-store mode: fall back to store info embedded on the product object.
  // This is set by HomeFeaturedProductsSection when products come from multiple stores.
  const storeName = storeNameProp ?? product?.storeName ?? '';
  const storeLogo = storeLogoProp ?? product?.storeLogo ?? null;

  // ── Discount display ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!product) { setDiscountDisplay(null); return; }
    const { discountValue, discountType } = product;
    if (!discountValue || discountValue <= 0) { setDiscountDisplay(null); return; }
    const v = Math.round(discountValue);
    setDiscountDisplay(
      discountType === 'PERCENTAGE' ? `${v}%`      :
      discountType === 'ABSOLUTE'   ? `${v} SAR`   : `${v}`
    );
  }, [product]);

  // ── Click handler — tracks + opens product URL ────────────────────────────
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
      // Non-fatal — tracking failure shouldn't block navigation
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
      className="store-product-card"
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${product.title || 'Product'}${storeName ? ` - ${storeName}` : ''}`}
    >
      {/* ── Image section ─────────────────────────────────────────────── */}
      <div className="product-image-wrapper">

        {/* Store badge — top corner */}
        {storeLogo && (
          <div className="store-badge">
            <Image
              src={storeLogo}
              alt={storeName || 'Store'}
              width={80}
              height={24}
              className="store-logo-mini"
              unoptimized
            />
          </div>
        )}

        {/* Product image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || '/placeholder-product.jpg'}
          alt={product.title || 'Product'}
          className="product-image"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
        />

        {/* Discount ribbon — bottom */}
        {discountDisplay && (
          <div
            className="discount-badge"
            aria-label={`${t('discount', { default: 'Discount' })} ${discountDisplay}`}
          >
            {t('off', { default: 'OFF' })} {discountDisplay}
          </div>
        )}
      </div>

      {/* ── Info section ──────────────────────────────────────────────── */}
      <div className="product-info">
        <h3 className="product-title">
          {product.title || t('untitled', { default: 'Product' })}
        </h3>

        {storeName && (
          <p className="product-store">
            {t('soldBy', { default: 'Sold by' })} {storeName}
          </p>
        )}

        {discountDisplay && (
          <div className="savings-text">
            <span className="material-symbols-sharp" aria-hidden="true">local_offer</span>
            <h6>
              {t('save', { default: 'Save' })} {discountDisplay}
            </h6>
            <span className="material-symbols-sharp" aria-hidden="true">
              {isRtl ? 'arrow_back' : 'arrow_forward'}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};

export default StoreProductCard;
