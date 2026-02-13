// components/PromoCodesFAQ/PromoCodesFAQ.jsx
'use client';

import { useTranslations } from 'next-intl';
import './PromoCodesFAQ.css';

export default function PromoCodesFAQ() {
  const t = useTranslations('faq');

  // Get all question keys for each category
  const categories = [
    {
      key: 'usage',
      questions: ['how_to_use', 'where_to_enter', 'multiple_codes']
    },
    {
      key: 'troubleshooting',
      questions: ['not_working', 'invalid_code', 'expired']
    },
    {
      key: 'types',
      questions: ['exclusive', 'difference', 'reuse', 'first_time']
    },
    {
      key: 'general',
      questions: ['verified', 'update_frequency', 'request', 'account_needed']
    }
  ];

  return (
    <section className="faq-section">
      <div className="faq-header">
        <h1 className="faq-title">{t('title')}</h1>
      </div>

      <div className="faq-container">
        {categories.map((category) => (
          <div key={category.key} className="faq-category">
            <h2 className="faq-category-title">
              {t(`categories.${category.key}.title`)}
            </h2>

            {category.questions.map((questionKey) => (
              <div key={questionKey} className="faq-item">
                <h3 className="faq-question">
                  {t(`categories.${category.key}.questions.${questionKey}.question`)}
                </h3>
                <p 
                  className="faq-answer"
                  dangerouslySetInnerHTML={{
                    __html: t.raw(`categories.${category.key}.questions.${questionKey}.answer`)
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
