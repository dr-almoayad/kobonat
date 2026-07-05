// app/api/admin/stores/[id]/intelligence-sections/[id]/route.js

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  const { id } = params;
  const body = await req.json();
  const { locale, title, content, image, linkUrl, linkText, order, columnSpan, voucherId, promoId } = body;

  const section = await prisma.storeIntelligenceSection.update({
    where: { id: parseInt(id) },
    data: {
      locale, title, content, image, linkUrl, linkText,
      order: order || 0,
      columnSpan: columnSpan || 1,
      voucherId: voucherId || null,
      promoId: promoId || null,
    },
  });

  return NextResponse.json(section);
}

export async function DELETE(req, { params }) {
  const { id } = params;
  await prisma.storeIntelligenceSection.delete({
    where: { id: parseInt(id) },
  });
  return NextResponse.json({ success: true });
}
