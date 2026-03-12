// app/api/admin/comparison-tables/[tableId]/rows/[rowId]/route.js
// PATCH  — update row label, type, order
// DELETE — remove a row (cascades cells)

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
  const { rowId } = await params;
  const id   = parseInt(rowId);
  const body = await req.json();
  const { labelEn, labelAr, helpTextEn, helpTextAr, rowType, key, order } = body;

  await prisma.comparisonTableRow.update({
    where: { id },
    data: {
      ...(rowType !== undefined && { rowType }),
      ...(key    !== undefined && { key: key || null }),
      ...(order  !== undefined && { order: parseInt(order) }),
    },
  });

  for (const [locale, label, helpText] of [
    ['en', labelEn, helpTextEn],
    ['ar', labelAr, helpTextAr],
  ]) {
    if (label !== undefined || helpText !== undefined) {
      await prisma.comparisonTableRowTranslation.upsert({
        where:  { rowId_locale: { rowId: id, locale } },
        create: { rowId: id, locale, label: label || '', helpText: helpText || null },
        update: {
          ...(label    !== undefined && { label:    label    || '' }),
          ...(helpText !== undefined && { helpText: helpText || null }),
        },
      });
    }
  }

  const updated = await prisma.comparisonTableRow.findUnique({
    where:   { id },
    include: { translations: true, cells: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { rowId } = await params;
  await prisma.comparisonTableRow.delete({ where: { id: parseInt(rowId) } });
  return NextResponse.json({ deleted: true });
}
