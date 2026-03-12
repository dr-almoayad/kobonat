// app/api/admin/comparison-tables/[tableId]/columns/route.js
// POST — add a new column to a table

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

export async function POST(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { tableId } = await params;
  const tableIdInt = parseInt(tableId);
  const body = await req.json();

  const {
    nameEn, nameAr, descriptionEn, descriptionAr, badgeEn, badgeAr,
    image, isHighlighted, ctaUrl, order,
    storeId, bankId, bankCardId, voucherId, promoId, productId,
  } = body;

  if (!nameEn) return NextResponse.json({ error: 'nameEn is required' }, { status: 400 });

  // Auto-order after last column
  let resolvedOrder = order;
  if (resolvedOrder === undefined) {
    const last = await prisma.comparisonTableColumn.findFirst({
      where:   { tableId: tableIdInt },
      orderBy: { order: 'desc' },
      select:  { order: true },
    });
    resolvedOrder = (last?.order ?? -1) + 1;
  }

  const column = await prisma.comparisonTableColumn.create({
    data: {
      tableId:       tableIdInt,
      order:         resolvedOrder,
      image:         image         || null,
      isHighlighted: isHighlighted ?? false,
      ctaUrl:        ctaUrl        || null,
      storeId:       storeId       ? parseInt(storeId)    : null,
      bankId:        bankId        ? parseInt(bankId)     : null,
      bankCardId:    bankCardId    ? parseInt(bankCardId) : null,
      voucherId:     voucherId     ? parseInt(voucherId)  : null,
      promoId:       promoId       ? parseInt(promoId)    : null,
      productId:     productId     ? parseInt(productId)  : null,
      translations: {
        create: [
          { locale: 'en', name: nameEn, description: descriptionEn || null, badge: badgeEn || null },
          { locale: 'ar', name: nameAr || nameEn, description: descriptionAr || null, badge: badgeAr || null },
        ],
      },
    },
    include: {
      translations: true,
      cells: true,
      store:    { select: { id: true, logo: true, translations: { where: { locale: 'en' }, select: { name: true } } } },
      bank:     { select: { id: true, logo: true, color: true, translations: { where: { locale: 'en' }, select: { name: true } } } },
      bankCard: { select: { id: true, network: true, tier: true, image: true, translations: { where: { locale: 'en' }, select: { name: true } } } },
      product:  { select: { id: true, image: true, translations: { where: { locale: 'en' }, select: { title: true } } } },
    },
  });

  return NextResponse.json(column, { status: 201 });
}
