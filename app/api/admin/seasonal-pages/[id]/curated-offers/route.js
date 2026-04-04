// app/api/admin/seasonal-pages/[id]/curated-offers/route.js
// GET / POST / DELETE / PATCH for seasonal page curated offers

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

  const offers = await prisma.seasonalPageCuratedOffer.findMany({
    where:   { seasonalPageId: parseInt(id) },
    orderBy: { order: 'asc' },
    include: {
      offer: {
        include: {
          translations: { where: { locale } },
          store: { include: { translations: { where: { locale } } } },
        },
      },
    },
  });

  return NextResponse.json(offers);
}

export async function POST(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const seasonalPageId = parseInt(id);
  const body  = await req.json();
  const items = Array.isArray(body) ? body : [body];

  const last = await prisma.seasonalPageCuratedOffer.findFirst({
    where:   { seasonalPageId },
    orderBy: { order: 'desc' },
    select:  { order: true },
  });
  let nextOrder = (last?.order ?? -1) + 1;

  await prisma.seasonalPageCuratedOffer.createMany({
    data: items.map(item => ({
      seasonalPageId,
      offerId: parseInt(item.offerId),
      order:   item.order ?? nextOrder++,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const offerId = searchParams.get('offerId');

  if (!offerId) return NextResponse.json({ error: 'offerId query param required' }, { status: 400 });

  await prisma.seasonalPageCuratedOffer.delete({
    where: {
      seasonalPageId_offerId: {
        seasonalPageId: parseInt(id),
        offerId:        parseInt(offerId),
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
    updates.map(({ offerId, order }) =>
      prisma.seasonalPageCuratedOffer.update({
        where: { seasonalPageId_offerId: { seasonalPageId, offerId: parseInt(offerId) } },
        data:  { order: parseInt(order) },
      })
    )
  );

  return NextResponse.json({ success: true });
}
