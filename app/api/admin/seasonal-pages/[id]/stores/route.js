// app/api/admin/seasonal-pages/[id]/stores/route.js
// GET  — list pinned stores for a seasonal page
// POST — add a store (or batch of stores)
// DELETE (query param storeId) — remove a single store

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

export async function GET(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  const stores = await prisma.seasonalPageStore.findMany({
    where:   { seasonalPageId: parseInt(id) },
    orderBy: { order: 'asc' },
    include: {
      store: { include: { translations: { where: { locale } } } },
    },
  });

  return NextResponse.json(stores);
}

export async function POST(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const seasonalPageId = parseInt(id);
  const body = await req.json();

  // Accept single { storeId, order } or array [{ storeId, order }]
  const items = Array.isArray(body) ? body : [body];

  if (items.length === 0) {
    return NextResponse.json({ error: 'No stores provided' }, { status: 400 });
  }

  // Get current max order for auto-increment
  const last = await prisma.seasonalPageStore.findFirst({
    where:   { seasonalPageId },
    orderBy: { order: 'desc' },
    select:  { order: true },
  });
  let nextOrder = (last?.order ?? -1) + 1;

  const data = items.map(item => ({
    seasonalPageId,
    storeId: parseInt(item.storeId),
    order:   item.order ?? nextOrder++,
  }));

  await prisma.seasonalPageStore.createMany({ data, skipDuplicates: true });
  return NextResponse.json({ success: true, added: data.length });
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) return NextResponse.json({ error: 'storeId query param required' }, { status: 400 });

  await prisma.seasonalPageStore.delete({
    where: {
      seasonalPageId_storeId: {
        seasonalPageId: parseInt(id),
        storeId:        parseInt(storeId),
      },
    },
  });

  return NextResponse.json({ success: true });
}

// PATCH — reorder: body = [{ storeId, order }]
export async function PATCH(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const seasonalPageId = parseInt(id);
  const updates = await req.json();

  await prisma.$transaction(
    updates.map(({ storeId, order }) =>
      prisma.seasonalPageStore.update({
        where: { seasonalPageId_storeId: { seasonalPageId, storeId: parseInt(storeId) } },
        data:  { order: parseInt(order) },
      })
    )
  );

  return NextResponse.json({ success: true });
}
