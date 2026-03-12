// app/api/admin/comparison-tables/[tableId]/columns/[columnId]/route.js
// PATCH  — update column metadata and translations
// DELETE — remove a column (cascades cells)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

export async function PATCH(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { columnId } = await params;
  const id = parseInt(columnId);
  const body = await req.json();

  const {
    nameEn, nameAr, descriptionEn, descriptionAr, badgeEn, badgeAr,
    image, isHighlighted, ctaUrl, order,
    storeId, bankId, bankCardId, voucherId, promoId, productId,
  } = body;

  await prisma.comparisonTableColumn.update({
    where: { id },
    data: {
      ...(image         !== undefined && { image:         image         || null }),
      ...(isHighlighted !== undefined && { isHighlighted: Boolean(isHighlighted) }),
      ...(ctaUrl        !== undefined && { ctaUrl:        ctaUrl        || null }),
      ...(order         !== undefined && { order:         parseInt(order) }),
      // Entity links — explicit null to clear
      ...(storeId    !== undefined && { storeId:    storeId    ? parseInt(storeId)    : null }),
      ...(bankId     !== undefined && { bankId:     bankId     ? parseInt(bankId)     : null }),
      ...(bankCardId !== undefined && { bankCardId: bankCardId ? parseInt(bankCardId) : null }),
      ...(voucherId  !== undefined && { voucherId:  voucherId  ? parseInt(voucherId)  : null }),
      ...(promoId    !== undefined && { promoId:    promoId    ? parseInt(promoId)    : null }),
      ...(productId  !== undefined && { productId:  productId  ? parseInt(productId)  : null }),
    },
  });

  // Upsert translations
  for (const [locale, name, description, badge] of [
    ['en', nameEn, descriptionEn, badgeEn],
    ['ar', nameAr, descriptionAr, badgeAr],
  ]) {
    if (name !== undefined || description !== undefined || badge !== undefined) {
      const col = await prisma.comparisonTableColumn.findUnique({ where: { id }, select: { tableId: true } });
      await prisma.comparisonTableColumnTranslation.upsert({
        where:  { columnId_locale: { columnId: id, locale } },
        create: { columnId: id, locale, name: name || '', description: description || null, badge: badge || null },
        update: {
          ...(name        !== undefined && { name:        name        || '' }),
          ...(description !== undefined && { description: description || null }),
          ...(badge       !== undefined && { badge:       badge       || null }),
        },
      });
    }
  }

  const updated = await prisma.comparisonTableColumn.findUnique({
    where: { id },
    include: {
      translations: true, cells: true,
      store:    { select: { id: true, logo: true, translations: { where: { locale: 'en' }, select: { name: true } } } },
      bank:     { select: { id: true, logo: true, color: true, translations: { where: { locale: 'en' }, select: { name: true } } } },
      bankCard: { select: { id: true, network: true, tier: true, image: true, translations: { where: { locale: 'en' }, select: { name: true } } } },
      product:  { select: { id: true, image: true, translations: { where: { locale: 'en' }, select: { title: true } } } },
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { columnId } = await params;
  await prisma.comparisonTableColumn.delete({ where: { id: parseInt(columnId) } });
  return NextResponse.json({ deleted: true });
}
