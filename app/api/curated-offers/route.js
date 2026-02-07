// app/api/curated-offers/route.js - Fetch curated offers
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';
    const storeId = searchParams.get('storeId');
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const where = {
      isActive: true,
      AND: [
        {
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: new Date() } }
          ]
        }
      ]
    };
    
    // Filter by store
    if (storeId) {
      where.storeId = parseInt(storeId);
    }
    
    // Filter by featured
    if (featured) {
      where.isFeatured = true;
    }
    
    const offers = await prisma.curatedOffer.findMany({
      where,
      include: {
        translations: {
          where: { locale }
        },
        store: {
          include: {
            translations: {
              where: { locale }
            }
          }
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });
    
    // Transform data
    const transformedOffers = offers.map(offer => ({
      id: offer.id,
      offerImage: offer.offerImage,
      code: offer.code,
      type: offer.type,
      ctaUrl: offer.ctaUrl,
      startDate: offer.startDate,
      expiryDate: offer.expiryDate,
      isFeatured: offer.isFeatured,
      title: offer.translations[0]?.title || '',
      description: offer.translations[0]?.description || null,
      ctaText: offer.translations[0]?.ctaText || '',
      store: offer.store ? {
        id: offer.store.id,
        name: offer.store.translations[0]?.name || '',
        slug: offer.store.translations[0]?.slug || '',
        logo: offer.store.logo
      } : null
    }));
    
    return NextResponse.json({
      offers: transformedOffers,
      total: offers.length
    });
    
  } catch (error) {
    console.error('Curated offers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curated offers' },
      { status: 500 }
    );
  }
}
