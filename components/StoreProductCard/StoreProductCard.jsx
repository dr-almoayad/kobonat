'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import './StoreProductCard.css';

const StoreProductCard = ({
  product,
  voucher,
  otherPromo,
  storeBnplMethods = [],
  storeName: storeNameProp,
  storeLogo: storeLogoProp,
}) => {
  const t      = useTranslations('StoreProductCard');
  const locale = useLocale();
  const isRtl  = locale.startsWith('ar');

  const [isClicked, setIsClicked] = useState(false);
  const [imgSrc, setImgSrc] = useState(product?.image || '/placeholder-product.jpg');

  const storeName = storeNameProp ?? product?.storeName ?? '';

  // ── Price Helpers ─────────────────────────────────────────────────────────
  const currentPrice  = product?.currentPrice  ?? null;
  const originalPrice = product?.originalPrice ?? null;
  const hasValidPrices = currentPrice != null && currentPrice > 0;
  const hasOriginal    = originalPrice != null && originalPrice > currentPrice;

  const savingsPct = hasValidPrices && hasOriginal
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : null;

  function formatSAR(amount) {
    if (amount == null) return '';
    const n = amount.toLocaleString(isRtl ? 'ar-SA' : 'en-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isRtl ? `${n} ر.س` : `SAR ${n}`;
  }

  // ── BNPL (Tabby / Tamara) ──────────────────────────────────────────────────
  const activeBnpl = storeBnplMethods?.[0] ?? null;
  const bnplCount  = activeBnpl?.installmentCount ?? 4;
  const showBnpl   = hasValidPrices && activeBnpl != null;
  const monthlyAmt = showBnpl ? currentPrice / bnplCount : null;

  // ── Legacy Discount Badge ─────────────────────────────────────────────────
  const [discountDisplay, setDiscountDisplay] = useState(null);
  useEffect(() => {
    if (hasValidPrices || !product) {
      setDiscountDisplay(null);
      return;
    }
    const { discountValue, discountType } = product;
    if (!discountValue || discountValue <= 0) {
      setDiscountDisplay(null);
      return;
    }
    const v = Math.round(discountValue);
    setDiscountDisplay(
      discountType === 'PERCENTAGE' ? `${v}%`    :
      discountType === 'ABSOLUTE'   ? `${v} SAR` : `${v}`
    );
  }, [product, hasValidPrices]);

  // ── Combined Ribbon Logic ──────────────────────────────────────────────────
  const hasRibbon = !!(otherPromo || voucher);
  
  const bankLogo    = otherPromo?.bank?.logo          || null;
  const bankName    = otherPromo?.bank?.name          || null;
  const paymentLogo = otherPromo?.paymentMethod?.logo || null;
  const paymentName = otherPromo?.paymentMethod?.name || null;
  const hasCode     = !!(voucher?.code);

  const otherPromoPct = otherPromo?.discountPercent ? Math.round(otherPromo.discountPercent) : null;
  const voucherPct    = voucher?.discountPercent ? Math.round(voucher.discountPercent) : null;

  let ribbonText = '';
  let ribbonType = 'generic';

  if (otherPromo) {
    ribbonType = bankLogo ? 'bank' : paymentLogo ? 'payment' : 'generic';
    if (otherPromoPct) {
      ribbonText = isRtl 
        ? `+ ${otherPromoPct}% خصم إضافي مع ` 
        : `+ ${otherPromoPct}% Extra Discount with `;
    } else {
      ribbonText = isRtl ? `+ خصم إضافي مع ` : `+ Extra Discount with `;
    }
    if (!bankLogo && !paymentLogo) {
      ribbonText += (bankName || paymentName || '');
    }
  } else if (hasCode) {
    ribbonType = 'code';
    if (voucherPct) {
      ribbonText = isRtl 
        ? `+ كود خصم إضافي ${voucherPct}% : ${voucher.code}` 
        : `+ Extra Discount Code ${voucherPct}% : ${voucher.code}`;
    } else {
      ribbonText = isRtl 
        ? `+ كود خصم إضافي : ${voucher.code}` 
        : `+ Extra Discount Code : ${voucher.code}`;
    }
  } else if (voucher) {
    ribbonText = voucher.discount || (isRtl ? 'عرض خاص' : 'Special Offer');
  }

  const handleClick = async (e) => {
    if (isClicked || !product?.productUrl) return;
    setIsClicked(true);
    try {
      fetch('/api/store-products/track', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId: product.id }),
        keepalive: true,
      });
    } catch (err) {
      console.error('Failed to track click:', err);
    }
  };

  if (!product) return null;

  return (
    <a 
      href={product.productUrl || '#'} 
      target="_blank" 
      rel="noopener noreferrer"
      className="spc-card-link"
      onClick={handleClick}
      aria-label={`${product.title || 'Product'}${storeName ? ` — ${storeName}` : ''}`}
      style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
    >
      <article className="spc-card" dir={isRtl ? 'rtl' : 'ltr'}>
        
        {/* ── Image Area ──────────────────────────────────────────────────── */}
        <div className="spc-image-wrap">
          {/* Pricing Savings Badge (modern pill) */}
          {savingsPct != null && savingsPct > 0 && (
            <div className="spc-discount-badge">
              <div className="spc-discount-badge__content">
                <span className="spc-discount-badge__savingsPct">
                  {isRtl ? `${savingsPct}٪` : `${savingsPct}%`}
                </span>
                <span className="spc-discount-badge__savingsText">
                  {isRtl ? 'خصم' : 'OFF'}
                </span>
              </div>
            </div>
          )}

          {/* Main Product Thumbnail */}
          <Image
            src={imgSrc}
            unoptimized={true}
            alt={product.title || 'Product'}
            width={205}
            height={205}
            className="spc-image"
            loading="lazy"
            onError={() => setImgSrc('/placeholder-product.jpg')}
          />

          {/* ── Integrated Promo Ribbon (modern pill) ────────────────────── */}
          {hasRibbon && (
            <div className={`spc-ribbon${isRtl ? ' spc-ribbon--rtl' : ''}`} aria-hidden="true">
              <span className="spc-ribbon__label">{ribbonText}</span>
              {ribbonType === 'bank' && bankLogo && (
                <span className="spc-ribbon__logo-inline">
                  <Image 
                    src={bankLogo} 
                    unoptimized={true}
                    alt={bankName || ''} 
                    width={75} 
                    height={35} 
                    style={{ objectFit: 'contain', maxHeight: '18px', width: 'auto' }}
                  />
                </span>
              )}
              {ribbonType === 'payment' && paymentLogo && (
                <span className="spc-ribbon__logo-inline">
                  <Image 
                    src={paymentLogo} 
                    unoptimized={true}
                    alt={paymentName || ''} 
                    width={75} 
                    height={35} 
                    style={{ objectFit: 'contain', maxHeight: '18px', width: 'auto' }}
                  />
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="spc-body">
          <p className="spc-title">
            {product.title || t('untitled', { default: 'Product' })}
          </p>

          {hasValidPrices && (
            <div className="spc-prices">
              <span className="spc-price-current">{formatSAR(currentPrice)}</span>
              {hasOriginal && (
                <span className="spc-price-original">{formatSAR(originalPrice)}</span>
              )}
              {savingsPct != null && savingsPct > 0 && (
                <span className="spc-price-savings" aria-hidden="true">
                  {isRtl ? `-${savingsPct}%` : `-${savingsPct}%`}
                </span>
              )}
            </div>
          )}

          {hasValidPrices && storeBnplMethods?.length > 0 && (
            <div className="spc-bnpl">
              <span className="spc-bnpl__text">
                {isRtl ? (
                  <>
                    أو <strong>{formatSAR(currentPrice / (storeBnplMethods[0].installmentCount || 4))}</strong>
                    /شهر × {storeBnplMethods[0].installmentCount || 4} بدون فوائد مع
                  </>
                ) : (
                  <>
                    Or <strong>{formatSAR(currentPrice / (storeBnplMethods[0].installmentCount || 4))}</strong>
                    /month × {storeBnplMethods[0].installmentCount || 4} at 0% interest with
                  </>
                )}
              </span>
              {storeBnplMethods[0].logo ? (
                <Image
                  src={storeBnplMethods[0].logo}
                  unoptimized={true}
                  alt={storeBnplMethods[0].name || 'BNPL Provider'}
                  width={60}
                  height={23}
                  className="spc-bnpl__logo"
                />
              ) : (
                <strong className="spc-bnpl__fallback-name">{storeBnplMethods[0].name}</strong>
              )}
            </div>
          )}
        </div>
      </article>
    </a>
  );
};

export default StoreProductCard;
