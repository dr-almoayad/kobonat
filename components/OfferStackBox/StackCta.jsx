'use client';
// components/OfferStackBox/StackCta.jsx

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function buildSteps(items, isAr) {
  return items.map((item, idx) => {
    const base = { num: idx + 1 };

    if (item.itemType === 'CODE') return {
      ...base, type: 'code', icon: 'confirmation_number',
      labelAr: 'كود الخصم', labelEn: 'Coupon Code',
      title: item.title, code: item.code,
      pct: item.discountPercent, url: item.landingUrl,
      instructions: isAr
        ? ['انتقل للمتجر عبر الرابط أدناه.', 'أضف المنتجات المطلوبة للسلة.', item.code ? 'في صفحة الدفع، أدخل الكود في خانة كود الخصم.' : 'الخصم يطبق تلقائياً على السلة.', 'تحقق من انخفاض الإجمالي قبل الإتمام.']
        : ['Visit the store via the link below.', 'Add items to your cart.', item.code ? 'At checkout, paste the code in the coupon field.' : 'Discount applies automatically to your cart.', 'Verify the total decreased before completing.'],
    };

    if (item.itemType === 'DEAL') return {
      ...base, type: 'deal', icon: 'bolt',
      labelAr: 'خصم تلقائي', labelEn: 'Auto Deal',
      title: item.title, pct: item.discountPercent, url: item.landingUrl,
      instructions: isAr
        ? ['اضغط "تفعيل العرض" للانتقال للمتجر.', 'الخصم مدمج في السعر المعروض مباشرةً.', 'أكمل الشراء دون الحاجة لأي كود.']
        : ['Click "Activate Deal" to visit the store.', 'The discount is already reflected in displayed prices.', 'Complete purchase — no code needed.'],
    };

    if (item.itemType === 'BANK_OFFER') return {
      ...base, type: 'bank', icon: 'account_balance',
      labelAr: 'عرض بنكي', labelEn: 'Bank Offer',
      title: item.title, pct: item.discountPercent,
      bankName: item.bankName, bankLogo: item.bankLogo, url: item.landingUrl,
      instructions: isAr
        ? [`ادفع ببطاقة ${item.bankName || 'البنك'} المؤهلة.`, item.code ? `أدخل الكود ${item.code} إن طُلب.` : 'الخصم يطبق تلقائياً عند استخدام البطاقة.', 'تحقق من ملخص الطلب قبل التأكيد.']
        : [`Pay using your ${item.bankName || 'bank'} card.`, item.code ? `Enter code ${item.code} if prompted.` : 'Cashback or discount applies automatically with the card.', 'Review the order summary before confirming.'],
    };

    return null;
  }).filter(Boolean);
}

function StackModal({ stack, isAr, onClose }) {
  const [copied, setCopied] = useState(null);
  const [mounted, setMounted] = useState(false);

  const ORDER = { CODE: 0, DEAL: 1, BANK_OFFER: 2 };
  const ordered = [...stack.items].sort((a, b) => (ORDER[a.itemType] ?? 9) - (ORDER[b.itemType] ?? 9));
  const steps = buildSteps(ordered, isAr);

  useEffect(() => { setMounted(true); }, []);

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

  function copy(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2200);
  }

  if (!mounted) return null;

  const modal = (
    <div
      className="os-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="os-modal" role="dialog" aria-modal="true">

        <div className="os-modal-strip" aria-hidden="true" />

        {/* Header */}
        <div className="os-modal__header">
          <div className="os-modal__brand">
            {/* Store logo — bare, no background, no filter */}
            {stack.store.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stack.store.logo}
                alt={stack.store.name}
                className="os-store-logo--large"
              />
            )}
            <div>
              <h2 className="os-modal__store-name">{stack.store.name}</h2>
              {stack.combinedSavingsPercent > 0 && (
                <p className="os-modal__subtitle">
                  <span className="material-symbols-sharp">savings</span>
                  {isAr
                    ? `توفير إجمالي يصل إلى ${stack.combinedSavingsPercent}%`
                    : `Stack saves up to ${stack.combinedSavingsPercent}%`}
                </p>
              )}
            </div>
          </div>

          <button className="os-modal__close" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'}>
            <span className="material-symbols-sharp">close</span>
          </button>
        </div>

        {/* Intro */}
        <div className="os-modal__intro-strip">
          <span className="material-symbols-sharp">info</span>
          <span>
            {isAr
              ? 'اتّبع هذه الخطوات بالترتيب المحدد لضمان تطبيق جميع العروض وتحقيق أقصى توفير ممكن.'
              : 'Follow these steps in exact order to ensure all offers stack correctly and maximise your savings.'}
          </span>
        </div>

        {/* Steps */}
        <div className="os-modal__body">
          <div className="os-timeline">
            {steps.map((step) => (
              <div key={step.num} className={`os-step os-step--${step.type}`}>
                <div className="os-step__marker">{step.num}</div>

                <div className="os-step__content">
                  <div className="os-step__head">
                    <span className="os-step__tag">
                      <span className="material-symbols-sharp">{step.icon}</span>
                      {isAr ? step.labelAr : step.labelEn}
                    </span>
                    {/* Bank logo — bare, full color, no filter */}
                    {step.bankLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={step.bankLogo}
                        alt={step.bankName || ''}
                        className="os-step__bank-logo"
                      />
                    )}
                  </div>

                  <h4 className="os-step__title">{step.title}</h4>

                  {step.code && (
                    <div className="os-copy-box">
                      <span className="os-copy-box__code">{step.code}</span>
                      <button
                        className={`os-copy-box__btn${copied === step.code ? ' copied' : ''}`}
                        onClick={() => copy(step.code)}
                        aria-label={isAr ? 'نسخ الكود' : 'Copy code'}
                      >
                        <span className="material-symbols-sharp">
                          {copied === step.code ? 'check' : 'content_copy'}
                        </span>
                        {copied === step.code
                          ? (isAr ? 'تم النسخ' : 'Copied')
                          : (isAr ? 'نسخ' : 'Copy')}
                      </button>
                    </div>
                  )}

                  <ul className="os-step__list">
                    {step.instructions.map((ins, i) => <li key={i}>{ins}</li>)}
                  </ul>

                  {step.url && (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="os-step__link"
                    >
                      {isAr ? 'الانتقال للعرض' : 'Go to offer'}
                      <span className="material-symbols-sharp">arrow_outward</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="os-modal__footer">
          <span className="material-symbols-sharp">info</span>
          <p>
            {isAr
              ? 'قد تتغير الشروط أو تنتهي العروض في أي وقت. تحقق من صفحة المتجر لأحدث الشروط.'
              : 'Offer terms may change or expire at any time. Check the store page for the latest conditions.'}
          </p>
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default function StackCta({ stack, locale }) {
  const [open, setOpen] = useState(false);
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';

  return (
    <>
      <button
        className="os-btn os-btn--primary"
        onClick={() => setOpen(true)}
        aria-label={isAr ? 'استخدم العروض المدمجة' : 'Apply stacked offers'}
      >
        {isAr ? 'استخدم العروض' : 'Apply Offers'}
        <span className="material-symbols-sharp">
          {isAr ? 'keyboard_arrow_left' : 'keyboard_arrow_right'}
        </span>
      </button>

      {open && (
        <StackModal
          stack={stack}
          isAr={isAr}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
