// components/PromoCodesFAQ/PromoCodesFAQSchema.jsx
// Server component — emits FAQPage JSON-LD schema alongside the PromoCodesFAQ UI.
// Uses the same question list as PromoCodesFAQ.jsx so the schema always matches
// what is visually displayed on the page (a Google Search Console requirement).
//
// Usage:
//   import PromoCodesFAQSchema from '@/components/PromoCodesFAQ/PromoCodesFAQSchema';
//   <PromoCodesFAQSchema />   ← place immediately before <PromoCodesFAQ />

import { getTranslations } from 'next-intl/server';

// Mirrors the allQuestions array in PromoCodesFAQ.jsx exactly.
// If you add or remove questions there, update this list too.
const ALL_QUESTIONS = [
  { category: 'usage',           key: 'how_to_use'        },
  { category: 'usage',           key: 'where_to_enter'    },
  { category: 'usage',           key: 'multiple_codes'    },
  { category: 'troubleshooting', key: 'not_working'       },
  { category: 'troubleshooting', key: 'invalid_code'      },
  { category: 'troubleshooting', key: 'expired'           },
  { category: 'types',           key: 'exclusive'         },
  { category: 'types',           key: 'difference'        },
  { category: 'types',           key: 'reuse'             },
  { category: 'types',           key: 'first_time'        },
  { category: 'general',         key: 'verified'          },
  { category: 'general',         key: 'update_frequency'  },
  { category: 'general',         key: 'request'           },
  { category: 'general',         key: 'account_needed'    },
];

/** Strip HTML tags so schema answers contain plain text, not markup. */
function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export default async function PromoCodesFAQSchema() {
  const t = await getTranslations('faq');

  const mainEntity = ALL_QUESTIONS.map(({ category, key }) => {
    const questionPath = `categories.${category}.questions.${key}`;
    const question = t(`${questionPath}.question`);
    // t.raw() returns the raw JSON value which may contain HTML — strip it for schema.
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
  }).filter(Boolean);

  if (mainEntity.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
