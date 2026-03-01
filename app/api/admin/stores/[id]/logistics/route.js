// app/api/admin/stores/[id]/logistics/route.js
// GET   — fetch all logistics, cadence, and verification data for a store
// PATCH — update one or many logistics fields

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const LOGISTICS_SELECT = {
  id:                      true,
  averageDeliveryDaysMin:  true,
  averageDeliveryDaysMax:  true,
  freeShippingThreshold:   true,
  returnWindowDays:        true,
  freeReturns:             true,
  refundProcessingDaysMin: true,
  refundProcessingDaysMax: true,
  offerFrequencyDays:      true,
  lastVerifiedAt:          true,
};

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { id } = await params;
  const storeId = Number(id);

  const store = await prisma.store.findUnique({ where: { id }, select: LOGISTICS_SELECT });
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  return NextResponse.json(store);
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { id } = await params;
  const storeId = Number(id);
  const body = await request.json();

  // Whitelist — only accept known logistics fields
  const allowed = [
    'averageDeliveryDaysMin', 'averageDeliveryDaysMax',
    'freeShippingThreshold',
    'returnWindowDays', 'freeReturns',
    'refundProcessingDaysMin', 'refundProcessingDaysMax',
    'offerFrequencyDays',
  ];

  const data = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  // Always stamp lastVerifiedAt when logistics fields are saved
  data.lastVerifiedAt = new Date();

  const store = await prisma.store.update({
    where: { id },
    data,
    select: LOGISTICS_SELECT,
  });

  return NextResponse.json(store);
}
