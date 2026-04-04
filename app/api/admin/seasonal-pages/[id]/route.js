// app/api/admin/seasonal-pages/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  const page = await prisma.seasonalPage.findUnique({
    where: { id: parseInt(id) },
    include: {
      translations: true, // all locales for the editor
      countries: {
        include: {
          country: { include: { translations: { where: { locale } } } },
        },
      },
      pinnedStores: {
        orderBy: { order: 'asc' },
        include: {
          store: {
            include: { translations: { where: { locale } } },
          },
        },
      },
      heroVouchers: {
        orderBy: { order: 'asc' },
        include: {
          voucher: {
            include: {
              translations: { where: { locale } },
              store: { include: { translations: { where: { locale } } } },
            },
          },
        },
      },
      curatedOffers: {
        orderBy: { order: 'asc' },
        include: {
          offer: {
            include: {
              translations: { where: { locale } },
              store: { include: { translations: { where: { locale } } } },
            },
          },
        },
      },
      blogPosts: {
        orderBy: { order: 'asc' },
        include: {
          post: {
            include: { translations: { where: { locale } } },
          },
        },
      },
    },
  });

  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(page);
}

// ── PUT ───────────────────────────────────────────────────────────────────────
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const pageId = parseInt(id);
  const body   = await req.json();

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

  // Slug uniqueness check (exclude self)
  if (slug) {
    const conflict = await prisma.seasonalPage.findFirst({
      where: { slug, id: { not: pageId } },
    });
    if (conflict) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
  }

  try {
    // Core update
    await prisma.seasonalPage.update({
      where: { id: pageId },
      data: {
        ...(slug             !== undefined && { slug }),
        ...(seasonKey        !== undefined && { seasonKey }),
        heroImage:                           heroImage              ?? null,
        ...(startMonth       !== undefined && { startMonth: startMonth || null }),
        ...(startDay         !== undefined && { startDay:   startDay   || null }),
        ...(endMonth         !== undefined && { endMonth:   endMonth   || null }),
        ...(endDay           !== undefined && { endDay:     endDay     || null }),
        ...(useStorePeakSeasonData !== undefined && { useStorePeakSeasonData }),
        ...(showInFooter     !== undefined && { showInFooter }),
        ...(showInNav        !== undefined && { showInNav }),
        ...(isActive         !== undefined && { isActive }),
      },
    });

    // Replace translations
    if (Array.isArray(translations)) {
      await prisma.seasonalPageTranslation.deleteMany({ where: { seasonalPageId: pageId } });
      if (translations.length > 0) {
        await prisma.seasonalPageTranslation.createMany({
          data: translations.map(t => ({
            seasonalPageId:          pageId,
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
        });
      }
    }

    // Replace country associations
    if (Array.isArray(countryIds)) {
      await prisma.seasonalPageCountry.deleteMany({ where: { seasonalPageId: pageId } });
      if (countryIds.length > 0) {
        await prisma.seasonalPageCountry.createMany({
          data: countryIds.map(cid => ({ seasonalPageId: pageId, countryId: parseInt(cid) })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[seasonal-pages PUT]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.seasonalPage.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[seasonal-pages DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
