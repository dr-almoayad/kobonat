// app/api/admin/blog/[id]/sections/[sectionId]/route.js
// PATCH  — update a section (image, order, translations)
// DELETE — delete a section

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sectionId } = await params;
  const sid  = parseInt(sectionId);
  const body = await request.json();
  const { image, order, subtitleEn, subtitleAr, contentEn, contentAr } = body;

  const section = await prisma.blogPostSection.update({
    where: { id: sid },
    data: {
      ...(image !== undefined && { image: image || null }),
      ...(order !== undefined && { order }),
    },
  });

  for (const [locale, subtitle, content] of [
    ['en', subtitleEn, contentEn],
    ['ar', subtitleAr, contentAr],
  ]) {
    if (content === undefined && subtitle === undefined) continue;
    await prisma.blogPostSectionTranslation.upsert({
      where:  { sectionId_locale: { sectionId: sid, locale } },
      create: { sectionId: sid, locale, subtitle: subtitle || null, content: content || '' },
      update: { subtitle: subtitle || null, ...(content !== undefined && { content }) },
    });
  }

  return NextResponse.json({ success: true, section });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sectionId } = await params;
  await prisma.blogPostSection.delete({ where: { id: parseInt(sectionId) } });
  return NextResponse.json({ deleted: true });
}
