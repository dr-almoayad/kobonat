
'use client';
import React from 'react';
import './StoreFAQ.css';

const StoreFAQ = ({ faqs = [], locale = 'ar-SA', storeName = '', countryName = '' }) => {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const [language] = locale.split('-');
  const isArabic = language === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';

  return (
    <section className="store-faq-section" dir={dir}>
      <div className="store-faq-container">
        <div className="store-faq-header">
          <h2 className="store-faq-title">
            {isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h2>
          {storeName && countryName && (
            <p className="store-faq-subtitle">
              {isArabic 
                ? `الأسئلة الشائعة حول ${storeName} في ${countryName}`
                : `Common questions about ${storeName} in ${countryName}`
              }
            </p>
          )}
        </div>

        <div className="store-faq-list">
          {faqs.map((faq, index) => {
            // ✅ FIX: Access translations properly
            const translation = faq.translations?.[0];
            const question = translation?.question || '';
            const answer = translation?.answer || '';

            // Skip if no translation found
            if (!question || !answer) return null;

            return (
              <div key={faq.id} className="store-faq-item">
                <div className="store-faq-question">
                  <span className="faq-number">{index + 1}</span>
                  <h3 className="store-faq-question-text">{question}</h3>
                </div>

                <div className="store-faq-answer">
                  <p>{answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StoreFAQ;
