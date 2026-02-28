// app/api/admin/stores/[id]/upcoming-events/route.js
// GET  — list upcoming events for a store
// POST — create a new upcoming event

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const storeId = Number(params.id);
  const events  = await prisma.storeUpcomingEvent.findMany({
    where:   { storeId },
    orderBy: [{ expectedMonth: 'asc' }],
  });

  return NextResponse.json(events);
}

export async function POST(request, { params }) {
  const auth = await requireAdmin(request, ['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
  if (!auth.ok) return auth.response;

  const storeId = Number(params.id);
  const body    = await request.json();
  const { eventName, expectedMonth, confidenceLevel = 'MEDIUM', expectedMaxDiscount, notes } = body;

  if (!eventName || !expectedMonth) {
    return NextResponse.json({ error: 'eventName and expectedMonth are required' }, { status: 400 });
  }

  const event = await prisma.storeUpcomingEvent.create({
    data: { storeId, eventName, expectedMonth, confidenceLevel, expectedMaxDiscount: expectedMaxDiscount ?? null, notes: notes ?? null },
  });

  return NextResponse.json(event, { status: 201 });
}
