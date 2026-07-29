// app/api/admin/comparison/products/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.isAdmin ? session : null;
}

// GET — list, with optional search + pagination
export async function GET(req) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));

  const where = search
    ? { translations: { some: { locale: 'en', name: { contains: search, mode: 'insensitive' } } } }
    : {};

  const [total, products] = await Promise.all([
    prisma.comparisonProduct.count({ where }),
    prisma.comparisonProduct.findMany({
      where,
      include: {
        translations: { where: { locale: 'en' } },
        brand: { include: { translations: { where: { locale: 'en' } } } },
        variants: { select: { id: true } },
        offers: { where: { isComparisonOffer: true }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: products,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

// POST — create a canonical product (manual entry; ingestion adapters use lib/comparison/matching.js directly)
export async function POST(req) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { slug, brandId, categoryId, images, specifications, name_en, name_ar, description_en, description_ar } = body;

  if (!slug || !name_en) {
    return NextResponse.json({ error: 'slug and name_en are required' }, { status: 400 });
  }

  try {
    const product = await prisma.comparisonProduct.create({
      data: {
        slug,
        brandId: brandId ? parseInt(brandId) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        images: images || [],
        specifications: specifications || null,
        isActive: true,
        translations: {
          create: [
            { locale: 'en', name: name_en, description: description_en || null },
            { locale: 'ar', name: name_ar || name_en, description: description_ar || null },
          ],
        },
        variants: {
          create: [{ attributes: {}, isDefault: true, isActive: true }],
        },
      },
      include: { translations: true, variants: true },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error('[admin/comparison/products POST]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
