'use server';
// app/admin/_lib/blog-actions.js
// Covers every field in the BlogPost schema:
//   scalar: slug, featuredImage, isFeatured, status, publishedAt,
//           contentType, searchIntent, readingTime, faqJson, primaryStoreId,
//           authorId, categoryId
//   relations: translations (en + ar), tags, relatedPosts, linkedStores, relatedProducts

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Auto-compute reading time from HTML content (~200 words/min). */
function computeReadingTime(htmlEn = '', htmlAr = '') {
  const strip = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = strip(htmlEn).split(' ').length + strip(htmlAr).split(' ').length;
  return Math.max(1, Math.round(words / 200));
}

/** Parse a comma-separated int list from formData (e.g. relatedPostIds). */
function parseIntList(formData, key) {
  const raw = formData.get(key) || '';
  return raw.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
}

/** Resolve tag IDs — upsert tags by slug, creating bilingual names if new. */
async function resolveTagIds(slugs = [], namesEn = [], namesAr = []) {
  const ids = [];
  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    if (!slug) continue;
    const tag = await prisma.blogTag.upsert({
      where:  { slug },
      create: {
        slug,
        translations: {
          create: [
            { locale: 'en', name: namesEn[i] || slug },
            { locale: 'ar', name: namesAr[i] || slug },
          ],
        },
      },
      update: {},
    });
    ids.push(tag.id);
  }
  return ids;
}

/** Validate faqJson — returns null if invalid / empty. */
function parseFaqJson(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Each item must have { q, a }
    if (!parsed.every(item => item.q && item.a)) return null;
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE BLOG POST
// ─────────────────────────────────────────────────────────────────────────────

export async function createBlogPost(formData) {
  try {
    const status        = formData.get('status') || 'DRAFT';
    const publishedAtRaw = formData.get('publishedAt');
    const tagSlugs      = formData.getAll('tagSlugs');
    const tagNamesEn    = formData.getAll('tagNamesEn');
    const tagNamesAr    = formData.getAll('tagNamesAr');

    const authorId       = formData.get('authorId')       ? parseInt(formData.get('authorId'))       : null;
    const categoryId     = formData.get('categoryId')     ? parseInt(formData.get('categoryId'))     : null;
    const primaryStoreId = formData.get('primaryStoreId') ? parseInt(formData.get('primaryStoreId')) : null;

    const contentEn = formData.get('content_en') || '';
    const contentAr = formData.get('content_ar') || '';
    const readingTime = computeReadingTime(contentEn, contentAr);
    const faqJson    = parseFaqJson(formData.get('faqJson'));

    const tagIds = await resolveTagIds(tagSlugs, tagNamesEn, tagNamesAr);

    const post = await prisma.blogPost.create({
      data: {
        slug:          formData.get('slug'),
        featuredImage: formData.get('featuredImage') || null,
        isFeatured:    formData.get('isFeatured') === 'on',
        status,
        publishedAt:   status === 'PUBLISHED' && publishedAtRaw
          ? new Date(publishedAtRaw)
          : status === 'PUBLISHED' ? new Date() : null,
        contentType:   formData.get('contentType')  || 'GUIDE',
        searchIntent:  formData.get('searchIntent') || 'INFORMATIONAL',
        readingTime,
        faqJson,
        authorId,
        categoryId,
        primaryStoreId,
        translations: {
          create: [
            {
              locale:          'en',
              title:           formData.get('title_en'),
              excerpt:         formData.get('excerpt_en'),
              content:         contentEn,
              metaTitle:       formData.get('metaTitle_en')       || null,
              metaDescription: formData.get('metaDescription_en') || null,
            },
            {
              locale:          'ar',
              title:           formData.get('title_ar'),
              excerpt:         formData.get('excerpt_ar'),
              content:         contentAr,
              metaTitle:       formData.get('metaTitle_ar')       || null,
              metaDescription: formData.get('metaDescription_ar') || null,
            },
          ],
        },
        tags: { create: tagIds.map(tagId => ({ tagId })) },
      },
    });

    revalidatePath('/admin/blog');
    return { success: true, id: post.id };
  } catch (error) {
    console.error('[createBlogPost]', error);
    return { error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE BLOG POST — all scalar + relational fields
// ─────────────────────────────────────────────────────────────────────────────

export async function updateBlogPost(id, formData) {
  try {
    const postId        = parseInt(id);
    const status        = formData.get('status') || 'DRAFT';
    const publishedAtRaw = formData.get('publishedAt');
    const tagSlugs      = formData.getAll('tagSlugs');

    const current = await prisma.blogPost.findUnique({
      where:   { id: postId },
      include: { translations: true },
    });
    if (!current) return { error: `Blog post ${id} not found` };

    const authorId       = formData.get('authorId')       ? parseInt(formData.get('authorId'))       : null;
    const categoryId     = formData.get('categoryId')     ? parseInt(formData.get('categoryId'))     : null;
    const primaryStoreId = formData.get('primaryStoreId') ? parseInt(formData.get('primaryStoreId')) : null;

    // publishedAt: preserve once set; clear when un-publishing
    let publishedAt = current.publishedAt;
    if (status === 'PUBLISHED' && !publishedAt) {
      publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : new Date();
    } else if (status !== 'PUBLISHED') {
      publishedAt = null;
    }

    const contentEn = formData.get('content_en') || current.translations.find(t => t.locale === 'en')?.content || '';
    const contentAr = formData.get('content_ar') || current.translations.find(t => t.locale === 'ar')?.content || '';
    const readingTime = computeReadingTime(contentEn, contentAr);
    const faqJson    = parseFaqJson(formData.get('faqJson'));

    // ── 1. Scalar update ─────────────────────────────────────────────────
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        slug:          formData.get('slug')         || current.slug,
        featuredImage: formData.get('featuredImage') || current.featuredImage || null,
        isFeatured:    formData.has('isFeatured')
          ? formData.get('isFeatured') === 'on'
          : current.isFeatured,
        status,
        publishedAt,
        contentType:   formData.get('contentType')  || current.contentType,
        searchIntent:  formData.get('searchIntent') || current.searchIntent,
        readingTime,
        faqJson:       faqJson !== undefined ? faqJson : current.faqJson,
        authorId,
        categoryId,
        primaryStoreId,
      },
    });

    // ── 2. Translations ──────────────────────────────────────────────────
    for (const locale of ['en', 'ar']) {
      const title           = formData.get(`title_${locale}`);
      const excerpt         = formData.get(`excerpt_${locale}`);
      const content         = formData.get(`content_${locale}`);
      const metaTitle       = formData.get(`metaTitle_${locale}`) || null;
      const metaDescription = formData.get(`metaDescription_${locale}`) || null;
      if (!title) continue;
      await prisma.blogPostTranslation.upsert({
        where:  { postId_locale: { postId, locale } },
        create: { postId, locale, title, excerpt, content, metaTitle, metaDescription },
        update: { title, excerpt, content, metaTitle, metaDescription },
      });
    }

    // ── 3. Tags ───────────────────────────────────────────────────────────
    if (formData.has('tagSlugs')) {
      const tagIds = await resolveTagIds(tagSlugs, [], []);
      await prisma.blogPostTag.deleteMany({ where: { postId } });
      if (tagIds.length > 0) {
        await prisma.blogPostTag.createMany({
          data: tagIds.map(tagId => ({ postId, tagId })),
        });
      }
    }

    // ── 4. Related posts ──────────────────────────────────────────────────
    if (formData.has('relatedPostIds')) {
      const relatedIds = parseIntList(formData, 'relatedPostIds');
      await prisma.blogPostRelated.deleteMany({ where: { postId } });
      if (relatedIds.length > 0) {
        await prisma.blogPostRelated.createMany({
          data: relatedIds.map((relatedPostId, order) => ({ postId, relatedPostId, order })),
          skipDuplicates: true,
        });
      }
    }

    // ── 5. Linked stores ──────────────────────────────────────────────────
    if (formData.has('linkedStoreIds')) {
      const storeIds = parseIntList(formData, 'linkedStoreIds');
      await prisma.blogPostStore.deleteMany({ where: { postId } });
      if (storeIds.length > 0) {
        await prisma.blogPostStore.createMany({
          data: storeIds.map((storeId, order) => ({ postId, storeId, order })),
          skipDuplicates: true,
        });
      }
    }

    // ── 6. Related products ───────────────────────────────────────────────
    if (formData.has('relatedProductIds')) {
      const productIds = parseIntList(formData, 'relatedProductIds');
      await prisma.blogPostProduct.deleteMany({ where: { postId } });
      if (productIds.length > 0) {
        await prisma.blogPostProduct.createMany({
          data: productIds.map(productId => ({ postId, productId })),
          skipDuplicates: true,
        });
      }
    }

    revalidatePath('/admin/blog');
    revalidatePath(`/admin/blog/${id}`);
    return { success: true };
  } catch (error) {
    console.error('[updateBlogPost]', error);
    return { error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE BLOG POST
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteBlogPost(id) {
  try {
    await prisma.blogPost.delete({ where: { id: parseInt(id) } });
    revalidatePath('/admin/blog');
    return { success: true };
  } catch (error) {
    console.error('[deleteBlogPost]', error);
    return { error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTIONS — create / update / delete / reorder
// ─────────────────────────────────────────────────────────────────────────────

export async function createSection(postId, { image, subtitleEn, subtitleAr, contentEn, contentAr, order }) {
  try {
    const section = await prisma.blogPostSection.create({
      data: {
        postId: parseInt(postId),
        order:  order ?? 0,
        image:  image || null,
        translations: {
          create: [
            { locale: 'en', subtitle: subtitleEn || null, content: contentEn || '' },
            { locale: 'ar', subtitle: subtitleAr || null, content: contentAr || '' },
          ],
        },
      },
      include: { translations: true },
    });
    revalidatePath(`/admin/blog/${postId}`);
    return { success: true, section };
  } catch (error) {
    console.error('[createSection]', error);
    return { error: error.message };
  }
}

export async function updateSection(sectionId, { image, subtitleEn, subtitleAr, contentEn, contentAr, order }) {
  try {
    const section = await prisma.blogPostSection.update({
      where: { id: parseInt(sectionId) },
      data: {
        ...(image !== undefined && { image: image || null }),
        ...(order !== undefined && { order }),
      },
    });

    for (const [locale, subtitle, content] of [
      ['en', subtitleEn, contentEn],
      ['ar', subtitleAr, contentAr],
    ]) {
      if (content === undefined) continue;
      await prisma.blogPostSectionTranslation.upsert({
        where:  { sectionId_locale: { sectionId: parseInt(sectionId), locale } },
        create: { sectionId: parseInt(sectionId), locale, subtitle: subtitle || null, content: content || '' },
        update: { subtitle: subtitle || null, content: content || '' },
      });
    }

    revalidatePath(`/admin/blog/${section.postId}`);
    return { success: true };
  } catch (error) {
    console.error('[updateSection]', error);
    return { error: error.message };
  }
}

export async function deleteSection(sectionId) {
  try {
    const section = await prisma.blogPostSection.delete({ where: { id: parseInt(sectionId) } });
    revalidatePath(`/admin/blog/${section.postId}`);
    return { success: true };
  } catch (error) {
    console.error('[deleteSection]', error);
    return { error: error.message };
  }
}

export async function reorderSections(postId, orderedIds) {
  try {
    await Promise.all(
      orderedIds.map((sectionId, index) =>
        prisma.blogPostSection.update({ where: { id: sectionId }, data: { order: index } })
      )
    );
    revalidatePath(`/admin/blog/${postId}`);
    return { success: true };
  } catch (error) {
    console.error('[reorderSections]', error);
    return { error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertBlogCategory(formData) {
  try {
    const categoryId = formData.get('categoryId');
    const isUpdate   = categoryId && categoryId !== 'undefined';
    const data = {
      slug:  formData.get('slug'),
      color: formData.get('color') || null,
      icon:  formData.get('icon')  || null,
    };

    let category;
    if (isUpdate) {
      category = await prisma.blogCategory.update({ where: { id: parseInt(categoryId) }, data });
    } else {
      category = await prisma.blogCategory.create({ data });
    }

    for (const locale of ['en', 'ar']) {
      await prisma.blogCategoryTranslation.upsert({
        where:  { categoryId_locale: { categoryId: category.id, locale } },
        create: { categoryId: category.id, locale, name: formData.get(`name_${locale}`), description: formData.get(`description_${locale}`) || null },
        update: { name: formData.get(`name_${locale}`), description: formData.get(`description_${locale}`) || null },
      });
    }

    revalidatePath('/admin/blog/categories');
    return { success: true, id: category.id };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deleteBlogCategory(id) {
  try {
    await prisma.blogCategory.delete({ where: { id: parseInt(id) } });
    revalidatePath('/admin/blog/categories');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG AUTHORS
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertBlogAuthor(formData) {
  try {
    const authorId = formData.get('authorId');
    const isUpdate = authorId && authorId !== 'undefined';
    const data = {
      name:          formData.get('name'),
      nameAr:        formData.get('nameAr')        || null,
      avatar:        formData.get('avatar')        || null,
      bio:           formData.get('bio')           || null,
      bioAr:         formData.get('bioAr')         || null,
      twitterHandle: formData.get('twitterHandle') || null,
    };

    if (isUpdate) {
      await prisma.blogAuthor.update({ where: { id: parseInt(authorId) }, data });
    } else {
      await prisma.blogAuthor.create({ data });
    }

    revalidatePath('/admin/blog/authors');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deleteBlogAuthor(id) {
  try {
    const count = await prisma.blogPost.count({ where: { authorId: parseInt(id) } });
    if (count > 0) return { error: `Cannot delete — ${count} post(s) use this author.` };
    await prisma.blogAuthor.delete({ where: { id: parseInt(id) } });
    revalidatePath('/admin/blog/authors');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG TAGS
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertBlogTag(formData) {
  try {
    const tagId    = formData.get('tagId');
    const isUpdate = tagId && tagId !== 'undefined';
    const slug     = formData.get('slug');

    let tag;
    if (isUpdate) {
      tag = await prisma.blogTag.update({ where: { id: parseInt(tagId) }, data: { slug } });
    } else {
      tag = await prisma.blogTag.create({ data: { slug } });
    }

    for (const locale of ['en', 'ar']) {
      await prisma.blogTagTranslation.upsert({
        where:  { tagId_locale: { tagId: tag.id, locale } },
        create: { tagId: tag.id, locale, name: formData.get(`name_${locale}`) },
        update: { name: formData.get(`name_${locale}`) },
      });
    }

    revalidatePath('/admin/blog/categories');
    return { success: true, id: tag.id };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deleteBlogTag(id) {
  try {
    await prisma.blogTag.delete({ where: { id: parseInt(id) } });
    revalidatePath('/admin/blog/categories');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}
