// components/HomeFeaturedProducts/HomeFeaturedProductsSection.jsx
import { prisma } from '@/lib/prisma';
import FeaturedProductsCarousel from '@/components/FeaturedProductsCarousel/FeaturedProductsCarousel';

async function getFeaturedProducts(lang, countryCode) {
  try {
    const products = await prisma.storeProduct.findMany({
      where: {
        isFeatured: true,
        store: {
          isActive: true,
          ...(countryCode && {
            countries: { some: { country: { code: countryCode } } }
          })
        }
      },
      include: {
        translations: { where: { locale: lang } },
        store: {
          include: { translations: { where: { locale: lang } } }
        }
      },
      orderBy: [{ order: 'asc' }, { clickCount: 'desc' }],
      take: 20
    });

    return products.map(product => {
      const translation = product.translations?.[0] || {};
      const storeTranslation = product.store?.translations?.[0] || {};
      return {
        id: product.id,
        image: product.image,
        productUrl: product.productUrl,
        discountValue: product.discountValue,
        discountType: product.discountType,
        title: translation.title || '',
        description: translation.description || '',
        storeName: storeTranslation.name || '',
        storeSlug: storeTranslation.slug || '',
        storeLogo: product.store?.logo || null,
        storeId: product.store?.id || null,
      };
    }).filter(p => p.title);
  } catch (error) {
    console.error('[HomeFeaturedProducts] fetch error:', error.message);
    return [];
  }
}

export default async function HomeFeaturedProductsSection({ locale, countryCode }) {
  const lang = locale?.split('-')[0] || 'ar';
  const products = await getFeaturedProducts(lang, countryCode);
  if (!products.length) return null;

  return (
    <FeaturedProductsCarousel
      products={products}
      multiStore={true}
      locale={locale}
    />
  );
}
