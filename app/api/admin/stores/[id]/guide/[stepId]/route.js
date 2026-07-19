// app/api/admin/stores/[id]/guide/[stepId]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// ── PUT: update a guide step ──
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, stepId } = await params;
    const storeId = parseInt(id);
    const stepIdNum = parseInt(stepId);
    const body = await request.json();

    const { title, description, images, order, bnplPartner } = body;

    const step = await prisma.storeGuideStep.update({
      where: { id: stepIdNum, storeId },
      data: {
        title,
        description: description || null,
        images: images || [],
        order: order !== undefined ? order : undefined,
        bnplPartner: bnplPartner || null,
      },
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error('[PUT /api/admin/stores/[id]/guide/[stepId]]', error);
    return NextResponse.json({ error: 'Failed to update guide step' }, { status: 500 });
  }
}

// ── DELETE: delete a guide step ──
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, stepId } = await params;
    const storeId = parseInt(id);
    const stepIdNum = parseInt(stepId);

    await prisma.storeGuideStep.delete({
      where: { id: stepIdNum, storeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/stores/[id]/guide/[stepId]]', error);
    return NextResponse.json({ error: 'Failed to delete guide step' }, { status: 500 });
  }
}
