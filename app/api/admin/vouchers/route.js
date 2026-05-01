// app/api/admin/vouchers/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locale    = searchParams.get('locale')  || 'en';
    const page      = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit     = Math.min(200, parseInt(searchParams.get('limit') || '50'));
    const search    = searchParams.get('search')?.trim();
    const storeId   = searchParams.get('storeId') ? parseInt(searchParams.get('storeId')) : null;
    const type      = searchParams.get('type');
    const expired   = searchParams.get('expired') === 'true';

    const now = new Date();

    const where = {
      ...(storeId && { storeId }),
      ...(type    && { type }),
      ...(!expired && {
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: now } },
        ],
      }),
      ...(search && {
        OR: [
          {
            translations: {
              some: {
                locale,
                title: { contains: search, mode: 'insensitive' },
              },
            },
          },
          { code: { contains: search, mode: 'insensitive' } },
          {
            store: {
              translations: {
                some: {
                  locale,
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      }),
    };

    const [total, vouchers] = await Promise.all([
      prisma.voucher.count({ where }),
      prisma.voucher.findMany({
        where,
        include: {
          translations: { where: { locale } },
          store: {
            include: { translations: { where: { locale } } },
          },
          countries: {
            include: {
              country: {
                include: { translations: { where: { locale } } },
              },
            },
          },
          _count: { select: { clicks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: vouchers,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin vouchers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    );
  }
}
