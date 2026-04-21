// components/VoucherCard/VoucherCard.jsx (refactored)
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import VoucherModal from '@/components/VoucherModal/VoucherModal'; // ✅ NEW import
import './VoucherCard.css';

const VoucherCard = ({ voucher, featured = false, bestDeal = false }) => {
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

  // No body scroll lock needed – VoucherModal handles it

  const currentLanguage = locale.split('-')[0];
  const isRtl = currentLanguage === 'ar';

  // ── Text extractors (unchanged) ──────────────────────────────
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

  // Discount display (unchanged)
  const getDiscountText = () => {
    if (voucher.discount) return voucher.discount;
    if (voucher.discountPercent != null) return `${Math.round(voucher.discountPercent)}%`;
    if (voucher.type === 'FREE_SHIPPING') return isRtl ? 'شحن\nمجاني' : 'FREE\nSHIP';
    if (voucher.type === 'DEAL') return isRtl ? 'عرض' : 'DEAL';
    return isRtl ? 'خصم' : 'SALE';
  };

  // Date helpers (unchanged)
  const isExpired = voucher.expiryDate ? new Date(voucher.expiryDate) < new Date() : false;
  const getDaysRemaining = () => {
    if (!voucher.expiryDate || isExpired) return null;
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

  const isActive   = !isExpired && (!voucher.startDate || new Date(voucher.startDate) <= new Date());
  const timesUsed  = voucher.clickCount ?? voucher._count?.clicks ?? 0;
  const storeName  = getStoreName();
  const storeSlug  = getStoreSlug();
  const title      = getVoucherTitle();
  const description = getVoucherDescription();
  const lastUpdated = getLastUpdatedTime();
  const lastUsed   = getLastUsedTime();
  const daysRemaining = getDaysRemaining();
  const discountText  = getDiscountText();

  // ── Handlers (unchanged) ─────────────────────────────────────
  const handleCodeCopy = async (e) => {
    e?.stopPropagation();
    if (!voucher.code) return;
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
    setModalOpen(true);
  };

  const handleCardClick = () => {
    if (isMobileRef.current) setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  // ── Render card (unchanged, except the modal is replaced) ────
  return (
    <>
      <div
        className={[
          'vc-card',
          isExpired ? 'vc-expired'         : '',
          featured  ? 'vc-featured'        : '',
          bestDeal  ? 'vc-card--best-deal' : '',
        ].filter(Boolean).join(' ')}
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
        aria-label={title}
      >
        {/* Ribbons, discount panel, body, actions – unchanged */}
        {/* ... (keep all existing JSX exactly as in your original VoucherCard, but remove the old modal) */}
        {/* The original modal section (with vc-overlay, vc-modal, etc.) should be deleted */}
      </div>

      {/* ✅ NEW: Use VoucherModal instead of internal modal */}
      {mounted && (
        <VoucherModal
          isOpen={modalOpen}
          onClose={closeModal}
          voucher={voucher}
          store={voucher.store}
          locale={locale}
          // Optionally pass custom bankTips or onFeedback
        />
      )}
    </>
  );
};

export default VoucherCard;
