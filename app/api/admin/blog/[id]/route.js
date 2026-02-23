// app/api/admin/blog/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const post = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true,
        author: true,
        category: { include: { translations: { where: { locale } } } },
        tags: {
          include: { tag: { include: { translations: true } } }
        },
        relatedProducts: true,
        relatedPosts: {
          include: {
            relatedPost: { include: { translations: { where: { locale } } } }
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Admin blog [id] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.blogPost.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Admin blog [id] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete post', details: error.message }, { status: 500 });
  }
}
