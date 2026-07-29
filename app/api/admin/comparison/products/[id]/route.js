// app/api/admin/comparison/products/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.isAdmin ? session : null;
}

export async function GET(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const product = await prisma.comparisonProduct.findUnique({
    where: { id: parseInt(id) },
    include: {
      translations: true,
      brand: { include: { translations: true } },
      category: { include: { translations: { where: { locale: 'en' } } } },
      variants: true,
      offers: {
        where: { isComparisonOffer: true },
        include: { store: { include: { translations: { where: { locale: 'en' } } } } },
        orderBy: { currentPrice: 'asc' },
      },
    },
  });

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const productId = parseInt(id);
  const body = await req.json();
  const { slug, brandId, categoryId, images, specifications, isActive, name_en, name_ar, description_en, description_ar } = body;

  try {
    await prisma.comparisonProduct.update({
      where: { id: productId },
      data: {
        ...(slug !== undefined && { slug }),
        ...(brandId !== undefined && { brandId: brandId ? parseInt(brandId) : null }),
        ...(categoryId !== undefined && { categoryId: categoryId ? parseInt(categoryId) : null }),
        ...(images !== undefined && { images }),
        ...(specifications !== undefined && { specifications }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    for (const [locale, name, description] of [
      ['en', name_en, description_en],
      ['ar', name_ar, description_ar],
    ]) {
      if (!name) continue;
      await prisma.comparisonProductTranslation.upsert({
        where: { productId_locale: { productId, locale } },
        create: { productId, locale, name, description: description || null },
        update: { name, description: description || null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/comparison/products/[id] PUT]', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const productId = parseInt(id);

  const offerCount = await prisma.storeProduct.count({ where: { comparisonProductId: productId } });
  if (offerCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${offerCount} seller offer(s) still reference this product. Remove them first.` },
      { status: 400 }
    );
  }

  await prisma.comparisonProduct.delete({ where: { id: productId } });
  return NextResponse.json({ success: true });
}
