// app/api/admin/vouchers/[id]/calculator/route.js
// GET   — fetch calculator fields for one voucher
// PATCH — update calculator fields (certainty, stack group, caps, verified avg, isFeaturedStack)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const CALC_SELECT = {
  id:                 true,
  code:               true,
  type:               true,
  discount:           true,
  discountPercent:    true,
  verifiedAvgPercent: true,
  discountCertainty:  true,
  stackGroup:         true,
  isStackable:        true,
  isFeaturedStack:    true,   // ← NEW
  isCapped:           true,
  maxDiscountAmount:  true,
  minSpendAmount:     true,
  storeId:            true,
  store: { select: { translations: { where: { locale: 'en' }, select: { name: true } } } },
  translations: { where: { locale: 'en' }, select: { title: true } },
};

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const voucher = await prisma.voucher.findUnique({
    where:  { id: Number(params.id) },
    select: CALC_SELECT,
  });
  if (!voucher) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(voucher);
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const ALLOWED = [
    'discountPercent', 'verifiedAvgPercent', 'discountCertainty',
    'stackGroup', 'isStackable', 'isFeaturedStack',   // ← isFeaturedStack added
    'isCapped', 'maxDiscountAmount', 'minSpendAmount',
  ];
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED.includes(k)));

  const voucher = await prisma.voucher.update({
    where:  { id: Number(params.id) },
    data,
    select: CALC_SELECT,
  });
  return NextResponse.json(voucher);
}
