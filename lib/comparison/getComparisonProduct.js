// lib/comparison/getComparisonProduct.js
import { prisma } from '@/lib/prisma';
import { computeEffectivePrice } from './effectivePrice';

export async function getComparisonProduct(slug, locale = 'en', countryCode = 'SA') {
  const [lang] = locale.split('-');

  // 1. Fetch product metadata and variants (no offers yet)
  const product = await prisma.comparisonProduct.findUnique({
    where: { slug, isActive: true },
    include: {
      translations: { where: { locale: lang } },
      brand: { include: { translations: { where: { locale: lang } } } },
      category: { include: { translations: { where: { locale: lang } } } },
      variants: {
        where: { isActive: true },
        orderBy: { isDefault: 'desc' },
      },
    },
  });

  if (!product) return null;

  // 2. Fetch all active offers for this product (across all variants)
  const rawOffers = await prisma.storeProduct.findMany({
    where: {
      comparisonProductId: product.id,
      isActive: true,
      isComparisonOffer: true,
      isInStock: true,
      countries: { some: { country: { code: countryCode } } },
    },
    include: {
      store: { include: { translations: { where: { locale: lang } } } },
      priceHistory: {
        orderBy: { recordedAt: 'desc' },
        take: 30,
      },
    },
  });

  // 3. Get active methodology
  const methodology = await prisma.savingsMethodology.findFirst({
    where: { isActive: true },
  });

  // 4. Compute effective price for each offer
  const allOffers = rawOffers.map((offer) => {
    const effective = computeEffectivePrice(offer, methodology);
    return {
      ...offer,
      effectivePrice: effective.effectivePrice,
      savingsAmount: effective.savingsAmount,
      savingsPercent: effective.savingsPercent,
      stackingPath: effective.stackingPath,
      storeName: offer.store?.translations?.[0]?.name || offer.store?.name,
      storeLogo: offer.store?.logo,
    };
  });

  // 5. Group offers by variant ID
  const groupedOffers = {};
  const variants = product.variants || [];
  variants.forEach((v) => {
    groupedOffers[v.id] = allOffers.filter((o) => o.comparisonVariantId === v.id);
  });
  // Product‑level offers (no variant)
  groupedOffers['null'] = allOffers.filter((o) => o.comparisonVariantId === null);

  // 6. Build image gallery
  const images = [...(product.images || [])];
  variants.forEach((v) => {
    if (v.image && !images.includes(v.image)) images.push(v.image);
  });

  // 7. Prepare the response object
  const t = product.translations[0] || {};
  const brandTranslation = product.brand?.translations[0] || {};

  return {
    id: product.id,
    slug: product.slug,
    name: t.name,
    description: t.description,
    brand: product.brand
      ? {
          id: product.brand.id,
          name: brandTranslation.name,
          slug: product.brand.slug,
          logo: product.brand.logo,
        }
      : null,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.translations[0]?.name,
          slug: product.category.slug,
        }
      : null,
    images: images.length ? images : ['/placeholder.png'],
    specifications: product.specifications || [],
    allOffers,
    offers: groupedOffers['null'] || [],
    variants: variants.map((v) => ({
      id: v.id,
      attributes: v.attributes,
      image: v.image,
      isDefault: v.isDefault,
      offers: groupedOffers[v.id] || [],
    })),
    priceHistory: allOffers.sort((a, b) => a.effectivePrice - b.effectivePrice)[0]?.priceHistory || [],
    methodology,
  };
}
