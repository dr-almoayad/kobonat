// lib/utils/translations.js
export function getTranslation(item, field, locale) {
  if (!item?.translations || !Array.isArray(item.translations)) {
    return item?.[field] || ''; // Fallback to direct access
  }
  
  const [language] = locale.split('-');
  const translation = item.translations.find(t => t.locale === language);
  
  return translation?.[field] || '';
}

export function transformTranslations(item, locale) {
  if (!item) return null;
  
  const [language] = locale.split('-');
  const translation = item.translations?.find(t => t.locale === language);
  
  return {
    ...item,
    name: translation?.name || '',
    slug: translation?.slug || '',
    description: translation?.description || null,
    title: translation?.title || '',
    question: translation?.question || '',
    answer: translation?.answer || ''
  };
}