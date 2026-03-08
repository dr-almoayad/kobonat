// app/api/admin/stores/[id]/other-promos/route.js
// GET  — all promos for a store (full fields for admin editing)
// POST — create a new promo

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function requireAdmin(req) {
  const session = await getServerSession(authOptions);
  return session?.user?.isAdmin ? session : null;
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const promos = await prisma.otherPromo.findMany({
    where: { storeId: parseInt(id) },
    include: {
      translations: true,   // all locales — component picks en/ar itself
      country: {
        include: { translations: { where: { locale: 'en' } } },
      },
      bank: {
        include: { translations: { where: { locale: 'en' } } },
      },
      card: {
        include: { translations: { where: { locale: 'en' } } },
      },
    },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json({ promos });
}

// ── POST — create ─────────────────────────────────────────────────────────────
export async function POST(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const storeId = parseInt(id);
  const body = await req.json();

  const {
    countryId, image, type, url,
    startDate, expiryDate,
    isActive, order,
    bankId, cardId, cardNetwork, installmentMonths,
    title_en, title_ar,
    description_en, description_ar,
    terms_en, terms_ar,
  } = body;

  if (!countryId) return NextResponse.json({ error: 'countryId is required' }, { status: 400 });
  if (!title_en)  return NextResponse.json({ error: 'title_en is required'  }, { status: 400 });

  try {
    const promo = await prisma.otherPromo.create({
      data: {
        storeId,
        countryId:          parseInt(countryId),
        image:              image              || null,
        type:               type               || 'BANK_OFFER',
        url:                url                || null,
        startDate:          startDate          ? new Date(startDate)          : null,
        expiryDate:         expiryDate         ? new Date(expiryDate)         : null,
        isActive:           typeof isActive === 'boolean' ? isActive : true,
        order:              order != null      ? parseInt(order)              : 0,
        bankId:             bankId             ? parseInt(bankId)             : null,
        cardId:             cardId             ? parseInt(cardId)             : null,
        cardNetwork:        cardNetwork        || null,
        installmentMonths:  installmentMonths  ? parseInt(installmentMonths)  : null,
        translations: {
          create: [
            { locale: 'en', title: title_en, description: description_en || null, terms: terms_en || null },
            { locale: 'ar', title: title_ar || title_en, description: description_ar || null, terms: terms_ar || null },
          ],
        },
      },
    });

    return NextResponse.json({ success: true, id: promo.id }, { status: 201 });
  } catch (err) {
    console.error('[other-promos POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
