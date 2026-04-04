// app/api/admin/seasonal-pages/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// ── GET — list all seasonal pages ────────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  const pages = await prisma.seasonalPage.findMany({
    include: {
      translations: { where: { locale } },
      countries: {
        include: {
          country: { include: { translations: { where: { locale } } } },
        },
      },
      _count: {
        select: {
          pinnedStores:  true,
          heroVouchers:  true,
          curatedOffers: true,
          blogPosts:     true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(pages);
}

// ── POST — create a seasonal page ────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    slug,
    seasonKey,
    heroImage,
    startMonth, startDay,
    endMonth,   endDay,
    useStorePeakSeasonData,
    showInFooter,
    showInNav,
    isActive,
    translations,
    countryIds,
  } = body;

  if (!slug || !seasonKey) {
    return NextResponse.json({ error: 'slug and seasonKey are required' }, { status: 400 });
  }

  const existing = await prisma.seasonalPage.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: 'A seasonal page with this slug already exists' }, { status: 409 });

  try {
    const page = await prisma.seasonalPage.create({
      data: {
        slug,
        seasonKey,
        heroImage:              heroImage              || null,
        startMonth:             startMonth             || null,
        startDay:               startDay               || null,
        endMonth:               endMonth               || null,
        endDay:                 endDay                 || null,
        useStorePeakSeasonData: useStorePeakSeasonData ?? true,
        showInFooter:           showInFooter           ?? false,
        showInNav:              showInNav              ?? false,
        isActive:               isActive               ?? true,
        translations: {
          create: (translations || []).map(t => ({
            locale:                  t.locale,
            title:                   t.title                   || '',
            description:             t.description             || null,
            seoTitle:                t.seoTitle                || null,
            seoDescription:          t.seoDescription          || null,
            offSeasonTitle:          t.offSeasonTitle          || null,
            offSeasonDescription:    t.offSeasonDescription    || null,
            offSeasonSeoTitle:       t.offSeasonSeoTitle       || null,
            offSeasonSeoDescription: t.offSeasonSeoDescription || null,
          })),
        },
        countries: {
          create: (countryIds || []).map(id => ({ countryId: parseInt(id) })),
        },
      },
      include: {
        translations: true,
        countries: { include: { country: true } },
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('[seasonal-pages POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
