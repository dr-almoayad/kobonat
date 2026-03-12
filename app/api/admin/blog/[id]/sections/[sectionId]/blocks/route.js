// app/api/admin/blog/[id]/sections/[sectionId]/blocks/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BLOCK_INCLUDE = {
  post: {
    include: {
      translations: true,
      author: true,
      category: { include: { translations: true } },
    },
  },
  table: {
    include: {
      translations: true,
      columns: {
        orderBy: { order: 'asc' },
        include: {
          translations: true,
          cells: true,
          store:    { include: { translations: true } },
          bank:     { include: { translations: true } },
          bankCard: { include: { translations: true } },
        },
      },
      rows: {
        orderBy: { order: 'asc' },
        include: { translations: true, cells: true },
      },
    },
  },
  product: { include: { translations: true } },
  store:   { include: { translations: true } },
  bank:    { include: { translations: true } },
  card:    { include: { translations: true, bank: { include: { translations: true } } } },
};

export async function GET(req, { params }) {
  const { sectionId } = await params;
  const blocks = await prisma.sectionBlock.findMany({
    where:   { sectionId: parseInt(sectionId) },
    include: BLOCK_INCLUDE,
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(blocks);
}

export async function POST(req, { params }) {
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
