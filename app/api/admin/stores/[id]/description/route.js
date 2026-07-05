// app/api/admin/stores/[id]/description/route.js

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(request, { params }) {
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
    const { descriptionEn, descriptionAr } = body;

    // Validate – at least one should be provided
    if (!descriptionEn && !descriptionAr) {
      return NextResponse.json(
        { error: 'At least one description (EN or AR) is required' },
        { status: 400 }
      );
    }

    // ── Update English description ──
    if (descriptionEn !== undefined) {
      const existingEn = await prisma.storeTranslation.findFirst({
        where: { storeId, locale: 'en' },
      });
      if (existingEn) {
        await prisma.storeTranslation.update({
          where: { id: existingEn.id },
          data: { description: descriptionEn },
        });
      } else {
        // Fallback: create the translation if missing (shouldn't happen, but safe)
        await prisma.storeTranslation.create({
          data: {
            storeId,
            locale: 'en',
            name: 'Store',
            slug: `store-${storeId}`,
            description: descriptionEn,
          },
        });
      }
    }

    // ── Update Arabic description ──
    if (descriptionAr !== undefined) {
      const existingAr = await prisma.storeTranslation.findFirst({
        where: { storeId, locale: 'ar' },
      });
      if (existingAr) {
        await prisma.storeTranslation.update({
          where: { id: existingAr.id },
          data: { description: descriptionAr },
        });
      } else {
        await prisma.storeTranslation.create({
          data: {
            storeId,
            locale: 'ar',
            name: 'متجر',
            slug: `store-${storeId}`,
            description: descriptionAr,
          },
        });
      }
    }

    // ── Revalidate the intelligence page cache ──
    // (Note: revalidatePath is not available in API routes; you can use revalidateTag if needed)
    // For now, we just return success.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/admin/stores/[id]/description]', error);
    return NextResponse.json(
      { error: 'Failed to update description', detail: error.message },
      { status: 500 }
    );
  }
}
