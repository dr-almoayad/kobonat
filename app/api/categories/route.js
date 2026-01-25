// app/api/categories/route.js - FIXED: Always include image field regardless of locale
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';
    const countryCode = searchParams.get('country') || 'SA';
    
    console.log('📍 Categories API Request:', { locale, countryCode });
    
    // Fetch categories from database
    const categories = await prisma.category.findMany({
      where: {
        stores: {
          some: {
            store: {
              isActive: true,
              countries: {
                some: {
                  country: {
                    code: countryCode,
                    isActive: true
                  }
                }
              }
            }
          }
        }
      },
      // ✅ SELECT THE IMAGE FIELD FROM DATABASE
      select: {
        id: true,
        icon: true,
        image: true,  // ✅ CRITICAL: Must be in select
        color: true,
        translations: {
          where: { locale },
          select: {
            name: true,
            slug: true,
            description: true
          }
        },
        stores: {
          where: {
            store: {
              isActive: true,
              countries: {
                some: {
                  country: { code: countryCode }
                }
              }
            }
          },
          select: {
            storeId: true  // Just need count
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    // Debug: Check what database returned
    console.log('📦 Categories from DB:', categories.map(c => ({
      id: c.id,
      hasImage: 'image' in c,
      imageValue: c.image,
      translationsCount: c.translations.length
    })));

    // Format response with translation data
    const formattedCategories = categories
      .filter(category => category.translations.length > 0) 
      .map(category => ({
        id: category.id,
        name: category.translations[0]?.name || '',
        slug: category.translations[0]?.slug || '',
        description: category.translations[0]?.description || null,
        icon: category.icon || 'category',
        image: category.image,  // ✅ This will be null or string - both are valid
        color: category.color || '#470ae2',
        _count: {
          stores: category.stores.length
        }
      }))
      .filter(cat => cat.name && cat.slug && cat._count.stores > 0);

    // Debug: Check formatted output
    console.log('📤 Formatted categories:', formattedCategories.map(c => ({
      id: c.id,
      name: c.name,
      hasImageField: 'image' in c,
      imageValue: c.image
    })));

    return NextResponse.json(formattedCategories);

  } catch (error) {
    console.error("❌ Categories API error:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch categories", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      name_en, 
      name_ar, 
      slug_en,
      slug_ar,
      description_en,
      description_ar,
      icon,
      image,
      color 
    } = body;

    if (!name_en || !name_ar || !slug_en || !slug_ar) {
      return NextResponse.json(
        { error: "Category name and slug in both languages are required" },
        { status: 400 }
      );
    }

    // Check if slugs already exist
    const existingSlugEN = await prisma.categoryTranslation.findFirst({
      where: { locale: 'en', slug: slug_en }
    });

    const existingSlugAR = await prisma.categoryTranslation.findFirst({
      where: { locale: 'ar', slug: slug_ar }
    });

    if (existingSlugEN || existingSlugAR) {
      return NextResponse.json(
        { error: "A category with this slug already exists." },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        icon: icon || null,
        image: image || null,
        color: color || null,
        translations: {
          create: [
            {
              locale: 'en',
              name: name_en,
              slug: slug_en,
              description: description_en || null
            },
            {
              locale: 'ar',
              name: name_ar,
              slug: slug_ar,
              description: description_ar || null
            }
          ]
        }
      },
      include: {
        translations: true
      }
    });

    return NextResponse.json({ 
      message: "Category created successfully", 
      category 
    }, { status: 201 });

  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Failed to create category", details: error.message },
      { status: 500 }
    );
  }
}
