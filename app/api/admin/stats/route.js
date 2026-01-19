import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalStores,
      activeStores,
      totalVouchers,
      activeVouchers,
      expiringVouchers,
      totalClicks,
      recentClicks,
      totalCountries,
      totalCategories
    ] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { isActive: true } }),
      prisma.voucher.count(),
      prisma.voucher.count({
        where: {
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: now } }
          ]
        }
      }),
      prisma.voucher.count({
        where: {
          expiryDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.voucherClick.count(),
      prisma.voucherClick.count({
        where: {
          clickedAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.country.count({ where: { isActive: true } }),
      prisma.category.count()
    ]);

    // Top performing vouchers
    const topVouchers = await prisma.voucher.findMany({
      take: 10,
      include: {
        translations: true,
        store: {
          include: {
            translations: true
          }
        },
        _count: {
          select: { clicks: true }
        }
      },
      orderBy: {
        clicks: {
          _count: 'desc'
        }
      }
    });

    // Top stores
    const topStores = await prisma.store.findMany({
      take: 10,
      include: {
        translations: true,
        _count: {
          select: {
            vouchers: true
          }
        }
      },
      orderBy: {
        vouchers: {
          _count: 'desc'
        }
      }
    });

    return NextResponse.json({
      stats: {
        stores: {
          total: totalStores,
          active: activeStores,
          inactive: totalStores - activeStores
        },
        vouchers: {
          total: totalVouchers,
          active: activeVouchers,
          expiring: expiringVouchers,
          expired: totalVouchers - activeVouchers
        },
        clicks: {
          total: totalClicks,
          last30Days: recentClicks
        },
        countries: totalCountries,
        categories: totalCategories
      },
      topVouchers,
      topStores
    });
  } catch (error) {
    console.error('Admin stats GET error:', error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}