// app/api/admin/stores/[id]/peak-seasons/[seasonId]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  await prisma.storePeakSeason.delete({ where: { id: Number(params.seasonId) } });
  return NextResponse.json({ deleted: true });
}
