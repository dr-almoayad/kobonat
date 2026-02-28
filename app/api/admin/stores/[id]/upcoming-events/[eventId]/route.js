// app/api/admin/stores/[id]/upcoming-events/[eventId]/route.js
// PATCH  — update an upcoming event
// DELETE — delete an upcoming event

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request, ['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
  if (!auth.ok) return auth.response;

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
  const auth = await requireAdmin(request, ['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
  if (!auth.ok) return auth.response;

  await prisma.storeUpcomingEvent.delete({ where: { id: Number(params.eventId) } });
  return NextResponse.json({ deleted: true });
}
