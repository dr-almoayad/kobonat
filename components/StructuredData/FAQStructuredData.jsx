// components/StructuredData/FAQStructuredData.jsx
/**
 * FAQ Structured Data Component
 * ✅ FIX: Strips HTML from answers (Google requires plain text)
 * ✅ FIX: Gracefully handles missing translations
 * ✅ FIX: Added publisher reference to reinforce site name
 */

function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export default function FAQStructuredData({ faqs, locale }) {
  if (!faqs || faqs.length === 0) return null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
  const language = locale ? locale.split('-')[0] : 'ar';
  const isAr = language === 'ar';
  const brandName = isAr ? 'كوبونات' : 'Cobonat';

  const mainEntity = faqs
    .filter(faq => faq.isActive !== false)
    .map(faq => {
      const translation = faq.translations?.find(t => t.locale === language) || faq.translations?.[0];
      if (!translation?.question || !translation?.answer) return null;
      return {
        '@type': 'Question',
        name: translation.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: stripHtml(translation.answer), // ✅ plain text only
        },
      };
    })
    .filter(Boolean);

  if (mainEntity.length === 0) return null;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: brandName,
    },
    mainEntity,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}
