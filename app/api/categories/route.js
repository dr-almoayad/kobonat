// app/api/categories/route.js - UPDATED TO SUPPORT COUNTRY FILTERING
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

    // Fetch categories with translations and store count for specific country
    const categories = await prisma.category.findMany({
      where: {
        // Only categories that have active stores in the specified country
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
      include: {
        translations: {
          where: { locale }
        },
        stores: {
          where: {
            store: {
              isActive: true,
              countries: {
                some: {
                  country: {
                    code: countryCode
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    console.log('=== CATEGORIES API DEBUG ===');
    console.log('Total categories in DB for country:', categories.length);
    if (categories.length > 0) {
      console.log('First category sample:', {
        id: categories[0].id,
        name: categories[0].translations[0]?.name,
        storeCount: categories[0].stores.length,
        icon: categories[0].icon,
        color: categories[0].color
      });
    }
    console.log('=== END DEBUG ===');

    // Format response with translation data
    const formattedCategories = categories
      .filter(category => category.translations.length > 0) // Only with translations
      .map(category => ({
        id: category.id,
        name: category.translations[0]?.name || '',
        slug: category.translations[0]?.slug || '',
        description: category.translations[0]?.description || null,
        icon: category.icon || 'category',
        color: category.color || '#470ae2',
        _count: {
          stores: category.stores.length
        }
      }))
      .filter(cat => cat.name && cat.slug && cat._count.stores > 0); // Filter valid entries

    console.log(`✅ Returning ${formattedCategories.length} valid categories for ${countryCode}`);

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