// app/sitemap.js - FIXED: Generate proper URLs to avoid redirects
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
  
  // ✅ 1. Homepage for each locale (NO TRAILING SLASH)
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
  
  // ✅ 2. All Stores page for each locale (NO TRAILING SLASH)
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
  
  // ✅ 3. Coupons page for each locale
  LOCALES.forEach(locale => {
    urls.push({
      url: `${BASE_URL}/${locale}/coupons`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/coupons`])
        ),
      },
    });
  });
  
  // ✅ 4. Static pages for each locale
  const staticPages = ['about', 'contact', 'privacy', 'terms', 'cookies', 'help'];
  staticPages.forEach(page => {
    LOCALES.forEach(locale => {
      urls.push({
        url: `${BASE_URL}/${locale}/${page}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/${page}`])
          ),
        },
      });
    });
  });
  
  // ✅ 5. Category pages for each locale
  const categories = await prisma.category.findMany({
    include: {
      translations: true,
      stores: {
        where: {
          store: { isActive: true }
        }
      }
    }
  });
  
  for (const category of categories) {
    // Skip categories with no active stores
    if (category.stores.length === 0) continue;
    
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
  
  // ✅ 6. Store pages for each locale
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    include: {
      translations: true,
      countries: {
        include: {
          country: true
        }
      }
    }
  });
  
  for (const store of stores) {
    // Get country codes for this store
    const countryCodes = store.countries.map(sc => sc.country.code);
    
    for (const locale of LOCALES) {
      const [language, region] = locale.split('-');
      
      // Only include if store is available in this country
      if (!countryCodes.includes(region)) continue;
      
      const translation = store.translations.find(t => t.locale === language);
      
      if (translation && translation.slug) {
        // Get all alternate URLs for this store
        const alternates = {};
        for (const altLocale of LOCALES) {
          const [altLang, altRegion] = altLocale.split('-');
          
          // Only add alternate if store is available in that country
          if (!countryCodes.includes(altRegion)) continue;
          
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
  
  console.log(`✅ Sitemap generated: ${urls.length} URLs`);
  
  return urls;
}
