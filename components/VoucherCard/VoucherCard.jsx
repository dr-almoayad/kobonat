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
  const isMobileRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const check = () => { isMobileRef.current = window.innerWidth <= 640; };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const currentLanguage = locale.split('-')[0];
  const isRtl = currentLanguage === 'ar';

  // ── Text extractors (unchanged) ─────────────────────────────────
  const getVoucherTitle = () => {
    if (voucher.title) return voucher.title;
    if (voucher.translations?.[0]?.title) return voucher.translations[0].title;
    if (voucher.type === 'CODE') return t('labels.code');
    if (voucher.type === 'DEAL') return t('labels.deal');
    if (voucher.type === 'FREE_SHIPPING') return t('labels.freeDelivery');
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
    if (voucher.type === 'FREE_SHIPPING') return isRtl ? 'شحن\nمجاني' : 'FREE\nSHIP';
    if (voucher.type === 'DEAL') return isRtl ? 'عرض' : 'DEAL';
    return isRtl ? 'خصم' : 'SALE';
  };

  // Date helpers
  const isExpiredByDate = voucher.expiryDate ? new Date(voucher.expiryDate) < new Date() : false;
  const isExpiredCard = expired || isExpiredByDate; // ✅ use prop or date check

  const getDaysRemaining = () => {
    if (!voucher.expiryDate || isExpiredByDate) return null;
    return Math.ceil((new Date(voucher.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  };
  const isExpiringSoon = (() => {
    const d = getDaysRemaining();
    return d !== null && d <= 3;
  })();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(
      isRtl ? 'ar-SA' : 'en-US',
      { month: 'short', day: 'numeric', year: 'numeric' }
    );
  };

  const getLastUpdatedTime = () => {
    if (!voucher.updatedAt) return null;
    const diffHours = Math.floor((new Date() - new Date(voucher.updatedAt)) / (1000 * 60 * 60));
    if (diffHours < 1)  return isRtl ? 'محدث للتو'       : 'Updated just now';
    if (diffHours < 24) return isRtl ? `محدث قبل ${diffHours} ساعة` : `Updated ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return isRtl ? 'محدث أمس'        : 'Updated yesterday';
    if (diffDays < 7)   return isRtl ? `محدث قبل ${diffDays} أيام` : `Updated ${diffDays}d ago`;
    const w = Math.floor(diffDays / 7);
    return isRtl ? `محدث قبل ${w} ${w === 1 ? 'أسبوع' : 'أسابيع'}` : `Updated ${w}w ago`;
  };

  const getRelativeTime = (date) => {
    if (!date) return null;
    const diffMins = Math.floor((new Date() - new Date(date)) / (1000 * 60));
    if (diffMins < 1)  return isRtl ? 'الآن'                  : 'just now';
    if (diffMins < 60) return isRtl ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return isRtl ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    return isRtl ? `منذ ${Math.floor(diffHours / 24)} يوم` : `${Math.floor(diffHours / 24)}d ago`;
  };

  const getLastUsedTime = () => {
    if (voucher.recentClicks?.length) return getRelativeTime(voucher.recentClicks[0].clickedAt);
    if (voucher.lastUsedAt) return getRelativeTime(voucher.lastUsedAt);
    return null;
  };

  const isActive   = !isExpiredByDate && (!voucher.startDate || new Date(voucher.startDate) <= new Date());
  const timesUsed  = voucher.clickCount ?? voucher._count?.clicks ?? 0;
  const storeName  = getStoreName();
  const storeSlug  = getStoreSlug();
  const title      = getVoucherTitle();
  const description = getVoucherDescription();
  const lastUpdated = getLastUpdatedTime();
  const lastUsed   = getLastUsedTime();
  const daysRemaining = getDaysRemaining();
  const discountText  = getDiscountText();

  // ── Handlers ─────────────────────────────────────────────────────
  const handleCodeCopy = async (e) => {
    e?.stopPropagation();
    if (isExpiredCard || !voucher.code) return;
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      const [, countryCode] = locale.split('-');
      await fetch('/api/vouchers/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherId: voucher.id, countryCode }),
      });
      setTimeout(() => { window.open(voucher.landingUrl || voucher.store?.websiteUrl, '_blank'); }, 600);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDealActivate = async (e) => {
    e?.stopPropagation();
    if (isExpiredCard) return;
    const [, countryCode] = locale.split('-');
    await fetch('/api/vouchers/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucherId: voucher.id, countryCode }),
    });
    window.open(voucher.landingUrl || voucher.store?.websiteUrl, '_blank');
  };

  const handleDetailsClick = (e) => {
    e?.stopPropagation();
    if (isExpiredCard) return;
    setModalOpen(true);
  };

  const handleCardClick = () => {
    if (isExpiredCard) return;
    if (isMobileRef.current) setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  // ── Render card ─────────────────────────────────────────────────
  return (
    <>
      <div
        className={[
          'vc-card',
          isExpiredCard ? 'vc-expired'      : '',
          featured      ? 'vc-featured'     : '',
          bestDeal      ? 'vc-card--best-deal' : '',
        ].filter(Boolean).join(' ')}
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={handleCardClick}
        role="button"
        tabIndex={isExpiredCard ? -1 : 0}
        onKeyDown={(e) => { if (!isExpiredCard && (e.key === 'Enter' || e.key === ' ')) handleCardClick(); }}
        aria-label={title}
        aria-disabled={isExpiredCard}
      >
        {/* Ribbons – unchanged */}
        {featured && !bestDeal && (
          <div className="vc-ribbon">
            <span className="material-symbols-sharp">star</span>
            {isRtl ? 'مميز' : 'Featured'}
          </div>
        )}
        {bestDeal && (
          <div className="vc-ribbon vc-ribbon--best">
            <span className="material-symbols-sharp">bolt</span>
            {isRtl ? 'أفضل عرض' : 'Best Deal'}
          </div>
        )}

        {/* LEFT — Discount panel */}
        <div className="vc-left">
          {bestDeal && (
            <span className="vc-best-bolt material-symbols-sharp" aria-hidden="true">bolt</span>
          )}
          <div className="vc-discount">{discountText}</div>
        </div>

        {/* BODY */}
        <div className="vc-body">
          {voucher.store && (
            <Link
              href={`/${locale}/stores/${storeSlug}`}
              className="vc-logo-row"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={voucher.store.logo || '/placeholder_store.png'}
                alt={storeName}
                className="vc-logo"
              />
            </Link>
          )}
          <h3 className="vc-title">{title}</h3>
          {description && <p className="vc-desc">{description}</p>}

          <div className="vc-badges">
            {isActive && !isExpiredByDate && (
              <span className="vc-badge vc-badge-active">
                <span className="material-symbols-sharp">check_circle</span>
                {t('badges.active')}
              </span>
            )}
            {isExpiringSoon && !isExpiredByDate && (
              <span className="vc-badge vc-badge-urgent">
                <span className="material-symbols-sharp">timer</span>
                {daysRemaining !== null
                  ? (isRtl ? `ينتهي خلال ${daysRemaining} يوم` : `${daysRemaining}d left`)
                  : (isRtl ? 'ينتهي قريباً' : 'Ending soon')}
              </span>
            )}
            {isExpiredCard && (
              <span className="vc-badge vc-badge-expired">
                <span className="material-symbols-sharp">block</span>
                {t('meta.expired')}
              </span>
            )}
            {voucher.isVerified && (
              <span className="vc-badge vc-badge-verified">
                <span className="material-symbols-sharp">verified</span>
                {t('badges.verified')}
              </span>
            )}
            {voucher.isExclusive && (
              <span className="vc-badge vc-badge-exclusive">
                <span className="material-symbols-sharp">star</span>
                {t('badges.exclusive')}
              </span>
            )}
          </div>

          {(timesUsed > 0 || lastUpdated) && (
            <div className="vc-meta-line">
              {timesUsed > 0 && (
                <span className="vc-meta-item">
                  {timesUsed.toLocaleString()} {t('meta.timesUsed')}
                </span>
              )}
              {timesUsed > 0 && lastUpdated && <span className="vc-meta-dot">·</span>}
              {lastUpdated && <span className="vc-meta-item">{lastUpdated}</span>}
            </div>
          )}
        </div>

        {/* RIGHT — Action buttons (desktop) */}
        <div className="vc-actions">
          {voucher.type === 'CODE' ? (
            <button
              className={`vc-btn-primary ${copied ? 'vc-copied' : ''}`}
              onClick={handleCodeCopy}
              disabled={isExpiredCard}
            >
              {copied ? (
                <><span className="material-symbols-sharp">check_circle</span>{isRtl ? 'تم النسخ!' : 'Copied!'}</>
              ) : (
                <><span className="material-symbols-sharp">content_copy</span>{isRtl ? 'نسخ الكود' : 'Copy Code'}</>
              )}
            </button>
          ) : (
            <button
              className="vc-btn-deal"
              onClick={handleDealActivate}
              disabled={isExpiredCard}
            >
              <span className="material-symbols-sharp">arrow_outward</span>
              {isRtl ? 'تفعيل العرض' : 'Get Deal'}
            </button>
          )}

          <button
            className="vc-details-btn"
            onClick={handleDetailsClick}
            aria-label={isRtl ? 'عرض التفاصيل' : 'View details'}
            disabled={isExpiredCard}
          >
            <span className="material-symbols-sharp">info</span>
            {isRtl ? 'التفاصيل' : 'Details'}
          </button>
        </div>

        {/* Mobile chevron */}
        <div className="vc-mobile-chevron" aria-hidden="true">
          <span className="material-symbols-sharp">
            {isRtl ? 'chevron_left' : 'chevron_right'}
          </span>
        </div>
      </div>

      {/* Modal – only rendered if not expired */}
      {mounted && !isExpiredCard && (
        <VoucherModal
          isOpen={modalOpen}
          onClose={closeModal}
          voucher={voucher}
          store={voucher.store}
          locale={locale}
        />
      )}
    </>
  );
};

export default VoucherCard;
