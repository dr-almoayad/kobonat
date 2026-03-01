// app/api/admin/stores/[id]/upcoming-events/route.js
// GET  — list upcoming events for a store
// POST — create a new upcoming event

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    };

  const { id } = await params;
    const storeId = Number(id);

  const events  = await prisma.storeUpcomingEvent.findMany({
    where:   { storeId },
    orderBy: [{ expectedMonth: 'asc' }],
  });

  return NextResponse.json(events);
}

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
