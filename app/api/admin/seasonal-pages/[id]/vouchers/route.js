// app/api/admin/seasonal-pages/[id]/vouchers/route.js
// Manages the manually-pinned "hero" vouchers shown at the top of a seasonal page.
// GET / POST / DELETE / PATCH (reorder)

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

  const vouchers = await prisma.seasonalPageVoucher.findMany({
    where:   { seasonalPageId: parseInt(id) },
    orderBy: { order: 'asc' },
    include: {
      voucher: {
        include: {
          translations: { where: { locale } },
          store: { include: { translations: { where: { locale } } } },
        },
      },
    },
  });

  return NextResponse.json(vouchers);
}

export async function POST(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const seasonalPageId = parseInt(id);
  const body = await req.json();

  const items = Array.isArray(body) ? body : [body];
  if (items.length === 0) return NextResponse.json({ error: 'No vouchers provided' }, { status: 400 });

  const last = await prisma.seasonalPageVoucher.findFirst({
    where:   { seasonalPageId },
    orderBy: { order: 'desc' },
    select:  { order: true },
  });
  let nextOrder = (last?.order ?? -1) + 1;

  await prisma.seasonalPageVoucher.createMany({
    data: items.map(item => ({
      seasonalPageId,
      voucherId: parseInt(item.voucherId),
      order:     item.order ?? nextOrder++,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const voucherId = searchParams.get('voucherId');

  if (!voucherId) return NextResponse.json({ error: 'voucherId query param required' }, { status: 400 });

  await prisma.seasonalPageVoucher.delete({
    where: {
      seasonalPageId_voucherId: {
        seasonalPageId: parseInt(id),
        voucherId:      parseInt(voucherId),
      },
    },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const seasonalPageId = parseInt(id);
  const updates = await req.json();

  await prisma.$transaction(
    updates.map(({ voucherId, order }) =>
      prisma.seasonalPageVoucher.update({
        where: { seasonalPageId_voucherId: { seasonalPageId, voucherId: parseInt(voucherId) } },
        data:  { order: parseInt(order) },
      })
    )
  );

  return NextResponse.json({ success: true });
}
