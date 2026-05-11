// app/api/translate-slug/route.js
// Translates store or category slugs between locales.
// Called by Header.jsx when the user switches language on a store or category page.
//
// NOTE: The previous file lived at /api/slug-translate (wrong path).
// Header.jsx calls /api/translate-slug, so this is the correct location.
//
// Query params:
//   type      — "store" | "category"
//   slug      — URL-encoded slug in the source locale
//   from      — source language code, e.g. "ar"
//   to        — target language code, e.g. "en"

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type       = searchParams.get('type');   // 'store' | 'category'
    const slug       = searchParams.get('slug');
    const fromLocale = searchParams.get('from');
    const toLocale   = searchParams.get('to');

    if (!type || !slug || !fromLocale || !toLocale) {
      return NextResponse.json(
        { error: 'Missing required parameters: type, slug, from, to' },
        { status: 400 }
      );
    }

    const decodedSlug = decodeURIComponent(slug);

    // ── Store ────────────────────────────────────────────────────────────────
    if (type === 'store') {
      const sourceTranslation = await prisma.storeTranslation.findFirst({
        where: { slug: decodedSlug, locale: fromLocale },
        include: {
          store: {
            include: {
              translations: { where: { locale: toLocale } },
            },
          },
        },
      });

      if (!sourceTranslation) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }

      const targetTranslation = sourceTranslation.store.translations[0];

      if (!targetTranslation) {
        return NextResponse.json(
          { error: `No translation found for locale: ${toLocale}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        slug:    targetTranslation.slug,
        name:    targetTranslation.name,
        id:      sourceTranslation.store.id,
      });
    }

    // ── Category ─────────────────────────────────────────────────────────────
    if (type === 'category') {
      const sourceTranslation = await prisma.categoryTranslation.findFirst({
        where: { slug: decodedSlug, locale: fromLocale },
        include: {
          category: {
            include: {
              translations: { where: { locale: toLocale } },
            },
          },
        },
      });

      if (!sourceTranslation) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      const targetTranslation = sourceTranslation.category.translations[0];

      if (!targetTranslation) {
        return NextResponse.json(
          { error: `No translation found for locale: ${toLocale}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        slug:    targetTranslation.slug,
        name:    targetTranslation.name,
        id:      sourceTranslation.category.id,
      });
    }

    return NextResponse.json({ error: 'Invalid type. Must be "store" or "category"' }, { status: 400 });

  } catch (error) {
    console.error('[/api/translate-slug] error:', error);
    return NextResponse.json(
      { error: 'Failed to translate slug' },
      { status: 500 }
    );
  }
}
