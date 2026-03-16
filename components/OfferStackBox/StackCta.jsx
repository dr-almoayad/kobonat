'use client';
// components/OfferStackBox/StackCta.jsx

import { useState } from 'react';
import './StackModal.css';

function buildSteps(items, isAr) {
  const steps = [];
  const total = items.length;

  items.forEach((item, idx) => {
    const stepNum = idx + 1;

    if (item.itemType === 'CODE') {
      steps.push({
        num: stepNum, total, type: 'CODE', icon: 'confirmation_number', color: 'indigo',
        label: isAr ? 'كود الخصم' : 'Coupon Code',
        title: item.title, code: item.code, pct: item.discountPercent, url: item.landingUrl,
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
              item.code ? `At checkout, find the "Coupon Code" field and enter: ${item.code}` : 'The discount applies automatically — no code needed.',
              'Confirm the total drops before completing your order.',
            ],
      });
    }

    if (item.itemType === 'DEAL') {
      steps.push({
        num: stepNum, total, type: 'DEAL', icon: 'local_fire_department', color: 'green',
        label: isAr ? 'عرض' : 'Deal',
        title: item.title, pct: item.discountPercent, url: item.landingUrl,
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
        num: stepNum, total, type: 'BANK_OFFER', icon: 'account_balance', color: 'amber',
        label: isAr ? 'عرض بنكي' : 'Bank Offer',
        title: item.title, pct: item.discountPercent, bankName: item.bankName, bankLogo: item.bankLogo, url: item.landingUrl,
        instructions: isAr
          ? [
              `عند الدفع، اختر الدفع ببطاقة ${bankName}.`,
              item.code ? `أدخل الكود الخاص بالعرض البنكي: ${item.code}` : `سيُطبَّق الخصم تلقائياً عند استخدام بطاقة ${bankName} المؤهلة.`,
              'تحقق من انعكاس الخصم في ملخص الطلب قبل الإتمام.',
              item.landingUrl ? `اضغط "شروط العرض" للاطلاع على الأحكام الكاملة.` : 'راجع شروط العرض على موقع البنك.',
            ]
          : [
              `At checkout, select ${bankName} as your payment method.`,
              item.code ? `Enter the bank offer code: ${item.code}` : `The discount is applied automatically when you pay with an eligible ${bankName} card.`,
              'Verify the discount is reflected in the order summary before confirming.',
              item.landingUrl ? `Click "Offer Terms" to read the full conditions.` : `Check the full terms on ${bankName}'s website.`,
            ],
      });
    }
  });

  return steps;
}

function StepCard({ step, isAr, onCopy, copied }) {
  // Utilizing the more authoritative color palette
  const colorMap = {
    indigo: { bg: '#ffffff', border: '#cbd5e1', icon: '#0f172a', badge: '#4f46e5' },
    green:  { bg: '#ffffff', border: '#cbd5e1', icon: '#0f172a', badge: '#059669' },
    amber:  { bg: '#ffffff', border: '#cbd5e1', icon: '#0f172a', badge: '#d97706' },
  };
  const c = colorMap[step.color] || colorMap.indigo;

  return (
    <div className="sm-step" style={{ '--step-bg': c.bg, '--step-border': c.border }}>
      <div className="sm-step-header">
        <div className="sm-step-num" style={{ background: c.icon, color: '#fff' }}>
          {step.num}
        </div>
        <div className="sm-step-meta">
          <span className="sm-step-badge" style={{ color: c.badge }}>
            <span className="material-symbols-sharp">{step.icon}</span>
            {step.label}
          </span>
          {step.pct != null && (
            <span className="sm-step-pct">{step.pct}% {isAr ? 'خصم' : 'off'}</span>
          )}
        </div>
      </div>

      <div className="sm-step-title">{step.title}</div>

      {step.bankLogo && (
        <img src={step.bankLogo} alt={step.bankName || 'Bank'} className="sm-step-bank-logo" />
      )}

      {step.code && (
        <div className="sm-step-code-row">
          <span className="sm-step-code">{step.code}</span>
          <button
            className="sm-step-copy"
            onClick={() => onCopy(step.code)}
            style={{ background: copied === step.code ? '#059669' : '#f1f5f9', color: copied === step.code ? '#fff' : '#0f172a' }}
          >
            <span className="material-symbols-sharp">{copied === step.code ? 'check' : 'content_copy'}</span>
            {copied === step.code ? (isAr ? 'تم النسخ' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
          </button>
        </div>
      )}

      <ol className="sm-step-list">
        {step.instructions.map((ins, i) => <li key={i}>{ins}</li>)}
      </ol>

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

function StackModal({ stack, isAr, onClose }) {
  const [copied, setCopied] = useState(null);
  const steps = buildSteps(stack.items, isAr);

  function handleCopy(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const totalSaved = stack.combinedSavingsPercent;

  return (
    <div className="sm-backdrop" onClick={handleBackdrop} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="sm-panel">
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

        {totalSaved != null && totalSaved > 0 && (
          <div className="sm-savings-banner">
            <span className="material-symbols-sharp sm-savings-icon">workspace_premium</span>
            <span>
              {isAr
                ? <><strong>{totalSaved}%</strong> توفير إجمالي بدمج هذه العروض</>
                : <>Stack all offers and save up to <strong>{totalSaved}%</strong> total</>
              }
            </span>
          </div>
        )}

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

export default function StackCta({ stack, locale }) {
  const [open, setOpen] = useState(false);
  const lang = locale?.split('-')[0] || 'ar';
  const isAr = lang === 'ar';

  return (
    <>
      <button className="stack-cta-btn" onClick={() => setOpen(true)}>
        <span className="material-symbols-sharp">layers</span>
        {isAr ? 'احصل على الخصم المتراكم' : 'Stack & Save'}
      </button>

      {open && (
        <StackModal stack={stack} isAr={isAr} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
