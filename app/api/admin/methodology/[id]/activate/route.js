// app/api/admin/methodology/[id]/activate/route.js
// POST — activates this version and deactivates all others (atomic transaction)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request, { params }) {
  const auth = await requireAdmin(request, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.ok) return auth.response;

  const id = Number(params.id);

  const methodology = await prisma.savingsMethodology.findUnique({ where: { id } });
  if (!methodology) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Atomic: deactivate all, activate target
  const [, activated] = await prisma.$transaction([
    prisma.savingsMethodology.updateMany({
      where:  { isActive: true },
      data:   { isActive: false },
    }),
    prisma.savingsMethodology.update({
      where: { id },
      data:  { isActive: true },
    }),
  ]);

  return NextResponse.json(activated);
}
