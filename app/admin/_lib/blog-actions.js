'use server';
// app/admin/_lib/blog-actions.js

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================================================
// BLOG POSTS
// ============================================================================

export async function createBlogPost(formData) {
  try {

    const publishedAtRaw = formData.get('publishedAt');
    const status = formData.get('status') || 'DRAFT';
    const tagSlugs = formData.getAll('tagSlugs');   // array of existing tag slugs
    const tagNamesEn = formData.getAll('tagNamesEn'); // parallel: new tag names EN
    const tagNamesAr = formData.getAll('tagNamesAr'); // parallel: new tag names AR

    // Resolve author and category (optional)
    const authorId = formData.get('authorId') ? parseInt(formData.get('authorId')) : null;
    const categoryId = formData.get('categoryId') ? parseInt(formData.get('categoryId')) : null;

    // Resolve tag IDs — upsert tags by slug
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
        authorId,
        categoryId,
        translations: {
          create: [
            {
              locale:          'en',
              title:           formData.get('title_en'),
              excerpt:         formData.get('excerpt_en'),
              content:         formData.get('content_en'),
              metaTitle:       formData.get('metaTitle_en') || null,
              metaDescription: formData.get('metaDescription_en') || null,
            },
            {
              locale:          'ar',
              title:           formData.get('title_ar'),
              excerpt:         formData.get('excerpt_ar'),
              content:         formData.get('content_ar'),
              metaTitle:       formData.get('metaTitle_ar') || null,
              metaDescription: formData.get('metaDescription_ar') || null,
            }
          ]
        },
        tags: {
          create: tagIds.map(tagId => ({ tagId }))
        }
      }
    });

    revalidatePath('/admin/blog');
    return { success: true, id: post.id };
  } catch (error) {
    console.error('Create blog post error:', error);
    return { error: error.message };
  }
}


export async function updateBlogPost(id, formData) {
  try {

    const postId = parseInt(id);
    const publishedAtRaw = formData.get('publishedAt');
    const status = formData.get('status') || 'DRAFT';
    const tagSlugs = formData.getAll('tagSlugs');

    const current = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: { translations: true }
    });
    if (!current) return { error: `Blog post ${id} not found` };

    const authorId = formData.get('authorId') ? parseInt(formData.get('authorId')) : null;
    const categoryId = formData.get('categoryId') ? parseInt(formData.get('categoryId')) : null;

    // Determine publishedAt — preserve existing if already set and still publishing
    let publishedAt = current.publishedAt;
    if (status === 'PUBLISHED' && !publishedAt) {
      publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : new Date();
    } else if (status !== 'PUBLISHED') {
      publishedAt = null;
    }

    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        slug:          formData.get('slug') || current.slug,
        featuredImage: formData.get('featuredImage') || current.featuredImage,
        isFeatured:    formData.has('isFeatured')
          ? formData.get('isFeatured') === 'on'
          : current.isFeatured,
        status,
        publishedAt,
        authorId,
        categoryId
      }
    });

    // Upsert translations for both locales
    for (const locale of ['en', 'ar']) {
      const title           = formData.get(`title_${locale}`);
      const excerpt         = formData.get(`excerpt_${locale}`);
      const content         = formData.get(`content_${locale}`);
      const metaTitle       = formData.get(`metaTitle_${locale}`);
      const metaDescription = formData.get(`metaDescription_${locale}`);

      await prisma.blogPostTranslation.upsert({
        where: { postId_locale: { postId, locale } },
        create: { postId, locale, title, excerpt, content, metaTitle, metaDescription },
        update: { title, excerpt, content, metaTitle, metaDescription }
      });
    }

    // Replace tags
    if (formData.has('tagSlugs') || tagSlugs.length === 0) {
      const tagIds = await resolveTagIds(tagSlugs, [], []);
      await prisma.blogPostTag.deleteMany({ where: { postId } });
      if (tagIds.length > 0) {
        await prisma.blogPostTag.createMany({
          data: tagIds.map(tagId => ({ postId, tagId }))
        });
      }
    }

    revalidatePath('/admin/blog');
    revalidatePath(`/admin/blog/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Update blog post error:', error);
    return { error: error.message };
  }
}


export async function deleteBlogPost(id) {
  try {

    await prisma.blogPost.delete({ where: { id: parseInt(id) } });
    revalidatePath('/admin/blog');
    return { success: true };
  } catch (error) {
    console.error('Delete blog post error:', error);
    return { error: error.message };
  }
}


// ============================================================================
// BLOG CATEGORIES
// ============================================================================

export async function upsertBlogCategory(formData) {
  try {
    const categoryId = formData.get('categoryId');
    const isUpdate = categoryId && categoryId !== 'undefined';

    const data = {
      slug:  formData.get('slug'),
      color: formData.get('color') || null,
      icon:  formData.get('icon') || null,
    };

    let category;
    if (isUpdate) {
      category = await prisma.blogCategory.update({
        where: { id: parseInt(categoryId) },
        data
      });
    } else {
      category = await prisma.blogCategory.create({ data });
    }

    for (const locale of ['en', 'ar']) {
      await prisma.blogCategoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale } },
        create: {
          categoryId: category.id,
          locale,
          name:        formData.get(`name_${locale}`),
          description: formData.get(`description_${locale}`) || null,
        },
        update: {
          name:        formData.get(`name_${locale}`),
          description: formData.get(`description_${locale}`) || null,
        }
      });
    }

    revalidatePath('/admin/blog/categories');
    return { success: true, id: category.id };
  } catch (error) {
    console.error('Upsert blog category error:', error);
    return { error: error.message };
  }
}


export async function deleteBlogCategory(id) {
  try {
    const count = await prisma.blogPost.count({ where: { categoryId: parseInt(id) } });
    if (count > 0) {
      return { error: `Cannot delete — ${count} post(s) use this category. Reassign them first.` };
    }
    await prisma.blogCategory.delete({ where: { id: parseInt(id) } });
    revalidatePath('/admin/blog/categories');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}


// ============================================================================
// BLOG AUTHORS
// ============================================================================

export async function upsertBlogAuthor(formData) {
  try {
    const authorId = formData.get('authorId');
    const isUpdate = authorId && authorId !== 'undefined';

    const data = {
      name:          formData.get('name'),
      nameAr:        formData.get('nameAr') || null,
      avatar:        formData.get('avatar') || null,
      bio:           formData.get('bio') || null,
      bioAr:         formData.get('bioAr') || null,
      twitterHandle: formData.get('twitterHandle') || null,
    };

    let author;
    if (isUpdate) {
      author = await prisma.blogAuthor.update({ where: { id: parseInt(authorId) }, data });
    } else {
      author = await prisma.blogAuthor.create({ data });
    }

    revalidatePath('/admin/blog/authors');
    return { success: true, id: author.id };
  } catch (error) {
    console.error('Upsert blog author error:', error);
    return { error: error.message };
  }
}


export async function deleteBlogAuthor(id) {
  try {
    const count = await prisma.blogPost.count({ where: { authorId: parseInt(id) } });
    if (count > 0) {
      return { error: `Cannot delete — ${count} post(s) are attributed to this author.` };
    }
    await prisma.blogAuthor.delete({ where: { id: parseInt(id) } });
    revalidatePath('/admin/blog/authors');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}


// ============================================================================
// BLOG TAGS
// ============================================================================

export async function upsertBlogTag(formData) {
  try {
    const tagId = formData.get('tagId');
    const isUpdate = tagId && tagId !== 'undefined';

    let tag;
    const slug = formData.get('slug');
    if (isUpdate) {
      tag = await prisma.blogTag.update({ where: { id: parseInt(tagId) }, data: { slug } });
    } else {
      tag = await prisma.blogTag.create({ data: { slug } });
    }

    for (const locale of ['en', 'ar']) {
      await prisma.blogTagTranslation.upsert({
        where: { tagId_locale: { tagId: tag.id, locale } },
        create: { tagId: tag.id, locale, name: formData.get(`name_${locale}`) },
        update: { name: formData.get(`name_${locale}`) }
      });
    }

    revalidatePath('/admin/blog/categories'); // Tags live on the categories page
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


// ============================================================================
// INTERNAL HELPER
// ============================================================================

async function resolveTagIds(slugs = [], namesEn = [], namesAr = []) {
  if (!slugs.length) return [];

  const ids = [];
  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    if (!slug) continue;

    // Upsert tag by slug (creates if missing)
    const tag = await prisma.blogTag.upsert({
      where: { slug },
      create: {
        slug,
        translations: {
          create: [
            { locale: 'en', name: namesEn[i] || slug },
            { locale: 'ar', name: namesAr[i] || slug }
          ]
        }
      },
      update: {}
    });
    ids.push(tag.id);
  }
  return ids;
}
