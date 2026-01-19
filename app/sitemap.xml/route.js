// app/sitemap.xml/route.js - FIXED for translation schema
import { prisma } from '@/lib/prisma';
import { allLocaleCodes } from '@/i18n/locales';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

export default async function sitemap() {
  try {
    const now = new Date();

    // Static routes - generate for all locales
    const staticRoutes = allLocaleCodes.flatMap(locale => [
      {
        url: `${BASE_URL}/${locale}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${BASE_URL}/${locale}/stores`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${BASE_URL}/${locale}/coupons`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${BASE_URL}/${locale}/search`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${BASE_URL}/${locale}/about`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      },
    ]);

    // Fetch stores with translations
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      include: {
        translations: true, // Get all translations
        countries: {
          include: {
            country: true
          }
        }
      }
    });

    // Fetch categories with translations
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

    // Generate store routes for each locale
    const storeRoutes = [];
    stores.forEach(store => {
      // Get available countries for this store
      const countryCodes = store.countries.map(sc => sc.country.code);
      
      store.translations.forEach(translation => {
        const locale = translation.locale;
        
        // Find matching locales for this translation's language and store's countries
        const matchingLocales = allLocaleCodes.filter(localeCode => {
          const [lang, region] = localeCode.split('-');
          return lang === locale && countryCodes.includes(region);
        });

        matchingLocales.forEach(matchingLocale => {
          storeRoutes.push({
            url: `${BASE_URL}/${matchingLocale}/stores/${translation.slug}`,
            lastModified: store.updatedAt || now,
            changeFrequency: 'daily',
            priority: store.isFeatured ? 0.9 : 0.8,
          });
        });
      });
    });

    // Generate category routes for each locale
    const categoryRoutes = [];
    categories.forEach(category => {
      // Only include categories with active stores
      if (category.stores.length === 0) return;

      category.translations.forEach(translation => {
        const locale = translation.locale;
        
        // Generate for all matching locales (language + all regions)
        const matchingLocales = allLocaleCodes.filter(localeCode => {
          const [lang] = localeCode.split('-');
          return lang === locale;
        });

        matchingLocales.forEach(matchingLocale => {
          categoryRoutes.push({
            url: `${BASE_URL}/${matchingLocale}/categories/${translation.slug}`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.8,
          });
        });
      });
    });

    // Combine all routes
    const allRoutes = [
      ...staticRoutes,
      ...storeRoutes,
      ...categoryRoutes,
    ];

    console.log(`✅ Generated sitemap with ${allRoutes.length} URLs`);
    console.log(`   - ${staticRoutes.length} static routes`);
    console.log(`   - ${storeRoutes.length} store routes`);
    console.log(`   - ${categoryRoutes.length} category routes`);

    return allRoutes;

  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return minimal sitemap on error
    return allLocaleCodes.map(locale => ({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    }));
  }
}