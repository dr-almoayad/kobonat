// scripts/seedPriceHistory.mjs
// Run with: node scripts/seedPriceHistory.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPriceHistory() {
  try {
    console.log('🌱 Starting to seed price history...');

    // Get first 10 products with stores
    const products = await prisma.product.findMany({
      take: 10,
      include: {
        stores: {
          take: 1,
          orderBy: { price: 'asc' }
        }
      }
    });

    console.log(`📦 Found ${products.length} products to seed`);

    for (const product of products) {
      if (product.stores.length === 0) {
        console.log(`⚠️ Skipping product ${product.id} - no stores`);
        continue;
      }

      const store = product.stores[0];
      const currentPrice = parseFloat(store.price);

      // Create price history entries - showing price going DOWN over time
      const pricePoints = [
        {
          days: 30,
          price: currentPrice * 1.25, // 25% higher 30 days ago
        },
        {
          days: 20,
          price: currentPrice * 1.15, // 15% higher 20 days ago
        },
        {
          days: 10,
          price: currentPrice * 1.10, // 10% higher 10 days ago
        },
        {
          days: 5,
          price: currentPrice * 1.05, // 5% higher 5 days ago
        },
        {
          days: 0,
          price: currentPrice, // Current price today
        }
      ];

      for (const point of pricePoints) {
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - point.days);

        await prisma.priceHistory.create({
          data: {
            productId: product.id,
            storeId: store.storeId,
            price: point.price,
            currency: store.currency || 'SAR',
            timestamp: timestamp
          }
        });

        console.log(`  ✅ Added price ${point.price.toFixed(2)} for product ${product.id} (${point.days} days ago)`);
      }

      // Create ProductAnalytics if doesn't exist
      const existingAnalytics = await prisma.productAnalytics.findUnique({
        where: { productId: product.id }
      });

      if (!existingAnalytics) {
        await prisma.productAnalytics.create({
          data: {
            productId: product.id,
            viewsLast24h: Math.floor(Math.random() * 200) + 50,
            watchingNow: Math.floor(Math.random() * 30) + 5,
            totalViews: Math.floor(Math.random() * 5000) + 1000,
            viewsLast7d: Math.floor(Math.random() * 1000) + 200,
            totalClicks: Math.floor(Math.random() * 500) + 50,
            totalWishlists: Math.floor(Math.random() * 100) + 10,
            lastViewedAt: new Date(),
            lastViewUpdate: new Date(),
            lastWatchUpdate: new Date()
          }
        });
        console.log(`  📊 Created analytics for product ${product.id}`);
      }
    }

    console.log('\n✨ Successfully seeded price history!');
    console.log('\n🎯 Now you should see:');
    console.log('   - Price direction indicators (↓)');
    console.log('   - Price drop badges');
    console.log('   - Historical low badges');
    console.log('   - Popular choice badges');

  } catch (error) {
    console.error('❌ Error seeding price history:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPriceHistory()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });