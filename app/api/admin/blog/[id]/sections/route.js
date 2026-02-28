// app/api/admin/blog/[id]/sections/route.js
// GET  — list all sections for a post (ordered)
// POST — create a new section

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'en';

  const sections = await prisma.blogPostSection.findMany({
    where:   { postId: parseInt(id) },
    orderBy: { order: 'asc' },
    include: {
      translations: { where: { locale } },
      products: {
        orderBy: { order: 'asc' },
        include: { product: { include: { translations: { where: { locale } } } } },
      },
      stores: {
        orderBy: { order: 'asc' },
        include: { store: { include: { translations: { where: { locale }, select: { name: true, slug: true } } } } },
      },
    },
  });

  return NextResponse.json(sections);
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const postId = parseInt(id);
  const body   = await request.json();

  const { image, order, subtitleEn, subtitleAr, contentEn, contentAr } = body;

  // Get current max order if not provided
  let resolvedOrder = order;
  if (resolvedOrder === undefined) {
    const last = await prisma.blogPostSection.findFirst({
      where:   { postId },
      orderBy: { order: 'desc' },
      select:  { order: true },
    });
    resolvedOrder = (last?.order ?? -1) + 1;
  }

  const section = await prisma.blogPostSection.create({
    data: {
      postId,
      order: resolvedOrder,
      image: image || null,
      translations: {
        create: [
          { locale: 'en', subtitle: subtitleEn || null, content: contentEn || '' },
          { locale: 'ar', subtitle: subtitleAr || null, content: contentAr || '' },
        ],
      },
    },
    include: { translations: true },
  });

  return NextResponse.json(section, { status: 201 });
}
