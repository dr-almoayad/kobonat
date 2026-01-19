// lib/storeCategories.js - FIXED Category Data Utilities
import { prisma } from "@/lib/prisma";
import { cache } from "react";

/**
 * Get category data by slug with country filtering
 */
export const getCategoryData = cache(async (slug, language, countryCode) => {
  try {
    // Decode the URL-encoded slug
    const decodedSlug = decodeURIComponent(slug);
    console.log('🔍 getCategoryData:', { slug, decodedSlug, language, countryCode });
    
    const category = await prisma.category.findFirst({
      where: {
        translations: { 
          some: { 
            slug: decodedSlug,  // Use decoded slug here
            locale: language 
          } 
        },
        // Only return if category has active stores in this country
        stores: {
          some: {
            store: {
              isActive: true,
              countries: { 
                some: { 
                  country: { 
                    code: countryCode,
                    isActive: true 
                  } 
                } 
              }
            }
          }
        }
      },
      include: {
        translations: { 
          where: { locale: language } 
        },
        _count: {
          select: {
            stores: {
              where: {
                store: {
                  isActive: true,
                  countries: { 
                    some: { 
                      country: { code: countryCode } 
                    } 
                  }
                }
              }
            }
          }
        }
      }
    });

    if (category) {
      console.log('✅ Category found:', category.translations[0]?.name);
    } else {
      console.log('❌ Category not found for slug:', decodedSlug);
    }

    return category;
  } catch (error) {
    console.error("❌ Error fetching category:", error);
    console.error("Error details:", error.message);
    return null;
  }
});

/**
 * Get all categories for a specific country
 */
export const getCountryCategories = cache(async (language, countryCode) => {
  try {
    console.log('🔍 getCountryCategories:', { language, countryCode });
    
    const categories = await prisma.category.findMany({
      where: {
        stores: {
          some: {
            store: {
              isActive: true,
              countries: { 
                some: { 
                  country: { 
                    code: countryCode,
                    isActive: true 
                  } 
                } 
              }
            }
          }
        }
      },
      include: {
        translations: { 
          where: { locale: language } 
        },
        _count: {
          select: {
            stores: {
              where: {
                store: {
                  isActive: true,
                  countries: { 
                    some: { 
                      country: { code: countryCode } 
                    } 
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    const transformed = categories
      .filter(cat => cat.translations.length > 0) // Only categories with translations
      .map(cat => ({
        id: cat.id,
        name: cat.translations[0]?.name || '',
        slug: cat.translations[0]?.slug || '',
        description: cat.translations[0]?.description || null,
        icon: cat.icon,
        color: cat.color,
        storeCount: cat._count.stores
      }))
      .filter(cat => cat.name && cat.slug && cat.storeCount > 0); // Filter out invalid entries

    console.log(`✅ Found ${transformed.length} categories`);
    
    return transformed;
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    console.error("Error details:", error.message);
    return [];
  }
});

/**
 * Validate if a slug is a valid category
 */
export const isValidCategory = cache(async (slug, language, countryCode) => {
  const category = await getCategoryData(slug, language, countryCode);
  return category !== null;
});

/**
 * Get category SEO metadata
 */
export function getCategorySEO(category, locale, countryCode) {
  const isArabic = locale.startsWith('ar');
  const translation = category.translations[0];
  
  if (!translation) {
    return {
      title: "Category",
      description: "Category page"
    };
  }
  
  const title = isArabic
    ? `كوبونات ${translation.name} - عروض حصرية في ${countryCode}`
    : `${translation.name} Coupons & Deals - Exclusive Offers in ${countryCode}`;
  
  const description = translation.description || (isArabic
    ? `اكتشف أفضل كوبونات ${translation.name} في ${countryCode}. عروض وخصومات حصرية من أفضل المتاجر.`
    : `Discover the best ${translation.name} coupons in ${countryCode}. Exclusive deals and discounts from top stores.`);

  return {
    title,
    description,
    keywords: isArabic 
      ? `كوبونات ${translation.name}, عروض ${translation.name}, ${countryCode}`
      : `${translation.name} coupons, ${translation.name} deals, ${countryCode}`,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    },
    alternates: {
      canonical: `/${locale}/stores/${translation.slug}`
    }
  };
}