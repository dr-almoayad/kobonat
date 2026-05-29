'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import './StoreProductCard.css';

/**
 * StoreProductCard
 *
 * Props:
 * product          — StoreProduct with originalPrice?, currentPrice?, image, title…
 * voucher          — optional linked Voucher { code, type, discount, discountPercent }
 * otherPromo       — optional linked OtherPromo { discountPercent, bank, paymentMethod… }
 * storeBnplMethods — BNPL providers active for this store
 * storeName        — override store display name
 * storeLogo        — override store logo URL
 */
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
  React.useEffect(() => {
    if (hasValidPrices || !product) { setDiscountDisplay(null); return; }
    const { discountValue, discountType } = product;
    if (!discountValue || discountValue <= 0) { setDiscountDisplay(null); return; }
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

  // Determine discount numbers to injection into strings
  const otherPromoPct = otherPromo?.discountPercent ? Math.round(otherPromo.discountPercent) : null;
  const voucherPct    = voucher?.discountPercent ? Math.round(voucher.discountPercent) : null;

  // Construct precise text layouts based on what offer layer exists
  let ribbonText = '';
  let ribbonType = 'generic'; // 'bank', 'payment', 'code', 'generic'

  if (otherPromo) {
    ribbonType = bankLogo ? 'bank' : paymentLogo ? 'payment' : 'generic';
    if (otherPromoPct) {
      ribbonText = isRtl 
        ? `+ ${otherPromoPct}% خصم إضافي مع ` 
        : `+ ${otherPromoPct}% Extra Discount with `;
    } else {
      ribbonText = isRtl ? `+ خصم إضافي مع ` : `+ Extra Discount with `;
    }
    // Fallback if logo files don't exist but textual name does
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
    // Fallback context for deals or free shipping variants with no explicit code
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
        <div className="spc-image-wrap" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

          {/* Pricing Savings Badge */}
          {savingsPct != null && savingsPct > 0 && (
            <div className="spc-discount-badge">
              {isRtl ? (
                <div className="spc-discount-badge__content">
                  <p className="spc-discount-badge__savingsText">وفر</p>
                  <p className="spc-discount-badge__savingsPct">{`${savingsPct}٪`}</p>
                </div>
              ) : (
                <div className="spc-discount-badge__content">
                  <p className="spc-discount-badge__savingsText">SAVE</p>
                  <p className="spc-discount-badge__savingsPct">{`${savingsPct}%`}</p>
                </div>
              )}
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
            style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
            loading="lazy"
            onError={() => setImgSrc('/placeholder-product.jpg')}
          />

          {/* ── Integrated Promo Ribbon ────────────────────────────────────── */}
          {hasRibbon && (
            <div className={`spc-ribbon${isRtl ? ' spc-ribbon--rtl' : ''}`} aria-hidden="true">
              <div className="spc-ribbon__inner" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                
                {/* Text String Segment */}
                <span className="spc-ribbon__label">{ribbonText}</span>
                
                {/* Conditional Dynamic Inline Brand Logo Segment */}
                {ribbonType === 'bank' && bankLogo && (
                  <span className="spc-ribbon__logo-inline" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Image 
                      src={bankLogo} 
                      unoptimized={true}
                      alt={bankName || ''} 
                      width={75} 
                      height={35} 
                      style={{ objectFit: 'contain', width: 'auto', maxHeight: '18px' }} // Scale slightly to look beautiful inline with text
                    />
                  </span>
                )}
                {ribbonType === 'payment' && paymentLogo && (
                  <span className="spc-ribbon__logo-inline" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Image 
                      src={paymentLogo} 
                      unoptimized={true}
                      alt={paymentName || ''} 
                      width={75} 
                      height={35} 
                      style={{ objectFit: 'contain', width: 'auto', maxHeight: '18px' }}
                    />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Body (Decluttered — Chip Removed) ───────────────────────────── */}
        <div className="spc-body">
          {/* Title */}
          <p className="spc-title">
            {product.title || t('untitled', { default: 'Product' })}
          </p>

          {/* Price Row */}
          {hasValidPrices && (
            <div
              className="spc-prices"
              aria-label={`Price: ${formatSAR(currentPrice)}${hasOriginal ? `, was ${formatSAR(originalPrice)}` : ''}`}
            >
              <span className="spc-price-current">{formatSAR(currentPrice)}</span>
              {hasOriginal && (
                <span className="spc-price-original">{formatSAR(originalPrice)}</span>
              )}
              {savingsPct != null && savingsPct > 0 && (
                <span className="spc-price-savings" aria-hidden="true">
                  {isRtl ? `${savingsPct}٪-` : `-${savingsPct}%`}
                </span>
              )}
            </div>
          )}

          {/* BNPL Installment Terms - Driven by storeBnplMethods */}
          {/* We check if storeBnplMethods exists and has at least one entry */}
          {hasValidPrices && storeBnplMethods?.length > 0 && (
            <div 
              className="spc-bnpl" 
              role="note" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}
            >
              {/* Calculate based on the first available store provider (Tabby/Tamara) */}
              <span className="spc-bnpl__text" style={{ fontSize: '0.85rem', color: '#555' }}>
                {isRtl ? (
                  <>
                    {`أو `}
                    <strong style={{ color: '#000' }}>
                      {formatSAR(currentPrice / (storeBnplMethods[0].installmentCount || 4))}
                    </strong>
                    {`/شهر × ${storeBnplMethods[0].installmentCount || 4} بدون فوائد مع`}
                  </>
                ) : (
                  <>
                    {`Or `}
                    <strong style={{ color: '#000' }}>
                      {formatSAR(currentPrice / (storeBnplMethods[0].installmentCount || 4))}
                    </strong>
                    {`/month × ${storeBnplMethods[0].installmentCount || 4} at 0% interest with`}
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
                  style={{ objectFit: 'contain', display: 'inline-block' }}
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
