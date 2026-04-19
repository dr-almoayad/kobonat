// app/api/admin/sections/[sectionId]/blocks/route.js
//
// Standalone section blocks route — does NOT require postId in the URL.
// This lets SectionBlocksEditor call /api/admin/sections/[sectionId]/blocks
// directly without knowing the parent postId.
//
// GET  — list blocks for a section
// POST — create a block

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

const BLOCK_INCLUDE = {
  post: {
    include: {
      translations: { where: { locale: 'en' } },
      author: true,
      category: { include: { translations: { where: { locale: 'en' } } } },
    },
  },
  table: {
    include: {
      translations: true,
      columns: {
        orderBy: { order: 'asc' },
        include: { translations: true, cells: true },
      },
      rows: {
        orderBy: { order: 'asc' },
        include: { translations: true, cells: true },
      },
    },
  },
  product: { include: { translations: { where: { locale: 'en' } } } },
  store:   { include: { translations: { where: { locale: 'en' } } } },
  bank:    { include: { translations: { where: { locale: 'en' } } } },
  card:    { include: { translations: { where: { locale: 'en' }, bank: { include: { translations: { where: { locale: 'en' } } } } } } },
};

export async function GET(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { sectionId } = await params;

  const blocks = await prisma.sectionBlock.findMany({
    where:   { sectionId: parseInt(sectionId) },
    include: BLOCK_INCLUDE,
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(blocks);
}

export async function POST(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { sectionId } = await params;
  const body = await req.json();
  const { type, order = 0, textEn, textAr, postId, tableId, productId, storeId, bankId, cardId } = body;

  if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 });

  const block = await prisma.sectionBlock.create({
    data: {
      sectionId: parseInt(sectionId),
      type,
      order,
      textEn:    textEn    || null,
      textAr:    textAr    || null,
      postId:    postId    ? parseInt(postId)    : null,
      tableId:   tableId   ? parseInt(tableId)   : null,
      productId: productId ? parseInt(productId) : null,
      storeId:   storeId   ? parseInt(storeId)   : null,
      bankId:    bankId    ? parseInt(bankId)    : null,
      cardId:    cardId    ? parseInt(cardId)    : null,
    },
    include: BLOCK_INCLUDE,
  });

  return NextResponse.json(block, { status: 201 });
}
