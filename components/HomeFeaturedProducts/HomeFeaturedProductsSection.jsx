// components/HomeFeaturedProducts/HomeFeaturedProductsSection.jsx
// Server Component — fetches featured products across ALL stores for the homepage.
// Each product carries its own store name + logo so the carousel works in multi-store mode.

import { prisma } from '@/lib/prisma';
import FeaturedProductsCarousel from '@/components/FeaturedProductsCarousel/FeaturedProductsCarousel';

async function getFeaturedProducts(lang, countryCode) {
  try {
    const products = await prisma.storeProduct.findMany({
      where: {
        isFeatured: true,
        store: {
          isActive: true,
          // Only products whose store operates in the visitor's country
          ...(countryCode && {
            countries: { some: { country: { code: countryCode } } }
          })
        }
      },
      include: {
        translations: {
          where: { locale: lang }
        },
        store: {
          include: {
            translations: {
              where: { locale: lang }
            }
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { clickCount: 'desc' }
      ],
      take: 20
    });

    // Flatten translations onto each product so StoreProductCard
    // can consume plain props without knowing about the locale system.
    return products.map(product => {
      const translation = product.translations?.[0] || {};
      const storeTranslation = product.store?.translations?.[0] || {};

      return {
        id:            product.id,
        image:         product.image,
        productUrl:    product.productUrl,
        discountValue: product.discountValue,
        discountType:  product.discountType,
        title:         translation.title || '',
        description:   translation.description || '',
        // Store info attached per-product for multi-store carousel mode
        storeName:     storeTranslation.name  || '',
        storeSlug:     storeTranslation.slug  || '',
        storeLogo:     product.store?.logo    || null,
        storeId:       product.store?.id      || null,
      };
    }).filter(p => p.title); // Drop products with no translation for this locale
  } catch (error) {
    console.error('[HomeFeaturedProducts] fetch error:', error.message);
    return [];
  }
}

export default async function HomeFeaturedProductsSection({ locale, countryCode }) {
  const lang     = locale?.split('-')[0] || 'ar';
  const products = await getFeaturedProducts(lang, countryCode);

  // Don't render the section if there are nothing to show
  if (!products.length) return null;

  return (
    <FeaturedProductsCarousel
      products={products}
      // Multi-store mode: no single storeName/storeLogo/storeWebsiteUrl.
      // Each card reads its own store data from product.storeName / product.storeLogo.
      multiStore={true}
      locale={locale}
    />
  );
}
