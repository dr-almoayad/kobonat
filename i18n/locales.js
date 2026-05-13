// i18n/locales.js
// Saudi Arabia only – no other countries are active.

export const LOCALES = {
  // Saudi Arabia
  'ar-SA': {
    code: 'ar-SA',
    name: 'المملكة العربية السعودية',
    name_en: 'Saudi Arabia',
    language: 'ar',
    region: 'SA',
    flag: '🇸🇦',
    currency: 'SAR',
    direction: 'rtl',
  },
  'en-SA': {
    code: 'en-SA',
    name: 'Saudi Arabia',
    name_ar: 'المملكة العربية السعودية',
    language: 'en',
    region: 'SA',
    flag: '🇸🇦',
    currency: 'SAR',
    direction: 'ltr',
  },
};

// Get locale info
export function getLocaleInfo(localeCode) {
  return LOCALES[localeCode] || LOCALES['ar-SA'];
}

// Get available languages for a region (only SA exists)
export function getAvailableLanguages(region) {
  if (region !== 'SA') return [];
  return ['ar', 'en'];
}

// Get available regions for a language (only SA exists)
export function getAvailableRegions(language) {
  if (language !== 'ar' && language !== 'en') return [];
  return ['SA'];
}

// Get default locale for a region (always ar-SA for SA)
export function getDefaultLocaleForRegion(region) {
  if (region !== 'SA') return null;
  return 'ar-SA';
}

// Get all regions with their default locales (only SA)
export function getRegionsWithDefaultLocales() {
  return [
    {
      region: 'SA',
      defaultLocale: 'ar-SA',
      ...LOCALES['ar-SA'],
    },
  ];
}

// List of all locale codes (only SA)
export const allLocaleCodes = Object.keys(LOCALES); // ['ar-SA', 'en-SA']

// List of all language codes (ar, en)
export const allLanguageCodes = [...new Set(Object.values(LOCALES).map(l => l.language))];

// List of all region codes (only 'SA')
export const allRegionCodes = [...new Set(Object.values(LOCALES).map(l => l.region))];

// Helper: Get display name for locale in current language
export function getLocaleDisplayName(localeCode, currentLanguage = 'ar') {
  const locale = getLocaleInfo(localeCode);
  return currentLanguage === 'ar' ? locale.name : locale.name_en;
}

// Helper: Check if a locale combination exists
export function isValidLocale(language, region) {
  return LOCALES[`${language}-${region}`] !== undefined;
}

// Helper: Create locale from language and region (falls back to ar-SA)
export function createLocale(language, region) {
  const localeCode = `${language}-${region}`;
  return LOCALES[localeCode] ? localeCode : 'ar-SA';
}

// Helper: Get all locales for a specific region (only SA)
export function getLocalesForRegion(region) {
  if (region !== 'SA') return [];
  return ['ar-SA', 'en-SA'];
}

// Helper: Get all locales for a specific language
export function getLocalesForLanguage(language) {
  if (language === 'ar') return ['ar-SA'];
  if (language === 'en') return ['en-SA'];
  return [];
}
