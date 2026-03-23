// app/api/admin/stores/[id]/other-promos/[promoId]/route.js
// GET / PATCH / DELETE for a single OtherPromo.
// Note: [id] = storeId (for URL consistency), [promoId] = the promo being edited.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.isAdmin ? session : null;
}

// ── GET — fetch single promo with full relations ──────────────────────────────
export async function GET(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { promoId } = await params;

  const promo = await prisma.otherPromo.findUnique({
    where: { id: parseInt(promoId) },
    include: {
      translations: true,
      bank: { include: { translations: true } },
      card: { include: { translations: true } },
      country: { include: { translations: { where: { locale: 'en' } } } },
    },
  });

  if (!promo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(promo);
}

// ── PATCH — update all editable fields ───────────────────────────────────────
export async function PATCH(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { promoId } = await params;
  const body = await req.json();

  const {
    countryId, image, type, url,
    startDate, expiryDate,
    isActive, order,
    bankId, cardId, cardNetwork, installmentMonths,
    paymentMethodId,   // ← add
    voucherCode,       // ← add
    title_en, title_ar,
    description_en, description_ar,
    terms_en, terms_ar,
  } = body;

  try {
    // ── Core update ────────────────────────────────────────────────────────
    const promo = await prisma.otherPromo.update({
      where: { id: parseInt(promoId) },
      data: {
        countryId:          countryId   ? parseInt(countryId)          : undefined,
        image:              image       ?? null,
        type:               type        || undefined,
        url:                url         ?? null,
        startDate:          startDate   ? new Date(startDate)          : null,
        expiryDate:         expiryDate  ? new Date(expiryDate)         : null,
        isActive:           typeof isActive === 'boolean' ? isActive   : undefined,
        order:              order       != null ? parseInt(order)       : undefined,
        bankId:             bankId      ? parseInt(bankId)             : null,
        cardId:             cardId      ? parseInt(cardId)             : null,
        cardNetwork:        cardNetwork || null,
        installmentMonths:  installmentMonths ? parseInt(installmentMonths) : null,
        paymentMethodId:    paymentMethodId ? parseInt(paymentMethodId) : null,  // ← add
        voucherCode:        voucherCode?.trim().toUpperCase() || null,           // ← add
      },
    });

    // ── Translation upserts ────────────────────────────────────────────────
    for (const [locale, title, description, terms] of [
      ['en', title_en, description_en, terms_en],
      ['ar', title_ar, description_ar, terms_ar],
    ]) {
      if (title == null) continue;
      await prisma.otherPromoTranslation.upsert({
        where:  { promoId_locale: { promoId: promo.id, locale } },
        create: { promoId: promo.id, locale, title, description: description ?? null, terms: terms ?? null },
        update: { title, description: description ?? null, terms: terms ?? null },
      });
    }

    return NextResponse.json({ success: true, id: promo.id });
  } catch (err) {
    console.error('[other-promos PATCH]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { promoId } = await params;

  try {
    await prisma.otherPromo.delete({ where: { id: parseInt(promoId) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[other-promos DELETE]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
