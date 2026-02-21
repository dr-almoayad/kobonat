// i18n/locales.js
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
    direction: 'rtl'
  },
  'en-SA': {
    code: 'en-SA',
    name: 'Saudi Arabia',
    name_ar: 'المملكة العربية السعودية',
    language: 'en',
    region: 'SA',
    flag: '🇸🇦',
    currency: 'SAR',
    direction: 'ltr'
  }
};

// Get locale info
export function getLocaleInfo(localeCode) {
  return LOCALES[localeCode] || LOCALES['ar-SA'];
}

// Get available languages for a region
export function getAvailableLanguages(region) {
  return [...new Set(
    Object.values(LOCALES)
      .filter(locale => locale.region === region)
      .map(locale => locale.language)
  )];
}

// Get available regions for a language
export function getAvailableRegions(language) {
  return [...new Set(
    Object.values(LOCALES)
      .filter(locale => locale.language === language)
      .map(locale => locale.region)
  )];
}

// Get default locale for a region
export function getDefaultLocaleForRegion(region) {
  // Prefer Arabic for Middle Eastern regions
  const arLocale = Object.values(LOCALES).find(
    locale => locale.region === region && locale.language === 'ar'
  );
  return arLocale ? arLocale.code : Object.values(LOCALES).find(
    locale => locale.region === region
  )?.code;
}

// Get all regions with their default locales
export function getRegionsWithDefaultLocales() {
  const regions = [...new Set(Object.values(LOCALES).map(l => l.region))];
  return regions.map(region => ({
    region,
    defaultLocale: getDefaultLocaleForRegion(region),
    ...getLocaleInfo(getDefaultLocaleForRegion(region))
  }));
}

// List of all locale codes
export const allLocaleCodes = Object.keys(LOCALES);

// List of all language codes
export const allLanguageCodes = [...new Set(Object.values(LOCALES).map(l => l.language))];

// List of all region codes
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

// Helper: Create locale from language and region
export function createLocale(language, region) {
  const localeCode = `${language}-${region}`;
  return LOCALES[localeCode] ? localeCode : 'ar-SA';
}

// Helper: Get all locales for a specific region
export function getLocalesForRegion(region) {
  return Object.values(LOCALES)
    .filter(locale => locale.region === region)
    .map(locale => locale.code);
}

// Helper: Get all locales for a specific language
export function getLocalesForLanguage(language) {
  return Object.values(LOCALES)
    .filter(locale => locale.language === language)
    .map(locale => locale.code);
}
