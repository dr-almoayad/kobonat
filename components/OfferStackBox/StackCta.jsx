'use client';
// components/OfferStackBox/StackCta.jsx
//
// Client wrapper for the OfferStackBox CTA.
// Receives serialised `stack` and `locale` as plain props from the RSC parent,
// handles modal state, and renders the step-by-step guide.

import { useState } from 'react';
import './StackModal.css';

// ─── Step builders ────────────────────────────────────────────────────────────
function buildSteps(items, isAr) {
  const steps = [];
  const total = items.length;

  items.forEach((item, idx) => {
    const stepNum = idx + 1;

    if (item.itemType === 'CODE') {
      steps.push({
        num:    stepNum,
        total,
        type:   'CODE',
        icon:   'confirmation_number',
        color:  'indigo',
        label:  isAr ? 'كود الخصم' : 'Coupon Code',
        title:  item.title,
        code:   item.code,
        pct:    item.discountPercent,
        url:    item.landingUrl,
        instructions: isAr
          ? [
              item.landingUrl ? 'اضغط على زر "تسوّق الآن" للانتقال إلى الموقع.' : 'انتقل إلى موقع المتجر.',
              'أضف المنتجات التي تريدها إلى سلة التسوق.',
              item.code ? `في خطوة الدفع، ابحث عن خانة "كود الخصم" والصق الكود: ${item.code}` : 'الخصم يُطبَّق تلقائياً — لا تحتاج كوداً.',
              'تحقق من انخفاض المبلغ الإجمالي قبل إتمام الطلب.',
            ]
          : [
              item.landingUrl ? 'Click "Shop Now" to go to the store.' : 'Visit the store website.',
              'Add the items you want to your cart.',
              item.code ? `At checkout, find the "Coupon Code" or "Promo Code" field and enter: ${item.code}` : 'The discount applies automatically — no code needed.',
              'Confirm the total drops before completing your order.',
            ],
      });
    }

    if (item.itemType === 'DEAL') {
      steps.push({
        num:    stepNum,
        total,
        type:   'DEAL',
        icon:   'local_fire_department',
        color:  'green',
        label:  isAr ? 'عرض' : 'Deal',
        title:  item.title,
        pct:    item.discountPercent,
        url:    item.landingUrl,
        instructions: isAr
          ? [
              item.landingUrl ? 'اضغط على "تفعيل العرض" للانتقال مباشرة إلى صفحة العرض.' : 'انتقل إلى صفحة العرض على الموقع.',
              'الخصم مُطبَّق تلقائياً على الأسعار المعروضة — لا يلزم كود.',
              'أضف المنتجات إلى سلة التسوق وأكمل الطلب.',
            ]
          : [
              item.landingUrl ? 'Click "Activate Deal" to go directly to the deal page.' : 'Navigate to the deal page on the store.',
              'The discount is already built into the displayed prices — no code required.',
              'Add items to your cart and complete checkout.',
            ],
      });
    }

    if (item.itemType === 'BANK_OFFER') {
      const bankName = item.bankName || (isAr ? 'البنك' : 'the bank');
      steps.push({
        num:    stepNum,
        total,
        type:   'BANK_OFFER',
        icon:   'account_balance',
        color:  'amber',
        label:  isAr ? 'عرض بنكي' : 'Bank Offer',
        title:  item.title,
        pct:    item.discountPercent,
        bankName: item.bankName,
        bankLogo: item.bankLogo,
        url:    item.landingUrl,
        instructions: isAr
          ? [
              `عند الدفع، اختر الدفع ببطاقة ${bankName}.`,
              item.code
                ? `أدخل الكود الخاص بالعرض البنكي: ${item.code}`
                : `سيُطبَّق الخصم تلقائياً عند استخدام بطاقة ${bankName} المؤهلة.`,
              'تحقق من انعكاس الخصم في ملخص الطلب قبل الإتمام.',
              item.landingUrl ? `اضغط "شروط العرض" للاطلاع على الأحكام الكاملة.` : 'راجع شروط العرض على موقع البنك.',
            ]
          : [
              `At checkout, select ${bankName} as your payment method.`,
              item.code
                ? `Enter the bank offer code: ${item.code}`
                : `The discount is applied automatically when you pay with an eligible ${bankName} card.`,
              'Verify the discount is reflected in the order summary before confirming.',
              item.landingUrl ? `Click "Offer Terms" to read the full conditions.` : `Check the full terms on ${bankName}'s website.`,
            ],
      });
    }
  });

  return steps;
}

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ step, isAr, onCopy, copied }) {
  const colorMap = {
    indigo: { bg: '#eef2ff', border: '#e0e7ff', icon: '#4338ca', badge: '#4338ca', badgeBg: '#eef2ff' },
    green:  { bg: '#f0fdf4', border: '#dcfce7', icon: '#15803d', badge: '#15803d', badgeBg: '#f0fdf4' },
    amber:  { bg: '#fefce8', border: '#fef08a', icon: '#a16207', badge: '#a16207', badgeBg: '#fefce8' },
  };
  const c = colorMap[step.color] || colorMap.indigo;

  return (
    <div className="sm-step" style={{ '--step-bg': c.bg, '--step-border': c.border }}>
      {/* Step header */}
      <div className="sm-step-header">
        <div className="sm-step-num" style={{ background: c.icon, color: '#fff' }}>
          {step.num}
        </div>
        <div className="sm-step-meta">
          <span className="sm-step-badge" style={{ background: c.badgeBg, color: c.badge, borderColor: c.border }}>
            <span className="material-symbols-sharp">{step.icon}</span>
            {step.label}
          </span>
          {step.pct != null && (
            <span className="sm-step-pct">{step.pct}% {isAr ? 'خصم' : 'off'}</span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="sm-step-title">{step.title}</div>

      {/* Bank logo */}
      {step.bankLogo && (
        <img src={step.bankLogo} alt={step.bankName || 'Bank'} className="sm-step-bank-logo" />
      )}

      {/* Code pill */}
      {step.code && (
        <div className="sm-step-code-row">
          <span className="sm-step-code">{step.code}</span>
          <button
            className="sm-step-copy"
            onClick={() => onCopy(step.code)}
            style={{ background: copied === step.code ? '#dcfce7' : '#f1f5f9', color: copied === step.code ? '#15803d' : '#334155' }}
          >
            <span className="material-symbols-sharp">{copied === step.code ? 'check' : 'content_copy'}</span>
            {copied === step.code ? (isAr ? 'تم النسخ' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
          </button>
        </div>
      )}

      {/* Instructions */}
      <ol className="sm-step-list">
        {step.instructions.map((ins, i) => <li key={i}>{ins}</li>)}
      </ol>

      {/* CTA link */}
      {step.url && (
        <a href={step.url} target="_blank" rel="noopener noreferrer" className="sm-step-link">
          <span className="material-symbols-sharp">open_in_new</span>
          {isAr
            ? (step.type === 'CODE' ? 'تسوّق الآن' : step.type === 'DEAL' ? 'تفعيل العرض' : 'شروط العرض')
            : (step.type === 'CODE' ? 'Shop Now' : step.type === 'DEAL' ? 'Activate Deal' : 'Offer Terms')
          }
        </a>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function StackModal({ stack, isAr, onClose }) {
  const [copied, setCopied] = useState(null);
  const steps = buildSteps(stack.items, isAr);

  function handleCopy(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const totalSaved = stack.combinedSavingsPercent;

  return (
    <div className="sm-backdrop" onClick={handleBackdrop} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="sm-panel">

        {/* Header */}
        <div className="sm-header">
          <div className="sm-header-left">
            {stack.store.logo && (
              <img src={stack.store.logo} alt={stack.store.name} className="sm-store-logo" />
            )}
            <div>
              <div className="sm-store-name">{stack.store.name}</div>
              <div className="sm-header-sub">
                {isAr ? 'كيف تطبّق العروض المتراكمة؟' : 'How to stack these offers'}
              </div>
            </div>
          </div>
          <button className="sm-close" onClick={onClose} aria-label="Close">
            <span className="material-symbols-sharp">close</span>
          </button>
        </div>

        {/* Savings summary banner */}
        {totalSaved != null && totalSaved > 0 && (
          <div className="sm-savings-banner">
            <span className="material-symbols-sharp sm-savings-icon">savings</span>
            <span>
              {isAr
                ? <><strong>{totalSaved}%</strong> توفير إجمالي بدمج هذه العروض</>
                : <>Stack all offers and save up to <strong>{totalSaved}%</strong> total</>
              }
            </span>
          </div>
        )}

        {/* Steps */}
        <div className="sm-body">
          <div className="sm-steps-intro">
            {isAr
              ? `اتبع هذه الخطوات ${steps.length === 2 ? 'الاثنتين' : steps.length === 3 ? 'الثلاث' : ''} بالترتيب للحصول على أقصى خصم ممكن.`
              : `Follow these ${steps.length} step${steps.length > 1 ? 's' : ''} in order to get the maximum discount.`
            }
          </div>

          {steps.map(step => (
            <StepCard key={step.num} step={step} isAr={isAr} onCopy={handleCopy} copied={copied} />
          ))}
        </div>

        {/* Footer */}
        <div className="sm-footer">
          <span className="material-symbols-sharp sm-footer-icon">info</span>
          <span>
            {isAr
              ? 'قد تتغير شروط العروض في أي وقت. تأكد دائماً من صلاحية الكود قبل إتمام طلبك.'
              : 'Offer terms may change at any time. Always verify the discount is applied before completing your order.'
            }
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── StackCta — exported; used by OfferStackBox RSC ──────────────────────────
export default function StackCta({ stack, locale }) {
  const [open, setOpen] = useState(false);
  const lang = locale?.split('-')[0] || 'ar';
  const isAr = lang === 'ar';

  return (
    <>
      <button className="stack-cta" onClick={() => setOpen(true)}>
        <span className="material-symbols-sharp">bolt</span>
        {isAr ? 'احصل على الخصم' : 'Stack & Save'}
        <span className="material-symbols-sharp">{isAr ? 'chevron_left' : 'chevron_right'}</span>
      </button>

      {open && (
        <StackModal stack={stack} isAr={isAr} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
