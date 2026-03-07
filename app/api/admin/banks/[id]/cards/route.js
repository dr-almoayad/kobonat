// app/api/admin/banks/[id]/cards/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function auth() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

// ── GET /api/admin/banks/[id]/cards ──────────────────────────────────────────
export async function GET(req, { params }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const cards = await prisma.bankCard.findMany({
    where:   { bankId: parseInt(id) },
    include: { translations: true },
    orderBy: [{ network: 'asc' }, { tier: 'asc' }],
  });

  return NextResponse.json(cards);
}

// ── POST /api/admin/banks/[id]/cards ─────────────────────────────────────────
export async function POST(req, { params }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const floatOrNull = v => (v !== undefined && v !== '' && v !== null) ? parseFloat(v) : null;
  const intOrNull   = v => (v !== undefined && v !== '' && v !== null) ? parseInt(v)   : null;
  const boolVal     = v => v === true || v === 'true' || v === 1;

  const card = await prisma.bankCard.create({
    data: {
      bankId:   parseInt(id),
      network:  body.network  || 'VISA',
      tier:     body.tier     || 'CLASSIC',
      isIslamic: boolVal(body.isIslamic),
      image:    body.image    || null,

      annualFee:           floatOrNull(body.annualFee),
      minSalary:           floatOrNull(body.minSalary),
      foreignTxFeePercent: floatOrNull(body.foreignTxFeePercent),

      loungeAccessPerYear:   intOrNull(body.loungeAccessPerYear),
      hasTravelInsurance:    boolVal(body.hasTravelInsurance),
      hasPurchaseProtection: boolVal(body.hasPurchaseProtection),
      hasApplePay:           body.hasApplePay  !== false,
      hasGooglePay:          body.hasGooglePay !== false,
      hasSamsungPay:         boolVal(body.hasSamsungPay),

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

      translations: {
        create: [
          { locale: 'en', name: body.name_en || 'Card', description: body.description_en || null, benefits: body.benefits_en || null },
          { locale: 'ar', name: body.name_ar || body.name_en || 'Card', description: body.description_ar || null, benefits: body.benefits_ar || null },
        ],
      },
    },
    include: { translations: true },
  });

  return NextResponse.json(card, { status: 201 });
}
