// app/api/admin/blog/[id]/route.js
// GET    — full post for the editor (all relations)
// PUT    — update all post fields (body JSON, not formData)
// DELETE — hard delete

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseIntList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(Number).filter(n => n > 0);
  return String(value).split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
}

function computeReadingTime(htmlEn = '', htmlAr = '') {
  const strip = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = strip(htmlEn).split(' ').length + strip(htmlAr).split(' ').length;
  return Math.max(1, Math.round(words / 200));
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — full post for the editor
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    const post = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true,
        author: true,
        category: { include: { translations: { where: { locale } } } },
        primaryStore: {
          include: { translations: { where: { locale }, select: { name: true, slug: true } } },
        },

        tags: {
          include: { tag: { include: { translations: true } } },
        },

        // Sections with all nested data
        sections: {
          orderBy: { order: 'asc' },
          include: {
            translations: true,
            products: {
              orderBy: { order: 'asc' },
              include: { product: { include: { translations: { where: { locale } } } } },
            },
            stores: {
              orderBy: { order: 'asc' },
              include: { store: { include: { translations: { where: { locale }, select: { name: true, slug: true } } } } },
            },
          },
        },

        // Post-level linked stores
        linkedStores: {
          orderBy: { order: 'asc' },
          include: {
            store: {
              include: {
                translations: { where: { locale }, select: { name: true, slug: true } },
                _count: { select: { vouchers: { where: { expiryDate: { gte: new Date() } } } } },
              },
            },
          },
        },

        // Post-level product links
        relatedProducts: {
          include: { product: { include: { translations: { where: { locale } } } } },
        },

        // Editorial related posts
        relatedPosts: {
          orderBy: { order: 'asc' },
          include: {
            relatedPost: {
              include: { translations: { where: { locale }, select: { title: true } } },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('[admin/blog/[id] GET]', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT — update the post (all fields)
// Body: JSON with all editable fields
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id }  = await params;
    const postId  = parseInt(id);
    const body    = await request.json();

    const current = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: { translations: true },
    });
    if (!current) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const {
      slug, featuredImage, isFeatured, status, publishedAt: publishedAtRaw,
      contentType, searchIntent, faqJson,
      authorId, categoryId, primaryStoreId,
      translations, tagIds, relatedPostIds, linkedStoreIds, relatedProductIds,
    } = body;

    // Determine publishedAt
    let publishedAt = current.publishedAt;
    const resolvedStatus = status || current.status;
    if (resolvedStatus === 'PUBLISHED' && !publishedAt) {
      publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : new Date();
    } else if (resolvedStatus !== 'PUBLISHED') {
      publishedAt = null;
    }

    // Auto-compute reading time from translation content
    const contentEn = translations?.en?.content || current.translations.find(t => t.locale === 'en')?.content || '';
    const contentAr = translations?.ar?.content || current.translations.find(t => t.locale === 'ar')?.content || '';
    const readingTime = computeReadingTime(contentEn, contentAr);

    // Validate faqJson
    let validatedFaqJson = current.faqJson;
    if (faqJson !== undefined) {
      if (!faqJson) {
        validatedFaqJson = null;
      } else {
        try {
          const parsed = JSON.parse(faqJson);
          validatedFaqJson = Array.isArray(parsed) && parsed.length > 0 ? JSON.stringify(parsed) : null;
        } catch {
          validatedFaqJson = null;
        }
      }
    }

    // ── 1. Scalar update ─────────────────────────────────────────────────
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        ...(slug            !== undefined && { slug }),
        ...(featuredImage   !== undefined && { featuredImage: featuredImage || null }),
        ...(isFeatured      !== undefined && { isFeatured }),
        ...(status          !== undefined && { status: resolvedStatus }),
        publishedAt,
        ...(contentType     !== undefined && { contentType }),
        ...(searchIntent    !== undefined && { searchIntent }),
        readingTime,
        faqJson: validatedFaqJson,
        ...(authorId        !== undefined && { authorId:       authorId || null }),
        ...(categoryId      !== undefined && { categoryId:     categoryId || null }),
        ...(primaryStoreId  !== undefined && { primaryStoreId: primaryStoreId || null }),
      },
    });

    // ── 2. Translations ──────────────────────────────────────────────────
    if (translations) {
      for (const locale of ['en', 'ar']) {
        const t = translations[locale];
        if (!t?.title) continue;
        await prisma.blogPostTranslation.upsert({
          where:  { postId_locale: { postId, locale } },
          create: { postId, locale, ...t },
          update: t,
        });
      }
    }

    // ── 3. Tags ───────────────────────────────────────────────────────────
    if (Array.isArray(tagIds)) {
      await prisma.blogPostTag.deleteMany({ where: { postId } });
      if (tagIds.length > 0) {
        await prisma.blogPostTag.createMany({
          data: tagIds.map(tagId => ({ postId, tagId })),
          skipDuplicates: true,
        });
      }
    }

    // ── 4. Related posts ──────────────────────────────────────────────────
    if (Array.isArray(relatedPostIds)) {
      await prisma.blogPostRelated.deleteMany({ where: { postId } });
      const valid = parseIntList(relatedPostIds).filter(rid => rid !== postId);
      if (valid.length > 0) {
        await prisma.blogPostRelated.createMany({
          data: valid.map((relatedPostId, order) => ({ postId, relatedPostId, order })),
          skipDuplicates: true,
        });
      }
    }

    // ── 5. Linked stores ──────────────────────────────────────────────────
    if (Array.isArray(linkedStoreIds)) {
      await prisma.blogPostStore.deleteMany({ where: { postId } });
      if (linkedStoreIds.length > 0) {
        await prisma.blogPostStore.createMany({
          data: parseIntList(linkedStoreIds).map((storeId, order) => ({ postId, storeId, order })),
          skipDuplicates: true,
        });
      }
    }

    // ── 6. Related products ───────────────────────────────────────────────
    if (Array.isArray(relatedProductIds)) {
      await prisma.blogPostProduct.deleteMany({ where: { postId } });
      if (relatedProductIds.length > 0) {
        await prisma.blogPostProduct.createMany({
          data: parseIntList(relatedProductIds).map(productId => ({ postId, productId })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/blog/[id] PUT]', error);
    return NextResponse.json({ error: 'Failed to update post', details: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.blogPost.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/blog/[id] DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete post', details: error.message }, { status: 500 });
  }
}
