// app/api/admin/banks/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// ── GET /api/admin/banks ──────────────────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  const banks = await prisma.bank.findMany({
    orderBy: { id: 'asc' },
    include: {
      translations: { where: { locale } },
      _count: { select: { cards: true, otherPromos: true } },
    },
  });

  return NextResponse.json(banks);
}

// ── POST /api/admin/banks ─────────────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { slug, logo, color, websiteUrl, type, appRating, isActive, name_en, name_ar, description_en, description_ar } = body;

  if (!slug || !name_en) return NextResponse.json({ error: 'slug and name_en are required' }, { status: 400 });

  const exists = await prisma.bank.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });

  const bank = await prisma.bank.create({
    data: {
      slug,
      logo:       logo       || null,
      color:      color      || null,
      websiteUrl: websiteUrl || null,
      type:       type       || 'COMMERCIAL',
      appRating:  appRating  ? parseFloat(appRating) : null,
      isActive:   isActive   !== false,
      translations: {
        create: [
          { locale: 'en', name: name_en, description: description_en || null },
          { locale: 'ar', name: name_ar || name_en, description: description_ar || null },
        ],
      },
    },
    include: { translations: true },
  });

  return NextResponse.json(bank, { status: 201 });
}
