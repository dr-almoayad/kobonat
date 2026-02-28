// app/api/admin/stores/[id]/peak-seasons/[seasonId]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request, ['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
  if (!auth.ok) return auth.response;

  await prisma.storePeakSeason.delete({ where: { id: Number(params.seasonId) } });
  return NextResponse.json({ deleted: true });
}
