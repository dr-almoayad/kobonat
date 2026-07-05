// app/api/admin/stores/[id]/intelligence-sections/route.js

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { storeId } = params;
  const sections = await prisma.storeIntelligenceSection.findMany({
    where: { storeId: parseInt(storeId) },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(sections);
}

export async function POST(req, { params }) {
  const { storeId } = params;
  const body = await req.json();
  const { locale, title, content, image, linkUrl, linkText, order, columnSpan, voucherId, promoId } = body;

  // Validate
  if (!locale || !title || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const section = await prisma.storeIntelligenceSection.create({
    data: {
      storeId: parseInt(storeId),
      locale,
      title,
      content,
      image,
      linkUrl,
      linkText,
      order: order || 0,
      columnSpan: columnSpan || 1,
      voucherId: voucherId || null,
      promoId: promoId || null,
    },
  });

  return NextResponse.json(section, { status: 201 });
}
