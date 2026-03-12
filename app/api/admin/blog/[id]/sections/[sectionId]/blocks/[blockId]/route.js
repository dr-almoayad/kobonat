// app/api/admin/blog/[id]/sections/[sectionId]/blocks/[blockId]/route.js
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

export async function PATCH(req, { params }) {
  const { blockId } = await params;
  const body = await req.json();
  const { order, textEn, textAr, postId, tableId, productId, storeId, bankId, cardId } = body;

  const data = {};
  if (order     !== undefined) data.order     = parseInt(order);
  if (textEn    !== undefined) data.textEn    = textEn    || null;
  if (textAr    !== undefined) data.textAr    = textAr    || null;
  if (postId    !== undefined) data.postId    = postId    ? parseInt(postId)    : null;
  if (tableId   !== undefined) data.tableId   = tableId   ? parseInt(tableId)   : null;
  if (productId !== undefined) data.productId = productId ? parseInt(productId) : null;
  if (storeId   !== undefined) data.storeId   = storeId   ? parseInt(storeId)   : null;
  if (bankId    !== undefined) data.bankId    = bankId    ? parseInt(bankId)    : null;
  if (cardId    !== undefined) data.cardId    = cardId    ? parseInt(cardId)    : null;

  const block = await prisma.sectionBlock.update({
    where:   { id: parseInt(blockId) },
    data,
    include: BLOCK_INCLUDE,
  });

  return NextResponse.json(block);
}

export async function DELETE(req, { params }) {
  const { blockId } = await params;
  await prisma.sectionBlock.delete({ where: { id: parseInt(blockId) } });
  return NextResponse.json({ ok: true });
}
