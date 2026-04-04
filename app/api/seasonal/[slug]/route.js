// app/api/seasonal/[slug]/route.js
// Public endpoint — returns everything the seasonal page needs in one call.
// Query params: locale, country

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 300; // 5 min cache

// ── Season live detection ────────────────────────────────────────────────────
// Returns true if today falls within the annual start/end window.
// Handles year-spanning seasons (e.g. Dec 20 → Jan 5).
function isSeasonLive(page) {
  if (!page.startMonth || !page.endMonth) return false;

  const now     = new Date();
  const month   = now.getMonth() + 1; // 1-12
  const day     = now.getDate();

  const startNum   = page.startMonth * 100 + (page.startDay   || 1);
  const endNum     = page.endMonth   * 100 + (page.endDay     || 28);
  const currentNum = month           * 100 + day;

  if (startNum <= endNum) {
    // Normal window e.g. Oct 1 → Nov 30
    return currentNum >= startNum && currentNum <= endNum;
  } else {
    // Year-spanning e.g. Dec 20 → Jan 5
    return currentNum >= startNum || currentNum <= endNum;
  }
}

// Days until the season starts (returns null if no dates set or season is live)
function daysUntilSeason(page) {
  if (!page.startMonth || isSeasonLive(page)) return null;

  const now   = new Date();
  const year  = now.getFullYear();
  let target  = new Date(year, page.startMonth - 1, page.startDay || 1);
  if (target <= now) target = new Date(year + 1, page.startMonth - 1, page.startDay || 1);

  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale      = searchParams.get('locale')  || 'ar';
    const countryCode = searchParams.get('country') || 'SA';
    const lang        = locale.split('-')[0];

    // ── 1. Fetch the seasonal page ───────────────────────────────────────────
    const page = await prisma.seasonalPage.findUnique({
      where: { slug, isActive: true },
      include: {
        translations: { where: { locale: lang } },
        countries: {
          include: { country: true },
        },
        pinnedStores: {
          orderBy: { order: 'asc' },
          include: {
            store: {
              include: {
                translations: { where: { locale: lang } },
                _count: {
                  select: {
                    vouchers: {
                      where: {
                        OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
                        countries: { some: { country: { code: countryCode } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        heroVouchers: {
          orderBy: { order: 'asc' },
          include: {
            voucher: {
              include: {
                translations: { where: { locale: lang } },
                store: { include: { translations: { where: { locale: lang } } } },
                _count: { select: { clicks: true } },
              },
            },
          },
        },
        curatedOffers: {
          orderBy: { order: 'asc' },
          include: {
            offer: {
              include: {
                translations: { where: { locale: lang } },
                store: { include: { translations: { where: { locale: lang } } } },
              },
            },
          },
        },
        blogPosts: {
          orderBy: { order: 'asc' },
          include: {
            post: {
              where:   { status: 'PUBLISHED' },
              include: {
                translations: { where: { locale: lang } },
                author:   true,
                category: { include: { translations: { where: { locale: lang } } } },
              },
            },
          },
        },
      },
    });

    if (!page) return NextResponse.json({ error: 'Seasonal page not found' }, { status: 404 });

    // ── 2. Country check ─────────────────────────────────────────────────────
    const country = await prisma.country.findUnique({
      where:   { code: countryCode, isActive: true },
      include: { translations: { where: { locale: lang } } },
    });

    if (!country) return NextResponse.json({ error: 'Country not found' }, { status: 404 });

    const allowedInCountry = page.countries.some(pc => pc.country.code === countryCode);
    if (!allowedInCountry) {
      return NextResponse.json({ error: 'Seasonal page not available in this country' }, { status: 403 });
    }

    // ── 3. Build store list (pinned + auto-pulled via StorePeakSeason) ────────
    const pinnedStoreIds = new Set(page.pinnedStores.map(ps => ps.store.id));

    let autoStores = [];
    if (page.useStorePeakSeasonData) {
      autoStores = await prisma.store.findMany({
        where: {
          isActive:    true,
          id:          { notIn: [...pinnedStoreIds] }, // avoid duplicates
          peakSeasons: { some: { seasonKey: page.seasonKey } },
          countries:   { some: { country: { code: countryCode } } },
        },
        include: {
          translations: { where: { locale: lang } },
          _count: {
            select: {
              vouchers: {
                where: {
                  OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
                  countries: { some: { country: { code: countryCode } } },
                },
              },
            },
          },
        },
        orderBy: { isFeatured: 'desc' },
      });
    }

    const transformStore = s => ({
      id:                  s.id,
      name:                s.translations[0]?.name  || '',
      slug:                s.translations[0]?.slug  || '',
      logo:                s.logo,
      bigLogo:             s.bigLogo,
      color:               s.color,
      isFeatured:          s.isFeatured,
      activeVouchersCount: s._count?.vouchers || 0,
    });

    const allStores = [
      ...page.pinnedStores.map(ps => transformStore(ps.store)),
      ...autoStores.map(transformStore),
    ];

    // ── 4. Vouchers from all stores ──────────────────────────────────────────
    const now = new Date();
    const allStoreIds = allStores.map(s => s.id);

    const vouchers = allStoreIds.length > 0
      ? await prisma.voucher.findMany({
          where: {
            storeId:  { in: allStoreIds },
            OR:       [{ expiryDate: null }, { expiryDate: { gte: now } }],
            countries: { some: { country: { code: countryCode } } },
          },
          include: {
            translations: { where: { locale: lang } },
            store: { include: { translations: { where: { locale: lang } } } },
            _count: { select: { clicks: true } },
          },
          orderBy: [
            { isExclusive:    'desc' },
            { isVerified:     'desc' },
            { popularityScore: 'desc' },
          ],
          take: 100,
        })
      : [];

    const transformVoucher = v => ({
      ...v,
      title:       v.translations[0]?.title       || '',
      description: v.translations[0]?.description || null,
      store: v.store ? {
        id:    v.store.id,
        name:  v.store.translations[0]?.name || '',
        slug:  v.store.translations[0]?.slug || '',
        logo:  v.store.logo,
      } : null,
      translations: undefined,
    });

    // ── 5. Compose response ─────────────────────────────────────────────────
    const translation = page.translations[0] || {};
    const live        = isSeasonLive(page);

    const response = {
      // Page metadata — switches copy based on live status
      page: {
        id:         page.id,
        slug:       page.slug,
        seasonKey:  page.seasonKey,
        heroImage:  page.heroImage,
        isLive:     live,
        daysUntil:  daysUntilSeason(page),
        startMonth: page.startMonth,
        startDay:   page.startDay,
        endMonth:   page.endMonth,
        endDay:     page.endDay,
        // Caller gets the right copy for the current state
        title:          live ? (translation.title          || translation.offSeasonTitle          || '') : (translation.offSeasonTitle          || translation.title          || ''),
        description:    live ? (translation.description    || translation.offSeasonDescription    || '') : (translation.offSeasonDescription    || translation.description    || ''),
        seoTitle:       live ? (translation.seoTitle       || translation.offSeasonSeoTitle       || '') : (translation.offSeasonSeoTitle       || translation.seoTitle       || ''),
        seoDescription: live ? (translation.seoDescription || translation.offSeasonSeoDescription || '') : (translation.offSeasonSeoDescription || translation.seoDescription || ''),
        // Also expose both so page can decide
        liveTranslation:      translation,
      },

      country: {
        code:     country.code,
        name:     country.translations[0]?.name || country.code,
        currency: country.currency,
      },

      stores:  allStores,
      vouchers: vouchers.map(transformVoucher),

      heroVouchers: page.heroVouchers
        .filter(pv => pv.voucher)
        .map(pv => transformVoucher(pv.voucher)),

      curatedOffers: page.curatedOffers
        .filter(pc => pc.offer)
        .map(pc => ({
          ...pc.offer,
          title:       pc.offer.translations[0]?.title   || '',
          description: pc.offer.translations[0]?.description || null,
          ctaText:     pc.offer.translations[0]?.ctaText || '',
          store: pc.offer.store ? {
            id:   pc.offer.store.id,
            name: pc.offer.store.translations[0]?.name || '',
            slug: pc.offer.store.translations[0]?.slug || '',
            logo: pc.offer.store.logo,
          } : null,
          translations: undefined,
        })),

      blogPosts: page.blogPosts
        .filter(pb => pb.post?.status === 'PUBLISHED')
        .map(pb => {
          const p  = pb.post;
          const pt = p.translations[0] || {};
          return {
            id:            p.id,
            slug:          p.slug,
            featuredImage: p.featuredImage,
            publishedAt:   p.publishedAt,
            title:         pt.title   || '',
            excerpt:       pt.excerpt || '',
            author: p.author ? {
              name:   p.author.nameAr || p.author.name,
              avatar: p.author.avatar,
            } : null,
            category: p.category ? {
              name:  p.category.translations[0]?.name || '',
              color: p.category.color,
            } : null,
          };
        }),

      totals: {
        stores:       allStores.length,
        vouchers:     vouchers.length,
        heroVouchers: page.heroVouchers.length,
      },
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });

  } catch (error) {
    console.error('[/api/seasonal/[slug]]', error);
    return NextResponse.json({ error: 'Failed to fetch seasonal page' }, { status: 500 });
  }
}
