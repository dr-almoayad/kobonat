// app/api/countries/route.js - FIXED for Header compatibility
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';
    
    console.log('🌍 Countries API - Locale:', locale);
    
    const countries = await prisma.country.findMany({
      where: { isActive: true },
      include: {
        translations: {
          where: { locale }
        },
        _count: {
          select: {
            stores: {
              where: {
                store: {
                  isActive: true
                }
              }
            },
            vouchers: {
              where: {
                voucher: {
                  expiryDate: { gte: new Date() }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { code: 'asc' }
      ]
    });
    
    console.log('📊 Raw countries from DB:', countries.length);
    
    // Transform countries to include translation data
    const transformedCountries = countries.map(country => {
      const translation = country.translations[0];
      
      return {
        id: country.id,
        code: country.code,
        name: translation?.name || country.code,
        currency: country.currency,
        flag: country.flag,
        isDefault: country.isDefault,
        isActive: country.isActive,
        _count: country._count || { stores: 0, vouchers: 0 }
      };
    });
    
    console.log('✅ Transformed countries:', transformedCountries);
    
    return NextResponse.json({
      countries: transformedCountries,
      total: transformedCountries.length,
      defaultCountry: transformedCountries.find(c => c.isDefault) || transformedCountries[0]
    });
    
  } catch (error) {
    console.error("❌ Countries API error:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch countries",
        details: error.message,
        countries: [] // Return empty array on error
      },
      { status: 500 }
    );
  }
}