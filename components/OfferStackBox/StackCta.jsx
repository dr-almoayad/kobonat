'use client';
// components/OfferStackBox/StackCta.jsx

import { useState } from 'react';

function buildSteps(items, isAr) {
  return items.map((item, idx) => {
    const base = { num: idx + 1 };
    
    if (item.itemType === 'CODE') return {
      ...base, type: 'code', icon: 'confirmation_number',
      labelAr: 'كود الخصم', labelEn: 'Coupon Code',
      title: item.title, code: item.code, pct: item.discountPercent, url: item.landingUrl,
      instructions: isAr
        ? ['انتقل إلى المتجر من الرابط أدناه.', 'أضف المنتجات لسلة التسوق.', item.code ? 'في صفحة الدفع، أدخل الكود في خانة الكوبون.' : 'الخصم يطبق تلقائياً.', 'تأكد من انخفاض المجموع.']
        : ['Visit the store via the link.', 'Add items to cart.', item.code ? 'Paste the code at checkout.' : 'Discount applies automatically.', 'Confirm the total dropped.'],
    };

    if (item.itemType === 'DEAL') return {
      ...base, type: 'deal', icon: 'local_fire_department',
      labelAr: 'خصم تلقائي', labelEn: 'Auto Deal',
      title: item.title, pct: item.discountPercent, url: item.landingUrl,
      instructions: isAr
        ? ['اضغط "تفعيل العرض".', 'الخصم مُدمج في السعر النهائي.', 'أكمل الشراء.']
        : ['Click "Activate Deal".', 'Discount is already applied to prices.', 'Complete purchase.'],
    };

    if (item.itemType === 'BANK_OFFER') return {
      ...base, type: 'bank', icon: 'account_balance',
      labelAr: 'عرض بنكي', labelEn: 'Bank Offer',
      title: item.title, pct: item.discountPercent, bankName: item.bankName, bankLogo: item.bankLogo, url: item.landingUrl,
      instructions: isAr
        ? [`ادفع ببطاقة ${item.bankName || 'البنك'}.`, item.code ? `أدخل الكود: ${item.code}` : `الخصم يطبق تلقائياً بالبطاقة المؤهلة.`, 'تحقق من ملخص الطلب.']
        : [`Pay with your ${item.bankName || 'bank'} card.`, item.code ? `Enter code: ${item.code}` : `Applies automatically with eligible card.`, 'Verify the order summary.'],
    };

    return null;
  }).filter(Boolean);
}

function StackModal({ stack, isAr, onClose }) {
  const [copied, setCopied] = useState(null);
  const steps = buildSteps(stack.items, isAr);

  function copy(code) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="os-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="os-modal" role="dialog" aria-modal="true">
        <button className="os-modal__close" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'}>
          <span className="material-symbols-sharp">close</span>
        </button>

        <div className="os-modal__header">
          <div className="os-modal__brand">
            {stack.store.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stack.store.logo} alt={stack.store.name} className="os-store-logo os-store-logo--large" />
            )}
            <div>
              <h2 className="os-modal__title">{stack.store.name}</h2>
              {stack.combinedSavingsPercent > 0 && (
                <p className="os-modal__subtitle">
                  {isAr ? `توفير إجمالي يصل إلى ${stack.combinedSavingsPercent}%` : `Save up to ${stack.combinedSavingsPercent}% total`}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="os-modal__body">
          <p className="os-modal__intro">
            {isAr ? 'اتبع هذه الخطوات بالترتيب لضمان الحصول على أقصى توفير:' : 'Follow these steps in order to maximize your savings:'}
          </p>

          <div className="os-timeline">
            {steps.map((step) => (
              <div key={step.num} className="os-step">
                <div className="os-step__marker">{step.num}</div>
                <div className="os-step__content">
                  <div className="os-step__head">
                    <span className={`os-step__tag os-step__tag--${step.type}`}>
                      <span className="material-symbols-sharp">{step.icon}</span>
                      {isAr ? step.labelAr : step.labelEn}
                    </span>
                    {step.bankLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={step.bankLogo} alt={step.bankName || ''} className="os-bank-logo" />
                    )}
                  </div>
                  
                  <h4 className="os-step__title">{step.title}</h4>

                  {step.code && (
                    <div className="os-copy-box">
                      <span className="os-copy-box__code">{step.code}</span>
                      <button className={`os-copy-box__btn ${copied === step.code ? 'copied' : ''}`} onClick={() => copy(step.code)}>
                        <span className="material-symbols-sharp">{copied === step.code ? 'check' : 'content_copy'}</span>
                        {copied === step.code ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الكود' : 'Copy Code')}
                      </button>
                    </div>
                  )}

                  <ul className="os-step__list">
                    {step.instructions.map((ins, i) => <li key={i}>{ins}</li>)}
                  </ul>

                  {step.url && (
                    <a href={step.url} target="_blank" rel="noopener noreferrer" className="os-step__link">
                      {isAr ? 'الذهاب للعرض' : 'Go to Offer'} <span className="material-symbols-sharp">arrow_outward</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StackCta({ stack, locale }) {
  const [open, setOpen] = useState(false);
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';

  return (
    <>
      <button className="os-btn os-btn--ghost" onClick={() => setOpen(true)}>
        <span className="material-symbols-sharp">help</span>
        {isAr ? 'كيف تعمل؟' : 'How it works'}
      </button>
      <button className="os-btn os-btn--primary" onClick={() => setOpen(true)}>
        {isAr ? 'استخدم العروض' : 'Apply Offers'}
        <span className="material-symbols-sharp">{isAr ? 'keyboard_arrow_left' : 'keyboard_arrow_right'}</span>
      </button>
      {open && <StackModal stack={stack} isAr={isAr} onClose={() => setOpen(false)} />}
    </>
  );
}
