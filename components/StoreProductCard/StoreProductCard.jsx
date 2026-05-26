'use client';
import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import './StoreProductCard.css';

/**
 * Formats a number as SAR currency (Riyal).
 */
function formatSAR(amount, isRtl) {
  if (amount == null) return '';
  const formatted = amount.toLocaleString(isRtl ? 'ar-SA' : 'en-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isRtl ? `${formatted} ر.س` : `${formatted} SAR`;
}

const StoreProductCard = ({
  product,
  voucher,
  otherPromo,
  storeName: storeNameProp,
  storeLogo: storeLogoProp,
}) => {
  const locale = useLocale();
  const isRtl = locale?.startsWith('ar') ?? false;
  const [isClicked, setIsClicked] = useState(false);

  // Extract store info
  const storeName = storeNameProp ?? product?.storeName ?? '';
  const storeLogo = storeLogoProp ?? product?.storeLogo ?? null;

  // Prices
  const currentPrice = product?.currentPrice ?? null;
  const originalPrice = product?.originalPrice ?? null;

  // Determine discount percent – from price comparison first, else from voucher/promo
  let discountPercent = null;
  if (currentPrice != null && originalPrice != null && originalPrice > 0 && currentPrice < originalPrice) {
    discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  } else if (voucher?.discountPercent != null) {
    discountPercent = Math.round(voucher.discountPercent);
  } else if (otherPromo?.discountPercent != null) {
    discountPercent = Math.round(otherPromo.discountPercent);
  }

  // Always show both prices if available
  const showPrices = currentPrice != null;
  const showOriginal = originalPrice != null && originalPrice > 0;

  // Ribbon (promo chip) data
  const bankLogo = otherPromo?.bank?.logo || null;
  const bankName = otherPromo?.bank?.name || null;
  const paymentLogo = otherPromo?.paymentMethod?.logo || null;
  const paymentName = otherPromo?.paymentMethod?.name || null;
  const hasCode = !!voucher?.code;
  const isDeal = voucher?.type === 'DEAL';
  const isFreeShip = voucher?.type === 'FREE_SHIPPING';

  const promoPercent = otherPromo?.discountPercent ?? voucher?.discountPercent ?? null;
  const promoLabel = promoPercent
    ? `${Math.round(promoPercent)}% OFF`
    : (voucher?.discount || null);

  const chipLabel = bankName
    || paymentName
    || (hasCode ? voucher.code : null)
    || promoLabel
    || (isRtl ? 'عرض خاص' : 'Special Offer');

  const hasRibbon = !!(otherPromo || voucher || promoLabel);
  const ribbonIcon = hasCode ? 'confirmation_number'
    : isFreeShip ? 'local_shipping'
    : isDeal ? 'local_fire_department'
    : otherPromo ? 'account_balance'
    : 'sell';

  // BNPL (if available)
  const bnplMonths = otherPromo?.installmentMonths || otherPromo?.card?.maxInstallmentMonths || null;
  const showBnpl = bnplMonths && bnplMonths > 1 && showPrices;
  const monthlyAmt = showBnpl ? currentPrice / bnplMonths : null;
  const bnplLogo = otherPromo?.paymentMethod?.logo || otherPromo?.bank?.logo || null;
  const bnplName = otherPromo?.paymentMethod?.name || otherPromo?.bank?.name || null;

  // Legacy discount display (fallback when no prices)
  const [legacyDiscount, setLegacyDiscount] = useState(null);
  useEffect(() => {
    if (showPrices) {
      setLegacyDiscount(null);
      return;
    }
    const { discountValue, discountType } = product || {};
    if (!discountValue || discountValue <= 0) {
      setLegacyDiscount(null);
      return;
    }
    const v = Math.round(discountValue);
    setLegacyDiscount(
      discountType === 'PERCENTAGE' ? `${v}%` : (discountType === 'ABSOLUTE' ? `${v} SAR` : `${v}`)
    );
  }, [product, showPrices]);

  // Click tracking
  const handleClick = async (e) => {
    e.preventDefault();
    if (isClicked || !product?.productUrl) return;
    setIsClicked(true);
    try {
      await fetch('/api/store-products/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
    } catch (err) {
      console.error('Failed to track click:', err);
    }
    window.open(product.productUrl, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
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
        {/* Discount badge (percentage or legacy) */}
        {discountPercent != null && discountPercent > 0 && (
          <div className="spc-discount-badge">
            {isRtl ? `${discountPercent}% خصم` : `${discountPercent}% OFF`}
          </div>
        )}
        {legacyDiscount && !discountPercent && (
          <div className="spc-discount-badge">
            {legacyDiscount} {isRtl ? 'خصم' : 'OFF'}
          </div>
        )}

        {/* Product image */}
        <img
          src={product.image || '/placeholder-product.jpg'}
          alt={product.title || 'Product'}
          className="spc-image"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
        />

        {/* Ribbon (promo info) */}
        {hasRibbon && (
          <div className="spc-ribbon">
            <div className="spc-ribbon__inner">
              {bankLogo ? (
                <img src={bankLogo} alt="" className="spc-ribbon__logo" />
              ) : paymentLogo ? (
                <img src={paymentLogo} alt="" className="spc-ribbon__logo" />
              ) : (
                <span className="material-symbols-sharp spc-ribbon__icon">{ribbonIcon}</span>
              )}
              <span className="spc-ribbon__label">{chipLabel}</span>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="spc-body">
        {/* Title */}
        <h3 className="spc-title">{product.title || (isRtl ? 'منتج' : 'Product')}</h3>

        {/* Prices – always shown if available */}
        {showPrices && (
          <div className="spc-price-row">
            <span className="spc-current-price">{formatSAR(currentPrice, isRtl)}</span>
            {showOriginal && originalPrice > currentPrice && (
              <span className="spc-original-price">{formatSAR(originalPrice, isRtl)}</span>
            )}
            {discountPercent != null && discountPercent > 0 && (
              <span className="spc-savings-chip">
                {isRtl ? `وفر ${discountPercent}%` : `Save ${discountPercent}%`}
              </span>
            )}
          </div>
        )}

        {/* BNPL (if applicable) */}
        {showBnpl && monthlyAmt != null && (
          <div className="spc-bnpl">
            {bnplLogo ? (
              <img src={bnplLogo} alt="" className="spc-bnpl__logo" />
            ) : (
              <span className="material-symbols-sharp spc-bnpl__icon">credit_score</span>
            )}
            <span className="spc-bnpl__text">
              {isRtl ? (
                <>أو ادفع <strong>{formatSAR(monthlyAmt, isRtl)}/شهر</strong> × {bnplMonths} بدون فوائد</>
              ) : (
                <>Or pay <strong>{formatSAR(monthlyAmt, isRtl)}/month</strong> × {bnplMonths} at 0% interest</>
              )}
            </span>
          </div>
        )}

        {/* Promo chip (bank/payment) – only if not already shown in ribbon? It's fine to duplicate as minimal info */}
        {hasRibbon && (bankName || paymentName || hasCode) && (
          <div className="spc-promo-chip">
            {bankLogo ? (
              <img src={bankLogo} alt="" className="spc-promo-chip__logo" />
            ) : paymentLogo ? (
              <img src={paymentLogo} alt="" className="spc-promo-chip__logo" />
            ) : (
              <span className="material-symbols-sharp spc-promo-chip__icon">{ribbonIcon}</span>
            )}
            <span className="spc-promo-chip__text">{chipLabel}</span>
          </div>
        )}
      </div>
    </article>
  );
};

export default StoreProductCard;
