// components/VoucherCard/VoucherCard.jsx - WITH EXPANDABLE DETAILS PANEL
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import "./VoucherCard.css";

const VoucherCard = ({ voucher, featured = false }) => {
  const locale = useLocale();
  const t = useTranslations('VoucherCard');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackValue, setFeedbackValue] = useState('');

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

  // ── Last updated ────────────────────────────────────────────────
  const getLastUpdatedTime = () => {
    if (!voucher.updatedAt) return null;
    const updated = new Date(voucher.updatedAt);
    const now = new Date();
    const diffHours = Math.floor((now - updated) / (1000 * 60 * 60));

    if (diffHours < 1) return isRtl ? 'محدث للتو' : 'Updated just now';
    if (diffHours < 24) return isRtl ? `محدث قبل ${diffHours} ساعة` : `Updated ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return isRtl ? 'محدث أمس' : 'Updated yesterday';
    if (diffDays < 7) return isRtl ? `محدث قبل ${diffDays} أيام` : `Updated ${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    return isRtl
      ? `محدث قبل ${diffWeeks} ${diffWeeks === 1 ? 'أسبوع' : 'أسابيع'}`
      : `Updated ${diffWeeks}w ago`;
  };

  // ── Relative time helper ─────────────────────────────────────────
  const getRelativeTime = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffMins = Math.floor((now - d) / (1000 * 60));
    if (diffMins < 1) return isRtl ? 'الآن' : 'just now';
    if (diffMins < 60) return isRtl ? `قبل ${diffMins} د` : `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return isRtl ? `قبل ${diffHours} س` : `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return isRtl ? 'أمس' : 'yesterday';
    if (diffDays < 30) return isRtl ? `قبل ${diffDays} يوم` : `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return isRtl ? `قبل ${diffMonths} شهر` : `${diffMonths}mo ago`;
  };

  // ── Date / expiry ───────────────────────────────────────────────
  const isExpired = voucher.expiryDate && new Date(voucher.expiryDate) < new Date();
  const isExpiringSoon = voucher.expiryDate &&
    !isExpired &&
    new Date(voucher.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const getDaysRemaining = () => {
    if (!voucher.expiryDate) return null;
    const diff = new Date(voucher.expiryDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString(
      isRtl ? 'ar-EG' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  // ── Discount display ─────────────────────────────────────────────
  const getDiscountText = () => {
    if (!voucher.discount) {
      return voucher.type === 'FREE_SHIPPING'
        ? (isRtl ? 'شحن\nمجاني' : 'FREE\nSHIP')
        : (isRtl ? 'عرض\nخاص' : 'DEAL');
    }
    const s = String(voucher.discount);
    if (s.includes('%')) return s;
    if (s.match(/^\d+$/)) return `${voucher.discount}%`;
    return s;
  };

  const getDiscountLabel = () => {
    if (voucher.type === 'FREE_SHIPPING') return isRtl ? 'شحن مجاني' : 'Free Shipping';
    if (voucher.discount) return isRtl ? 'خصم' : 'OFF';
    return isRtl ? 'عرض' : 'Deal';
  };

  // ── Analytics ────────────────────────────────────────────────────
  const timesUsed = voucher._count?.clicks ?? voucher.clickCount ?? 0;

  const getLastUsedTime = () => {
    if (voucher.clicks && voucher.clicks.length > 0) {
      return getRelativeTime(voucher.clicks[0].clickedAt);
    }
    return null;
  };

  // Build activity feed from clicks (anonymised)
  const getActivityFeed = () => {
    if (!voucher.clicks?.length) return [];
    return voucher.clicks.slice(0, 5).map((click, i) => ({
      id: click.id ?? i,
      label: isRtl ? `مستخدم ${click.id ?? i + 1}` : `User #${click.id ?? i + 1}`,
      action: isRtl ? `استخدم هذا الكود` : `used this code`,
      time: getRelativeTime(click.clickedAt),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${click.id ?? i}`,
    }));
  };

  const isActive = !isExpired &&
    (!voucher.startDate || new Date(voucher.startDate) <= new Date());

  const storeName = getStoreName();
  const storeSlug = getStoreSlug();
  const title = getVoucherTitle();
  const description = getVoucherDescription();
  const lastUpdated = getLastUpdatedTime();
  const lastUsed = getLastUsedTime();
  const daysRemaining = getDaysRemaining();
  const activityFeed = getActivityFeed();
  const discountText = getDiscountText();

  // ── Handlers ─────────────────────────────────────────────────────
  const handleCodeCopy = async () => {
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
      setTimeout(() => {
        window.open(voucher.landingUrl || voucher.store?.websiteUrl, '_blank');
      }, 600);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDealActivate = async () => {
    const [, countryCode] = locale.split('-');
    await fetch('/api/vouchers/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucherId: voucher.id, countryCode }),
    });
    window.open(voucher.landingUrl || voucher.store?.websiteUrl, '_blank');
  };

  const handleFeedbackSubmit = async (worked) => {
    setFeedbackSent(true);
    // Could call /api/vouchers/feedback here
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div
      className={`
        voucher-card-new
        ${isExpired ? 'expired' : ''}
        ${featured ? 'featured' : ''}
        ${expanded ? 'card-expanded' : ''}
      `}
    >
      {/* ═══ MAIN ROW ═══════════════════════════════════════════════ */}
      <div className="voucher-main-row">

        {/* LEFT — Discount Badge */}
        <div className="voucher-left-new">
          <div className="discount-badge-new">
            <div className="discount-value-new">{discountText}</div>
            <div className="discount-label-new">{getDiscountLabel()}</div>
          </div>
          {voucher.type === 'CODE' && (
            <div className="voucher-type-label">
              {isRtl ? 'كود' : t('labels.code')}
            </div>
          )}
        </div>

        {/* RIGHT — Content */}
        <div className="voucher-right-new">

          {/* Header */}
          <div className="voucher-header-new">
            {voucher.store && (
              <Link href={`/${locale}/stores/${storeSlug}`} className="store-link-new">
                <Image
                  src={voucher.store?.logo || '/placeholder_store.png'}
                  alt={storeName}
                  width={120}
                  height={120}
                  className="store-logo-new"
                />
              </Link>
            )}

            <div className="voucher-title-section">
              <h3 className="voucher-title-new">{title}</h3>
              <div className="voucher-meta-line">
                <span className="times-used">
                  {timesUsed} {t('meta.timesUsed')}
                </span>
                {lastUpdated && (
                  <>
                    <span className="meta-divider">•</span>
                    <span className="last-updated">{lastUpdated}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="voucher-actions-new">
            <div className="action-button-wrapper">
              {voucher.type === 'CODE' ? (
                <button
                  className={`show-code-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCodeCopy}
                  disabled={isExpired}
                >
                  {copied ? (
                    <>
                      <span className="material-symbols-sharp">check_circle</span>
                      {t('buttons.copied')}
                    </>
                  ) : (
                    <>
                      {t('buttons.copyShort')}
                      <span className="code-preview">{voucher.code || 'CODE'}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="get-deal-btn"
                  onClick={handleDealActivate}
                  disabled={isExpired}
                >
                  {t('buttons.getDeal')}
                  <span className="material-symbols-sharp">arrow_forward</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer Meta */}
          <div className="voucher-footer-new">
            {isActive && !isExpired && (
              <span className="meta-badge active">
                <span className="material-symbols-sharp">check_circle</span>
                {t('badges.active')}
              </span>
            )}
            {lastUsed && (
              <span className="meta-badge last-used">
                <span className="material-symbols-sharp">schedule</span>
                {t('meta.lastUsed')}: {lastUsed}
              </span>
            )}
            {isExpiringSoon && !isExpired && (
              <span className="meta-badge urgent">
                <span className="material-symbols-sharp">timer</span>
                {daysRemaining !== null
                  ? (isRtl ? `ينتهي خلال ${daysRemaining} يوم` : `Expires in ${daysRemaining}d`)
                  : t('meta.endingSoon')}
              </span>
            )}
            {isExpired && (
              <span className="meta-badge expired">
                <span className="material-symbols-sharp">block</span>
                {t('meta.expired')}
              </span>
            )}
            {voucher.isVerified && (
              <span className="meta-badge verified">
                <span className="material-symbols-sharp">verified</span>
                {t('badges.verified')}
              </span>
            )}
            {voucher.isExclusive && (
              <span className="meta-badge exclusive">
                <span className="material-symbols-sharp">star</span>
                {t('badges.exclusive')}
              </span>
            )}
          </div>

          {/* Toggle expand */}
          <button
            className="expand-toggle-btn"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span className="material-symbols-sharp expand-icon" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </span>
            <span className="expand-toggle-label">
              {expanded
                ? (isRtl ? 'إخفاء التفاصيل' : 'Hide details')
                : (isRtl ? 'عرض التفاصيل' : 'Show details')}
            </span>
          </button>
        </div>
      </div>

      {/* ═══ EXPANDED PANEL ══════════════════════════════════════════ */}
      <div className={`voucher-expanded-panel ${expanded ? 'panel-open' : ''}`}>
        <div className="expanded-panel-inner">

          {/* ── Stats row ──────────────────────────────────────────── */}
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-icon material-symbols-sharp">bar_chart</span>
              <span className="stat-value">{timesUsed.toLocaleString()}</span>
              <span className="stat-label">{isRtl ? 'إجمالي الاستخدامات' : 'Total Uses'}</span>
            </div>

            {lastUsed && (
              <div className="stat-box">
                <span className="stat-icon material-symbols-sharp">schedule</span>
                <span className="stat-value">{lastUsed}</span>
                <span className="stat-label">{isRtl ? 'آخر استخدام' : 'Last Used'}</span>
              </div>
            )}

            {voucher.expiryDate && (
              <div className="stat-box">
                <span className="stat-icon material-symbols-sharp">
                  {isExpired ? 'event_busy' : 'event_available'}
                </span>
                <span className="stat-value" style={isExpired ? { color: 'var(--color-danger)' } : {}}>
                  {isExpired
                    ? (isRtl ? 'منتهي' : 'Expired')
                    : (daysRemaining !== null
                      ? (isRtl ? `${daysRemaining} يوم` : `${daysRemaining}d left`)
                      : formatDate(voucher.expiryDate))}
                </span>
                <span className="stat-label">{isRtl ? 'تاريخ الانتهاء' : 'Expires'}</span>
              </div>
            )}

            {voucher.startDate && (
              <div className="stat-box">
                <span className="stat-icon material-symbols-sharp">event</span>
                <span className="stat-value">{formatDate(voucher.startDate)}</span>
                <span className="stat-label">{isRtl ? 'تاريخ البدء' : 'Start Date'}</span>
              </div>
            )}
          </div>

          {/* ── Activity feed ──────────────────────────────────────── */}
          {activityFeed.length > 0 && (
            <div className="activity-section">
              <h4 className="section-title">
                <span className="material-symbols-sharp">history</span>
                {isRtl ? 'سجل الاستخدامات' : 'Usage Activity'}
              </h4>
              <div className="activity-feed">
                {activityFeed.map((item) => (
                  <div key={item.id} className="activity-item">
                    <div className="activity-avatar">
                      <span className="material-symbols-sharp">person</span>
                    </div>
                    <div className="activity-content">
                      <span className="activity-label">{item.label}</span>
                      <span className="activity-action"> {item.action}</span>
                    </div>
                    <span className="activity-time">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Feedback ───────────────────────────────────────────── */}
          {!feedbackSent ? (
            <div className="feedback-section">
              <p className="feedback-prompt">
                <span className="material-symbols-sharp">help_outline</span>
                {isRtl ? 'هل نجح هذا الكود؟' : 'Did this code work for you?'}
              </p>
              <div className="feedback-actions">
                <button
                  className="feedback-btn feedback-yes"
                  onClick={() => handleFeedbackSubmit(true)}
                >
                  <span className="material-symbols-sharp">thumb_up</span>
                  {isRtl ? 'نعم، نجح' : 'Yes, it worked'}
                </button>
                <button
                  className="feedback-btn feedback-no"
                  onClick={() => handleFeedbackSubmit(false)}
                >
                  <span className="material-symbols-sharp">thumb_down</span>
                  {isRtl ? 'لا، لم ينجح' : "No, it didn't"}
                </button>
              </div>
            </div>
          ) : (
            <div className="feedback-thanks">
              <span className="material-symbols-sharp">check_circle</span>
              {isRtl ? 'شكراً على تقييمك!' : 'Thanks for your feedback!'}
            </div>
          )}

          {/* ── Detail section ─────────────────────────────────────── */}
          <div className="detail-section">
            <h4 className="section-title">
              <span className="material-symbols-sharp">info</span>
              {isRtl ? 'تفاصيل العرض' : 'About this offer'}
            </h4>

            {/* Code facts */}
            {voucher.discount && (
              <div className="detail-row fact-row">
                <span className="detail-icon material-symbols-sharp">sell</span>
                <div className="detail-text">
                  <span className="detail-label">{isRtl ? 'تفاصيل الخصم' : 'Code facts'}</span>
                  <span className="detail-value fact-value">
                    {isRtl
                      ? `يوفر هذا الكود خصم ${voucher.discount} على مشترياتك`
                      : `This code provides a discount of ${voucher.discount} on your purchase`}
                  </span>
                </div>
              </div>
            )}

            {/* Description / restrictions */}
            {description && (
              <div className="detail-row restriction-row">
                <span className="detail-icon material-symbols-sharp">warning_amber</span>
                <div className="detail-text">
                  <span className="detail-label">{isRtl ? 'شروط الاستخدام' : 'Code restrictions'}</span>
                  <span className="detail-value restriction-value">{description}</span>
                </div>
              </div>
            )}

            {/* Expiry */}
            {voucher.expiryDate && (
              <div className="detail-row">
                <span className="detail-icon material-symbols-sharp">event</span>
                <div className="detail-text">
                  <span className="detail-label">{isRtl ? 'صالح حتى' : 'Valid until'}</span>
                  <span className="detail-value">
                    {isExpired
                      ? (isRtl ? `انتهى في ${formatDate(voucher.expiryDate)}` : `Expired on ${formatDate(voucher.expiryDate)}`)
                      : formatDate(voucher.expiryDate)}
                  </span>
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="detail-row">
              <span className="detail-icon material-symbols-sharp">help_outline</span>
              <div className="detail-text">
                <span className="detail-label">{isRtl ? 'كيفية الاستخدام' : 'How this works'}</span>
                <span className="detail-value">
                  {voucher.type === 'CODE'
                    ? (isRtl
                      ? 'انقر على "نسخ الكود" ثم الصق الكود في حقل الكوبون عند الدفع على موقع المتجر.'
                      : 'Click "Copy Code", then paste the code in the coupon field at checkout on the store\'s website.')
                    : (isRtl
                      ? 'انقر على "الحصول على العرض" للانتقال إلى الصفحة المخصصة للعرض حيث سيُطبَّق الخصم تلقائياً.'
                      : 'Click "Get Deal" to go to the deal page where the discount is applied automatically.')}
                </span>
              </div>
            </div>
          </div>

          {/* ── Store link ─────────────────────────────────────────── */}
          <div className="expanded-footer">
            <Link
              href={`/${locale}/stores/${storeSlug}`}
              className="view-store-link"
            >
              <span className="material-symbols-sharp">storefront</span>
              {isRtl
                ? `عرض جميع كوبونات ${storeName}`
                : `View all ${storeName} coupons`}
              <span className="material-symbols-sharp arrow-icon">chevron_right</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VoucherCard;
