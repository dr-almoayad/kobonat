// app/api/admin/banks/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function auth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return null;
  return session;
}

// ── GET /api/admin/banks/[id] ─────────────────────────────────────────────────
export async function GET(req, { params }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const bank = await prisma.bank.findUnique({
    where: { id: parseInt(id) },
    include: {
      translations: true,
      cards: {
        include: { translations: true },
        orderBy: [{ network: 'asc' }, { tier: 'asc' }],
      },
      _count: { select: { otherPromos: true, nicheSnapshots: true } },
    },
  });

  if (!bank) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(bank);
}

// ── PUT /api/admin/banks/[id] ─────────────────────────────────────────────────
export async function PUT(req, { params }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { slug, logo, color, websiteUrl, type, appRating, isActive, name_en, name_ar, description_en, description_ar } = body;

  const bank = await prisma.bank.update({
    where: { id: parseInt(id) },
    data: {
      slug:       slug       || undefined,
      logo:       logo       ?? null,
      color:      color      ?? null,
      websiteUrl: websiteUrl ?? null,
      type:       type       || undefined,
      appRating:  appRating  !== undefined ? parseFloat(appRating) || null : undefined,
      isActive:   isActive   !== undefined ? Boolean(isActive) : undefined,
    },
  });

  // Upsert translations
  for (const [locale, name, desc] of [
    ['en', name_en, description_en],
    ['ar', name_ar, description_ar],
  ]) {
    if (!name) continue;
    await prisma.bankTranslation.upsert({
      where:  { bankId_locale: { bankId: bank.id, locale } },
      update: { name, description: desc ?? null },
      create: { bankId: bank.id, locale, name, description: desc ?? null },
    });
  }

  return NextResponse.json(bank);
}

// ── DELETE /api/admin/banks/[id] ──────────────────────────────────────────────
export async function DELETE(req, { params }) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.bank.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ deleted: true });
}
