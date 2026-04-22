// app/api/admin/categories/[id]/featured-items/route.js
// Returns every directly-tagged item for a category.
// Used by the CategoryItemsManager admin component.

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import { prisma }           from '@/lib/prisma';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const categoryId = parseInt(id);
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  const [voucherRows, stackRows, productRows, promoRows] = await Promise.all([

    prisma.voucherCategory.findMany({
      where:   { categoryId },
      include: {
        voucher: {
          include: {
            translations: { where: { locale } },
            store: { include: { translations: { where: { locale } } } },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
    }),

    prisma.offerStackCategory.findMany({
      where:   { categoryId },
      include: {
        stack: {
          include: {
            store:       { include: { translations: { where: { locale } } } },
            codeVoucher: { include: { translations: { where: { locale } } } },
            dealVoucher: { include: { translations: { where: { locale } } } },
            promo: {
              include: {
                translations: { where: { locale } },
                bank:         { include: { translations: { where: { locale } } } },
              },
            },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
    }),

    prisma.storeProductCategory.findMany({
      where:   { categoryId },
      include: {
        product: {
          include: {
            translations: { where: { locale } },
            store: { include: { translations: { where: { locale } } } },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
    }),

    prisma.otherPromoCategory.findMany({
      where:   { categoryId },
      include: {
        promo: {
          include: {
            translations: { where: { locale } },
            store:        { include: { translations: { where: { locale } } } },
            bank:         { include: { translations: { where: { locale } } } },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
    }),

  ]);

  return NextResponse.json({
    vouchers:      voucherRows,
    offerStacks:   stackRows,
    storeProducts: productRows,
    otherPromos:   promoRows,
  });
}
