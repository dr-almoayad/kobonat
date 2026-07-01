// components/PromoCodesFAQ/PromoCodesFAQ.jsx
// ✅ Fully corrected – Server Component with server‑rendered FAQ schema.
import { getTranslations } from 'next-intl/server';
import './PromoCodesFAQ.css';

// ── Helper: strip HTML tags for schema (clean plain text) ──
function stripHtml(html) {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, '').trim();
}

/**
 * PromoCodesFAQ Component (Server Component)
 *
 * Two-column FAQ section with optional JSON‑LD schema injection.
 *
 * @param {boolean} includeStructuredData - If true, injects FAQPage schema.
 * @param {string}  locale                 - Current locale (e.g., 'ar-SA', 'en-SA')
 */
export default async function PromoCodesFAQ({
  includeStructuredData = false,
  locale,
}) {
  // ── All FAQ items – keep in sync with the schema array for consistency ──
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

  // ── Get translations server‑side ──
  const t = await getTranslations({ locale, namespace: 'faq' });

  // ── Build FAQPage schema entities ──
  const schemaEntities = allQuestions
    .map((item) => {
      const questionPath = `categories.${item.category}.questions.${item.key}`;
      const question = t(`${questionPath}.question`);
      const answerRaw = t.raw(`${questionPath}.answer`);
      const answer = stripHtml(typeof answerRaw === 'string' ? answerRaw : String(answerRaw));

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

  // ── Rendered JSX ──
  return (
    <>
      {/* ── Inject JSON‑LD during SSR if requested ── */}
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
