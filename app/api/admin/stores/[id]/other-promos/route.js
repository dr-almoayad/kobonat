// app/api/admin/stores/[id]/other-promos/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const promos = await prisma.otherPromo.findMany({
      where: { storeId: parseInt(id) },
      include: {
        translations: {
          where: { locale }
        },
        country: {
          include: {
            translations: {
              where: { locale }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      promos: promos.map(p => ({
        ...p,
        title: p.translations[0]?.title || '',
        description: p.translations[0]?.description || '',
        terms: p.translations[0]?.terms || ''
      }))
    });

  } catch (error) {
    console.error('Admin other promos fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promos' },
      { status: 500 }
    );
  }
}
