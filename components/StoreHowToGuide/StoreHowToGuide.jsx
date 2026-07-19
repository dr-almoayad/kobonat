// components/StoreHowToGuide/StoreHowToGuide.jsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import './StoreHowToGuide.css';

const TYPE_ICONS = {
  VOUCHER: 'confirmation_number',
  DEAL: 'local_fire_department',
  BANK: 'account_balance',
  CREDIT: 'wallet',
  GIFT_CARD: 'card_giftcard',
  BNPL: 'bolt',
};

const TYPE_LABELS = {
  VOUCHER: { ar: 'أكواد الخصم', en: 'Promo Codes' },
  DEAL: { ar: 'عروض مباشرة', en: 'Deals' },
  BANK: { ar: 'عروض البنوك والدفع', en: 'Bank & Payment Offers' },
  CREDIT: { ar: 'رصيد الموقع', en: 'In‑Site Credit' },
  GIFT_CARD: { ar: 'بطاقات الهدايا', en: 'Gift Cards' },
  BNPL: { ar: 'اشتر الآن وادفع لاحقاً', en: 'Buy Now, Pay Later' },
};

export default function StoreHowToGuide({ stepsByType, locale }) {
  const lang = locale?.split('-')[0] || 'en';
  const isRTL = lang === 'ar';
  const [activeTab, setActiveTab] = useState(null);

  const types = Object.keys(stepsByType).filter(t => stepsByType[t]?.length > 0);

  // Set first tab as active on mount
  useEffect(() => {
    if (types.length > 0 && !activeTab) {
      setActiveTab(types[0]);
    }
  }, [types, activeTab]);

  if (types.length === 0) return null;

  const currentSteps = activeTab ? stepsByType[activeTab] : [];

  return (
    <section className="stg-section" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="stg-container">
        <h2 className="stg-heading">
          {lang === 'ar' ? 'كيف تستخدم العروض؟' : 'How to Use These Offers'}
        </h2>

        {/* ── Tab bar ── */}
        <div className="stg-tabs" role="tablist">
          {types.map(type => (
            <button
              key={type}
              role="tab"
              aria-selected={activeTab === type}
              className={`stg-tab ${activeTab === type ? 'stg-tab--active' : ''}`}
              onClick={() => setActiveTab(type)}
            >
              <span className="material-symbols-sharp stg-tab-icon">{TYPE_ICONS[type] || 'help'}</span>
              <span>{TYPE_LABELS[type]?.[lang] || type}</span>
            </button>
          ))}
        </div>

        {/* ── Content panel ── */}
        <div className="stg-panel">
          {currentSteps.map((step, idx) => (
            <div key={step.id} className="stg-step">
              <div className="stg-step-number">{idx + 1}</div>
              <div className="stg-step-content">
                <h3 className="stg-step-title">{step.title}</h3>
                {step.description && (
                  <p className="stg-step-description">{step.description}</p>
                )}
                {step.bnplPartner && (
                  <div className="stg-bnpl-partner">
                    <span className="material-symbols-sharp">partners</span>
                    {lang === 'ar' ? 'متاح عبر' : 'Available via'} <strong>{step.bnplPartner}</strong>
                  </div>
                )}
                {step.images && step.images.length > 0 && (
                  <div className="stg-images">
                    {step.images.map((img, i) => (
                      <div key={i} className="stg-image-wrapper">
                        <Image
                          src={img}
                          alt={`Step ${idx + 1} image ${i + 1}`}
                          width={400}
                          height={300}
                          className="stg-image"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
