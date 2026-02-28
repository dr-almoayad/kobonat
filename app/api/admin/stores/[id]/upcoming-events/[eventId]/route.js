// app/api/admin/stores/[id]/upcoming-events/[eventId]/route.js
// PATCH  — update an upcoming event
// DELETE — delete an upcoming event

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  const id   = Number(params.eventId);
  const body = await request.json();
  const { eventName, expectedMonth, confidenceLevel, expectedMaxDiscount, notes } = body;

  const event = await prisma.storeUpcomingEvent.update({
    where: { id },
    data: {
      ...(eventName          !== undefined && { eventName }),
      ...(expectedMonth      !== undefined && { expectedMonth }),
      ...(confidenceLevel    !== undefined && { confidenceLevel }),
      ...(expectedMaxDiscount !== undefined && { expectedMaxDiscount }),
      ...(notes              !== undefined && { notes }),
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  await prisma.storeUpcomingEvent.delete({ where: { id: Number(params.eventId) } });
  return NextResponse.json({ deleted: true });
}
