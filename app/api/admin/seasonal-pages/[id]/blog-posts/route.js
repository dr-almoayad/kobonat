// app/api/admin/seasonal-pages/[id]/blog-posts/route.js
// GET / POST / DELETE / PATCH for seasonal page linked blog posts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.isAdmin ? s : null;
}

export async function GET(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  const posts = await prisma.seasonalPageBlogPost.findMany({
    where:   { seasonalPageId: parseInt(id) },
    orderBy: { order: 'asc' },
    include: {
      post: {
        include: {
          translations: { where: { locale } },
          author:   true,
          category: { include: { translations: { where: { locale } } } },
        },
      },
    },
  });

  return NextResponse.json(posts);
}

export async function POST(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const seasonalPageId = parseInt(id);
  const body  = await req.json();
  const items = Array.isArray(body) ? body : [body];

  const last = await prisma.seasonalPageBlogPost.findFirst({
    where:   { seasonalPageId },
    orderBy: { order: 'desc' },
    select:  { order: true },
  });
  let nextOrder = (last?.order ?? -1) + 1;

  await prisma.seasonalPageBlogPost.createMany({
    data: items.map(item => ({
      seasonalPageId,
      postId: parseInt(item.postId),
      order:  item.order ?? nextOrder++,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');

  if (!postId) return NextResponse.json({ error: 'postId query param required' }, { status: 400 });

  await prisma.seasonalPageBlogPost.delete({
    where: {
      seasonalPageId_postId: {
        seasonalPageId: parseInt(id),
        postId:         parseInt(postId),
      },
    },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req, { params }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const seasonalPageId = parseInt(id);
  const updates = await req.json();

  await prisma.$transaction(
    updates.map(({ postId, order }) =>
      prisma.seasonalPageBlogPost.update({
        where: { seasonalPageId_postId: { seasonalPageId, postId: parseInt(postId) } },
        data:  { order: parseInt(order) },
      })
    )
  );

  return NextResponse.json({ success: true });
}
