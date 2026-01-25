// ============================================================================
// API ROUTE: app/api/stores/[slug]/products/route.js
// ============================================================================

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    // Find store by slug
    const store = await prisma.store.findFirst({
      where: {
        translations: {
          some: {
            slug,
            locale
          }
        },
        isActive: true
      },
      select: { id: true }
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get featured products
    const products = await prisma.storeProduct.findMany({
      where: {
        storeId: store.id,
        isFeatured: true
      },
      include: {
        translations: {
          where: { locale }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      take: 12 // Limit to 12 featured products
    });

    // Transform data
    const transformedProducts = products.map(p => ({
      id: p.id,
      image: p.image,
      price: p.price,
      originalPrice: p.originalPrice,
      productUrl: p.productUrl,
      clickCount: p.clickCount,
      title: p.translations[0]?.title || '',
      description: p.translations[0]?.description || ''
    }));

    return NextResponse.json({
      products: transformedProducts,
      total: products.length
    });

  } catch (error) {
    console.error('Store products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
