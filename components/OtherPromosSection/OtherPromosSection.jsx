'use client';
// components/OtherPromosSection/OtherPromosSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations, useLocale } from 'next-intl';
import './other-promos.css';

// ─── Type metadata ─────────────────────────────────────────────
const TYPE_META = {
  BANK_OFFER:    { icon: 'account_balance', labelAr: 'عرض بنكي',   labelEn: 'Bank Offer',    accent: '#1d4ed8' },
  CARD_OFFER:    { icon: 'credit_card',     labelAr: 'عرض بطاقة',  labelEn: 'Card Offer',    accent: '#059669' },
  PAYMENT_OFFER: { icon: 'payments',        labelAr: 'عرض دفع',    labelEn: 'Payment Offer', accent: '#470ae2' },
  SEASONAL:      { icon: 'celebration',     labelAr: 'عرض موسمي',  labelEn: 'Seasonal',      accent: '#b45309' },
  BUNDLE:        { icon: 'redeem',          labelAr: 'حزمة عروض',  labelEn: 'Bundle',        accent: '#dc2626' },
  OTHER:         { icon: 'local_offer',     labelAr: 'عرض خاص',    labelEn: 'Special Offer', accent: '#475569' },
};

// ─── Helpers ───────────────────────────────────────────────────
function formatExpiry(date, locale, isAr) {
  const d    = new Date(date);
  const diff = Math.ceil((d - Date.now()) / 86_400_000);
  if (diff <  0)  return isAr ? 'منتهي'                   : 'Expired';
  if (diff === 0) return isAr ? 'ينتهي اليوم'             : 'Expires today';
  if (diff <= 3)  return isAr ? `ينتهي خلال ${diff} أيام` : `${diff} days left`;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function isUrgent(date) {
  if (!date) return false;
  return Math.ceil((new Date(date) - Date.now()) / 86_400_000) <= 3;
}

/**
 * Resolve the secondary logo (bank / payment method / card).
 * Returns { logo, name, isBnpl } or null.
 */
function resolveSecondary(promo) {
  if (promo.paymentMethod?.logo) {
    return { logo: promo.paymentMethod.logo, name: promo.paymentMethod.name, isBnpl: promo.paymentMethod.isBnpl };
  }
  if (promo.bank?.logo) {
    return { logo: promo.bank.logo, name: promo.bank.name, isBnpl: false };
  }
  if (promo.card?.image) {
    return { logo: promo.card.image, name: promo.card.name, isBnpl: false };
  }
  return null;
}

// ─── PromoModal ────────────────────────────────────────────────
function PromoModal({ promo, storeName, storeLogo, isAr, locale, onClose }) {
  const meta      = TYPE_META[promo.type] ?? TYPE_META.OTHER;
  const typeLabel = isAr ? meta.labelAr : meta.labelEn;
  const hasCode   = Boolean(promo.voucherCode);
  const urgent    = isUrgent(promo.expiryDate);
  const secondary = resolveSecondary(promo);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(promo.voucherCode); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const modal = (
    <div
      className="opm-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="opm-sheet" role="dialog" aria-modal="true">

        {/* ── Image hero ── */}
        {promo.image ? (
          <div className="opm-hero opm-hero--image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={promo.image} alt={promo.title} className="opm-hero__img" />
            <div className="opm-hero__img-overlay" />
            <button className="opm-close" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'}>
              <span className="material-symbols-sharp">close</span>
            </button>
            <div className="opm-hero__badge" style={{ '--_accent': meta.accent }}>
              <span className="material-symbols-sharp">{meta.icon}</span>
              {typeLabel}
            </div>
          </div>
        ) : (
          <div className="opm-hero opm-hero--plain" style={{ '--_accent': meta.accent }}>
            <button className="opm-close opm-close--dark" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'}>
              <span className="material-symbols-sharp">close</span>
            </button>
            <div className="opm-hero__badge opm-hero__badge--plain" style={{ '--_accent': meta.accent }}>
              <span className="material-symbols-sharp">{meta.icon}</span>
              {typeLabel}
            </div>
            <h2 className="opm-hero__title--plain">{promo.title}</h2>
          </div>
        )}

        {/* ── Sheet header: logos + title ── */}
        <div className="opm-sheet-header">
          {/* Logos — bare, no background, no border */}
          {(storeLogo || secondary?.logo) && (
            <div className="opm-sheet-logos">
              {storeLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={storeLogo} alt={storeName || ''} className="opm-sheet-logo" />
              )}
              {secondary?.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={secondary.logo} alt={secondary.name || ''} className="opm-sheet-logo" />
              )}
            </div>
          )}
          {promo.image && (
            <h2 className="opm-sheet-title">{promo.title}</h2>
          )}
          {promo.expiryDate && (
            <div className={`opm-expiry${urgent ? ' opm-expiry--urgent' : ''}`}>
              <span className="material-symbols-sharp">schedule</span>
              {formatExpiry(promo.expiryDate, locale, isAr)}
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="opm-body">

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

          {/* Payment method */}
          {promo.paymentMethod && (
            <div className="opm-section">
              <h3 className="opm-section__label">
                <span className="material-symbols-sharp">payments</span>
                {isAr ? 'طريقة الدفع' : 'Payment Method'}
              </h3>
              <div className="opm-entity-row">
                {promo.paymentMethod.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={promo.paymentMethod.logo} alt={promo.paymentMethod.name} className="opm-entity-logo" />
                )}
                <div className="opm-entity-row__info">
                  <span className="opm-entity-row__name">{promo.paymentMethod.name}</span>
                  <div className="opm-entity-row__tags">
                    <span className="opm-tag">{promo.paymentMethod.type}</span>
                    {promo.paymentMethod.isBnpl && (
                      <span className="opm-tag opm-tag--bnpl">{isAr ? 'تقسيط بدون فوائد' : 'Buy Now Pay Later'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bank */}
          {promo.bank && (
            <div className="opm-section">
              <h3 className="opm-section__label">
                <span className="material-symbols-sharp">account_balance</span>
                {isAr ? 'البنك' : 'Bank'}
              </h3>
              <div className="opm-entity-row">
                {promo.bank.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={promo.bank.logo} alt={promo.bank.name} className="opm-entity-logo" />
                )}
                <span className="opm-entity-row__name">{promo.bank.name}</span>
              </div>
            </div>
          )}

          {/* Card */}
          {promo.card && (
            <div className="opm-section">
              <h3 className="opm-section__label">
                <span className="material-symbols-sharp">credit_card</span>
                {isAr ? 'البطاقة المؤهلة' : 'Eligible Card'}
              </h3>
              <div className="opm-entity-row">
                {promo.card.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={promo.card.image} alt={promo.card.name} className="opm-entity-card-img" />
                )}
                <div className="opm-entity-row__info">
                  <span className="opm-entity-row__name">{promo.card.name}</span>
                  <div className="opm-entity-row__tags">
                    <span className="opm-tag">{promo.card.network}</span>
                    <span className="opm-tag">{promo.card.tier}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Promo code */}
          {hasCode && (
            <div className="opm-section">
              <h3 className="opm-section__label">
                <span className="material-symbols-sharp">confirmation_number</span>
                {isAr ? 'كود العرض' : 'Promo Code'}
              </h3>
              <div className="opm-code-box">
                <span className="opm-code-value">{promo.voucherCode}</span>
                <button
                  className={`opm-code-copy${copied ? ' opm-code-copy--done' : ''}`}
                  onClick={copyCode}
                  aria-label={isAr ? 'نسخ الكود' : 'Copy code'}
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
              {hasCode
                ? (isAr ? 'انتقل واستخدم الكود' : 'Go & Apply Code')
                : (isAr ? 'تفعيل العرض'          : 'Activate Offer')}
              <span className="material-symbols-sharp opm-cta__arrow">
                {isAr ? 'arrow_back' : 'arrow_forward'}
              </span>
            </a>
          </div>
        )}

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ─── PromoCard ─────────────────────────────────────────────────
function PromoCard({ promo, storeName, storeLogo, isAr, locale, onClick }) {
  const meta      = TYPE_META[promo.type] ?? TYPE_META.OTHER;
  const typeLabel = isAr ? meta.labelAr : meta.labelEn;
  const urgent    = isUrgent(promo.expiryDate);
  const secondary = resolveSecondary(promo);

  return (
    <article
      className={`op-card op-card--${promo.type.toLowerCase().replace(/_/g, '-')}`}
      style={{ '--_accent': meta.accent }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      aria-label={`${typeLabel}: ${promo.title}`}
      itemScope
      itemType="https://schema.org/Offer"
    >
      {/* ── Image area ── */}
      <div className="op-card__image-wrap">
        {promo.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={promo.image} alt={promo.title} className="op-card__image" loading="lazy" />
        ) : (
          <div className="op-card__image-placeholder" />
        )}
        {/* Type badge overlaid on image */}
        <span className="op-card__type-badge">
          <span className="material-symbols-sharp">{meta.icon}</span>
          {typeLabel}
        </span>
      </div>

      {/* ── Card body ── */}
      <div className="op-card__body">

        {/* Logos row — bare, no background, no border */}
        {(storeLogo || secondary?.logo) && (
          <div className="op-card__logos">
            {storeLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={storeLogo} alt={storeName || ''} className="op-logo-bare" />
            )}
            {secondary?.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={secondary.logo} alt={secondary.name || ''} className="op-logo-bare" />
            )}
            {secondary?.isBnpl && (
              <span className="op-bnpl-pip">{isAr ? 'تقسيط' : 'BNPL'}</span>
            )}
          </div>
        )}

        <h3 className="op-card__title" itemProp="name">{promo.title}</h3>

        {promo.voucherCode && (
          <div className="op-card__code-preview">
            <span className="material-symbols-sharp">confirmation_number</span>
            <span>{promo.voucherCode}</span>
          </div>
        )}

        <div className="op-card__footer">
          {promo.expiryDate ? (
            <span className={`op-card__expiry${urgent ? ' op-card__expiry--urgent' : ''}`}>
              <span className="material-symbols-sharp">schedule</span>
              {formatExpiry(promo.expiryDate, locale, isAr)}
            </span>
          ) : <span />}
          <span className="op-card__view-hint">
            {isAr ? 'التفاصيل' : 'Details'}
            <span className="material-symbols-sharp">{isAr ? 'chevron_left' : 'chevron_right'}</span>
          </span>
        </div>
      </div>

      <meta itemProp="seller" content={storeName} />
      {promo.expiryDate && <meta itemProp="validThrough" content={promo.expiryDate} />}
    </article>
  );
}

// ─── Section ───────────────────────────────────────────────────
const OtherPromosSection = ({ storeSlug, storeName, storeLogo }) => {
  const t = useTranslations('OtherPromos');
  const locale = useLocale();
  const [language, countryCode] = locale.split('-');
  const isAr = language === 'ar';

  const [promos,      setPromos]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activePromo, setActivePromo] = useState(null);
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/stores/${storeSlug}/other-promos?locale=${language}&country=${countryCode}`
        );
        if (res.ok) setPromos((await res.json()).promos || []);
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

      <div className="op-header">
        <h2 className="op-section-title">
          <span className="material-symbols-sharp">local_activity</span>
          {t('title')}
        </h2>
        <span className="op-header-count">{promos.length}</span>
      </div>

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
