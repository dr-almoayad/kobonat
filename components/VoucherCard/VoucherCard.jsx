// components/VoucherCard/VoucherCard.jsx - WIDE LAYOUT WITH IMAGE STRIP
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

  // ── Store images for vertical strip ─────────────────────────────
  // Priority order: bigLogo → coverImage → backgroundImage → logo → placeholder
  const getStoreImages = () => {
    const imgs = [];
    if (voucher.store?.bigLogo)          imgs.push({ src: voucher.store.bigLogo,        type: 'bigLogo' });
    if (voucher.store?.coverImage)       imgs.push({ src: voucher.store.coverImage,      type: 'cover'   });
    if (voucher.store?.backgroundImage)  imgs.push({ src: voucher.store.backgroundImage, type: 'bg'      });
    if (voucher.store?.logo)             imgs.push({ src: voucher.store.logo,            type: 'logo'    });
    if (imgs.length === 0)               imgs.push({ src: '/placeholder_store.png',      type: 'logo'    });
    return imgs;
  };

  // ── Time helpers ─────────────────────────────────────────────────
  const getRelativeTime = (date) => {
    if (!date) return null;
    const diffMins = Math.floor((new Date() - new Date(date)) / 60000);
    if (diffMins < 1)  return isRtl ? 'الآن'                  : 'just now';
    if (diffMins < 60) return isRtl ? `قبل ${diffMins} د`      : `${diffMins}m ago`;
    const h = Math.floor(diffMins / 60);
    if (h < 24) return isRtl ? `قبل ${h} س`                   : `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d === 1) return isRtl ? 'أمس'                         : 'yesterday';
    if (d < 30)  return isRtl ? `قبل ${d} يوم`                : `${d}d ago`;
    return isRtl ? `قبل ${Math.floor(d / 30)} شهر`            : `${Math.floor(d / 30)}mo ago`;
  };

  const getLastUpdatedTime = () => {
    if (!voucher.updatedAt) return null;
    const h = Math.floor((new Date() - new Date(voucher.updatedAt)) / 3600000);
    if (h < 1)  return isRtl ? 'محدث للتو'                     : 'Updated just now';
    if (h < 24) return isRtl ? `محدث قبل ${h} ساعة`            : `Updated ${h}h ago`;
    const d = Math.floor(h / 24);
    if (d === 1) return isRtl ? 'محدث أمس'                     : 'Updated yesterday';
    if (d < 7)   return isRtl ? `محدث قبل ${d} أيام`           : `Updated ${d}d ago`;
    const w = Math.floor(d / 7);
    return isRtl
      ? `محدث قبل ${w} ${w === 1 ? 'أسبوع' : 'أسابيع'}`
      : `Updated ${w}w ago`;
  };

  const formatDate = (date) => date
    ? new Date(date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  // ── Expiry ───────────────────────────────────────────────────────
  const isExpired = voucher.expiryDate && new Date(voucher.expiryDate) < new Date();
  const isExpiringSoon = voucher.expiryDate && !isExpired &&
    new Date(voucher.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const daysRemaining = (() => {
    if (!voucher.expiryDate) return null;
    const d = Math.ceil((new Date(voucher.expiryDate) - new Date()) / 86400000);
    return d > 0 ? d : 0;
  })();
  const isActive = !isExpired && (!voucher.startDate || new Date(voucher.startDate) <= new Date());

  // ── Discount display ─────────────────────────────────────────────
  const getDiscountText = () => {
    if (!voucher.discount)
      return voucher.type === 'FREE_SHIPPING'
        ? (isRtl ? 'شحن مجاني' : 'Free Shipping')
        : (isRtl ? 'عرض خاص' : 'Special Deal');
    const s = String(voucher.discount);
    if (s.includes('%') || !s.match(/^\d+$/)) return s;
    return `${voucher.discount}%`;
  };

  // ── Analytics ────────────────────────────────────────────────────
  const timesUsed  = voucher._count?.clicks ?? voucher.clickCount ?? 0;
  const lastUsed   = voucher.clicks?.length > 0 ? getRelativeTime(voucher.clicks[0].clickedAt) : null;
  const activityFeed = (voucher.clicks ?? []).slice(0, 5).map((click, i) => ({
    id:     click.id ?? i,
    label:  isRtl ? `مستخدم ${click.id ?? i + 1}` : `User #${click.id ?? i + 1}`,
    action: isRtl ? 'استخدم هذا الكود' : 'used this code',
    time:   getRelativeTime(click.clickedAt),
  }));

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
      setTimeout(() => window.open(voucher.landingUrl || voucher.store?.websiteUrl, '_blank'), 600);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) { console.error('Failed to copy:', err); }
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

  // ── Render ────────────────────────────────────────────────────────
  const title       = getVoucherTitle();
  const description = getVoucherDescription();
  const storeName   = getStoreName();
  const storeSlug   = getStoreSlug();
  const storeImages = getStoreImages();
  const lastUpdated = getLastUpdatedTime();

  return (
    <div className={`
      voucher-card-new
      ${isExpired ? 'expired' : ''}
      ${featured ? 'featured' : ''}
      ${expanded ? 'card-expanded' : ''}
    `}>

      {/* ══════════════════════════════════════════════════════════
          MAIN ROW
      ══════════════════════════════════════════════════════════ */}
      <div className="voucher-main-row">

        {/* ── LEFT: Vertical Image Strip ─────────────────────── */}
        <Link
          href={`/${locale}/stores/${storeSlug}`}
          className="voucher-image-strip"
          tabIndex={-1}
          aria-label={storeName}
        >
          {/* Discount badge — overlaid on the strip */}
          <div className="strip-discount-overlay">
            <span className="strip-discount-value">{getDiscountText()}</span>
            {voucher.type === 'CODE' && (
              <span className="strip-type-pill">
                {isRtl ? 'كود' : t('labels.code')}
              </span>
            )}
          </div>

          {/* Images stacked, each slot fills equal share */}
          <div className="strip-images">
            {storeImages.map((img, idx) => (
              <div
                key={idx}
                className={`strip-image-slot strip-slot--${img.type}`}
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="180px"
                  className="strip-img"
                  style={{
                    objectFit: (img.type === 'logo' || img.type === 'bigLogo')
                      ? 'contain'
                      : 'cover',
                  }}
                />
              </div>
            ))}
          </div>
        </Link>

        {/* ── RIGHT: Content ──────────────────────────────────── */}
        <div className="voucher-right-new">

          {/* ── Header ── */}
          <div className="voucher-header-new">
            {/* Store name + status badges */}
            <div className="header-top-row">
              <Link href={`/${locale}/stores/${storeSlug}`} className="store-name-link">
                {storeName}
              </Link>
              <div className="header-badges">
                {isActive && !isExpired && (
                  <span className="meta-badge active">
                    <span className="material-symbols-sharp">check_circle</span>
                    {t('badges.active')}
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
                {isExpired && (
                  <span className="meta-badge expired">
                    <span className="material-symbols-sharp">block</span>
                    {t('meta.expired')}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h3 className="voucher-title-new">{title}</h3>

            {/* Meta line */}
            <div className="voucher-meta-line">
              <span className="times-used">
                <span className="material-symbols-sharp">bar_chart</span>
                {timesUsed.toLocaleString()} {t('meta.timesUsed')}
              </span>

              {lastUsed && (
                <>
                  <span className="meta-divider">·</span>
                  <span className="last-used-inline">
                    <span className="material-symbols-sharp">schedule</span>
                    {t('meta.lastUsed')}: {lastUsed}
                  </span>
                </>
              )}

              {lastUpdated && (
                <>
                  <span className="meta-divider">·</span>
                  <span className="last-updated">{lastUpdated}</span>
                </>
              )}

              {isExpiringSoon && !isExpired && (
                <>
                  <span className="meta-divider">·</span>
                  <span className="expiry-inline urgent-text">
                    <span className="material-symbols-sharp">timer</span>
                    {daysRemaining !== null
                      ? (isRtl ? `ينتهي خلال ${daysRemaining} يوم` : `Expires in ${daysRemaining}d`)
                      : t('meta.endingSoon')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ── Action button ── */}
          <div className="voucher-actions-new">
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
                    <span className="material-symbols-sharp copy-icon">content_copy</span>
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

          {/* ── Expand toggle ── */}
          <button
            className="expand-toggle-btn"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
          >
            <span
              className="material-symbols-sharp expand-icon"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
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

      {/* ══════════════════════════════════════════════════════════
          EXPANDED PANEL
      ══════════════════════════════════════════════════════════ */}
      <div className={`voucher-expanded-panel ${expanded ? 'panel-open' : ''}`}>
        <div className="expanded-panel-inner">

          {/* Stats */}
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
                  {isExpired ? (isRtl ? 'منتهي' : 'Expired')
                    : daysRemaining !== null
                      ? (isRtl ? `${daysRemaining} يوم` : `${daysRemaining}d left`)
                      : formatDate(voucher.expiryDate)}
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

          {/* Activity feed */}
          {activityFeed.length > 0 && (
            <div className="activity-section">
              <h4 className="section-title">
                <span className="material-symbols-sharp">history</span>
                {isRtl ? 'سجل الاستخدامات' : 'Usage Activity'}
              </h4>
              <div className="activity-feed">
                {activityFeed.map(item => (
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

          {/* Feedback */}
          {!feedbackSent ? (
            <div className="feedback-section">
              <p className="feedback-prompt">
                <span className="material-symbols-sharp">help_outline</span>
                {isRtl ? 'هل نجح هذا الكود؟' : 'Did this code work for you?'}
              </p>
              <div className="feedback-actions">
                <button className="feedback-btn feedback-yes" onClick={() => setFeedbackSent(true)}>
                  <span className="material-symbols-sharp">thumb_up</span>
                  {isRtl ? 'نعم، نجح' : 'Yes, it worked'}
                </button>
                <button className="feedback-btn feedback-no" onClick={() => setFeedbackSent(true)}>
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

          {/* About this offer */}
          <div className="detail-section">
            <h4 className="section-title">
              <span className="material-symbols-sharp">info</span>
              {isRtl ? 'تفاصيل العرض' : 'About this offer'}
            </h4>

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

            {description && (
              <div className="detail-row restriction-row">
                <span className="detail-icon material-symbols-sharp">warning_amber</span>
                <div className="detail-text">
                  <span className="detail-label">{isRtl ? 'شروط الاستخدام' : 'Code restrictions'}</span>
                  <span className="detail-value restriction-value">{description}</span>
                </div>
              </div>
            )}

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

            <div className="detail-row">
              <span className="detail-icon material-symbols-sharp">help_outline</span>
              <div className="detail-text">
                <span className="detail-label">{isRtl ? 'كيفية الاستخدام' : 'How this works'}</span>
                <span className="detail-value">
                  {voucher.type === 'CODE'
                    ? (isRtl
                      ? 'انقر على "نسخ الكود" ثم الصق الكود في حقل الكوبون عند الدفع على موقع المتجر.'
                      : 'Click "Copy Code", then paste it in the coupon field at checkout on the store\'s website.')
                    : (isRtl
                      ? 'انقر على "الحصول على العرض" للانتقال إلى الصفحة المخصصة حيث سيُطبَّق الخصم تلقائياً.'
                      : 'Click "Get Deal" to go to the deal page where the discount is applied automatically.')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="expanded-footer">
            <Link href={`/${locale}/stores/${storeSlug}`} className="view-store-link">
              <span className="material-symbols-sharp">storefront</span>
              {isRtl ? `عرض جميع كوبونات ${storeName}` : `View all ${storeName} coupons`}
              <span className="material-symbols-sharp arrow-icon">chevron_right</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VoucherCard;
