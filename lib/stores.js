// lib/stores.js - FIXED Prisma Query (no select + include conflict)
import { prisma } from "@/lib/prisma";
import { cache } from "react";

/**
 * Get stores with optional category filtering
 */
export const getStoresData = cache(async ({ 
  language, 
  countryCode, 
  categoryId = null,
  limit = null 
}) => {
  try {
    console.log('🔍 getStoresData:', { language, countryCode, categoryId, limit });
    
    const where = {
      isActive: true,
      countries: { 
        some: { 
          country: { 
            code: countryCode,
            isActive: true 
          } 
        } 
      },
      ...(categoryId && {
        categories: { 
          some: { 
            categoryId: categoryId 
          } 
        }
      })
    };

    const stores = await prisma.store.findMany({
      where,
      include: {
        translations: { 
          where: { locale: language } 
        },
        categories: {
          include: {
            category: {
              include: { 
                translations: { 
                  where: { locale: language } 
                } 
              }
            }
          }
        },
        _count: {
          select: {
            vouchers: {
              where: {
                expiryDate: { gte: new Date() },
                countries: { 
                  some: { 
                    country: { code: countryCode } 
                  } 
                }
              }
            }
          }
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { id: 'asc' }
      ],
      ...(limit && { take: limit })
    });

    console.log(`✅ Found ${stores.length} stores`);

    // Transform stores
    const transformed = stores.map(store => {
      const storeTranslation = store.translations[0] || {};
      
      // Get unique categories
      const uniqueCategories = [];
      const seenCategoryIds = new Set();
      
      store.categories?.forEach(sc => {
        if (sc.category && !seenCategoryIds.has(sc.category.id)) {
          seenCategoryIds.add(sc.category.id);
          const catTranslation = sc.category.translations[0] || {};
          uniqueCategories.push({
            id: sc.category.id,
            name: catTranslation.name || '',
            slug: catTranslation.slug || '',
            icon: sc.category.icon || '',
            color: sc.category.color || ''
          });
        }
      });

      return {
        ...store,
        name: storeTranslation.name || '',
        slug: storeTranslation.slug || '',
        description: storeTranslation.description || null,
        categories: uniqueCategories,
        activeVouchersCount: store._count.vouchers,
        translations: undefined // Remove to avoid confusion
      };
    });

    // Sort by name after transformation
    return transformed.sort((a, b) => {
      // Featured stores first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // Then alphabetically
      return a.name.localeCompare(b.name, language);
    });
    
  } catch (error) {
    console.error("❌ Error fetching stores:", error);
    console.error("Error details:", error.message);
    return [];
  }
});

/**
 * Get individual store data by slug - FIXED: No select + include conflict
 */
export const getStoreData = cache(async (slug, language, countryCode) => {
  try {
    // Decode the URL-encoded slug
    const decodedSlug = decodeURIComponent(slug);
    console.log('🔍 getStoreData:', { slug, decodedSlug, language, countryCode });
    
    const store = await prisma.store.findFirst({
      where: { 
        isActive: true,
        translations: {
          some: {
            slug: decodedSlug,  // Use decoded slug here
            locale: language
          }
        },
        countries: {
          some: {
            country: {
              code: countryCode,
              isActive: true
            }
          }
        }
      },
      include: {
        translations: {
          where: { locale: language }
        },
        categories: {
          include: { 
            category: {
              include: {
                translations: { where: { locale: language } }
              }
            }
          }
        },
        countries: {
          where: {
            country: { code: countryCode }
          },
          include: {
            country: {
              include: {
                translations: { where: { locale: language } }
              }
            }
          }
        }
      }
    });

    if (store) {
      console.log('✅ Store found:', store.translations[0]?.name);
    } else {
      console.log('❌ Store not found for slug:', decodedSlug);
    }

    return store;
  } catch (error) {
    console.error("❌ Error fetching store:", error);
    console.error("Error details:", error.message);
    return null;
  }
});

/**
 * Validate if a slug is a valid store
 */
export const isValidStore = cache(async (slug, language, countryCode) => {
  const store = await getStoreData(slug, language, countryCode);
  return store !== null;
});