// components/CuratedOfferCard/CuratedOfferCard.jsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import VoucherModal from '@/components/VoucherModal/VoucherModal';
import './CuratedOfferCard.css';

const CuratedOfferCard = ({
  offer,
  featured = false,
  bestDeal = false,
  expired = false,
}) => {
  const locale = useLocale();
  const t = useTranslations('VoucherCard');
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

  // ── Safely extract data from the offer (supports both voucher and curatedOffer) ──
  const voucher = offer.voucher || offer; // if offer already is a voucher, use it directly
  const store = voucher.store || offer.store;
  if (!store) return null; // cannot render without a store

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
    if (store.name) return store.name;
    if (store.translations?.[0]?.name) return store.translations[0].name;
    return isRtl ? 'متجر' : 'Store';
  };

  const getStoreSlug = () => {
    if (store.slug) return store.slug;
    if (store.translations?.[0]?.slug) return store.translations[0].slug;
    return 'store';
  };

  // For curated cards we prefer the store cover image,
  // but fallback to voucher image or store logo.
  const getFeaturedImage = () => {
    return store.coverImage || store.bigLogo || store.logo || '/placeholder_store.png';
  };

  // Discount text (same as VoucherCard)
  const getDiscountText = () => {
    if (voucher.discount) return voucher.discount;
    if (voucher.discountPercent != null) return `${Math.round(voucher.discountPercent)}%`;
    if (voucher.type === 'FREE_SHIPPING') return isRtl ? 'شحن\nمجاني' : 'FREE\nSHIP';
    if (voucher.type === 'DEAL') return isRtl ? 'عرض' : 'DEAL';
    return isRtl ? 'خصم' : 'SALE';
  };

  // Date helpers
  const isExpiredByDate = voucher.expiryDate ? new Date(voucher.expiryDate) < new Date() : false;
  const isExpiredCard = expired || isExpiredByDate;

  const getDaysRemaining = () => {
    if (!voucher.expiryDate || isExpiredByDate) return null;
    return Math.ceil((new Date(voucher.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  };
  const isExpiringSoon = (() => {
    const d = getDaysRemaining();
    return d !== null && d <= 3;
  })();

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

  const isActive   = !isExpiredByDate && (!voucher.startDate || new Date(voucher.startDate) <= new Date());
  const timesUsed  = voucher.clickCount ?? voucher._count?.clicks ?? 0;
  const storeName  = getStoreName();
  const storeSlug  = getStoreSlug();
  const title      = getVoucherTitle();
  const description = getVoucherDescription();
  const lastUpdated = getLastUpdatedTime();
  const discountText  = getDiscountText();

  // ── Handlers ─────────────────────────────────────────────────────
  const handleCardClick = () => {
    if (isExpiredCard) return;
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  return (
    <>
      <div
        className={[
          'co-card',
          isExpiredCard ? 'co-expired'      : '',
          featured      ? 'co-featured'     : '',
          bestDeal      ? 'co-card--best-deal' : '',
        ].filter(Boolean).join(' ')}
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={handleCardClick}
        role="button"
        tabIndex={isExpiredCard ? -1 : 0}
        onKeyDown={(e) => { if (!isExpiredCard && (e.key === 'Enter' || e.key === ' ')) handleCardClick(); }}
        aria-label={title}
        aria-disabled={isExpiredCard}
      >
        {/* Ribbons */}
        {featured && !bestDeal && (
          <div className="co-ribbon">
            <span className="material-symbols-sharp">star</span>
            {isRtl ? 'مميز' : 'Featured'}
          </div>
        )}
        {bestDeal && (
          <div className="co-ribbon co-ribbon--best">
            <span className="material-symbols-sharp">bolt</span>
            {isRtl ? 'أفضل عرض' : 'Best Deal'}
          </div>
        )}

        {/* LEFT — Featured image */}
        <div className="co-image">
          <img
            src={getFeaturedImage()}
            alt={storeName}
            className="co-card__image"
          />
        </div>

        {/* BODY — content area */}
        <div className="co-content">
          <div className="co-store-row">
            <Link
              href={`/${locale}/stores/${storeSlug}`}
              onClick={(e) => e.stopPropagation()}
              className="co-store-link"
            >
              <img
                src={store.logo || '/placeholder_store.png'}
                alt={storeName}
                className="co-store-logo"
              />
            </Link>
            {discountText && <div className="co-discount-badge">{discountText}</div>}
          </div>

          <h3 className="co-title">{title}</h3>
          {description && <p className="co-desc">{description}</p>}

          <div className="co-badges">
            {isActive && !isExpiredByDate && (
              <span className="co-badge co-badge-active">
                <span className="material-symbols-sharp">check_circle</span>
                {t('badges.active')}
              </span>
            )}
            {isExpiringSoon && !isExpiredByDate && (
              <span className="co-badge co-badge-urgent">
                <span className="material-symbols-sharp">timer</span>
                {getDaysRemaining() !== null
                  ? (isRtl ? `ينتهي خلال ${getDaysRemaining()} يوم` : `${getDaysRemaining()}d left`)
                  : (isRtl ? 'ينتهي قريباً' : 'Ending soon')}
              </span>
            )}
            {isExpiredCard && (
              <span className="co-badge co-badge-expired">
                <span className="material-symbols-sharp">block</span>
                {t('meta.expired')}
              </span>
            )}
            {voucher.isVerified && (
              <span className="co-badge co-badge-verified">
                <span className="material-symbols-sharp">verified</span>
                {t('badges.verified')}
              </span>
            )}
            {voucher.isExclusive && (
              <span className="co-badge co-badge-exclusive">
                <span className="material-symbols-sharp">star</span>
                {t('badges.exclusive')}
              </span>
            )}
          </div>

          {(timesUsed > 0 || lastUpdated) && (
            <div className="co-meta-line">
              {timesUsed > 0 && (
                <span className="co-meta-item">
                  {timesUsed.toLocaleString()} {t('meta.timesUsed')}
                </span>
              )}
              {timesUsed > 0 && lastUpdated && <span className="co-meta-dot">·</span>}
              {lastUpdated && <span className="co-meta-item">{lastUpdated}</span>}
            </div>
          )}
        </div>

        {/* Mobile chevron */}
        <div className="co-mobile-chevron" aria-hidden="true">
          <span className="material-symbols-sharp">
            {isRtl ? 'chevron_left' : 'chevron_right'}
          </span>
        </div>
      </div>

      {/* Modal – reusable VoucherModal */}
      {mounted && !isExpiredCard && (
        <VoucherModal
          isOpen={modalOpen}
          onClose={closeModal}
          voucher={voucher}
          store={store}
          locale={locale}
        />
      )}
    </>
  );
};

export default CuratedOfferCard;
