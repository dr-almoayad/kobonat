// app/api/admin/banks/[id]/cards/[cardId]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function auth() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

export async function PUT(req, { params }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { cardId } = await params;
  const body = await req.json();

  const floatOrNull = v => (v !== undefined && v !== '' && v !== null) ? parseFloat(v) : null;
  const intOrNull   = v => (v !== undefined && v !== '' && v !== null) ? parseInt(v)   : null;
  const boolVal     = v => v === true || v === 'true' || v === 1;

  const card = await prisma.bankCard.update({
    where: { id: parseInt(cardId) },
    data: {
      network:  body.network  || undefined,
      tier:     body.tier     || undefined,
      isIslamic: body.isIslamic !== undefined ? boolVal(body.isIslamic) : undefined,
      image:    body.image    ?? undefined,

      annualFee:           floatOrNull(body.annualFee),
      minSalary:           floatOrNull(body.minSalary),
      foreignTxFeePercent: floatOrNull(body.foreignTxFeePercent),

      loungeAccessPerYear:   intOrNull(body.loungeAccessPerYear),
      hasTravelInsurance:    body.hasTravelInsurance    !== undefined ? boolVal(body.hasTravelInsurance)    : undefined,
      hasPurchaseProtection: body.hasPurchaseProtection !== undefined ? boolVal(body.hasPurchaseProtection) : undefined,
      hasApplePay:  body.hasApplePay  !== undefined ? boolVal(body.hasApplePay)  : undefined,
      hasGooglePay: body.hasGooglePay !== undefined ? boolVal(body.hasGooglePay) : undefined,
      hasSamsungPay: body.hasSamsungPay !== undefined ? boolVal(body.hasSamsungPay) : undefined,

      cashbackGeneral:    floatOrNull(body.cashbackGeneral),
      cashbackTravel:     floatOrNull(body.cashbackTravel),
      cashbackDining:     floatOrNull(body.cashbackDining),
      cashbackShopping:   floatOrNull(body.cashbackShopping),
      cashbackFuel:       floatOrNull(body.cashbackFuel),
      cashbackGaming:     floatOrNull(body.cashbackGaming),
      cashbackGroceries:  floatOrNull(body.cashbackGroceries),
      cashbackOnline:     floatOrNull(body.cashbackOnline),
      cashbackHealthcare: floatOrNull(body.cashbackHealthcare),
      maxInstallmentMonths: intOrNull(body.maxInstallmentMonths),
    },
  });

  // Update translations if provided
  for (const [locale, name, desc, benefits] of [
    ['en', body.name_en, body.description_en, body.benefits_en],
    ['ar', body.name_ar, body.description_ar, body.benefits_ar],
  ]) {
    if (!name) continue;
    await prisma.bankCardTranslation.upsert({
      where:  { cardId_locale: { cardId: parseInt(cardId), locale } },
      update: { name, description: desc ?? null, benefits: benefits ?? null },
      create: { cardId: parseInt(cardId), locale, name, description: desc ?? null, benefits: benefits ?? null },
    });
  }

  return NextResponse.json(card);
}

export async function DELETE(req, { params }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { cardId } = await params;
  await prisma.bankCard.delete({ where: { id: parseInt(cardId) } });
  return NextResponse.json({ deleted: true });
}
