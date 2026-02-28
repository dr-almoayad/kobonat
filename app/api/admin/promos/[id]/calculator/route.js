// app/api/admin/promos/[id]/calculator/route.js
// GET / PATCH for OtherPromo calculator fields

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const CALC_SELECT = {
  id:                 true,
  type:               true,
  discountPercent:    true,
  verifiedAvgPercent: true,
  discountCertainty:  true,
  stackGroup:         true,
  isStackable:        true,
  isCapped:           true,
  maxDiscountAmount:  true,
  minSpendAmount:     true,
  storeId:            true,
  translations: { where: { locale: 'en' }, select: { title: true } },
};

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


  const promo = await prisma.otherPromo.findUnique({ where: { id: Number(params.id) }, select: CALC_SELECT });
  if (!promo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(promo);
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


  const body = await request.json();
  const ALLOWED = [
    'discountPercent', 'verifiedAvgPercent', 'discountCertainty',
    'stackGroup', 'isStackable', 'isCapped', 'maxDiscountAmount', 'minSpendAmount',
  ];
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED.includes(k)));

  const promo = await prisma.otherPromo.update({ where: { id: Number(params.id) }, data, select: CALC_SELECT });
  return NextResponse.json(promo);
}
