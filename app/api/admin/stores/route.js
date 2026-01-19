import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const stores = await prisma.store.findMany({
      include: {
        translations: {
          where: { locale }
        },
        countries: {
          include: {
            country: {
              include: {
                translations: {
                  where: { locale }
                }
              }
            }
          }
        },
        categories: {
          include: {
            category: {
              include: {
                translations: {
                  where: { locale }
                }
              }
            }
          }
        },
        _count: {
          select: {
            vouchers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(stores);
  } catch (error) {
    console.error('Admin stores API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}