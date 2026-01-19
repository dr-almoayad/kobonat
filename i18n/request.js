// i18n/request.js
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  // Validate locale
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale; // Default to 'ar-SA'
  }
  
  // Extract language code (e.g., 'ar-SA' -> 'ar')
  const languageCode = locale.split('-')[0];
  
  let messages;
  
  try {
    // Try to load locale-specific messages
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    try {
      // Fallback to language-specific messages
      messages = (await import(`../messages/${languageCode}.json`)).default;
    } catch (error2) {
      // Final fallback to default locale messages
      const defaultLanguageCode = routing.defaultLocale.split('-')[0];
      messages = (await import(`../messages/${defaultLanguageCode}.json`)).default;
    }
  }
  
  return {
    locale,
    messages,
  };
});