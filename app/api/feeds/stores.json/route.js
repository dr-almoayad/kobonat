// app/api/feeds/stores.json/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function GET() {
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
      countries: { some: { country: { code: 'SA', isActive: true } } },
    },
    include: {
      translations: { where: { locale: { in: ['ar', 'en'] } } },
    },
    orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
  });

  const data = stores.map((store) => {
    const ar = store.translations.find((t) => t.locale === 'ar') || {};
    const en = store.translations.find((t) => t.locale === 'en') || {};
    return {
      id: store.id,
      nameAr: ar.name || null,
      nameEn: en.name || null,
      slugAr: ar.slug || null,
      slugEn: en.slug || null,
      descriptionAr: ar.description || null,
      descriptionEn: en.description || null,
      pageUrlAr: ar.slug
        ? `${BASE_URL}/ar-SA/stores/${ar.slug}`
        : null,
      pageUrlEn: en.slug
        ? `${BASE_URL}/en-SA/stores/${en.slug}`
        : null,
      logo: store.logo || null,
      websiteUrl: store.websiteUrl || null,
      isFeatured: store.isFeatured,
      updatedAt: store.updatedAt,
    };
  });

  return NextResponse.json(
    { count: data.length, generatedAt: new Date().toISOString(), stores: data },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    }
  );
}
