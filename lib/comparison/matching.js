// lib/comparison/matching.js
// Store-agnostic. Adapters (Amazon, XML feeds, manual admin entry) all funnel
// through upsertComparisonOffer() with the same normalized shape. Nothing in
// here knows about any specific seller — that's the point.
//
// Normalized offer shape every caller must provide:
//   {
//     storeId,                 // existing Store row for the seller
//     externalId,               // ASIN / SKU / feed row id — required, used for upsert dedup
//     gtin, mpn,                 // optional cross-seller matching keys
//     title_en, title_ar,        // at least one required
//     brandSlug,                 // optional — used to find/create ComparisonBrand
//     categoryId,                 // optional
//     price,                       // required, number
//     productUrl, image,            // required
//     variantAttributes,             // optional, e.g. { color: 'Black', storage: '256GB' }
//     isInStock,                      // optional, defaults true
//   }

import { prisma } from '@/lib/prisma';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function findOrCreateBrand(brandSlug, brandName) {
  if (!brandSlug) return null;
  const slug = slugify(brandSlug);
  return prisma.comparisonBrand.upsert({
    where: { slug },
    create: {
      slug,
      translations: {
        create: [
          { locale: 'en', name: brandName || brandSlug },
          { locale: 'ar', name: brandName || brandSlug },
        ],
      },
    },
    update: {},
  });
}

/**
 * Finds an existing ComparisonProduct/Variant by GTIN, then MPN+brand, then
 * falls back to creating a new product. Deliberately conservative — no fuzzy
 * title matching here. Anything that doesn't match on a hard key becomes a
 * new product rather than risking a wrong merge.
 */
async function matchOrCreateProduct({ gtin, mpn, brandId, title_en, title_ar, categoryId, image, variantAttributes }) {
  // 1. Exact GTIN match on an existing variant
  if (gtin) {
    const existing = await prisma.comparisonProductVariant.findFirst({
      where: { gtin },
      include: { product: true },
    });
    if (existing) return { product: existing.product, variant: existing };
  }

  // 2. MPN + brand fallback
  if (mpn && brandId) {
    const existing = await prisma.comparisonProductVariant.findFirst({
      where: { mpn, product: { brandId } },
      include: { product: true },
    });
    if (existing) return { product: existing.product, variant: existing };
  }

  // 3. No match — create a new canonical product + default variant
  const slug = `${slugify(title_en || title_ar)}-${Date.now().toString(36)}`;
  const product = await prisma.comparisonProduct.create({
    data: {
      slug,
      brandId: brandId || null,
      categoryId: categoryId || null,
      images: image ? [image] : [],
      isActive: true,
      translations: {
        create: [
          { locale: 'en', name: title_en || title_ar || slug },
          { locale: 'ar', name: title_ar || title_en || slug },
        ],
      },
    },
  });

  const variant = await prisma.comparisonProductVariant.create({
    data: {
      productId: product.id,
      attributes: variantAttributes || {},
      gtin: gtin || null,
      mpn: mpn || null,
      image: image || null,
      isDefault: true,
      isActive: true,
    },
  });

  return { product, variant };
}

/**
 * The single entry point every adapter calls. Upserts the StoreProduct
 * "offer" row for (storeId, externalId), matching/creating the canonical
 * product+variant as needed. Idempotent — safe to call repeatedly per sync.
 */
export async function upsertComparisonOffer(raw) {
  if (!raw.storeId) throw new Error('upsertComparisonOffer: storeId is required');
  if (!raw.externalId) throw new Error('upsertComparisonOffer: externalId is required');
  if (!raw.price || raw.price <= 0) throw new Error('upsertComparisonOffer: price must be > 0');

  const brand = raw.brandSlug ? await findOrCreateBrand(raw.brandSlug, raw.brandName) : null;

  const { product, variant } = await matchOrCreateProduct({
    gtin: raw.gtin,
    mpn: raw.mpn,
    brandId: brand?.id,
    title_en: raw.title_en,
    title_ar: raw.title_ar,
    categoryId: raw.categoryId,
    image: raw.image,
    variantAttributes: raw.variantAttributes,
  });

  const offer = await prisma.storeProduct.upsert({
    where: { storeId_externalId: { storeId: raw.storeId, externalId: raw.externalId } },
    create: {
      storeId: raw.storeId,
      externalId: raw.externalId,
      gtin: raw.gtin || null,
      isComparisonOffer: true,
      comparisonProductId: product.id,
      comparisonVariantId: variant.id,
      currentPrice: raw.price,
      productUrl: raw.productUrl,
      image: raw.image || variant.image || product.images?.[0] || '',
      isFeatured: false,
      isInStock: raw.isInStock ?? true,
      lastSyncedAt: new Date(),
      translations: {
        create: [
          { locale: 'en', title: raw.title_en || raw.title_ar || '' },
          { locale: 'ar', title: raw.title_ar || raw.title_en || '' },
        ],
      },
    },
    update: {
      currentPrice: raw.price,
      productUrl: raw.productUrl,
      isInStock: raw.isInStock ?? true,
      lastSyncedAt: new Date(),
    },
  });

  await prisma.comparisonPriceSnapshot.create({
    data: { storeProductId: offer.id, price: raw.price },
  });

  return offer;
}
