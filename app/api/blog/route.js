// app/api/blog/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================================================
// GET /api/blog
// Query params: locale, category, tag, featured, page, limit
// ============================================================================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const locale       = searchParams.get('locale') || 'ar';
    const categorySlug = searchParams.get('category') || null;
    const tagSlug      = searchParams.get('tag') || null;
    const featured     = searchParams.get('featured') === 'true';
    const page         = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit        = Math.min(50, parseInt(searchParams.get('limit') || '12'));
    const offset       = (page - 1) * limit;

    // ------------------------------------------------------------------
    // Build WHERE clause
    // ------------------------------------------------------------------
    const where = {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() }
    };

    if (featured) {
      where.isFeatured = true;
    }

    if (categorySlug) {
      where.category = {
        slug: categorySlug
      };
    }

    if (tagSlug) {
      where.tags = {
        some: {
          tag: { slug: tagSlug }
        }
      };
    }

    // ------------------------------------------------------------------
    // Fetch posts + total count in parallel
    // ------------------------------------------------------------------
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          translations: {
            where: { locale }
          },
          author: true,
          category: {
            include: {
              translations: { where: { locale } }
            }
          },
          tags: {
            include: {
              tag: {
                include: {
                  translations: { where: { locale } }
                }
              }
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { publishedAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ]);

    // ------------------------------------------------------------------
    // Transform
    // ------------------------------------------------------------------
    const transformedPosts = posts.map(post => transformPost(post, locale));

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        current: page,
        total,
        pages: Math.ceil(total / limit),
        limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Blog API error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}
