// app/api/search/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import localSearchEngine from '@/lib/search/localSearchEngine';

// ── Data loader ───────────────────────────────────────────────────────────────
// In-memory Map caching doesn't work in serverless (each invocation is isolated).
// We fetch fresh data on every request and rely on the CDN/edge Cache-Control
// header set on the response to avoid hammering the DB from the same user.

async function loadSearchData(countryCode, locale) {
  try {
    const [language] = locale.split('-');

    const [stores, vouchers] = await Promise.all([
      // Stores
      prisma.store.findMany({
        where: {
          isActive: true,
          countries: {
            some: {
              country: {
                code: countryCode,
                isActive: true,
              },
            },
          },
        },
        include: {
          translations: {
            where:  { locale: language },
            select: { name: true, slug: true, description: true },
          },
          categories: {
            include: {
              category: {
                select: {
                  id:    true,
                  icon:  true,
                  color: true,
                  translations: {
                    where:  { locale: language },
                    select: { name: true, slug: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              vouchers: {
                where: {
                  expiryDate: { gte: new Date() },
                  countries: {
                    some: { country: { code: countryCode } },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
      }),

      // Vouchers
      prisma.voucher.findMany({
        where: {
          expiryDate: { gte: new Date() },
          countries: {
            some: { country: { code: countryCode } },
          },
        },
        include: {
          translations: {
            where:  { locale: language },
            select: { title: true, description: true },
          },
          store: {
            include: {
              translations: {
                where:  { locale: language },
                select: { name: true, slug: true },
              },
            },
          },
          _count: { select: { clicks: true } },
        },
        orderBy: [
          { isExclusive:     'desc' },
          { popularityScore: 'desc' },
        ],
      }),
    ]);

    // Transform stores
    const transformedStores = stores.map(store => {
      const storeTranslation = store.translations?.[0] || {};

      const categories = [];
      const seenIds    = new Set();
      for (const sc of store.categories || []) {
        if (sc.category && !seenIds.has(sc.category.id)) {
          seenIds.add(sc.category.id);
          const catT = sc.category.translations?.[0] || {};
          categories.push({
            id:    sc.category.id,
            name:  catT.name  || '',
            slug:  catT.slug  || '',
            icon:  sc.category.icon  || '',
            color: sc.category.color || '',
          });
        }
      }

      return {
        id:                  store.id,
        name:                storeTranslation.name        || '',
        slug:                storeTranslation.slug        || '',
        description:         storeTranslation.description || '',
        logo:                store.logo,
        color:               store.color,
        websiteUrl:          store.websiteUrl,
        isActive:            store.isActive,
        isFeatured:          store.isFeatured,
        categories,
        _count:              store._count || { vouchers: 0 },
        activeVouchersCount: store._count?.vouchers || 0,
      };
    });

    // Transform vouchers
    const transformedVouchers = vouchers.map(voucher => {
      const vt = voucher.translations?.[0]  || {};
      const st = voucher.store?.translations?.[0] || {};

      return {
        id:             voucher.id,
        title:          vt.title       || '',
        description:    vt.description || '',
        code:           voucher.code,
        type:           voucher.type,
        discount:       voucher.discount,
        landingUrl:     voucher.landingUrl,
        startDate:      voucher.startDate,
        expiryDate:     voucher.expiryDate,
        isExclusive:    voucher.isExclusive,
        isVerified:     voucher.isVerified,
        popularityScore:voucher.popularityScore,
        storeId:        voucher.store?.id,
        store: voucher.store ? {
          id:    voucher.store.id,
          name:  st.name  || '',
          slug:  st.slug  || '',
          logo:  voucher.store.logo,
          color: voucher.store.color,
        } : null,
        _count: voucher._count || { clicks: 0 },
      };
    });

    return {
      stores:      transformedStores,
      vouchers:    transformedVouchers,
      countryCode,
      language,
      locale,
    };
  } catch (error) {
    console.error('❌ loadSearchData error:', error);
    return {
      stores:      [],
      vouchers:    [],
      countryCode,
      language:    locale.split('-')[0],
      locale,
    };
  }
}

function extractCountryCode(locale) {
  if (!locale) return 'SA';
  const parts = locale.split('-');
  return parts.length > 1 ? parts[1].toUpperCase() : 'SA';
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const query       = decodeURIComponent(searchParams.get('q')       || '');
    const type        = searchParams.get('type')    || 'all';
    const locale      = searchParams.get('locale')  || 'en';
    const limit       = parseInt(searchParams.get('limit') || '20');
    const countryCode = searchParams.get('country') || extractCountryCode(locale);
    const [language]  = locale.split('-');

    // Short-circuit for empty query
    if (!query.trim()) {
      return NextResponse.json(
        { query: '', type, locale, countryCode, stores: [], vouchers: [], total: 0 },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const data = await loadSearchData(countryCode, locale);

    let storeResults  = [];
    let voucherResults = [];

    if (type === 'all' || type === 'stores') {
      const result = localSearchEngine.searchStores(
        query,
        data.stores,
        { locale: language, limit: type === 'stores' ? limit : Math.min(limit, 10) }
      );
      storeResults = result.results;
    }

    if (type === 'all' || type === 'vouchers') {
      const result = localSearchEngine.searchVouchers(
        query,
        data.vouchers,
        { locale: language, limit: type === 'vouchers' ? limit : Math.min(limit, 10) }
      );
      voucherResults = result.results;
    }

    const response = {
      query,
      type,
      locale,
      countryCode,
      stores:    storeResults,
      vouchers:  voucherResults,
      total:     storeResults.length + voucherResults.length,
      timestamp: new Date().toISOString(),
    };

    // Cache at the edge for 60 s — fast for users, doesn't hammer the DB
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });

  } catch (error) {
    console.error('❌ Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', stores: [], vouchers: [], total: 0 },
      { status: 500 }
    );
  }
}

// ── POST — no-op cache clear (kept for API compatibility) ─────────────────────

export async function POST() {
  // In-memory cache was removed — nothing to clear.
  // If you add Redis later, clear it here.
  return NextResponse.json({ success: true, message: 'No cache to clear' });
}
