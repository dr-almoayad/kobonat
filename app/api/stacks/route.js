// app/api/stacks/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const PER_PAGE = 12;

const buildVoucherSelect = (language) => ({
  id: true, code: true, discount: true, discountPercent: true, verifiedAvgPercent: true,
  landingUrl: true, expiryDate: true,
  translations: { where: { locale: language }, select: { title: true } },
});

const buildPromoSelect = (language) => ({
  id: true, type: true, url: true, image: true, discountPercent: true, verifiedAvgPercent: true, expiryDate: true,
  translations: { where: { locale: language }, select: { title: true } },
  bank: { select: { logo: true, translations: { where: { locale: language }, select: { name: true } } } },
});

function toStackShape(ds, isAr, now) {
  const items = [];

  if (ds.codeVoucher) {
    const isExpired = !!ds.codeVoucher.expiryDate && new Date(ds.codeVoucher.expiryDate) < now;
    const t = ds.codeVoucher.translations?.[0] || {};
    items.push({
      id: ds.codeVoucher.id, itemType: 'CODE',
      title: t.title || ds.codeVoucher.discount || (isAr ? 'كود خصم' : 'Coupon Code'),
      discount: ds.codeVoucher.discount || null,
      discountPercent: ds.codeVoucher.verifiedAvgPercent ?? ds.codeVoucher.discountPercent ?? null,
      code: ds.codeVoucher.code || null, landingUrl: ds.codeVoucher.landingUrl || null, isExpired,
    });
  }

  if (ds.dealVoucher) {
    const isExpired = !!ds.dealVoucher.expiryDate && new Date(ds.dealVoucher.expiryDate) < now;
    const t = ds.dealVoucher.translations?.[0] || {};
    items.push({
      id: ds.dealVoucher.id, itemType: 'DEAL',
      title: t.title || ds.dealVoucher.discount || (isAr ? 'عرض' : 'Deal'),
      discount: ds.dealVoucher.discount || null,
      discountPercent: ds.dealVoucher.verifiedAvgPercent ?? ds.dealVoucher.discountPercent ?? null,
      code: null, landingUrl: ds.dealVoucher.landingUrl || null, isExpired,
    });
  }

  if (ds.promo) {
    const isExpired = !!ds.promo.expiryDate && new Date(ds.promo.expiryDate) < now;
    const t = ds.promo.translations?.[0] || {};
    items.push({
      id: ds.promo.id, itemType: 'BANK_OFFER',
      title: t.title || ds.promo.bank?.translations?.[0]?.name || (isAr ? 'عرض بنكي' : 'Bank Offer'),
      discount: null,
      discountPercent: ds.promo.verifiedAvgPercent ?? ds.promo.discountPercent ?? null,
      code: null, landingUrl: ds.promo.url || null,
      bankName: ds.promo.bank?.translations?.[0]?.name || null,
      bankLogo: ds.promo.bank?.logo || ds.promo.image || null, isExpired,
    });
  }

  if (items.length < 2) return null;

  const isExpired = items.some(i => i.isExpired);
  if (isExpired) return null; 

  const activePercents = items.map(i => (i.discountPercent || 0) / 100).filter(p => p > 0);
  const combinedSavingsPercent = activePercents.length >= 2
      ? Math.round((1 - activePercents.reduce((acc, p) => acc * (1 - p), 1)) * 100)
      : activePercents.length === 1 ? Math.round(activePercents[0] * 100) : null;

  const st = ds.store?.translations?.[0] || {};
  return {
    storeId: ds.store?.id,
    store: { id: ds.store?.id, name: st.name || '', slug: st.slug || '', logo: ds.store?.logo || null },
    items, combinedSavingsPercent, isExpired: false, 
  };
}

// Cache the RAW query results (no time-based filtering)
const getCachedStackRows = unstable_cache(
  async (language) => {
    return await prisma.offerStack.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: 500, 
      include: {
        store: { select: { id: true, logo: true, translations: { where: { locale: language }, select: { name: true, slug: true } } } },
        codeVoucher: { select: buildVoucherSelect(language) },
        dealVoucher: { select: buildVoucherSelect(language) },
        promo: { select: buildPromoSelect(language) },
      },
    });
  },
  ['stacks-db-rows'],
  // ✅ FIXED: 1 hour revalidation – fresh data for infinite scroll
  { tags: ['stacks'], revalidate: 3600 }
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const locale = searchParams.get('locale') || 'ar-SA';
    const [language] = locale.split('-');
    const isAr = language === 'ar';
    const now = new Date();

    // Fetch cached rows (fresh up to 1 hour)
    const rows = await getCachedStackRows(language);

    // Filter and transform in memory using the current time
    const activeStacksOnly = rows
      .map(ds => toStackShape(ds, isAr, now))
      .filter(Boolean); 

    const total = activeStacksOnly.length;
    const skip = (page - 1) * PER_PAGE;
    const stacks = activeStacksOnly.slice(skip, skip + PER_PAGE);
    const hasMore = skip + PER_PAGE < total;

    return NextResponse.json({ stacks, total, hasMore, page });
  } catch (error) {
    console.error('[GET /api/stacks]', error);
    return NextResponse.json({ stacks: [], total: 0, hasMore: false, page: 1 }, { status: 500 });
  }
}
