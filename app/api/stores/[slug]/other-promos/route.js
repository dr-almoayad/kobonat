// app/api/stores/[slug]/other-promos/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';
    const countryCode = searchParams.get('country') || 'SA';

    // Find store by slug
    const store = await prisma.store.findFirst({
      where: {
        translations: {
          some: { slug, locale }
        }
      },
      select: { id: true }
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get country
    const country = await prisma.country.findUnique({
      where: { code: countryCode },
      select: { id: true }
    });

    if (!country) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      );
    }

    // Fetch other promos
    const promos = await prisma.otherPromo.findMany({
      where: {
        storeId: store.id,
        countryId: country.id,
        isActive: true,
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } }
        ]
      },
      include: {
        translations: {
          where: { locale }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Transform data
    const transformedPromos = promos.map(p => ({
      id: p.id,
      type: p.type,
      image: p.image,
      url: p.url,
      startDate: p.startDate,
      expiryDate: p.expiryDate,
      title: p.translations[0]?.title || '',
      description: p.translations[0]?.description || '',
      terms: p.translations[0]?.terms || ''
    }));

    return NextResponse.json({
      promos: transformedPromos
    });

  } catch (error) {
    console.error('Other promos fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promos' },
      { status: 500 }
    );
  }
}
