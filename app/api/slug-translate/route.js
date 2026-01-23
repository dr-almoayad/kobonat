// app/api/translate-slug/route.js - Translate slugs between locales
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'store' or 'category'
    const slug = searchParams.get('slug');
    const fromLocale = searchParams.get('from');
    const toLocale = searchParams.get('to');
    
    if (!type || !slug || !fromLocale || !toLocale) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Decode the slug
    const decodedSlug = decodeURIComponent(slug);
    
    if (type === 'store') {
      // Find store by current locale slug
      const storeTranslation = await prisma.storeTranslation.findFirst({
        where: {
          slug: decodedSlug,
          locale: fromLocale
        },
        include: {
          store: {
            include: {
              translations: {
                where: { locale: toLocale }
              }
            }
          }
        }
      });
      
      if (!storeTranslation) {
        return NextResponse.json(
          { error: 'Store not found' },
          { status: 404 }
        );
      }
      
      const newTranslation = storeTranslation.store.translations[0];
      
      if (!newTranslation) {
        return NextResponse.json(
          { error: 'Translation not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        slug: newTranslation.slug,
        name: newTranslation.name,
        id: storeTranslation.store.id
      });
      
    } else if (type === 'category') {
      // Find category by current locale slug
      const categoryTranslation = await prisma.categoryTranslation.findFirst({
        where: {
          slug: decodedSlug,
          locale: fromLocale
        },
        include: {
          category: {
            include: {
              translations: {
                where: { locale: toLocale }
              }
            }
          }
        }
      });
      
      if (!categoryTranslation) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      
      const newTranslation = categoryTranslation.category.translations[0];
      
      if (!newTranslation) {
        return NextResponse.json(
          { error: 'Translation not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        slug: newTranslation.slug,
        name: newTranslation.name,
        id: categoryTranslation.category.id
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid type' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Translate slug error:', error);
    return NextResponse.json(
      { error: 'Failed to translate slug' },
      { status: 500 }
    );
  }
}
