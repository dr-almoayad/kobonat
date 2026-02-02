// app/sitemap.js - Generate sitemap for all locales
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

const LOCALES = [
  'ar-SA', 'en-SA',
  'ar-AE', 'en-AE',
  'ar-EG', 'en-EG',
  'ar-QA', 'en-QA',
  'ar-KW', 'en-KW',
  'ar-OM', 'en-OM'
];

export default async function sitemap() {
  const urls = [];
  
  // 1. Homepage for each locale
  LOCALES.forEach(locale => {
    urls.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map(loc => [loc, `${BASE_URL}/${loc}`])
        ),
      },
    });
  });
  
  // 2. All Stores page for each locale
  LOCALES.forEach(locale => {
    urls.push({
      url: `${BASE_URL}/${locale}/stores`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/stores`])
        ),
      },
    });
  });
  
  // 3. Category pages for each locale
  const categories = await prisma.category.findMany({
    include: {
      translations: true
    }
  });
  
  for (const category of categories) {
    for (const locale of LOCALES) {
      const [language] = locale.split('-');
      const translation = category.translations.find(t => t.locale === language);
      
      if (translation && translation.slug) {
        // Get all alternate URLs for this category
        const alternates = {};
        for (const altLocale of LOCALES) {
          const [altLang] = altLocale.split('-');
          const altTranslation = category.translations.find(t => t.locale === altLang);
          if (altTranslation && altTranslation.slug) {
            alternates[altLocale] = `${BASE_URL}/${altLocale}/stores/${altTranslation.slug}`;
          }
        }
        
        urls.push({
          url: `${BASE_URL}/${locale}/stores/${translation.slug}`,
          lastModified: category.updatedAt || new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
          alternates: {
            languages: alternates,
          },
        });
      }
    }
  }
  
  // 4. Store pages for each locale
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    include: {
      translations: true
    }
  });
  
  for (const store of stores) {
    for (const locale of LOCALES) {
      const [language] = locale.split('-');
      const translation = store.translations.find(t => t.locale === language);
      
      if (translation && translation.slug) {
        // Get all alternate URLs for this store
        const alternates = {};
        for (const altLocale of LOCALES) {
          const [altLang] = altLocale.split('-');
          const altTranslation = store.translations.find(t => t.locale === altLang);
          if (altTranslation && altTranslation.slug) {
            alternates[altLocale] = `${BASE_URL}/${altLocale}/stores/${altTranslation.slug}`;
          }
        }
        
        urls.push({
          url: `${BASE_URL}/${locale}/stores/${translation.slug}`,
          lastModified: store.updatedAt || new Date(),
          changeFrequency: 'daily',
          priority: 0.7,
          alternates: {
            languages: alternates,
          },
        });
      }
    }
  }
  
  return urls;
}
