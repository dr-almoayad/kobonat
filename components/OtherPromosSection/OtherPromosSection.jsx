// components/OtherPromosSection/OtherPromosSection.jsx
'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import './other-promos.css';

const TYPE_META = {
  BANK_OFFER:    { icon: 'account_balance', labelAr: 'عرض بنكي',      labelEn: 'Bank Offer' },
  CARD_OFFER:    { icon: 'credit_card',     labelAr: 'عرض بطاقة',     labelEn: 'Card Offer' },
  PAYMENT_OFFER: { icon: 'payments',        labelAr: 'عرض دفع',       labelEn: 'Payment Offer' },
  SEASONAL:      { icon: 'celebration',     labelAr: 'عرض موسمي',     labelEn: 'Seasonal' },
  BUNDLE:        { icon: 'redeem',          labelAr: 'حزمة عروض',     labelEn: 'Bundle' },
  OTHER:         { icon: 'local_offer',     labelAr: 'عرض خاص',       labelEn: 'Special Offer' },
};

const OtherPromosSection = ({ storeSlug, storeName, storeLogo }) => {
  const t = useTranslations('OtherPromos');
  const locale = useLocale();
  const [language, countryCode] = locale.split('-');
  const isArabic = language === 'ar';

  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await fetch(
          `/api/stores/${storeSlug}/other-promos?locale=${language}&country=${countryCode}`
        );
        if (res.ok) {
          const data = await res.json();
          setPromos(data.promos || []);
        }
      } catch (error) {
        console.error('Failed to fetch other promos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, [storeSlug, language, countryCode]);

  const getLastUpdatedTime = (updatedAt) => {
    if (!updatedAt) return null;
    const diffHours = Math.floor((Date.now() - new Date(updatedAt)) / 3_600_000);
    if (diffHours < 1)  return isArabic ? 'محدث للتو' : 'Updated just now';
    if (diffHours < 24) return isArabic ? `محدث قبل ${diffHours} ساعة` : `Updated ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return isArabic ? 'محدث أمس' : 'Updated yesterday';
    if (diffDays < 7)   return isArabic ? `محدث قبل ${diffDays} أيام` : `Updated ${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    return isArabic
      ? `محدث قبل ${diffWeeks} ${diffWeeks === 1 ? 'أسبوع' : 'أسابيع'}`
      : `Updated ${diffWeeks}w ago`;
  };

  const generatePromoId = (promo) => {
    const slug = promo.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
    return `promo-${promo.id}-${slug}`;
  };

  const copyCode = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2500);
    } catch {}
  };

  const copyPromoLink = async (promoId) => {
    const url = `${window.location.origin}${window.location.pathname}#${promoId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(promoId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch {}
  };

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="op-skeleton-wrap">
        <div className="op-skeleton-title" />
        <div className="op-skeleton-grid">
          {[1, 2, 3].map(i => <div key={i} className="op-skeleton-card" />)}
        </div>
      </div>
    );
  }

  if (promos.length === 0) return null;

  return (
    <section className="op-section" id="other-offers" dir={isArabic ? 'rtl' : 'ltr'}>

      {/* ── Section Header ── */}
      <div className="op-header">
        <h2 className="op-section-title">
          <span className="material-symbols-sharp">local_activity</span>
          {t('title')}
        </h2>
      </div>

      {/* ── Cards Grid ── */}
      <div className="op-grid">
        {promos.map((promo) => {
          const promoId     = generatePromoId(promo);
          const lastUpdated = getLastUpdatedTime(promo.updatedAt);
          const meta        = TYPE_META[promo.type] ?? TYPE_META.OTHER;
          const typeLabel   = isArabic ? meta.labelAr : meta.labelEn;
          const hasCode     = Boolean(promo.code);
          const hasPayment  = Boolean(promo.paymentMethod);

          return (
            <article
              key={promo.id}
              id={promoId}
              className={`op-card op-card--${promo.type.toLowerCase().replace('_', '-')}`}
              itemScope
              itemType="https://schema.org/Offer"
            >
              {/* ── Top bar: badge + share ── */}
              <div className="op-card__topbar">
                <span className={`op-badge op-badge--${promo.type.toLowerCase().replace('_', '-')}`}>
                  <span className="material-symbols-sharp">{meta.icon}</span>
                  {typeLabel}
                </span>
                <button
                  className="op-share-btn"
                  onClick={() => copyPromoLink(promoId)}
                  aria-label={isArabic ? 'مشاركة العرض' : 'Share this offer'}
                  title={copiedLinkId === promoId
                    ? (isArabic ? 'تم النسخ!' : 'Copied!')
                    : (isArabic ? 'نسخ الرابط' : 'Copy link')}
                >
                  <span className="material-symbols-sharp">
                    {copiedLinkId === promoId ? 'check' : 'link'}
                  </span>
                </button>
              </div>

              {/* ── Logos row ── */}
              {(storeLogo || hasPayment) && (
                <div className="op-card__logos">
                  {storeLogo && (
                    <div className="op-logo op-logo--store">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={storeLogo} alt={storeName} width={48} height={48} />
                    </div>
                  )}

                  {storeLogo && hasPayment && (
                    <span className="op-logo-sep">×</span>
                  )}

                  {hasPayment && (
                    <div className="op-logo op-logo--payment" title={promo.paymentMethod.name}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={promo.paymentMethod.logo}
                        alt={promo.paymentMethod.name}
                        width={48}
                        height={48}
                      />
                    </div>
                  )}

                  {hasPayment && (
                    <span className="op-payment-name">{promo.paymentMethod.name}</span>
                  )}
                </div>
              )}

              {/* ── Content ── */}
              <div className="op-card__body">
                <h3 className="op-card__title" itemProp="name">{promo.title}</h3>

                {promo.description && (
                  <p className="op-card__description" itemProp="description">
                    {promo.description}
                  </p>
                )}

                {/* ── Promo code box ── */}
                {hasCode && (
                  <div className="op-code-box">
                    <div className="op-code-box__inner">
                      <span className="material-symbols-sharp op-code-icon">confirmation_number</span>
                      <span className="op-code-value">{promo.code}</span>
                    </div>
                    <button
                      className={`op-code-copy ${copiedCodeId === promo.id ? 'op-code-copy--done' : ''}`}
                      onClick={() => copyCode(promo.code, promo.id)}
                      aria-label={isArabic ? 'نسخ الكود' : 'Copy code'}
                    >
                      <span className="material-symbols-sharp">
                        {copiedCodeId === promo.id ? 'check' : 'content_copy'}
                      </span>
                      <span className="op-code-copy__label">
                        {copiedCodeId === promo.id
                          ? (isArabic ? 'تم النسخ' : 'Copied')
                          : (isArabic ? 'نسخ' : 'Copy')}
                      </span>
                    </button>
                  </div>
                )}

                {/* ── Meta row: expiry + updated ── */}
                <div className="op-card__meta">
                  {promo.expiryDate && (
                    <span className="op-meta-item">
                      <span className="material-symbols-sharp">schedule</span>
                      {t('validUntil', {
                        date: new Date(promo.expiryDate).toLocaleDateString(locale, {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })
                      })}
                    </span>
                  )}
                  {lastUpdated && (
                    <span className="op-meta-item op-meta-item--muted">
                      <span className="material-symbols-sharp">update</span>
                      {lastUpdated}
                    </span>
                  )}
                </div>

                {/* schema.org hidden meta */}
                <meta itemProp="seller" content={storeName} />
                {promo.expiryDate && (
                  <meta itemProp="validThrough" content={promo.expiryDate} />
                )}
              </div>

              {/* ── CTA ── */}
              {promo.url && (
                <div className="op-card__footer">
                  <a
                    href={promo.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="op-cta"
                    itemProp="url"
                  >
                    {hasCode
                      ? (isArabic ? 'استخدم الكود' : 'Use Code')
                      : (isArabic ? 'تفعيل العرض' : 'Activate Offer')}
                    <span className="material-symbols-sharp">arrow_outward</span>
                  </a>
                </div>
              )}

              {/* ── Terms accordion ── */}
              {promo.terms && (
                <details className="op-terms">
                  <summary>
                    <span className="material-symbols-sharp">info</span>
                    {t('termsAndConditions')}
                  </summary>
                  <p>{promo.terms}</p>
                </details>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default OtherPromosSection;
