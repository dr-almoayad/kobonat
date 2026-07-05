// app/api/admin/stores/[id]/intelligence-sections/route.js
 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const storeId = Number(id);
    if (!storeId || isNaN(storeId)) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }

    const sections = await prisma.storeIntelligenceSection.findMany({
      where: { storeId },
      orderBy: { order: 'asc' },
    });

    // ✅ Always return an array, even if empty
    return NextResponse.json(sections || []);
  } catch (error) {
    console.error('[GET /intelligence-sections]', error);
    // ✅ On error, return an empty array to prevent client-side crashes
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const storeId = Number(id);
    if (!storeId || isNaN(storeId)) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      locale,
      title,
      content,
      image,
      linkUrl,
      linkText,
      order,
      columnSpan,
      voucherId,
      promoId,
    } = body;

    if (!locale || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: locale, title, content' },
        { status: 400 }
      );
    }

    const section = await prisma.storeIntelligenceSection.create({
      data: {
        storeId,
        locale,
        title,
        content,
        image: image || null,
        linkUrl: linkUrl || null,
        linkText: linkText || null,
        order: order || 0,
        columnSpan: columnSpan || 1,
        voucherId: voucherId ? Number(voucherId) : null,
        promoId: promoId ? Number(promoId) : null,
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('[POST /intelligence-sections]', error);
    return NextResponse.json(
      { error: 'Failed to create section', detail: error.message },
      { status: 500 }
    );
  }
}
