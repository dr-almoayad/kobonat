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

  const isExpiredByDate = voucher.expiryDate ? new Date(voucher.expiryDate) < new Date() : false;
  const isExpiredCard = expired || isExpiredByDate;

  const handleAction = async (e) => {
    e?.stopPropagation();
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
    
    // Slight delay for code copy before redirecting
    setTimeout(() => {
        window.open(voucher.landingUrl || voucher.store?.websiteUrl, '_blank');
    }, voucher.type === 'CODE' ? 600 : 0);
  };

  const handleCardClick = () => {
    if (isExpiredCard) return;
    setModalOpen(true);
  };

  const storeName = getStoreName();
  const storeSlug = getStoreSlug();
  const title = getVoucherTitle();
  const description = getVoucherDescription();
  const discountText = getDiscountText();

  return (
    <>
      <article
        className={`vc-modern-card ${isExpiredCard ? 'is-expired' : ''} ${bestDeal ? 'is-best-deal' : ''}`}
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={handleCardClick}
        role="button"
        tabIndex={isExpiredCard ? -1 : 0}
        onKeyDown={(e) => { if (!isExpiredCard && (e.key === 'Enter' || e.key === ' ')) handleCardClick(); }}
        aria-label={`${title} at ${storeName}`}
        aria-disabled={isExpiredCard}
      >
        {/* Creative Percentage Graphic Background */}
        <div className="vc-graphic-bg" aria-hidden="true">%</div>

        {bestDeal && (
          <div className="vc-badge-ribbon">
             <span className="material-symbols-sharp">bolt</span>
             {isRtl ? 'أفضل عرض' : 'Top Deal'}
          </div>
        )}

        <div className="vc-content-wrapper">
            {/* Top Row: Logo & Discount */}
            <div className="vc-top-row">
                {voucher.store && (
                    <Link
                    href={`/${locale}/stores/${storeSlug}`}
                    className="vc-store-link"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Visit ${storeName} store page`}
                    >
                    <img
                        src={voucher.store.logo || '/placeholder_store.png'}
                        alt={`${storeName} logo`}
                        className="vc-store-logo"
                        loading="lazy"
                    />
                    </Link>
                )}
                <div className="vc-discount-display">
                    <span className="vc-discount-value">{discountText}</span>
                </div>
            </div>

            {/* Middle Row: Title & Description */}
            <div className="vc-text-content">
                <h3 className="vc-offer-title">{title}</h3>
                {description && <p className="vc-offer-desc">{description}</p>}
            </div>

            {/* Bottom Row: Action Area */}
            <div className="vc-action-row">
                <div className="vc-meta-info">
                   {voucher.isVerified && (
                    <span className="vc-status-verified">
                        <span className="material-symbols-sharp">verified</span>
                        {t('badges.verified')}
                    </span>
                   )}
                </div>

                <button
                    className={`vc-cta-btn ${voucher.type === 'CODE' ? 'btn-code' : 'btn-deal'} ${copied ? 'is-copied' : ''}`}
                    onClick={handleAction}
                    disabled={isExpiredCard}
                    aria-label={voucher.type === 'CODE' ? 'Copy coupon code' : 'Activate deal'}
                >
                    {voucher.type === 'CODE' ? (
                        copied ? (
                            <><span className="material-symbols-sharp">check</span>{isRtl ? 'تم النسخ' : 'Copied'}</>
                        ) : (
                            <><span className="material-symbols-sharp">content_copy</span>{isRtl ? 'نسخ الكود' : 'Get Code'}</>
                        )
                    ) : (
                        <><span className="material-symbols-sharp">arrow_forward</span>{isRtl ? 'تفعيل العرض' : 'Get Deal'}</>
                    )}
                </button>
            </div>
        </div>
      </article>

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
