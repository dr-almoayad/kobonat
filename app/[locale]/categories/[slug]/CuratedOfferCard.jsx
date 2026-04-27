'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import VoucherModal from '@/components/VoucherModal/VoucherModal';
import './CuratedOfferCard.css';

const CuratedOfferCard = ({ offer, featured = false, bestDeal = false, expired = false }) => {
  const locale = useLocale();
  const t = useTranslations('VoucherCard');
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentLanguage = locale.split('-')[0];
  const isRtl = currentLanguage === 'ar';

  if (!offer) return null;

  const voucher = offer.voucher || offer;
  const store = voucher.store || offer.store;
  if (!store) return null;

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

  const getFeaturedImage = () => store.coverImage || store.bigLogo || store.logo || '/placeholder_store.png';

  const getDiscountText = () => {
    if (voucher.discount) return voucher.discount;
    if (voucher.discountPercent != null) return `${Math.round(voucher.discountPercent)}% Off`;
    if (voucher.type === 'FREE_SHIPPING') return isRtl ? 'شحن مجاني' : 'Free Shipping';
    if (voucher.type === 'DEAL') return isRtl ? 'عرض' : 'Deal';
    return isRtl ? 'خصم' : 'Sale';
  };

  const isExpiredByDate = voucher.expiryDate ? new Date(voucher.expiryDate) < new Date() : false;
  const isExpiredCard = expired || isExpiredByDate;

  const title = getVoucherTitle();
  const description = getVoucherDescription();
  const storeName = getStoreName();
  const storeSlug = getStoreSlug();
  const discountText = getDiscountText();

  const handleCardClick = () => !isExpiredCard && setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handlePrimaryAction = async (e) => {
    e.stopPropagation();
    if (isExpiredCard) return;

    const [, countryCode] = locale.split('-');

    if (voucher.type === 'CODE' && voucher.code) {
      try {
        await navigator.clipboard.writeText(voucher.code);
        setCopied(true);
        await fetch('/api/vouchers/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voucherId: voucher.id, countryCode }),
        });
        setTimeout(() => {
          window.open(voucher.landingUrl || store.websiteUrl, '_blank');
        }, 600);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    } else {
      await fetch('/api/vouchers/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherId: voucher.id, countryCode }),
      });
      window.open(voucher.landingUrl || store.websiteUrl, '_blank');
    }
  };

  const primaryButtonText = copied
    ? (isRtl ? 'تم النسخ!' : 'Copied!')
    : (voucher.type === 'CODE'
        ? (isRtl ? 'نسخ الكود' : 'Copy Code')
        : (isRtl ? 'احصل على العرض' : 'Get Deal'));

  const ribbonText = bestDeal ? (isRtl ? 'أفضل عرض' : 'BEST DEAL') : discountText;

  return (
    <>
      <div
        className={[
          'co-card',
          isExpiredCard && 'co-expired',
          featured && 'co-featured',
          bestDeal && 'co-card--best-deal',
        ].filter(Boolean).join(' ')}
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={handleCardClick}
        role="button"
        tabIndex={isExpiredCard ? -1 : 0}
        onKeyDown={(e) => { if (!isExpiredCard && (e.key === 'Enter' || e.key === ' ')) handleCardClick(); }}
        aria-label={title}
        aria-disabled={isExpiredCard}
      >
        {/* Ribbon – always on the image side */}
        <div className="co-ribbon" aria-hidden="true">
          {ribbonText}
        </div>

        {/* Image side – order changes in RTL */}
        <div className="co-image">
          <img src={getFeaturedImage()} alt={storeName} className="co-card__image" />
        </div>

        {/* Content side */}
        <div className="co-content">
          <div className="co-store-row">
            <Link
              href={`/${locale}/stores/${storeSlug}`}
              onClick={(e) => e.stopPropagation()}
              className="co-store-link"
            >
              <img src={store.logo || '/placeholder_store.png'} alt={storeName} className="co-store-logo" />
            </Link>
          </div>

          <h3 className="co-title">{title}</h3>
          {description && <p className="co-desc">{description}</p>}

          <button className="co-card_cta" onClick={handlePrimaryAction} disabled={isExpiredCard}>
            {primaryButtonText}
          </button>
        </div>
      </div>

      {mounted && !isExpiredCard && (
        <VoucherModal isOpen={modalOpen} onClose={closeModal} voucher={voucher} store={store} locale={locale} />
      )}
    </>
  );
};

export default CuratedOfferCard;
