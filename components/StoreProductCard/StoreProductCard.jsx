'use client';
import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import './StoreProductCard.css';

/**
 * StoreProductCard
 *
 * Props:
 *   product     — StoreProduct object (required)
 *   voucher     — optional Voucher object { code, type, discount, discountPercent }
 *   otherPromo  — optional OtherPromo object { discountPercent, bank, paymentMethod, type }
 *   storeName   — override store display name
 *   storeLogo   — override store logo URL
 */
const StoreProductCard = ({
  product,
  voucher,
  otherPromo,
  storeName: storeNameProp,
  storeLogo: storeLogoProp,
}) => {
  const t      = useTranslations('StoreProductCard');
  const locale = useLocale();
  const isRtl  = locale.startsWith('ar');

  const [isClicked,       setIsClicked]       = useState(false);
  const [discountDisplay, setDiscountDisplay] = useState(null);

  const storeName = storeNameProp ?? product?.storeName ?? '';

  // ── Ribbon logic ──────────────────────────────────────────────────────────
  const bankLogo     = otherPromo?.bank?.logo          || null;
  const bankName     = otherPromo?.bank?.name          || null;
  const paymentLogo  = otherPromo?.paymentMethod?.logo || null;
  const paymentName  = otherPromo?.paymentMethod?.name || null;
  const hasCode      = !!(voucher?.code);
  const isDeal       = voucher?.type === 'DEAL';
  const isFreeShip   = voucher?.type === 'FREE_SHIPPING';

  // Promo discount label (e.g. "15% OFF", "Buy 2 Get 1")
  const promoPercent = otherPromo?.discountPercent
    ?? voucher?.discountPercent
    ?? null;

  const promoLabel = promoPercent
    ? `${Math.round(promoPercent)}% ${t('off', { default: 'OFF' })}`
    : (voucher?.discount || null);

  // Chip label shown in card body
  const chipLabel = bankName
    || paymentName
    || (hasCode ? voucher.code : null)
    || promoLabel
    || (isRtl ? 'عرض خاص' : 'Special Offer');

  const hasRibbon = !!(otherPromo || voucher);

  // Ribbon icon when no logo present
  const ribbonIcon = hasCode       ? 'confirmation_number'
                   : isFreeShip    ? 'local_shipping'
                   : isDeal        ? 'local_fire_department'
                   : otherPromo    ? 'account_balance'
                   :                 'sell';

  // ── Product discount badge ────────────────────────────────────────────────
  useEffect(() => {
    if (!product) { setDiscountDisplay(null); return; }
    const { discountValue, discountType } = product;
    if (!discountValue || discountValue <= 0) { setDiscountDisplay(null); return; }
    const v = Math.round(discountValue);
    setDiscountDisplay(
      discountType === 'PERCENTAGE' ? `${v}%`       :
      discountType === 'ABSOLUTE'   ? `${v} SAR`    : `${v}`
    );
  }, [product]);

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleClick = async (e) => {
    e.preventDefault();
    if (isClicked || !product?.productUrl) return;
    setIsClicked(true);
    try {
      await fetch('/api/store-products/track', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId: product.id }),
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
      {/* ── Image area ──────────────────────────────────────────────────── */}
      <div className="spc-image-wrap">

        {/* Product discount badge (top corner) */}
        {discountDisplay && (
          <div className="spc-discount-badge">
            <span className="spc-discount-badge__flame" aria-hidden="true">🔥</span>
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

        {/* Promo ribbon (bottom of image) */}
        {hasRibbon && (
          <div
            className={`spc-ribbon${isRtl ? ' spc-ribbon--rtl' : ''}`}
            aria-hidden="true"
          >
            <div className="spc-ribbon__inner">
              {bankLogo ? (
                <span className="spc-ribbon__logo-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bankLogo} alt={bankName || ''} className="spc-ribbon__logo" />
                </span>
              ) : paymentLogo ? (
                <span className="spc-ribbon__logo-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={paymentLogo} alt={paymentName || ''} className="spc-ribbon__logo" />
                </span>
              ) : (
                <span className="material-symbols-sharp spc-ribbon__icon">
                  {ribbonIcon}
                </span>
              )}

              {promoLabel && (
                <span className="spc-ribbon__label">{promoLabel}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="spc-body">
        <p className="spc-title">
          {product.title || t('untitled', { default: 'Product' })}
        </p>

        {/* Bank / promo chip */}
        {hasRibbon && (
          <div className="spc-promo-chip">
            {bankLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={bankLogo} alt="" className="spc-promo-chip__logo" />
            ) : paymentLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={paymentLogo} alt="" className="spc-promo-chip__logo" />
            ) : (
              <span className="material-symbols-sharp spc-promo-chip__icon">
                {ribbonIcon}
              </span>
            )}
            <span className="spc-promo-chip__text">{chipLabel}</span>
          </div>
        )}
      </div>
    </article>
  );
};

export default StoreProductCard;
