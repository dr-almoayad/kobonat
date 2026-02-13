// components/PromoCodesFAQ/PromoCodesFAQ.jsx
'use client';

import { useTranslations } from 'next-intl';
import './PromoCodesFAQ.css';

/**
 * PromoCodesFAQ Component
 * 
 * Clean, Expedia-style FAQ section about promo codes.
 * Two-column layout on desktop, single column on mobile.
 * No cards or borders - minimal, clean design.
 * 
 * @example
 * // Basic usage - no props needed
 * <PromoCodesFAQ />
 */

export default function PromoCodesFAQ() {
  const t = useTranslations('faq');

  // Flatten all questions into a single array for two-column layout
  const allQuestions = [
    // Usage questions
    { category: 'usage', key: 'how_to_use' },
    { category: 'usage', key: 'where_to_enter' },
    { category: 'usage', key: 'multiple_codes' },
    
    // Troubleshooting questions
    { category: 'troubleshooting', key: 'not_working' },
    { category: 'troubleshooting', key: 'invalid_code' },
    { category: 'troubleshooting', key: 'expired' },
    
    // Types questions
    { category: 'types', key: 'exclusive' },
    { category: 'types', key: 'difference' },
    { category: 'types', key: 'reuse' },
    { category: 'types', key: 'first_time' },
    
    // General questions
    { category: 'general', key: 'verified' },
    { category: 'general', key: 'update_frequency' },
    { category: 'general', key: 'request' },
    { category: 'general', key: 'account_needed' }
  ];

  return (
    <section className="faq-section">
      <div className="faq-header">
        <h2 className="faq-title">{t('title')}</h2>
      </div>

      <div className="faq-grid">
        {allQuestions.map((item, index) => (
          <div key={`${item.category}-${item.key}`} className="faq-item">
            <h3 className="faq-question">
              {t(`categories.${item.category}.questions.${item.key}.question`)}
            </h3>
            <div 
              className="faq-answer"
              dangerouslySetInnerHTML={{
                __html: t.raw(`categories.${item.category}.questions.${item.key}.answer`)
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
