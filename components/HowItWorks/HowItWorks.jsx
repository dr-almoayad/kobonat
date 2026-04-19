/* HowItWorks.jsx - Mobile First, Unique Design, Max Width 1312px */
'use client';
import React from 'react';
import './HowItWorks.css'; // import the separate CSS file

// ---------------------- Content (Unchanged) ----------------------
const CONTENT = {
  ar: {
    steps: [
      {
        title: 'ابحث عن كود خصم',
        desc: 'تصفّح متاجرك المفضلة واختر أفضل كود خصم أو عرض حصري يناسبك.',
      },
      {
        title: 'تسوّق كالمعتاد',
        desc: 'انتقل للمتجر وأضف منتجاتك للسلة وتسوّق كما تفعل دائماً بدون أي تعقيد.',
      },
      {
        title: 'وفّر فلوسك!',
        desc: 'عند الشراء ستصلك رسالة تأكيد بتطبيق الخصم أو استرداد الكاشباك في حسابك.',
      },
    ],
  },
  en: {
    steps: [
      {
        title: 'Choose A Code',
        desc: 'Simply tap any participating offer to copy the discount code and start shopping.',
      },
      {
        title: 'Make Your Purchase',
        desc: 'Shop as you normally would.',
      },
      {
        title: 'Get Paid',
        desc: 'Before finalizing your purchase, enter the discount code to activate it.',
      },
    ],
  },
};

// ---------------------- Icons (Preserved) ----------------------
function IconFind() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width={64} height={64}>
      <ellipse cx="30" cy="34" rx="26" ry="26" fill="#e0d9ff" />
      <ellipse cx="38" cy="28" rx="20" ry="20" fill="#a78bfa" opacity=".35" />
      <rect x="22" y="18" width="22" height="28" rx="4" fill="#fff" stroke="#7c3aed" strokeWidth="1.5" />
      <rect x="25" y="22" width="16" height="4" rx="2" fill="#ede9fe" />
      <line x1="25" y1="29" x2="38" y2="29" stroke="#c4b5fd" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="25" y1="33" x2="35" y2="33" stroke="#ddd6fe" strokeWidth="1" strokeLinecap="round" />
      <line x1="25" y1="37" x2="32" y2="37" stroke="#ddd6fe" strokeWidth="1" strokeLinecap="round" />
      <circle cx="44" cy="20" r="8" fill="#7c3aed" />
      <path d="M44 16 L45 19 L48 19 L45.5 21 L46.5 24 L44 22.5 L41.5 24 L42.5 21 L40 19 L43 19Z" fill="#fde68a" opacity=".9" />
    </svg>
  );
}

function IconShop() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width={64} height={64}>
      <ellipse cx="32" cy="36" rx="26" ry="24" fill="#fef9c3" />
      <ellipse cx="40" cy="28" rx="20" ry="18" fill="#fbbf24" opacity=".3" />
      <circle cx="32" cy="30" r="14" fill="#fff" stroke="#d97706" strokeWidth="1.5" />
      <path d="M24 27 L26 25 L36 25 L38 27 L37 34 L25 34Z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.2" />
      <circle cx="27" cy="36" r="2" fill="#f59e0b" />
      <circle cx="35" cy="36" r="2" fill="#f59e0b" />
      <line x1="28" y1="28.5" x2="36" y2="28.5" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" />
      <circle cx="20" cy="18" r="5" fill="#fbbf24" />
      <path d="M20 15.5 L20.6 17.3 L22.5 17.3 L21 18.4 L21.6 20.3 L20 19.2 L18.4 20.3 L19 18.4 L17.5 17.3 L19.4 17.3Z" fill="#fff" opacity=".9" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width={64} height={64}>
      <ellipse cx="30" cy="36" rx="26" ry="24" fill="#d1fae5" />
      <ellipse cx="38" cy="28" rx="20" ry="18" fill="#34d399" opacity=".3" />
      <rect x="18" y="24" width="30" height="22" rx="5" fill="#fff" stroke="#059669" strokeWidth="1.5" />
      <rect x="18" y="24" width="30" height="9" rx="5" fill="#059669" />
      <rect x="18" y="29" width="30" height="4" fill="#059669" />
      <rect x="32" y="30" width="12" height="12" rx="3" fill="#d1fae5" stroke="#059669" strokeWidth="1" />
      <circle cx="38" cy="36" r="3.5" fill="#34d399" opacity=".6" />
      <circle cx="38" cy="36" r="2" fill="#059669" />
      <rect x="22" y="33" width="7" height="7" rx="2" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth=".8" />
      <circle cx="18" cy="18" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      <circle cx="46" cy="46" r="8" fill="#059669" />
      <path d="M41.5 46 L44.5 49 L50.5 43" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = [IconFind, IconShop, IconSave];

// ---------------------- Main Component ----------------------
export default function HowItWorks({ locale = 'ar-SA' }) {
  const lang = locale?.split('-')[0] === 'en' ? 'en' : 'ar';
  const isAr = lang === 'ar';
  const { steps } = CONTENT[lang];

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} className="hiw-unique-section">
      <div className="hiw-unique-container">
        <div className="hiw-unique-grid">
          {steps.map((step, idx) => {
            const Icon = ICONS[idx];
            const stepNumber = idx + 1;
            return (
              <div key={idx} className="hiw-unique-card">
                <div className="hiw-unique-step-badge">{stepNumber}</div>
                <div className="hiw-unique-icon-wrapper">
                  <Icon />
                </div>
                <h3 className="hiw-unique-title">{step.title}</h3>
                <p className="hiw-unique-description">{step.desc}</p>
                <div className="hiw-unique-glow" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
