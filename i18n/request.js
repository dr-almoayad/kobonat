// i18n/request.js
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  // ✅ Only ar-SA is supported; fallback always to ar-SA
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale; // 'ar-SA'
  }
  
  // Load messages – only ar-SA.json exists
  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    // Ultimate fallback (should not happen if messages/ar-SA.json exists)
    messages = {};
  }
  
  return {
    locale,
    messages,
  };
});
