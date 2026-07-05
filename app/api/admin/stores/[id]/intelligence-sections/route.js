// app/api/admin/stores/[id]/intelligence-sections/route.js

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// ── GET all sections for a store ──
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const storeId = Number(id);
    if (!storeId || isNaN(storeId)) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }

    // ✅ FIX: Use storeId in where clause
    const sections = await prisma.storeIntelligenceSection.findMany({
      where: { storeId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error('[GET /intelligence-sections]', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections', detail: error.message },
      { status: 500 }
    );
  }
}

// ── POST – create a new section ──
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const storeId = Number(id);
    if (!storeId || isNaN(storeId)) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      locale,
      title,
      content,
      image,
      linkUrl,
      linkText,
      order,
      columnSpan,
      voucherId,
      promoId,
    } = body;

    // Validate required fields
    if (!locale || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: locale, title, content' },
        { status: 400 }
      );
    }

    const section = await prisma.storeIntelligenceSection.create({
      data: {
        storeId,
        locale,
        title,
        content,
        image: image || null,
        linkUrl: linkUrl || null,
        linkText: linkText || null,
        order: order || 0,
        columnSpan: columnSpan || 1,
        voucherId: voucherId ? Number(voucherId) : null,
        promoId: promoId ? Number(promoId) : null,
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('[POST /intelligence-sections]', error);
    return NextResponse.json(
      { error: 'Failed to create section', detail: error.message },
      { status: 500 }
    );
  }
}
