'use client';

// components/HowItWorks/HowItWorks.jsx
// A "How It Works" section for Cobonat with cash back steps matching the provided design
// Usage: <HowItWorks locale="ar-SA" /> or <HowItWorks locale="en-SA" />

import './HowItWorks.css';

// SVG Illustration 1: Activate Cash Back (tap & offer)
function IllusActivate() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="52" fill="#EEF2FF" />
      <circle cx="60" cy="95" r="28" fill="#E0E7FF" opacity="0.5" />
      
      {/* Phone / Card background */}
      <rect x="28" y="22" width="48" height="68" rx="12" fill="#FFFFFF" stroke="#6366F1" strokeWidth="2" />
      
      {/* Screen with offer card */}
      <rect x="34" y="30" width="36" height="50" rx="6" fill="#F8FAFC" />
      <rect x="38" y="36" width="28" height="12" rx="4" fill="#FFFFFF" stroke="#E0E7FF" strokeWidth="1" />
      <text x="42" y="45" fontFamily="monospace" fontSize="6" fontWeight="bold" fill="#6366F1">20% CASH BACK</text>
      
      {/* Tag icon */}
      <rect x="38" y="54" width="28" height="8" rx="2" fill="#EEF2FF" />
      <circle cx="44" cy="58" r="2.5" fill="#10B981" />
      
      {/* Finger tap */}
      <path d="M84 48 Q92 48 94 54 Q96 60 90 64 L86 66 Q82 68 80 64 L78 56 Q76 52 80 50 Z" fill="#6366F1" opacity="0.8" />
      <circle cx="82" cy="56" r="3" fill="#FFFFFF" opacity="0.6" />
      
      {/* Ripple effect */}
      <circle cx="86" cy="58" r="8" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="2 3" fill="none" opacity="0.6" />
      
      {/* Sparkles */}
      <path d="M24 42 L26 38 L28 42 L24 42Z" fill="#F59E0B" />
      <path d="M98 28 L99.5 25 L101 28 L98 28Z" fill="#6366F1" />
    </svg>
  );
}

// SVG Illustration 2: Make Your Purchase (shopping bag & checkout)
function IllusPurchase() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="52" fill="#FEF3C7" />
      <circle cx="60" cy="95" r="28" fill="#FDE68A" opacity="0.4" />
      
      {/* Shopping Bag */}
      <path d="M38 44 L42 32 Q44 28 48 28 L72 28 Q76 28 78 32 L82 44 L84 44 L84 74 Q84 82 76 82 L44 82 Q36 82 36 74 L36 44 Z" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
      
      {/* Bag handle */}
      <path d="M48 28 Q48 20 56 18 Q64 16 68 22 Q72 26 72 28" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Item inside bag */}
      <rect x="44" y="52" width="32" height="18" rx="4" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="1.5" />
      <rect x="48" y="56" width="24" height="4" rx="2" fill="#F59E0B" opacity="0.6" />
      <rect x="50" y="62" width="20" height="4" rx="2" fill="#F59E0B" opacity="0.4" />
      
      {/* Price tag */}
      <circle cx="72" cy="48" r="10" fill="#10B981" />
      <text x="68" y="52" fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#FFFFFF">$</text>
      
      {/* Checkout / Cart icon */}
      <rect x="86" y="58" width="18" height="16" rx="4" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.5" />
      <circle cx="90" cy="76" r="3" fill="#10B981" />
      <circle cx="100" cy="76" r="3" fill="#10B981" />
      <path d="M88 62 L96 62 L98 72 L88 72 Z" fill="#D1FAE5" />
      
      {/* Arrow indicating purchase flow */}
      <path d="M92 70 L96 74 L92 78" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// SVG Illustration 3: Get Paid (email, money, notification)
function IllusGetPaid() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="52" fill="#D1FAE5" />
      <circle cx="60" cy="95" r="28" fill="#A7F3D0" opacity="0.4" />
      
      {/* Email / Envelope */}
      <rect x="28" y="38" width="56" height="36" rx="8" fill="#FFFFFF" stroke="#10B981" strokeWidth="2" />
      <path d="M28 44 L56 62 L84 44" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Dollar sign inside envelope */}
      <circle cx="56" cy="56" r="12" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
      <text x="52" y="61" fontFamily="monospace" fontSize="10" fontWeight="bold" fill="#F59E0B">$</text>
      
      {/* Notification badge */}
      <circle cx="78" cy="34" r="12" fill="#6366F1" />
      <text x="74" y="38.5" fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#FFFFFF">✓</text>
      
      {/* Coins falling */}
      <circle cx="24" cy="82" r="7" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
      <text x="20.5" y="85.5" fontFamily="monospace" fontSize="6" fontWeight="bold" fill="#B45309">$</text>
      
      <circle cx="38" cy="90" r="6" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1" />
      <text x="35.5" y="93" fontFamily="monospace" fontSize="5" fontWeight="bold" fill="#B45309">$</text>
      
      {/* Confirmation checkmark */}
      <circle cx="90" cy="84" r="14" fill="#10B981" />
      <path d="M84 84 L88 88 L96 80" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Small growth arrow */}
      <path d="M96 28 L100 22 L104 28" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="100" y1="22" x2="100" y2="34" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Bilingual content matching the uploaded image
const CONTENT = {
  ar: {
    eyebrow: 'استرداد النقود',
    title: ['استرداد نقدي', 'في 3 خطوات'],
    subtitle: 'فعّل الاسترداد النقدي، تسوّق كالمعتاد، واستلم أموالك بكل سهولة.',
    steps: [
      {
        title: 'فعّل الاسترداد النقدي',
        body: 'انقر على أي عرض مشارك لتفعيل الاسترداد النقدي وابدأ التسوق.',
      },
      {
        title: 'قم بشرائك',
        body: 'تسوّق وأكمل عملية الدفع كالمعتاد. احصل على استرداد نقدي للمشتريات المؤهلة.',
      },
      {
        title: 'احصل على أموالك',
        body: 'بعد الشراء، ابحث عن بريد إلكتروني يؤكد أن استردادك النقدي في طريقه إليك.',
      },
    ],
    cta: 'استكشف العروض الآن',
  },
  en: {
    eyebrow: 'Cash Back Rewards',
    title: ['Get Cash Back', 'in 3 Easy Steps'],
    subtitle: 'Activate offers, shop as usual, and get paid — it’s that simple.',
    steps: [
      {
        title: 'Activate Cash Back',
        body: 'Simply tap any participating offer to activate cash back and start shopping.',
      },
      {
        title: 'Make Your Purchase',
        body: 'Shop and checkout as you normally would. Earn cash back on eligible purchases.',
      },
      {
        title: 'Get Paid',
        body: 'After your purchase, look for an email confirming that your cash back is on its way.',
      },
    ],
    cta: 'Explore Offers Now',
  },
};

const ILLUSTRATIONS = [IllusActivate, IllusPurchase, IllusGetPaid];

export default function HowItWorks({ locale = 'en-SA' }) {
  const lang = locale?.split('-')[0] === 'en' ? 'en' : 'ar';
  const isAr = lang === 'ar';
  const c = CONTENT[lang];
  const dir = isAr ? 'rtl' : 'ltr';
  const stepNumbers = isAr ? ['١', '٢', '٣'] : ['1', '2', '3'];

  return (
    <section className="hiw-section" dir={dir} aria-labelledby="hiw-title">
      <div className="hiw-inner">
        {/* Header Section */}
        <header className="hiw-header">
          <div className="hiw-eyebrow">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 1l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 10l-4 2.5 1.5-4.5L2 5.5h4.5Z" fill="currentColor" />
            </svg>
            {c.eyebrow}
          </div>
          <h2 className="hiw-title" id="hiw-title">
            {c.title[0]} <span>{c.title[1]}</span>
          </h2>
          <p className="hiw-subtitle">{c.subtitle}</p>
        </header>

        {/* Steps Grid */}
        <div className="hiw-grid">
          {c.steps.map((step, index) => {
            const Illustration = ILLUSTRATIONS[index];
            return (
              <article key={index} className="hiw-card">
                <div className="hiw-step-badge" aria-label={`Step ${stepNumbers[index]}`}>
                  {stepNumbers[index]}
                </div>
                <div className="hiw-illus" aria-hidden="true">
                  <Illustration />
                </div>
                <h3 className="hiw-card-title">{step.title}</h3>
                <p className="hiw-card-body">{step.body}</p>
              </article>
            );
          })}
        </div>

        {/* Call to Action Button */}
        <div className="hiw-cta">
          <a href={`/${locale}/offers`} className="hiw-cta-btn">
            {c.cta}
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path
                fillRule="evenodd"
                d={isAr 
                  ? "M10.707 3.293a1 1 0 010 1.414L7.414 8l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  : "M5.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L8.586 8 5.293 4.707a1 1 0 010-1.414z"
                }
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
