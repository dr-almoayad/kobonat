// app/api/admin/item-categories/route.js
// Unified CRUD for direct item → Category associations.
//
// Supported item types:  VOUCHER | OFFER_STACK | STORE_PRODUCT | OTHER_PROMO
//
// GET    ?type=VOUCHER&itemId=42
//          → array of { categoryId, isFeatured, order, category: { id, translations } }
//
// POST   body { type, itemId, categoryId, isFeatured?, order? }
//          → upserts the association (safe to call twice)
//
// PATCH  body { type, itemId, categoryId, isFeatured, order }
//          → updates isFeatured / order on an existing link
//
// DELETE ?type=VOUCHER&itemId=42&categoryId=7
//          → removes the association

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import { prisma }           from '@/lib/prisma';

// ── Config maps ───────────────────────────────────────────────────────────────

const PRISMA_MODEL = {
  VOUCHER:       'voucherCategory',
  OFFER_STACK:   'offerStackCategory',
  STORE_PRODUCT: 'storeProductCategory',
  OTHER_PROMO:   'otherPromoCategory',
};

const ITEM_ID_FIELD = {
  VOUCHER:       'voucherId',
  OFFER_STACK:   'stackId',
  STORE_PRODUCT: 'productId',
  OTHER_PROMO:   'promoId',
};

const UNIQUE_CONSTRAINT = {
  VOUCHER:       'voucherId_categoryId',
  OFFER_STACK:   'stackId_categoryId',
  STORE_PRODUCT: 'productId_categoryId',
  OTHER_PROMO:   'promoId_categoryId',
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.isAdmin ? session : null;
}

function getModel(type) {
  const key = PRISMA_MODEL[type];
  return key && prisma[key] ? prisma[key] : null;
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type')?.toUpperCase();
  const itemId = parseInt(searchParams.get('itemId'));

  if (!type || !PRISMA_MODEL[type] || isNaN(itemId)) {
    return NextResponse.json({ error: 'Valid type and itemId are required' }, { status: 400 });
  }

  const model   = getModel(type);
  const idField = ITEM_ID_FIELD[type];

  const rows = await model.findMany({
    where:   { [idField]: itemId },
    include: {
      category: {
        include: { translations: { where: { locale: 'en' } } },
      },
    },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(rows);
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { type, itemId, categoryId, isFeatured = false, order = 0 } = body;

  if (!type || !itemId || !categoryId) {
    return NextResponse.json({ error: 'type, itemId, and categoryId are required' }, { status: 400 });
  }

  const t = type.toUpperCase();
  const model = getModel(t);
  if (!model) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  const idField    = ITEM_ID_FIELD[t];
  const uniqueKey  = UNIQUE_CONSTRAINT[t];
  const itemIdInt  = parseInt(itemId);
  const catIdInt   = parseInt(categoryId);

  try {
    const row = await model.upsert({
      where:  { [uniqueKey]: { [idField]: itemIdInt, categoryId: catIdInt } },
      create: { [idField]: itemIdInt, categoryId: catIdInt, isFeatured, order },
      update: { isFeatured, order },
      include: {
        category: {
          include: { translations: { where: { locale: 'en' } } },
        },
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error('[item-categories POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { type, itemId, categoryId, isFeatured, order } = body;

  const t = type?.toUpperCase();
  const model = getModel(t);
  if (!model) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  const idField   = ITEM_ID_FIELD[t];
  const uniqueKey = UNIQUE_CONSTRAINT[t];

  try {
    const row = await model.update({
      where: {
        [uniqueKey]: {
          [idField]:  parseInt(itemId),
          categoryId: parseInt(categoryId),
        },
      },
      data: {
        ...(isFeatured !== undefined && { isFeatured }),
        ...(order      !== undefined && { order: parseInt(order) }),
      },
      include: {
        category: {
          include: { translations: { where: { locale: 'en' } } },
        },
      },
    });
    return NextResponse.json(row);
  } catch (err) {
    console.error('[item-categories PATCH]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type       = searchParams.get('type')?.toUpperCase();
  const itemId     = parseInt(searchParams.get('itemId'));
  const categoryId = parseInt(searchParams.get('categoryId'));

  if (!type || isNaN(itemId) || isNaN(categoryId)) {
    return NextResponse.json({ error: 'type, itemId, and categoryId are required' }, { status: 400 });
  }

  const model = getModel(type);
  if (!model) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  const idField   = ITEM_ID_FIELD[type];
  const uniqueKey = UNIQUE_CONSTRAINT[type];

  try {
    await model.delete({
      where: { [uniqueKey]: { [idField]: itemId, categoryId } },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[item-categories DELETE]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
