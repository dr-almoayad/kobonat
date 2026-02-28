// app/api/admin/blog/authors/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const authors = await prisma.blogAuthor.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(authors);
}
