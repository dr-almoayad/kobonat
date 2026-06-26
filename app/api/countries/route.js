// app/api/countries/route.js
import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

const SUPPORTED_LOCALES = ['ar-SA', 'en-SA'];
const DEFAULT_LOCALE = 'ar-SA';

const getCachedCountries = unstable_cache(
  async (locale) => {
    const countries = await prisma.country.findMany({
      where: { isActive: true },
      include: {
        translations: { where: { locale } },
        // _count removed for performance – add back if needed
      },
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });

    return countries.map((country) => {
      const translation = country.translations[0];
      return {
        id: country.id,
        code: country.code,
        name: translation?.name || country.code,
        currency: country.currency,
        flag: country.flag,
        isDefault: country.isDefault,
        isActive: country.isActive,
      };
    });
  },
  ['countries'],
  { revalidate: 86400 } // 24 hours
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || DEFAULT_LOCALE;

    // Validate locale
    if (!SUPPORTED_LOCALES.includes(locale)) {
      return NextResponse.json(
        { error: 'Unsupported locale', countries: [], total: 0 },
        { status: 400 }
      );
    }

    const transformedCountries = await getCachedCountries(locale);

    return NextResponse.json({
      countries: transformedCountries,
      total: transformedCountries.length,
      defaultCountry: transformedCountries.find(c => c.isDefault) || transformedCountries[0],
    });
  } catch (error) {
    console.error('❌ Countries API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch countries',
        details: error.message,
        countries: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
