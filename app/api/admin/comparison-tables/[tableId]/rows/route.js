// app/api/admin/comparison-tables/[tableId]/rows/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

const ROW_INCLUDE = {
  store:      { include: { translations: true } },
  bank:       { include: { translations: true } },
  bankCard:   { include: { translations: true, bank: { include: { translations: true } } } },
  voucher:    { include: { translations: true } },
  otherPromo: { include: { translations: true, bank: { include: { translations: true } } } },
  product:    { include: { translations: true } },
};

export async function GET(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { tableId } = await params;

  const rows = await prisma.comparisonTableRow.findMany({
    where:   { tableId: parseInt(tableId) },
    include: ROW_INCLUDE,
    orderBy: { order: 'asc' },
  });

  return NextResponse.json({ rows });
}

export async function POST(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { tableId } = await params;
  const body = await req.json();

  const {
    storeId, bankId, bankCardId, voucherId, otherPromoId, productId,
    badge, overrides, order,
  } = body;

  // Determine next order if not supplied
  let resolvedOrder = order;
  if (resolvedOrder == null) {
    const last = await prisma.comparisonTableRow.findFirst({
      where:   { tableId: parseInt(tableId) },
      orderBy: { order: 'desc' },
      select:  { order: true },
    });
    resolvedOrder = (last?.order ?? -1) + 1;
  }

  try {
    const row = await prisma.comparisonTableRow.create({
      data: {
        tableId:     parseInt(tableId),
        order:       resolvedOrder,
        storeId:     storeId      ? parseInt(storeId)      : null,
        bankId:      bankId       ? parseInt(bankId)       : null,
        bankCardId:  bankCardId   ? parseInt(bankCardId)   : null,
        voucherId:   voucherId    ? parseInt(voucherId)    : null,
        otherPromoId: otherPromoId ? parseInt(otherPromoId) : null,
        productId:   productId    ? parseInt(productId)    : null,
        badge:       badge        || null,
        overrides:   overrides    || null,
      },
      include: ROW_INCLUDE,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error('[rows POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
