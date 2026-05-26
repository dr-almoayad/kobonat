'use client';
import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import './StoreProductCard.css';

/**
 * StoreProductCard
 *
 * Props:
 *   product     — StoreProduct object (required)
 *                 Expects: originalPrice?, currentPrice?, discountValue?, discountType?,
 *                          image, title, description, productUrl, id
 *   voucher     — optional Voucher object { code, type, discount, discountPercent }
 *   otherPromo  — optional OtherPromo object {
 *                   discountPercent, bank, paymentMethod, type,
 *                   installmentMonths?,   // months for BNPL (e.g. 4)
 *                   card?: { maxInstallmentMonths? }
 *                 }
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

  const [isClicked, setIsClicked] = useState(false);

  const storeName = storeNameProp ?? product?.storeName ?? '';

  // ── Price helpers ─────────────────────────────────────────────────────────
  const currentPrice  = product?.currentPrice  ?? null;
  const originalPrice = product?.originalPrice ?? null;

  // Only show original price when it's strictly higher than current
  const hasValidPrices = currentPrice != null && currentPrice > 0;
  const hasOriginal    = originalPrice != null && originalPrice > currentPrice;

  const savingsPct = hasValidPrices && hasOriginal
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : null;

  /** Format a SAR price — Arabic locale uses Eastern Arabic numerals natively */
  function formatSAR(amount) {
    if (amount == null) return '';
    const formatted = amount.toLocaleString(isRtl ? 'ar-SA' : 'en-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isRtl ? `${formatted} ر.س` : `SAR ${formatted}`;
  }

  // ── BNPL calculation ───────────────────────────────────────────────────────
  // Prefer explicit installmentMonths on the promo, fall back to card's max
  const bnplMonths =
    otherPromo?.installmentMonths ||
    otherPromo?.card?.maxInstallmentMonths ||
    null;

  const isBnplPromo = otherPromo?.paymentMethod?.isBnpl || false;
  const showBnpl    = bnplMonths && bnplMonths > 1 && hasValidPrices;
  const monthlyAmt  = showBnpl ? currentPrice / bnplMonths : null;

  // BNPL provider identity for logo / name
  const bnplLogo  = otherPromo?.paymentMethod?.logo || otherPromo?.bank?.logo || null;
  const bnplName  = otherPromo?.paymentMethod?.name || otherPromo?.bank?.name || null;

  // ── Discount badge (legacy — shown when no explicit prices) ───────────────
  const [discountDisplay, setDiscountDisplay] = useState(null);

  useEffect(() => {
    // Only use the old discountValue badge when explicit prices are absent
    if (hasValidPrices) { setDiscountDisplay(null); return; }
    if (!product)       { setDiscountDisplay(null); return; }
    const { discountValue, discountType } = product;
    if (!discountValue || discountValue <= 0) { setDiscountDisplay(null); return; }
    const v = Math.round(discountValue);
    setDiscountDisplay(
      discountType === 'PERCENTAGE' ? `${v}%`    :
      discountType === 'ABSOLUTE'   ? `${v} SAR` : `${v}`
    );
  }, [product, hasValidPrices]);

  // ── Ribbon logic ──────────────────────────────────────────────────────────
  const bankLogo    = otherPromo?.bank?.logo          || null;
  const bankName    = otherPromo?.bank?.name          || null;
  const paymentLogo = otherPromo?.paymentMethod?.logo || null;
  const paymentName = otherPromo?.paymentMethod?.name || null;
  const hasCode     = !!(voucher?.code);
  const isDeal      = voucher?.type === 'DEAL';
  const isFreeShip  = voucher?.type === 'FREE_SHIPPING';

  const promoPercent = otherPromo?.discountPercent ?? voucher?.discountPercent ?? null;
  const promoLabel   = promoPercent
    ? `${Math.round(promoPercent)}% ${t('off', { default: 'OFF' })}`
    : (voucher?.discount || null);

  const chipLabel = bankName
    || paymentName
    || (hasCode ? voucher.code : null)
    || promoLabel
    || (isRtl ? 'عرض خاص' : 'Special Offer');

  const hasRibbon = !!(otherPromo || voucher);

  const ribbonIcon = hasCode    ? 'confirmation_number'
    : isFreeShip               ? 'local_shipping'
    : isDeal                   ? 'local_fire_department'
    : otherPromo               ? 'account_balance'
    :                            'sell';

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

        {/* Savings % badge — derived from prices (preferred) */}
        {savingsPct != null && savingsPct > 0 && (
          <div className="spc-discount-badge">
            <span className="spc-discount-badge__flame" aria-hidden="true">🔥</span>
            {isRtl ? `${savingsPct}٪ خصم` : `-${savingsPct}% OFF`}
          </div>
        )}

        {/* Legacy discount badge — shown only when no explicit prices */}
        {!hasValidPrices && discountDisplay && (
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

        {/* Title */}
        <p className="spc-title">
          {product.title || t('untitled', { default: 'Product' })}
        </p>

        {/* ── Price block ─────────────────────────────────────────────── */}
        {hasValidPrices && (
          <div className="spc-prices" aria-label={`Price: ${formatSAR(currentPrice)}${hasOriginal ? `, was ${formatSAR(originalPrice)}` : ''}`}>
            <span className="spc-price-current">
              {formatSAR(currentPrice)}
            </span>
            {hasOriginal && (
              <span className="spc-price-original" aria-label={`Was ${formatSAR(originalPrice)}`}>
                {formatSAR(originalPrice)}
              </span>
            )}
            {savingsPct != null && savingsPct > 0 && (
              <span className="spc-price-savings" aria-hidden="true">
                {isRtl ? `${savingsPct}٪-` : `-${savingsPct}%`}
              </span>
            )}
          </div>
        )}

        {/* ── BNPL installment line ────────────────────────────────────── */}
        {showBnpl && monthlyAmt != null && (
          <div className="spc-bnpl" role="note" aria-label={`Pay in installments`}>
            {bnplLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={bnplLogo}
                alt={bnplName || 'BNPL'}
                className="spc-bnpl__logo"
              />
            ) : (
              <span className="material-symbols-sharp spc-bnpl__icon">
                credit_score
              </span>
            )}
            <span className="spc-bnpl__text">
              {isRtl ? (
                <>
                  أو ادفع{' '}
                  <strong>{formatSAR(monthlyAmt)}/شهر</strong>
                  {` × ${bnplMonths} بدون فوائد`}
                </>
              ) : (
                <>
                  {'Or pay '}
                  <strong>{formatSAR(monthlyAmt)}/month</strong>
                  {` × ${bnplMonths} at 0% interest`}
                </>
              )}
            </span>
          </div>
        )}

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
