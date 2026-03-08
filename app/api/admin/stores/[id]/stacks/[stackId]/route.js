// app/api/admin/stores/[id]/stacks/[stackId]/route.js
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

// ── PATCH — update stack ──────────────────────────────────────────────────────
export async function PATCH(req, { params }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { stackId } = await params;
  const body = await req.json();
  const { label, codeVoucherId, dealVoucherId, promoId, isActive, order } = body;

  const filled = [
    codeVoucherId != null ? codeVoucherId : null,
    dealVoucherId != null ? dealVoucherId : null,
    promoId != null       ? promoId       : null,
  ].filter(Boolean).length;

  if (filled < 2) {
    return NextResponse.json({ error: 'A stack needs at least 2 items.' }, { status: 400 });
  }

  try {
    const stack = await prisma.offerStack.update({
      where: { id: parseInt(stackId) },
      data: {
        label:         label         !== undefined ? (label || null)            : undefined,
        codeVoucherId: codeVoucherId !== undefined ? (codeVoucherId ? parseInt(codeVoucherId) : null) : undefined,
        dealVoucherId: dealVoucherId !== undefined ? (dealVoucherId ? parseInt(dealVoucherId) : null) : undefined,
        promoId:       promoId       !== undefined ? (promoId       ? parseInt(promoId)       : null) : undefined,
        isActive:      typeof isActive === 'boolean' ? isActive : undefined,
        order:         order != null                 ? parseInt(order) : undefined,
      },
      include: STACK_INCLUDE,
    });
    return NextResponse.json(stack);
  } catch (err) {
    console.error('[stacks PATCH]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { stackId } = await params;

  try {
    await prisma.offerStack.delete({ where: { id: parseInt(stackId) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
