// components/PromoCodesFAQ/PromoCodesFAQ.jsx
'use client';

import { useTranslations } from 'next-intl';
import './PromoCodesFAQ.css';

/**
 * PromoCodesFAQ Component
 *
 * Two-column FAQ section with optional JSON‑LD schema injection.
 *
 * @param {boolean} includeStructuredData - If true, injects FAQPage schema.
 */
export default function PromoCodesFAQ({ includeStructuredData = false }) {
  const t = useTranslations('faq');

  // All FAQ items – keep in sync with the schema array for consistency
  const allQuestions = [
    // Usage
    { category: 'usage', key: 'how_to_use' },
    { category: 'usage', key: 'where_to_enter' },
    { category: 'usage', key: 'multiple_codes' },
    // Troubleshooting
    { category: 'troubleshooting', key: 'not_working' },
    { category: 'troubleshooting', key: 'invalid_code' },
    { category: 'troubleshooting', key: 'expired' },
    // Types
    { category: 'types', key: 'exclusive' },
    { category: 'types', key: 'difference' },
    { category: 'types', key: 'reuse' },
    { category: 'types', key: 'first_time' },
    // General
    { category: 'general', key: 'verified' },
    { category: 'general', key: 'update_frequency' },
    { category: 'general', key: 'request' },
    { category: 'general', key: 'account_needed' },
  ];

  // ── Helper: strip HTML tags for schema (clean plain text) ──
  const stripHtml = (html) => {
    if (typeof html !== 'string') return '';
    return html.replace(/<[^>]+>/g, '').trim();
  };

  // ── Build FAQPage schema entities ──
  const schemaEntities = allQuestions
    .map((item) => {
      const questionPath = `categories.${item.category}.questions.${item.key}`;
      const question = t(`${questionPath}.question`);
      const answerRaw = t.raw(`${questionPath}.answer`);
      const answer = stripHtml(typeof answerRaw === 'string' ? answerRaw : String(answerRaw));

      // Only include if both question and answer exist
      if (!question || !answer) return null;

      return {
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      };
    })
    .filter(Boolean);

  // ── Full FAQPage schema ──
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: schemaEntities,
  };

  return (
    <>
      {/* ── Inject JSON‑LD if requested ── */}
      {includeStructuredData && schemaEntities.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}

      {/* ── Visual FAQ Section ── */}
      <section className="faq-section">
        <div className="faq-header">
          <h2 className="faq-title">{t('title')}</h2>
        </div>

        <div className="faq-grid">
          {allQuestions.map((item) => (
            <div key={`${item.category}-${item.key}`} className="faq-item">
              <h3 className="faq-question">
                {t(`categories.${item.category}.questions.${item.key}.question`)}
              </h3>
              <div
                className="faq-answer"
                dangerouslySetInnerHTML={{
                  __html: t.raw(`categories.${item.category}.questions.${item.key}.answer`),
                }}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
