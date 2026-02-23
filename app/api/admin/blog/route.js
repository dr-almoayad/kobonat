// app/api/admin/blog/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';
    const status = searchParams.get('status') || null;

    const where = status ? { status } : {};

    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        translations: { where: { locale } },
        author: true,
        category: { include: { translations: { where: { locale } } } },
        tags: {
          include: { tag: { include: { translations: { where: { locale } } } } }
        },
        _count: { select: { relatedProducts: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Admin blog GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}
