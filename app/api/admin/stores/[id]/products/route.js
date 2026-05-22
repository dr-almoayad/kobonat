// app/api/admin/stores/[id]/products/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const products = await prisma.storeProduct.findMany({
      where: { storeId: parseInt(id) },
      include: {
        translations: true,
        _count: { select: { clicks: true } },
        // Linked voucher for the promo ribbon
        linkedVoucher: {
          include: {
            translations: { where: { locale } },
          },
        },
        // Linked other promo (bank / payment offer) for the promo ribbon
        linkedPromo: {
          include: {
            translations: { where: { locale } },
            bank: {
              include: { translations: { where: { locale } } },
            },
            paymentMethod: {
              include: { translations: { where: { locale } } },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[admin/stores/[id]/products GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
