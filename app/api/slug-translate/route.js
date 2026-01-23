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
    
    console.log('🔄 Translation request:', { type, slug, fromLocale, toLocale });
    
    // Validate parameters
    if (!type || !slug || !fromLocale || !toLocale) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required parameters',
          received: { type, slug, fromLocale, toLocale }
        },
        { status: 400 }
      );
    }
    
    // If same locale, return same slug
    if (fromLocale === toLocale) {
      return NextResponse.json({
        success: true,
        slug: slug,
        message: 'Same locale, no translation needed'
      });
    }
    
    // Decode the slug (important for Arabic slugs)
    const decodedSlug = decodeURIComponent(slug);
    console.log('📝 Decoded slug:', decodedSlug);
    
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
        console.warn('⚠️ Store not found for slug:', decodedSlug);
        return NextResponse.json(
          { 
            success: false,
            error: 'Store not found',
            slug: decodedSlug,
            locale: fromLocale
          },
          { status: 404 }
        );
      }
      
      const newTranslation = storeTranslation.store.translations[0];
      
      if (!newTranslation) {
        console.warn('⚠️ Translation not found for locale:', toLocale);
        return NextResponse.json(
          { 
            success: false,
            error: 'Translation not found',
            storeId: storeTranslation.store.id,
            targetLocale: toLocale
          },
          { status: 404 }
        );
      }
      
      console.log('✅ Store translation found:', {
        fromSlug: decodedSlug,
        toSlug: newTranslation.slug,
        name: newTranslation.name
      });
      
      return NextResponse.json({
        success: true,
        type: 'store',
        slug: newTranslation.slug,
        name: newTranslation.name,
        id: storeTranslation.store.id,
        fromLocale,
        toLocale
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
        console.warn('⚠️ Category not found for slug:', decodedSlug);
        return NextResponse.json(
          { 
            success: false,
            error: 'Category not found',
            slug: decodedSlug,
            locale: fromLocale
          },
          { status: 404 }
        );
      }
      
      const newTranslation = categoryTranslation.category.translations[0];
      
      if (!newTranslation) {
        console.warn('⚠️ Translation not found for locale:', toLocale);
        return NextResponse.json(
          { 
            success: false,
            error: 'Translation not found',
            categoryId: categoryTranslation.category.id,
            targetLocale: toLocale
          },
          { status: 404 }
        );
      }
      
      console.log('✅ Category translation found:', {
        fromSlug: decodedSlug,
        toSlug: newTranslation.slug,
        name: newTranslation.name
      });
      
      return NextResponse.json({
        success: true,
        type: 'category',
        slug: newTranslation.slug,
        name: newTranslation.name,
        id: categoryTranslation.category.id,
        fromLocale,
        toLocale
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Invalid type. Must be "store" or "category"',
        received: type
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('❌ Translate slug error:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to translate slug',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: Add caching for better performance
export const revalidate = 3600; // Cache for 1 hour (slugs rarely change)
