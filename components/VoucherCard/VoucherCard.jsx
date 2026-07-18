// components/VoucherCard/VoucherCard.jsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import VoucherModal from '@/components/VoucherModal/VoucherModal';
import './VoucherCard.css';

const VoucherCard = ({ voucher, featured = false, bestDeal = false, expired = false }) => {
  const locale = useLocale();
  const t = useTranslations('VoucherCard');
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLanguage = locale.split('-')[0];
  const isRtl = currentLanguage === 'ar';
  const isFreeShipping = voucher.type === 'FREE_SHIPPING';

  // Extractors
  const getVoucherTitle = () => {
    if (voucher.title) return voucher.title;
    if (voucher.translations?.[0]?.title) return voucher.translations[0].title;
    if (isFreeShipping) return t('labels.freeDelivery');
    if (voucher.type === 'CODE') return t('labels.code');
    if (voucher.type === 'DEAL') return t('labels.deal');
    return t('labels.specialDeal');
  };

  const getVoucherDescription = () => {
    if (voucher.description) return voucher.description;
    if (voucher.translations?.[0]?.description) return voucher.translations[0].description;
    return null;
  };

  const getStoreName = () => {
    if (voucher.store?.name) return voucher.store.name;
    if (voucher.store?.translations?.[0]?.name) return voucher.store.translations[0].name;
    return isRtl ? 'متجر' : 'Store';
  };

  const getStoreSlug = () => {
    if (voucher.store?.slug) return voucher.store.slug;
    if (voucher.store?.translations?.[0]?.slug) return voucher.store.translations[0].slug;
    return 'store';
  };

  const getDiscountText = () => {
    if (voucher.discount) return voucher.discount;
    if (voucher.discountPercent != null) return `${Math.round(voucher.discountPercent)}%`;
    if (isFreeShipping) return isRtl ? 'شحن مجاني' : 'FREE SHIP';
    if (voucher.type === 'DEAL') return isRtl ? 'عرض' : 'DEAL';
    return isRtl ? 'خصم' : 'SALE';
  };

  // Time & Status Data
  const isExpiredByDate = voucher.expiryDate ? new Date(voucher.expiryDate) < new Date() : false;
  const isExpiredCard = expired || isExpiredByDate;
  const isActive = !isExpiredByDate && (!voucher.startDate || new Date(voucher.startDate) <= new Date());
  const timesUsed = voucher.clickCount ?? voucher._count?.clicks ?? 0;

  const getLastUpdatedTime = () => {
    if (!voucher.updatedAt) return null;
    const diffHours = Math.floor((new Date() - new Date(voucher.updatedAt)) / (1000 * 60 * 60));
    if (diffHours < 1) return isRtl ? 'محدث للتو' : 'Updated just now';
    if (diffHours < 24) return isRtl ? `محدث قبل ${diffHours} ساعة` : `Updated ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return isRtl ? 'محدث أمس' : 'Updated yesterday';
    return isRtl ? `محدث قبل ${diffDays} أيام` : `Updated ${diffDays}d ago`;
  };

  // Actions
  const handleActionClick = async (e) => {
    e.stopPropagation(); // Prevents the card's modal from opening
    if (isExpiredCard) return;

    if (voucher.type === 'CODE' && voucher.code) {
      try {
        await navigator.clipboard.writeText(voucher.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }

    const [, countryCode] = locale.split('-');
    await fetch('/api/vouchers/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucherId: voucher.id, countryCode }),
    });

    setTimeout(() => {
      window.open(voucher.landingUrl || voucher.store?.websiteUrl, '_blank');
    }, voucher.type === 'CODE' ? 600 : 0);
  };

  const handleCardClick = () => {
    if (!isExpiredCard) setModalOpen(true);
  };

  const storeName = getStoreName();
  const storeSlug = getStoreSlug();
  const title = getVoucherTitle();
  const description = getVoucherDescription();
  const discountText = getDiscountText();
  const lastUpdated = getLastUpdatedTime();

  return (
    <>
      <article
        className={[
          'vc-modern-card',
          isExpiredCard ? 'is-expired' : '',
          bestDeal ? 'is-best-deal' : '',
          isFreeShipping ? 'is-free-shipping' : ''
        ].filter(Boolean).join(' ')}
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={handleCardClick}
        role="button"
        tabIndex={isExpiredCard ? -1 : 0}
        aria-disabled={isExpiredCard}
      >
        {/* ── TOP ROW ── */}
        <div className="vc-top-row">
          
          {/* 1. Logo (Left) */}
          <div className="vc-col-logo">
            {voucher.store && (
              <Link href={`/${locale}/stores/${storeSlug}`} onClick={(e) => e.stopPropagation()}>
                <img
                  src={voucher.store.logo || '/placeholder_store.png'}
                  alt={storeName}
                  className="vc-store-logo"
                  loading="lazy"
                />
              </Link>
            )}
          </div>

          {/* 2. Unframed Discount Value (Center) */}
          <div className="vc-col-center">
            {isFreeShipping ? (
               <span className="vc-bg-graphic material-symbols-sharp" aria-hidden="true">local_shipping</span>
            ) : (
               <span className="vc-bg-graphic" aria-hidden="true">%</span>
            )}
            <span className="vc-discount-value">{discountText}</span>
          </div>

          {/* 3. Promo Code + CTA (Right) */}
          <div className="vc-col-action">
            {voucher.type === 'CODE' && voucher.code && (
              <div className="vc-promo-code-box">
                {voucher.code}
              </div>
            )}
            <button
              className={`vc-cta-btn ${copied ? 'is-copied' : ''}`}
              onClick={handleActionClick}
              disabled={isExpiredCard}
            >
              {voucher.type === 'CODE' ? (
                copied ? (
                  <><span className="material-symbols-sharp">check</span>{isRtl ? 'تم النسخ' : 'Copied'}</>
                ) : (
                  <><span className="material-symbols-sharp">content_copy</span>{isRtl ? 'نسخ' : 'Copy'}</>
                )
              ) : (
                <><span className="material-symbols-sharp">arrow_forward</span>{isRtl ? 'تفعيل' : 'Get Deal'}</>
              )}
            </button>
          </div>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div className="vc-bottom-row">
          <div className="vc-info-block">
             <h3 className="vc-offer-title">{title}</h3>
             {description && <p className="vc-offer-desc">{description}</p>}
          </div>

          <div className="vc-meta-bar">
            <div className="vc-badges">
              {isActive && (
                <span className="vc-badge vc-badge-active">
                  <span className="material-symbols-sharp">check_circle</span>
                  {t('badges.active')}
                </span>
              )}
              {voucher.isVerified && (
                <span className="vc-badge vc-badge-verified">
                  <span className="material-symbols-sharp">verified</span>
                  {t('badges.verified')}
                </span>
              )}
            </div>

            <div className="vc-stats">
              {timesUsed > 0 && <span>{timesUsed.toLocaleString()} {t('meta.timesUsed')}</span>}
              {timesUsed > 0 && lastUpdated && <span className="vc-dot">·</span>}
              {lastUpdated && <span>{lastUpdated}</span>}
            </div>
          </div>
        </div>
      </article>

      {/* ── MODAL ── */}
      {mounted && !isExpiredCard && (
        <VoucherModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          voucher={voucher}
          store={voucher.store}
          locale={locale}
        />
      )}
    </>
  );
};

export default VoucherCard;
