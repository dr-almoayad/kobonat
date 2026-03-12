// app/api/admin/blog/[id]/comparison-tables/route.js
// GET  — list all comparison tables for a post (full data, ready for builder)
// POST — create a new comparison table attached to a post

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

// Full include used by both GET and after mutations
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
  const { id } = await params;

  const tables = await prisma.comparisonTable.findMany({
    where:   { postId: parseInt(id) },
    orderBy: { order: 'asc' },
    include: TABLE_INCLUDE,
  });

  return NextResponse.json({ tables });
}

export async function POST(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const postId = parseInt(id);
  const body   = await req.json();
  const { entityType = 'CUSTOM', titleEn, titleAr, subtitleEn, subtitleAr, order } = body;

  // Default order: after last existing table
  let resolvedOrder = order;
  if (resolvedOrder === undefined) {
    const last = await prisma.comparisonTable.findFirst({
      where:   { postId },
      orderBy: { order: 'desc' },
      select:  { order: true },
    });
    resolvedOrder = (last?.order ?? -1) + 1;
  }

  const table = await prisma.comparisonTable.create({
    data: {
      postId,
      entityType,
      order: resolvedOrder,
      translations: {
        create: [
          { locale: 'en', title: titleEn || null, subtitle: subtitleEn || null },
          { locale: 'ar', title: titleAr || null, subtitle: subtitleAr || null },
        ],
      },
    },
    include: TABLE_INCLUDE,
  });

  return NextResponse.json(table, { status: 201 });
}
