// app/api/admin/sections/[sectionId]/blocks/[blockId]/route.js
//
// PATCH  — update a block (text, entity link, order)
// DELETE — delete a block

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

const BLOCK_INCLUDE = {
  post:    { include: { translations: { where: { locale: 'en' } } } },
  table:   { include: { translations: true, columns: { include: { translations: true } }, rows: { include: { translations: true } } } },
  product: { include: { translations: { where: { locale: 'en' } } } },
  store:   { include: { translations: { where: { locale: 'en' } } } },
  bank:    { include: { translations: { where: { locale: 'en' } } } },
  card:    { include: { translations: { where: { locale: 'en' } } } },
};

export async function PATCH(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { blockId } = await params;
  await prisma.sectionBlock.delete({ where: { id: parseInt(blockId) } });
  return NextResponse.json({ ok: true });
}
