'use client';
// components/OfferStackBox/StackCta.jsx

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './StackModal.css';

// ─── Build steps from items ─────────────────────────────────
function buildSteps(items, isAr) {
  return items
    .map((item, idx) => {
      const base = { num: idx + 1 };

      if (item.itemType === 'CODE') return {
        ...base, type: 'code',
        icon: 'confirmation_number',
        labelAr: 'كود الخصم', labelEn: 'Coupon Code',
        title: item.title, code: item.code,
        pct: item.discountPercent, url: item.landingUrl,
        instructions: isAr
          ? ['انتقل إلى موقع المتجر من خلال الرابط أدناه.', 'أضف المنتجات إلى سلة التسوق.', item.code ? `في صفحة الدفع، أدخل الكود في خانة "كوبون الخصم".` : 'الخصم يطبق تلقائياً — لا تحتاج كوداً.', 'تأكد من انخفاض المجموع قبل إتمام الطلب.']
          : ['Visit the store via the link below.', 'Add your items to the cart.', item.code ? 'At checkout, paste the code into the "Coupon Code" field.' : 'Discount applies automatically — no code needed.', 'Confirm the total has dropped before placing your order.'],
      };

      if (item.itemType === 'DEAL') return {
        ...base, type: 'deal',
        icon: 'local_fire_department',
        labelAr: 'خصم تلقائي', labelEn: 'Auto Deal',
        title: item.title, pct: item.discountPercent, url: item.landingUrl,
        instructions: isAr
          ? ['اضغط "تفعيل العرض" للذهاب مباشرة إلى صفحة العرض.', 'الخصم مُدمج في السعر — لا يلزم كود.', 'أضف المنتجات وأكمل عملية الشراء.']
          : ['Click "Activate Deal" to go to the offer page.', 'The discount is already applied to the listed prices — no code needed.', 'Add items and complete your purchase.'],
      };

      if (item.itemType === 'BANK_OFFER') return {
        ...base, type: 'bank',
        icon: 'account_balance',
        labelAr: 'عرض بنكي', labelEn: 'Bank Offer',
        title: item.title, pct: item.discountPercent,
        bankName: item.bankName, bankLogo: item.bankLogo, url: item.landingUrl,
        instructions: isAr
          ? [`اختر الدفع ببطاقة ${item.bankName || 'البنك'} عند الدفع.`, item.code ? `أدخل كود العرض: ${item.code}` : `الخصم يطبق تلقائياً ببطاقة ${item.bankName || 'البنك'} المؤهلة.`, 'تحقق من ظهور الخصم في ملخص الطلب قبل تأكيده.']
          : [`At checkout, select ${item.bankName || 'the bank'} as your payment method.`, item.code ? `Enter the offer code: ${item.code}` : `Discount applies automatically with an eligible ${item.bankName || 'bank'} card.`, 'Verify the saving shows in the order summary before confirming.'],
      };

      return null;
    })
    .filter(Boolean);
}

// ─── Modal component ────────────────────────────────────────
function StackModal({ stack, isAr, onClose }) {
  const [copied, setCopied] = useState(null);
  const steps = buildSteps(stack.items, isAr);

  function copy(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2400);
  }

  return (
    <div
      className="sbm-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="sbm-panel" role="dialog" aria-modal="true">

        {/* Blue header */}
        <div className="sbm-head">
          <div className="sbm-head__row">
            <div className="sbm-head__store">
              {stack.store.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={stack.store.logo} alt={stack.store.name} className="sbm-head__logo" />
              )}
              <span className="sbm-head__name">{stack.store.name}</span>
            </div>
            <button className="sbm-close" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'}>
              <span className="material-symbols-sharp">close</span>
            </button>
          </div>

          {stack.combinedSavingsPercent > 0 && (
            <div className="sbm-savings">
              <span className="material-symbols-sharp">savings</span>
              <span className="sbm-savings__text">
                {isAr
                  ? <><strong>وفّر حتى {stack.combinedSavingsPercent}٪</strong> بدمج جميع العروض</>
                  : <>Stack all offers and save up to <strong>{stack.combinedSavingsPercent}% total</strong></>
                }
              </span>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="sbm-body">
          <p className="sbm-intro">
            {isAr
              ? `اتبع هذه الخطوات ${steps.length > 1 ? 'بالترتيب' : ''} للحصول على أقصى خصم في ${stack.store.name}.`
              : `Follow these ${steps.length} step${steps.length !== 1 ? 's' : ''} in order to maximise your savings at ${stack.store.name}.`
            }
          </p>

          <div className="sbm-steps">
            {steps.map(step => (
              <div key={step.num} className={`sbm-step sbm-step--${step.type}`}>
                <div className="sbm-step__num">{step.num}</div>
                <div className="sbm-step__body">

                  <div className="sbm-step__tag">
                    <span className="material-symbols-sharp">{step.icon}</span>
                    {isAr ? step.labelAr : step.labelEn}
                    {step.pct != null && ` · ${step.pct}%`}
                  </div>

                  <div className="sbm-step__title">{step.title}</div>

                  {step.bankLogo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={step.bankLogo} alt={step.bankName || ''} className="sbm-step__bank-logo" />
                  )}

                  {step.code && (
                    <div className="sbm-code-block">
                      <span className="sbm-code-val">{step.code}</span>
                      <button
                        className={`sbm-code-copy${copied === step.code ? ' sbm-code-copy--done' : ''}`}
                        onClick={() => copy(step.code)}
                      >
                        <span className="material-symbols-sharp">
                          {copied === step.code ? 'check' : 'content_copy'}
                        </span>
                        {copied === step.code
                          ? (isAr ? 'تم' : 'Copied')
                          : (isAr ? 'نسخ' : 'Copy')}
                      </button>
                    </div>
                  )}

                  <ul className="sbm-list">
                    {step.instructions.map((ins, i) => <li key={i}>{ins}</li>)}
                  </ul>

                  {step.url && (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sbm-step-link"
                    >
                      <span className="material-symbols-sharp">open_in_new</span>
                      {isAr
                        ? (step.type === 'code' ? 'تسوّق الآن' : step.type === 'deal' ? 'تفعيل العرض' : 'شروط العرض')
                        : (step.type === 'code' ? 'Shop Now'   : step.type === 'deal' ? 'Activate Deal' : 'Offer Terms')
                      }
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sbm-foot" dir={isAr ? 'rtl' : 'ltr'}>
          <span className="material-symbols-sharp">info</span>
          <p>
            {isAr
              ? 'قد تتغير شروط العروض. تأكد دائماً من تطبيق الخصم قبل إتمام طلبك.'
              : 'Offer terms may change. Always confirm the discount is applied before completing your purchase.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Exported CTA — renders ghost + orange buttons + modal ───────
export default function StackCta({ stack, locale }) {
  const [open, setOpen] = useState(false);
  // Track whether we're mounted on the client so createPortal works safely
  const [mounted, setMounted] = useState(false);
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';

  useEffect(() => { setMounted(true); }, []);

  const modal = open ? (
    <StackModal stack={stack} isAr={isAr} onClose={() => setOpen(false)} />
  ) : null;

  return (
    <>
      <button className="sb-btn-ghost" onClick={() => setOpen(true)}>
        {isAr ? 'كيف تستخدمها؟' : 'How to stack'}
      </button>

      <button className="sb-btn-primary" onClick={() => setOpen(true)}>
        {isAr ? 'احصل على الخصم' : 'Get the deal'}
        <span className="material-symbols-sharp">
          {isAr ? 'arrow_back' : 'arrow_forward'}
        </span>
      </button>

      {/*
        Portal to document.body — escapes the card's overflow:hidden and
        any transform/will-change stacking context that would trap
        position:fixed inside the card's bounds.
      */}
      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
