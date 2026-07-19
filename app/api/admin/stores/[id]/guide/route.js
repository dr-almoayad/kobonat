// app/api/admin/stores/[id]/guide/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// ── GET: fetch guide steps for a store + locale, grouped by type ──
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    const steps = await prisma.storeGuideStep.findMany({
      where: { storeId: parseInt(id), locale },
      orderBy: { order: 'asc' },
    });

    // Group by type
    const grouped = steps.reduce((acc, step) => {
      const type = step.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(step);
      return acc;
    }, {});

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('[GET /api/admin/stores/[id]/guide]', error);
    return NextResponse.json({ error: 'Failed to fetch guide steps' }, { status: 500 });
  }
}

// ── POST: create a new guide step ──
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const storeId = parseInt(id);
    const body = await request.json();

    const {
      locale,
      type,
      title,
      description,
      images,
      order,
      bnplPartner,
    } = body;

    // Validate
    if (!locale || !type || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get max order for this type/locale
    const maxOrder = await prisma.storeGuideStep.aggregate({
      where: { storeId, locale, type },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const step = await prisma.storeGuideStep.create({
      data: {
        storeId,
        locale,
        type,
        title,
        description: description || null,
        images: images || [],
        order: order ?? nextOrder,
        bnplPartner: bnplPartner || null,
      },
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/stores/[id]/guide]', error);
    return NextResponse.json({ error: 'Failed to create guide step' }, { status: 500 });
  }
}
