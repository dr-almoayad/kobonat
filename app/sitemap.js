// app/sitemap.js - OPTIMIZED FOR BETTER SEO RESULTS
import { prisma } from '@/lib/prisma';
import { allLocaleCodes } from '@/i18n/locales';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

const LOCALES = allLocaleCodes;

// Helper to get most recent update date
function getMostRecentDate(...dates) {
  const validDates = dates.filter(d => d instanceof Date && !isNaN(d));
  return validDates.length > 0 
    ? new Date(Math.max(...validDates.map(d => d.getTime())))
    : new Date();
}

export default async function sitemap() {
  const urls = [];
  
  try {
    // ============================================================================
    // 1. HOMEPAGE - Highest Priority (Hourly updates with new coupons)
    // ============================================================================
    const latestVoucherUpdate = await prisma.voucher.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    });
    
    LOCALES.forEach(locale => {
      urls.push({
        url: `${BASE_URL}/${locale}`,
        lastModified: latestVoucherUpdate?.updatedAt || new Date(),
        changeFrequency: 'hourly',
        priority: 1.0,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map(loc => [loc, `${BASE_URL}/${loc}`])
          ),
        },
      });
    });
    
    // ============================================================================
    // 2. ALL STORES PAGE - High Priority
    // ============================================================================
    const latestStoreUpdate = await prisma.store.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    });
    
    LOCALES.forEach(locale => {
      urls.push({
        url: `${BASE_URL}/${locale}/stores`,
        lastModified: latestStoreUpdate?.updatedAt || new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/stores`])
          ),
        },
      });
    });
    
    // ============================================================================
    // 3. COUPONS PAGE - High Priority
    // ============================================================================
    LOCALES.forEach(locale => {
      urls.push({
        url: `${BASE_URL}/${locale}/coupons`,
        lastModified: latestVoucherUpdate?.updatedAt || new Date(),
        changeFrequency: 'hourly',
        priority: 0.9,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/coupons`])
          ),
        },
      });
    });
    
    // ============================================================================
    // 4. STATIC PAGES - Lower Priority, Rarely Change
    // ============================================================================
    const staticPages = [
      { slug: 'about', priority: 0.6, changeFreq: 'monthly' },
      { slug: 'contact', priority: 0.6, changeFreq: 'monthly' },
      { slug: 'privacy', priority: 0.4, changeFreq: 'yearly' },
      { slug: 'terms', priority: 0.4, changeFreq: 'yearly' },
      { slug: 'cookies', priority: 0.3, changeFreq: 'yearly' },
      { slug: 'help', priority: 0.7, changeFreq: 'monthly' },
    ];
    
    staticPages.forEach(page => {
      LOCALES.forEach(locale => {
        urls.push({
          url: `${BASE_URL}/${locale}/${page.slug}`,
          lastModified: new Date('2024-01-01'), // Set actual last update date
          changeFrequency: page.changeFreq,
          priority: page.priority,
          alternates: {
            languages: Object.fromEntries(
              LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/${page.slug}`])
            ),
          },
        });
      });
    });
    
    // ============================================================================
    // 5. CATEGORY PAGES - Only categories with active stores
    // ============================================================================
    const categories = await prisma.category.findMany({
      include: {
        translations: true,
        stores: {
          where: {
            store: { isActive: true }
          },
          include: {
            store: {
              select: { updatedAt: true }
            }
          }
        }
      }
    });
    
    for (const category of categories) {
      // Skip categories with no active stores
      if (category.stores.length === 0) continue;
      
      // Get most recent update from category or its stores
      const storeUpdates = category.stores.map(s => s.store.updatedAt);
      const lastModified = getMostRecentDate(category.updatedAt, ...storeUpdates);
      
      const validUrls = new Map();
      
      for (const locale of LOCALES) {
        const [language] = locale.split('-');
        const translation = category.translations.find(t => t.locale === language);
        
        if (translation?.slug) {
          validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
        }
      }
      
      for (const [locale, url] of validUrls.entries()) {
        const alternates = Object.fromEntries(validUrls.entries());
        
        urls.push({
          url: url,
          lastModified: lastModified,
          changeFrequency: 'daily',
          priority: 0.8,
          alternates: {
            languages: alternates,
          },
        });
      }
    }
    
    // ============================================================================
    // 6. STORE PAGES - Hourly updates (coupons change frequently)
    // ============================================================================
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      include: {
        translations: true,
        countries: {
          include: {
            country: true
          }
        },
        vouchers: {
          where: {
            OR: [
              { expiryDate: null },
              { expiryDate: { gte: new Date() } }
            ]
          },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { updatedAt: true }
        }
      }
    });
    
    for (const store of stores) {
      const countryCodes = store.countries.map(sc => sc.country.code);
      const validUrls = new Map();
      
      // Get most recent update (store or its latest voucher)
      const latestVoucher = store.vouchers[0];
      const lastModified = getMostRecentDate(
        store.updatedAt,
        latestVoucher?.updatedAt
      );
      
      for (const locale of LOCALES) {
        const [language, region] = locale.split('-');
        
        // Skip if store not available in this country
        if (!countryCodes.includes(region)) continue;
        
        const translation = store.translations.find(t => t.locale === language);
        
        // Skip if no translation for this language
        if (!translation?.slug) continue;
        
        validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
      }
      
      // Skip store if no valid URLs
      if (validUrls.size === 0) continue;
      
      for (const [locale, url] of validUrls.entries()) {
        const alternates = Object.fromEntries(validUrls.entries());
        
        urls.push({
          url: url,
          lastModified: lastModified,
          changeFrequency: 'hourly', // ✅ CHANGED: Store pages update hourly with new coupons
          priority: store.isFeatured ? 0.85 : 0.75,
          alternates: {
            languages: alternates,
          },
        });
      }
    }
    
    // ============================================================================
    // 7. INDIVIDUAL COUPON PAGES (if you have detail pages for coupons)
    // ============================================================================
    // Uncomment this section if you have individual coupon detail pages
    /*
    const featuredVouchers = await prisma.voucher.findMany({
      where: {
        isExclusive: true,
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } }
        ]
      },
      include: {
        translations: true,
        store: {
          include: {
            translations: true
          }
        },
        countries: {
          include: {
            country: true
          }
        }
      },
      take: 100 // Limit to top exclusive deals
    });
    
    for (const voucher of featuredVouchers) {
      const countryCodes = voucher.countries.map(vc => vc.country.code);
      const validUrls = new Map();
      
      for (const locale of LOCALES) {
        const [language, region] = locale.split('-');
        
        if (!countryCodes.includes(region)) continue;
        
        const voucherTranslation = voucher.translations.find(t => t.locale === language);
        const storeTranslation = voucher.store.translations.find(t => t.locale === language);
        
        if (!voucherTranslation || !storeTranslation?.slug) continue;
        
        // Assuming URL structure: /locale/stores/store-slug/voucher-id
        validUrls.set(
          locale, 
          `${BASE_URL}/${locale}/stores/${storeTranslation.slug}/voucher/${voucher.id}`
        );
      }
      
      if (validUrls.size === 0) continue;
      
      for (const [locale, url] of validUrls.entries()) {
        const alternates = Object.fromEntries(validUrls.entries());
        
        urls.push({
          url: url,
          lastModified: voucher.updatedAt || new Date(),
          changeFrequency: 'hourly',
          priority: 0.6,
          alternates: {
            languages: alternates,
          },
        });
      }
    }
    */
    
    // Log results
    const uniqueUrls = new Set(urls.map(u => u.url)).size;
    console.log(`✅ Sitemap generated: ${urls.length} entries (${uniqueUrls} unique URLs)`);
    
    // Warn if approaching sitemap limit
    if (urls.length > 45000) {
      console.warn(`⚠️ Sitemap approaching 50k limit. Consider splitting into sitemap index.`);
    }
    
    return urls;
    
  } catch (error) {
    console.error('❌ Sitemap generation error:', error);
    
    // Return minimal sitemap on error
    return LOCALES.map(locale => ({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    }));
  }
          }
