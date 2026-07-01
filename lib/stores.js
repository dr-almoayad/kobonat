// lib/stores.js - FIXED: no double‑decoding of slug
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

    // Transform stores
    const transformed = stores.map(store => {
      const storeTranslation = store.translations[0] || {};
      
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
        translations: undefined
      };
    });

    return transformed.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.name.localeCompare(b.name, language);
    });
    
  } catch (error) {
    console.error("❌ Error fetching stores:", error);
    return [];
  }
});

/**
 * Get individual store data by slug - ✅ FIXED: no double‑decoding
 */
export const getStoreData = cache(async (slug, language, countryCode) => {
  try {
    // ❌ REMOVED: const decodedSlug = decodeURIComponent(slug);
    // The slug is already decoded by the page before passing it here.
    // Use it directly.
    const store = await prisma.store.findFirst({
      where: { 
        isActive: true,
        translations: {
          some: {
            slug: slug, // ✅ use as‑is (already decoded)
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

    return store;
  } catch (error) {
    console.error("❌ Error fetching store:", error);
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
