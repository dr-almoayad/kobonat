// app/api/admin/blog/tags/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'en';

  const tags = await prisma.blogTag.findMany({
    include: {
      translations: { where: { locale } },
      _count: { select: { posts: true } },
    },
    orderBy: { slug: 'asc' },
  });
  return NextResponse.json(tags);
}
