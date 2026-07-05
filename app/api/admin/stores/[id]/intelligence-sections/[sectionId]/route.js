// app/api/admin/stores/[id]/intelligence-sections/[sectionId]/route.js

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// ── PUT – update a section ──
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, sectionId } = await params;
    const storeId = Number(id);
    const sectionIdNum = Number(sectionId);

    if (!storeId || isNaN(storeId) || !sectionIdNum || isNaN(sectionIdNum)) {
      return NextResponse.json({ error: 'Invalid ID(s)' }, { status: 400 });
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

    // Verify section belongs to this store
    const existing = await prisma.storeIntelligenceSection.findFirst({
      where: { id: sectionIdNum, storeId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const updated = await prisma.storeIntelligenceSection.update({
      where: { id: sectionIdNum },
      data: {
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PUT /intelligence-sections]', error);
    return NextResponse.json(
      { error: 'Failed to update section', detail: error.message },
      { status: 500 }
    );
  }
}

// ── DELETE – remove a section ──
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, sectionId } = await params;
    const storeId = Number(id);
    const sectionIdNum = Number(sectionId);

    if (!storeId || isNaN(storeId) || !sectionIdNum || isNaN(sectionIdNum)) {
      return NextResponse.json({ error: 'Invalid ID(s)' }, { status: 400 });
    }

    // Verify section belongs to this store
    const existing = await prisma.storeIntelligenceSection.findFirst({
      where: { id: sectionIdNum, storeId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    await prisma.storeIntelligenceSection.delete({
      where: { id: sectionIdNum },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /intelligence-sections]', error);
    return NextResponse.json(
      { error: 'Failed to delete section', detail: error.message },
      { status: 500 }
    );
  }
}
