// components/VoucherCard/VoucherCard.jsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
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
    // Detect mobile once on mount; updates on resize
    const check = () => { isMobileRef.current = window.innerWidth <= 640; };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const currentLanguage = locale.split('-')[0];
  const isRtl = currentLanguage === 'ar';

  // ── Text extractors ──────────────────────────────────────────────
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

  // ── Discount display ─────────────────────────────────────────────
  // Schema: voucher.discount (String?) | voucher.discountPercent (Float?)
  const getDiscountText = () => {
    if (voucher.discount) return voucher.discount;
    if (voucher.discountPercent != null) return `${Math.round(voucher.discountPercent)}%`;
    if (voucher.type === 'FREE_SHIPPING') return isRtl ? 'شحن\nمجاني' : 'FREE\nSHIP';
    if (voucher.type === 'DEAL') return isRtl ? 'عرض' : 'DEAL';
    return isRtl ? 'خصم' : 'SALE';
  };

  // ── Date helpers ─────────────────────────────────────────────────
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

  // ── Handlers ─────────────────────────────────────────────────────
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

  // Whole-card click: open modal on mobile, do nothing on desktop
  const handleCardClick = () => {
    if (isMobileRef.current) setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      {/* ═══ CARD ═══════════════════════════════════════════════════ */}
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
        {/* Ribbons */}
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

        {/* ── LEFT — Discount panel ───────────────────────────────── */}
        <div className="vc-left">
          {bestDeal && (
            <span className="vc-best-bolt material-symbols-sharp" aria-hidden="true">bolt</span>
          )}
          <div className="vc-discount">{discountText}</div>
        </div>

        {/* ── BODY ────────────────────────────────────────────────── */}
        <div className="vc-body">
          {/* Row 1 — Store logo (always visible, on its own line) */}
          {voucher.store && (
            <Link
              href={`/${locale}/stores/${storeSlug}`}
              className="vc-logo-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={voucher.store.logo || '/placeholder_store.png'}
                alt={storeName}
                className="vc-logo"
              />
            </Link>
          )}

          {/* Row 2 — Title */}
          <h3 className="vc-title">{title}</h3>

          {/* Row 3 — Description (desktop only) */}
          {description && <p className="vc-desc">{description}</p>}

          {/* Row 4 — Badges */}
          <div className="vc-badges">
            {isActive && !isExpired && (
              <span className="vc-badge vc-badge-active">
                <span className="material-symbols-sharp">check_circle</span>
                {t('badges.active')}
              </span>
            )}
            {isExpiringSoon && !isExpired && (
              <span className="vc-badge vc-badge-urgent">
                <span className="material-symbols-sharp">timer</span>
                {daysRemaining !== null
                  ? (isRtl ? `ينتهي خلال ${daysRemaining} يوم` : `${daysRemaining}d left`)
                  : (isRtl ? 'ينتهي قريباً' : 'Ending soon')}
              </span>
            )}
            {isExpired && (
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

          {/* Row 5 — Meta */}
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

        {/* ── RIGHT — Action buttons (desktop only) ───────────────── */}
        <div className="vc-actions">
          {voucher.type === 'CODE' ? (
            <button
              className={`vc-btn-primary ${copied ? 'vc-copied' : ''}`}
              onClick={handleCodeCopy}
              disabled={isExpired}
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
              disabled={isExpired}
            >
              <span className="material-symbols-sharp">arrow_outward</span>
              {isRtl ? 'تفعيل العرض' : 'Get Deal'}
            </button>
          )}

          <button
            className="vc-details-btn"
            onClick={handleDetailsClick}
            aria-label={isRtl ? 'عرض التفاصيل' : 'View details'}
          >
            <span className="material-symbols-sharp">info</span>
            {isRtl ? 'التفاصيل' : 'Details'}
          </button>
        </div>
      </div>

      {/* ═══ MODAL ══════════════════════════════════════════════════ */}
      {mounted && modalOpen && createPortal(
        <div
          className="vc-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={isRtl ? 'تفاصيل الكوبون' : 'Voucher details'}
        >
          <div
            className="vc-modal"
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Drag handle (mobile visual cue) */}
            <div className="vc-modal-handle" aria-hidden="true" />

            {/* Header */}
            <div className="vc-modal-header">
              <div className="vc-modal-identity">
                {voucher.store && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={voucher.store.logo || '/placeholder_store.png'}
                    alt={storeName}
                    className="vc-modal-logo"
                  />
                )}
                <div className="vc-modal-title-block">
                  <span className="vc-modal-store-name">{storeName}</span>
                  <span className="vc-modal-title">{title}</span>
                </div>
              </div>
              <button
                className="vc-modal-close"
                onClick={closeModal}
                aria-label={isRtl ? 'إغلاق' : 'Close'}
              >
                <span className="material-symbols-sharp">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="vc-modal-body">

              {/* How to use */}
              <div className="vc-modal-section">
                <h4 className="vc-modal-section-heading">
                  <span className="material-symbols-sharp">help_outline</span>
                  {isRtl ? 'كيفية الاستخدام' : 'How to use this offer'}
                </h4>

                {voucher.type === 'CODE' ? (
                  <ol className="vc-steps">
                    <li className="vc-step">
                      <div className="vc-step-num">1</div>
                      <div className="vc-step-content">
                        <strong>{isRtl ? 'انسخ الكود' : 'Copy the code'}</strong>
                        <span>
                          {isRtl
                            ? 'انقر على "نسخ الكود" أدناه وسيُحفظ الكود تلقائياً في الحافظة.'
                            : 'Tap "Copy Code" below — the code is saved to your clipboard automatically.'}
                        </span>
                      </div>
                    </li>
                    <li className="vc-step">
                      <div className="vc-step-num">2</div>
                      <div className="vc-step-content">
                        <strong>{isRtl ? 'تسوّق في المتجر' : 'Shop at the store'}</strong>
                        <span>
                          {isRtl
                            ? 'ستُحوَّل إلى موقع المتجر. أضف المنتجات التي تريدها إلى سلة التسوق.'
                            : "You'll be taken to the store. Add items to your cart."}
                        </span>
                      </div>
                    </li>
                    <li className="vc-step">
                      <div className="vc-step-num">3</div>
                      <div className="vc-step-content">
                        <strong>{isRtl ? 'الصق الكود عند الدفع' : 'Paste at checkout'}</strong>
                        <span>
                          {isRtl
                            ? 'في صفحة الدفع، ابحث عن حقل "كوبون الخصم" أو "كود الترقية"، الصق الكود واضغط تطبيق.'
                            : 'At checkout find the "Coupon" or "Promo Code" field, paste the code, and tap Apply.'}
                        </span>
                      </div>
                    </li>
                  </ol>
                ) : (
                  <div className="vc-deal-info-block">
                    <div className="vc-deal-icon-wrap">
                      <span className="material-symbols-sharp">bolt</span>
                    </div>
                    <div className="vc-deal-description">
                      <strong>{isRtl ? 'يُفعَّل تلقائياً — لا يلزم كود' : 'Auto-apply — no code needed'}</strong>
                      <span>
                        {isRtl
                          ? 'انقر على "تفعيل العرض" أدناه وستُحوَّل مباشرةً إلى صفحة العرض. سيُطبَّق الخصم تلقائياً.'
                          : "Tap \"Get Deal\" and you'll go straight to the discounted page. The discount applies automatically."}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="vc-modal-section">
                <h4 className="vc-modal-section-heading">
                  <span className="material-symbols-sharp">bar_chart</span>
                  {isRtl ? 'إحصائيات' : 'Stats'}
                </h4>
                <div className="vc-modal-stats-grid">
                  <div className="vc-stat-cell">
                    <span className="vc-stat-icon material-symbols-sharp">group</span>
                    <div className="vc-stat-value">{timesUsed.toLocaleString()}</div>
                    <div className="vc-stat-label">{isRtl ? 'إجمالي الاستخدامات' : 'Total uses'}</div>
                  </div>
                  {lastUsed && (
                    <div className="vc-stat-cell">
                      <span className="vc-stat-icon material-symbols-sharp">schedule</span>
                      <div className="vc-stat-value">{lastUsed}</div>
                      <div className="vc-stat-label">{isRtl ? 'آخر استخدام' : 'Last used'}</div>
                    </div>
                  )}
                  {voucher.expiryDate && (
                    <div className="vc-stat-cell">
                      <span
                        className="vc-stat-icon material-symbols-sharp"
                        style={isExpired ? { color: 'var(--vc-danger)' } : {}}
                      >
                        {isExpired ? 'event_busy' : 'event_available'}
                      </span>
                      <div
                        className="vc-stat-value"
                        style={
                          isExpired      ? { color: 'var(--vc-danger)' }  :
                          isExpiringSoon ? { color: 'var(--vc-warning)' } : {}
                        }
                      >
                        {isExpired
                          ? (isRtl ? 'منتهي' : 'Expired')
                          : daysRemaining !== null
                            ? (isRtl ? `${daysRemaining} يوم` : `${daysRemaining}d left`)
                            : formatDate(voucher.expiryDate)}
                      </div>
                      <div className="vc-stat-label">{isRtl ? 'صلاحية الكوبون' : 'Expiry'}</div>
                    </div>
                  )}
                  {lastUpdated && (
                    <div className="vc-stat-cell">
                      <span className="vc-stat-icon material-symbols-sharp">update</span>
                      <div className="vc-stat-value">
                        {lastUpdated.replace('Updated ', '').replace('محدث ', '')}
                      </div>
                      <div className="vc-stat-label">{isRtl ? 'آخر تحديث' : 'Last updated'}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms */}
              {(voucher.termsConditions || voucher.minSpendAmount || voucher.maxDiscountAmount) && (
                <div className="vc-modal-section">
                  <h4 className="vc-modal-section-heading">
                    <span className="material-symbols-sharp">gavel</span>
                    {isRtl ? 'الشروط والأحكام' : 'Terms & Conditions'}
                  </h4>
                  <div className="vc-terms-list">
                    {voucher.minSpendAmount && (
                      <div className="vc-term-item">
                        <span className="material-symbols-sharp">shopping_cart</span>
                        <span>
                          {isRtl
                            ? `الحد الأدنى للطلب: ${voucher.minSpendAmount} ر.س`
                            : `Minimum order: SAR ${voucher.minSpendAmount}`}
                        </span>
                      </div>
                    )}
                    {voucher.maxDiscountAmount && (
                      <div className="vc-term-item">
                        <span className="material-symbols-sharp">price_check</span>
                        <span>
                          {isRtl
                            ? `الحد الأقصى للخصم: ${voucher.maxDiscountAmount} ر.س`
                            : `Max discount: SAR ${voucher.maxDiscountAmount}`}
                        </span>
                      </div>
                    )}
                    {voucher.termsConditions && (
                      <div className="vc-term-item">
                        <span className="material-symbols-sharp">info</span>
                        <span>{voucher.termsConditions}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="vc-modal-footer">
              <Link
                href={`/${locale}/stores/${storeSlug}`}
                className="vc-modal-store-link"
                onClick={closeModal}
              >
                <span className="material-symbols-sharp">storefront</span>
                {isRtl ? `جميع كوبونات ${storeName}` : `All ${storeName} coupons`}
                <span className="material-symbols-sharp vc-chevron">chevron_right</span>
              </Link>

              {voucher.type === 'CODE' ? (
                <button
                  className={`vc-modal-cta vc-btn-primary ${copied ? 'vc-copied' : ''}`}
                  onClick={handleCodeCopy}
                  disabled={isExpired}
                >
                  {copied ? (
                    <><span className="material-symbols-sharp">check_circle</span>{isRtl ? 'تم النسخ!' : 'Copied!'}</>
                  ) : (
                    <><span className="material-symbols-sharp">content_copy</span>{isRtl ? 'نسخ الكود' : 'Copy Code'}</>
                  )}
                </button>
              ) : (
                <button
                  className="vc-modal-cta vc-btn-deal"
                  onClick={handleDealActivate}
                  disabled={isExpired}
                >
                  <span className="material-symbols-sharp">arrow_outward</span>
                  {isRtl ? 'تفعيل العرض' : 'Get Deal'}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default VoucherCard;
