// app/api/admin/categories/reorder/route.js
// POST { updates: [{ id, order }] } — bulk update category order values.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { updates } = await req.json();
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array required' }, { status: 400 });
    }

    await prisma.$transaction(
      updates.map(({ id, order }) =>
        prisma.category.update({
          where: { id: parseInt(id) },
          data:  { order: parseInt(order) },
        })
      )
    );

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error) {
    console.error('[categories/reorder]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
