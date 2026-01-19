// app/api/search/route.js - FIXED WITH PROPER LOCAL SEARCH ENGINE INTEGRATION
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import localSearchEngine from '@/lib/search/localSearchEngine';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

// Cache with country-specific data
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function loadSearchData(countryCode, locale) {
  try {
    const now = Date.now();
    const [language] = locale.split('-');
    const cacheKey = `${countryCode}-${language}`;
    
    // Check cache
    const cached = searchCache.get(cacheKey);
    if (cached && (now - cached.lastUpdated) < CACHE_DURATION) {
      return cached;
    }
    
    console.log(`🔄 Refreshing search cache for ${countryCode}-${language}...`);
    
    // Fetch stores with translations
    const stores = await prisma.store.findMany({
      where: { 
        isActive: true,
        countries: {
          some: {
            country: {
              code: countryCode,
              isActive: true
            }
          }
        }
      },
      include: {
        translations: {
          where: { locale: language },
          select: {
            name: true,
            slug: true,
            description: true,
          }
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                icon: true,
                color: true,
                translations: {
                  where: { locale: language },
                  select: {
                    name: true,
                    slug: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            vouchers: {
              where: {
                expiryDate: { gte: new Date() },
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
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { id: 'asc' }
      ]
    });
    
    // Fetch vouchers with translations
    const vouchers = await prisma.voucher.findMany({
      where: {
        expiryDate: { gte: new Date() },
        countries: {
          some: {
            country: {
              code: countryCode
            }
          }
        }
      },
      include: {
        translations: {
          where: { locale: language },
          select: {
            title: true,
            description: true,
          }
        },
        store: {
          include: {
            translations: {
              where: { locale: language },
              select: { 
                name: true, 
                slug: true 
              }
            }
          }
        },
        _count: {
          select: { clicks: true }
        }
      },
      orderBy: [
        { isExclusive: 'desc' },
        { popularityScore: 'desc' }
      ]
    });
    
    // Transform stores to match search engine format
    const transformedStores = stores.map(store => {
      const storeTranslation = store.translations?.[0] || {};
      
      // Get unique categories
      const categories = [];
      const seenCategoryIds = new Set();
      
      if (store.categories) {
        store.categories.forEach(sc => {
          if (sc.category && !seenCategoryIds.has(sc.category.id)) {
            seenCategoryIds.add(sc.category.id);
            const catTranslation = sc.category.translations?.[0] || {};
            categories.push({
              id: sc.category.id,
              name: catTranslation.name || '',
              slug: catTranslation.slug || '',
              icon: sc.category.icon || '',
              color: sc.category.color || ''
            });
          }
        });
      }
      
      return {
        id: store.id,
        name: storeTranslation.name || '',
        slug: storeTranslation.slug || '',
        description: storeTranslation.description || '',
        logo: store.logo,
        color: store.color,
        websiteUrl: store.websiteUrl,
        isActive: store.isActive,
        isFeatured: store.isFeatured,
        categories,
        _count: store._count || { vouchers: 0 },
        activeVouchersCount: store._count?.vouchers || 0
      };
    });
    
    // Transform vouchers to match search engine format
    const transformedVouchers = vouchers.map(voucher => {
      const voucherTranslation = voucher.translations?.[0] || {};
      const storeTranslation = voucher.store?.translations?.[0] || {};
      
      return {
        id: voucher.id,
        title: voucherTranslation.title || '',
        description: voucherTranslation.description || '',
        code: voucher.code,
        type: voucher.type,
        discount: voucher.discount,
        landingUrl: voucher.landingUrl,
        startDate: voucher.startDate,
        expiryDate: voucher.expiryDate,
        isExclusive: voucher.isExclusive,
        isVerified: voucher.isVerified,
        popularityScore: voucher.popularityScore,
        storeId: voucher.store?.id,
        store: voucher.store ? {
          id: voucher.store.id,
          name: storeTranslation.name || '',
          slug: storeTranslation.slug || '',
          logo: voucher.store.logo,
          color: voucher.store.color
        } : null,
        _count: voucher._count || { clicks: 0 }
      };
    });
    
    const cacheData = {
      stores: transformedStores,
      vouchers: transformedVouchers,
      lastUpdated: now,
      countryCode,
      language,
      locale
    };
    
    searchCache.set(cacheKey, cacheData);
    
    console.log(`✅ Cache updated: ${stores.length} stores, ${vouchers.length} vouchers`);
    console.log('Sample store:', {
      name: transformedStores[0]?.name,
      categories: transformedStores[0]?.categories?.map(c => c.name)
    });
    console.log('Sample voucher:', {
      title: transformedVouchers[0]?.title,
      store: transformedVouchers[0]?.store?.name
    });
    
    return cacheData;
  } catch (error) {
    console.error(`❌ Error loading search data:`, error);
    console.error(error.stack);
    return {
      stores: [],
      vouchers: [],
      lastUpdated: Date.now(),
      countryCode,
      language: locale.split('-')[0],
      locale
    };
  }
}

// Helper function to extract country code from locale
function extractCountryCodeFromLocale(locale) {
  if (!locale) return 'SA';
  
  const parts = locale.split('-');
  if (parts.length > 1) {
    return parts[1].toUpperCase();
  }
  
  const language = parts[0];
  if (language === 'ar') return 'SA';
  return 'SA';
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = decodeURIComponent(searchParams.get('q') || '');
    const type = searchParams.get('type') || 'all';
    const locale = searchParams.get('locale') || 'en';
    const limit = parseInt(searchParams.get('limit') || '20');
    const countryParam = searchParams.get('country');
    
    const countryCode = countryParam || extractCountryCodeFromLocale(locale);
    const [language] = locale.split('-');
    
    console.log('🔍 Search request:', { 
      query, 
      type, 
      locale, 
      language,
      countryCode,
      limit 
    });
    
    // Return empty if no query
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        query: '',
        type,
        locale,
        countryCode,
        stores: [],
        vouchers: [],
        total: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    // Load search data
    const data = await loadSearchData(countryCode, locale);
    
    console.log('📊 Available data:', {
      storesCount: data.stores.length,
      vouchersCount: data.vouchers.length,
      sampleData: {
        storeNames: data.stores.slice(0, 3).map(s => s.name),
        voucherTitles: data.vouchers.slice(0, 3).map(v => v.title)
      }
    });
    
    let storeResults = [];
    let voucherResults = [];
    
    // Use the local search engine
    if (type === 'all' || type === 'stores') {
      console.log('🔎 Searching stores...');
      const searchResult = localSearchEngine.searchStores(
        query, 
        data.stores, 
        { 
          locale: language,
          limit: type === 'stores' ? limit : Math.min(limit, 10)
        }
      );
      storeResults = searchResult.results;
      console.log(`🏪 Found ${storeResults.length} stores`);
      
      if (storeResults.length > 0) {
        console.log('Top store matches:', storeResults.slice(0, 3).map(s => ({
          name: s.name,
          score: s._score,
          categories: s.categories?.map(c => c.name)
        })));
      }
    }
    
    if (type === 'all' || type === 'vouchers') {
      console.log('🔎 Searching vouchers...');
      const searchResult = localSearchEngine.searchVouchers(
        query, 
        data.vouchers, 
        { 
          locale: language,
          limit: type === 'vouchers' ? limit : Math.min(limit, 10)
        }
      );
      voucherResults = searchResult.results;
      console.log(`🎟️ Found ${voucherResults.length} vouchers`);
      
      if (voucherResults.length > 0) {
        console.log('Top voucher matches:', voucherResults.slice(0, 3).map(v => ({
          title: v.title,
          score: v._score,
          store: v.store?.name
        })));
      }
    }
    
    // Prepare response
    const response = {
      query,
      type,
      locale,
      countryCode,
      stores: storeResults,
      vouchers: voucherResults,
      total: storeResults.length + voucherResults.length,
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV === 'development' ? {
        query,
        totalStores: storeResults.length,
        totalVouchers: voucherResults.length,
        storesSample: storeResults.slice(0, 2),
        vouchersSample: voucherResults.slice(0, 2)
      } : undefined
    };
    
    console.log('✅ Search response:', {
      query,
      storesReturned: storeResults.length,
      vouchersReturned: voucherResults.length,
      total: response.total
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Search API Error:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Search failed',
        message: error.message,
        query: searchParams.get('q') || '',
        stores: [],
        vouchers: [],
        total: 0
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country') || 'SA';
    const locale = searchParams.get('locale') || 'en';
    const [language] = locale.split('-');
    
    // Clear cache
    if (countryCode === 'all' && locale === 'all') {
      searchCache.clear();
      console.log('🗑️ Cleared all search caches');
    } else {
      const cacheKey = `${countryCode}-${language}`;
      searchCache.delete(cacheKey);
      console.log(`🗑️ Cleared search cache for ${cacheKey}`);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Cache cleared successfully' 
    });
    
  } catch (error) {
    console.error('❌ Cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}