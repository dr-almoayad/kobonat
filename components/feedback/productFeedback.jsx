// components/productFeedback/productFeedback.jsx
"use client";
import React, { useState } from "react";
import { useTranslations, useLocale } from 'next-intl';
import "./productFeedback.css";

const ProductFeedback = () => {
  const t = useTranslations('ProductFeedback');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);

  return (
    <section className="feedback-container" dir={isRtl ? "rtl" : "ltr"}>
      <div className="feedback-content">
        <div className="feedback-main">
          <div className="feedback-text-side">
            <h3 className="feedback-title">{t('title')}</h3>
            <p className="feedback-description">
              {t('text')}
            </p>
            <div className="feedback-actions">
              <button className="btn-feedback-primary" onClick={() => window.open('mailto:support@yourdomain.com')}>
                <span className="material-symbols-sharp">send</span>
                {t('ctaReport')}
              </button>
            </div>
          </div>

          <div className="disclaimer-card">
            <div className="disclaimer-header">
              <span className="material-symbols-sharp">info</span>
              <h4>{isRtl ? 'إفصاح الشركاء' : 'Affiliate Disclosure'}</h4>
            </div>
            <p className="disclaimer-text">
              {isRtl 
                ? 'نحن نساعدك في العثور على أفضل العروض. عند استخدام قسيمة أو النقر على رابط، قد نربح عمولة صغيرة دون أي تكلفة إضافية عليك.'
                : 'We help you find the best deals. When you use a coupon or click a link, we may earn a small commission at no extra cost to you.'
              }
            </p>
            <div className="disclaimer-links">
              <button className="text-link" onClick={() => {}}>{isRtl ? 'الشروط' : 'Terms'}</button>
              <span className="dot-separator">•</span>
              <button className="text-link" onClick={() => {}}>{isRtl ? 'الخصوصية' : 'Privacy'}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductFeedback;