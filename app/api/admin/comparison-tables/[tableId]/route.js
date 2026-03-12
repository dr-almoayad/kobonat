// app/api/admin/comparison-tables/[tableId]/route.js
// GET    — fetch one table with full data
// PATCH  — update table metadata (title, subtitle, entityType, order)
// DELETE — delete the table

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

const TABLE_INCLUDE = {
  translations: true,
  columns: {
    orderBy: { order: 'asc' },
    include: {
      translations: true,
      cells: true,
      store:    { select: { id: true, logo: true, translations: { where: { locale: 'en' }, select: { name: true } } } },
      bank:     { select: { id: true, logo: true, color: true, translations: { where: { locale: 'en' }, select: { name: true } } } },
      bankCard: { select: { id: true, network: true, tier: true, image: true, translations: { where: { locale: 'en' }, select: { name: true } } } },
      voucher:  { select: { id: true, code: true, translations: { where: { locale: 'en' }, select: { title: true } } } },
      promo:    { select: { id: true, translations: { where: { locale: 'en' }, select: { title: true } } } },
      product:  { select: { id: true, image: true, translations: { where: { locale: 'en' }, select: { title: true } } } },
    },
  },
  rows: {
    orderBy: { order: 'asc' },
    include: { translations: true, cells: true },
  },
};

export async function GET(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { tableId } = await params;

  const table = await prisma.comparisonTable.findUnique({
    where:   { id: parseInt(tableId) },
    include: TABLE_INCLUDE,
  });
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(table);
}

export async function PATCH(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { tableId } = await params;
  const { entityType, order, titleEn, titleAr, subtitleEn, subtitleAr } = await req.json();

  await prisma.comparisonTable.update({
    where: { id: parseInt(tableId) },
    data: {
      ...(entityType !== undefined && { entityType }),
      ...(order      !== undefined && { order: parseInt(order) }),
    },
  });

  // Upsert translations
  for (const [locale, title, subtitle] of [
    ['en', titleEn, subtitleEn],
    ['ar', titleAr, subtitleAr],
  ]) {
    if (title !== undefined || subtitle !== undefined) {
      await prisma.comparisonTableTranslation.upsert({
        where:  { tableId_locale: { tableId: parseInt(tableId), locale } },
        create: { tableId: parseInt(tableId), locale, title: title || null, subtitle: subtitle || null },
        update: {
          ...(title    !== undefined && { title:    title    || null }),
          ...(subtitle !== undefined && { subtitle: subtitle || null }),
        },
      });
    }
  }

  const updated = await prisma.comparisonTable.findUnique({
    where:   { id: parseInt(tableId) },
    include: TABLE_INCLUDE,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { tableId } = await params;
  await prisma.comparisonTable.delete({ where: { id: parseInt(tableId) } });
  return NextResponse.json({ deleted: true });
}
