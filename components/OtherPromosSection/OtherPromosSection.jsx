'use client';
// components/OtherPromosSection/OtherPromosSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations, useLocale } from 'next-intl';
import './other-promos.css';

// ─── Type metadata ────────────────────────────────────────────
const TYPE_META = {
  BANK_OFFER:    { icon: 'account_balance', labelAr: 'عرض بنكي',   labelEn: 'Bank Offer',     gradient: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' },
  CARD_OFFER:    { icon: 'credit_card',     labelAr: 'عرض بطاقة',  labelEn: 'Card Offer',     gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
  PAYMENT_OFFER: { icon: 'payments',        labelAr: 'عرض دفع',    labelEn: 'Payment Offer',  gradient: 'linear-gradient(135deg, #470ae2 0%, #3730a3 100%)' },
  SEASONAL:      { icon: 'celebration',     labelAr: 'عرض موسمي',  labelEn: 'Seasonal',       gradient: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)' },
  BUNDLE:        { icon: 'redeem',          labelAr: 'حزمة عروض',  labelEn: 'Bundle',         gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' },
  OTHER:         { icon: 'local_offer',     labelAr: 'عرض خاص',    labelEn: 'Special Offer',  gradient: 'linear-gradient(135deg, #475569 0%, #334155 100%)' },
};

// ─── Helpers ──────────────────────────────────────────────────
function formatExpiry(date, locale, isAr) {
  const d = new Date(date);
  const diff = Math.ceil((d - Date.now()) / 86_400_000);
  if (diff < 0)  return isAr ? 'منتهي'           : 'Expired';
  if (diff === 0) return isAr ? 'ينتهي اليوم'    : 'Expires today';
  if (diff <= 3)  return isAr ? `ينتهي خلال ${diff} أيام` : `${diff} days left`;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function isUrgent(date) {
  if (!date) return false;
  return Math.ceil((new Date(date) - Date.now()) / 86_400_000) <= 3;
}

// ─── Promo Modal (portal) ─────────────────────────────────────
function PromoModal({ promo, storeName, storeLogo, isAr, locale, onClose }) {
  const meta      = TYPE_META[promo.type] ?? TYPE_META.OTHER;
  const typeLabel = isAr ? meta.labelAr : meta.labelEn;
  const hasCode   = Boolean(promo.code);
  const hasPayment= Boolean(promo.paymentMethod);
  const [copied, setCopied] = useState(false);

  // Lock scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const modal = (
    <div className="opm-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="opm-sheet" role="dialog" aria-modal="true">

        {/* ── Hero header ── */}
        <div className="opm-hero" style={{ background: meta.gradient }}>
          {/* Decorative noise layer */}
          <div className="opm-hero__noise" aria-hidden="true" />

          {/* Close */}
          <button className="opm-close" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'}>
            <span className="material-symbols-sharp">close</span>
          </button>

          {/* Logo stack */}
          <div className="opm-hero__logos">
            {storeLogo && (
              <div className="opm-logo opm-logo--store">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={storeLogo} alt={storeName} />
              </div>
            )}
            {hasPayment && promo.paymentMethod.logo && (
              <div className="opm-logo opm-logo--payment">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={promo.paymentMethod.logo} alt={promo.paymentMethod.name} />
              </div>
            )}
          </div>

          {/* Badge */}
          <div className="opm-hero__badge">
            <span className="material-symbols-sharp">{meta.icon}</span>
            {typeLabel}
          </div>

          {/* Title in hero */}
          <h2 className="opm-hero__title">{promo.title}</h2>

          {/* Store × payment label */}
          <div className="opm-hero__partners">
            {storeName && <span>{storeName}</span>}
            {storeName && hasPayment && <span className="opm-hero__dot" />}
            {hasPayment && <span>{promo.paymentMethod.name}</span>}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="opm-body">

          {/* Expiry pill */}
          {promo.expiryDate && (
            <div className={`opm-expiry ${isUrgent(promo.expiryDate) ? 'opm-expiry--urgent' : ''}`}>
              <span className="material-symbols-sharp">schedule</span>
              {formatExpiry(promo.expiryDate, locale, isAr)}
            </div>
          )}

          {/* Description */}
          {promo.description && (
            <div className="opm-section">
              <h3 className="opm-section__label">
                <span className="material-symbols-sharp">info</span>
                {isAr ? 'تفاصيل العرض' : 'Offer Details'}
              </h3>
              <p className="opm-desc">{promo.description}</p>
            </div>
          )}

          {/* Code box */}
          {hasCode && (
            <div className="opm-section">
              <h3 className="opm-section__label">
                <span className="material-symbols-sharp">confirmation_number</span>
                {isAr ? 'كود الخصم' : 'Promo Code'}
              </h3>
              <div className="opm-code-box">
                <span className="opm-code-value">{promo.code}</span>
                <button
                  className={`opm-code-copy ${copied ? 'opm-code-copy--done' : ''}`}
                  onClick={copyCode}
                >
                  <span className="material-symbols-sharp">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? (isAr ? 'تم النسخ' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
                </button>
              </div>
            </div>
          )}

          {/* Terms */}
          {promo.terms && (
            <div className="opm-section">
              <h3 className="opm-section__label">
                <span className="material-symbols-sharp">gavel</span>
                {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
              </h3>
              <p className="opm-terms-text">{promo.terms}</p>
            </div>
          )}

        </div>

        {/* ── Sticky CTA ── */}
        {promo.url && (
          <div className="opm-footer">
            <a
              href={promo.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="opm-cta"
              onClick={onClose}
            >
              <span className="material-symbols-sharp">bolt</span>
              {hasCode ? (isAr ? 'انتقل واستخدم الكود' : 'Go & Apply Code') : (isAr ? 'تفعيل العرض' : 'Activate Offer')}
              <span className="material-symbols-sharp opm-cta__arrow">{isAr ? 'arrow_back' : 'arrow_forward'}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ─── Promo Card ───────────────────────────────────────────────
function PromoCard({ promo, storeName, storeLogo, isAr, locale, onClick }) {
  const meta       = TYPE_META[promo.type] ?? TYPE_META.OTHER;
  const typeLabel  = isAr ? meta.labelAr : meta.labelEn;
  const hasPayment = Boolean(promo.paymentMethod);
  const urgent     = isUrgent(promo.expiryDate);

  return (
    <article
      className={`op-card op-card--${promo.type.toLowerCase().replace(/_/g, '-')}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      aria-label={`${typeLabel}: ${promo.title}`}
      itemScope
      itemType="https://schema.org/Offer"
    >
      {/* ── Tinted header band ── */}
      <div className="op-card__header" style={{ background: meta.gradient }}>
        <div className="op-card__header-noise" aria-hidden="true" />

        {/* Type badge */}
        <span className="op-card__type-badge">
          <span className="material-symbols-sharp">{meta.icon}</span>
          {typeLabel}
        </span>

        {/* Dual logo cluster */}
        <div className="op-card__logos">
          {storeLogo && (
            <div className="op-logo op-logo--store">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={storeLogo} alt={storeName} />
            </div>
          )}
          {hasPayment && promo.paymentMethod.logo && (
            <div className="op-logo op-logo--payment">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={promo.paymentMethod.logo} alt={promo.paymentMethod.name} />
            </div>
          )}
          {/* Partner names */}
          {(storeName || hasPayment) && (
            <div className="op-logo__names">
              {storeName && <span>{storeName}</span>}
              {storeName && hasPayment && <span className="op-logo__sep">×</span>}
              {hasPayment && <span>{promo.paymentMethod.name}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="op-card__body">
        <h3 className="op-card__title" itemProp="name">{promo.title}</h3>

        {/* Code pill (preview) */}
        {promo.code && (
          <div className="op-card__code-preview">
            <span className="material-symbols-sharp">confirmation_number</span>
            <span>{promo.code}</span>
          </div>
        )}

        {/* Footer row */}
        <div className="op-card__footer">
          {promo.expiryDate && (
            <span className={`op-card__expiry ${urgent ? 'op-card__expiry--urgent' : ''}`}>
              <span className="material-symbols-sharp">schedule</span>
              {formatExpiry(promo.expiryDate, locale, isAr)}
            </span>
          )}
          <span className="op-card__view-hint">
            {isAr ? 'عرض التفاصيل' : 'View details'}
            <span className="material-symbols-sharp">{isAr ? 'chevron_left' : 'chevron_right'}</span>
          </span>
        </div>
      </div>

      {/* schema.org hidden */}
      <meta itemProp="seller" content={storeName} />
      {promo.expiryDate && <meta itemProp="validThrough" content={promo.expiryDate} />}
    </article>
  );
}

// ─── Section ──────────────────────────────────────────────────
const OtherPromosSection = ({ storeSlug, storeName, storeLogo }) => {
  const t = useTranslations('OtherPromos');
  const locale = useLocale();
  const [language, countryCode] = locale.split('-');
  const isAr = language === 'ar';

  const [promos,       setPromos]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activePromo,  setActivePromo]  = useState(null);
  const [mounted,      setMounted]      = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/stores/${storeSlug}/other-promos?locale=${language}&country=${countryCode}`);
        if (res.ok) {
          const data = await res.json();
          setPromos(data.promos || []);
        }
      } catch (e) {
        console.error('Failed to fetch other promos:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [storeSlug, language, countryCode]);

  const handleClose = useCallback(() => setActivePromo(null), []);

  if (loading) {
    return (
      <div className="op-skeleton-wrap">
        <div className="op-skeleton-hd" />
        <div className="op-skeleton-grid">
          {[1, 2, 3].map(i => <div key={i} className="op-skeleton-card" />)}
        </div>
      </div>
    );
  }

  if (!promos.length) return null;

  return (
    <section className="op-section" id="other-offers" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="op-header">
        <h2 className="op-section-title">
          <span className="material-symbols-sharp">local_activity</span>
          {t('title')}
        </h2>
        <span className="op-header-count">{promos.length}</span>
      </div>

      {/* Cards */}
      <div className="op-grid">
        {promos.map(promo => (
          <PromoCard
            key={promo.id}
            promo={promo}
            storeName={storeName}
            storeLogo={storeLogo}
            isAr={isAr}
            locale={locale}
            onClick={() => setActivePromo(promo)}
          />
        ))}
      </div>

      {/* Modal */}
      {mounted && activePromo && (
        <PromoModal
          promo={activePromo}
          storeName={storeName}
          storeLogo={storeLogo}
          isAr={isAr}
          locale={locale}
          onClose={handleClose}
        />
      )}
    </section>
  );
};

export default OtherPromosSection;
