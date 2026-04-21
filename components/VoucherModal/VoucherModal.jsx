// components/VoucherModal/VoucherModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Global modal for voucher reveal. Features:
//  - Code display with one-tap copy
//  - Step-by-step Arabic application instructions
//  - "Banking Tips" section for extra cashback from Saudi banks
//  - 👍/👎 "Did this work?" feedback mechanism
//  - Tracks click via /api/vouchers/track when user navigates to store
//  - Portal-mounted so it never inherits broken z-index stacking
// ─────────────────────────────────────────────────────────────────────────────
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './VoucherModal.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const AR_STEPS_CODE = (code, storeName) => [
  {
    title: `انسخ الكود: ${code}`,
    desc:  'اضغط على زر "نسخ الكود" أعلاه — سيُحفظ الكود في الحافظة تلقائياً.',
  },
  {
    title: `تسوّق في ${storeName}`,
    desc:  'ستُحوَّل إلى موقع المتجر مباشرةً. أضف المنتجات التي تريدها إلى سلة التسوق.',
  },
  {
    title: 'انتقل إلى صفحة الدفع',
    desc:  'أكمل بيانات الشحن وتأكد من تحقق الشروط المطلوبة (الحد الأدنى للطلب، الفئات المؤهلة).',
  },
  {
    title: 'الصق الكود في خانة الخصم',
    desc:  'ابحث عن حقل "كوبون" أو "كود ترويجي"، الصق الكود، ثم اضغط "تطبيق". تحقق من انخفاض الإجمالي.',
  },
];

const AR_STEPS_DEAL = (storeName) => [
  {
    title: `انتقل إلى ${storeName}`,
    desc:  'اضغط زر "تفعيل العرض" أدناه — ستُحوَّل إلى صفحة العرض مباشرةً.',
  },
  {
    title: 'الخصم مفعَّل تلقائياً',
    desc:  'الخصم مدمج في الأسعار المعروضة. لا حاجة لأي كود — فقط أضف المنتج وادفع.',
  },
  {
    title: 'أكمل الشراء',
    desc:  'تحقق من مبلغ الخصم في ملخص الطلب قبل الضغط على "تأكيد الشراء".',
  },
];

const EN_STEPS_CODE = (code, storeName) => [
  {
    title: `Copy the code: ${code}`,
    desc:  'Press "Copy Code" above — the code is saved to your clipboard automatically.',
  },
  {
    title: `Shop at ${storeName}`,
    desc:  'You\'ll be taken to the store. Add items to your cart that qualify for the discount.',
  },
  {
    title: 'Go to checkout',
    desc:  'Complete shipping info and check that minimum spend or eligible categories are met.',
  },
  {
    title: 'Paste the code at checkout',
    desc:  'Find the "Coupon" or "Promo Code" field, paste the code, then tap Apply. Verify the total decreases.',
  },
];

const EN_STEPS_DEAL = (storeName) => [
  {
    title: `Visit ${storeName}`,
    desc:  'Click "Activate Deal" below — you\'ll be taken directly to the discounted page.',
  },
  {
    title: 'Discount is already applied',
    desc:  'The saving is reflected in displayed prices. No code needed — just add the item and pay.',
  },
  {
    title: 'Complete your purchase',
    desc:  'Verify the discount amount in the order summary before tapping "Confirm Order".',
  },
];

// Default bank tips — callers can override with prop
const DEFAULT_BANK_TIPS_AR = [
  'استخدم بطاقة مدى أو بطاقة فيزا من بنك الأهلي للحصول على استرداد نقدي إضافي يصل إلى 5٪.',
  'عروض تمارة وتابي تتيح لك الدفع على 4 أقساط دون فوائد — تحقق من صفحة الدفع.',
  'بعض عروض بنك الراجحي وسامبا تُضاف تلقائياً عند استخدام البطاقة المؤهلة في الدفع.',
];

const DEFAULT_BANK_TIPS_EN = [
  'Pay with your Alinma or Al Rajhi Visa card for an extra 5% cashback at checkout.',
  'Tamara & Tabby let you split into 4 interest-free instalments — check the payment page.',
  'Some bank offers are applied automatically when you use the eligible card at payment.',
];

// ── Helper ────────────────────────────────────────────────────────────────────

async function trackVoucherClick(voucherId, locale) {
  const [, countryCode] = (locale || 'ar-SA').split('-');
  try {
    await fetch('/api/vouchers/track', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ voucherId, countryCode }),
    });
  } catch {
    /* non-blocking */
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {object}   props
 * @param {boolean}  props.isOpen
 * @param {function} props.onClose
 * @param {object}   props.voucher      - Voucher record (id, code, type, title, etc.)
 * @param {object}   [props.store]      - Store record (name, logo, websiteUrl, slug)
 * @param {string}   [props.locale]     - "ar-SA" | "en-SA"
 * @param {string[]} [props.bankTips]   - Override default bank tips
 * @param {function} [props.onFeedback] - Called with "up" | "down"
 */
const VoucherModal = ({
  isOpen,
  onClose,
  voucher,
  store,
  locale = 'ar-SA',
  bankTips,
  onFeedback,
}) => {
  const isAr    = (locale?.split('-')[0] || 'ar') === 'ar';
  const dir     = isAr ? 'rtl' : 'ltr';
  const [mounted, setMounted]   = useState(false);
  const [copied,  setCopied]    = useState(false);
  const [feedback, setFeedback] = useState(null); // "up" | "down" | null
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  /* Lock body scroll while open */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  /* Reset state on open */
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setFeedback(null);
      setFeedbackSent(false);
    }
  }, [isOpen]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleCopy = useCallback(async () => {
    if (!voucher?.code) return;
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      if (navigator.vibrate) navigator.vibrate(40);
      setTimeout(() => setCopied(false), 3000);
    } catch { /* fallback: user sees code and can copy manually */ }
  }, [voucher?.code]);

  const handleGoToStore = useCallback(async () => {
    const url = voucher?.landingUrl || store?.websiteUrl;
    if (!url) return;
    if (voucher?.id) await trackVoucherClick(voucher.id, locale);
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  }, [voucher, store, locale, onClose]);

  const handleFeedback = useCallback((vote) => {
    setFeedback(vote);
    setFeedbackSent(true);
    onFeedback?.(vote);
  }, [onFeedback]);

  if (!mounted || !isOpen || !voucher) return null;

  const storeName  = store?.name || (isAr ? 'المتجر' : 'Store');
  const storeLogo  = store?.logo;
  const initial    = storeName?.[0]?.toUpperCase() || 'S';
  const isCode     = voucher.type === 'CODE';
  const voucherTitle = voucher.title || (isAr ? 'عرض خاص' : 'Special Offer');

  const steps = isAr
    ? (isCode ? AR_STEPS_CODE(voucher.code, storeName) : AR_STEPS_DEAL(storeName))
    : (isCode ? EN_STEPS_CODE(voucher.code, storeName) : EN_STEPS_DEAL(storeName));

  const tips = bankTips || (isAr ? DEFAULT_BANK_TIPS_AR : DEFAULT_BANK_TIPS_EN);

  const modal = (
    <div
      className="vm-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir={dir}
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'تفاصيل الكوبون' : 'Voucher details'}
    >
      <div className="vm-panel">
        <div className="vm-handle" aria-hidden="true" />
        <div className="vm-strip" aria-hidden="true" />

        {/* ── Header ── */}
        <div className="vm-header">
          <div className="vm-header-inner">
            {storeLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={storeLogo} alt={storeName} className="vm-store-logo" />
            ) : (
              <div className="vm-store-logo-fallback">{initial}</div>
            )}
            <div className="vm-title-block">
              <p className="vm-store-label">{storeName}</p>
              <h2 className="vm-title">{voucherTitle}</h2>
            </div>
          </div>
          <button
            className="vm-close"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <span className="material-symbols-sharp">close</span>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="vm-body">

          {/* Code reveal */}
          {isCode && (
            <div className="vm-section">
              <p className="vm-section-head">
                <span className="material-symbols-sharp">confirmation_number</span>
                {isAr ? 'كود الخصم' : 'Coupon Code'}
              </p>
              <div className="vm-code-box">
                <span className={`vm-code-value${!copied ? '' : ''}`}>
                  {voucher.code || '—'}
                </span>
                <button
                  className={`vm-copy-btn${copied ? ' vm-copy-btn--done' : ''}`}
                  onClick={handleCopy}
                  aria-label={isAr ? 'نسخ الكود' : 'Copy code'}
                >
                  <span className="material-symbols-sharp">
                    {copied ? 'check_circle' : 'content_copy'}
                  </span>
                  {copied
                    ? (isAr ? 'تم النسخ' : 'Copied!')
                    : (isAr ? 'نسخ الكود' : 'Copy Code')}
                </button>
              </div>
            </div>
          )}

          {/* Step-by-step instructions */}
          <div className="vm-section">
            <p className="vm-section-head">
              <span className="material-symbols-sharp">list_alt</span>
              {isAr ? 'خطوات تفعيل العرض' : 'How to Apply'}
            </p>
            <div className="vm-steps">
              {steps.map((step, i) => (
                <div key={i} className="vm-step">
                  <div className="vm-step-num">{i + 1}</div>
                  <div className="vm-step-body">
                    <p className="vm-step-title">{step.title}</p>
                    <p className="vm-step-desc">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banking tips */}
          <div className="vm-section">
            <div className="vm-bank-tips">
              <div className="vm-bank-tips-head">
                <div className="vm-bank-tips-icon">
                  <span className="material-symbols-sharp">account_balance</span>
                </div>
                <h4 className="vm-bank-tips-title">
                  {isAr ? '💳 نصائح بنكية — وفّر أكثر' : '💳 Banking Tips — Save More'}
                </h4>
              </div>
              {tips.map((tip, i) => (
                <div key={i} className="vm-bank-tip-item">{tip}</div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="vm-section">
            <div className="vm-feedback">
              <p className="vm-feedback-label">
                {isAr ? 'هل نجح الكود معك؟' : 'Did this code work for you?'}
              </p>
              {feedbackSent ? (
                <div className="vm-feedback-thanks">
                  <span className="material-symbols-sharp">favorite</span>
                  {isAr ? 'شكراً! رأيك يساعدنا.' : 'Thanks! Your feedback helps.'}
                </div>
              ) : (
                <div className="vm-feedback-btns">
                  <button
                    className={`vm-feedback-btn vm-feedback-btn--up${feedback === 'up' ? ' vm-feedback-btn--selected' : ''}`}
                    onClick={() => handleFeedback('up')}
                    aria-label={isAr ? 'نعم، نجح' : 'Yes, it worked'}
                  >
                    👍 {isAr ? 'نعم، نجح' : 'Worked'}
                  </button>
                  <button
                    className={`vm-feedback-btn vm-feedback-btn--down${feedback === 'down' ? ' vm-feedback-btn--selected' : ''}`}
                    onClick={() => handleFeedback('down')}
                    aria-label={isAr ? 'لا، لم ينجح' : "No, didn't work"}
                  >
                    👎 {isAr ? 'لم ينجح' : "Didn't work"}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Footer CTA ── */}
        <div className="vm-footer">
          <button className="vm-go-btn" onClick={handleGoToStore} type="button">
            <span className="material-symbols-sharp">
              {isCode ? 'redeem' : 'bolt'}
            </span>
            {isCode
              ? (isAr ? 'انتقل للمتجر واستخدم الكود' : 'Go to Store & Apply Code')
              : (isAr ? 'تفعيل العرض الآن'           : 'Activate Deal Now')}
            <span className="material-symbols-sharp" style={{ marginInlineStart: 'auto' }}>
              {isAr ? 'arrow_back' : 'arrow_forward'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default VoucherModal;
