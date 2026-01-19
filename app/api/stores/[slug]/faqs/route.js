// app/api/stores/[slug]/faqs/route.js - Updated for new schema
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

export async function GET(req, { params }) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'ar';
    const countryCode = searchParams.get('country') || 'SA';

    // Find store in specified country
    const store = await prisma.store.findFirst({
      where: { 
        translations: {
          some: {
            slug,
            locale
          }
        },
        isActive: true,
        countries: {
          some: {
            country: {
              code: countryCode
            }
          }
        }
      },
      select: { 
        id: true,
        translations: {
          where: { locale },
          select: { name: true, slug: true }
        }
      }
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found in this country" },
        { status: 404 }
      );
    }

    // Get country
    const country = await prisma.country.findUnique({
      where: { code: countryCode },
      include: {
        translations: {
          where: { locale }
        }
      }
    });

    if (!country) {
      return NextResponse.json(
        { error: "Country not found" },
        { status: 404 }
      );
    }

    // Get FAQs for THIS store in THIS country only
    const faqs = await prisma.storeFAQ.findMany({
      where: {
        storeId: store.id,
        countryId: country.id,
        isActive: true
      },
      include: {
        translations: {
          where: { locale }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Transform FAQs
    const transformedFAQs = faqs.map(faq => ({
      id: faq.id,
      question: faq.translations[0]?.question || '',
      answer: faq.translations[0]?.answer || '',
      order: faq.order,
      country: {
        code: country.code,
        name: country.translations[0]?.name || country.code
      }
    }));

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.translations[0]?.name || '',
        slug: store.translations[0]?.slug || ''
      },
      country: {
        ...country,
        name: country.translations[0]?.name || country.code
      },
      faqs: transformedFAQs,
      total: faqs.length
    });

  } catch (error) {
    console.error("Store FAQs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}

export async function getStoreFAQs(storeSlug, countryCode, locale = 'ar') {
  const store = await prisma.store.findFirst({
    where: { 
      translations: {
        some: {
          slug: storeSlug,
          locale
        }
      },
      countries: {
        some: {
          country: { code: countryCode }
        }
      }
    },
    select: { id: true }
  });

  if (!store) return [];

  const country = await prisma.country.findUnique({
    where: { code: countryCode }
  });

  if (!country) return [];

  const faqs = await prisma.storeFAQ.findMany({
    where: {
      storeId: store.id,
      countryId: country.id,
      isActive: true
    },
    include: {
      translations: {
        where: { locale }
      }
    },
    orderBy: { order: 'asc' }
  });

  return faqs.map(faq => ({
    id: faq.id,
    question: faq.translations[0]?.question || '',
    answer: faq.translations[0]?.answer || '',
    order: faq.order
  }));
}