import { prisma } from '@/lib/prisma';

/**
 * Track product view (uses existing ProductView model)
 */
export async function trackProductView(productId, sessionId) {
  try {
    // Create view log entry
    const view = await prisma.productView.create({
      data: {
        productId: parseInt(productId),
        sessionId: sessionId,
        viewedAt: new Date(),
        source: 'web'
      }
    });

    // Update analytics using existing ProductAnalytics model
    const analytics = await prisma.productAnalytics.upsert({
      where: { productId: parseInt(productId) },
      create: {
        productId: parseInt(productId),
        totalViews: 1,
        viewsLast24h: 1,
        viewsLast7d: 1,
        lastViewedAt: new Date(),
        watchingNow: 1,
        lastViewUpdate: new Date(),
        lastWatchUpdate: new Date()
      },
      update: {
        totalViews: { increment: 1 },
        viewsLast24h: { increment: 1 },
        viewsLast7d: { increment: 1 },
        lastViewedAt: new Date(),
        watchingNow: { increment: 1 },
        lastViewUpdate: new Date()
      }
    });

    // Also update ProductStats for trending score
    await prisma.productStats.upsert({
      where: { productId: parseInt(productId) },
      create: {
        productId: parseInt(productId),
        views24h: 1,
        views7d: 1,
        views30d: 1,
        trendingScore: 1.0
      },
      update: {
        views24h: { increment: 1 },
        views7d: { increment: 1 },
        views30d: { increment: 1 }
      }
    });

    // Calculate and update trending score
    await calculateTrendingScore(parseInt(productId));

    return { success: true, analytics };
  } catch (error) {
    console.error('Error tracking product view:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate trending score based on recent activity
 */
async function calculateTrendingScore(productId) {
  try {
    const stats = await prisma.productStats.findUnique({
      where: { productId }
    });

    if (!stats) return;

    // Trending score: (views24h * 10 + clicks24h * 20 + wishlists24h * 30) / 100
    const trendingScore = (
      (stats.views24h * 10) +
      (stats.clicks24h * 20) +
      (stats.wishlists24h * 30)
    ) / 100;

    await prisma.productStats.update({
      where: { productId },
      data: { trendingScore }
    });
  } catch (error) {
    console.error('Error calculating trending score:', error);
  }
}

/**
 * Update watching now count (count recent views)
 */
export async function updateWatchingNow(productId) {
  try {
    // Count views in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentViews = await prisma.productView.count({
      where: {
        productId: parseInt(productId),
        viewedAt: { gte: fiveMinutesAgo }
      }
    });

    await prisma.productAnalytics.update({
      where: { productId: parseInt(productId) },
      data: { 
        watchingNow: recentViews,
        lastWatchUpdate: new Date()
      }
    });

    return recentViews;
  } catch (error) {
    console.error('Error updating watching now:', error);
    return 0;
  }
}

/**
 * Get popular products using existing schema
 */
export async function getPopularProducts({
  mode = 'global',
  categoryId = null,
  categorySlug = null,
  timeRange = 'week',
  limit = 12
}) {
  try {
    // Determine which field to use for sorting
    let orderByField;
    if (mode === 'trending') {
      orderByField = { stats: { trendingScore: 'desc' } };
    } else {
      const fieldMap = {
        'today': 'viewsLast24h',
        'week': 'viewsLast7d',
        'month': 'totalViews', // Use total for month
        'all': 'totalViews'
      };
      const field = fieldMap[timeRange] || 'viewsLast7d';
      orderByField = { analytics: { [field]: 'desc' } };
    }

    const where = {
      analytics: {
        isNot: null // Only products with analytics
      }
    };
    
    // Add category filter if in category mode
    if (mode === 'category') {
      if (categoryId) {
        where.categoryId = parseInt(categoryId);
      } else if (categorySlug) {
        where.category = { slug: categorySlug };
      }
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: orderByField,
      take: parseInt(limit),
      include: {
        images: {
          take: 1,
          orderBy: { id: 'asc' }
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        stores: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                logoUrl: true
              }
            }
          },
          orderBy: {
            price: 'asc'
          }
        },
        analytics: {
          select: {
            totalViews: true,
            viewsLast24h: true,
            viewsLast7d: true,
            totalClicks: true,
            totalWishlists: true,
            watchingNow: true
          }
        },
        stats: {
          select: {
            trendingScore: true,
            views24h: true,
            views7d: true,
            views30d: true
          }
        }
      }
    });

    // Calculate total views based on timeRange
    const fieldMap = {
      'today': 'viewsLast24h',
      'week': 'viewsLast7d',
      'month': 'totalViews',
      'all': 'totalViews'
    };
    const field = fieldMap[timeRange] || 'viewsLast7d';
    
    const totalViews = products.reduce((sum, p) => 
      sum + (p.analytics?.[field] || 0), 0
    );

    return {
      products,
      totalViews,
      categoryName: products[0]?.category?.name || null
    };
  } catch (error) {
    console.error('Error fetching popular products:', error);
    throw error;
  }
}

/**
 * Periodic cleanup - reset counters (run via cron)
 */
export async function resetDailyCounters() {
  try {
    // Reset 24h counters in ProductStats
    await prisma.productStats.updateMany({
      data: { 
        views24h: 0,
        clicks24h: 0,
        wishlists24h: 0,
        alerts24h: 0
      }
    });

    // Reset viewsLast24h in ProductAnalytics
    await prisma.productAnalytics.updateMany({
      data: { 
        viewsLast24h: 0,
        viewsLastHour: 0,
        watchingNow: 0
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error resetting daily counters:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cleanup old view logs (run via cron)
 */
export async function cleanupOldViewLogs(daysToKeep = 90) {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const deleted = await prisma.productView.deleteMany({
      where: {
        viewedAt: { lt: cutoffDate }
      }
    });

    return { success: true, deleted: deleted.count };
  } catch (error) {
    console.error('Error cleaning up old view logs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update weekly and monthly counters (run via cron)
 */
export async function updatePeriodCounters() {
  try {
    // Update 7-day counters
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const products = await prisma.product.findMany({
      select: { id: true }
    });

    for (const product of products) {
      // Count views in last 7 days
      const views7d = await prisma.productView.count({
        where: {
          productId: product.id,
          viewedAt: { gte: sevenDaysAgo }
        }
      });

      // Count clicks in last 7 days
      const clicks7d = await prisma.productClick.count({
        where: {
          productId: product.id,
          clickedAt: { gte: sevenDaysAgo }
        }
      });

      // Update stats
      await prisma.productStats.updateMany({
        where: { productId: product.id },
        data: { views7d, clicks7d }
      });

      await prisma.productAnalytics.updateMany({
        where: { productId: product.id },
        data: { viewsLast7d: views7d }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating period counters:', error);
    return { success: false, error: error.message };
  }
}