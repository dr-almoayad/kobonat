// app/api/admin/stores/route.js
// GET — list all stores with optional ?search= filter for autocomplete use cases
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
    const locale = searchParams.get('locale') || 'en';
    const search = searchParams.get('search')?.trim();
    const limit  = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined;

   const store = await prisma.store.findUnique({
  where: { id: parseInt(id) },
  include: {
    translations: true,
    countries: { /* ... */ },
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
      // ❌ REMOVE the line below – it causes the error
      // orderBy: { order: "asc" }
    },
    vouchers: { /* ... */ },
    faqs: { /* ... */ },
    otherPromos: { /* ... */ },
    curatedOffers: { /* ... */ },
    products: { /* ... */ },
    paymentMethods: { /* ... */ }
  }
});

    return NextResponse.json(stores);
  } catch (error) {
    console.error('Admin stores API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}
