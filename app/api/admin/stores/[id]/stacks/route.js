// app/api/admin/stores/[id]/stacks/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function auth() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

const STACK_INCLUDE = {
  codeVoucher: {
    select: {
      id: true, code: true, type: true, discount: true,
      discountPercent: true, verifiedAvgPercent: true, landingUrl: true,
      translations: { where: { locale: 'en' }, select: { title: true } },
    },
  },
  dealVoucher: {
    select: {
      id: true, code: true, type: true, discount: true,
      discountPercent: true, verifiedAvgPercent: true, landingUrl: true,
      translations: { where: { locale: 'en' }, select: { title: true } },
    },
  },
  promo: {
    select: {
      id: true, type: true, url: true, image: true,
      discountPercent: true, verifiedAvgPercent: true,
      bankId: true,
      bank: {
        select: {
          id: true, logo: true,
          translations: { where: { locale: 'en' }, select: { name: true } },
        },
      },
      translations: { where: { locale: 'en' }, select: { title: true } },
    },
  },
};

// ── GET — list all stacks for a store ─────────────────────────────────────────
export async function GET(req, { params }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const stacks = await prisma.offerStack.findMany({
    where:   { storeId: parseInt(id) },
    include: STACK_INCLUDE,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ stacks });
}

// ── POST — create a new stack ─────────────────────────────────────────────────
export async function POST(req, { params }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { label, codeVoucherId, dealVoucherId, promoId, isActive, order } = body;

  const filled = [codeVoucherId, dealVoucherId, promoId].filter(Boolean).length;
  if (filled < 2) {
    return NextResponse.json({ error: 'A stack needs at least 2 items.' }, { status: 400 });
  }

  try {
    const stack = await prisma.offerStack.create({
      data: {
        storeId:       parseInt(id),
        label:         label         || null,
        codeVoucherId: codeVoucherId ? parseInt(codeVoucherId) : null,
        dealVoucherId: dealVoucherId ? parseInt(dealVoucherId) : null,
        promoId:       promoId       ? parseInt(promoId)       : null,
        isActive:      isActive      !== false,
        order:         order         != null ? parseInt(order) : 0,
      },
      include: STACK_INCLUDE,
    });
    return NextResponse.json(stack, { status: 201 });
  } catch (err) {
    console.error('[stacks POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
