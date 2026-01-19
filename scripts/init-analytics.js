const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeAnalytics() {
  console.log('🚀 Initializing analytics for existing products...');
  
  const products = await prisma.product.findMany({
    select: { id: true, views: true }
  });

  console.log(`Found ${products.length} products`);

  for (const product of products) {
    try {
      // Create ProductAnalytics if doesn't exist
      await prisma.productAnalytics.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          totalViews: product.views || 0,
          viewsLast24h: 0,
          viewsLast7d: 0,
          totalClicks: 0,
          totalWishlists: 0,
          watchingNow: 0,
          lastViewUpdate: new Date(),
          lastWatchUpdate: new Date()
        },
        update: {}
      });

      // Create ProductStats if doesn't exist
      await prisma.productStats.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          views24h: 0,
          views7d: 0,
          views30d: 0,
          clicks24h: 0,
          clicks7d: 0,
          clicks30d: 0,
          wishlists24h: 0,
          wishlists7d: 0,
          wishlists30d: 0,
          alerts24h: 0,
          alerts7d: 0,
          alerts30d: 0,
          trendingScore: 0
        },
        update: {}
      });

      console.log(`✅ Initialized analytics for product ${product.id}`);
    } catch (error) {
      console.error(`❌ Error for product ${product.id}:`, error.message);
    }
  }

  console.log('✨ Analytics initialization complete!');
  await prisma.$disconnect();
}

initializeAnalytics().catch(console.error);