// app/sitemap.js - FIXED: Only generate valid URLs to prevent 404s
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
  
  // ✅ 1. Homepage for each locale
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
  
  // ✅ 2. All Stores page for each locale
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
  
  // ✅ 4. Static pages
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
  
  // ✅ 5. Category pages - Only for categories with active stores
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
    if (category.stores.length === 0) continue;
    
    // Build map of valid URLs for this category
    const validUrls = new Map();
    
    for (const locale of LOCALES) {
      const [language] = locale.split('-');
      const translation = category.translations.find(t => t.locale === language);
      
      if (translation && translation.slug) {
        validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
      }
    }
    
    // Generate entries with proper alternates
    for (const [locale, url] of validUrls.entries()) {
      const alternates = {};
      for (const [altLocale, altUrl] of validUrls.entries()) {
        alternates[altLocale] = altUrl;
      }
      
      urls.push({
        url: url,
        lastModified: category.updatedAt || new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
        alternates: {
          languages: alternates,
        },
      });
    }
  }
  
  // ✅ 6. Store pages - CRITICAL FIX: Only valid store-country-locale combinations
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
    // Get valid country codes for this store
    const countryCodes = store.countries.map(sc => sc.country.code);
    
    // Build map of ONLY valid locale-URL combinations
    const validUrls = new Map();
    
    for (const locale of LOCALES) {
      const [language, region] = locale.split('-');
      
      // ✅ CRITICAL: Skip if store not available in this country
      if (!countryCodes.includes(region)) continue;
      
      const translation = store.translations.find(t => t.locale === language);
      
      // ✅ CRITICAL: Skip if no translation for this language
      if (!translation || !translation.slug) continue;
      
      validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
    }
    
    // Skip store entirely if no valid URLs
    if (validUrls.size === 0) continue;
    
    // Generate sitemap entry for each valid locale
    for (const [locale, url] of validUrls.entries()) {
      // Build alternates ONLY from other valid URLs
      const alternates = {};
      for (const [altLocale, altUrl] of validUrls.entries()) {
        alternates[altLocale] = altUrl;
      }
      
      urls.push({
        url: url,
        lastModified: store.updatedAt || new Date(),
        changeFrequency: 'daily',
        priority: store.isFeatured ? 0.8 : 0.7,
        alternates: {
          languages: alternates,
        },
      });
    }
  }
  
  console.log(`✅ Sitemap generated: ${urls.length} URLs (404-safe)`);
  
  return urls;
}
