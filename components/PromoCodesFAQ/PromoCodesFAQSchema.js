// components/PromoCodesFAQ/PromoCodesFAQSchema.js
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

/**
 * Returns an array of Schema.org Question entities for the general promo code FAQs.
 * Does NOT return a script tag. Used to merge into the main page @graph.
 */
export async function getGeneralFaqSchemaEntities(locale) {
  const t = await getTranslations({ locale, namespace: 'faq' });

  const mainEntity = ALL_QUESTIONS.map(({ category, key }) => {
    const questionPath = `categories.${category}.questions.${key}`;
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
  }).filter(Boolean);

  return mainEntity;
}
