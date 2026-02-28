// app/api/admin/methodology/[id]/route.js
// GET   — fetch one methodology with snapshot count
// PATCH — update formula parameters (only allowed if NOT active, or SUPER_ADMIN)
// DELETE — only if no snapshots reference it

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]';

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const id = Number(params.id);
  const methodology = await prisma.savingsMethodology.findUnique({
    where: { id },
    include: { _count: { select: { snapshots: true } } },
  });

  if (!methodology) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(methodology);
}

export async function PATCH(request, { params }) {
   const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const id = Number(params.id);
  const body = await request.json();

  // Prevent editing the isActive flag via PATCH — use /activate instead
  delete body.isActive;
  delete body.version; // Version is immutable after creation

  const methodology = await prisma.savingsMethodology.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(methodology);
}

export async function DELETE(request, { params }) {
   const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const id = Number(params.id);
  const methodology = await prisma.savingsMethodology.findUnique({
    where: { id },
    include: { _count: { select: { snapshots: true } } },
  });

  if (!methodology) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (methodology.isActive) {
    return NextResponse.json({ error: 'Cannot delete the active methodology' }, { status: 409 });
  }
  if (methodology._count.snapshots > 0) {
    return NextResponse.json(
      { error: `${methodology._count.snapshots} snapshots reference this version. Deactivate and archive instead.` },
      { status: 409 }
    );
  }

  await prisma.savingsMethodology.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
