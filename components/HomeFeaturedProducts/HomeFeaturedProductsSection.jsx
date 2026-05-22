// components/HomeFeaturedProducts/HomeFeaturedProductsSection.jsx
// Server component — fetches featured products across all stores,
// sorts stores by featured product count (desc) then alphabetically,
// and passes them to FeaturedProductsCarousel for the stacked avatar header.

import { prisma } from '@/lib/prisma';
import FeaturedProductsCarousel from '@/components/FeaturedProductsCarousel/FeaturedProductsCarousel';

export default async function HomeFeaturedProductsSection({ locale, countryCode = 'SA' }) {
  const lang = locale?.split('-')[0] || 'ar';

  const storesWithProducts = await prisma.store.findMany({
    where: {
      isActive: true,
      countries: { some: { country: { code: countryCode } } },
      products: {
        some: { isFeatured: true },
      },
    },
    select: {
      id:     true,
      logo:   true,
      bigLogo: true,
      translations: {
        where:  { locale: lang },
        select: { name: true, slug: true },
      },
      products: {
        where: { isFeatured: true },
        select: {
          id:            true,
          image:         true,
          discountValue: true,
          discountType:  true,
          productUrl:    true,
          clickCount:    true,
          order:         true,
          translations: {
            where:  { locale: lang },
            select: { title: true },
          },

          // ── Promo ribbon: linked voucher ──────────────────────────
          linkedVoucher: {
            select: {
              id:              true,
              code:            true,
              type:            true,
              discount:        true,
              discountPercent: true,
              translations: {
                where:  { locale: lang },
                select: { title: true },
              },
            },
          },

          // ── Promo ribbon: linked bank / payment offer ─────────────
          linkedPromo: {
            select: {
              id:              true,
              type:            true,
              discountPercent: true,
              translations: {
                where:  { locale: lang },
                select: { title: true },
              },
              bank: {
                select: {
                  logo: true,
                  translations: {
                    where:  { locale: lang },
                    select: { name: true },
                  },
                },
              },
              paymentMethod: {
                select: {
                  logo:   true,
                  isBnpl: true,
                  translations: {
                    where:  { locale: lang },
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ order: 'asc' }, { clickCount: 'desc' }],
        take: 8,
      },
    },
  });

  if (!storesWithProducts.length) return null;

  // Sort stores: most featured products first, then alphabetically
  const sortedStores = [...storesWithProducts].sort((a, b) => {
    const diff = b.products.length - a.products.length;
    if (diff !== 0) return diff;
    const nameA = a.translations[0]?.name || '';
    const nameB = b.translations[0]?.name || '';
    return nameA.localeCompare(nameB);
  });

  // Build flat product list (up to 20 total) via round-robin across stores
  const allProducts = [];
  const MAX_PRODUCTS = 20;

  const storeQueues = sortedStores.map(store => ({
    store,
    queue: [...store.products],
  }));

  let added = 0;
  while (added < MAX_PRODUCTS) {
    let anyAdded = false;
    for (const { store, queue } of storeQueues) {
      if (!queue.length) continue;
      const p = queue.shift();
      allProducts.push({
        id:            p.id,
        image:         p.image,
        discountValue: p.discountValue,
        discountType:  p.discountType,
        productUrl:    p.productUrl,
        clickCount:    p.clickCount,
        title:         p.translations[0]?.title || '',
        // Store identity (multi-store header mode)
        storeName:     store.translations[0]?.name || '',
        storeLogo:     store.bigLogo || store.logo || null,
        // Promo ribbon data — forwarded straight to StoreProductCard
        linkedVoucher: p.linkedVoucher || null,
        linkedPromo:   p.linkedPromo   || null,
      });
      added++;
      anyAdded = true;
      if (added >= MAX_PRODUCTS) break;
    }
    if (!anyAdded) break;
  }

  if (!allProducts.length) return null;

  // Stores metadata for the stacked avatar header
  const storesMeta = sortedStores.map(store => ({
    id:           store.id,
    name:         store.translations[0]?.name || '',
    logo:         store.bigLogo || store.logo || null,
    featuredCount: store.products.length,
  }));

  return (
    <FeaturedProductsCarousel
      products={allProducts}
      multiStore={true}
      stores={storesMeta}
    />
  );
}
