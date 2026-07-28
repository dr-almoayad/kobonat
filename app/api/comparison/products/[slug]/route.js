// app/api/comparison/products/[slug]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBestEffectiveOffer } from '@/lib/comparison/effectivePrice';

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';
    const countryCode = searchParams.get('country') || 'SA';

    const [language] = locale.split('-');

    const country = await prisma.country.findUnique({ where: { code: countryCode, isActive: true } });
    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    const product = await prisma.comparisonProduct.findUnique({
      where: { slug, isActive: true },
      include: {
        translations: { where: { locale: language } },
        brand: { include: { translations: { where: { locale: language } } } },
        category: { include: { translations: { where: { locale: language } } } },
        variants: { where: { isActive: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const t = product.translations[0] || {};

    // Default variant unless a specific one is requested
    const variantParam = searchParams.get('variant');
    const selectedVariant = variantParam
      ? product.variants.find((v) => v.id === parseInt(variantParam))
      : product.variants.find((v) => v.isDefault) || product.variants[0];

    const offers = await getBestEffectiveOffer({
      comparisonProductId: product.id,
      comparisonVariantId: selectedVariant?.id ?? null,
      countryId: country.id,
    });

    // Shape offers for the frontend, resolving store name/logo per locale
    const storeIds = [...new Set(offers.map((o) => o.storeId))];
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      include: { translations: { where: { locale: language } } },
    });
    const storeMap = new Map(stores.map((s) => [s.id, s]));

    const transformedOffers = offers.map((o) => {
      const store = storeMap.get(o.storeId);
      return {
        storeProductId: o.storeProductId,
        storeId: o.storeId,
        storeName: store?.translations[0]?.name || '',
        storeLogo: store?.logo || null,
        listedPrice: o.listedPrice,
        effectivePrice: o.effectivePrice,
        savingsAmount: o.savingsAmount,
        savingsPercent: o.savingsPercent,
        stackingPath: o.stackingPath,
        productUrl: o.productUrl,
      };
    });

    return NextResponse.json({
      product: {
        id: product.id,
        slug: product.slug,
        name: t.name || '',
        description: t.description || null,
        images: product.images,
        brand: product.brand ? { name: product.brand.translations[0]?.name || '', logo: product.brand.logo } : null,
        category: product.category ? { name: product.category.translations[0]?.name || '', slug: product.category.slug } : null,
        specifications: product.specifications || [],
      },
      variants: product.variants.map((v) => ({ id: v.id, attributes: v.attributes, isDefault: v.isDefault })),
      selectedVariantId: selectedVariant?.id ?? null,
      offers: transformedOffers,
      bestOffer: transformedOffers[0] || null,
      country: { code: country.code },
    });
  } catch (error) {
    console.error('[/api/comparison/products/[slug]]', error);
    return NextResponse.json({ error: 'Failed to fetch comparison product' }, { status: 500 });
  }
}
